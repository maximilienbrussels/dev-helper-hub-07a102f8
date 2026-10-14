/**
 * Centraal beheer van social-mediakanalen: aan/uit, URL en volgorde.
 * Wordt gebruikt in het sitebeheer-tabblad (SitePage) en stuurt zowel de
 * footer/marquee als de e-mailsjablonen aan via `site_settings.social_links`.
 */
import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Share2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { saveSocialLinks } from "@/lib/site-admin.functions";
import { DEFAULT_SOCIAL_LINKS, type SocialLink } from "@/lib/site-config";

// Alleen beveiligde links toestaan (geen http:// of javascript:).
const URL_PATTERN = /^https:\/\//i;

export function SocialMediaManager({ socialLinks }: { socialLinks: SocialLink[] }) {
  const qc = useQueryClient();
  const initial = useMemo(
    () => (socialLinks.length ? socialLinks : DEFAULT_SOCIAL_LINKS).slice().sort((a, b) => a.order - b.order),
    [socialLinks],
  );
  const [draft, setDraft] = useState<SocialLink[] | null>(null);
  const links = draft ?? initial;

  const mutation = useMutation({
    mutationFn: (data: SocialLink[]) => saveSocialLinks({ data }),
    onSuccess: () => {
      toast.success("Social-mediakanalen bewaard.");
      void qc.invalidateQueries({ queryKey: ["site-config"] });
      setDraft(null);
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Bewaren mislukt."),
  });

  const update = (id: string, patch: Partial<SocialLink>) => {
    setDraft(links.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };

  const move = (id: string, dir: -1 | 1) => {
    const sorted = links.slice().sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((l) => l.id === id);
    const swapIdx = idx + dir;
    if (idx < 0 || swapIdx < 0 || swapIdx >= sorted.length) return;
    const a = sorted[idx]!;
    const b = sorted[swapIdx]!;
    const reordered = sorted.map((l) => {
      if (l.id === a.id) return { ...l, order: b.order };
      if (l.id === b.id) return { ...l, order: a.order };
      return l;
    });
    setDraft(reordered);
  };

  const save = () => {
    mutation.mutate(links.slice().sort((a, b) => a.order - b.order));
  };

  const sorted = links.slice().sort((a, b) => a.order - b.order);
  const activeCount = sorted.filter((l) => l.active).length;

  return (
    <div>
      <p className="mb-3 text-xs text-muted-foreground">
        {activeCount < 5
          ? `${activeCount} actieve kanalen — de balk toont een rustige, statische rij (geen automatisch scrollen onder 5 kanalen).`
          : `${activeCount} actieve kanalen — de balk scrollt automatisch in een naadloze lus.`}
      </p>
      <ul className="divide-y">
        {sorted.map((link, i) => {
          const urlOk = link.url === "" || URL_PATTERN.test(link.url);
          return (
            <li key={link.id} className="flex flex-wrap items-center gap-3 py-3">
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={i === 0}
                  onClick={() => move(link.id, -1)}
                  aria-label={`${link.name} omhoog`}
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={i === sorted.length - 1}
                  onClick={() => move(link.id, 1)}
                  aria-label={`${link.name} omlaag`}
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
              </div>
              <span className="min-w-28 text-sm font-medium">{link.name}</span>
              <div className="min-w-56 flex-1">
                <Input
                  className="h-9"
                  placeholder="https://…"
                  value={link.url}
                  onChange={(e) => update(link.id, { url: e.target.value })}
                />
                {!urlOk ? (
                  <p className="mt-1 text-xs text-destructive">
                    URL moet beginnen met http:// of https://
                  </p>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={link.active}
                  onCheckedChange={(active) => update(link.id, { active })}
                />
                <span className="text-xs text-muted-foreground">
                  {link.active ? "Actief" : "Uit"}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 flex items-center gap-2">
        <span className="rounded-full bg-primary/10 p-1.5 text-primary">
          <Share2 className="h-3.5 w-3.5" />
        </span>
        <Button
          size="sm"
          onClick={save}
          disabled={
            mutation.isPending || sorted.some((l) => l.url !== "" && !URL_PATTERN.test(l.url))
          }
        >
          Social media bewaren
        </Button>
      </div>
    </div>
  );
}
