/**
 * Mobiele overdracht: een QR-code met de échte routelink, zodat bezoekers de
 * route buiten op hun telefoon verder volgen. Handgetekende stijl met het
 * witte konijn van de boerderij in het midden.
 */
import { QRCodeSVG } from "qrcode.react";

import type { Lang } from "@/lib/i18n";

const COPY: Record<Lang, { title: string; hint: string }> = {
  nl: { title: "Scan & wandel verder", hint: "Richt je camera op de code voor de route op je telefoon." },
  fr: { title: "Scannez & partez", hint: "Pointez votre caméra sur le code pour l'itinéraire sur votre téléphone." },
  en: { title: "Scan & go", hint: "Point your camera at the code to take the route with you." },
};

export function RouteQrCode({ url, lang }: { url: string; lang: Lang }) {
  const t = COPY[lang] ?? COPY.nl;

  return (
    <div className="mx-3 mb-3 flex items-center gap-3 rounded-2xl border-2 border-dashed border-white/40 bg-white/5 px-3 py-3 [border-radius:1.6rem_1.1rem_1.7rem_1.2rem/1.2rem_1.7rem_1.1rem_1.6rem]">
      <div className="relative shrink-0 rounded-[1.1rem_0.8rem_1.2rem_0.9rem/0.9rem_1.2rem_0.8rem_1.1rem] border-2 border-white/70 bg-white p-2">
        <QRCodeSVG value={url} size={96} level="M" bgColor="#ffffff" fgColor="#1f2937" />
        <span
          aria-hidden
          className="absolute inset-0 grid place-items-center"
        >
          <span className="grid size-7 place-items-center rounded-full bg-white text-base shadow-[0_1px_4px_rgba(0,0,0,.25)]">
            🐇
          </span>
        </span>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-100">{t.title}</p>
        <p className="mt-1 text-[11px] leading-snug text-slate-300">{t.hint}</p>
      </div>
    </div>
  );
}
