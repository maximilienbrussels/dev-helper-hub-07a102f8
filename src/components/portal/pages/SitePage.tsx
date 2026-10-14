import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Images, Loader2, Megaphone, Power, Share2, ToggleLeft, Wrench } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fetchSiteConfig,
  saveAnnouncement,
  saveFeatureFlag,
  saveMaintenance,
  saveSitePage,
} from "@/lib/site-admin.functions";
import { pathFor } from "@/lib/portal-routes";
import { usePortal } from "@/lib/portal-store";
import { SiteContactSection } from "./SiteContactSection";
import { SocialMediaManager } from "@/components/admin/SocialMediaManager";
import { ChatSettings } from "@/components/admin/ChatSettings";
import { PaymentSettings } from "@/components/admin/PaymentSettings";
import { S3CorsSection } from "./S3CorsSection";
import { MyAccessCard, useMyAccess } from "./MyAccessCard";
import {
  DEFAULT_SITE_CONFIG,
  FEATURE_LABELS,
  MANAGEABLE_PAGES,
  PAGE_LABELS,
  type PageStatus,
  type SiteConfig,
} from "@/lib/site-config";

type SitePageInput = {
  key: string;
  status: PageStatus;
  visibleFrom: string | null;
  visibleTo: string | null;
  noticeNl: string;
  noticeFr: string;
  noticeEn: string;
};

type MaintenanceInput = {
  enabled: boolean;
  messageNl: string;
  messageFr: string;
  messageEn: string;
};

type AnnouncementInput = {
  id: string | null;
  active: boolean;
  tone: "info" | "warning" | "success";
  messageNl: string;
  messageFr: string;
  messageEn: string;
  linkUrl: string | null;
  linkLabelNl: string;
  linkLabelFr: string;
  linkLabelEn: string;
  startsAt: string | null;
  endsAt: string | null;
};

const STATUS_LABELS: Record<PageStatus, string> = {
  visible: "Zichtbaar",
  hidden: "Tijdelijk uit (melding)",
  offline: "Offline (404)",
};

function Section({
  icon: Icon,
  title,
  description,
  badge,
  defaultOpen = false,
  children,
}: {
  icon: typeof Wrench;
  title: string;
  description: string;
  badge?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Accordion
      type="single"
      collapsible
      {...(defaultOpen ? { defaultValue: "item" } : {})}
      className="rounded-2xl border bg-card px-5 shadow-sm"
    >
      <AccordionItem value="item" className="border-b-0">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-start gap-3 text-left">
            <span className="mt-0.5 rounded-lg bg-primary/10 p-2 text-primary">
              <Icon className="h-4 w-4" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-lg leading-tight">{title}</h2>
                {badge ? (
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    🟢 {badge}
                  </span>
                ) : null}
              </div>
              <p className="text-sm font-normal text-muted-foreground">{description}</p>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pb-5">{children}</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

/** Sitebeheer: pagina's uitzetten, onderhoud, modules en aankondigingsbalk. */
export function SitePage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { lang } = usePortal();
  const { data, isLoading } = useQuery({
    queryKey: ["site-config"],
    queryFn: () => fetchSiteConfig(),
  });
  const config: SiteConfig = data ?? DEFAULT_SITE_CONFIG;
  const myAccess = useMyAccess();

  const invalidate = () => qc.invalidateQueries({ queryKey: ["site-config"] });
  const onError = (e: unknown) =>
    toast.error(e instanceof Error ? e.message : "Bewaren mislukt.");

  const pageMutation = useMutation({
    mutationFn: (data: SitePageInput) => saveSitePage({ data }),
    onSuccess: () => {
      toast.success("Pagina bijgewerkt.");
      void invalidate();
    },
    onError,
  });
  const flagMutation = useMutation({
    mutationFn: (data: { key: string; enabled: boolean }) => saveFeatureFlag({ data }),
    onSuccess: () => {
      toast.success("Module bijgewerkt.");
      void invalidate();
    },
    onError,
  });
  const maintenanceMutation = useMutation({
    mutationFn: (data: MaintenanceInput) => saveMaintenance({ data }),
    onSuccess: () => {
      toast.success("Onderhoudsmodus bijgewerkt.");
      void invalidate();
    },
    onError,
  });
  const announcementMutation = useMutation({
    mutationFn: (data: AnnouncementInput) => saveAnnouncement({ data }),
    onSuccess: () => {
      toast.success("Aankondiging bewaard.");
      void invalidate();
    },
    onError,
  });

  const [maintenanceMsg, setMaintenanceMsg] = useState<string | null>(null);
  const maintenanceText = maintenanceMsg ?? config.maintenance.message.nl;

  const [draft, setDraft] = useState<Record<string, string> | null>(null);
  const announcement = config.announcement;
  const form = useMemo(
    () =>
      draft ?? {
        messageNl: announcement?.message.nl ?? "",
        messageFr: announcement?.message.fr ?? "",
        messageEn: announcement?.message.en ?? "",
        linkUrl: announcement?.linkUrl ?? "",
        linkLabelNl: announcement?.linkLabel.nl ?? "",
        tone: announcement?.tone ?? "info",
      },
    [draft, announcement],
  );
  const set = (key: string, value: string) => setDraft({ ...form, [key]: value });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Laden…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      <div>
        <h1 className="font-display text-2xl">Site</h1>
        <p className="text-sm text-muted-foreground">
          Zet pagina's of hele modules tijdelijk uit, plaats een melding bovenaan de site of
          schakel de onderhoudsmodus in.
        </p>
      </div>

      <SiteContactSection contact={config.contact} />

      <Section
        icon={Share2}
        defaultOpen
        title="Social media"
        description="Zet kanalen aan of uit, wijzig de link en bepaal de volgorde in de marquee-balk en e-mails. Onder 5 actieve kanalen scrollt de balk niet automatisch."
      >
        <SocialMediaManager socialLinks={config.socialLinks} />

        <ChatSettings chat={config.chat} />

        <PaymentSettings payments={config.payments} />
      </Section>

      <MyAccessCard />

      <S3CorsSection status={myAccess.data?.storage ?? null} />

      <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4 text-sm">
        💡 Prijzen, verhuur- en servicetarieven beheren? Ga naar{" "}
        <button
          type="button"
          className="font-semibold text-primary underline underline-offset-2"
          onClick={() => navigate({ to: pathFor(lang, "services") })}
        >
          Diensten &amp; tarieven ➔
        </button>
      </div>

      <Section
        icon={Wrench}
        title="Onderhoudsmodus"
        description="De volledige publieke site toont een onderhoudsbericht. Het beheerportaal en de login blijven bereikbaar."
      >
        <div className="flex items-center gap-3">
          <Switch
            checked={config.maintenance.enabled}
            onCheckedChange={(enabled) =>
              maintenanceMutation.mutate({
                enabled,
                messageNl: maintenanceText,
                messageFr: config.maintenance.message.fr,
                messageEn: config.maintenance.message.en,
              })
            }
          />
          <span className="text-sm">
            {config.maintenance.enabled ? "Site staat in onderhoud" : "Site is online"}
          </span>
        </div>
        <div className="mt-4 space-y-2">
          <Label htmlFor="maintenance-msg">Bericht voor bezoekers</Label>
          <Textarea
            id="maintenance-msg"
            rows={2}
            value={maintenanceText}
            onChange={(e) => setMaintenanceMsg(e.target.value)}
            placeholder="We zijn even bezig met een update. Tot straks!"
          />
          <Button
            size="sm"
            onClick={() =>
              maintenanceMutation.mutate({
                enabled: config.maintenance.enabled,
                messageNl: maintenanceText,
                messageFr: config.maintenance.message.fr,
                messageEn: config.maintenance.message.en,
              })
            }
          >
            Bericht bewaren
          </Button>
        </div>
      </Section>

      <Section
        icon={Power}
        title="Pagina's"
        description="Zet een pagina tijdelijk uit (bezoekers zien een nette melding) of volledig offline (404 en uit de sitemap)."
      >
        <ul className="divide-y">
          {MANAGEABLE_PAGES.map((key) => {
            const page = config.pages[key];
            const status = page?.status ?? "visible";
            return (
              <li key={key} className="flex flex-wrap items-center gap-3 py-3">
                <span className="min-w-40 flex-1 text-sm font-medium">
                  {PAGE_LABELS[key] ?? key}
                </span>
                <Input
                  className="h-9 w-full max-w-64"
                  placeholder="Melding voor bezoekers (optioneel)"
                  defaultValue={page?.notice.nl ?? ""}
                  onBlur={(e) => {
                    if ((page?.notice.nl ?? "") === e.target.value) return;
                    pageMutation.mutate({
                      key,
                      status,
                      visibleFrom: page?.visibleFrom ?? null,
                      visibleTo: page?.visibleTo ?? null,
                      noticeNl: e.target.value,
                      noticeFr: page?.notice.fr ?? "",
                      noticeEn: page?.notice.en ?? "",
                    });
                  }}
                />
                <Select
                  value={status}
                  onValueChange={(value) =>
                    pageMutation.mutate({
                      key,
                      status: value as PageStatus,
                      visibleFrom: page?.visibleFrom ?? null,
                      visibleTo: page?.visibleTo ?? null,
                      noticeNl: page?.notice.nl ?? "",
                      noticeFr: page?.notice.fr ?? "",
                      noticeEn: page?.notice.en ?? "",
                    })
                  }
                >
                  <SelectTrigger className="h-9 w-52">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STATUS_LABELS) as PageStatus[]).map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section
        icon={Images}
        title="Pagina-inhoud (Boeken & huren)"
        description="Verhuisd naar Diensten & tarieven → tabblad Pagina's & prijzen."
      >
        <p className="text-sm text-muted-foreground">
          Sfeerbeeld, titel, tekst en prijzen van de animatie-, stage-, verhuur-, teambuilding- en
          seminariepagina's beheer je nu bij Diensten &amp; tarieven.
        </p>
      </Section>



      <Section
        icon={ToggleLeft}
        title="Modules"
        description="Schakel hele functionaliteiten uit, bijvoorbeeld het winkelmandje of online boeken."
      >
        <ul className="divide-y">
          {(Object.keys(FEATURE_LABELS) as (keyof typeof FEATURE_LABELS)[]).map((key) => (
            <li key={key} className="flex items-center justify-between gap-3 py-3">
              <span className="text-sm font-medium">{FEATURE_LABELS[key]}</span>
              <Switch
                checked={config.features[key] !== false}
                onCheckedChange={(enabled) => flagMutation.mutate({ key, enabled })}
              />
            </li>
          ))}
        </ul>
      </Section>

      <Section
        icon={Megaphone}
        title="Aankondigingsbalk"
        description="Eén melding bovenaan elke publieke pagina, in NL/FR/EN."
      >
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1">
            <Label>Nederlands</Label>
            <Input value={form.messageNl} onChange={(e) => set("messageNl", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Frans</Label>
            <Input value={form.messageFr} onChange={(e) => set("messageFr", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Engels</Label>
            <Input value={form.messageEn} onChange={(e) => set("messageEn", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Link (optioneel)</Label>
            <Input value={form.linkUrl} onChange={(e) => set("linkUrl", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Linktekst</Label>
            <Input
              value={form.linkLabelNl}
              onChange={(e) => set("linkLabelNl", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Stijl</Label>
            <Select value={form.tone} onValueChange={(v) => set("tone", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Waarschuwing</SelectItem>
                <SelectItem value="success">Goed nieuws</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button
            onClick={() =>
              announcementMutation.mutate({
                id: announcement?.id ?? null,
                active: true,
                tone: form.tone as "info" | "warning" | "success",
                messageNl: form.messageNl,
                messageFr: form.messageFr,
                messageEn: form.messageEn,
                linkUrl: form.linkUrl || null,
                linkLabelNl: form.linkLabelNl,
                linkLabelFr: "",
                linkLabelEn: "",
                startsAt: null,
                endsAt: null,
              })
            }
          >
            Publiceren
          </Button>
          {announcement?.active ? (
            <Button
              variant="outline"
              onClick={() =>
                announcementMutation.mutate({
                  id: announcement.id,
                  active: false,
                  tone: announcement.tone,
                  messageNl: announcement.message.nl,
                  messageFr: announcement.message.fr,
                  messageEn: announcement.message.en,
                  linkUrl: announcement.linkUrl,
                  linkLabelNl: announcement.linkLabel.nl,
                  linkLabelFr: announcement.linkLabel.fr,
                  linkLabelEn: announcement.linkLabel.en,
                  startsAt: announcement.startsAt,
                  endsAt: announcement.endsAt,
                })
              }
            >
              Verbergen
            </Button>
          ) : null}
        </div>
      </Section>
    </div>
  );
}
