/**
 * Mastodon is gedecentraliseerd: elke bezoeker heeft een eigen server.
 * Daarom vragen we die eerst op in plaats van blind naar mastodon.social
 * te sturen. De invoer wordt opgeschoond (https://, http://, slashes).
 */
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getSavedInstance, normaliseInstance, saveInstance } from "@/lib/mastodon";

export const MASTODON_EXAMPLES = ["mastodon-belgium.be", "mastodon.social", "fosstodon.org"];

export function MastodonInstanceDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Krijgt het opgeschoonde domein, bv. "fosstodon.org". */
  onConfirm: (instance: string) => void;
}) {
  const [value, setValue] = useState("");

  // Bij het openen tonen we de server die de bezoeker eerder gebruikte.
  useEffect(() => {
    if (open) setValue(getSavedInstance());
  }, [open]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const instance = normaliseInstance(value) || "mastodon.social";
    saveInstance(instance);
    onOpenChange(false);
    onConfirm(instance);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Vul je Mastodon server in</DialogTitle>
          <DialogDescription>
            Mastodon bestaat uit veel zelfstandige servers. Geef de server op waar jouw account
            staat, dan sturen we je daarheen om in te loggen.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="mastodon-instance">
              Vul je Mastodon server in
            </label>
            <Input
              id="mastodon-instance"
              autoFocus
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              inputMode="url"
              placeholder="mastodon.social"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <span>Bijvoorbeeld:</span>
              {MASTODON_EXAMPLES.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setValue(example)}
                  className="rounded-full border border-border px-2 py-0.5 transition-colors hover:border-foreground/40 hover:text-foreground"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full">
            Doorgaan met inloggen →
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
