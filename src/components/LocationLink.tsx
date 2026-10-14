import { useT, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const MAP_URL = "https://citymapper.com/go/nv622mf2m9";

const ADDRESSES: Record<Lang, string> = {
  nl: "Schipperijkaai 2, 1000 Brussel",
  fr: "Quai du Batelage 2, 1000 Bruxelles",
  en: "Quai du Batelage 2, 1000 Brussels",
};

const FALLBACK = "Schipperijkaai 2 / Quai du Batelage 2, 1000 Brussel";

type Props = {
  /** Optional explicit locale; falls back to the active app language. */
  lang?: Lang;
  className?: string;
};

/**
 * Ultra-minimal, trilingual location line.
 * Flat: no borders, no gradients — just the address and a discrete ↗.
 */
export function LocationLink({ lang, className }: Props) {
  const { lang: activeLang } = useT();
  const resolved = lang ?? activeLang;
  const label = ADDRESSES[resolved] ?? FALLBACK;

  return (
    <a
      href={MAP_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group inline-flex items-baseline gap-1 font-medium text-foreground/90 transition-colors hover:text-[color:var(--color-terracotta)] hover:underline",
        className,
      )}
    >
      <span>{label}</span>
      <span
        aria-hidden="true"
        className="opacity-40 transition-opacity duration-200 group-hover:opacity-100"
      >
        ↗
      </span>
    </a>
  );
}
