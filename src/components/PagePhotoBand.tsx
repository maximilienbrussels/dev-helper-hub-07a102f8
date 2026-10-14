import type React from "react";
import { useQuery } from "@tanstack/react-query";

import { lib } from "@/lib/photo-library";
import { focusFor, isBandReady } from "@/lib/photo-focus";

import { handleImageError } from "@/lib/image-fallback";
import { fetchPageContent } from "@/lib/page-content.functions";
import type { PageContentKey } from "@/lib/page-content";
import fotoMoestuin from "@/assets/foto/foto-moestuin-bakken.jpg.asset.json";
import fotoErf from "@/assets/foto/foto-erf-pad.jpg.asset.json";
import fotoWeideStal from "@/assets/foto/foto-weide-stal.jpg.asset.json";
import fotoGeitMadeliefjes from "@/assets/foto/foto-geit-madeliefjes.jpg.asset.json";
import fotoGeitenGroep from "@/assets/foto/foto-geiten-groep.jpg.asset.json";
import fotoSchapen from "@/assets/foto/foto-schapen.jpg.asset.json";
import fotoEzel from "@/assets/foto/foto-ezel.jpg.asset.json";
import fotoPauw from "@/assets/foto/foto-pauw-pronkend.jpg.asset.json";
import fotoPonyBoom from "@/assets/foto/foto-pony-boom.jpg.asset.json";
import fotoPonyHerfst from "@/assets/foto/foto-pony-herfst.jpg.asset.json";
import fotoAlpacasRust from "@/assets/foto/foto-alpacas-rust.jpg.asset.json";
import fotoAlpacasWeide from "@/assets/foto/foto-alpacas-weide.jpg.asset.json";
import fotoTrojaansPaard from "@/assets/foto/foto-trojaans-paard.jpg.asset.json";
import fotoBeeldFontein from "@/assets/foto/foto-beeld-fontein.jpg.asset.json";

type Band = { src: string; desktop: string; mobile: string };

/**
 * Eén foto uit de bibliotheek voor de brede band. We nemen de gevraagde foto
 * alleen als die liggend en scherp is; anders de eerste foto uit dezelfde map
 * die dat wél is, zodat er nooit een kop half wordt afgesneden.
 */
function band(folder: string, index: number, fallback: string, desktop: string, mobile: string): Band {
  const photos = lib(folder);
  const wanted = photos[index]?.src;
  const src =
    (wanted && isBandReady(wanted) ? wanted : photos.find((p) => isBandReady(p.src))?.src) ??
    wanted ??
    fallback;
  const [autoDesktop, autoMobile] = focusFor(src);
  return { src, desktop: autoDesktop || desktop, mobile: autoMobile || mobile };
}

/**
 * Sfeerbanden per pagina: telkens een vaste, mooie foto uit de bibliotheek,
 * met een eigen beelduitsnede voor gsm (smal, hoger zwaartepunt) en desktop.
 */
export const FARM_BANDS: Record<string, Band> = {
  moestuin: band("tuin/moestuin", 0, fotoMoestuin.url, "50% 45%", "50% 55%"),
  erf: band("erf/gebouwen", 0, fotoErf.url, "50% 45%", "50% 55%"),
  "weide-stal": band("natuur/paden", 0, fotoWeideStal.url, "50% 45%", "50% 50%"),
  "geit-madeliefjes": band("dieren/geiten", 0, fotoGeitMadeliefjes.url, "50% 40%", "50% 45%"),
  geiten: band("dieren/geiten", 1, fotoGeitenGroep.url, "50% 40%", "50% 45%"),
  schapen: band("dieren/schapen", 0, fotoSchapen.url, "50% 40%", "50% 45%"),
  ezel: band("dieren/ezels", 0, fotoEzel.url, "50% 35%", "50% 40%"),
  pauw: band("dieren/pauwen", 0, fotoPauw.url, "50% 40%", "50% 45%"),
  pony: band("dieren/ponys", 0, fotoPonyBoom.url, "50% 40%", "50% 45%"),
  "pony-herfst": band("dieren/ponys", 2, fotoPonyHerfst.url, "50% 40%", "50% 45%"),
  "alpacas-rust": band("dieren/alpacas", 0, fotoAlpacasRust.url, "50% 35%", "50% 40%"),
  "alpacas-weide": band("dieren/alpacas", 4, fotoAlpacasWeide.url, "50% 40%", "50% 45%"),
  "trojaans-paard": band("erf/trojaans-paard", 0, fotoTrojaansPaard.url, "50% 45%", "50% 50%"),
  fontein: band("natuur/vijver", 0, fotoBeeldFontein.url, "50% 45%", "50% 50%"),
  kinderen: band("bezoek/kinderen", 0, fotoWeideStal.url, "50% 40%", "50% 45%"),
  speeltuin: band("bezoek/speeltuin", 0, fotoErf.url, "50% 45%", "50% 50%"),
  educatie: band("educatie/borden-en-workshops", 0, fotoErf.url, "50% 45%", "50% 50%"),
  vijver: band("natuur/vijver", 3, fotoBeeldFontein.url, "50% 45%", "50% 50%"),
  boomgaard: band("tuin/boomgaard", 0, fotoMoestuin.url, "50% 45%", "50% 50%"),
  kippen: band("dieren/kippen", 0, fotoErf.url, "50% 40%", "50% 45%"),
  gebouwen: band("erf/gebouwen", 4, fotoErf.url, "50% 45%", "50% 50%"),
};

/** Vroegere API: alleen de URL per sleutel. */
export const FARM_PHOTOS: Record<string, string> = Object.fromEntries(
  Object.entries(FARM_BANDS).map(([k, v]) => [k, v.src]),
);

const KEYS = Object.keys(FARM_BANDS);

/** Deterministische keuze zodat een pagina altijd dezelfde foto houdt. */
function bandFor(seed: string): Band {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) % 9973;
  return FARM_BANDS[KEYS[h % KEYS.length]!]!;
}

/**
 * Sfeerband met een echte foto van de boerderij, bedoeld direct onder de
 * NavHeader. Puur visueel: de paginatitel blijft in de <main> staan.
 */
export function PagePhotoBand({
  photo,
  seed,
  alt = "",
  height = "md",
  pageKey,
}: {
  /** Pagina in het portaal: een foto uit de mediabibliotheek krijgt voorrang. */
  pageKey?: PageContentKey;
  /** Sleutel uit FARM_PHOTOS. */
  photo?: keyof typeof FARM_PHOTOS | string;
  /** Alternatief: laat de foto bepalen door een vaste sleutel (bv. paginanaam). */
  seed?: string;
  alt?: string;
  height?: "sm" | "md";
}) {
  // Beheerde hero-afbeelding uit het portaal; anders de vaste boerderijfoto.
  const { data: managed } = useQuery({
    queryKey: ["page-content", pageKey],
    queryFn: () => fetchPageContent({ data: { key: pageKey as PageContentKey } }),
    enabled: Boolean(pageKey),
    staleTime: 5 * 60 * 1000,
  });
  const chosen =
    (photo ? FARM_BANDS[photo as string] : undefined) ??
    bandFor(seed ?? String(photo ?? "boerderij"));
  const src = managed?.hero.imageUrl || chosen.src;
  // Beheerde foto uit het portaal: bereken de uitsnede uit de foto zelf.
  const [posDesktop, posMobile] = managed?.hero.imageUrl
    ? focusFor(managed.hero.imageUrl)
    : [chosen.desktop, chosen.mobile];

  return (
    <div
      className={`relative w-full overflow-hidden bg-[color:var(--color-surface-forest)] ${
        height === "sm" ? "h-40 md:h-56" : "h-56 md:h-80"
      }`}
      style={
        {
          "--band-pos-mobile": posMobile,
          "--band-pos-desktop": posDesktop,
        } as React.CSSProperties
      }
    >
      <img
        src={src}
        alt={alt}
        loading="eager"
        fetchPriority="high"
        decoding="sync"
        onError={handleImageError}
        className="h-full w-full object-cover object-[var(--band-pos-mobile)] md:object-[var(--band-pos-desktop)]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent" />
    </div>
  );

}
