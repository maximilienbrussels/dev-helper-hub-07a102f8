import type { Row } from "@/lib/db-types";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Send, ShieldCheck, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/portal/portal-ui";
import { usePortal } from "@/lib/portal-store";
import { fmt } from "@/components/portal/academy/i18n-format";
import { ImagePickerModal } from "@/components/portal/media/ImagePickerModal";
import { ImageUploader } from "@/components/portal/media/ImageUploader";
import type { MediaAsset } from "@/lib/media.functions";
import { AcademyPreviewPanel, type PreviewAcademy } from "@/components/portal/pages/AcademyPreview";
import { usePermissions } from "@/lib/use-permissions";
import {
  fetchAcademyAdmin,
  auditAcademyTranslations,
  saveAcademy,
  setAcademyActive,
  setAcademyStatus,
  saveVraag,
  deleteVraag,
  requestAcademyPublication,
  decideAcademyPublication,
} from "@/lib/academy-admin.functions";
import {
  ACADEMY_STATUSES,
  STATUS_LABEL_KEYS,
  academyInputSchema,
  vraagInputSchema,
  type AcademyStatus,
} from "@/lib/academy-admin-schema";
import { ACADEMY_CATEGORIES, countByCategory } from "@/lib/academy-filter";
import { ISSUE_LABELS } from "@/lib/academy-audit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type AdminData = Awaited<ReturnType<typeof fetchAcademyAdmin>>;
type AdminAcademy = AdminData["academies"][number];
type AdminVraag = AdminAcademy["vragen"][number];

const STATUS_STYLES: Record<string, string> = {
  concept: "border-border bg-muted text-muted-foreground",
  wacht_op_goedkeuring: "border-warning/40 bg-warning/12 text-warning",
  gepubliceerd: "border-success/30 bg-success/12 text-success",
};

function StatusChip({ status }: { status: string }) {
  const { t } = usePortal();
  const key = STATUS_LABEL_KEYS[status as AcademyStatus];
  return (
    <span
      className={cn(
        "rounded-md border px-2 py-0.5 text-[11px] font-semibold",
        STATUS_STYLES[status] ?? STATUS_STYLES.concept,
      )}
    >
      {key ? t(key) : status}
    </span>
  );
}

export function AcademyPage() {
  const qc = useQueryClient();
  const { can } = usePermissions();
  const load = useServerFn(fetchAcademyAdmin);
  const runAudit = useServerFn(auditAcademyTranslations);

  const data = useQuery({ queryKey: ["portal", "academies"], queryFn: () => load() });
  const audit = useQuery({ queryKey: ["portal", "academy-audit"], queryFn: () => runAudit() });

  const mayManage = can("manage_academy");
  const mayPublish = can("publish_academy");

  const academies = data.data?.academies ?? [];
  const openRequests = (data.data?.requests ?? []).filter((r) => r.status === "open");

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["portal", "academies"] });
    qc.invalidateQueries({ queryKey: ["portal", "academy-audit"] });
  };

  if (data.isLoading) {
    return (
      <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Academies laden…
      </div>
    );
  }
  if (data.error) {
    return <p className="p-6 text-sm text-destructive">{(data.error as Error).message}</p>;
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Academies"
        subtitle={`${academies.length} kaarten · ${academies.filter((a) => a.status === "gepubliceerd").length} live${
          mayManage ? "" : " · alleen-lezen"
        }`}
      />

      <Tabs defaultValue="kaarten">
        <TabsList>
          <TabsTrigger value="kaarten">Kaarten</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="controle">
            Controle{audit.data && audit.data.totalIssues > 0 ? ` (${audit.data.totalIssues})` : ""}
          </TabsTrigger>
          <TabsTrigger value="verzoeken">
            Goedkeuringen{openRequests.length > 0 ? ` (${openRequests.length})` : ""}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="kaarten" className="mt-4">
          <CardsTab
            academies={academies}
            mayManage={mayManage}
            mayPublish={mayPublish}
            onChanged={refresh}
          />
        </TabsContent>

        <TabsContent value="preview" className="mt-4">
          <AcademyPreviewPanel academies={academies as unknown as PreviewAcademy[]} />
        </TabsContent>

        <TabsContent value="controle" className="mt-4">
          <AuditTab report={audit.data} loading={audit.isLoading} />
        </TabsContent>

        <TabsContent value="verzoeken" className="mt-4">
          <RequestsTab
            requests={data.data?.requests ?? []}
            academies={academies}
            mayPublish={mayPublish}
            onChanged={refresh}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ------------------------------- Kaarten ------------------------------- */

function CardsTab({
  academies,
  mayManage,
  mayPublish,
  onChanged,
}: {
  academies: AdminAcademy[];
  mayManage: boolean;
  mayPublish: boolean;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState<AdminAcademy | "new" | null>(null);
  const [questionsFor, setQuestionsFor] = useState<AdminAcademy | null>(null);
  const [askFor, setAskFor] = useState<AdminAcademy | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const toggleActive = useServerFn(setAcademyActive);
  const changeStatus = useServerFn(setAcademyStatus);

  const counts = useMemo(() => countByCategory(academies), [academies]);

  const run = async (id: string, fn: () => Promise<unknown>, ok: string) => {
    setBusy(id);
    try {
      await fn();
      toast.success(ok);
      onChanged();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {mayManage && (
          <Button size="sm" onClick={() => setEditing("new")}>
            <Plus className="mr-1 h-4 w-4" /> Nieuwe kaart
          </Button>
        )}
        <p className="text-xs text-muted-foreground">
          {ACADEMY_CATEGORIES.filter((c) => counts[c]).length} categorieën in gebruik
        </p>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {academies.map((a) => (
          <li key={a.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold">
                  {a.badge_icon} {a.diersoort_naam}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {a.categorie} · {a.vragen.length} vragen · {a.slaag_grens} juist nodig
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  FR: {a.diersoort_naam_fr ?? "—"} · EN: {a.diersoort_naam_en ?? "—"}
                </p>
              </div>
              <StatusChip status={a.status} />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Switch
                  checked={a.is_active}
                  disabled={!mayManage || busy === a.id}
                  onCheckedChange={(v) =>
                    run(
                      a.id,
                      () => toggleActive({ data: { id: a.id, is_active: v } }),
                      v ? "Kaart weer zichtbaar" : "Kaart tijdelijk uitgeschakeld",
                    )
                  }
                  aria-label="Tijdelijk in-/uitschakelen"
                />
                {a.is_active ? "Zichtbaar" : "Uitgeschakeld"}
              </span>

              <div className="ml-auto flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setQuestionsFor(a)}>
                  Vragen
                </Button>
                {mayManage && (
                  <Button size="sm" variant="outline" onClick={() => setEditing(a)}>
                    <Pencil className="mr-1 h-3.5 w-3.5" /> Bewerken
                  </Button>
                )}
                {mayPublish ? (
                  <Button
                    size="sm"
                    variant={a.status === "gepubliceerd" ? "outline" : "default"}
                    disabled={busy === a.id}
                    onClick={() =>
                      run(
                        a.id,
                        () =>
                          changeStatus({
                            data: {
                              id: a.id,
                              status: a.status === "gepubliceerd" ? "concept" : "gepubliceerd",
                            },
                          }),
                        a.status === "gepubliceerd" ? "Offline gehaald" : "Live gezet",
                      )
                    }
                  >
                    <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                    {a.status === "gepubliceerd" ? "Offline halen" : "Live zetten"}
                  </Button>
                ) : (
                  mayManage &&
                  a.status !== "gepubliceerd" && (
                    <Button size="sm" variant="secondary" onClick={() => setAskFor(a)}>
                      <Send className="mr-1 h-3.5 w-3.5" /> Goedkeuring vragen
                    </Button>
                  )
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {editing && (
        <AcademyDialog
          academy={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={onChanged}
        />
      )}
      {questionsFor && (
        <QuestionsDialog
          academy={questionsFor}
          mayManage={mayManage}
          onClose={() => setQuestionsFor(null)}
          onSaved={onChanged}
        />
      )}
      {askFor && (
        <RequestDialog academy={askFor} onClose={() => setAskFor(null)} onSaved={onChanged} />
      )}
    </div>
  );
}

/* --------------------------- Kaart bewerken --------------------------- */

function AcademyDialog({
  academy,
  onClose,
  onSaved,
}: {
  academy: AdminAcademy | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const save = useServerFn(saveAcademy);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    slug: academy?.slug ?? "",
    diersoort_naam: academy?.diersoort_naam ?? "",
    diersoort_naam_fr: academy?.diersoort_naam_fr ?? "",
    diersoort_naam_en: academy?.diersoort_naam_en ?? "",
    beschrijving: academy?.beschrijving ?? "",
    beschrijving_fr: academy?.beschrijving_fr ?? "",
    beschrijving_en: academy?.beschrijving_en ?? "",
    categorie: academy?.categorie ?? "boerderij",
    badge_icon: academy?.badge_icon ?? "🐾",
    vragen_per_test: academy?.vragen_per_test ?? 12,
    slaag_grens: academy?.slaag_grens ?? 9,
    prioriteit: academy?.prioriteit ?? 100,
    is_active: academy?.is_active ?? true,
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    const parsed = academyInputSchema.safeParse({ ...form, id: academy?.id ?? null });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Controleer de velden");
      return;
    }
    setBusy(true);
    try {
      await save({ data: parsed.data });
      toast.success(academy ? "Kaart bijgewerkt" : "Kaart aangemaakt als concept");
      onSaved();
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {academy ? `${academy.diersoort_naam} bewerken` : "Nieuwe academykaart"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Slug (URL)">
            <Input value={form.slug} onChange={(e) => set("slug", e.target.value)} />
          </Field>
          <Field label="Categorie">
            <select
              value={form.categorie}
              onChange={(e) => set("categorie", e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
            >
              {ACADEMY_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Naam (NL)">
            <Input
              value={form.diersoort_naam}
              onChange={(e) => set("diersoort_naam", e.target.value)}
            />
          </Field>
          <Field label="Naam (FR)">
            <Input
              value={form.diersoort_naam_fr}
              onChange={(e) => set("diersoort_naam_fr", e.target.value)}
            />
          </Field>
          <Field label="Naam (EN)">
            <Input
              value={form.diersoort_naam_en}
              onChange={(e) => set("diersoort_naam_en", e.target.value)}
            />
          </Field>
          <Field label="Badge (emoji)">
            <Input value={form.badge_icon} onChange={(e) => set("badge_icon", e.target.value)} />
          </Field>
          <Field label="Beschrijving (NL)" full>
            <Textarea
              value={form.beschrijving}
              onChange={(e) => set("beschrijving", e.target.value)}
            />
          </Field>
          <Field label="Beschrijving (FR)" full>
            <Textarea
              value={form.beschrijving_fr}
              onChange={(e) => set("beschrijving_fr", e.target.value)}
            />
          </Field>
          <Field label="Beschrijving (EN)" full>
            <Textarea
              value={form.beschrijving_en}
              onChange={(e) => set("beschrijving_en", e.target.value)}
            />
          </Field>
          <Field label="Vragen per test">
            <Input
              type="number"
              value={form.vragen_per_test}
              onChange={(e) => set("vragen_per_test", Number(e.target.value))}
            />
          </Field>
          <Field label="Slaaggrens">
            <Input
              type="number"
              value={form.slaag_grens}
              onChange={(e) => set("slaag_grens", Number(e.target.value))}
            />
          </Field>
          <Field label="Prioriteit (lager = hoger in lijst)">
            <Input
              type="number"
              value={form.prioriteit}
              onChange={(e) => set("prioriteit", Number(e.target.value))}
            />
          </Field>
          <Field label="Zichtbaar voor bezoekers">
            <div className="flex h-9 items-center">
              <Switch checked={form.is_active} onCheckedChange={(v) => set("is_active", v)} />
            </div>
          </Field>
        </div>

        <p className="text-xs text-muted-foreground">
          Nieuwe kaarten starten als <strong>concept</strong>. Ze komen pas online na goedkeuring
          door iemand met publicatierecht.
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuleren
          </Button>
          <Button onClick={submit} disabled={busy}>
            {busy && <Loader2 className="mr-1 h-4 w-4 animate-spin" />} Opslaan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={cn("space-y-1", full && "sm:col-span-2")}>
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

/* ----------------------------- Vragen ----------------------------- */

function QuestionsDialog({
  academy,
  mayManage,
  onClose,
  onSaved,
}: {
  academy: AdminAcademy;
  mayManage: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState<AdminVraag | "new" | null>(null);
  const remove = useServerFn(deleteVraag);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Vragen — {academy.diersoort_naam}</DialogTitle>
        </DialogHeader>

        {mayManage && (
          <Button size="sm" className="w-fit" onClick={() => setEditing("new")}>
            <Plus className="mr-1 h-4 w-4" /> Vraag toevoegen
          </Button>
        )}

        <ul className="space-y-2">
          {[1, 2, 3].map((module) => (
            <li key={module}>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Module {module}
              </p>
              <ul className="mt-1 space-y-2">
                {academy.vragen
                  .filter((v: Row) => v.module === module)
                  .map((v: Row) => (
                    <li key={v.id} className="rounded-md border border-border bg-card p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{v.vraag_tekst}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            FR {v.vraag_tekst_fr ? "✓" : "✗"} · EN {v.vraag_tekst_en ? "✓" : "✗"} ·{" "}
                            {v.opties.length} opties
                          </p>
                        </div>
                        {mayManage && (
                          <div className="flex shrink-0 gap-1">
                            <Button size="sm" variant="outline" onClick={() => setEditing(v)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                try {
                                  await remove({ data: { id: v.id } });
                                  toast.success("Vraag verwijderd");
                                  onSaved();
                                  onClose();
                                } catch (e) {
                                  toast.error((e as Error).message);
                                }
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
              </ul>
            </li>
          ))}
        </ul>

        {editing && (
          <VraagDialog
            academyId={academy.id}
            vraag={editing === "new" ? null : editing}
            onClose={() => setEditing(null)}
            onSaved={() => {
              onSaved();
              onClose();
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function VraagDialog({
  academyId,
  vraag,
  onClose,
  onSaved,
}: {
  academyId: string;
  vraag: AdminVraag | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const save = useServerFn(saveVraag);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    module: vraag?.module ?? 1,
    doelgroep: ((vraag as { doelgroep?: string } | null)?.doelgroep ?? "beide") as
      "kids" | "16plus" | "beide",
    vraag_type: (vraag?.vraag_type ?? "tekst") as "tekst" | "beeld" | "audio" | "getal",
    vraag_tekst: vraag?.vraag_tekst ?? "",
    vraag_tekst_fr: vraag?.vraag_tekst_fr ?? "",
    vraag_tekst_en: vraag?.vraag_tekst_en ?? "",
    opties: (vraag?.opties ?? ["", "", ""]).join("\n"),
    opties_fr: (vraag?.opties_fr ?? []).join("\n"),
    opties_en: (vraag?.opties_en ?? []).join("\n"),
    correcte_optie_index: vraag?.correcte_optie_index ?? 0,
    media_url: vraag?.media_url ?? "",
    media_alt: vraag?.media_alt ?? "",
    wist_je_dat: vraag?.wist_je_dat ?? "",
    wist_je_dat_fr: vraag?.wist_je_dat_fr ?? "",
    wist_je_dat_en: vraag?.wist_je_dat_en ?? "",
    variant_groep: vraag?.variant_groep ?? "",
    verplicht: vraag?.verplicht ?? false,
    moeilijkheid: vraag?.moeilijkheid ?? 2,
    correct_getal: vraag?.correct_getal == null ? "" : String(vraag.correct_getal),
    getal_marge: vraag?.getal_marge == null ? "0" : String(vraag.getal_marge),
    getal_eenheid: vraag?.getal_eenheid ?? "",
    getal_eenheid_fr: vraag?.getal_eenheid_fr ?? "",
    getal_eenheid_en: vraag?.getal_eenheid_en ?? "",
  });
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const lines = (v: string) =>
    v
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

  const submit = async () => {
    const parsed = vraagInputSchema.safeParse({
      id: vraag?.id ?? null,
      academy_id: academyId,
      module: form.module,
      doelgroep: form.doelgroep,
      vraag_type: form.vraag_type,
      vraag_tekst: form.vraag_tekst,
      vraag_tekst_fr: form.vraag_tekst_fr,
      vraag_tekst_en: form.vraag_tekst_en,
      opties: lines(form.opties),
      opties_fr: lines(form.opties_fr),
      opties_en: lines(form.opties_en),
      correcte_optie_index: form.correcte_optie_index,
      media_url: form.media_url,
      media_alt: form.media_alt,
      wist_je_dat: form.wist_je_dat,
      wist_je_dat_fr: form.wist_je_dat_fr,
      wist_je_dat_en: form.wist_je_dat_en,
      variant_groep: form.variant_groep,
      verplicht: form.verplicht,
      moeilijkheid: form.moeilijkheid,
      correct_getal: form.correct_getal === "" ? null : Number(form.correct_getal),
      getal_marge: Number(form.getal_marge || 0),
      getal_eenheid: form.getal_eenheid,
      getal_eenheid_fr: form.getal_eenheid_fr,
      getal_eenheid_en: form.getal_eenheid_en,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Controleer de velden");
      return;
    }
    setBusy(true);
    try {
      await save({ data: parsed.data });
      toast.success("Vraag opgeslagen");
      onSaved();
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{vraag ? "Vraag bewerken" : "Nieuwe vraag"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Module (1-3)">
            <Input
              type="number"
              min={1}
              max={3}
              value={form.module}
              onChange={(e) => set("module", Number(e.target.value))}
            />
          </Field>
          <Field label="Doelgroep">
            <select
              value={form.doelgroep}
              onChange={(e) => set("doelgroep", e.target.value as typeof form.doelgroep)}
              className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
            >
              <option value="beide">Beide sporen</option>
              <option value="kids">Kinderen &amp; jongeren</option>
              <option value="16plus">16+ &amp; volwassenen</option>
            </select>
          </Field>
          <Field label="Type">
            <select
              value={form.vraag_type}
              onChange={(e) => set("vraag_type", e.target.value as typeof form.vraag_type)}
              className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
            >
              <option value="tekst">tekst</option>
              <option value="beeld">beeld</option>
              <option value="audio">audio</option>
              <option value="getal">getal</option>
            </select>
          </Field>
          <Field label="Moeilijkheid">
            <select value={form.moeilijkheid} onChange={(e) => set("moeilijkheid", Number(e.target.value))} className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm">
              <option value={1}>1 · basis</option><option value={2}>2 · gemiddeld</option><option value={3}>3 · verdiepend</option>
            </select>
          </Field>
          <Field label="Kennisdoel / variantgroep">
            <Input value={form.variant_groep} onChange={(e) => set("variant_groep", e.target.value)} placeholder="bv. dagelijkse-zorg" />
          </Field>
          <Field label="Essentiële welzijnsvraag">
            <div className="flex h-9 items-center gap-2"><Switch checked={form.verplicht} onCheckedChange={(v) => set("verplicht", v)} /><span className="text-xs text-muted-foreground">Iedere deelnemer krijgt deze vraag</span></div>
          </Field>
          <Field label="Vraag (NL)" full>
            <Textarea
              value={form.vraag_tekst}
              onChange={(e) => set("vraag_tekst", e.target.value)}
            />
          </Field>
          <Field label="Vraag (FR)" full>
            <Textarea
              value={form.vraag_tekst_fr}
              onChange={(e) => set("vraag_tekst_fr", e.target.value)}
            />
          </Field>
          <Field label="Vraag (EN)" full>
            <Textarea
              value={form.vraag_tekst_en}
              onChange={(e) => set("vraag_tekst_en", e.target.value)}
            />
          </Field>
          {form.vraag_type !== "getal" && <Field label="Opties NL (één per lijn)">
            <Textarea
              rows={4}
              value={form.opties}
              onChange={(e) => set("opties", e.target.value)}
            />
          </Field>}
          {form.vraag_type !== "getal" && <Field label="Index juist antwoord (0 = eerste)">
            <Input
              type="number"
              min={0}
              value={form.correcte_optie_index}
              onChange={(e) => set("correcte_optie_index", Number(e.target.value))}
            />
          </Field>}
          {form.vraag_type !== "getal" && <Field label="Opties FR (zelfde volgorde)">
            <Textarea
              rows={4}
              value={form.opties_fr}
              onChange={(e) => set("opties_fr", e.target.value)}
            />
          </Field>}
          {form.vraag_type !== "getal" && <Field label="Opties EN (zelfde volgorde)">
            <Textarea
              rows={4}
              value={form.opties_en}
              onChange={(e) => set("opties_en", e.target.value)}
            />
          </Field>}
          {form.vraag_type === "getal" && <>
            <Field label="Juist getal"><Input type="number" step="any" value={form.correct_getal} onChange={(e) => set("correct_getal", e.target.value)} /></Field>
            <Field label="Toegestane afwijking"><Input type="number" min={0} step="any" value={form.getal_marge} onChange={(e) => set("getal_marge", e.target.value)} /></Field>
            <Field label="Eenheid (NL)"><Input value={form.getal_eenheid} onChange={(e) => set("getal_eenheid", e.target.value)} /></Field>
            <Field label="Eenheid (FR)"><Input value={form.getal_eenheid_fr} onChange={(e) => set("getal_eenheid_fr", e.target.value)} /></Field>
            <Field label="Eenheid (EN)"><Input value={form.getal_eenheid_en} onChange={(e) => set("getal_eenheid_en", e.target.value)} /></Field>
          </>}
          <Field label="Afbeelding (optioneel)">
            <ImageUploader
              value={form.media_url || null}
              folder="academie"
              onChange={(url) => set("media_url", url ?? "")}
            />
          </Field>
          <Field label="Media alt-tekst">
            <Input value={form.media_alt} onChange={(e) => set("media_alt", e.target.value)} />
          </Field>
          <Field label="Wist je dat? (NL)" full>
            <Textarea
              value={form.wist_je_dat}
              onChange={(e) => set("wist_je_dat", e.target.value)}
            />
          </Field>
          <Field label="Wist je dat? (FR)" full>
            <Textarea
              value={form.wist_je_dat_fr}
              onChange={(e) => set("wist_je_dat_fr", e.target.value)}
            />
          </Field>
          <Field label="Wist je dat? (EN)" full>
            <Textarea
              value={form.wist_je_dat_en}
              onChange={(e) => set("wist_je_dat_en", e.target.value)}
            />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuleren
          </Button>
          <Button onClick={submit} disabled={busy}>
            {busy && <Loader2 className="mr-1 h-4 w-4 animate-spin" />} Opslaan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ----------------------------- Controle ----------------------------- */

function AuditTab({
  report,
  loading,
}: {
  report: Awaited<ReturnType<typeof auditAcademyTranslations>> | undefined;
  loading: boolean;
}) {
  if (loading || !report) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Controle loopt…
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <div
        className={cn(
          "rounded-lg border p-4 text-sm",
          report.complete
            ? "border-success/30 bg-success/10 text-success"
            : "border-destructive/40 bg-destructive/10 text-destructive",
        )}
      >
        {report.complete
          ? `Alles compleet: ${report.totalAcademies} kaarten en ${report.totalVragen} vragen zijn volledig NL/FR/EN.`
          : `${report.totalIssues} problemen in ${report.totalAcademies - report.completeAcademies} van ${report.totalAcademies} kaarten.`}
      </div>

      <ul className="space-y-2">
        {report.academies.map((a) => (
          <li key={a.id} className="rounded-lg border border-border bg-card p-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold">{a.naam}</p>
              <StatusChip status={a.status} />
              <span
                className={cn(
                  "rounded-md border px-2 py-0.5 text-[11px] font-semibold",
                  a.complete
                    ? "border-success/30 bg-success/12 text-success"
                    : "border-destructive/40 bg-destructive/10 text-destructive",
                )}
              >
                {a.complete ? "NL/FR/EN compleet" : `${a.issues.length} problemen`}
              </span>
              <span className="ml-auto text-xs text-muted-foreground">{a.vragen} vragen</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              {a.modules.map((m) => (
                <span
                  key={m.module}
                  className={cn(
                    "rounded-md border px-2 py-0.5",
                    m.complete
                      ? "border-success/30 bg-success/10 text-success"
                      : "border-destructive/40 bg-destructive/10 text-destructive",
                  )}
                >
                  Module {m.module}: {m.vragen} vragen {m.complete ? "✓" : `· ${m.issues} ✗`}
                </span>
              ))}
            </div>
            {a.issues.length > 0 && (
              <ul className="mt-2 space-y-1 text-xs text-destructive">
                {a.issues.slice(0, 12).map((i, idx) => (
                  <li key={idx}>
                    {i.scope === "kaart" ? "Kaart" : `Module ${i.module} · vraag`} — {i.field} (
                    {i.lang.toUpperCase()}): {ISSUE_LABELS[i.reason]}
                  </li>
                ))}
                {a.issues.length > 12 && <li>… en {a.issues.length - 12} meer</li>}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* --------------------------- Goedkeuringen --------------------------- */

function RequestDialog({
  academy,
  onClose,
  onSaved,
}: {
  academy: AdminAcademy;
  onClose: () => void;
  onSaved: () => void;
}) {
  const ask = useServerFn(requestAcademyPublication);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Goedkeuring vragen — {academy.diersoort_naam}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          De verantwoordelijken met publicatierecht krijgen een melding per e-mail.
        </p>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Korte toelichting (optioneel)"
        />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuleren
          </Button>
          <Button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                const res = await ask({ data: { academy_id: academy.id, note } });
                toast.success(
                  res.notified > 0
                    ? `Verzoek verstuurd naar ${res.notified} verantwoordelijke(n).`
                    : "Verzoek geregistreerd in het portaal.",
                );
                onSaved();
                onClose();
              } catch (e) {
                toast.error((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy && <Loader2 className="mr-1 h-4 w-4 animate-spin" />} Versturen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RequestsTab({
  requests,
  academies,
  mayPublish,
  onChanged,
}: {
  requests: AdminData["requests"];
  academies: AdminAcademy[];
  mayPublish: boolean;
  onChanged: () => void;
}) {
  const decide = useServerFn(decideAcademyPublication);
  const [busy, setBusy] = useState<string | null>(null);
  const naam = (id: string) => academies.find((a) => a.id === id)?.diersoort_naam ?? "onbekend";

  const act = async (id: string, approve: boolean) => {
    setBusy(id);
    try {
      await decide({ data: { request_id: id, approve, decision_note: null } });
      toast.success(approve ? "Goedgekeurd en live gezet" : "Afgewezen");
      onChanged();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  if (requests.length === 0) {
    return <p className="text-sm text-muted-foreground">Geen publicatieverzoeken.</p>;
  }

  return (
    <ul className="space-y-2">
      {requests.map((r) => (
        <li key={r.id} className="rounded-lg border border-border bg-card p-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{naam(r.academy_id)}</p>
            <span className="rounded-md border border-border px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
              {r.status}
            </span>
            <span className="ml-auto text-xs text-muted-foreground">
              {r.requester_email ?? "teamlid"} · {new Date(r.created_at).toLocaleString("nl-BE")}
            </span>
          </div>
          {r.note && <p className="mt-1 text-xs text-muted-foreground">{r.note}</p>}
          {r.status === "open" && mayPublish && (
            <div className="mt-2 flex gap-2">
              <Button size="sm" disabled={busy === r.id} onClick={() => act(r.id, true)}>
                Goedkeuren & live zetten
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busy === r.id}
                onClick={() => act(r.id, false)}
              >
                Afwijzen
              </Button>
            </div>
          )}
          {r.status === "open" && !mayPublish && (
            <p className="mt-2 text-xs text-muted-foreground">
              Wacht op iemand met publicatierecht.
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

export const ACADEMY_STATUS_ORDER = ACADEMY_STATUSES;
