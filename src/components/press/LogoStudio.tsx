/**
 * LogoStudio — logo's downloaden in elk formaat.
 *
 * De bezoeker kiest een kleurvariant, een vorm (vierkant of op maat van het
 * logo), een achtergrond, een bestandsformaat en een pixelgrootte. De render
 * gebeurt volledig in de browser op een canvas, zodat elke gewenste grootte
 * beschikbaar is — inclusief de werkelijke bestandsgrootte (KB/MB) vóór het
 * downloaden.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Lang = "nl" | "fr" | "en";
type T3 = Record<Lang, string>;

const COPY = {
  title: {
    nl: "Logo-studio — elk formaat",
    fr: "Studio logo — tous les formats",
    en: "Logo studio — any size",
  } as T3,
  lede: {
    nl: "Kies kleur, vorm, achtergrond en pixelgrootte. Je ziet meteen hoe groot het bestand wordt en downloadt precies wat je nodig hebt.",
    fr: "Choisissez la couleur, la forme, le fond et la taille en pixels. Vous voyez immédiatement le poids du fichier et téléchargez exactement ce qu'il vous faut.",
    en: "Pick colour, shape, background and pixel size. You instantly see the file size and download exactly what you need.",
  } as T3,
  variant: { nl: "Kleurvariant", fr: "Variante", en: "Colour variant" } as T3,
  shape: { nl: "Vorm", fr: "Forme", en: "Shape" } as T3,
  square: { nl: "Vierkant", fr: "Carré", en: "Square" } as T3,
  wide: { nl: "Op maat van logo", fr: "Format du logo", en: "Logo proportions" } as T3,
  background: { nl: "Achtergrond", fr: "Fond", en: "Background" } as T3,
  transparent: { nl: "Transparant", fr: "Transparent", en: "Transparent" } as T3,
  format: { nl: "Bestandstype", fr: "Type de fichier", en: "File type" } as T3,
  size: { nl: "Grootte", fr: "Taille", en: "Size" } as T3,
  padding: { nl: "Vrije ruimte", fr: "Marge", en: "Clear space" } as T3,
  fileSize: { nl: "Bestandsgrootte", fr: "Poids du fichier", en: "File size" } as T3,
  download: { nl: "Download", fr: "Télécharger", en: "Download" } as T3,
  multi: {
    nl: "Vink meerdere formaten aan en download ze in één keer",
    fr: "Cochez plusieurs tailles et téléchargez-les d'un coup",
    en: "Tick several sizes and download them all at once",
  } as T3,
  downloadSelected: {
    nl: "Download aangevinkte formaten",
    fr: "Télécharger les tailles cochées",
    en: "Download ticked sizes",
  } as T3,
  ready: { nl: "Klaar", fr: "Prêt", en: "Ready" } as T3,
  note: {
    nl: "JPG heeft altijd een achtergrond. Voor transparantie kies je PNG of WebP.",
    fr: "Le JPG a toujours un fond. Pour la transparence, choisissez PNG ou WebP.",
    en: "JPG always has a background. For transparency choose PNG or WebP.",
  } as T3,
};

const VARIANTS: { id: string; label: T3; src: string; darkArtwork: boolean }[] = [
  {
    id: "terracotta",
    label: { nl: "Terracotta", fr: "Terracotta", en: "Terracotta" },
    src: "/pers/logo-maximilien-terracotta-1000px.png",
    darkArtwork: true,
  },
  {
    id: "bosgroen",
    label: { nl: "Bosgroen", fr: "Vert forêt", en: "Forest green" },
    src: "/pers/logo-maximilien-bosgroen-1000px.png",
    darkArtwork: true,
  },
  {
    id: "wit",
    label: { nl: "Wit", fr: "Blanc", en: "White" },
    src: "/pers/logo-maximilien-wit-1000px.png",
    darkArtwork: false,
  },
  {
    id: "zwart",
    label: { nl: "Zwart", fr: "Noir", en: "Black" },
    src: "/pers/logo-maximilien-zwart-1000px.png",
    darkArtwork: true,
  },
];

const BACKGROUNDS: { id: string; label: T3; value: string | null }[] = [
  { id: "none", label: COPY.transparent, value: null },
  { id: "cream", label: { nl: "Crème", fr: "Crème", en: "Cream" }, value: "#F7F3EB" },
  { id: "forest", label: { nl: "Bosgroen", fr: "Vert forêt", en: "Forest" }, value: "#1D3528" },
  { id: "white", label: { nl: "Wit", fr: "Blanc", en: "White" }, value: "#FFFFFF" },
];

const FORMATS = [
  { id: "png", mime: "image/png", ext: "png", label: "PNG" },
  { id: "webp", mime: "image/webp", ext: "webp", label: "WebP" },
  { id: "jpg", mime: "image/jpeg", ext: "jpg", label: "JPG" },
] as const;

const SIZES = [128, 180, 256, 512, 800, 1024, 1600, 2048] as const;

function humanSize(bytes: number, lang: Lang): string {
  const mb = bytes / (1024 * 1024);
  const nf = new Intl.NumberFormat(lang === "en" ? "en-GB" : lang === "fr" ? "fr-BE" : "nl-BE", {
    maximumFractionDigits: mb >= 1 ? 2 : 0,
  });
  return mb >= 1 ? `${nf.format(mb)} MB` : `${nf.format(bytes / 1024)} KB`;
}

const CHIP =
  "inline-flex min-h-[40px] items-center gap-2 rounded-full border px-4 text-xs font-medium transition-colors";
const CHIP_OFF =
  "border-white/25 text-[color:var(--color-cream)]/90 hover:border-white hover:text-white";
const CHIP_ON =
  "border-[color:var(--color-terracotta)] bg-[color:var(--color-terracotta)] text-[color:var(--color-cream)]";
const LABEL =
  "text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-cream)]/75";

export function LogoStudio({ lang }: { lang: Lang }) {
  const l = lang;
  const [variantId, setVariantId] = useState(VARIANTS[0]!.id);
  const [square, setSquare] = useState(true);
  const [bgId, setBgId] = useState("cream");
  const [formatId, setFormatId] = useState<(typeof FORMATS)[number]["id"]>("png");
  const [size, setSize] = useState<number>(512);
  const [padding, setPadding] = useState(12);
  const [checked, setChecked] = useState<number[]>([512, 1024]);
  const [bytes, setBytes] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const variant = VARIANTS.find((v) => v.id === variantId) ?? VARIANTS[0]!;
  const format = FORMATS.find((f) => f.id === formatId) ?? FORMATS[0];
  const background = BACKGROUNDS.find((b) => b.id === bgId) ?? BACKGROUNDS[0]!;
  const effectiveBg = format.id === "jpg" && !background.value ? "#FFFFFF" : background.value;

  // Bronafbeelding laden (één keer per variant).
  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = variant.src;
    img.onload = () => {
      if (!cancelled) {
        imgRef.current = img;
        setBytes(null);
        setPreviewUrl(null);
        setTick((t) => t + 1);
      }
    };
    return () => {
      cancelled = true;
    };
  }, [variant.src]);

  const [tick, setTick] = useState(0);

  const render = useCallback(
    async (targetSize: number): Promise<Blob | null> => {
      const img = imgRef.current;
      if (!img || !img.complete) return null;
      const ratio = img.naturalWidth / img.naturalHeight || 1;
      const w = targetSize;
      const h = square ? targetSize : Math.round(targetSize / ratio);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      if (effectiveBg) {
        ctx.fillStyle = effectiveBg;
        ctx.fillRect(0, 0, w, h);
      }
      const pad = (Math.min(w, h) * padding) / 100;
      const boxW = w - pad * 2;
      const boxH = h - pad * 2;
      const scale = Math.min(boxW / img.naturalWidth, boxH / img.naturalHeight);
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
      return await new Promise((resolve) =>
        canvas.toBlob((b) => resolve(b), format.mime, format.id === "png" ? undefined : 0.92),
      );
    },
    [square, effectiveBg, padding, format.mime, format.id],
  );

  // Live voorbeeld + bestandsgrootte.
  useEffect(() => {
    let url: string | null = null;
    let cancelled = false;
    void (async () => {
      const blob = await render(size);
      if (!blob || cancelled) return;
      setBytes(blob.size);
      url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    })();
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [render, size, tick]);

  function fileName(px: number) {
    const shape = square ? "vierkant" : "logo";
    return `logo-maximilien-${variant.id}-${shape}-${px}px.${format.ext}`;
  }

  async function downloadOne(px: number) {
    const blob = await render(px);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName(px);
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  async function downloadChecked() {
    if (checked.length === 0) return;
    setBusy(true);
    for (const px of [...checked].sort((a, b) => a - b)) {
      await downloadOne(px);
      await new Promise((r) => window.setTimeout(r, 250));
    }
    setBusy(false);
    toast.success(`${COPY.ready[l]} · ${checked.length}×`);
  }

  const previewChecker = useMemo(
    () =>
      effectiveBg
        ? { background: effectiveBg }
        : {
            backgroundImage:
              "linear-gradient(45deg,rgba(255,255,255,0.14) 25%,transparent 25%,transparent 75%,rgba(255,255,255,0.14) 75%),linear-gradient(45deg,rgba(255,255,255,0.14) 25%,transparent 25%,transparent 75%,rgba(255,255,255,0.14) 75%)",
            backgroundSize: "18px 18px",
            backgroundPosition: "0 0, 9px 9px",
          },
    [effectiveBg],
  );

  return (
    <section id="logo-studio" className="scroll-mt-24">
      <h2 className="font-serif text-2xl text-[color:var(--color-cream)] md:text-3xl">
        {COPY.title[l]}
      </h2>
      <p className="mt-3 max-w-3xl text-sm text-[color:var(--color-cream)]/90">{COPY.lede[l]}</p>

      <div className="mt-6 grid gap-6 rounded-3xl border border-white/12 bg-white/[0.06] p-5 md:p-7 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        {/* Voorbeeld */}
        <div className="space-y-4">
          <div
            className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-white/15"
            style={previewChecker}
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt={variant.label[l]}
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <Loader2 className="h-6 w-6 animate-spin text-[color:var(--color-cream)]/60" />
            )}
          </div>
          <dl className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-2xl border border-white/12 bg-white/[0.05] px-3 py-2.5">
              <dt className={LABEL}>{COPY.size[l]}</dt>
              <dd className="mt-1 font-mono text-sm text-[color:var(--color-cream)]">
                {size} × {square ? size : "auto"} px
              </dd>
            </div>
            <div className="rounded-2xl border border-white/12 bg-white/[0.05] px-3 py-2.5">
              <dt className={LABEL}>{COPY.fileSize[l]}</dt>
              <dd className="mt-1 font-mono text-sm text-[color:var(--color-terracotta)]">
                {bytes === null ? "…" : humanSize(bytes, l)}
              </dd>
            </div>
          </dl>
          <button
            type="button"
            onClick={() => void downloadOne(size)}
            className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-[color:var(--color-terracotta)] px-5 text-sm font-semibold text-[color:var(--color-cream)] transition hover:opacity-90"
          >
            <Download className="h-4 w-4" /> {COPY.download[l]} · {format.label} {size}px
          </button>
        </div>

        {/* Instellingen */}
        <div className="space-y-6">
          <fieldset>
            <legend className={LABEL}>{COPY.variant[l]}</legend>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {VARIANTS.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVariantId(v.id)}
                  className={`${CHIP} ${v.id === variantId ? CHIP_ON : CHIP_OFF}`}
                >
                  {v.label[l]}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-6 sm:grid-cols-2">
            <fieldset>
              <legend className={LABEL}>{COPY.shape[l]}</legend>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {[true, false].map((sq) => (
                  <button
                    key={String(sq)}
                    type="button"
                    onClick={() => setSquare(sq)}
                    className={`${CHIP} ${sq === square ? CHIP_ON : CHIP_OFF}`}
                  >
                    {sq ? COPY.square[l] : COPY.wide[l]}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className={LABEL}>{COPY.format[l]}</legend>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {FORMATS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFormatId(f.id)}
                    className={`${CHIP} ${f.id === formatId ? CHIP_ON : CHIP_OFF}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          <fieldset>
            <legend className={LABEL}>{COPY.background[l]}</legend>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {BACKGROUNDS.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setBgId(b.id)}
                  className={`${CHIP} ${b.id === bgId ? CHIP_ON : CHIP_OFF}`}
                >
                  {b.value ? (
                    <span
                      aria-hidden
                      className="h-3.5 w-3.5 rounded-full border border-white/40"
                      style={{ background: b.value }}
                    />
                  ) : null}
                  {b.label[l]}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-[color:var(--color-cream)]/70">{COPY.note[l]}</p>
          </fieldset>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="logo-size" className={LABEL}>
                {COPY.size[l]}
              </label>
              <input
                id="logo-size"
                type="range"
                min={64}
                max={2048}
                step={16}
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-[color:var(--color-terracotta)]"
              />
              <span className="mt-2 block font-mono text-xs text-[color:var(--color-cream)]/85">
                {size} px
              </span>
            </div>
            <div>
              <label htmlFor="logo-padding" className={LABEL}>
                {COPY.padding[l]}
              </label>
              <input
                id="logo-padding"
                type="range"
                min={0}
                max={30}
                step={1}
                value={padding}
                onChange={(e) => setPadding(Number(e.target.value))}
                className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-[color:var(--color-terracotta)]"
              />
              <span className="mt-2 block font-mono text-xs text-[color:var(--color-cream)]/85">
                {padding}%
              </span>
            </div>
          </div>

          <fieldset>
            <legend className={LABEL}>{COPY.multi[l]}</legend>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {SIZES.map((px) => {
                const on = checked.includes(px);
                return (
                  <label
                    key={px}
                    className={`${CHIP} cursor-pointer ${on ? CHIP_ON : CHIP_OFF}`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={on}
                      onChange={() =>
                        setChecked((c) => (on ? c.filter((x) => x !== px) : [...c, px]))
                      }
                    />
                    {on ? <Check className="h-3.5 w-3.5" aria-hidden /> : null}
                    {px} px
                  </label>
                );
              })}
            </div>
            <button
              type="button"
              disabled={checked.length === 0 || busy}
              onClick={() => void downloadChecked()}
              className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/30 px-5 text-sm font-medium text-[color:var(--color-cream)] transition-colors hover:border-white disabled:opacity-45"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {COPY.downloadSelected[l]} ({checked.length})
            </button>
          </fieldset>
        </div>
      </div>
    </section>
  );
}
