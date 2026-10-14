import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useT } from "@/lib/i18n";

export type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "fm-theme";

type Ctx = { theme: Theme; setTheme: (t: Theme) => void; resolved: "light" | "dark" };

const ThemeCtx = createContext<Ctx>({ theme: "system", setTheme: () => {}, resolved: "light" });

/** Inline script: applies the stored theme before first paint (no flash, no auto-inversion). */
export const themeInitScript = `(function(){try{var t=localStorage.getItem('${STORAGE_KEY}')||'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var e=document.documentElement;e.classList.toggle('dark',d);e.style.colorScheme=d?'only dark':'only light';}catch(e){}})();`;

function systemDark() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function apply(theme: Theme) {
  if (typeof document === "undefined") return "light";
  const dark = theme === "dark" || (theme === "system" && systemDark());
  const el = document.documentElement;
  el.classList.toggle("dark", dark);
  // "only ..." blokkeert de geforceerde donkere modus van Samsung Internet /
  // Chrome Android; de site levert zelf beide thema's.
  el.style.colorScheme = dark ? "only dark" : "only light";
  return dark ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolved, setResolved] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? "system";
    setThemeState(stored);
    setResolved(apply(stored) as "light" | "dark");
  }, []);

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setResolved(apply("system") as "light" | "dark");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem(STORAGE_KEY, t);
    setResolved(apply(t) as "light" | "dark");
  }, []);

  return <ThemeCtx.Provider value={{ theme, setTheme, resolved }}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  return useContext(ThemeCtx);
}

const OPTIONS: { value: Theme; key: string; Icon: typeof Sun }[] = [
  { value: "light", key: "theme.light", Icon: Sun },
  { value: "dark", key: "theme.dark", Icon: Moon },
  { value: "system", key: "theme.system", Icon: Monitor },
];

/** Compact three-way segmented control: Licht / Donker / Systeem. */
export function ThemeSwitcher({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const { t } = useT();
  return (
    <div
      role="radiogroup"
      aria-label={t("theme.label")}
      className={
        "inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 p-1 " +
        className
      }
    >
      {OPTIONS.map(({ value, key, Icon }) => {
        const label = t(key);
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => setTheme(value)}
            className={
              "inline-flex h-9 w-9 min-h-0 min-w-0 items-center justify-center rounded-full transition-colors " +
              (active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-background/70 hover:text-foreground")
            }
          >
            <Icon className="h-4 w-4" strokeWidth={1.9} />
          </button>
        );
      })}
    </div>
  );
}

/**
 * Compacte icoon-dropdown (desktop): één knop met zon/maan/scherm, die een klein
 * menu opent met Licht / Donker / Systeem. Neemt nauwelijks ruimte in naast de
 * taalkeuze.
 */
export function ThemeMenu({ className = "" }: { className?: string }) {
  const { theme, setTheme, resolved } = useTheme();
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const Current = theme === "system" ? Monitor : resolved === "dark" ? Moon : Sun;

  return (
    <div ref={ref} className={"relative " + className}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("theme.label")}
        title={t("theme.label")}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-11 w-11 min-h-0 min-w-0 items-center justify-center rounded-full border border-border bg-muted/50 text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
      >
        <Current className="h-4 w-4" strokeWidth={1.8} />
      </button>
      {open && (
        <div
          role="menu"
          aria-label={t("theme.label")}
          className="absolute right-0 top-full z-50 mt-2 w-44 rounded-2xl border border-border/70 bg-background p-1.5 shadow-2xl"
        >
          {OPTIONS.map(({ value, key, Icon }) => {
            const label = t(key);
            const active = theme === value;
            return (
              <button
                key={value}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => {
                  setTheme(value);
                  setOpen(false);
                }}
                className={
                  "flex w-full min-h-0 items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] transition-colors " +
                  (active
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-foreground/85 hover:bg-secondary/70")
                }
              >
                <Icon className="h-4 w-4 shrink-0" strokeWidth={1.8} />
                <span className="min-w-0 flex-1 truncate">{label}</span>
                {active && <Check className="h-3.5 w-3.5 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
