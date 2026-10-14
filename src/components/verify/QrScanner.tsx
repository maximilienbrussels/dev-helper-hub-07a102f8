/**
 * Publieke QR-scanner voor de verificatiepagina.
 *
 * Gebruikt de ingebouwde BarcodeDetector wanneer de browser die aanbiedt en
 * valt anders terug op jsQR. Alles gebeurt lokaal in de browser: er wordt
 * nooit beeld naar de server gestuurd. De camera stopt zodra het venster
 * sluit of er een code gevonden is.
 */
import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, X } from "lucide-react";

type BarcodeDetectorLike = { detect: (src: CanvasImageSource) => Promise<{ rawValue: string }[]> };

export function QrScanner({
  onResult,
  onClose,
}: {
  onResult: (value: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const doneRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function start() {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        setError(
          "Deze browser geeft geen toegang tot de camera. Typ het certificaatnummer hieronder in.",
        );
        setStarting(false);
        return;
      }
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
      } catch {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        } catch {
          if (!cancelled) {
            setError("Geen toegang tot de camera. Typ het certificaatnummer hieronder in.");
            setStarting(false);
          }
          return;
        }
      }
      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      video.setAttribute("playsinline", "true");
      video.muted = true;
      try {
        await video.play();
      } catch {
        video.onloadedmetadata = () => void video.play().catch(() => undefined);
      }
      setStarting(false);

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
        if (cancelled || doneRef.current) return;
        const v = videoRef.current;
        const canvas = canvasRef.current;
        if (!v || !canvas || v.readyState < 2) return;
        const w = v.videoWidth;
        const h = v.videoHeight;
        if (!w || !h) return;
        try {
          if (detector) {
            const raw = (await detector.detect(v))[0]?.rawValue;
            if (raw) hit(raw);
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
          if (found?.data) hit(found.data);
        } catch {
          /* één mislukt frame is geen probleem */
        }
      };

      const hit = (raw: string) => {
        if (doneRef.current) return;
        doneRef.current = true;
        onResult(raw);
      };

      const loop = () => {
        if (cancelled || doneRef.current) return;
        void scan();
        timer = setTimeout(loop, 130);
      };
      loop();
    }

    void start();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [onResult]);

  return (
    <div className="mt-4 w-full rounded-3xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="inline-flex items-center gap-2 text-sm font-medium">
          <Camera className="h-4 w-4" aria-hidden="true" /> Richt de camera op de QR-code
        </p>
        <button
          type="button"
          onClick={onClose}
          className="grid size-10 place-items-center rounded-full border border-border text-muted-foreground hover:text-foreground"
          aria-label="Scanner sluiten"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {error ? (
        <p className="mt-3 text-sm text-muted-foreground">{error}</p>
      ) : (
        <div className="relative mt-3 overflow-hidden rounded-2xl bg-black">
          <video ref={videoRef} className="aspect-video w-full object-cover" />
          {starting && (
            <p className="absolute inset-0 grid place-items-center text-sm text-white">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            </p>
          )}
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
      <p className="mt-3 text-xs text-muted-foreground">
        De camerabeelden blijven op dit toestel; er wordt niets opgeslagen of verstuurd.
      </p>
    </div>
  );
}
