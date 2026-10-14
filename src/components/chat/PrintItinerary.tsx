import type { Lang } from "@/lib/i18n";

/** Herkent een antwoord met een tabel, checklist of stappenroute. */
export function isPrintable(text: string): boolean {
  const hasTable = /\n\s*\|.*\|\s*\n\s*\|[\s:|-]+\|/.test(`\n${text}`);
  const hasChecklist = /^\s*-\s\[[ xX]\]\s/m.test(text);
  const hasSteps = (text.match(/^\s*\d+\.\s/gm) ?? []).length >= 3;
  return hasTable || hasChecklist || hasSteps;
}

const LABEL: Record<Lang, string> = {
  nl: "🖨️ Bewaar / Print mijn bezoekroute",
  fr: "🖨️ Enregistrer / imprimer mon parcours",
  en: "🖨️ Save / print my visit route",
};

const TITLE: Record<Lang, string> = {
  nl: "Mijn bezoekroute — Maximilien",
  fr: "Mon parcours — Maximilien",
  en: "My visit route — Maximilien",
};

const FOOTER: Record<Lang, string> = {
  nl: "Schipperijkaai 2, 1000 Brussel · +32 2 331 53 91 · gratis toegang",
  fr: "Quai du Batelage 2, 1000 Bruxelles · +32 2 331 53 91 · entrée gratuite",
  en: "Quai du Batelage 2, 1000 Brussels · +32 2 331 53 91 · free entry",
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Zet de Markdown om naar een propere, printbare tekstlayout. */
function toPrintableHtml(text: string, lang: Lang): string {
  const body = text
    .split("\n")
    .map((line) => {
      const clean = line.replace(/\*\*/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
      if (/^\s*\|[\s:|-]+\|\s*$/.test(clean)) return "";
      if (/^\s*\|/.test(clean)) {
        const cells = clean
          .trim()
          .replace(/^\||\|$/g, "")
          .split("|")
          .map((c) => `<td>${escapeHtml(c.trim())}</td>`)
          .join("");
        return `<tr>${cells}</tr>`;
      }
      if (!clean.trim()) return "";
      return `<p>${escapeHtml(clean.replace(/^\s*-\s\[[ xX]\]\s/, "☐ "))}</p>`;
    })
    .join("\n")
    .replace(/(<tr>[\s\S]*<\/tr>)/, '<table border="1" cellspacing="0" cellpadding="6">$1</table>');

  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><title>${TITLE[lang]}</title>
<style>body{font-family:system-ui,sans-serif;color:#1f2937;margin:32px;line-height:1.5}
h1{font-size:18px;margin-bottom:16px}table{border-collapse:collapse;width:100%;font-size:13px;margin:12px 0}
td{border:1px solid #cbd5e1;padding:6px}footer{margin-top:24px;font-size:12px;color:#64748b}</style></head>
<body><h1>${TITLE[lang]}</h1>${body}<footer>${FOOTER[lang]}</footer></body></html>`;
}

export function PrintItineraryButton({ text, lang }: { text: string; lang: Lang }) {
  function print() {
    const win = window.open("", "_blank", "width=780,height=900");
    if (!win) {
      window.print();
      return;
    }
    win.document.write(toPrintableHtml(text, lang));
    win.document.close();
    win.focus();
    win.setTimeout(() => win.print(), 250);
  }

  return (
    <button
      type="button"
      onClick={print}
      className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[color:var(--surface-page)] px-3 py-1.5 text-xs font-semibold text-[color:var(--color-terracotta)] ring-1 ring-border transition hover:brightness-95"
    >
      {LABEL[lang] ?? LABEL.nl}
    </button>
  );
}
