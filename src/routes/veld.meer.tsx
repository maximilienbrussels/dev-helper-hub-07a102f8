import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Download, Languages, LogOut, Monitor, RefreshCw, Smartphone } from "lucide-react";

import { neonSupabaseCompat as supabase } from "@/lib/neon-auth-compat";
import { usePortal } from "@/lib/portal-store";
import { getAdminUrl } from "@/lib/urls";
import { Button } from "@/components/ui/button";
import { FieldCard, FieldLinkAction, FieldPageHeader } from "@/components/veld/field-ui";
import { cn } from "@/lib/utils";
import { LANGS } from "@/lib/portal-routes";
import type { Lang } from "@/lib/portal-types";
import { usePwaInstall } from "@/lib/pwa-install";

export const Route = createFileRoute("/veld/meer")({
  head: () => ({
    meta: [
      { title: "Meer — Maximilien veld-app" },
      { name: "description", content: "Profiel, taal en afmelden in de veld-app van de stadsboerderij." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Meer — Maximilien veld-app" },
      { property: "og:description", content: "Profiel, taal en afmelden in de veld-app van de stadsboerderij." },
    ],
  }),
  component: FieldMore,
});

function FieldMore() {
  const { currentUser, lang, setLang } = usePortal();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { canInstall, isInstalled, install } = usePwaInstall();

  const displayName = currentUser.name.trim() || "Medewerker";
  const displayEmail = currentUser.email.trim();
  const roleLabel = currentUser.role === "admin" ? "Beheerder" : "Medewerker";
  const teamLabel = "Team Maximilien";

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  }

  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="space-y-4">
      <FieldPageHeader eyebrow="Instellingen" title="Meer" />

      <FieldCard className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3.5">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--surface-forest)] text-[15px] font-bold text-[#f5f2ea]">
          {initials || "?"}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[17px] font-semibold leading-snug">{displayName}</p>
          {displayEmail ? <p className="truncate text-sm text-muted-foreground">{displayEmail}</p> : null}
          <p className="mt-1 truncate text-[11px] font-bold uppercase tracking-[0.12em] text-primary">
            {roleLabel} · {teamLabel}
          </p>
        </div>
      </FieldCard>

      <FieldCard accent className="space-y-3">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.1em] text-primary">
              <Smartphone className="h-4 w-4 shrink-0" aria-hidden /> Applicatie
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {isInstalled
                ? "Deze veld-app staat op je startscherm."
                : canInstall
                  ? "Installeer de veld-app voor snelle toegang."
                  : "Toevoegen aan startscherm via browsermenu."}
            </p>
          </div>
          {isInstalled ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent/12 px-2.5 py-1 text-[10px] font-bold uppercase text-accent">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Geïnstalleerd
            </span>
          ) : null}
        </div>
        {!isInstalled ? (
          <Button
            type="button"
            className="h-14 w-full rounded-xl text-base"
            disabled={!canInstall}
            onClick={() => void install()}
          >
            <Download className="mr-2 h-5 w-5" aria-hidden /> Applicatie installeren
          </Button>
        ) : null}
      </FieldCard>

      <FieldCard>
        <div className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
          <Languages className="h-4 w-4" aria-hidden /> Taal
        </div>
        <div className="mt-3 flex gap-2">
          {LANGS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l as Lang)}
              aria-pressed={lang === l}
              className={cn(
                "min-h-12 flex-1 rounded-xl border text-[15px] font-bold uppercase tracking-wide transition-colors",
                lang === l
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border/70 bg-background/60 text-foreground active:bg-secondary",
              )}
            >
              {l}
            </button>
          ))}
        </div>
      </FieldCard>

      <FieldLinkAction
        href={getAdminUrl("/portaal")}
        icon={<Monitor className="h-5 w-5" aria-hidden />}
        className="h-14 w-full bg-card text-base"
      >
        Volledig beheer openen
      </FieldLinkAction>

      <Button
        type="button"
        variant="secondary"
        className="h-14 w-full rounded-xl text-base"
        onClick={() => window.location.reload()}
      >
        <RefreshCw className="mr-2 h-5 w-5" aria-hidden /> Gegevens vernieuwen
      </Button>

      <Button
        type="button"
        variant="destructive"
        className="h-14 w-full rounded-xl text-base"
        onClick={signOut}
      >
        <LogOut className="mr-2 h-5 w-5" aria-hidden /> Afmelden
      </Button>
    </div>
  );
}
