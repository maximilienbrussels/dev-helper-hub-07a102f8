/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Losse types voor de databaselaag (Neon Data API + de SQL-adminlaag).
 *
 * De app is geschreven tegen de PostgREST-querybuilder. In plaats van de
 * volledige generated types mee te slepen typeren we de builder bewust ruim:
 * rijen zijn `Record<string, any>`, zodat bestaande call sites blijven werken
 * zonder overal casts.
 */
export type Row = Record<string, any>;

export type DbError = { message: string; code?: string } | null;

export type SingleResult = PromiseLike<{ data: any; error: DbError }>;

export interface QueryBuilder extends PromiseLike<{ data: any[]; error: DbError }> {
  select(columns?: string, options?: Record<string, unknown>): QueryBuilder;
  insert(values: Row | Row[], options?: Record<string, unknown>): QueryBuilder;
  upsert(values: Row | Row[], options?: { onConflict?: string }): QueryBuilder;
  update(values: Row, options?: Record<string, unknown>): QueryBuilder;
  delete(options?: Record<string, unknown>): QueryBuilder;
  eq(column: string, value: any): QueryBuilder;
  neq(column: string, value: any): QueryBuilder;
  gt(column: string, value: any): QueryBuilder;
  gte(column: string, value: any): QueryBuilder;
  lt(column: string, value: any): QueryBuilder;
  lte(column: string, value: any): QueryBuilder;
  like(column: string, value: string): QueryBuilder;
  ilike(column: string, value: string): QueryBuilder;
  in(column: string, values: readonly any[]): QueryBuilder;
  is(column: string, value: null | boolean): QueryBuilder;
  match(criteria: Row): QueryBuilder;
  order(column: string, options?: { ascending?: boolean }): QueryBuilder;
  limit(count: number): QueryBuilder;
  range(from: number, to: number): QueryBuilder;
  single(): SingleResult;
  maybeSingle(): SingleResult;
}

/** Databaseclient met een PostgREST-compatibele API. */
export interface DataClient {
  from(table: string): QueryBuilder;
  rpc(fn: string, args?: Row): PromiseLike<{ data: any; error: DbError }>;
}
