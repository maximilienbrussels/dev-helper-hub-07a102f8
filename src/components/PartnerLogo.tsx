import type { Partner } from "@/lib/partners";
import ffaLogo from "@/assets/partner-ffa.png";
import natagoraLogo from "@/assets/partner-natagora.png";
import brusselsLogo from "@/assets/partner-brussels.png";
import fedeauLogo from "@/assets/partner-fedeau.png";
import leefmilieuLogo from "@/assets/partner-leefmilieu.svg";
import delplancheLogo from "@/assets/partner-delplanche.png";
import faoLogo from "@/assets/partner-fao.svg";
import { handleImageError } from "@/lib/image-fallback";

const LOGOS: Record<string, string> = {
  brussels: brusselsLogo,
  fedeau: fedeauLogo,
  natagora: natagoraLogo,
  fermedanimation: ffaLogo,
  leefmilieu: leefmilieuLogo,
  delplanche: delplancheLogo,
  fao: faoLogo,
};

/**
 * Logo tile for a partner. Rendered desaturated by default so the
 * palette of the site stays calm; regains its brand colour on hover/tap.
 */
export function PartnerLogo({ partner, size = "md" }: { partner: Partner; size?: "sm" | "md" }) {
  const isSm = size === "sm";
  const logo = LOGOS[partner.id];
  return (
    <a
      href={partner.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={partner.name}
      title={partner.name}
      className={[
        "group grid place-items-center rounded-2xl border border-border bg-background/60 text-center",
        "grayscale opacity-70 transition-all duration-300 hover:grayscale-0 hover:opacity-100",
        "focus-visible:grayscale-0 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-terracotta)]",
        isSm ? "h-16 px-4" : "h-28 px-6 hover:-translate-y-0.5",
      ].join(" ")}
    >
      {logo ? (
        <img
          src={logo}
          onError={handleImageError}
          alt={`${partner.name} logo`}
          loading="lazy"
          className={["w-full object-contain", isSm ? "max-h-10" : "max-h-20"].join(" ")}
        />
      ) : (
        <span
          className={[
            "font-serif italic leading-tight whitespace-pre-line",
            isSm ? "text-sm" : "text-xl md:text-2xl",
          ].join(" ")}
          style={{ color: partner.color }}
        >
          {partner.short}
        </span>
      )}
    </a>
  );
}
