import type { Lang } from "@/lib/i18n";

const LABEL: Record<Lang, string> = {
  nl: "📅 Zet bezoek in mijn agenda",
  fr: "📅 Ajouter la visite à mon agenda",
  en: "📅 Add visit to my calendar",
};

const TITLE: Record<Lang, string> = {
  nl: "Bezoek Maximilien",
  fr: "Visite Maximilien",
  en: "Visit Maximilien",
};

const LOCATION = "Schipperijkaai 2, 1000 Brussel";

/** Herkent een antwoord met een concreet bezoekplan of dagprogramma. */
export function isSchedule(text: string): boolean {
  const steps = (text.match(/^\s*(\d+\.|[-*])\s/gm) ?? []).length >= 3;
  const times = (text.match(/\b\d{1,2}[:u.]\d{2}\b/g) ?? []).length >= 2;
  return steps || times;
}

function fold(line: string): string {
  return line.replace(/[\\;,]/g, (m) => `\\${m}`).replace(/\r?\n/g, "\\n");
}

/** Eerstvolgende dinsdag om 10:00 lokale tijd, als praktisch startmoment. */
function nextVisitStart(): Date {
  const d = new Date();
  d.setHours(10, 0, 0, 0);
  do {
    d.setDate(d.getDate() + 1);
  } while (d.getDay() === 0 || d.getDay() === 1);
  return d;
}

function toIcsDate(d: Date): string {
  return `${d.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;
}

export function CalendarExportButton({ text, lang }: { text: string; lang: Lang }) {
  function download() {
    const start = nextVisitStart();
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Maximilien//Maxim//NL",
      "BEGIN:VEVENT",
      `UID:${Date.now()}@lafermeduparcmaximilien.be`,
      `DTSTAMP:${toIcsDate(new Date())}`,
      `DTSTART:${toIcsDate(start)}`,
      `DTEND:${toIcsDate(end)}`,
      `SUMMARY:${fold(TITLE[lang])}`,
      `LOCATION:${fold(LOCATION)}`,
      `DESCRIPTION:${fold(text)}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bezoek-ferme-du-parc-maximilien.ics";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={download}
      className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[color:var(--color-terracotta)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
    >
      {LABEL[lang]}
    </button>
  );
}
