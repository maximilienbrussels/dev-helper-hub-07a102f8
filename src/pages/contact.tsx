import { PagePhotoBand } from "@/components/PagePhotoBand";
import { useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { NavHeader } from "@/components/NavHeader";
import { LocalLink } from "@/components/LocalLink";
import { useT } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { CONTACT_EMAIL } from "@/lib/contact-emails";
import { useSiteContact } from "@/lib/use-site-config";
import { fetchContactTopics, sendContactMessage } from "@/lib/email.functions";
import { useHoneypot } from "@/components/HoneypotField";
import { RoutBadge } from "@/components/RoutBadge";
import { SocialRow } from "@/components/SocialCarousel";
import { MastodonIcon } from "@/components/social/MastodonIcon";
import { MASTODON_ACCT, MASTODON_PROFILE_URL } from "@/lib/mastodon";
import {
  Phone,
  MessageCircle,
  Send,
  Mail,
  Clock,
  Loader2,
  MapPin,
  Copy,
  Check as CheckIcon,
} from "lucide-react";

const PHONE = "+3222015609";
const PHONE_DISPLAY = "+32 2 201 56 09";
const EMAIL = CONTACT_EMAIL;
const ADDRESS_LINE1 = "Maximilien";
const ADDRESS_LINE2 = "Schipperijkaai 2 / Quai du Batelage 2";
const ADDRESS_LINE3 = "1000 Brussel / Bruxelles";
const ADDRESS_FULL = `${ADDRESS_LINE1}, ${ADDRESS_LINE2}, ${ADDRESS_LINE3}`;
const GOOGLE_MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(ADDRESS_FULL);
const APPLE_MAPS_URL = "https://maps.apple.com/?q=" + encodeURIComponent(ADDRESS_FULL);
const OSM_EMBED_URL =
  "https://www.openstreetmap.org/export/embed.html?bbox=4.3455%2C50.8558%2C4.3555%2C50.8618&layer=mapnik&marker=50.85876%2C4.35046";
const OSM_LARGE_URL =
  "https://www.openstreetmap.org/?mlat=50.85876&mlon=4.35046#map=18/50.85876/4.35046";

const COPY: Record<
  Lang,
  {
    eyebrow: string;
    title: string;
    addressTitle: string;
    openGoogle: string;
    openApple: string;
    copyAddress: string;
    copied: string;
    routeTitle: string;
    routeLede: string;
    walk: { title: string; body: string };
    transit: { title: string; body: string; note: string };
    bike: { title: string; body: string };
    car: { title: string; body: string };
    access: { title: string; body: string; link: string };
    hoursTitle: string;
    hoursValue: string;
    hoursLink: string;
    mapTitle: string;
    mapLarge: string;
    topicLabel: string;
  }
> = {
  nl: {
    eyebrow: "Locatie & contact",
    title: "Adres, route en bereikbaarheid",
    addressTitle: "Adres",
    openGoogle: "Open in Google Maps",
    openApple: "Open in Apple Maps",
    copyAddress: "Kopieer adres",
    copied: "Adres gekopieerd",
    routeTitle: "Route & bereikbaarheid",
    routeLede:
      "De boerderij ligt middenin het Maximiliaanpark, op wandelafstand van Brussel-Noord.",
    walk: {
      title: "Te voet",
      body: "Vanaf station Brussel-Noord loop je via het Maximiliaanpark in ongeveer 5 minuten naar de boerderij.",
    },
    transit: {
      title: "Openbaar vervoer",
      body: "Trein: Brussel-Noord. Metro: Yser/IJzer of Rogier. Tram: 3, 4, 51. Bus: 47, 58, 88.",
      note: "Lijnen ter indicatie — controleer steeds de actuele dienstregeling van de MIVB.",
    },
    bike: {
      title: "Met de fiets",
      body: "Villo!-station op enkele passen van de ingang, en fietsenstallingen aan de boerderij zelf.",
    },
    car: {
      title: "Met de auto",
      body: "Betalend straatparkeren in de buurt en enkele parkings vlakbij. Het openbaar vervoer is doorgaans vlotter — we raden het aan.",
    },
    access: {
      title: "Toegankelijkheid",
      body: "Vlak terrein op de hoofdroute, aangepast toilet en een aangepaste parkeerplaats aan het park.",
      link: "Meer over toegankelijkheid",
    },
    hoursTitle: "Openingsuren",
    hoursValue: "Dinsdag t.e.m. zaterdag, 10:00 – 16:30",
    hoursLink: "Bekijk het volledige rooster",
    mapTitle: "Kaart",
    mapLarge: "Open grotere kaart",
    topicLabel: "Waarover gaat je vraag?",
  },
  fr: {
    eyebrow: "Localisation & contact",
    title: "Adresse, itinéraire et accessibilité",
    addressTitle: "Adresse",
    openGoogle: "Ouvrir dans Google Maps",
    openApple: "Ouvrir dans Apple Maps",
    copyAddress: "Copier l'adresse",
    copied: "Adresse copiée",
    routeTitle: "Itinéraire & accessibilité",
    routeLede:
      "La ferme se trouve au cœur du parc Maximilien, à distance de marche de Bruxelles-Nord.",
    walk: {
      title: "À pied",
      body: "Depuis la gare de Bruxelles-Nord, comptez environ 5 minutes à travers le parc Maximilien.",
    },
    transit: {
      title: "Transports en commun",
      body: "Train : Bruxelles-Nord. Métro : Yser/IJzer ou Rogier. Tram : 3, 4, 51. Bus : 47, 58, 88.",
      note: "Lignes données à titre indicatif — vérifiez toujours les horaires actuels de la STIB.",
    },
    bike: {
      title: "À vélo",
      body: "Station Villo! à deux pas de l'entrée, et arceaux vélo à la ferme même.",
    },
    car: {
      title: "En voiture",
      body: "Stationnement payant en voirie et quelques parkings à proximité. Les transports en commun sont souvent plus pratiques — nous les recommandons.",
    },
    access: {
      title: "Accessibilité",
      body: "Terrain plat sur le parcours principal, toilette adaptée et emplacement de parking adapté près du parc.",
      link: "En savoir plus sur l'accessibilité",
    },
    hoursTitle: "Horaires d'ouverture",
    hoursValue: "Mardi au samedi, 10h00 – 16h30",
    hoursLink: "Voir les horaires complets",
    mapTitle: "Carte",
    mapLarge: "Ouvrir la carte en grand",
    topicLabel: "Quel est le sujet de votre question ?",
  },
  en: {
    eyebrow: "Location & contact",
    title: "Address, route and how to get there",
    addressTitle: "Address",
    openGoogle: "Open in Google Maps",
    openApple: "Open in Apple Maps",
    copyAddress: "Copy address",
    copied: "Address copied",
    routeTitle: "Route & getting here",
    routeLede:
      "The farm sits in the middle of Maximilien Park, within walking distance of Brussels-North station.",
    walk: {
      title: "On foot",
      body: "From Brussels-North station, it's about a 5-minute walk through Maximilien Park.",
    },
    transit: {
      title: "Public transport",
      body: "Train: Brussels-North. Metro: Yser/IJzer or Rogier. Tram: 3, 4, 51. Bus: 47, 58, 88.",
      note: "Lines given as an indication — always check the current STIB/MIVB schedule.",
    },
    bike: {
      title: "By bike",
      body: "A Villo! bike-share station right by the entrance, and bike racks at the farm itself.",
    },
    car: {
      title: "By car",
      body: "Paid on-street parking nearby and a few car parks close by. Public transport is usually easier — we recommend it.",
    },
    access: {
      title: "Accessibility",
      body: "Flat terrain on the main route, an adapted toilet and an adapted parking spot near the park.",
      link: "More about accessibility",
    },
    hoursTitle: "Opening hours",
    hoursValue: "Tuesday to Saturday, 10:00 – 16:30",
    hoursLink: "See the full schedule",
    mapTitle: "Map",
    mapLarge: "Open larger map",
    topicLabel: "What is your question about?",
  },
};

export function ContactPage() {
  const { t, lang } = useT();
  // Adres, telefoon en e-mail komen uit het portaal; de constanten hierboven
  // blijven het vangnet zolang er niets is ingevuld.
  const site = useSiteContact();
  const phoneDisplay = site.phone || PHONE_DISPLAY;
  const phoneHref = phoneDisplay.replace(/[^\d+]/g, "") || PHONE;
  const contactEmail = site.email || EMAIL;
  const addressLine2 = site.address || ADDRESS_LINE2;
  const addressLine3 = [site.postalCode, site.city].filter(Boolean).join(" ") || ADDRESS_LINE3;
  const c = COPY[lang];
  const { onderwerp } = useSearch({ strict: false }) as { onderwerp?: string };
  const topic = onderwerp?.trim() || "Contact";
  // Keuzelijst met onderwerpen: de beheerder bepaalt in het portaal welke
  // categorieën bestaan en naar welk e-mailadres ze gaan.
  const loadTopics = useServerFn(fetchContactTopics);
  const topics = useQuery({
    queryKey: ["contact-topics"],
    queryFn: () => loadTopics(),
    staleTime: 300_000,
  });
  const [inbox, setInbox] = useState("algemeen");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [copied, setCopied] = useState(false);
  const send = useServerFn(sendContactMessage);
  const hp = useHoneypot();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setFailed(false);
    try {
      await send({
        data: {
          website_hp: hp.value,
          inbox,
          onderwerp:
            (topics.data ?? []).find((x) => x.key === inbox)?.label && inbox !== "algemeen"
              ? `${topic} — ${(topics.data ?? []).find((x) => x.key === inbox)!.label}`
              : topic,
          naam: name,
          email,
          bericht: msg,
          pagina: "Contact",
          lang,
        },
      });
      setSent(true);
      setMsg("");
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(ADDRESS_FULL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore — clipboard may be unavailable
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavHeader />
      <PagePhotoBand photo="fontein" pageKey="contact" />
      <main className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-24">
        <p className="text-[11px] uppercase tracking-[0.25em] text-[color:var(--color-terracotta)] font-medium">
          {c.eyebrow}
        </p>
        <h1 className="font-serif mt-4 text-4xl leading-[1.02] tracking-tight text-[color:var(--ink-forest)] md:text-6xl">
          {c.title}
        </h1>

        {onderwerp && (
          <p className="mt-8 inline-flex items-center gap-2 rounded-full border border-[color:var(--color-sage)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--ink-forest)]">
            {onderwerp}
          </p>
        )}

        {/* Address + map */}
        <section className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
            <h2 className="font-serif text-2xl text-[color:var(--ink-forest)]">{c.addressTitle}</h2>
            <address className="mt-3 not-italic text-[15px] leading-relaxed text-foreground/90">
              {ADDRESS_LINE1}
              <br />
              {addressLine2}
              <br />
              {addressLine3}
            </address>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a
                href={GOOGLE_MAPS_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-[color:var(--color-terracotta)] px-5 text-[12px] font-semibold uppercase tracking-widest text-white transition-colors hover:bg-[color:var(--surface-forest)]"
              >
                <MapPin className="h-4 w-4" aria-hidden />
                {c.openGoogle}
              </a>
              <a
                href={APPLE_MAPS_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-border bg-background px-5 text-[12px] font-semibold uppercase tracking-widest text-foreground/90 transition-colors hover:border-[color:var(--color-terracotta)]"
              >
                <MapPin className="h-4 w-4" aria-hidden />
                {c.openApple}
              </a>
              <button
                type="button"
                onClick={copyAddress}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-dashed border-[color:var(--color-sage)] px-5 text-[12px] font-semibold uppercase tracking-widest text-[color:var(--ink-forest)] transition-colors hover:bg-[color:var(--color-sage)]/10"
              >
                {copied ? (
                  <CheckIcon className="h-4 w-4" aria-hidden />
                ) : (
                  <Copy className="h-4 w-4" aria-hidden />
                )}
                {copied ? c.copied : c.copyAddress}
              </button>
            </div>
          </div>

          <figure className="overflow-hidden rounded-3xl border border-border/60 shadow-sm">
            <iframe
              src={OSM_EMBED_URL}
              title={c.mapTitle}
              loading="lazy"
              className="h-64 w-full md:h-full"
              style={{ border: 0 }}
            />
            <figcaption className="border-t border-border/60 bg-[color:var(--surface-page)]/70 px-4 py-3 text-sm">
              <a href={OSM_LARGE_URL} target="_blank" rel="noreferrer" className="underline">
                {c.mapLarge}
              </a>
            </figcaption>
          </figure>
        </section>

        {/* Officiële digitale kanalen */}
        <section className="mt-10 flex flex-wrap items-center justify-center gap-4 sm:justify-start">
          <RoutBadge />
          <a
            href={MASTODON_PROFILE_URL}
            target="_blank"
            rel="me noopener noreferrer"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-border bg-card px-4 text-[12px] font-semibold text-foreground/90 transition-colors hover:border-[color:var(--color-terracotta)]/50 hover:text-[color:var(--color-terracotta)]"
          >
            <MastodonIcon className="h-4 w-4" />
            {MASTODON_ACCT}
          </a>
          <SocialRow className="w-full sm:w-auto" />
        </section>

        {/* Route & bereikbaarheid */}
        <section className="mt-16 md:mt-20">
          <h2 className="font-serif text-2xl text-[color:var(--ink-forest)] md:text-3xl">
            {c.routeTitle}
          </h2>
          <p className="mt-3 max-w-2xl text-[15px] text-foreground/90">{c.routeLede}</p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <article className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-semibold text-[color:var(--ink-forest)]">{c.walk.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground/90">{c.walk.body}</p>
            </article>
            <article className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-semibold text-[color:var(--ink-forest)]">{c.transit.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground/90">{c.transit.body}</p>
              <p className="mt-2 text-[12px] italic text-muted-foreground">{c.transit.note}</p>
            </article>
            <article className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-semibold text-[color:var(--ink-forest)]">{c.bike.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground/90">{c.bike.body}</p>
            </article>
            <article className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-semibold text-[color:var(--ink-forest)]">{c.car.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground/90">{c.car.body}</p>
            </article>
          </div>

          <article className="mt-6 rounded-2xl bg-[color:var(--surface-page)]/70 p-5">
            <h3 className="font-semibold text-[color:var(--ink-forest)]">{c.access.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-foreground/90">{c.access.body}</p>
            <LocalLink
              to="/informatie/toegankelijkheid"
              className="mt-2 inline-block text-sm underline"
            >
              {c.access.link}
            </LocalLink>
          </article>
        </section>

        {/* Opening hours */}
        <section className="mt-10 rounded-2xl border border-border bg-card p-5">
          <h3 className="font-semibold text-[color:var(--ink-forest)]">{c.hoursTitle}</h3>
          <p className="mt-2 text-sm text-foreground/90">{c.hoursValue}</p>
          <LocalLink to="/informatie/rooster" className="mt-2 inline-block text-sm underline">
            {c.hoursLink}
          </LocalLink>
        </section>

        {/* Contact form + options */}
        <div className="mt-16 grid gap-10 lg:grid-cols-5 md:mt-20">
          <form
            onSubmit={submit}
            className="lg:col-span-3 rounded-3xl border border-border bg-card p-8 shadow-sm"
          >
            <h2 className="font-serif text-2xl text-[color:var(--ink-forest)]">
              {t("contact.title")}
            </h2>
            <div className="mt-6 grid gap-5">
              {(topics.data ?? []).length > 1 && (
                <label className="block">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                    {c.topicLabel}
                  </span>
                  <select
                    value={inbox}
                    onChange={(e) => setInbox(e.target.value)}
                    className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-[color:var(--color-terracotta)]"
                  >
                    {(topics.data ?? []).map((o) => (
                      <option key={o.key} value={o.key}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label className="block">
                <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                  {t("contact.form.name")}
                </span>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-[color:var(--color-terracotta)]"
                />
              </label>
              <label className="block">
                <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                  {t("contact.form.email")}
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-[color:var(--color-terracotta)]"
                />
              </label>
              <label className="block">
                <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                  {t("contact.form.message")}
                </span>
                <textarea
                  required
                  rows={6}
                  value={msg}
                  onChange={(e) => setMsg(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-border bg-background p-4 text-sm outline-none focus:border-[color:var(--color-terracotta)]"
                />
              </label>
              <button
                type="submit"
                disabled={busy}
                className="mt-2 inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-[color:var(--surface-forest)] px-8 text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--color-cream)] hover:bg-[color:var(--color-terracotta)] transition-colors disabled:opacity-60"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {t("contact.form.send")}
              </button>
              {sent && (
                <p className="text-sm text-[color:var(--color-sage)]">{t("contact.form.sent")}</p>
              )}
              {failed && (
                <p className="text-sm text-destructive">
                  Versturen lukte niet. Mail ons gerust rechtstreeks op {contactEmail}.
                </p>
              )}
            </div>
          {hp.field}
      </form>

          {/* Side info */}
          <aside className="lg:col-span-2 space-y-4">
            <InfoRow
              icon={<Phone className="h-5 w-5" />}
              label={t("contact.phone")}
              value={phoneDisplay}
              href={`tel:${phoneHref}`}
            />
            <InfoRow
              icon={<Mail className="h-5 w-5" />}
              label="E-mail"
              value={contactEmail}
              href={`mailto:${contactEmail}`}
            />
            <InfoRow
              icon={<Clock className="h-5 w-5" />}
              label={t("contact.hours")}
              value={t("contact.hours.value")}
            />
            <div className="grid grid-cols-2 gap-3 pt-2">
              <a
                href={`https://wa.me/${PHONE.replace(/\\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-4 text-sm font-semibold text-white hover:opacity-90"
              >
                <MessageCircle className="h-4 w-4" />
                {t("contact.whatsapp")}
              </a>
              <a
                href={`sms:${PHONE}`}
                className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 text-sm font-semibold hover:border-[color:var(--color-terracotta)]"
              >
                <MessageCircle className="h-4 w-4" />
                {t("contact.sms")}
              </a>
            </div>
            <a
              href={`mailto:${contactEmail}?subject=${encodeURIComponent(t("contact.callback"))}`}
              className="mt-2 flex min-h-[52px] items-center justify-center rounded-2xl border border-dashed border-[color:var(--color-sage)] px-4 text-sm font-medium text-[color:var(--ink-forest)] hover:bg-[color:var(--color-sage)]/10"
            >
              {t("contact.callback")}
            </a>
          </aside>
        </div>
      </main>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  const inner = (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4">
      <span className="grid h-10 w-10 place-items-center rounded-full bg-[color:var(--color-sage)]/15 text-[color:var(--ink-forest)]">
        {icon}
      </span>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
  return href ? (
    <a href={href} className="block hover:opacity-90">
      {inner}
    </a>
  ) : (
    inner
  );
}
