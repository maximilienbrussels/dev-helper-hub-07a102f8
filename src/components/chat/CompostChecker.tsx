import { useMemo, useState } from "react";
import { Check, X, Search } from "lucide-react";
import { COMPOST_NO, COMPOST_YES } from "@/lib/compost";
import { useT } from "@/lib/i18n";

const COPY = {
  nl: {
    title: "Compost-Checker",
    hint: "Typ wat je wil afgeven, bv. “eierschalen”",
    yes: "Mag in de buurtcompost",
    no: "Niet in de buurtcompost",
    unknown: "Niet gevonden — vraag het aan een compostmeester.",
    all: "Alles bekijken",
  },
  fr: {
    title: "Vérificateur compost",
    hint: "Tapez un déchet, p.ex. « coquilles d'œufs »",
    yes: "Accepté au compost de quartier",
    no: "Refusé au compost de quartier",
    unknown: "Introuvable — demandez à un maître-composteur.",
    all: "Tout voir",
  },
  en: {
    title: "Compost checker",
    hint: "Type an item, e.g. “egg shells”",
    yes: "Allowed in the compost",
    no: "Not allowed in the compost",
    unknown: "Not found — ask a compost master.",
    all: "Show everything",
  },
} as const;

function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2);
}

export function CompostChecker() {
  const { lang } = useT();
  const c = COPY[lang];
  const [q, setQ] = useState("");
  const [showAll, setShowAll] = useState(false);

  const result = useMemo(() => {
    const words = tokens(q);
    if (!words.length) return null;
    const match = (list: string[]) =>
      list.find((item) => words.some((w) => tokens(item).some((t) => t.startsWith(w) || w.startsWith(t))));
    const yes = match(COMPOST_YES[lang]);
    if (yes) return { ok: true as const, item: yes };
    const no = match(COMPOST_NO[lang]);
    if (no) return { ok: false as const, item: no };
    return { ok: null, item: "" };
  }, [q, lang]);

  return (
    <div className="mt-3 rounded-2xl border border-border/70 bg-card p-3 text-sm shadow-sm">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-foreground/90">{c.title}</p>
      <label className="mt-2 flex items-center gap-2 rounded-xl border border-border/70 bg-background px-3 py-2">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={c.hint}
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </label>

      {result ? (
        result.ok === true ? (
          <p className="mt-3 flex items-start gap-2 rounded-xl bg-emerald-500/10 px-3 py-2 text-emerald-700 dark:text-emerald-300">
            <Check className="mt-0.5 size-4 shrink-0" />
            <span>
              <strong>{c.yes}</strong>
              <br />
              {result.item}
            </span>
          </p>
        ) : result.ok === false ? (
          <p className="mt-3 flex items-start gap-2 rounded-xl bg-destructive/10 px-3 py-2 text-destructive">
            <X className="mt-0.5 size-4 shrink-0" />
            <span>
              <strong>{c.no}</strong>
              <br />
              {result.item}
            </span>
          </p>
        ) : (
          <p className="mt-3 rounded-xl bg-muted px-3 py-2 text-muted-foreground">{c.unknown}</p>
        )
      ) : null}

      <button
        type="button"
        onClick={() => setShowAll((v) => !v)}
        className="mt-3 text-xs font-medium text-[color:var(--color-terracotta)] underline"
      >
        {c.all}
      </button>

      {showAll ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <ul className="space-y-1">
            {COMPOST_YES[lang].map((i) => (
              <li key={i} className="flex gap-2 text-xs text-foreground/90">
                <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                {i}
              </li>
            ))}
          </ul>
          <ul className="space-y-1">
            {COMPOST_NO[lang].map((i) => (
              <li key={i} className="flex gap-2 text-xs text-foreground/90">
                <X className="mt-0.5 size-3.5 shrink-0 text-destructive" />
                {i}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
