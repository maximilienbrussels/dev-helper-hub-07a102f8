import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Award, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { issueBadge, fetchIssuedBadges } from "@/lib/rout-badges.functions";

const today = () => new Date().toISOString().slice(0, 10);

/** Certificaten als badge naar een ROUT-profiel sturen (preview-API, achter vlag). */
export function RoutBadgesSection() {
  const qc = useQueryClient();
  const issue = useServerFn(issueBadge);
  const list = useServerFn(fetchIssuedBadges);
  const q = useQuery({ queryKey: ["rout-badges"], queryFn: () => list() });
  const [form, setForm] = useState({ handle: "", slug: "course-completed", date: "", title: "", description: "", url: "" });
  const [key, setKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [handleError, setHandleError] = useState<string | null>(null);
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (k === "handle") setHandleError(null);
    // Andere inhoud = ander certificaat = nieuwe Idempotency-Key.
    if (k !== "handle") setKey(null);
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const idem = key ?? crypto.randomUUID();
    setKey(idem);
    try {
      const r = await issue({
        data: {
          recipient_handle: form.handle,
          badge_slug: form.slug,
          issue_date: form.date || today(),
          metadata: { title: form.title, description: form.description || undefined, verification_url: form.url || undefined },
          idempotency_key: idem,
        },
      });
      if (r.ok) {
        toast.success(`Badge uitgereikt aan @${form.handle.replace(/^@/, "")}.`);
        setKey(null);
        setForm((f) => ({ ...f, handle: "" }));
      } else if (r.code === "not_found") {
        setHandleError("Deze ROUT-handle bestaat niet. Controleer en verbeter ze.");
        setKey(null);
      } else {
        toast.error(r.message);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Uitreiken mislukt.");
    } finally {
      setBusy(false);
      void qc.invalidateQueries({ queryKey: ["rout-badges"] });
    }
  }

  const off = q.data && (!q.data.enabled || !q.data.configured);
  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-4 md:p-6">
      <header className="flex flex-wrap items-center gap-2">
        <Award className="size-5 text-primary" aria-hidden />
        <h2 className="text-lg font-semibold">Badges op ROUT</h2>
        <Badge variant="outline">Preview</Badge>
      </header>
      {off ? (
        <p className="rounded-xl border border-border bg-muted p-3 text-sm text-muted-foreground">
          {!q.data!.enabled ? "Badges uitreiken staat nog uit." : "De ROUT API-sleutel ontbreekt nog."}
        </p>
      ) : null}
      <form onSubmit={submit} className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="rb-handle">ROUT-handle</Label>
          <Input id="rb-handle" required placeholder="anna" value={form.handle} onChange={set("handle")} aria-invalid={!!handleError} />
          {handleError ? <p className="text-sm text-destructive">{handleError}</p> : null}
        </div>
        <div className="space-y-1">
          <Label htmlFor="rb-slug">Badge</Label>
          <Input id="rb-slug" required value={form.slug} onChange={set("slug")} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="rb-date">Uitgiftedatum</Label>
          <Input id="rb-date" type="date" value={form.date || today()} onChange={set("date")} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="rb-title">Titel</Label>
          <Input id="rb-title" required placeholder="Academy geslaagd" value={form.title} onChange={set("title")} />
        </div>
        <div className="space-y-1 md:col-span-2">
          <Label htmlFor="rb-desc">Beschrijving</Label>
          <Textarea id="rb-desc" rows={2} value={form.description} onChange={set("description")} />
        </div>
        <div className="space-y-1 md:col-span-2">
          <Label htmlFor="rb-url">Verificatielink</Label>
          <Input id="rb-url" type="url" placeholder="https://maximilien.brussels/verify/…" value={form.url} onChange={set("url")} />
        </div>
        <div className="md:col-span-2">
          <Button type="submit" disabled={busy || !!off}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : null} Badge uitreiken
          </Button>
        </div>
      </form>
      {q.data?.rows.length ? (
        <ul className="divide-y divide-border text-sm">
          {q.data.rows.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span>@{r.recipient_handle} · {r.badge_slug} · {r.issue_date}</span>
              <Badge variant={r.status === "issued" ? "default" : "outline"} title={r.last_error ?? undefined}>
                {r.status === "issued" ? "Uitgereikt" : r.status === "failed" ? "Mislukt" : "Bezig"}
              </Badge>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
