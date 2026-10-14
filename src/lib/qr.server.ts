/**
 * QR-codes voor tickets en donatiebewijzen (server-only, pure JS).
 * Levert een PNG als base64 zodat de code als bijlage of inline afbeelding
 * meekan in een Brevo-mail.
 */

export async function qrPngBase64(text: string, size = 512): Promise<string | null> {
  try {
    const QRCode = (await import("qrcode")).default;
    const dataUrl = await QRCode.toDataURL(text, {
      width: size,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#1b3a24", light: "#ffffff" },
    });
    return dataUrl.split(",")[1] ?? null;
  } catch (error) {
    console.error("[qr] genereren mislukt", error);
    return null;
  }
}
