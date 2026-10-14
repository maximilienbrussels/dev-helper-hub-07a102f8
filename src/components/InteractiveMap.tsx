import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

import planFermeAsset from "@/assets/plan-ferme.png.asset.json";
import {
  ENTRANCE,
  FARM_MAP_DATA,
  zoneDescription,
  zoneName,
  type FarmZone,
} from "@/data/farmMapDataset";
import { useT } from "@/lib/i18n";
import { pathFor } from "@/lib/routes-i18n";
import { useMaximChatControl } from "@/lib/maxim-chat";
import { handleImageError } from "@/lib/image-fallback";

const MAP_URL = planFermeAsset.url;

const COPY = {
  nl: {
    title: "Interactieve plattegrond",
    hint: "Tik op een nummer om de zone te ontdekken.",
    passport: "📖 Bekijk dierenpaspoort",
    talk: "💬 Praat met dit dier",
    talkGarden: "💬 Vraag Maxim meer",
    close: "Sluiten",
    zone: "Zone",
    legendAnimal: "Dieren",
    legendGarden: "Tuinen",
    legendFacility: "Voorzieningen",
    entrance: "Ingang",
  },
  fr: {
    title: "Plan interactif",
    hint: "Touchez un numéro pour découvrir la zone.",
    passport: "📖 Voir le passeport animal",
    talk: "💬 Parler à cet animal",
    talkGarden: "💬 En savoir plus avec Maxim",
    close: "Fermer",
    zone: "Zone",
    legendAnimal: "Animaux",
    legendGarden: "Jardins",
    legendFacility: "Installations",
    entrance: "Entrée",
  },
  en: {
    title: "Interactive map",
    hint: "Tap a number to discover the zone.",
    passport: "📖 View animal passport",
    talk: "💬 Talk to this animal",
    talkGarden: "💬 Ask Maxim more",
    close: "Close",
    zone: "Zone",
    legendAnimal: "Animals",
    legendGarden: "Gardens",
    legendFacility: "Facilities",
    entrance: "Entrance",
  },
} as const;

const PIN_CLASS: Record<FarmZone["category"], string> = {
  animal: "bg-[color:var(--color-terracotta)] text-white",
  garden: "bg-emerald-600 text-white",
  facility: "bg-amber-500 text-amber-950",
};

/**
 * Officiële plattegrond met klikbare zones (1–15) en de bezoekersingang.
 * Een zone opent een kaartje met paspoort- en chatknop.
 */
export function InteractiveMap({ className = "" }: { className?: string }) {
  const { lang } = useT();
  const c = COPY[lang];
  const navigate = useNavigate();
  const control = useMaximChatControl();
  const [active, setActive] = useState<FarmZone | null>(null);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setActive(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  const openPassport = (z: FarmZone) => {
    setActive(null);
    void navigate({ to: pathFor("animals", lang, z.slug) as never });
  };

  const talk = (z: FarmZone) => {
    setActive(null);
    const prompt = {
      nl: `Vertel me meer over ${zoneName(z, "nl")} (zone ${z.id}).`,
      fr: `Parle-moi de ${zoneName(z, "fr")} (zone ${z.id}).`,
      en: `Tell me more about ${zoneName(z, "en")} (zone ${z.id}).`,
    }[lang];
    if (z.category === "animal") {
      void navigate({
        to: pathFor("animals", lang, z.slug) as never,
        search: { persona: z.slug } as never,
      });
      return;
    }
    control?.requestOpen(prompt);
  };

  return (
    <section className={`relative ${className}`} aria-label={c.title}>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-serif text-2xl text-foreground">{c.title}</h2>
          <p className="text-sm text-muted-foreground">{c.hint}</p>
        </div>
        <ul className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <li className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-[color:var(--color-terracotta)]" />{c.legendAnimal}</li>
          <li className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-emerald-600" />{c.legendGarden}</li>
          <li className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-amber-500" />{c.legendFacility}</li>
        </ul>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-border bg-[color:var(--color-surface-forest)]/10 shadow-sm">
        <img
          src={MAP_URL}
          onError={handleImageError}
          alt={c.title}
          width={1600}
          height={1100}
          loading="lazy"
          className="block h-auto w-full select-none"
          draggable={false}
        />

        {/* Bezoekersingang */}
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${ENTRANCE.mapCoords.x}%`, top: `${ENTRANCE.mapCoords.y}%` }}
        >
          <div className="relative flex flex-col items-center">
            <span className="absolute inset-0 -m-2 animate-ping rounded-full bg-emerald-400/50" aria-hidden />
            <span className="relative grid size-9 place-items-center rounded-full border-2 border-white bg-emerald-600 text-base shadow-lg">🚪</span>
            <span className="mt-1 hidden whitespace-nowrap rounded-full bg-emerald-700 px-2 py-0.5 text-[10px] font-semibold text-white shadow sm:block">
              {lang === "fr" ? ENTRANCE.ctaFr : lang === "en" ? ENTRANCE.ctaEn : ENTRANCE.ctaNl}
            </span>
          </div>
        </div>

        {FARM_MAP_DATA.map((z) => (
          <button
            key={z.id}
            type="button"
            onClick={() => setActive(z)}
            aria-label={`${c.zone} ${z.id}: ${zoneName(z, lang)}`}
            title={zoneName(z, lang)}
            className={`absolute grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white text-xs font-bold shadow-md transition-transform hover:scale-110 focus-visible:scale-110 focus-visible:outline-none sm:size-9 sm:text-sm ${PIN_CLASS[z.category]} ${active?.id === z.id ? "scale-125 ring-4 ring-white/70" : ""}`}
            style={{ left: `${z.mapCoords.x}%`, top: `${z.mapCoords.y}%` }}
          >
            {z.id}
          </button>
        ))}

        {active ? (
          <div
            className="absolute inset-0 z-10 flex items-end justify-center bg-black/30 p-3 backdrop-blur-[2px] sm:items-center"
            onClick={() => setActive(null)}
            role="dialog"
            aria-modal="true"
            aria-label={zoneName(active, lang)}
          >
            <div
              className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[color:var(--color-surface-forest)]/10 text-2xl">
                  {active.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    {c.zone} {active.id}
                  </p>
                  <h3 className="font-serif text-xl leading-tight">{zoneName(active, lang)}</h3>
                  {active.species ? (
                    <p className="text-xs italic text-muted-foreground">{active.species}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => setActive(null)}
                  aria-label={c.close}
                  className="rounded-full p-1 text-muted-foreground hover:bg-muted"
                >
                  <X className="size-4" />
                </button>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-foreground/90">
                {zoneDescription(active, lang)}
              </p>
              {active.names?.length ? (
                <p className="mt-2 text-sm">
                  <span className="text-muted-foreground">👋 </span>
                  {active.names.join(", ")}
                </p>
              ) : null}
              <div className="mt-4 flex flex-col gap-2">
                {active.category === "animal" ? (
                  <button
                    type="button"
                    onClick={() => openPassport(active)}
                    className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-[color:var(--color-terracotta)] px-4 text-sm font-semibold text-white hover:bg-[color:var(--color-terracotta-bright)]"
                  >
                    {c.passport}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => talk(active)}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-border px-4 text-sm font-semibold text-foreground hover:bg-muted"
                >
                  {active.category === "animal" ? c.talk : c.talkGarden}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
