import { useEffect, useMemo, useRef, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ChevronDown, Volume2 } from "lucide-react";

import { NavHeader } from "@/components/NavHeader";
import { LocalLink } from "@/components/LocalLink";
import { InteractiveMap } from "@/components/InteractiveMap";
import { useT } from "@/lib/i18n";
import { animalSlug, pathFor, speciesIn, type Lang } from "@/lib/routes-i18n";
import { imageForSpecies } from "@/lib/animal-images";
import { galleryFor, passportFor, speciesKey } from "@/lib/animal-passport";
import { handleImageError } from "@/lib/image-fallback";
import { useMaximChatControl } from "@/lib/maxim-chat";
import {
  FARM_MAP_DATA,
  proximityLabel,
  zoneBySlug,
  zoneDietRules,
  zoneForSpecies,
  zoneName,
  type FarmZone,
} from "@/data/farmMapDataset";
import { animalsQO } from "@/pages/animals";
import type { AnimalDTO } from "@/lib/data.functions";

const COPY = {
  nl: {
    back: "Terug naar alle dieren",
    status: "Nu te zien op de boerderij",
    zoneStatus: (z: string) => `Nu te zien bij ${z}`,
    listen: "🔊 Beluister het geluid",
    passport: "Het paspoort",
    breed: "Diersoort & ras",
    names: "Namen / bewoners",
    location: "Locatie op de plattegrond",
    zone: "Zone",
    character: "Karakter",
    feeding: "Voedingsregels",
    feedingLead: "Belangrijk voor elke bezoeker",
    chatTitle: (n: string) => `💬 Stel je vragen rechtstreeks aan ${n}!`,
    chatBody: (n: string) =>
      `Mijn AI-gids heeft de stem van ${n} aangenomen. Vraag wat ik graag eet, waar ik slaap of hoe oud ik ben!`,
    chatBtn: (n: string) => `💬 Open gesprek met ${n}`,
    facts: "Weetjes & spelletjes",
    factsLead: "Voor kinderen en schoolgroepen",
    gallery: "Foto's",
    adopt: (n: string) => `💚 Word Peter of Meter van ${n}`,
    adoptBody: "Met een vast maandelijks bedrag help je met voer, verzorging en de dierenarts. Je krijgt een officieel certificaat.",
    adoptBtn: "Ontdek het peterschap",
    qrBadge: "📍 Je staat nu bij de weide!",
    qrPhoto: "📸 Maak een foto & stuur naar Maxim",
    qrPrompt: (n: string) => `Ik sta nu bij ${n} en heb deze foto gemaakt. Wat zie je en wat kan je me vertellen?`,
    greet: (n: string, z?: FarmZone) =>
      `${z?.soundEmoji ?? ""} Hallo! Ik ben ${n}. ${z ? `Welkom bij zone ${z.id}!` : "Welkom op de boerderij!"}`,
    notFound: "Dit dier vonden we niet.",
    mapTitle: "Waar vind je mij?",
  },
  fr: {
    back: "Retour à tous les animaux",
    status: "À voir aujourd'hui à la ferme",
    zoneStatus: (z: string) => `À voir près de ${z}`,
    listen: "🔊 Écouter le cri",
    passport: "Le passeport",
    breed: "Espèce & race",
    names: "Noms / habitants",
    location: "Emplacement sur le plan",
    zone: "Zone",
    character: "Caractère",
    feeding: "Règles d'alimentation",
    feedingLead: "Important pour chaque visiteur",
    chatTitle: (n: string) => `💬 Pose tes questions directement à ${n} !`,
    chatBody: (n: string) =>
      `Mon guide IA a pris la voix de ${n}. Demande ce que j'aime manger, où je dors ou quel âge j'ai !`,
    chatBtn: (n: string) => `💬 Discuter avec ${n}`,
    facts: "Le saviez-vous ?",
    factsLead: "Pour les enfants et les groupes scolaires",
    gallery: "Photos",
    adopt: (n: string) => `💚 Devenez parrain ou marraine de ${n}`,
    adoptBody: "Un montant mensuel fixe aide à payer la nourriture, les soins et le vétérinaire. Vous recevez un certificat officiel.",
    adoptBtn: "Découvrir le parrainage",
    qrBadge: "📍 Vous êtes devant l'enclos !",
    qrPhoto: "📸 Prendre une photo & l'envoyer à Maxim",
    qrPrompt: (n: string) => `Je suis devant ${n} et j'ai pris cette photo. Que vois-tu et que peux-tu me raconter ?`,
    greet: (n: string, z?: FarmZone) =>
      `${z?.soundEmoji ?? ""} Bonjour ! Je suis ${n}. ${z ? `Bienvenue à la zone ${z.id} !` : "Bienvenue à la ferme !"}`,
    notFound: "Animal introuvable.",
    mapTitle: "Où me trouver ?",
  },
  en: {
    back: "Back to all animals",
    status: "On the farm today",
    zoneStatus: (z: string) => `Now at ${z}`,
    listen: "🔊 Listen to the sound",
    passport: "The passport",
    breed: "Species & breed",
    names: "Names / residents",
    location: "Location on the map",
    zone: "Zone",
    character: "Character",
    feeding: "Feeding rules",
    feedingLead: "Important for every visitor",
    chatTitle: (n: string) => `💬 Ask ${n} your questions directly!`,
    chatBody: (n: string) =>
      `My AI guide has taken on the voice of ${n}. Ask what I like to eat, where I sleep or how old I am!`,
    chatBtn: (n: string) => `💬 Chat with ${n}`,
    facts: "Fun facts & games",
    factsLead: "For children and school groups",
    gallery: "Photos",
    adopt: (n: string) => `💚 Sponsor ${n}`,
    adoptBody: "A fixed monthly amount helps pay for feed, care and the vet. You receive an official certificate.",
    adoptBtn: "Discover sponsorship",
    qrBadge: "📍 You're standing at the meadow!",
    qrPhoto: "📸 Take a photo & send it to Maxim",
    qrPrompt: (n: string) => `I'm standing at ${n} and took this photo. What do you see and what can you tell me?`,
    greet: (n: string, z?: FarmZone) =>
      `${z?.soundEmoji ?? ""} Hello! I'm ${n}. ${z ? `Welcome to zone ${z.id}!` : "Welcome to the farm!"}`,
    notFound: "We couldn't find this animal.",
    mapTitle: "Where to find me?",
  },
} as const;

const SPEECH_LOCALE: Record<Lang, string> = { nl: "nl-BE", fr: "fr-BE", en: "en-GB" };

function speak(text: string, lang: Lang) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/[\p{Extended_Pictographic}]/gu, ""));
  u.lang = SPEECH_LOCALE[lang];
  u.rate = 0.95;
  window.speechSynthesis.speak(u);
}

type Resolved = { animal: AnimalDTO | null; zone: FarmZone | undefined };

/** Slug kan een dier zijn (ezel-boudewijn) of een zone (ezels). */
function resolveSlug(slug: string, animals: AnimalDTO[], lang: Lang): Resolved {
  const byAnimal = animals.find((a) => animalSlug(a, lang) === slug);
  if (byAnimal) return { animal: byAnimal, zone: zoneForSpecies(byAnimal.species) };
  const zone = zoneBySlug(slug);
  if (zone) {
    const animal =
      animals.find((a) => zone.names?.includes(a.name) && zone.speciesMatch?.test(a.species)) ??
      animals.find((a) => zone.speciesMatch?.test(a.species)) ??
      null;
    return { animal, zone };
  }
  return { animal: null, zone: undefined };
}

export function AnimalPassportPage({ slug }: { slug: string }) {
  const { lang } = useT();
  const c = COPY[lang];
  const { data: animals } = useSuspenseQuery(animalsQO);
  const { animal, zone } = useMemo(() => resolveSlug(slug, animals ?? [], lang), [slug, animals, lang]);
  const control = useMaximChatControl();

  // ?persona=… en ?source=qr worden client-side gelezen (geen hydration-mismatch).
  const [qrMode, setQrMode] = useState(false);
  const [personaRequested, setPersonaRequested] = useState(false);
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setQrMode(sp.get("source") === "qr");
    setPersonaRequested(sp.has("persona"));
  }, [slug]);

  const displayName = animal?.name ?? (zone ? zoneName(zone, lang) : slug);
  const species = animal?.species ?? zone?.species ?? "";
  const passport = passportFor(species || zone?.nameNl || "", lang);
  const gallery = galleryFor(speciesKey(species || zone?.nameNl || ""));
  const hero = animal?.image_url || imageForSpecies(species) || gallery[0];
  const greeting = c.greet(displayName, zone);

  // Chat in de rol van dit dier zetten; bij persona/QR meteen openen.
  useEffect(() => {
    if (!control || !animal) return;
    control.setAnimal({ id: animal.id, name: animal.name });
    return () => control.setAnimal(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animal?.id, animal?.name]);

  useEffect(() => {
    if (!control || !animal) return;
    if (personaRequested || qrMode) control.requestOpen();
    if (qrMode) speak(greeting, lang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personaRequested, qrMode, animal?.id]);

  const fileRef = useRef<HTMLInputElement>(null);
  const onPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f || !f.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") control?.requestOpen(c.qrPrompt(displayName), reader.result);
    };
    reader.readAsDataURL(f);
  };

  if (!animal && !zone) {
    return (
      <div className="min-h-screen bg-background">
        <NavHeader />
        <main className="mx-auto w-full max-w-3xl px-5 py-16 text-center">
          <h1 className="font-serif text-3xl text-foreground">{c.notFound}</h1>
          <LocalLink to={pathFor("animals", lang)} className="mt-4 inline-block text-sm text-primary underline">
            {c.back}
          </LocalLink>
        </main>
      </div>
    );
  }

  const names = zone?.names?.length
    ? Array.from(new Set([...(animal ? [animal.name] : []), ...zone.names]))
    : animal
      ? [animal.name]
      : [];
  const dietText = (zone && zoneDietRules(zone, lang)) || passport.feeding;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavHeader />
      <main className="mx-auto w-full max-w-5xl px-4 pb-16 md:px-8">
        <LocalLink to={pathFor("animals", lang)} className="mt-4 inline-block text-sm text-muted-foreground underline">
          ← {c.back}
        </LocalLink>

        {/* HERO */}
        <header className="relative mt-4 h-[360px] w-full overflow-hidden rounded-3xl md:h-[480px]">
          <img
            src={hero}
            onError={handleImageError}
            alt={`${displayName} — ${speciesIn(species, lang)}`}
            loading="eager"
            fetchPriority="high"
            className="absolute inset-0 h-full w-full object-cover object-[50%_40%]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-6 md:p-10">
            <span className="mb-2 w-fit rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
              {zone?.icon ?? "🐾"} {speciesIn(species, lang) || zoneName(zone!, lang)}
            </span>
            <h1 className="text-4xl font-extrabold text-white drop-shadow-md md:text-6xl">{displayName}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur-md">
                <span className="size-2 animate-pulse rounded-full bg-emerald-400" aria-hidden />
                {zone ? c.zoneStatus(zoneName(zone, lang)) : c.status}
              </span>
              {qrMode ? (
                <span className="inline-flex items-center rounded-full bg-amber-400 px-3 py-1.5 text-sm font-bold text-amber-950">
                  {c.qrBadge}
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => speak(`${zone?.soundEmoji ?? ""}. ${greeting}`, lang)}
                className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-white/40 bg-white/10 px-4 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/20"
              >
                <Volume2 className="size-4" aria-hidden />
                {c.listen}
                {zone?.soundEmoji ? <span className="text-white/90">· {zone.soundEmoji}</span> : null}
              </button>
            </div>
          </div>
        </header>

        {qrMode ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/40">
            <p className="text-sm font-medium text-amber-950 dark:text-amber-100">{c.qrBadge}</p>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onPhoto} />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex min-h-[44px] items-center rounded-full bg-amber-500 px-5 text-sm font-bold text-amber-950 hover:bg-amber-400"
            >
              {c.qrPhoto}
            </button>
          </div>
        ) : null}

        {/* PASPOORT */}
        <section className="mt-10">
          <h2 className="font-serif text-3xl">{c.passport}</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <PassportCard icon="🪪" label={c.breed}>
              <p className="text-lg font-semibold">{zone?.species ?? passport.breed}</p>
              <p className="text-sm italic text-muted-foreground">{passport.latin}</p>
            </PassportCard>
            <PassportCard icon="🎂" label={c.names}>
              {names.length ? (
                <ul className="flex flex-wrap gap-2">
                  {names.map((n) => (
                    <li key={n} className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100">
                      {n}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">—</p>
              )}
              <p className="mt-2 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{c.character}: </span>
                {passport.character}
              </p>
            </PassportCard>
            <PassportCard icon="📍" label={c.location}>
              {zone ? (
                <>
                  <p className="text-lg font-semibold">
                    {c.zone} {zone.id} · {zoneName(zone, lang)}
                  </p>
                  <p className="text-sm text-muted-foreground">{proximityLabel(zone, lang)}</p>
                  <MiniMap zone={zone} />
                </>
              ) : (
                <p className="text-sm text-muted-foreground">—</p>
              )}
            </PassportCard>
            <div className="rounded-2xl border-2 border-amber-400 bg-amber-50 p-4 shadow-sm dark:border-amber-600 dark:bg-amber-950/40">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-800 dark:text-amber-200">
                🚨 {c.feeding} · {c.feedingLead}
              </p>
              <p className="mt-2 text-base font-semibold leading-snug text-amber-950 dark:text-amber-50">{dietText}</p>
              {zone && zoneDietRules(zone, lang) ? (
                <p className="mt-2 text-sm text-amber-900/90 dark:text-amber-100/80">{passport.feeding}</p>
              ) : null}
            </div>
          </div>
        </section>

        {/* CHAT */}
        <section className="mt-10 rounded-2xl bg-gradient-to-r from-emerald-800 to-teal-900 p-6 text-white shadow-md md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold md:text-2xl">{c.chatTitle(displayName)}</h2>
              <p className="mt-2 max-w-xl text-sm text-emerald-100/90">{c.chatBody(displayName)}</p>
            </div>
            <button
              type="button"
              onClick={() => control?.requestOpen()}
              className="inline-flex min-h-[48px] shrink-0 items-center justify-center rounded-full bg-white px-6 text-sm font-bold text-emerald-900 shadow transition-transform hover:scale-[1.02]"
            >
              {c.chatBtn(displayName)}
            </button>
          </div>
        </section>

        {/* WEETJES */}
        <section className="mt-10">
          <h2 className="font-serif text-3xl">{c.facts}</h2>
          <p className="text-sm text-muted-foreground">{c.factsLead}</p>
          <div className="mt-4 grid gap-3">
            {passport.facts.slice(0, 3).map((f) => (
              <details key={f.q} className="group rounded-2xl border border-emerald-100 bg-card p-4 shadow-sm open:border-emerald-300 dark:border-emerald-900">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold">
                  <span>🧠 {f.q}</span>
                  <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-foreground/90">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* GALERIJ */}
        <section className="mt-10">
          <h2 className="font-serif text-3xl">{c.gallery}</h2>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {gallery.slice(0, 3).map((src, i) => (
              <img
                key={src + i}
                src={src}
                onError={handleImageError}
                alt={`${displayName} ${i + 1}`}
                loading="lazy"
                className="aspect-square w-full rounded-2xl object-cover"
              />
            ))}
          </div>
        </section>

        {/* PLATTEGROND */}
        {zone ? (
          <section className="mt-12">
            <InteractiveMap />
          </section>
        ) : null}

        {/* ADOPTIE */}
        <section className="mt-12 rounded-3xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-800 dark:bg-emerald-950/40 md:p-8">
          <h2 className="text-2xl font-bold text-emerald-950 dark:text-emerald-50">{c.adopt(displayName)}</h2>
          <p className="mt-2 max-w-2xl text-sm text-emerald-900/90 dark:text-emerald-100/90">{c.adoptBody}</p>
          <LocalLink
            to={pathFor("support", lang, { nl: "adopteer", fr: "parrainer", en: "sponsor" }[lang])}
            className="mt-4 inline-flex min-h-[48px] items-center rounded-full bg-emerald-700 px-6 text-sm font-bold text-white hover:bg-emerald-800"
          >
            {c.adoptBtn}
          </LocalLink>
        </section>
      </main>
    </div>
  );
}

function PassportCard({ icon, label, children }: { icon: string; label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-emerald-100 bg-card p-4 shadow-sm dark:border-emerald-900">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
        {icon} {label}
      </p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

/** Schematische mini-kaart: alle zones grijs, deze zone uitgelicht. */
function MiniMap({ zone }: { zone: FarmZone }) {
  return (
    <div className="relative mt-3 aspect-[16/10] w-full overflow-hidden rounded-xl border border-border bg-emerald-50 dark:bg-emerald-950/40">
      {FARM_MAP_DATA.map((z) => (
        <span
          key={z.id}
          className={
            "absolute -translate-x-1/2 -translate-y-1/2 rounded-full " +
            (z.id === zone.id
              ? "z-10 grid size-7 place-items-center bg-[color:var(--color-terracotta)] text-[11px] font-bold text-white ring-4 ring-[color:var(--color-terracotta)]/30"
              : "size-2 bg-emerald-300 dark:bg-emerald-700")
          }
          style={{ left: `${z.mapCoords.x}%`, top: `${z.mapCoords.y}%` }}
          aria-hidden
        >
          {z.id === zone.id ? z.id : null}
        </span>
      ))}
      <span className="absolute -translate-x-1/2 -translate-y-1/2 text-sm" style={{ left: "74%", top: "44%" }} aria-hidden>
        🚪
      </span>
    </div>
  );
}
