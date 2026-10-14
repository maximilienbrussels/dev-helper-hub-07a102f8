/**
 * PhotoCropperModal — interactieve uitsnede- en zoommodule voor persfoto's.
 *
 * De journalist kiest een beeldverhouding en een zoomniveau, ziet live het
 * kader dat gedownload wordt, en genereert met HTML5 Canvas een scherpe
 * JPG/PNG in de browser. Lukt dat niet (CORS op de beeldserver), dan valt de
 * knop terug op een gewone download van het originele bestand.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Crop, Download, Loader2, X, ZoomIn } from "lucide-react";
import { toast } from "sonner";

type Lang = "nl" | "fr" | "en";
type T3 = Record<Lang, string>;

export type RatioId = "original" | "16:9" | "1:1" | "9:16";
export type ZoomId = "100" | "125" | "150";

const RATIOS: { id: RatioId; label: T3; ratio: number | null; icon: string }[] = [
  {
    id: "original",
    icon: "📷",
    ratio: null,
    label: {
      nl: "Origineel (volledige resolutie)",
      fr: "Original (résolution complète)",
      en: "Original (full resolution)",
    },
  },
  {
    id: "16:9",
    icon: "📐",
    ratio: 16 / 9,
    label: {
      nl: "Rechthoek / web (16:9)",
      fr: "Rectangle / web (16:9)",
      en: "Rectangle / web (16:9)",
    },
  },
  {
    id: "1:1",
    icon: "🔳",
    ratio: 1,
    label: {
      nl: "Vierkant / social (1:1)",
      fr: "Carré / réseaux (1:1)",
      en: "Square / social (1:1)",
    },
  },
  {
    id: "9:16",
    icon: "📱",
    ratio: 9 / 16,
    label: {
      nl: "Story / verticaal (9:16)",
      fr: "Story / vertical (9:16)",
      en: "Story / vertical (9:16)",
    },
  },
];

const ZOOMS: { id: ZoomId; factor: number; label: T3 }[] = [
  {
    id: "100",
    factor: 1,
    label: {
      nl: "Standaard (100% — volledig beeld)",
      fr: "Standard (100 % — image entière)",
      en: "Standard (100% — full frame)",
    },
  },
  {
    id: "125",
    factor: 1.25,
    label: {
      nl: "Medium focus (125% — gecentreerd)",
      fr: "Focus moyen (125 % — centré)",
      en: "Medium focus (125% — centred)",
    },
  },
  {
    id: "150",
    factor: 1.5,
    label: {
      nl: "Close-up (150% — ingezoomd)",
      fr: "Gros plan (150 % — zoomé)",
      en: "Close-up (150% — zoomed in)",
    },
  },
];

const COPY = {
  title: {
    nl: "Download op maat",
    fr: "Téléchargement sur mesure",
    en: "Custom download",
  } as T3,
  lede: {
    nl: "Kies een beeldverhouding en zoomniveau. Het kader hieronder toont exact wat je downloadt.",
    fr: "Choisissez un format et un niveau de zoom. Le cadre ci-dessous montre exactement le résultat.",
    en: "Pick an aspect ratio and zoom level. The frame below shows exactly what you download.",
  } as T3,
  ratio: { nl: "Beeldverhouding", fr: "Format", en: "Aspect ratio" } as T3,
  zoom: { nl: "Zoom / focus", fr: "Zoom / cadrage", en: "Zoom / focus" } as T3,
  action: {
    nl: "Aangepaste foto downloaden",
    fr: "Télécharger la photo adaptée",
    en: "Download custom photo",
  } as T3,
  close: { nl: "Sluiten", fr: "Fermer", en: "Close" } as T3,
  fallback: {
    nl: "Uitsnede lukte niet — het originele bestand wordt gedownload.",
    fr: "Le recadrage a échoué — le fichier original est téléchargé.",
    en: "Cropping failed — downloading the original file instead.",
  } as T3,
  done: { nl: "Foto gedownload", fr: "Photo téléchargée", en: "Photo downloaded" } as T3,
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image-load-failed"));
    img.src = src;
  });
}

export function PhotoCropperModal({
  open,
  src,
  alt,
  lang,
  onClose,
}: {
  open: boolean;
  src: string;
  alt: string;
  lang: Lang;
  onClose: () => void;
}) {
  const [ratio, setRatio] = useState<RatioId>("original");
  const [zoom, setZoom] = useState<ZoomId>("100");
  const [busy, setBusy] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const activeRatio = useMemo(() => RATIOS.find((r) => r.id === ratio)!, [ratio]);
  const factor = useMemo(() => ZOOMS.find((z) => z.id === zoom)!.factor, [zoom]);

  if (!open) return null;

  async function download() {
    setBusy(true);
    try {
      const img = await loadImage(src);
      const nw = img.naturalWidth;
      const nh = img.naturalHeight;
      const target = activeRatio.ratio;

      // Doelafmetingen
      let outW = nw;
      let outH = nh;
      if (target) {
        if (target >= 1) {
          outW = nw;
          outH = Math.round(nw / target);
          if (outH > nh) {
            outH = nh;
            outW = Math.round(nh * target);
          }
        } else {
          outH = nh;
          outW = Math.round(nh * target);
          if (outW > nw) {
            outW = nw;
            outH = Math.round(nw / target);
          }
        }
      }

      // Bronvenster: cover-uitsnede, gecentreerd, verkleind volgens zoom
      const outRatio = outW / outH;
      let sw = nw;
      let sh = Math.round(nw / outRatio);
      if (sh > nh) {
        sh = nh;
        sw = Math.round(nh * outRatio);
      }
      sw = Math.round(sw / factor);
      sh = Math.round(sh / factor);
      const sx = Math.round((nw - sw) / 2);
      const sy = Math.round((nh - sh) / 2);

      const canvas = canvasRef.current ?? document.createElement("canvas");
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("no-canvas");
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);

      const blob = await new Promise<Blob | null>((res) =>
        canvas.toBlob((b) => res(b), "image/jpeg", 0.92),
      );
      if (!blob) throw new Error("no-blob");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `maximilien-persfoto-${ratio.replace(":", "x")}-${zoom}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${COPY.done[lang]} · ${outW} × ${outH} px`);
      onClose();
    } catch {
      toast.error(COPY.fallback[lang]);
      const a = document.createElement("a");
      a.href = src;
      a.download = "";
      a.target = "_blank";
      a.rel = "noopener";
      a.click();
    } finally {
      setBusy(false);
    }
  }

  const previewAspect = activeRatio.ratio ? `${activeRatio.ratio}` : "4 / 3";

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={COPY.title[lang]}
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-[color:var(--surface-page,#FFFFFF)] p-6 shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-serif text-xl text-[color:var(--ink-forest)]">
              {COPY.title[lang]}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">{COPY.lede[lang]}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={COPY.close[lang]}
            className="rounded-full border border-border p-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Live preview */}
        <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-black/5">
          <div
            className="relative mx-auto w-full overflow-hidden"
            style={{ aspectRatio: previewAspect, maxHeight: "42vh" }}
          >
            <img
              src={src}
              alt={alt}
              className="h-full w-full object-cover transition-transform duration-300"
              style={{ transform: `scale(${factor})` }}
            />
            <span className="pointer-events-none absolute inset-2 rounded-lg border-2 border-dashed border-white/70" />
          </div>
        </div>

        {/* Beeldverhouding */}
        <fieldset className="mt-5">
          <legend className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <Crop className="h-3.5 w-3.5" /> {COPY.ratio[lang]}
          </legend>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {RATIOS.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRatio(r.id)}
                aria-pressed={ratio === r.id}
                className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-left text-sm transition-colors ${
                  ratio === r.id
                    ? "border-[color:var(--color-terracotta)] bg-[color:var(--color-terracotta)]/10 text-foreground"
                    : "border-border text-foreground/90 hover:border-[color:var(--color-terracotta)]"
                }`}
              >
                <span aria-hidden>{r.icon}</span> {r.label[lang]}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Zoom */}
        <fieldset className="mt-5">
          <legend className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <ZoomIn className="h-3.5 w-3.5" /> {COPY.zoom[lang]}
          </legend>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {ZOOMS.map((z) => (
              <button
                key={z.id}
                type="button"
                onClick={() => setZoom(z.id)}
                aria-pressed={zoom === z.id}
                className={`rounded-2xl border px-4 py-3 text-left text-sm transition-colors ${
                  zoom === z.id
                    ? "border-[color:var(--color-terracotta)] bg-[color:var(--color-terracotta)]/10 text-foreground"
                    : "border-border text-foreground/90 hover:border-[color:var(--color-terracotta)]"
                }`}
              >
                🔍 {z.label[lang]}
              </button>
            ))}
          </div>
        </fieldset>

        <button
          type="button"
          onClick={() => void download()}
          disabled={busy}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[color:var(--color-terracotta)] px-5 py-3 text-sm font-semibold text-[color:var(--color-cream)] shadow-sm transition hover:opacity-90 disabled:opacity-60"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}{" "}
          {COPY.action[lang]}
        </button>
        <canvas ref={canvasRef} className="hidden" aria-hidden />
      </div>
    </div>
  );
}
