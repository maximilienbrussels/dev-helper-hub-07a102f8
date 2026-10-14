import { LocalLink } from "@/components/LocalLink";
import { pathFor } from "@/lib/routes-i18n";
import { Link } from "@tanstack/react-router";
import { useT } from "@/lib/i18n";
import { useSiteContact } from "@/lib/use-site-config";
import { contactAddressLine } from "@/lib/site-config";
import type { Lang } from "@/lib/i18n";
import { SocialCarousel } from "./SocialCarousel";
import { LocationLink } from "./LocationLink";
import { RoutBadge } from "./RoutBadge";
import { PwaInstallButton } from "@/components/pwa/PwaInstallButton";
// Farm identity constants — brief specifies address Quai du Batelage 2.
const PHONE = "+32 2 201 56 09";

const LINK = "hover:text-[color:var(--color-terracotta)]";

/**
 * Toont het e-mailadres leesbaar, maar zonder kant-en-klare mailto in de
 * broncode: de koppeling wordt pas bij klik/aanraking samengesteld.
 */
function ObfuscatedEmail({ email, className }: { email: string; className?: string }) {
  const at = email.lastIndexOf("@");
  const user = at > 0 ? email.slice(0, at) : email;
  const domain = at > 0 ? email.slice(at + 1) : "";
  const build = (el: HTMLAnchorElement) => {
    if (domain) el.setAttribute("href", `mailto:${user}\u0040${domain}`);
  };
  return (
    <a
      href="#contact"
      className={className}
      data-user={user}
      data-domain={domain}
      onMouseEnter={(e) => build(e.currentTarget)}
      onFocus={(e) => build(e.currentTarget)}
      onTouchStart={(e) => build(e.currentTarget)}
      onClick={(e) => build(e.currentTarget)}
    >
      {user}
      <span>&#64;</span>

      {domain}
    </a>
  );
}

const DISCOVER_TITLE: Record<Lang, string> = { nl: "Ontdekken", fr: "Découvrir", en: "Discover" };
const BOOK_TITLE: Record<Lang, string> = {
  nl: "Boeken & huren",
  fr: "Réserver & louer",
  en: "Book & rent",
};
const BOOK_NOW: Record<Lang, string> = {
  nl: "Online boeken",
  fr: "Réserver en ligne",
  en: "Book online",
};
const MEDIA_LABEL: Record<Lang, string> = {
  nl: "Onze media",
  fr: "Nos médias",
  en: "Our media",
};

const COMPOST_LABEL: Record<Lang, string> = {
  nl: "Buurtcompost",
  fr: "Compost de quartier",
  en: "Neighbourhood compost",
};


const COPY: Record<
  Lang,
  { supportedBy: string; city: string; and: string; design: string }
> = {
  nl: {
    supportedBy: "Met de steun van",
    city: "Stad Brussel",
    and: "Brusselse Stadslandbouw",
    design: "Architectuur & Platform door",
  },
  fr: {
    supportedBy: "Avec le soutien de la",
    city: "Ville de Bruxelles",
    and: "Agriculture urbaine bruxelloise",
    design: "Conception & plateforme par",
  },
  en: {
    supportedBy: "With the support of the",
    city: "City of Brussels",
    and: "Brussels Urban Agriculture",
    design: "Design & platform by",
  },
};

export function SiteFooter() {
  const { t, lang, tx } = useT();
  // Contactgegevens uit het portaal, met de vaste waarden als vangnet.
  const site = useSiteContact();
  const contactEmail = site.email || "contact@maximilien.brussels";
  const phoneDisplay = site.phone || PHONE;
  const phoneHref = phoneDisplay.replace(/[^\d+]/g, "");
  const addressLine = contactAddressLine(site);
  const c0 = COPY[lang];
  const c = { supportedBy: tx(c0.supportedBy), city: tx(c0.city), and: tx(c0.and), design: tx(c0.design) };
  return (
    <footer className="relative z-0 mt-8 border-t border-border bg-[color:var(--surface-page)]/50 overflow-x-hidden">
      <div className="mx-auto max-w-6xl px-4 py-14 md:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[260px_1fr]">
          {/* Linker merkblok */}
          <div className="min-w-0">
            <p className="font-serif text-2xl italic text-[color:var(--color-terracotta)]">
              {t("brand.name")}
            </p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-foreground/90">
              {t("brand.tagline")}
            </p>
            <address className="mt-3 not-italic text-sm leading-relaxed text-foreground/90">
              <LocationLink />
            </address>

            <SocialCarousel />

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <RoutBadge />
            </div>
          </div>

          {/* Rechter kolommen */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-2 md:grid-cols-4">
            {/* Kolom: ontdekken */}
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-foreground">
                {tx(DISCOVER_TITLE[lang])}
              </p>
              <nav className="mt-3 flex flex-col gap-2 text-sm text-foreground/90">
                <LocalLink to={pathFor("about", lang)} className={LINK}>
                  {t("nav.about")}
                </LocalLink>
                <LocalLink to={pathFor("academy", lang)} className={LINK}>
                  {t("nav.academy")}
                </LocalLink>
                <LocalLink to={pathFor("shop", lang)} className={LINK}>
                  {t("nav.webshop")}
                </LocalLink>
                <LocalLink to={pathFor("support", lang)} className={LINK}>
                  {t("nav.support")}
                </LocalLink>
                <LocalLink to={pathFor("compost", lang)} className={LINK}>
                  {tx(COMPOST_LABEL[lang])}
                </LocalLink>
                <LocalLink to={pathFor("social", lang)} className={LINK}>
                  {tx(MEDIA_LABEL[lang])}
                </LocalLink>
                <LocalLink to={pathFor("events", lang)} className={LINK}>
                  {tx({ nl: "Kalender", fr: "Agenda", en: "Calendar" }[lang])}
                </LocalLink>
                <LocalLink to={pathFor("fairtech", lang)} className={LINK}>
                  {tx({ nl: "Fair & Open Tech", fr: "Fair & Open Tech", en: "Fair & Open Tech" }[lang])}
                </LocalLink>
              </nav>
            </div>

            {/* Kolom: boeken & huren */}
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-foreground">
                {tx(BOOK_TITLE[lang])}
              </p>
              <nav className="mt-3 flex flex-col gap-2 text-sm text-foreground/90">
                {(
                  [
                    ["animations", { nl: "Schoolanimaties", fr: "Animations scolaires", en: "School activities" }],
                    ["camps", { nl: "Vakantiestages", fr: "Stages de vacances", en: "Holiday camps" }],
                    ["rental", { nl: "Zalen huren", fr: "Location de salles", en: "Venue rental" }],
                    ["teambuilding", { nl: "Teambuilding", fr: "Team building", en: "Team building" }],
                    ["seminars", { nl: "Seminaries", fr: "Séminaires", en: "Seminars" }],
                  ] as const
                ).map(([key, label]) => (
                  <LocalLink key={key} to={pathFor(key, lang)} className={LINK}>
                    {tx(label[lang])}
                  </LocalLink>
                ))}
                <Link to="/boeking" className={LINK}>
                  {tx(BOOK_NOW[lang])}
                </Link>
              </nav>
            </div>

            {/* Kolom: contact */}
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-foreground">
                {t("footer.contact")}
              </p>
              <ul className="mt-3 space-y-1.5 text-sm text-foreground/90">
                <li className="break-words">
                  <ObfuscatedEmail email={contactEmail} className={LINK} />
                </li>
                <li>
                  <a href={`tel:${phoneHref}`} className={LINK}>
                    {phoneDisplay}
                  </a>
                </li>
                <li className="break-words">{addressLine}</li>
              </ul>
              <nav className="mt-5 flex flex-col gap-2 text-sm text-foreground/90">

                <LocalLink to={pathFor("contact", lang)} className={LINK}>
                  {t("footer.contactLink")}
                </LocalLink>
                <LocalLink to={pathFor("faq", lang)} className={LINK}>
                  {tx({ nl: "Veelgestelde vragen", fr: "Questions fréquentes", en: "FAQ" }[lang])}
                </LocalLink>
                <LocalLink to={pathFor("press", lang)} className={LINK}>
                  {tx({ nl: "Pers & mediakit", fr: "Presse & kit média", en: "Press & media kit" }[lang])}
                </LocalLink>
              </nav>
            </div>

            {/* Kolom: partners & steun */}
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-foreground">
                {t("footer.partners")}
              </p>
              <nav className="mt-3 flex flex-col gap-2 text-sm text-foreground/90">
                <LocalLink to={pathFor("partners", lang)} className={LINK}>
                  {t("footer.ourPartners")}
                </LocalLink>
                <LocalLink to="/word-partner" className={LINK}>
                  {t("footer.becomePartner")}
                </LocalLink>
              </nav>
            </div>
          </div>
        </div>
      </div>


      {/* Subtiele onderregel */}
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 text-[11px] text-foreground/90 sm:flex-row sm:items-center sm:justify-between md:px-8">
          <p>
            {c.supportedBy}{" "}
            <a
              href="https://www.brussel.be"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-foreground/90 hover:text-[color:var(--color-terracotta)]"
            >
              {c.city}
            </a>{" "}
            &amp;{" "}
            <a
              href="https://goodfood.brussels"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-foreground/90 hover:text-[color:var(--color-terracotta)]"
            >
              {c.and}
            </a>
          </p>
          <p>
            <a
              href="https://mastodon-belgium.be/@Maximilien"
              rel="me noopener noreferrer"
              target="_blank"
              className="font-semibold text-foreground/90 hover:text-[color:var(--color-terracotta)]"
            >
              @Maximilien@mastodon-belgium.be
            </a>
          </p>
          <p>
            {c.design}{" "}
            <a
              href="https://delplanche.cloud"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-foreground/90 hover:text-[color:var(--color-terracotta)]"
            >
              Delplanche
            </a>
          </p>
        </div>
      </div>

      <div className="border-t border-border py-5 text-center text-[11px] text-foreground/90">
        <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-5 gap-y-2 px-4">
          <LocalLink to={pathFor("privacy", lang)} className={LINK}>
            {tx({ nl: "Privacybeleid", fr: "Politique de confidentialité", en: "Privacy policy" }[lang])}
          </LocalLink>
          <LocalLink to={pathFor("terms", lang)} className={LINK}>
            {tx({ nl: "Algemene voorwaarden", fr: "Conditions générales", en: "Terms and conditions" }[lang])}
          </LocalLink>
          <LocalLink to={pathFor("cookies", lang)} className={LINK}>
            {tx({ nl: "Cookies", fr: "Cookies", en: "Cookies" }[lang])}
          </LocalLink>
          <LocalLink to={pathFor("legal", lang)} className={LINK}>
            {tx({ nl: "Wettelijke vermeldingen", fr: "Mentions légales", en: "Legal notice" }[lang])}
          </LocalLink>
          <LocalLink to={pathFor("status", lang)} className={LINK}>
            {tx({ nl: "Status", fr: "Statut", en: "Status" }[lang])}
          </LocalLink>
          <PwaInstallButton />
        </nav>

        {/* Statische copyrightregel — geen verborgen doorverwijzing naar het beheerportaal. */}
        <p className="mt-4 uppercase tracking-[0.25em]">
          © 2026 Maximilien.{" "}
          {tx({
            nl: "Alle rechten voorbehouden.",
            fr: "Tous droits réservés.",
            en: "All rights reserved.",
          }[lang])}
        </p>
      </div>


    </footer>
  );
}
