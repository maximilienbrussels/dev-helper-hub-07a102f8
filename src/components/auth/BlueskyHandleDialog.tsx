/**
 * Bluesky is gedecentraliseerd: aan de hand van de handle zoeken we de eigen
 * server (PDS) van de bezoeker op. Daarom vragen we die handle eerst.
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

export const BLUESKY_EXAMPLES = ["@maximilien.site", "user.bsky.social"];

const STORAGE_KEY = "maximilien:bluesky-handle";

export function normaliseHandle(input: string): string {
  let raw = (input || "").trim().toLowerCase().replace(/^@+/, "");
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    try {
      raw = new URL(raw).hostname;
    } catch {
      /* ruwe waarde behouden */
    }
  }
  return raw.replace(/\/+$/, "");
}

export type BlueskyDialogCopy = {
  title: string;
  description: string;
  label: string;
  placeholder: string;
  examples: string;
  submit: string;
};

export function BlueskyHandleDialog({
  open,
  onOpenChange,
  onConfirm,
  copy,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Krijgt de opgeschoonde handle, bv. "alice.bsky.social". */
  onConfirm: (handle: string) => void;
  copy: BlueskyDialogCopy;
}) {
  const [value, setValue] = useState("");

  useEffect(() => {
    if (!open) return;
    try {
      setValue(window.localStorage.getItem(STORAGE_KEY) ?? "");
    } catch {
      setValue("");
    }
  }, [open]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const handle = normaliseHandle(value);
    if (!handle) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, handle);
    } catch {
      /* opslaan is optioneel */
    }
    onOpenChange(false);
    onConfirm(handle);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="bluesky-handle">
              {copy.label}
            </label>
            <Input
              id="bluesky-handle"
              autoFocus
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              inputMode="url"
              placeholder={copy.placeholder}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <span>{copy.examples}</span>
              {BLUESKY_EXAMPLES.map((example) => (
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
            {copy.submit}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
