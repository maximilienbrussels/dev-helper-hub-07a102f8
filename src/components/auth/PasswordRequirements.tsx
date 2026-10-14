import { Check } from "lucide-react";

export type PasswordRules = {
  length: boolean;
  upper: boolean;
  digitOrSymbol: boolean;
  match: boolean;
  score: number;
  allValid: boolean;
};

/** Live regelcontrole voor een nieuw wachtwoord (8+, hoofdletter, cijfer/teken, gelijk). */
export function passwordRules(password: string, confirm: string): PasswordRules {
  const length = password.length >= 8;
  const upper = /[A-Z]/.test(password);
  const digitOrSymbol = /[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password);
  const match = password.length > 0 && password === confirm;
  const score = [length, upper, digitOrSymbol, match].filter(Boolean).length;
  return { length, upper, digitOrSymbol, match, score, allValid: score === 4 };
}

const LABELS: { key: keyof Omit<PasswordRules, "score" | "allValid">; label: string }[] = [
  { key: "length", label: "Minimaal 8 tekens" },
  { key: "upper", label: "Ten minste 1 hoofdletter (A-Z)" },
  { key: "digitOrSymbol", label: "Ten minste 1 cijfer (0-9) of speciaal teken" },
  { key: "match", label: "Wachtwoorden komen overeen" },
];

/** Checklist die live meeloopt met wat de bezoeker typt. */
export function PasswordChecklist({ rules }: { rules: PasswordRules }) {
  return (
    <ul className="mt-3 space-y-1.5" aria-live="polite">
      {LABELS.map(({ key, label }) => {
        const ok = rules[key];
        return (
          <li
            key={key}
            className={
              ok
                ? "flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400"
                : "flex items-center gap-2 text-sm text-slate-400"
            }
          >
            {ok ? (
              <Check className="size-4 shrink-0" aria-hidden />
            ) : (
              <span className="grid size-4 shrink-0 place-items-center leading-none" aria-hidden>
                •
              </span>
            )}
            <span>{label}</span>
          </li>
        );
      })}
    </ul>
  );
}

const TIERS = [
  { label: "Zwak", bar: "w-1/3 bg-red-500", text: "text-red-600 dark:text-red-400" },
  { label: "Matig", bar: "w-2/3 bg-amber-500", text: "text-amber-600 dark:text-amber-400" },
  { label: "Sterk", bar: "w-full bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" },
] as const;

/** Drietrapsbalk: zwak, matig, sterk. */
export function PasswordStrengthBar({ rules }: { rules: PasswordRules }) {
  if (rules.score === 0) return null;
  const tier = rules.score >= 4 ? TIERS[2] : rules.score >= 2 ? TIERS[1] : TIERS[0];
  return (
    <div className="mt-4">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div className={`h-full rounded-full transition-all duration-300 ${tier.bar}`} />
      </div>
      <p className={`mt-1.5 text-xs font-medium ${tier.text}`}>{tier.label}</p>
    </div>
  );
}

/** Zachte, ronde kaart rond de wachtwoordformulieren. */
export function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-md rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-xl backdrop-blur-md sm:p-8 dark:border-slate-800 dark:bg-slate-900/80">
      {children}
    </div>
  );
}

export const AUTH_INPUT_CLASS =
  "h-auto rounded-2xl border-slate-300 bg-slate-50/50 px-4 py-3.5 text-slate-900 transition-all focus-visible:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-100";

export const AUTH_SUBMIT_CLASS =
  "w-full rounded-2xl bg-[#C15C3A] px-6 py-3.5 h-auto font-medium text-white shadow-md transition-all hover:bg-[#A84E30] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50";
