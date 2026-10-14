import { MapPin } from "lucide-react";
import { ZoomableImage } from "@/components/chat/Lightbox";
import type { Lang } from "@/lib/i18n";
import type { FarmAsset } from "@/config/farmAssets";

const WHERE: Record<Lang, string> = {
  nl: "📍 Waar te vinden?",
  fr: "📍 Où le trouver ?",
  en: "📍 Where to find it?",
};

const ASK: Record<Lang, (t: string) => string> = {
  nl: (t) => `Waar vind ik ${t} precies op de boerderij?`,
  fr: (t) => `Où puis-je trouver ${t} exactement à la ferme ?`,
  en: (t) => `Where exactly can I find ${t} at the farm?`,
};

/**
 * Horizontale fotokaart met een ECHTE foto uit het statische manifest.
 * Er worden nooit AI-beelden of externe willekeurige afbeeldingen getoond.
 */
export function FarmAssetCard({
  asset,
  lang,
  onAsk,
}: {
  asset: FarmAsset;
  lang: Lang;
  onAsk: (text: string) => void;
}) {
  return (
    <div className="mt-2 flex gap-3 overflow-hidden rounded-2xl border border-border bg-card p-2 shadow-sm">
      <ZoomableImage
        src={asset.imagePath}
        alt={asset.alt}
        className="h-20 w-24 shrink-0 rounded-xl object-cover"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-foreground">{asset.title}</p>
        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{asset.description}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          {asset.locationTag ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
              <MapPin className="h-3 w-3" /> {asset.locationTag}
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => onAsk(ASK[lang](asset.title.toLowerCase()))}
            className="rounded-full bg-[color:var(--color-terracotta)] px-2.5 py-1 text-[11px] font-semibold text-white hover:opacity-90"
          >
            {WHERE[lang]}
          </button>
        </div>
      </div>
    </div>
  );
}
