/**
 * Anonieme Academy-statistieken.
 *
 * Tijdens een examen registreren we enkel geaggregeerde voortgang: welke
 * academie, welk leeftijdsspoor, welke taal, hoeveel vragen beantwoord en waar
 * iemand afhaakt. Er gaan nooit persoonsgegevens naar deze tabellen — ook niet
 * voor het kinderspoor, dat volledig anoniem blijft.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db } from "@/lib/neon.server";
import { requireAuth } from "@/lib/auth-middleware";
import { requirePermission } from "@/lib/portal-permissions";

const doelgroep = z.enum(["kids", "16plus"]);
const taal = z.enum(["nl", "fr", "en"]);

/** Start een anonieme poging en geeft het id terug dat de quiz meedraagt. */
export const startPoging = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        academy_id: z.string().uuid(),
        doelgroep,
        taal,
        vragen_totaal: z.number().int().min(0).max(200),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const sql = db();
    try {
      const rows = (await sql`
        insert into academy_pogingen (academy_id, doelgroep, taal, vragen_totaal)
        values (${data.academy_id}::uuid, ${data.doelgroep}, ${data.taal}, ${data.vragen_totaal})
        returning id
      `) as Array<{ id: string }>;
      return { poging_id: rows[0]?.id ?? null };
    } catch {
      // Statistieken mogen een examen nooit blokkeren.
      return { poging_id: null };
    }
  });

/** Eén beantwoorde vraag bijtellen (voortgang + kwaliteit van de vraag). */
export const logAntwoord = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        poging_id: z.string().uuid(),
        vraag_id: z.string().uuid(),
        module: z.number().int().min(1).max(9),
        juist: z.boolean(),
        doelgroep,
        taal,
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const sql = db();
    try {
      await sql`
        update academy_pogingen
           set beantwoord = beantwoord + 1,
               juist = juist + ${data.juist ? 1 : 0},
               laatste_module = greatest(laatste_module, ${data.module}),
               laatste_activiteit = now()
         where id = ${data.poging_id}::uuid and status = 'bezig'
      `;
      await sql`
        insert into academy_vraag_stats (vraag_id, taal, doelgroep, gesteld, juist)
        values (${data.vraag_id}::uuid, ${data.taal}, ${data.doelgroep}, 1, ${data.juist ? 1 : 0})
        on conflict (vraag_id, taal, doelgroep) do update
          set gesteld = academy_vraag_stats.gesteld + 1,
              juist = academy_vraag_stats.juist + excluded.juist
      `;
    } catch {
      /* statistieken zijn nooit blokkerend */
    }
    return { ok: true };
  });

/** Poging afsluiten als geslaagd of gezakt. */
export const finishPoging = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({ poging_id: z.string().uuid(), status: z.enum(["geslaagd", "gezakt"]) })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const sql = db();
    try {
      await sql`
        update academy_pogingen
           set status = ${data.status}, afgerond_op = now(), laatste_activiteit = now()
         where id = ${data.poging_id}::uuid and status = 'bezig'
      `;
    } catch {
      /* niet blokkerend */
    }
    return { ok: true };
  });

export type AcademyStatRow = {
  academy_id: string;
  slug: string;
  academy: string;
  doelgroep: string;
  taal: string;
  pogingen: number;
  geslaagd: number;
  gezakt: number;
  bezig: number;
  gem_score: number | null;
  gem_beantwoord: number | null;
  uitval_module: number | null;
};

export type ZwakkeVraag = {
  vraag_id: string;
  academy: string;
  taal: string;
  doelgroep: string;
  vraag: string;
  gesteld: number;
  juist_pct: number;
};

/** Beheeroverzicht: slagingspercentages, uitval en scores per dier/spoor/taal. */
export const getAcademyStats = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) =>
    z.object({ dagen: z.number().int().min(1).max(3650).default(365) }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    await requirePermission(context, "view_academy");
    const sql = db();
    const rijen = (await sql`
      select p.academy_id,
             a.slug,
             a.diersoort_naam as academy,
             p.doelgroep,
             p.taal,
             count(*)::int as pogingen,
             count(*) filter (where p.status = 'geslaagd')::int as geslaagd,
             count(*) filter (where p.status = 'gezakt')::int as gezakt,
             count(*) filter (where p.status = 'bezig')::int as bezig,
             round(avg(case when p.vragen_totaal > 0 and p.beantwoord > 0
                            then 100.0 * p.juist / greatest(p.beantwoord, 1) end), 1)::float as gem_score,
             round(avg(p.beantwoord), 1)::float as gem_beantwoord,
             round(avg(p.laatste_module) filter (where p.status <> 'geslaagd'), 1)::float as uitval_module
        from academy_pogingen p
        join academies a on a.id = p.academy_id
       where p.gestart_op > now() - (${data.dagen} || ' days')::interval
       group by p.academy_id, a.slug, a.diersoort_naam, p.doelgroep, p.taal
       order by a.diersoort_naam, p.doelgroep, p.taal
    `) as AcademyStatRow[];

    const zwak = (await sql`
      select s.vraag_id,
             a.diersoort_naam as academy,
             s.taal,
             s.doelgroep,
             v.vraag_tekst as vraag,
             s.gesteld::int as gesteld,
             round(100.0 * s.juist / greatest(s.gesteld, 1), 0)::float as juist_pct
        from academy_vraag_stats s
        join academy_vragen v on v.id = s.vraag_id
        join academies a on a.id = v.academy_id
       where s.gesteld >= 5
       order by juist_pct asc
       limit 25
    `) as ZwakkeVraag[];

    return { rijen, zwak };
  });
