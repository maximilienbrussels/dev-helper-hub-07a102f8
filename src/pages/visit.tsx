import { PagePhotoBand } from "@/components/PagePhotoBand";
import { PhotoCarousel } from "@/components/PhotoCarousel";
import { PHOTO_ALBUMS } from "@/lib/photo-albums";
import { mergedCarousel, useAlbumPhotos } from "@/lib/use-album-photos";

const KIDS_TITLE: Record<Lang, string> = {
  nl: "Kinderen, speeltuin & workshops",
  fr: "Enfants, plaine de jeux & ateliers",
  en: "Children, playground & workshops",
};
import { LocalLink } from "@/components/LocalLink";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { OpeningHoursBadge } from "@/components/OpeningHoursBadge";
import { NavHeader } from "@/components/NavHeader";
import { useT } from "@/lib/i18n";
import {
  getHours,
  getOrganisation,
  fallbackPublicHours,
} from "@/lib/data.functions";
import { pathFor, type Lang } from "@/lib/routes-i18n";

export const orgQO = queryOptions({ queryKey: ["org"], queryFn: () => getOrganisation() });
export const hoursQO = queryOptions({ queryKey: ["hours"], queryFn: () => getHours() });

const COPY: Record<
  Lang,
  {
    title: string;
    lede: string;
    hours: string;
    address: string;
    price: string;
    priceBody: string[];
    transport: string;
    transportBody: string[];
    access: string;
    accessBody: string[];
    animalsCta: string;
    contactCta: string;
    openNow: string;
    closedNow: string;
    photos: string;
  }
> = {
  nl: {
    title: "Bezoek & info",
    lede: "Alles wat je moet weten voor je langskomt: uren, toegang, prijzen en bereikbaarheid.",
    hours: "Openingsuren",
    address: "Adres",
    price: "Prijzen",
    priceBody: [
      "De boerderij is gratis toegankelijk tijdens de openingsuren.",
      "Voor begeleide bezoeken, workshops en schoolbezoeken gelden aparte tarieven — sociale tarieven zijn mogelijk.",
    ],
    transport: "Bereikbaarheid",
    transportBody: [
      "Metro Yser/IJzer (lijn 2 en 6) op 8 minuten wandelen.",
      "Tram 51 en bus 47, 88 stoppen aan het Maximiliaanpark.",
      "Fietsenstalling aan de ingang; parkeren in de buurt is beperkt.",
    ],
    access: "Toegankelijkheid",
    accessBody: [
      "De hoofdpaden zijn rolstoeltoegankelijk.",
      "Honden zijn niet toegelaten omwille van de dieren.",
      "Er is een toilet en een luiertafel aan het onthaal.",
    ],
    animalsCta: "Ontdek onze dieren",
    contactCta: "Een vraag? Contacteer ons",
    photos: "Sfeerbeelden van het erf",
    openNow: "Nu open",
    closedNow: "Nu gesloten",
  },
  fr: {
    title: "Visite & infos",
    lede: "Tout ce qu'il faut savoir avant de venir : horaires, accès, tarifs et transports.",
    hours: "Horaires d'ouverture",
    address: "Adresse",
    price: "Tarifs",
    priceBody: [
      "La ferme est accessible gratuitement pendant les heures d'ouverture.",
      "Les visites guidées, ateliers et visites scolaires ont des tarifs spécifiques — un tarif social est possible.",
    ],
    transport: "Accès",
    transportBody: [
      "Métro Yser (lignes 2 et 6) à 8 minutes à pied.",
      "Tram 51 et bus 47, 88 s'arrêtent au parc Maximilien.",
      "Parking vélos à l'entrée ; le stationnement voiture est limité.",
    ],
    access: "Accessibilité",
    accessBody: [
      "Les allées principales sont accessibles en fauteuil roulant.",
      "Les chiens ne sont pas admis, pour le bien-être des animaux.",
      "Toilettes et table à langer à l'accueil.",
    ],
    animalsCta: "Découvrez nos animaux",
    contactCta: "Une question ? Contactez-nous",
    photos: "Images de la ferme",
    openNow: "Ouvert maintenant",
    closedNow: "Fermé actuellement",
  },
  en: {
    title: "Visit & info",
    lede: "Everything you need before you come: hours, access, prices and transport.",
    hours: "Opening hours",
    address: "Address",
    price: "Prices",
    priceBody: [
      "The farm is free to visit during opening hours.",
      "Guided visits, workshops and school visits have separate rates — reduced rates are available.",
    ],
    transport: "Getting here",
    transportBody: [
      "Metro Yser (lines 2 and 6), an 8-minute walk.",
      "Tram 51 and buses 47, 88 stop at Maximilien Park.",
      "Bicycle parking at the entrance; car parking nearby is limited.",
    ],
    access: "Accessibility",
    accessBody: [
      "The main paths are wheelchair accessible.",
      "Dogs are not allowed, for the wellbeing of the animals.",
      "Toilets and a baby-changing table at reception.",
    ],
    animalsCta: "Meet our animals",
    contactCta: "A question? Contact us",
    photos: "Photos of the farmyard",
    openNow: "Open now",
    closedNow: "Currently closed",
  },
};

const DAYS: Record<Lang, string[]> = {
  nl: ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"],
  fr: ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
};

export function VisitPage() {
  const { lang, tx } = useT();
  const source = COPY[lang];
  const c = {
    ...source,
    title: tx(source.title),
    lede: tx(source.lede),
    hours: tx(source.hours),
    address: tx(source.address),
    price: tx(source.price),
    priceBody: source.priceBody.map(tx),
    transport: tx(source.transport),
    transportBody: source.transportBody.map(tx),
    access: tx(source.access),
    accessBody: source.accessBody.map(tx),
    animalsCta: tx(source.animalsCta),
    contactCta: tx(source.contactCta),
    photos: tx(source.photos),
  };
  const { data: org } = useSuspenseQuery(orgQO);
  const { data: hours } = useSuspenseQuery(hoursQO);
  const managed = useAlbumPhotos();
  const rows = (hours ?? []).filter((h) => h.audience_type === "public");
  const schedule = rows.length > 0 ? rows : fallbackPublicHours();

  return (
    <div className="min-h-screen bg-background">
      <NavHeader />
      <PagePhotoBand photo="weide-stal" />
      <main className="mx-auto w-full max-w-3xl px-5 py-10">
        <h1 className="font-serif text-4xl text-foreground">{c.title}</h1>
        <p className="mt-3 text-muted-foreground">{c.lede}</p>

        <section className="mt-8 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-serif text-2xl text-foreground">{c.hours}</h2>
            <OpeningHoursBadge />
          </div>
          <ul className="mt-4 divide-y divide-border text-sm">
            {schedule.map((h) => (
              <li key={`${h.day_of_week}-${h.open_time}`} className="flex justify-between py-2">
                <span className="text-muted-foreground">{tx(DAYS[lang][h.day_of_week] ?? "")}</span>
                <span className="font-medium text-foreground">
                  {String(h.open_time).slice(0, 5)} – {String(h.close_time).slice(0, 5)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-card p-5">
          <h2 className="font-serif text-2xl text-foreground">{c.address}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {org?.street} {org?.house_number}, {org?.postal_code} {org?.city}
          </p>
        </section>

        {[
          { title: c.price, body: c.priceBody },
          { title: c.transport, body: c.transportBody },
          { title: c.access, body: c.accessBody },
        ].map((block) => (
          <section key={block.title} className="mt-6 rounded-2xl border border-border bg-card p-5">
            <h2 className="font-serif text-2xl text-foreground">{block.title}</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {block.body.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>
        ))}

        <section className="mt-10">
          <PhotoCarousel
            title={tx(KIDS_TITLE[lang])}
            photos={mergedCarousel(
              [...PHOTO_ALBUMS.kinderen!, ...PHOTO_ALBUMS.speeltuin!, ...PHOTO_ALBUMS.educatie!],
              managed,
              ["kinderen", "speeltuin", "educatie"],
              lang,
            )}
            autoPlay
          />
        </section>

        <section className="mt-10">
          <PhotoCarousel
            title={c.photos}
            photos={mergedCarousel(
              [
                ...PHOTO_ALBUMS.moestuin!,
                ...PHOTO_ALBUMS.boomgaard!,
                ...PHOTO_ALBUMS.erf!,
                ...PHOTO_ALBUMS.vijver!,
                ...PHOTO_ALBUMS.paden!,
              ],
              managed,
              ["moestuin", "boomgaard", "erf", "vijver", "paden"],
              lang,
            )}
          />
        </section>


        <div className="mt-8 flex flex-wrap gap-3">
          <LocalLink
            to={pathFor("animals", lang)}
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            {c.animalsCta}
          </LocalLink>
          <LocalLink
            to={pathFor("contact", lang)}
            className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground"
          >
            {c.contactCta}
          </LocalLink>
        </div>
      </main>
    </div>
  );
}
