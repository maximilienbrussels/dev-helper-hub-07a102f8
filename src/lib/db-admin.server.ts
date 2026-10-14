/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Server-only "PostgREST-achtige" client bovenop de directe Neon
 * SQL-verbinding (`db()` uit neon.server.ts).
 *
 * Waarom: de app is historisch geschreven tegen de Supabase-querybuilder
 * (`.from().select().eq()...`). Deze module vertaalt diezelfde oproepen één
 * keer naar SQL, zodat er géén Supabase-client meer nodig is. Gebruik dit
 * uitsluitend voor bevoorrechte (admin) operaties binnen server functions:
 * er is geen RLS — de laag praat rechtstreeks met Postgres.
 *
 * Voor gebruikersgebonden reads (RLS via Neon Auth) gebruik je de client uit
 * `neon-data.server.ts`.
 */
import { db } from "./neon.server";
import type { DataClient, QueryBuilder } from "./db-types";

type Result<T> = { data: T; error: { message: string } | null };

const IDENT = /^[a-z_][a-z0-9_]*$/i;

function ident(name: string): string {
  const clean = name.trim();
  if (!IDENT.test(clean)) throw new Error(`Ongeldige identifier: ${name}`);
  return `"${clean}"`;
}

/**
 * Relaties voor genest selecteren (`order_items(...)` binnen `orders`).
 * Expliciet gehouden: PostgREST leidt dit uit foreign keys af, wij houden
 * een kleine, leesbare kaart bij.
 */
const RELATIONS: Record<
  string,
  { table?: string; kind: "many" | "one"; fk: string; ref?: string }
> = {
  "orders.order_items": { kind: "many", fk: "order_id", ref: "id" },
  "order_items.products": { kind: "one", fk: "product_id", ref: "id" },
  "certificaten.academies": { kind: "one", fk: "academy_id", ref: "id" },
  "academy_publish_requests.academies": { kind: "one", fk: "academy_id", ref: "id" },
};

type SelectPart =
  { kind: "column"; name: string } | { kind: "embed"; name: string; select: string };

/** Splitst een select-string op komma's, met respect voor haakjes. */
function splitTop(input: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of input) {
    if (char === "(") depth++;
    if (char === ")") depth--;
    if (char === "," && depth === 0) {
      parts.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  if (current.trim()) parts.push(current);
  return parts.map((p) => p.trim()).filter(Boolean);
}

function parseSelect(select: string): SelectPart[] {
  return splitTop(select).map((part) => {
    const match = /^([a-z_][a-z0-9_]*)\s*\((.*)\)$/is.exec(part);
    if (match) return { kind: "embed", name: match[1]!, select: match[2]! };
    return { kind: "column", name: part };
  });
}

function buildSelectList(table: string, select: string, alias: string): string {
  if (select.trim() === "*" || select.trim() === "") return `${alias}.*`;
  return parseSelect(select)
    .map((part) =>
      part.kind === "column"
        ? `${alias}.${ident(part.name)}`
        : `${buildEmbedExpression(table, part, alias)} as ${ident(part.name)}`,
    )
    .join(", ");
}

function buildEmbedExpression(table: string, part: SelectPart, alias: string): string {
  if (part.kind === "column") return `${alias}.${ident(part.name)}`;
  const rel = RELATIONS[`${table}.${part.name}`];
  if (!rel) throw new Error(`Onbekende relatie "${part.name}" op tabel "${table}".`);
  const child = rel.table ?? part.name;
  const childAlias = `${alias}_${part.name}`;
  const join =
    rel.kind === "many"
      ? `${childAlias}.${ident(rel.fk)} = ${alias}.${ident(rel.ref ?? "id")}`
      : `${childAlias}.${ident(rel.ref ?? "id")} = ${alias}.${ident(rel.fk)}`;
  const jsonRow = `json_build_object(${parseSelect(part.select)
    .map((c) => `'${(c as any).name}', ${buildEmbedExpression(child, c, childAlias)}`)
    .join(", ")})`;
  return rel.kind === "many"
    ? `coalesce((select json_agg(${jsonRow}) from ${ident(child)} ${childAlias} where ${join}), '[]'::json)`
    : `(select ${jsonRow} from ${ident(child)} ${childAlias} where ${join})`;
}

type Filter = { column: string; op: string; value: unknown };

class Query<T = any> implements PromiseLike<Result<T>> {
  private mode: "select" | "insert" | "update" | "delete" | "upsert" = "select";
  private selectString = "*";
  private returnSelect: string | null = null;
  private filters: Filter[] = [];
  private orders: { column: string; ascending: boolean }[] = [];
  private limitCount: number | null = null;
  private payload: Record<string, unknown>[] = [];
  private updateValues: Record<string, unknown> = {};
  private conflictColumns: string[] = [];
  private rowMode: "many" | "single" | "maybe" = "many";

  constructor(private table: string) {}

  select(select = "*") {
    if (this.mode === "select") this.selectString = select;
    else this.returnSelect = select;
    return this;
  }

  insert(values: Record<string, unknown> | Record<string, unknown>[]) {
    this.mode = "insert";
    this.payload = Array.isArray(values) ? values : [values];
    return this;
  }

  upsert(
    values: Record<string, unknown> | Record<string, unknown>[],
    options?: { onConflict?: string },
  ) {
    this.mode = "upsert";
    this.payload = Array.isArray(values) ? values : [values];
    this.conflictColumns = (options?.onConflict ?? "id").split(",").map((c) => c.trim());
    return this;
  }

  update(values: Record<string, unknown>) {
    this.mode = "update";
    this.updateValues = values;
    return this;
  }

  delete() {
    this.mode = "delete";
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push({ column, op: "=", value });
    return this;
  }
  neq(column: string, value: unknown) {
    this.filters.push({ column, op: "<>", value });
    return this;
  }
  gt(column: string, value: unknown) {
    this.filters.push({ column, op: ">", value });
    return this;
  }
  gte(column: string, value: unknown) {
    this.filters.push({ column, op: ">=", value });
    return this;
  }
  lt(column: string, value: unknown) {
    this.filters.push({ column, op: "<", value });
    return this;
  }
  lte(column: string, value: unknown) {
    this.filters.push({ column, op: "<=", value });
    return this;
  }
  like(column: string, value: string) {
    this.filters.push({ column, op: "like", value });
    return this;
  }
  ilike(column: string, value: string) {
    this.filters.push({ column, op: "ilike", value });
    return this;
  }
  in(column: string, values: readonly unknown[]) {
    this.filters.push({ column, op: "in", value: values });
    return this;
  }
  is(column: string, value: null | boolean) {
    this.filters.push({ column, op: "is", value });
    return this;
  }
  match(criteria: Record<string, unknown>) {
    for (const [column, value] of Object.entries(criteria)) this.eq(column, value);
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orders.push({ column, ascending: options?.ascending !== false });
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.rowMode = "single";
    return this;
  }
  maybeSingle() {
    this.rowMode = "maybe";
    return this;
  }

  private build(): { text: string; params: unknown[] } {
    const params: unknown[] = [];
    const table = ident(this.table);

    if (this.mode === "select") {
      const list = buildSelectList(this.table, this.selectString, "t");
      let text = `select ${list} from ${table} t${this.whereQualified(params, "t")}`;
      if (this.orders.length) {
        text += ` order by ${this.orders
          .map((o) => `t.${ident(o.column)} ${o.ascending ? "asc" : "desc"} nulls last`)
          .join(", ")}`;
      }
      if (this.limitCount !== null) text += ` limit ${Number(this.limitCount)}`;
      return { text, params };
    }

    const returning = this.returnSelect
      ? buildSelectList(this.table, this.returnSelect, "t")
      : "t.*";

    if (this.mode === "insert" || this.mode === "upsert") {
      const columns = [...new Set(this.payload.flatMap((row) => Object.keys(row)))];
      const values = this.payload
        .map((row) => `(${columns.map((c) => push(params, row[c] ?? null)).join(", ")})`)
        .join(", ");
      let text = `insert into ${table} (${columns.map(ident).join(", ")}) values ${values}`;
      if (this.mode === "upsert") {
        const updatable = columns.filter((c) => !this.conflictColumns.includes(c));
        text += ` on conflict (${this.conflictColumns.map(ident).join(", ")}) do ${
          updatable.length
            ? `update set ${updatable.map((c) => `${ident(c)} = excluded.${ident(c)}`).join(", ")}`
            : "nothing"
        }`;
      }
      return { text: `with t as (${text} returning *) select ${returning} from t`, params };
    }

    if (this.mode === "update") {
      const sets = Object.entries(this.updateValues)
        .map(([c, v]) => `${ident(c)} = ${push(params, v ?? null)}`)
        .join(", ");
      const text = `update ${table} set ${sets}${this.whereQualified(params, null)} returning *`;
      return { text: `with t as (${text}) select ${returning} from t`, params };
    }

    const text = `delete from ${table}${this.whereQualified(params, null)} returning *`;
    return { text: `with t as (${text}) select ${returning} from t`, params };
  }

  /** WHERE-clausule, optioneel met tabel-alias voor de kolommen. */
  private whereQualified(params: unknown[], alias: string | null): string {
    if (!this.filters.length) return "";
    const prefix = alias ? `${alias}.` : "";
    const parts = this.filters.map((f) => {
      const col = `${prefix}${ident(f.column)}`;
      if (f.op === "is") return `${col} is ${f.value === null ? "null" : String(Boolean(f.value))}`;
      if (f.op === "in") {
        const list = f.value as unknown[];
        if (!list.length) return "false";
        return `${col} = any(${push(params, list)})`;
      }
      return `${col} ${f.op} ${push(params, f.value)}`;
    });
    return ` where ${parts.join(" and ")}`;
  }

  private async run(): Promise<Result<any>> {
    try {
      const { text, params } = this.build();
      const rows = (await (db() as any).query(text, params)) as any[];
      if (this.rowMode === "single") {
        if (!rows.length) return { data: null, error: { message: "Geen rij gevonden" } };
        return { data: rows[0], error: null };
      }
      if (this.rowMode === "maybe") return { data: rows[0] ?? null, error: null };
      return { data: rows ?? [], error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Databasefout";
      console.error(`[db] ${this.table}: ${message}`);
      return { data: this.rowMode === "many" ? [] : null, error: { message } };
    }
  }

  then<R1 = Result<T>, R2 = never>(
    onfulfilled?: ((value: Result<T>) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((reason: unknown) => R2 | PromiseLike<R2>) | null,
  ): PromiseLike<R1 | R2> {
    return this.run().then(onfulfilled as any, onrejected as any);
  }
}

function push(params: unknown[], value: unknown): string {
  params.push(value);
  return `$${params.length}`;
}

/** Roept een SQL-functie aan (vervangt `supabase.rpc`). */
export async function dbRpc<T = any>(
  fn: string,
  args: Record<string, unknown> = {},
): Promise<Result<T>> {
  try {
    const params: unknown[] = [];
    const argList = Object.entries(args)
      .map(([name, value]) => `${ident(name)} => ${push(params, value)}`)
      .join(", ");
    const rows = (await (db() as any).query(
      `select public.${ident(fn)}(${argList}) as result`,
      params,
    )) as any[];
    return { data: (rows[0]?.result ?? null) as T, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Databasefout";
    console.error(`[db] rpc ${fn}: ${message}`);
    return { data: null as T, error: { message } };
  }
}

/**
 * Bevoorrechte databaseclient (geen RLS) met een Supabase-compatibele API.
 * Enkel binnen server functions / *.server.ts-modules gebruiken.
 */
export const dbAdmin: DataClient = {
  from: (table: string) => new Query(table) as unknown as QueryBuilder,
  rpc: dbRpc as DataClient["rpc"],
};
