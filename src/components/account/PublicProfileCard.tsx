/** Instellingen voor het openbare profiel: zichtbaarheid per onderdeel + link. */
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Copy, ExternalLink, Globe, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useT } from "@/lib/i18n";
import { getMyProfileSettings, updateMyProfileSettings, type ProfileSettings } from "@/lib/public-profile.functions";

const ROWS: Array<{ key: keyof ProfileSettings; label: string; hint: string }> = [
  { key: "show_name", label: "Naam en foto", hint: "Anders tonen we \"Boerderijvriend\"." },
  { key: "show_timeline", label: "Tijdlijn", hint: "Je recente activiteit, van nieuw naar oud." },
  { key: "show_badges", label: "Badges", hint: "Hoeveel academy-badges je behaalde." },
  { key: "show_certificates", label: "Certificaten", hint: "Met link naar de controlepagina." },
  { key: "show_hooi", label: "Spaarpad", hint: "Hoeveel hooi je spaarde." },
  { key: "show_follows", label: "Volgers", hint: "Aantal volgers en wie je volgt." },
];

export function PublicProfileCard() {
  const { lang } = useT();
  const getFn = useServerFn(getMyProfileSettings);
  const saveFn = useServerFn(updateMyProfileSettings);
  const [s, setS] = useState<ProfileSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getFn().then(setS).catch(() => toast.error("Profielinstellingen laden mislukt."));
  }, [getFn]);

  async function save(next: ProfileSettings) {
    setS(next);
    setSaving(true);
    try {
      const { public_id: _p, ...data } = next;
      await saveFn({ data });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Opslaan mislukt.");
    } finally {
      setSaving(false);
    }
  }

  const url = s && typeof window !== "undefined" ? `${window.location.origin}/${lang}/u/${s.public_id}` : "";

  return (
    <div className="rounded-[1.75rem] border border-border bg-card p-6 shadow-sm md:p-8">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider">
          <Globe className="size-4 text-primary" /> Openbaar profiel
        </h2>
        {saving && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
      </div>
      {!s ? (
        <Loader2 className="mt-4 size-5 animate-spin text-muted-foreground" />
      ) : (
        <div className="mt-4 space-y-4">
          <div className="flex items-start justify-between gap-4 rounded-2xl border border-border p-4">
            <div className="min-w-0">
              <Label htmlFor="pp-public" className="text-sm font-medium">Profiel openbaar</Label>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {s.is_public ? "Iedereen met de link ziet je profiel." : "Enkel jij weet dat je profiel bestaat."}
              </p>
            </div>
            <Switch id="pp-public" checked={s.is_public} onCheckedChange={(v) => void save({ ...s, is_public: v })} />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-xl bg-[color:var(--surface-page)] px-3 py-2 text-xs">{url}</code>
            <Button size="sm" variant="outline" onClick={() => void navigator.clipboard?.writeText(url).then(() => toast.success("Link gekopieerd."))}>
              <Copy className="mr-1.5 size-3.5" /> Kopiëren
            </Button>
            <Button size="sm" variant="outline" asChild>
              <a href={`/${lang}/u/${s.public_id}`} target="_blank" rel="noopener">
                <ExternalLink className="mr-1.5 size-3.5" /> Bekijken
              </a>
            </Button>
          </div>

          <fieldset disabled={!s.is_public} className="space-y-3 disabled:opacity-50">
            {ROWS.map((r) => (
              <div key={r.key} className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <Label htmlFor={`pp-${r.key}`} className="text-sm font-medium">{r.label}</Label>
                  <p className="mt-0.5 text-xs text-muted-foreground">{r.hint}</p>
                </div>
                <Switch
                  id={`pp-${r.key}`}
                  checked={Boolean(s[r.key])}
                  disabled={!s.is_public}
                  onCheckedChange={(v) => void save({ ...s, [r.key]: v })}
                />
              </div>
            ))}
            <div className="space-y-1">
              <Label htmlFor="pp-bio" className="text-sm font-medium">Korte bio</Label>
              <Textarea
                id="pp-bio"
                maxLength={280}
                rows={2}
                defaultValue={s.bio ?? ""}
                placeholder="Bv. Kippenfan en vaste klant van de moestuin."
                onBlur={(e) => {
                  const bio = e.target.value.trim() || null;
                  if (bio !== s.bio) void save({ ...s, bio });
                }}
              />
            </div>
          </fieldset>
        </div>
      )}
    </div>
  );
}
