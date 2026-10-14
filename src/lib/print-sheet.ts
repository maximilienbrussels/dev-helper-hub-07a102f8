/**
 * Print één verborgen A4-blok (#worksheet-print-area) zonder de rest van de pagina.
 * De body-klasse activeert de print-regels in styles.css.
 */
export function printSheet(): void {
  if (typeof window === "undefined") return;
  const body = document.body;
  body.classList.add("printing-sheet");
  const cleanup = () => body.classList.remove("printing-sheet");
  window.addEventListener("afterprint", cleanup, { once: true });
  // Laat de browser eerst herschikken, print daarna.
  window.setTimeout(() => {
    window.print();
    window.setTimeout(cleanup, 1000);
  }, 50);
}
