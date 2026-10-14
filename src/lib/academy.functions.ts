import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "@/lib/auth-middleware";
import { z } from "zod";
import { db } from "@/lib/neon.server";
import { normalizePublicImageUrl } from "@/lib/s3.server";


type AcademyRow = {
  id: string;
  diersoort_naam: string;
  diersoort_naam_fr: string | null;
  diersoort_naam_en: string | null;
  slug: string;
  badge_icon: string | null;
  vragen_per_test: number;
  slaag_grens: number;
  beschrijving: string | null;
  beschrijving_fr: string | null;
  beschrijving_en: string | null;
};

// ---------- Publiek: lijst van actieve academies ----------
export const listAcademies = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const sql = db();
    const rows = (await sql`
    select id, diersoort_naam, diersoort_naam_fr, diersoort_naam_en, slug, badge_icon,
           vragen_per_test, slaag_grens, beschrijving, beschrijving_fr, beschrijving_en,
           coalesce(categorie, 'algemeen') as categorie,
           coalesce(prioriteit, 0) as prioriteit, korte_code
      from academies
     where is_active = true and status = 'gepubliceerd'
     order by prioriteit nulls last, diersoort_naam
  `) as Array<AcademyRow & { categorie: string; prioriteit: number; korte_code: number | null }>;

    // Tel het werkelijke aantal vragen en modules per academy (dynamische kaarttekst).
    const vragen = (await sql`select academy_id, module from academy_vragen`) as Array<{
      academy_id: string;
      module: number | null;
    }>;

    const stats = new Map<string, { total: number; modules: Set<number> }>();
    for (const v of vragen ?? []) {
      const cur = stats.get(v.academy_id) ?? { total: 0, modules: new Set<number>() };
      cur.total += 1;
      cur.modules.add(v.module ?? 1);
      stats.set(v.academy_id, cur);
    }

    return rows.map((a) => {
      const s = stats.get(a.id);
      const totaal_vragen = s?.total ?? a.vragen_per_test;
      const modules = s?.modules.size ?? 1;
      const perModule = Math.max(1, Math.round(totaal_vragen / modules));
      return {
        ...a,
        totaal_vragen,
        modules,
        // Minimum aantal juiste antwoorden per module.
        module_grens: Math.max(1, Math.ceil((perModule * a.slaag_grens) / (totaal_vragen || 1))),
      };
    });
  } catch (err) {
    console.error("SSR data loading warning (academies):", err);
    return [];
  }
});

// ---------- Publiek: één academy + willekeurige vragen (zonder correct antwoord) ----------
export const startExamen = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z.object({ slug: z.string(), doelgroep: z.enum(["kids", "16plus"]).default("kids"), lang: z.enum(["nl", "fr", "en"]) }).parse(d),
  )
  .handler(async ({ data }) => {
    const sql = db();
    const { kiesVragen, aantalRondes } = await import("./academy-selectie");
    const { optiePermutatie, schudOpties, nieuweSessie } = await import("./academy-shuffle");

    const academy = (
      (await sql`
      select id, diersoort_naam, diersoort_naam_fr, diersoort_naam_en, slug, badge_icon,
             vragen_per_test, slaag_grens, beschrijving, beschrijving_fr, beschrijving_en,
             vragen_per_test_kids, vragen_per_test_16plus, slaag_grens_kids, slaag_grens_16plus
        from academies
       where slug = ${data.slug} and is_active = true and status = 'gepubliceerd'
       limit 1
    `) as Array<
        AcademyRow & {
          vragen_per_test_kids: number | null;
          vragen_per_test_16plus: number | null;
          slaag_grens_kids: number | null;
          slaag_grens_16plus: number | null;
        }
      >
    )[0];
    if (!academy) throw new Error("Academy niet gevonden");

    type Row = {
      id: string;
      vraag_tekst: string;
      vraag_tekst_fr: string | null;
      vraag_tekst_en: string | null;
      opties: unknown;
      opties_fr: unknown;
      opties_en: unknown;
      module: number | null;
      vraag_type: string | null;
      media_url: string | null;
      media_alt: string | null;
      doelgroep: string | null;
      variant_groep: string | null;
      verplicht: boolean;
      moeilijkheid: number | null;
      getal_eenheid: string | null;
      getal_eenheid_fr: string | null;
      getal_eenheid_en: string | null;
    };
    const vragen = (await sql`
      select id, vraag_tekst, vraag_tekst_fr, vraag_tekst_en, opties, opties_fr, opties_en,
             module, vraag_type, media_url, media_alt, doelgroep,
             variant_groep, coalesce(verplicht, false) as verplicht, moeilijkheid,
             getal_eenheid, getal_eenheid_fr, getal_eenheid_en
        from academy_vragen
       where academy_id = ${academy.id}
    `) as Row[];

    const localized = (vragen ?? []).filter((v) => {
      if (data.lang === "nl") return Boolean(v.vraag_tekst?.trim());
      const tekst = data.lang === "fr" ? v.vraag_tekst_fr : v.vraag_tekst_en;
      if (!tekst?.trim()) return false;
      if ((v.vraag_type ?? "tekst") === "getal") {
        const unit = data.lang === "fr" ? v.getal_eenheid_fr : v.getal_eenheid_en;
        return Boolean(unit?.trim());
      }
      const translated = data.lang === "fr" ? v.opties_fr : v.opties_en;
      return Array.isArray(translated) && translated.length === ((v.opties as unknown[]) ?? []).length;
    });

    const gewenst =
      (data.doelgroep === "kids" ? academy.vragen_per_test_kids : academy.vragen_per_test_16plus) ??
      academy.vragen_per_test;
    // Enkel vragen van dit leeftijdsspoor tellen mee: liever een kortere test
    // dan vragen die niet bij de leeftijd passen.
    const { voorSpoor } = await import("./academy-selectie");
    const spoorPool = voorSpoor(localized, data.doelgroep);
    const minimalePool = data.doelgroep === "kids" ? 8 : 15;
    const rondeDekking = data.doelgroep === "16plus" && [1, 2, 3].every((m) => spoorPool.filter((v) => (v.module ?? 1) === m).length >= 5);
    if (spoorPool.length < minimalePool || (data.doelgroep === "16plus" && !rondeDekking)) {
      throw new Error("Deze Academy is nog niet volledig beschikbaar in deze taal.");
    }
    const aantal = Math.max(1, Math.min(gewenst, spoorPool.length || gewenst));
    const slaagGrens =
      (data.doelgroep === "kids" ? academy.slaag_grens_kids : academy.slaag_grens_16plus) ??
      academy.slaag_grens;

    const selected = kiesVragen(localized, { doelgroep: data.doelgroep, aantal });
    const sessie = nieuweSessie();

    return {
      academy: {
        ...academy,
        // De grens die in dit spoor telt (nooit hoger dan het aantal vragen).
        slaag_grens: Math.max(1, Math.min(slaagGrens, selected.length)),
      },
      sessie,
      rondes: aantalRondes(data.doelgroep),
      doelgroep: data.doelgroep,
      vragen: selected.map((v) => {
        const type = (v.vraag_type ?? "tekst") as "tekst" | "beeld" | "audio" | "getal";
        const nl = (v.opties as string[] | null) ?? [];
        const fr = (v.opties_fr as string[] | null) ?? null;
        const en = (v.opties_en as string[] | null) ?? null;
        // Getalvragen hebben geen opties en dus geen permutatie.
        const perm = type === "getal" ? [] : optiePermutatie(sessie, v.id, nl.length);
        return {
          id: v.id,
          vraag_tekst: v.vraag_tekst,
          vraag_tekst_fr: v.vraag_tekst_fr,
          vraag_tekst_en: v.vraag_tekst_en,
          opties: type === "getal" ? [] : schudOpties(nl, perm),
          opties_fr: fr && fr.length === nl.length ? schudOpties(fr, perm) : null,
          opties_en: en && en.length === nl.length ? schudOpties(en, perm) : null,
          module: (v.module ?? 1) as number,
          vraag_type: type,
          media_url: normalizePublicImageUrl(v.media_url),
          media_alt: v.media_alt ?? null,
          getal_eenheid: v.getal_eenheid,
          getal_eenheid_fr: v.getal_eenheid_fr,
          getal_eenheid_en: v.getal_eenheid_en,
        };
      }),
    };
  });

/** Bepaalt of één antwoord juist is; werkt voor meerkeuze én getalvragen. */
async function beoordeel(
  vraag: {
    vraag_type: string | null;
    correcte_optie_index: number;
    opties: unknown;
    correct_getal: string | number | null;
    getal_marge: string | number | null;
  },
  antwoord: { sessie: string; vraag_id: string; gekozen_index?: number; getal?: number },
) {
  if ((vraag.vraag_type ?? "tekst") === "getal") {
    if (typeof antwoord.getal !== "number") return { juist: false, correcte_index: -1 };
    const doel = Number(vraag.correct_getal ?? NaN);
    const marge = Number(vraag.getal_marge ?? 0);
    return {
      juist: Number.isFinite(doel) && Math.abs(antwoord.getal - doel) <= marge + 1e-9,
      correcte_index: -1,
      correct_getal: Number.isFinite(doel) ? doel : null,
    };
  }
  const { optiePermutatie } = await import("./academy-shuffle");
  const n = ((vraag.opties as string[] | null) ?? []).length;
  const perm = optiePermutatie(antwoord.sessie, antwoord.vraag_id, n);
  const echt = perm[antwoord.gekozen_index ?? -1] ?? -1;
  // Weergave-index van het juiste antwoord, zodat de browser het kan markeren.
  const weergaveJuist = perm.indexOf(vraag.correcte_optie_index);
  return { juist: echt === vraag.correcte_optie_index, correcte_index: weergaveJuist };
}

// ---------- Publiek: directe feedback op één antwoord ("Wist je dat?") ----------
export const checkAntwoord = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        vraag_id: z.string().uuid(),
        sessie: z.string().min(1).max(64),
        gekozen_index: z.number().int().min(0).max(9).optional(),
        getal: z.number().finite().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const sql = db();
    const vraag = (
      (await sql`
      select id, correcte_optie_index, opties, vraag_type, correct_getal, getal_marge,
             wist_je_dat, wist_je_dat_fr, wist_je_dat_en
        from academy_vragen
       where id = ${data.vraag_id}
       limit 1
    `) as Array<{
        correcte_optie_index: number;
        opties: unknown;
        vraag_type: string | null;
        correct_getal: string | number | null;
        getal_marge: string | number | null;
        wist_je_dat: string | null;
        wist_je_dat_fr: string | null;
        wist_je_dat_en: string | null;
      }>
    )[0];
    if (!vraag) throw new Error("Vraag niet gevonden");

    const oordeel = await beoordeel(vraag, data);
    return {
      ...oordeel,
      wist_je_dat: vraag.wist_je_dat ?? null,
      wist_je_dat_fr: vraag.wist_je_dat_fr ?? null,
      wist_je_dat_en: vraag.wist_je_dat_en ?? null,
    };
  });

// ---------- Beveiligd: examen inleveren + certificaat uitgeven ----------
export const submitExamen = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) =>
    z
      .object({
        academy_id: z.string().uuid(),
        sessie: z.string().min(1).max(64),
        doelgroep: z.enum(["kids", "16plus"]).default("16plus"),
        antwoorden: z.array(
          z.object({
            vraag_id: z.string().uuid(),
            gekozen_index: z.number().int().min(-1).optional(),
            getal: z.number().finite().optional(),
          }),
        ),
        volledige_naam: z.string().min(1).max(120),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const sql = db();
    const userId = context.userId;

    const academy = (
      (await sql`
      select id, diersoort_naam, slug, slaag_grens, vragen_per_test,
             slaag_grens_kids, slaag_grens_16plus
        from academies
       where id = ${data.academy_id}
       limit 1
    `) as Array<{
        id: string;
        diersoort_naam: string;
        slug: string;
        slaag_grens: number;
        vragen_per_test: number;
        slaag_grens_kids: number | null;
        slaag_grens_16plus: number | null;
      }>
    )[0];
    if (!academy) throw new Error("Academy bestaat niet");

    // Score altijd server-side hertellen op basis van de opgeslagen vragen.
    const ids = data.antwoorden.map((a) => a.vraag_id);
    const vragen = (await sql`
      select id, correcte_optie_index, opties, vraag_type, correct_getal, getal_marge
        from academy_vragen
       where academy_id = ${academy.id} and id = any(${ids}::uuid[])
    `) as Array<{
      id: string;
      correcte_optie_index: number;
      opties: unknown;
      vraag_type: string | null;
      correct_getal: string | number | null;
      getal_marge: string | number | null;
    }>;

    const map = new Map(vragen?.map((v) => [v.id, v]) ?? []);

    let correct = 0;
    let totaal = 0;
    const gezien = new Set<string>();
    for (const a of data.antwoorden) {
      const v = map.get(a.vraag_id);
      // Elke vraag telt maar één keer: herhaalde antwoorden leveren geen extra punten op.
      if (!v || gezien.has(a.vraag_id)) continue;
      gezien.add(a.vraag_id);
      totaal++;
      const oordeel = await beoordeel(v, {
        sessie: data.sessie,
        vraag_id: a.vraag_id,
        gekozen_index: a.gekozen_index,
        getal: a.getal,
      });
      if (oordeel.juist) correct++;
    }
    if (totaal === 0) throw new Error("Geen geldige antwoorden");

    const grensSpoor =
      (data.doelgroep === "kids" ? academy.slaag_grens_kids : academy.slaag_grens_16plus) ??
      academy.slaag_grens;
    const slaagGrens = Math.max(1, Math.min(grensSpoor, totaal));
    const score = `${correct}/${totaal}`;
    const geslaagd = correct >= slaagGrens;

    if (!geslaagd) {
      return {
        geslaagd: false as const,
        score,
        correct,
        totaal,
        slaag_grens: slaagGrens,
      };
    }

    // Certificaat uitgeven: volgnummer per academy, atomair genoeg voor deze schaal.
    const cert = (
      (await sql`
      insert into certificaten (user_id, academy_id, volgnummer, score, volledige_naam)
      values (
        ${userId}::uuid,
        ${academy.id}::uuid,
        (select coalesce(max(volgnummer), 0) + 1 from certificaten where academy_id = ${academy.id}::uuid),
        ${score},
        ${data.volledige_naam.trim()}
      )
      returning id, user_id, academy_id, volgnummer, score, volledige_naam, behaald_op, public_token
    `) as Array<{
        id: string;
        volgnummer: number;
        score: string;
        volledige_naam: string;
        behaald_op: string;
        public_token: string | null;
      }>
    )[0];
    if (!cert) throw new Error("Certificaat kon niet worden aangemaakt");

    // Badge bijschrijven op het profiel (mag nooit het certificaat blokkeren).
    try {
      await sql`
        update profiles
           set behaalde_badges = case
                 when behaalde_badges @> to_jsonb(${academy.slug}::text) then behaalde_badges
                 else coalesce(behaalde_badges, '[]'::jsonb) || to_jsonb(${academy.slug}::text)
               end
         where id = ${userId}::uuid
      `;
    } catch (e) {
      console.error("[academy] badge bijwerken faalde", e);
    }

    // Felicitatiemail (mislukking mag het certificaat nooit blokkeren)
    try {
      const email = (context.claims as { email?: string } | undefined)?.email;
      if (email) {
        const { sendMail, certificateEmail } = await import("./email.server");
        const badge = (
          (await sql`select badge_icon from academies where id = ${academy.id}::uuid limit 1`) as Array<{
            badge_icon: string | null;
          }>
        )[0]?.badge_icon;
        const { CANONICAL_SITE_URL } = await import("./site-url");
        const origin = CANONICAL_SITE_URL;
        const { subject, html } = certificateEmail({
          naam: data.volledige_naam,
          academy: academy.diersoort_naam,
          badge: badge ?? "🏅",
          score,
          onderscheiding: correct === totaal,
          url: `${origin}/account?tab=certificates`,
        });
        await sendMail({ to: email, subject, html, kind: "certificaat" });
      }
    } catch (e) {
      console.error("[email] certificaatmail faalde", e);
    }

    return {
      geslaagd: true as const,
      score,
      correct,
      totaal,
      certificaat: cert,
      academy: {
        id: academy.id,
        slug: academy.slug,
        diersoort_naam: academy.diersoort_naam,
      },
    };
  });

// ---------- Beveiligd: eigen certificaten ----------
export const listMyCertificaten = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const sql = db();
    return (await sql`
      select id, academy_id, volgnummer, score, volledige_naam, behaald_op
        from certificaten
       where user_id = ${context.userId}::uuid
       order by behaald_op desc
    `) as Array<{
      id: string;
      academy_id: string;
      volgnummer: number;
      score: string;
      volledige_naam: string;
      behaald_op: string;
    }>;
  });

// ---------- Beveiligd: één certificaat + academy-info ----------
export const getCertificaat = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const sql = db();
    type Cert = {
      id: string;
      user_id: string;
      academy_id: string;
      volgnummer: number;
      score: string;
      volledige_naam: string;
      behaald_op: string;
      public_token: string | null;
      short_code: string | null;
    };
    type Aca = {
      id: string;
      diersoort_naam: string;
      diersoort_naam_fr: string | null;
      diersoort_naam_en: string | null;
      slug: string;
      badge_icon: string | null;
    };
    const cert = (
      (await sql`
      select id, user_id, academy_id, volgnummer, score, volledige_naam, behaald_op, public_token,
             short_code
        from certificaten
       where id = ${data.id}::uuid and user_id = ${context.userId}::uuid
       limit 1
    `) as Cert[]
    )[0];
    if (!cert) throw new Error("Niet gevonden");
    const academy =
      ((await sql`
      select id, diersoort_naam, diersoort_naam_fr, diersoort_naam_en, slug, badge_icon
        from academies
       where id = ${cert.academy_id}::uuid
       limit 1
    `) as Aca[])[0] ?? null;
    // Ondertekende QR: enkel met deze handtekening toont de publieke
    // verificatiepagina het volledige certificaatbeeld.
    const { certCode } = await import("@/lib/cert-code");
    const { signCertCodeSafe } = await import("@/lib/academy-sig.server");
    const qr_sig = await signCertCodeSafe(
      certCode(academy?.slug, cert.behaald_op, cert.volgnummer),
    );
    return { certificaat: cert, academy, qr_sig };
  });

// ---------- Beveiligd: eigen (meest recente) certificaat voor één academie-slug ----------
export const getCertificaatBySlug = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => z.object({ slug: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    const sql = db();
    const row = (
      (await sql`
      select c.id
        from certificaten c
        join academies a on a.id = c.academy_id
       where a.slug = ${data.slug} and c.user_id = ${context.userId}::uuid
       order by c.behaald_op desc
       limit 1
    `) as Array<{ id: string }>
    )[0];
    return { id: row?.id ?? null };
  });
