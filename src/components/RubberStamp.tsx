import { useMemo } from "react";
import { Sprout } from "lucide-react";
import { pseudoRandom, stampJitter } from "@/lib/seeded-random";

/**
 * Realistische rubberen inktstempel in donkergroen.
 * Doorschijnend (multiply + opacity), licht gekanteld en met een korrelige
 * inkt-maskering zodat de papierstructuur er subtiel doorheen schemert.
 *
 * Zonder expliciete `variant` kiest de stempel een variant op basis van de
 * `seed` (bv. het pas- of gebruikers-ID) en krijgt hij een kleine afwijking in
 * stand, positie, schaal en inktdruk. Zelfde seed => altijd dezelfde afdruk.
 */
export type StampVariant = "default" | "a" | "b" | "c" | "d" | "e";

export const STAMP_VARIANTS: { id: StampVariant; label: string; hint: string }[] = [
  { id: "default", label: "Huidig", hint: "Middenkorrel, -2,5\u00b0 kanteling" },
  { id: "a", label: "Licht gedrukt", hint: "Fijne korrel, -1,5\u00b0, lichtere inkt" },
  { id: "b", label: "Stevig gestempeld", hint: "Grove korrel, -4\u00b0, volle inkt" },
  { id: "c", label: "Scheef & droog", hint: "+6,5\u00b0, uitgedroogde zijde" },
  { id: "d", label: "Bijna recht, verweerd", hint: "-0,75\u00b0, vlekkerige dekking" },
  { id: "e", label: "Half afgerold", hint: "+3\u00b0, inkt wegvallend aan de rand" },
];

const RANDOM_POOL: StampVariant[] = ["default", "a", "b", "c", "d", "e"];

export function RubberStamp({
  className = "",
  variant,
  /** Uniek ID van de pas/het item; bepaalt de vaste, unieke afdruk. */
  seed,
  /** Extra afwijking (stand/positie/druk); standaard aan. */
  jitter = true,
}: {
  className?: string;
  variant?: StampVariant;
  seed?: string;
  jitter?: boolean;
}) {
  const { picked, style } = useMemo(() => {
    // Zonder seed: eenmalig willekeurig, daarna stabiel binnen deze render-boom.
    const key = seed ?? Math.random().toString(36).slice(2);
    const picked =
      variant ??
      RANDOM_POOL[
        Math.min(
          RANDOM_POOL.length - 1,
          Math.floor(pseudoRandom(key + "var", 0, RANDOM_POOL.length)),
        )
      ];
    const j = stampJitter(key);
    const style = jitter
      ? ({
          "--stamp-jitter-rot": `${j.rotate.toFixed(2)}deg`,
          "--stamp-dx": `${j.offsetX.toFixed(1)}px`,
          "--stamp-dy": `${j.offsetY.toFixed(1)}px`,
          "--stamp-jitter-scale": j.scale.toFixed(3),
          "--stamp-opacity": j.opacity.toFixed(3),
        } as React.CSSProperties)
      : undefined;
    return { picked, style };
  }, [variant, jitter, seed]);

  return (
    <div
      style={style}
      className={
        "rubber-stamp pointer-events-none select-none " +
        (picked === "default" ? "" : `stamp-${picked} `) +
        className
      }
      aria-label="Gevalideerd aan het onthaal"
    >
      <svg viewBox="0 0 200 200" className="h-full w-full">
        <defs>
          <path id="stamp-arc-top" d="M 32,100 A 68,68 0 0 1 168,100" fill="none" />
          <path id="stamp-arc-bottom" d="M 38,100 A 62,62 0 0 0 162,100" fill="none" />
        </defs>

        {/* Dubbele buitenrand */}
        <circle cx="100" cy="100" r="94" fill="none" stroke="#1E3A2B" strokeWidth="4.5" />
        <circle cx="100" cy="100" r="86" fill="none" stroke="#1E3A2B" strokeWidth="2" />

        <text
          fill="#1E3A2B"
          fontSize="14"
          letterSpacing="1.6"
          fontWeight="700"
          style={{ fontFamily: "var(--font-certificate, serif)" }}
        >
          <textPath href="#stamp-arc-top" startOffset="50%" textAnchor="middle">
            ONTHAAL STADSBOERDERIJ
          </textPath>
        </text>
        <text
          fill="#1E3A2B"
          fontSize="11"
          letterSpacing="1.8"
          fontWeight="700"
          style={{ fontFamily: "var(--font-certificate, serif)" }}
        >
          <textPath href="#stamp-arc-bottom" startOffset="50%" textAnchor="middle">
            GEVALIDEERD · BRUSSEL 1000
          </textPath>
        </text>

        {/* Zijstippen als scheiding tussen boven- en ondertekst */}
        <circle cx="17" cy="100" r="3.2" fill="#1E3A2B" />
        <circle cx="183" cy="100" r="3.2" fill="#1E3A2B" />

        <line x1="52" y1="70" x2="148" y2="70" stroke="#1E3A2B" strokeWidth="1.6" />
        <line x1="52" y1="130" x2="148" y2="130" stroke="#1E3A2B" strokeWidth="1.6" />
      </svg>

      {/* Boerderij-icoon in het hart van de stempel */}
      <span className="absolute inset-0 grid place-items-center">
        <Sprout className="h-[26%] w-[26%]" strokeWidth={2.2} color="#1E3A2B" />
      </span>
    </div>
  );
}
