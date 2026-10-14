/**
 * Handgetekende boerderijillustraties voor het kinderdiploma.
 *
 * Alles is pure SVG (geen bitmaps), zodat het diploma haarscherp print op A4
 * en identiek exporteert naar PDF. Een subtiel ruisfilter geeft de lijnen de
 * onregelmatige "waskrijt"-toets van een tekening op papier.
 */

export const KIDS_PALETTE = {
  cream: "#FDF8EC",
  paper: "#FBF3E2",
  green: "#6F9E5B",
  deepGreen: "#3F6B44",
  sun: "#F2C14E",
  terracotta: "#D08355",
  sky: "#8CC5DE",
  ink: "#4A3B2A",
} as const;

/** Ruisfilter dat elke vorm licht laat trillen als een krijtlijn. */
export function CrayonDefs({ id = "crayon" }: { id?: string }) {
  return (
    <defs>
      <filter id={id} x="-12%" y="-12%" width="124%" height="124%">
        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={3} seed={7} />
        <feDisplacementMap in="SourceGraphic" scale="2.4" xChannelSelector="R" yChannelSelector="G" />
      </filter>
      <filter id={`${id}-soft`} x="-12%" y="-12%" width="124%" height="124%">
        <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves={2} seed={11} />
        <feDisplacementMap in="SourceGraphic" scale="1.4" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </defs>
  );
}

type ArtProps = { className?: string };

const stroke = {
  stroke: KIDS_PALETTE.ink,
  strokeWidth: 3,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  fill: "none",
};

/** Dwerggeit. */
export function GoatArt({ className = "" }: ArtProps) {
  return (
    <svg viewBox="0 0 160 160" className={className} role="img" aria-label="Dwerggeit">
      <CrayonDefs id="goat" />
      <g filter="url(#goat-soft)">
        <ellipse cx="76" cy="96" rx="46" ry="32" fill="#F4EADA" />
        <ellipse cx="118" cy="66" rx="24" ry="21" fill="#F4EADA" />
        <path d="M108 48 C 102 30 92 24 86 26 C 94 32 98 40 100 50 Z" fill={KIDS_PALETTE.terracotta} />
        <path d="M128 48 C 134 30 144 24 150 26 C 142 32 138 40 136 50 Z" fill={KIDS_PALETTE.terracotta} />
        <ellipse cx="96" cy="70" rx="12" ry="7" fill="#E7D9C1" />
        <ellipse cx="140" cy="70" rx="12" ry="7" fill="#E7D9C1" />
        <circle cx="112" cy="62" r="3.4" fill={KIDS_PALETTE.ink} />
        <circle cx="128" cy="62" r="3.4" fill={KIDS_PALETTE.ink} />
        <ellipse cx="120" cy="76" rx="7" ry="5" fill={KIDS_PALETTE.terracotta} />
        <path d="M46 122 L 44 148 M68 126 L 66 150 M96 124 L 98 148 M112 118 L 116 142" {...stroke} />
        <path d="M32 88 C 22 82 20 96 30 100" {...stroke} />
        <ellipse cx="76" cy="96" rx="46" ry="32" {...stroke} />
        <ellipse cx="118" cy="66" rx="24" ry="21" {...stroke} />
      </g>
    </svg>
  );
}

/** Ezel. */
export function DonkeyArt({ className = "" }: ArtProps) {
  return (
    <svg viewBox="0 0 160 160" className={className} role="img" aria-label="Ezel">
      <CrayonDefs id="donkey" />
      <g filter="url(#donkey-soft)">
        <ellipse cx="72" cy="98" rx="48" ry="33" fill="#CFC6BC" />
        <ellipse cx="118" cy="62" rx="23" ry="24" fill="#CFC6BC" />
        <ellipse cx="106" cy="26" rx="7" ry="18" fill="#CFC6BC" transform="rotate(-14 106 26)" />
        <ellipse cx="132" cy="26" rx="7" ry="18" fill="#CFC6BC" transform="rotate(14 132 26)" />
        <ellipse cx="106" cy="28" rx="3" ry="11" fill="#EADFD2" transform="rotate(-14 106 28)" />
        <ellipse cx="132" cy="28" rx="3" ry="11" fill="#EADFD2" transform="rotate(14 132 28)" />
        <ellipse cx="120" cy="78" rx="15" ry="11" fill="#EADFD2" />
        <circle cx="110" cy="58" r="3.4" fill={KIDS_PALETTE.ink} />
        <circle cx="128" cy="58" r="3.4" fill={KIDS_PALETTE.ink} />
        <circle cx="115" cy="78" r="2.2" fill={KIDS_PALETTE.ink} />
        <circle cx="125" cy="78" r="2.2" fill={KIDS_PALETTE.ink} />
        <path d="M40 124 L 38 150 M62 128 L 60 152 M92 126 L 94 150 M110 116 L 114 140" {...stroke} />
        <path d="M26 84 C 14 84 12 104 24 108" {...stroke} />
        <ellipse cx="72" cy="98" rx="48" ry="33" {...stroke} />
        <ellipse cx="118" cy="62" rx="23" ry="24" {...stroke} />
      </g>
    </svg>
  );
}

/** Cavia. */
export function GuineaPigArt({ className = "" }: ArtProps) {
  return (
    <svg viewBox="0 0 160 160" className={className} role="img" aria-label="Cavia">
      <CrayonDefs id="cavia" />
      <g filter="url(#cavia-soft)">
        <ellipse cx="80" cy="94" rx="58" ry="40" fill={KIDS_PALETTE.terracotta} />
        <path d="M30 76 C 46 60 70 56 90 62 C 74 74 52 80 30 76 Z" fill="#EFD9B8" />
        <ellipse cx="44" cy="70" rx="12" ry="10" fill="#EFD9B8" />
        <ellipse cx="118" cy="70" rx="12" ry="10" fill="#EFD9B8" />
        <circle cx="50" cy="88" r="4" fill={KIDS_PALETTE.ink} />
        <circle cx="104" cy="88" r="4" fill={KIDS_PALETTE.ink} />
        <ellipse cx="77" cy="104" rx="7" ry="5" fill={KIDS_PALETTE.ink} />
        <path d="M77 109 L 77 116 M77 116 C 70 122 64 118 64 114 M77 116 C 84 122 90 118 90 114" {...stroke} />
        <path d="M20 100 C 8 96 6 108 18 110 M140 100 C 152 96 154 108 142 110" {...stroke} />
        <ellipse cx="80" cy="94" rx="58" ry="40" {...stroke} />
      </g>
    </svg>
  );
}

/** Konijn. */
export function RabbitArt({ className = "" }: ArtProps) {
  return (
    <svg viewBox="0 0 160 160" className={className} role="img" aria-label="Konijn">
      <CrayonDefs id="konijn" />
      <g filter="url(#konijn-soft)">
        <ellipse cx="80" cy="112" rx="44" ry="34" fill="#F0E4D4" />
        <ellipse cx="80" cy="70" rx="30" ry="27" fill="#F0E4D4" />
        <ellipse cx="64" cy="30" rx="9" ry="26" fill="#F0E4D4" transform="rotate(-10 64 30)" />
        <ellipse cx="96" cy="30" rx="9" ry="26" fill="#F0E4D4" transform="rotate(10 96 30)" />
        <ellipse cx="64" cy="32" rx="4" ry="17" fill="#F3C7C0" transform="rotate(-10 64 32)" />
        <ellipse cx="96" cy="32" rx="4" ry="17" fill="#F3C7C0" transform="rotate(10 96 32)" />
        <circle cx="70" cy="68" r="3.6" fill={KIDS_PALETTE.ink} />
        <circle cx="90" cy="68" r="3.6" fill={KIDS_PALETTE.ink} />
        <path d="M80 78 L 76 82 L 84 82 Z" fill={KIDS_PALETTE.terracotta} />
        <path d="M80 82 L 80 88 M80 88 C 74 93 68 90 68 86 M80 88 C 86 93 92 90 92 86" {...stroke} />
        <circle cx="122" cy="126" r="12" fill="#FFFFFF" />
        <circle cx="122" cy="126" r="12" {...stroke} />
        <ellipse cx="80" cy="112" rx="44" ry="34" {...stroke} />
        <ellipse cx="80" cy="70" rx="30" ry="27" {...stroke} />
      </g>
    </svg>
  );
}

/**
 * Speelse "officiële stempel" in lakzegel-stijl met het paardje van de
 * boerderij en een geschulpte rand.
 */
export function KidsWaxSeal({
  className = "",
  label = "OFFICIEEL",
  sub = "FERME MAXIMILIEN",
}: ArtProps & { label?: string; sub?: string }) {
  const lobes: string[] = [];
  for (let i = 0; i < 360; i += 2) {
    const a = (Math.PI * i) / 180;
    const r = 84 + Math.sin(a * 16) * 6;
    lobes.push(`${(100 + r * Math.cos(a)).toFixed(1)},${(100 + r * Math.sin(a)).toFixed(1)}`);
  }
  return (
    <svg viewBox="0 0 200 200" className={className} role="img" aria-label="Officiële stempel">
      <CrayonDefs id="seal" />
      <g filter="url(#seal-soft)">
        <polygon points={lobes.join(" ")} fill={KIDS_PALETTE.terracotta} />
        <circle cx="100" cy="100" r="70" fill="none" stroke={KIDS_PALETTE.cream} strokeWidth="3" />
        <circle cx="100" cy="100" r="62" fill="#B96C42" />
        {/* Paardje */}
        <path
          d="M78 128 L 82 104 C 84 92 92 84 104 82 L 110 70 L 116 78 L 126 76 L 120 88 C 128 96 130 108 126 120 L 122 130 L 114 130 L 116 116 L 104 118 L 100 130 Z"
          fill={KIDS_PALETTE.cream}
        />
        <circle cx="112" cy="78" r="2.6" fill="#B96C42" />
        <text
          x="100"
          y="60"
          textAnchor="middle"
          fontSize="15"
          letterSpacing="3"
          fill={KIDS_PALETTE.cream}
          fontFamily="'Trebuchet MS', 'Verdana', sans-serif"
          fontWeight="bold"
        >
          {label}
        </text>
        <text
          x="100"
          y="150"
          textAnchor="middle"
          fontSize="10"
          letterSpacing="2"
          fill={KIDS_PALETTE.cream}
          fontFamily="'Trebuchet MS', 'Verdana', sans-serif"
        >
          {sub}
        </text>
      </g>
    </svg>
  );
}

/** Waskrijt-kader met golvende randen en kleurstippen in de hoeken. */
export function CrayonFrame({ className = "" }: ArtProps) {
  return (
    <svg viewBox="0 0 1123 794" className={className} preserveAspectRatio="none" aria-hidden="true">
      <CrayonDefs id="frame" />
      <g filter="url(#frame)">
        <rect
          x="34"
          y="34"
          width="1055"
          height="726"
          rx="34"
          fill="none"
          stroke={KIDS_PALETTE.green}
          strokeWidth="9"
          strokeLinejoin="round"
        />
        <rect
          x="52"
          y="52"
          width="1019"
          height="690"
          rx="26"
          fill="none"
          stroke={KIDS_PALETTE.sun}
          strokeWidth="4"
          strokeDasharray="16 12"
          strokeLinecap="round"
        />
        <rect
          x="66"
          y="66"
          width="991"
          height="662"
          rx="20"
          fill="none"
          stroke={KIDS_PALETTE.sky}
          strokeWidth="2.5"
        />
      </g>
    </svg>
  );
}
