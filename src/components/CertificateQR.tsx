import { QRCodeSVG } from "qrcode.react";

/**
 * Huisstijl-QR voor het A4-certificaat.
 *
 * - Donkergroen op zacht crème, in lijn met de boerderij-huisstijl.
 * - Error correction 'H' (30% herstel) zodat de code na afdrukken op A4 of
 *   na PDF-export nog vlot scant met elke smartphonecamera.
 * - SVG-rendering blijft scherp bij elke printresolutie.
 */
export const CERT_QR_FG = "#166534";
export const CERT_QR_BG = "#FAF7F2";

export function CertificateQR({
  value,
  size = 96,
  className,
  title,
}: {
  value: string;
  size?: number;
  className?: string;
  title?: string;
}) {
  return (
    <QRCodeSVG
      value={value}
      size={size}
      level="H"
      marginSize={2}
      fgColor={CERT_QR_FG}
      bgColor={CERT_QR_BG}
      className={className}
      title={title ?? "QR-code om dit certificaat te verifiëren"}
    />
  );
}
