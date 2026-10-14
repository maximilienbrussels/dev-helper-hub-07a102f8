import { Shield, Smartphone, Store } from "lucide-react";

import { cn } from "@/lib/utils";
import { setAppModeOverride, type AppMode } from "@/lib/app-mode";

/**
 * Discrete dev-only schakelaar tussen publieke site en admin-portaal.
 * Wordt nooit gerenderd in een productiebuild (zie __root.tsx).
 */
export default function DevModeToggle({ mode }: { mode: AppMode }) {
  const options: { value: AppMode; label: string; Icon: typeof Store }[] = [
    { value: "public", label: "Publiek", Icon: Store },
    { value: "admin", label: "Admin", Icon: Shield },
    { value: "field", label: "Veld", Icon: Smartphone },
  ];

  return (
    <div className="fixed bottom-4 left-1/2 z-[2000] -translate-x-1/2 print:hidden">
      <div className="flex items-center gap-1 rounded-full border border-border bg-card/95 p-1 shadow-lg backdrop-blur">
        <span className="px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          dev
        </span>
        {options.map(({ value, label, Icon }) => (
          <button
            key={value}
            type="button"
            aria-pressed={mode === value}
            onClick={() => mode !== value && setAppModeOverride(value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors",
              mode === value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary",
            )}
          >
            <Icon className="h-3 w-3" strokeWidth={2} aria-hidden />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
