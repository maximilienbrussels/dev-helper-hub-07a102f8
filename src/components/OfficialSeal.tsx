import { MLogo } from "@/components/MLogo";

/**
 * Vlakke, duurzame sticker-zegel: geen 3D, geen goud, geen glans.
 * Diep bosgroen (#1b382b) met warme terracotta en beige accenten en het
 * vector 'm'-logo van de boerderij in het hart. Alles is vector, dus het
 * print en exporteert haarscherp.
 */
export function OfficialSeal({
  className = "",
  authText = "GEAUTHENTICEERD",
}: {
  className?: string;
  authText?: string;
}) {
  const FOREST = "#1b382b";
  const TERRA = "#C85A32";
  const BEIGE = "#E8DCC5";
  const CREAM = "#FDFBF7";

  // Geschulpte stickerrand — vlak, één effen kleur.
  const pts: string[] = [];
  const lobes = 22;
  for (let i = 0; i < 360; i += 1) {
    const a = (Math.PI * i) / 180;
    const r = 94 + Math.sin(a * lobes) * 5;
    pts.push(`${(100 + r * Math.cos(a)).toFixed(2)},${(100 + r * Math.sin(a)).toFixed(2)}`);
  }

  const star = (x: number, y: number, fill: string) => (
    <path
      key={`${x}-${y}`}
      d={`M ${x} ${y - 4} L ${x + 1.2} ${y - 1.2} L ${x + 4} ${y} L ${x + 1.2} ${y + 1.2} L ${x} ${y + 4} L ${x - 1.2} ${y + 1.2} L ${x - 4} ${y} L ${x - 1.2} ${y - 1.2} Z`}
      fill={fill}
    />
  );

  return (
    <div className={"relative " + className}>
      <svg viewBox="0 0 200 200" className="h-full w-full">
        <defs>
          <path id="seal-arc-top" d="M 28,100 A 72,72 0 0 1 172,100" fill="none" />
          <path id="seal-arc-bottom" d="M 32,100 A 68,68 0 0 0 168,100" fill="none" />
        </defs>

        {/* Vlakke sticker: beige onderrand + effen groene schijf */}
        <polygon points={pts.join(" ")} fill={BEIGE} />
        <circle cx="100" cy="100" r="92" fill={FOREST} />
        <circle cx="100" cy="100" r="87" fill="none" stroke={BEIGE} strokeWidth="1.5" />
        <circle cx="100" cy="100" r="83" fill="none" stroke={TERRA} strokeWidth="2" />

        <text
          fill={CREAM}
          fontSize="10"
          letterSpacing="1.9"
          fontWeight="600"
          style={{ fontFamily: "var(--font-certificate, serif)" }}
        >
          <textPath href="#seal-arc-top" startOffset="50%" textAnchor="middle">
            LA FERME DU PARC MAXIMILIEN
          </textPath>
        </text>
        <text
          fill={BEIGE}
          fontSize="9"
          letterSpacing="3.4"
          fontWeight="600"
          style={{ fontFamily: "var(--font-certificate, serif)" }}
        >
          <textPath href="#seal-arc-bottom" startOffset="50%" textAnchor="middle">
            {`· ${authText} ·`}
          </textPath>
        </text>

        {star(22, 100, TERRA)}
        {star(178, 100, TERRA)}

        {/* Vlakke terracotta kern met het vector-logo */}
        <circle cx="100" cy="100" r="52" fill={TERRA} />
        <circle cx="100" cy="100" r="52" fill="none" stroke={CREAM} strokeWidth="1.5" />
        <circle cx="100" cy="100" r="46" fill="none" stroke={CREAM} strokeWidth="0.8" />
      </svg>

      <span className="pointer-events-none absolute inset-0 grid place-items-center">
        <MLogo variant="white" className="h-[30%] w-auto" />
      </span>
    </div>
  );
}
