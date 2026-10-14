/**
 * AI & Chat Beheer — toont/verbergt de Maxim-chatknop en kiest tussen de
 * AI-motor (Infomaniak) en de eenvoudige regelgebaseerde bot.
 */
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MessagesSquare } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { saveChatSettings } from "@/lib/site-admin.functions";
import { DEFAULT_CHAT_SETTINGS, type ChatSettings as ChatSettingsValue } from "@/types/settings";

export function ChatSettings({ chat }: { chat?: ChatSettingsValue }) {
  const qc = useQueryClient();
  const initial = chat ?? DEFAULT_CHAT_SETTINGS;
  const [draft, setDraft] = useState<ChatSettingsValue | null>(null);
  const value = draft ?? initial;

  const mutation = useMutation({
    mutationFn: (data: ChatSettingsValue) => saveChatSettings({ data }),
    onSuccess: () => {
      toast.success("Chatinstellingen bewaard.");
      void qc.invalidateQueries({ queryKey: ["site-config"] });
      setDraft(null);
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Bewaren mislukt."),
  });

  const update = (patch: Partial<ChatSettingsValue>) => setDraft({ ...value, ...patch });

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <header className="mb-4 flex items-center gap-2">
        <MessagesSquare className="h-5 w-5 text-[color:var(--color-terracotta)]" />
        <h2 className="text-lg font-semibold">AI &amp; Chat Beheer</h2>
      </header>

      <div className="flex items-start justify-between gap-4 border-b border-border/60 py-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">Chatknop tonen</p>
          <p className="text-xs text-muted-foreground">
            Verbergt of toont de zwevende Maxim-chat op de hele site.
          </p>
        </div>
        <Switch
          checked={value.chatEnabled}
          onCheckedChange={(v) => update({ chatEnabled: v })}
          aria-label="Chatknop tonen"
        />
      </div>

      <div className="flex items-start justify-between gap-4 border-b border-border/60 py-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">AI-motor gebruiken</p>
          <p className="text-xs text-muted-foreground">
            Aan = Infomaniak AI. Uit = eenvoudige regelgebaseerde FAQ-bot zonder tokens.
          </p>
        </div>
        <Switch
          checked={value.chatAiEnabled}
          onCheckedChange={(v) => update({ chatAiEnabled: v })}
          aria-label="AI-motor gebruiken"
        />
      </div>

      <div className="py-3">
        <label className="text-sm font-medium" htmlFor="chat-offline-message">
          Bericht wanneer de chat uitstaat
        </label>
        <Input
          id="chat-offline-message"
          className="mt-2"
          value={value.offlineMessage}
          maxLength={400}
          onChange={(e) => update({ offlineMessage: e.target.value })}
        />
      </div>

      <div className="mt-2 flex justify-end">
        <Button
          type="button"
          disabled={!draft || mutation.isPending}
          onClick={() => mutation.mutate(value)}
        >
          {mutation.isPending ? "Bewaren…" : "Bewaren"}
        </Button>
      </div>
    </section>
  );
}
