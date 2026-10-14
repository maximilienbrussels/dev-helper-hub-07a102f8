import { createFileRoute } from "@tanstack/react-router";
import { BadgeCheck, ShieldAlert } from "lucide-react";
import { MLogo } from "@/components/MLogo";
import { NavHeader } from "@/components/NavHeader";
import { useT } from "@/lib/i18n";
import { isKidsCertCode } from "@/lib/kids-cert";
import { KidsWaxSeal } from "@/components/academy/KidsFarmArt";
import { LocalLink } from "@/components/LocalLink";
import { pathFor } from "@/lib/routes-i18n";

/**
 * Publieke echtheidscontrole voor kinderdiploma's (`KND-JJJJ-NNNN`).
 *
 * Kinderdiploma's bevatten bewust geen persoonsgegevens op de server: er is
 * dus niets op te zoeken. Deze pagina bevestigt de officiële herkomst en de
 * geldige opmaak van de code. Volwassen certificaten worden doorverwezen naar
 * de bestaande verificatiepagina.
 */
export const Route = createFileRoute("/academy/verify")({
  validateSearch: (search: Record<string, unknown>) => ({
    code: typeof search.code === "string" ? search.code : "",
  }),
  head: () => ({
    meta: [
      { title: "Junior diploma verifiëren — Ferme Maximilien" },
      {
        name: "description",
        content:
          "Controleer of een Junior Boerderij Diploma van de stadsboerderij Maximilien echt is.",
      },
      { property: "og:title", content: "Junior diploma verifiëren" },
      {
        property: "og:description",
        content: "Officiële controlepagina voor de kinderdiploma's van de stadsboerderij.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AcademyVerifyPage,
});

function AcademyVerifyPage() {
  const { code } = Route.useSearch();
  const { lang } = useT();
  const clean = code.trim().toUpperCase();
  const valid = isKidsCertCode(clean);

  const copy = {
    nl: {
      title: "Diploma controleren",
      ok: "Geldig diploma",
      issuer: "Officieel Junior Boerderij Diploma van Maximilien",
      note: "Kinderdiploma's bevatten geen persoonsgegevens: enkel de code wordt gecontroleerd.",
      bad: "Deze code hoort niet bij een Junior Boerderij Diploma.",
      adult: "Zoek je een certificaat van een volwassene? Gebruik de gewone verificatiepagina.",
      back: "Terug naar de Academy",
    },
    fr: {
      title: "Vérifier le diplôme",
      ok: "Diplôme valide",
      issuer: "Diplôme Junior officiel de la Maximilien",
      note: "Les diplômes des enfants ne contiennent aucune donnée personnelle : seul le code est vérifié.",
      bad: "Ce code ne correspond pas à un diplôme Junior de la ferme.",
      adult: "Vous cherchez un certificat adulte ? Utilisez la page de vérification habituelle.",
      back: "Retour à l'Academy",
    },
    en: {
      title: "Verify diploma",
      ok: "Valid diploma",
      issuer: "Official Junior Farm Diploma from Maximilien",
      note: "Children's diplomas hold no personal data: only the code is checked.",
      bad: "This code does not belong to a Junior Farm Diploma.",
      adult: "Looking for an adult certificate? Use the regular verification page.",
      back: "Back to the Academy",
    },
  }[lang];

  return (
    <>
      <NavHeader />
      <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 py-16">
        <MLogo variant="brand" className="h-12 w-auto" />
        <h1 className="mt-6 font-serif text-3xl italic text-[color:var(--ink-forest)]">
          {copy.title}
        </h1>

        {valid ? (
          <div className="mt-8 w-full rounded-3xl border border-[color:var(--color-sage)]/60 bg-[color:var(--surface-page)] p-8 text-center">
            <KidsWaxSeal className="mx-auto h-24 w-24" />
            <p className="mt-4 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-[color:var(--ink-forest)]">
              <BadgeCheck className="h-4 w-4" /> {copy.ok}
            </p>
            <p className="mt-4 text-lg text-foreground/90">{copy.issuer}</p>
            <p className="mt-4 font-mono text-sm tracking-widest text-[color:var(--color-terracotta)]">
              {clean}
            </p>
            <p className="mt-4 text-xs text-muted-foreground">{copy.note}</p>
          </div>
        ) : (
          <div className="mt-8 w-full rounded-3xl border border-border bg-card p-8 text-center">
            <ShieldAlert className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">{copy.bad}</p>
            <p className="mt-2 text-xs text-muted-foreground">{copy.adult}</p>
            {clean && (
              <p className="mt-2 font-mono text-xs tracking-widest text-muted-foreground">
                #{clean}
              </p>
            )}
          </div>
        )}

        <LocalLink to={pathFor("academy", lang)} className="mt-8 text-sm text-primary hover:underline">
          {copy.back}
        </LocalLink>
      </main>
    </>
  );
}
