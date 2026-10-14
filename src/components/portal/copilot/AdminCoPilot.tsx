/**
 * Admin AI Co-Pilot: chatvenster met tool-aansturing voor site-instellingen,
 * tarieven, openingsuren en afbeeldingen. Elke uitgevoerde actie verschijnt
 * als een kaart met voorbeeld, live-link, testmail-knop en "Ongedaan maken".
 */
import { useRef, useState, type DragEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Paperclip, Send, Sparkles, Undo2, X } from "lucide-react";

import { usePortal } from "@/lib/portal-store";
import { translate } from "@/lib/portal-i18n";
import { PageHeader } from "@/components/portal/portal-ui";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { neonSupabaseCompat as supabase } from "@/lib/neon-auth-compat";
import { sendEmailTemplateTests } from "@/lib/email-admin.functions";
import { handleImageError } from "@/lib/image-fallback";
import {
  getOfflineRuleResponse,
  readOfflineCache,
  type QuickChip,
} from "@/lib/bot/FallbackRuleEngine";

const TESTABLE_TEMPLATES = ["pickup_ticket", "booking_confirmation", "auth_code", "general_notice"] as const;

type ChatAction = {
  id: string;
  actionExecuted: string;
  targetTable: string;
  targetId: string | null;
  newValue: unknown;
  previousValue: unknown;
  preview?: { imageUrl?: string; location: string; liveUrl?: string; testMailTemplateId?: string };
  undone?: boolean;
  testMailSent?: boolean;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageUrls?: string[];
  actions?: ChatAction[];
  /** Antwoord kwam van de offline-regelmotor (AI onbereikbaar). */
  offline?: boolean;
  chips?: QuickChip[];
};

type PendingImage = { url: string; name: string };

async function authHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }) as never);
  const token = data?.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function findImageUrl(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  for (const v of Object.values(value as Record<string, unknown>)) {
    if (typeof v === "string" && /^https?:\/\//.test(v) && /\.(png|jpe?g|webp|gif|avif)(\?|$)/i.test(v)) {
      return v;
    }
  }
  return null;
}

export function AdminCoPilot({ embedded = false }: { embedded?: boolean } = {}) {
  const { lang } = usePortal();
  const t = (k: string) => translate(k, lang);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sendTestMail = useServerFn(sendEmailTemplateTests);

  const examples = [t("copilot.example1"), t("copilot.example2"), t("copilot.example3")];

  const uploadImage = async (file: File) => {
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      toast.error(t("copilot.dropHint"));
      return;
    }
    setUploading(true);
    try {
      const res = await fetch("/api/admin/upload-s3", {
        method: "POST",
        headers: { "content-type": "application/json", ...(await authHeader()) },
        body: JSON.stringify({ fileName: file.name, fileType: file.type }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { uploadUrl, publicUrl, headers } = (await res.json()) as {
        uploadUrl: string;
        publicUrl: string;
        headers?: Record<string, string>;
      };
      const putHeaders = headers ?? { "content-type": file.type };
      const put = await fetch(uploadUrl, { method: "PUT", headers: putHeaders, body: file });
      if (!put.ok) throw new Error(`Upload mislukt [${put.status}]`);
      setPendingImages((prev) => [...prev, { url: publicUrl, name: file.name }]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Opladen mislukt.");
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files ?? []);
    files.forEach((f) => void uploadImage(f));
  };

  const chatMutation = useMutation({
    mutationFn: async (payload: { content: string; imageUrls: string[] }) => {
      const nextMessages = [
        ...messages.map((m) => ({ role: m.role, content: m.content, ...(m.imageUrls?.length ? { imageUrls: m.imageUrls } : {}) })),
        { role: "user" as const, content: payload.content, ...(payload.imageUrls.length ? { imageUrls: payload.imageUrls } : {}) },
      ];
      const res = await fetch("/api/admin/co-pilot", {
        method: "POST",
        headers: { "content-type": "application/json", ...(await authHeader()) },
        body: JSON.stringify({ messages: nextMessages, lang }),
      });
      const body = (await res.json().catch(() => ({}))) as { reply?: string; actions?: ChatAction[]; error?: string };
      if (!res.ok) throw new Error(body.error || t("copilot.error"));
      return body;
    },
    onSuccess: (body) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: body.reply ?? "",
          actions: body.actions ?? [],
        },
      ]);
    },
    // Geen foutmelding tonen: we vallen terug op de offline-regelmotor.
    onError: (_e, variables) => {
      const offline = getOfflineRuleResponse(variables.content, readOfflineCache());
      setMessages((prev) => [
        ...prev,
        {
          id: `o-${Date.now()}`,
          role: "assistant",
          content: offline.reply,
          offline: true,
          chips: offline.chips,
        },
      ]);
    },
  });

  const send = (text?: string) => {
    const content = (text ?? input).trim();
    if (!content && pendingImages.length === 0) return;
    const imageUrls = pendingImages.map((p) => p.url);
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: "user", content, ...(imageUrls.length ? { imageUrls } : {}) },
    ]);
    setInput("");
    setPendingImages([]);
    chatMutation.mutate({ content, imageUrls });
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }));
  };

  const undoAction = async (msgId: string, action: ChatAction) => {
    try {
      const res = await fetch("/api/admin/co-pilot/undo", {
        method: "POST",
        headers: { "content-type": "application/json", ...(await authHeader()) },
        body: JSON.stringify({ actionId: action.id }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(body.error || t("copilot.error"));
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? { ...m, actions: m.actions?.map((a) => (a.id === action.id ? { ...a, undone: true } : a)) }
            : m,
        ),
      );
      toast.success(t("copilot.undone"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("copilot.error"));
    }
  };

  const sendTest = async (msgId: string, action: ChatAction, templateId: string) => {
    try {
      const { data } = await supabase.auth.getUser();
      const to = data.user?.email;
      if (!to) throw new Error("Geen e-mailadres gevonden.");
      await sendTestMail({ data: { to, templates: [templateId as (typeof TESTABLE_TEMPLATES)[number]], langs: [lang] } });
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? { ...m, actions: m.actions?.map((a) => (a.id === action.id ? { ...a, testMailSent: true } : a)) }
            : m,
        ),
      );
      toast.success(t("copilot.testMailSent"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("copilot.error"));
    }
  };

  return (
    <div className={cn("flex flex-col gap-4", embedded ? "w-full" : "mx-auto max-w-3xl")}>
      {embedded ? null : (
        <PageHeader title={t("copilot.title")} subtitle={t("copilot.subtitle")} />
      )}

      <div className="flex flex-wrap gap-2">
        {examples.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => send(ex)}
            className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted"
          >
            {ex}
          </button>
        ))}
      </div>

      <div
        ref={scrollRef}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          "relative flex flex-col gap-4 overflow-y-auto rounded-2xl border border-border bg-card p-4",
          embedded ? "min-h-[16rem]" : "min-h-[420px]",
          dragOver && "ring-2 ring-primary",
        )}
      >
        {dragOver ? (
          <div className="pointer-events-none absolute inset-2 grid place-items-center rounded-xl border-2 border-dashed border-primary bg-primary/5 text-sm font-medium text-primary">
            {t("copilot.dropHint")}
          </div>
        ) : null}

        {messages.length === 0 ? (
          <div className="grid flex-1 place-items-center text-center text-sm text-muted-foreground">
            <div>
              <Sparkles className="mx-auto mb-2 size-6 text-primary" />
              {t("copilot.subtitle")}
            </div>
          </div>
        ) : null}

        {messages.map((m) => (
          <div key={m.id} className={cn("flex flex-col gap-2", m.role === "user" ? "items-end" : "items-start")}>
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap",
                m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
              )}
            >
              {m.content}
            </div>
            {m.offline ? (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                ⚡ Offline-assistent
              </span>
            ) : null}
            {m.chips?.length ? (
              <div className="flex flex-wrap gap-2">
                {m.chips.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => send(c.label)}
                    className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium transition hover:bg-muted"
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            ) : null}

            {m.imageUrls?.length ? (
              <div className="flex flex-wrap gap-2">
                {m.imageUrls.map((u) => (
                  <img loading="lazy" key={u} src={u} alt="" onError={handleImageError} className="size-16 rounded-lg object-cover" />
                ))}
              </div>
            ) : null}

            {m.actions?.map((a) => {
              const img = a.preview?.imageUrl ?? findImageUrl(a.newValue);
              const canTest =
                a.preview?.testMailTemplateId &&
                (TESTABLE_TEMPLATES as readonly string[]).includes(a.preview.testMailTemplateId);
              return (
                <div key={a.id} className="w-full max-w-[85%] rounded-xl border border-border bg-background p-3 text-xs">
                  <p className="mb-1 flex items-center gap-1.5 font-semibold text-primary">
                    <Sparkles className="size-3.5" /> {t("copilot.actionExecuted")}: {a.actionExecuted}
                  </p>
                  <p className="text-muted-foreground">{a.preview?.location ?? a.targetTable}</p>
                  {img ? (
                    <img loading="lazy" src={img} alt="" onError={handleImageError} className="mt-2 h-24 w-full rounded-lg object-cover" />
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-3">
                    {a.preview?.liveUrl ? (
                      <a
                        href={a.preview.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-primary hover:underline"
                      >
                        {t("copilot.viewLive")}
                      </a>
                    ) : null}
                    {canTest && !a.testMailSent ? (
                      <button
                        type="button"
                        className="font-semibold text-primary hover:underline"
                        onClick={() => void sendTest(m.id, a, a.preview!.testMailTemplateId!)}
                      >
                        {t("copilot.sendTestMail")}
                      </button>
                    ) : null}
                    {a.testMailSent ? <span className="text-muted-foreground">{t("copilot.testMailSent")}</span> : null}
                    {!a.undone ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 font-semibold text-destructive hover:underline"
                        onClick={() => void undoAction(m.id, a)}
                      >
                        <Undo2 className="size-3.5" /> {t("copilot.undo")}
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-muted-foreground">{t("copilot.undone")}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {chatMutation.isPending ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> {t("copilot.thinking")}
          </div>
        ) : null}
      </div>

      {pendingImages.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {pendingImages.map((img) => (
            <div key={img.url} className="relative">
              <img loading="lazy" src={img.url} alt={img.name} className="size-14 rounded-lg object-cover" />
              <button
                type="button"
                onClick={() => setPendingImages((prev) => prev.filter((p) => p.url !== img.url))}
                className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-destructive text-destructive-foreground"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex items-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          aria-label={t("copilot.attach")}
        >
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <Paperclip className="size-4" />}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void uploadImage(file);
            e.target.value = "";
          }}
        />
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={t("copilot.placeholder")}
          rows={1}
          className="min-h-[42px] flex-1 resize-none"
        />
        <Button type="button" onClick={() => send()} disabled={chatMutation.isPending}>
          <Send className="size-4" />
          {t("copilot.send")}
        </Button>
      </div>
    </div>
  );
}
