/**
 * Camerascanner voor de balie: afhaal-QR-codes én certificaten.
 *
 * Robuust op mobiel: gebruikt de native BarcodeDetector wanneer de browser die
 * heeft (Android/Chrome), en valt anders terug op jsQR over een canvas (iOS).
 * De videostream wordt altijd netjes gestopt bij sluiten of hergebruik.
 * Werkt de camera niet? Dan kan het team de code van 6 tekens intikken.
 *
 * - Bestelling: wordt meteen afgeboekt, groen scherm, na 2 seconden gaat de
 *   camera vanzelf weer aan voor de volgende in de rij.
 * - Certificaat: niets wordt afgeboekt; er verschijnt een kaart met de
 *   deelnemergegevens en een knop om het A4-certificaat af te drukken.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Award,
  CheckCircle2,
  Flashlight,
  FlashlightOff,
  Loader2,
  Printer,
  TriangleAlert,
  X,
} from "lucide-react";
import { redeemPickupQr, redeemPickupCode, type RedeemResult } from "@/lib/orders/pickup.functions";
import { resolveCertificateScan, markCertificatePrinted } from "@/lib/academy-print.functions";
import type { DeskCertificate } from "@/lib/academy-print-types";
import { CertificateFront } from "@/components/academy/CertificateFront";
import { certCode, titleCaseName } from "@/lib/cert-code";
import { certVerifyCodeUrl } from "@/lib/academy-cert";
import { academyName } from "@/lib/academy-i18n";
import { useT, localeFor } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type State =
  | { kind: "scanning" }
  | { kind: "checking" }
  | { kind: "result"; result: RedeemResult }
  | { kind: "certificate"; certificate: DeskCertificate }
  | { kind: "error"; message: string };

type BarcodeDetectorLike = {
  detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]>;
};

function euro(cents: number): string {
  return `€ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

/** Haalt orderId + token uit een gescande QR (URL of ruwe tekst). */
function parsePayload(text: string): { orderId: string; token: string } | { code: string } | null {
  const value = text.trim();
  try {
    const url = new URL(value);
    const orderId = url.searchParams.get("orderId");
    const token = url.searchParams.get("token");
    if (orderId && token) return { orderId, token };
  } catch {
    /* geen URL: verder proberen als code */
  }
  if (/^[A-Za-z0-9-]{4,32}$/.test(value)) return { code: value };
  return null;
}

function cameraErrorMessage(err: unknown): string {
  const name = err instanceof Error ? err.name : "";
  if (name === "NotAllowedError" || name === "SecurityError")
    return "Cameratoegang geweigerd. Zet de cameratoestemming aan in je browserinstellingen, of tik de code van 6 tekens in.";
  if (name === "NotFoundError" || name === "OverconstrainedError")
    return "Geen bruikbare camera gevonden op dit toestel. Tik de code van 6 tekens in.";
  if (name === "NotReadableError")
    return "De camera is in gebruik door een andere app. Sluit die app en probeer opnieuw.";
  return "De camera kon niet starten. Tik de code van 6 tekens in.";
}

export function PickupScanner({ onClose }: { onClose: () => void }) {
  const redeemQr = useServerFn(redeemPickupQr);
  const redeemCode = useServerFn(redeemPickupCode);
  const resolveCert = useServerFn(resolveCertificateScan);
  const markPrinted = useServerFn(markCertificatePrinted);
  const { lang } = useT();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const busyRef = useRef(false);
  const resetRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [state, setState] = useState<State>({ kind: "scanning" });
  const [session, setSession] = useState(0);
  const [manual, setManual] = useState("");
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [printedNote, setPrintedNote] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setTorchAvailable(false);
    setTorchOn(false);
    const video = videoRef.current;
    if (video) {
      try {
        video.pause();
      } catch {
        /* niets */
      }
      video.srcObject = null;
    }
  }, []);

  const restart = useCallback(() => {
    busyRef.current = false;
    setPrintedNote(null);
    setState({ kind: "scanning" });
    setSession((n) => n + 1);
  }, []);

  /** Zaklamp aan/uit op toestellen die het ondersteunen. */
  const toggleTorch = useCallback(async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({
        advanced: [{ torch: next } as unknown as MediaTrackConstraintSet],
      });
      setTorchOn(next);
    } catch {
      setTorchAvailable(false);
    }
  }, [torchOn]);

  /**
   * Eén gescande of ingetikte waarde: eerst als bestelling proberen, en anders
   * als certificaat opzoeken.
   */
  const resolveValue = useCallback(
    async (raw: string) => {
      busyRef.current = true;
      stopCamera();
      setState({ kind: "checking" });
      try {
        const parsed = parsePayload(raw);
        let order: RedeemResult | null = null;
        if (parsed) {
          order =
            "code" in parsed
              ? await redeemCode({ data: { code: parsed.code } })
              : await redeemQr({ data: parsed });
        }
        if (order && (order.ok === true || order.reason !== "invalid")) {
          setState({ kind: "result", result: order });
          if (order.ok) resetRef.current = setTimeout(() => restart(), 2000);
          return;
        }
        const cert = await resolveCert({ data: { value: raw } });
        if (cert.ok) {
          setPrintedNote(null);
          setState({ kind: "certificate", certificate: cert.certificate });
          return;
        }
        setState({ kind: "result", result: order ?? { ok: false, reason: "invalid" } });
      } catch (e) {
        setState({ kind: "error", message: e instanceof Error ? e.message : "Controle mislukt." });
      }
    },
    [redeemCode, redeemQr, resolveCert, restart, stopCamera],
  );

  const handlePayload = useCallback(
    (text: string) => {
      if (busyRef.current) return;
      void resolveValue(text);
    },
    [resolveValue],
  );

  useEffect(() => {
    return () => {
      if (resetRef.current) clearTimeout(resetRef.current);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let raf = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function start() {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        setState({
          kind: "error",
          message:
            "Deze browser geeft geen toegang tot de camera (beveiligde https-verbinding vereist). Tik de code van 6 tekens in.",
        });
        return;
      }
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } },
          audio: false,
        });
      } catch (first) {
        try {
          // Sommige toestellen weigeren facingMode; probeer eender welke camera.
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        } catch {
          if (!cancelled) {
            setState({ kind: "error", message: cameraErrorMessage(first) });
          }
          return;
        }
      }
      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;

      // Zaklamp enkel tonen wanneer het toestel het echt ondersteunt.
      const track = stream.getVideoTracks()[0];
      try {
        const caps = track?.getCapabilities?.() as { torch?: boolean } | undefined;
        if (caps && "torch" in caps) setTorchAvailable(Boolean(caps.torch));
      } catch {
        /* capabilities niet beschikbaar — geen zaklampknop */
      }

      const video = videoRef.current;
      if (!video) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      video.srcObject = stream;
      video.setAttribute("playsinline", "true");
      video.muted = true;
      try {
        await video.play();
      } catch {
        // iOS kan play() blokkeren tot een gebruikersinteractie; de metadata-
        // handler probeert het dan opnieuw.
        video.onloadedmetadata = () => void video.play().catch(() => undefined);
      }

      const Detector = (
        globalThis as unknown as {
          BarcodeDetector?: new (o: { formats: string[] }) => BarcodeDetectorLike;
        }
      ).BarcodeDetector;
      let detector: BarcodeDetectorLike | null = null;
      if (Detector) {
        try {
          detector = new Detector({ formats: ["qr_code"] });
        } catch {
          detector = null;
        }
      }

      let jsQR: typeof import("jsqr").default | null = null;
      if (!detector) jsQR = (await import("jsqr")).default;
      if (cancelled) return;

      const scan = async () => {
        if (cancelled || busyRef.current) return;
        const v = videoRef.current;
        const canvas = canvasRef.current;
        if (!v || !canvas || v.readyState < 2) return;
        const w = v.videoWidth;
        const h = v.videoHeight;
        if (!w || !h) return;
        try {
          if (detector) {
            const hits = await detector.detect(v);
            const raw = hits[0]?.rawValue;
            if (raw) handlePayload(raw);
            return;
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (!ctx || !jsQR) return;
          ctx.drawImage(v, 0, 0, w, h);
          const found = jsQR(ctx.getImageData(0, 0, w, h).data, w, h, {
            inversionAttempts: "attemptBoth",
          });
          if (found?.data) handlePayload(found.data);
        } catch {
          /* één mislukt frame is geen probleem */
        }
      };

      // Ongeveer 8 scans per seconde: vlot én zuinig met batterij.
      const loop = () => {
        if (cancelled) return;
        void scan();
        timer = setTimeout(() => {
          raf = requestAnimationFrame(loop);
        }, 120);
      };
      loop();
    }

    void start();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      cancelAnimationFrame(raf);
      stopCamera();
    };
  }, [handlePayload, stopCamera, session]);

  const result = state.kind === "result" ? state.result : null;
  const cert = state.kind === "certificate" ? state.certificate : null;

  // Gegevens voor de certificaatkaart en het afdrukblad.
  const certView = cert
    ? (() => {
        const naam = titleCaseName(cert.volledigeNaam, "Deelnemer");
        const academyLabel = cert.academy ? academyName(cert.academy, lang) : "";
        const code = certCode(cert.academy?.slug, cert.behaaldOp, cert.volgnummer);
        const datum = new Date(cert.behaaldOp).toLocaleDateString(localeFor(lang), {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
        return { naam, academyLabel, code, datum, qrUrl: certVerifyCodeUrl(code) };
      })()
    : null;

  function submitManual(e: React.FormEvent) {
    e.preventDefault();
    const value = manual.trim().toUpperCase();
    if (value.length < 4) return;
    if (resetRef.current) clearTimeout(resetRef.current);
    void resolveValue(value);
    setManual("");
  }

  /** Print het A4-certificaat en registreert dat nadien in de databank. */
  function printCertificate() {
    if (!cert) return;
    setPrinting(true);
    const done = () => {
      window.removeEventListener("afterprint", done);
      void markPrinted({ data: { id: cert.id } })
        .then((r) => {
          setPrintedNote(
            r.printedAt
              ? `Geregistreerd als afgedrukt (${new Date(r.printedAt).toLocaleTimeString("nl-BE", {
                  hour: "2-digit",
                  minute: "2-digit",
                })})`
              : "Geregistreerd als afgedrukt.",
          );
        })
        .catch(() => setPrintedNote("Afdruk kon niet geregistreerd worden."))
        .finally(() => setPrinting(false));
    };
    window.addEventListener("afterprint", done);
    window.setTimeout(() => window.print(), 80);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-foreground/95 text-background">
      <div className="flex items-center justify-between px-4 py-3">
        <p className="text-sm font-semibold text-background">Scannen aan de balie</p>
        <div className="flex items-center gap-2">
          {torchAvailable ? (
            <button
              type="button"
              onClick={() => void toggleTorch()}
              aria-pressed={torchOn}
              aria-label={torchOn ? "Zaklamp uit" : "Zaklamp aan"}
              className={
                "rounded-full p-2 " + (torchOn ? "bg-background text-foreground" : "bg-background/15")
              }
            >
              {torchOn ? <FlashlightOff className="size-5" /> : <Flashlight className="size-5" />}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            aria-label="Sluiten"
            className="rounded-full bg-background/15 p-2"
          >
            <X className="size-5" />
          </button>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <video ref={videoRef} playsInline muted autoPlay className="h-full w-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />
        {state.kind === "scanning" ? (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="size-56 rounded-3xl border-4 border-background/80 shadow-[0_0_0_100vmax_rgba(0,0,0,0.45)]" />
          </div>
        ) : null}
      </div>

      <div className="max-h-[60%] overflow-y-auto bg-card p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] text-foreground">
        {state.kind === "scanning" ? (
          <p className="text-sm text-muted-foreground">
            Richt de camera op de QR-code van de klant of op een certificaat. Een afhaling wordt
            meteen geregistreerd.
          </p>
        ) : null}

        {state.kind === "checking" ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Code wordt gecontroleerd…
          </p>
        ) : null}

        {state.kind === "error" ? (
          <p
            role="alert"
            className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
          >
            {state.message}
          </p>
        ) : null}

        {result && result.ok === false ? (
          <div
            role="alert"
            className="rounded-2xl border-2 border-destructive bg-destructive/10 p-4 text-destructive"
          >
            <p className="flex items-center gap-2 font-bold">
              <TriangleAlert className="size-5" /> Ongeldige of reeds gebruikte code
            </p>
            <p className="mt-1 text-sm">
              {result.reason === "used"
                ? "Deze bestelling werd al afgehaald."
                : result.reason === "cancelled"
                  ? "Deze bestelling is geannuleerd."
                  : "Deze code hoort bij geen enkele bestelling of certificaat."}
            </p>
          </div>
        ) : null}

        {result && result.ok === true ? (
          <div className="rounded-2xl border-2 border-primary bg-primary/10 p-4">
            <p className="flex items-center gap-2 font-bold text-primary">
              <CheckCircle2 className="size-6" /> Afgehaald ✓
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {result.order.pickupCode ?? result.order.reference ?? "—"} ·{" "}
              {result.order.customerName ?? "klant"}
            </p>
            {result.order.wasPayOnPickup ? (
              <p className="mt-3 rounded-xl border border-accent/50 bg-accent/20 px-3 py-2 text-sm font-semibold">
                💶 Nog te innen: {euro(result.order.totalCents)}
              </p>
            ) : null}
            <ul className="mt-3 space-y-1 text-sm">
              {result.order.items.map((it, i) => (
                <li key={i}>
                  {it.quantity} × {it.title}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              De camera start over 2 seconden vanzelf opnieuw.
            </p>
          </div>
        ) : null}

        {cert && certView ? (
          <div className="rounded-2xl border-2 border-primary bg-primary/5 p-4">
            <p className="flex items-center gap-2 font-bold text-primary">
              <Award className="size-6" /> Certificaat
            </p>
            <p className="mt-2 text-lg font-semibold">{certView.naam}</p>
            <p className="text-sm text-muted-foreground">
              {certView.academyLabel} Academy · {certView.datum} · score {cert.score}
            </p>
            <p className="mt-1 font-mono text-sm tracking-[0.2em]">
              #{certView.code}
              {cert.shortCode ? ` · ${cert.shortCode}` : ""}
            </p>
            {cert.printedAt ? (
              <p className="mt-2 rounded-xl border border-accent/50 bg-accent/20 px-3 py-2 text-sm">
                Al eerder afgedrukt op{" "}
                {new Date(cert.printedAt).toLocaleString("nl-BE", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {cert.printCount > 1 ? ` (${cert.printCount}×)` : ""}
              </p>
            ) : null}
            {printedNote ? (
              <p className="mt-2 text-sm font-medium text-primary">{printedNote}</p>
            ) : null}
            <Button className="mt-4 h-12 w-full text-base" onClick={printCertificate} disabled={printing}>
              {printing ? <Loader2 className="size-5 animate-spin" /> : <Printer className="size-5" />}{" "}
              Certificaat afdrukken
            </Button>
          </div>
        ) : null}

        <form className="mt-4 flex gap-2" onSubmit={submitManual}>
          <Input
            value={manual}
            onChange={(e) => setManual(e.target.value.toUpperCase())}
            placeholder="B7K9X2"
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="off"
            aria-label="Code van 6 tekens"
            maxLength={32}
            className="font-mono text-lg uppercase tracking-[0.25em]"
          />
          <Button type="submit" disabled={manual.trim().length < 4 || state.kind === "checking"}>
            Controleren
          </Button>
        </form>

        {state.kind !== "scanning" && state.kind !== "checking" ? (
          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                stopCamera();
                onClose();
              }}
            >
              Sluiten
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                if (resetRef.current) clearTimeout(resetRef.current);
                restart();
              }}
            >
              Volgende scannen
            </Button>
          </div>
        ) : null}
      </div>

      {/* Verborgen afdrukblad: enkel zichtbaar op papier (@media print). */}
      {cert && certView ? (
        <div
          id="certificate-print-area"
          aria-hidden="true"
          className="pointer-events-none fixed left-[-20000px] top-0 w-[1123px]"
          style={{ ["--cert-scale" as string]: "1" }}
        >
          <CertificateFront
            academy={cert.academy}
            academyLabel={certView.academyLabel}
            naam={certView.naam}
            score={cert.score}
            datum={certView.datum}
            code={certView.code}
            volgnummer={cert.volgnummer}
            qrUrl={certView.qrUrl}
            certLang={lang}
          />
        </div>
      ) : null}
    </div>
  );
}
