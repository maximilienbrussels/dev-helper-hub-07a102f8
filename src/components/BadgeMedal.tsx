import type { LucideIcon } from "lucide-react";
import { Lock } from "lucide-react";

/**
 * Vectorbadge voor de trofeeënkast: kleurrijke medaille met lint,
 * subtiele glow wanneer ontgrendeld en grijstinten wanneer vergrendeld.
 */
export function BadgeMedal({
  Icon,
  unlocked,
  size = 80,
  className = "",
}: {
  Icon: LucideIcon;
  unlocked: boolean;
  size?: number;
  className?: string;
}) {
  const uid = `bm-${Icon.displayName ?? "x"}-${unlocked ? "on" : "off"}`;
  return (
    <div
      className={"relative shrink-0 " + className}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {unlocked && (
        <span className="absolute inset-0 rounded-full bg-[color:var(--color-terracotta)]/35 blur-xl animate-pulse" />
      )}
      <svg viewBox="0 0 100 100" className="relative h-full w-full">
        <defs>
          <linearGradient id={`${uid}-ring`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={unlocked ? "#E8A87C" : "#C9CFC6"} />
            <stop offset="50%" stopColor={unlocked ? "#C4654A" : "#B4BCB0"} />
            <stop offset="100%" stopColor={unlocked ? "#4A6741" : "#9AA396"} />
          </linearGradient>
          <radialGradient id={`${uid}-face`} cx="35%" cy="28%" r="80%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity={unlocked ? 0.9 : 0.5} />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.05" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="47" fill={`url(#${uid}-ring)`} />
        <circle
          cx="50"
          cy="50"
          r="39"
          fill={unlocked ? "#FAF8F3" : "#EDEFEB"}
          stroke={unlocked ? "#D4AF37" : "#C3C9BF"}
          strokeWidth="2"
        />
        {Array.from({ length: 24 }).map((_, i) => {
          const a = (Math.PI * 2 * i) / 24;
          return (
            <circle
              key={i}
              cx={50 + 43 * Math.cos(a)}
              cy={50 + 43 * Math.sin(a)}
              r="1.4"
              fill={unlocked ? "#D4AF37" : "#D6DAD3"}
            />
          );
        })}
        <circle cx="50" cy="50" r="47" fill={`url(#${uid}-face)`} />
      </svg>
      <span className="pointer-events-none absolute inset-0 grid place-items-center">
        {unlocked ? (
          <Icon
            className="text-[color:var(--ink-forest)]"
            style={{ width: size * 0.36, height: size * 0.36 }}
          />
        ) : (
          <Lock
            className="text-muted-foreground/60"
            style={{ width: size * 0.3, height: size * 0.3 }}
          />
        )}
      </span>
    </div>
  );
}
