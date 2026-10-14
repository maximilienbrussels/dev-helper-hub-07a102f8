/**
 * Tarieven — één lijst voor de hele site. Een prijs die hier verandert,
 * verandert zowel op de publieke pagina als in het te betalen bedrag.
 */
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Tag } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchPricingList, savePricing } from "@/lib/pricing.functions";

const GROUP_LABELS: Record<string, string> = {
  rental: "Zalen & ruimtes",
  birthday: "Kinderfeestjes",
  animation: "Schoolanimaties",
  teambuilding: "Teambuilding",
  seminar: "Seminaries",
  camp: "Vakantiestages",
  booking: "Online boeken",
};

export function PricingSection() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["pricing-list"],
    queryFn: () => fetchPricingList(),
  });
  const [draft, setDraft] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: (input: { key: string; amount: number }) => savePricing({ data: input }),
    onSuccess: (_r, input) => {
      toast.success("Tarief bewaard.");
      setDraft((d) => {
        const next = { ...d };
        delete next[input.key];
        return next;
      });
      void qc.invalidateQueries({ queryKey: ["pricing-list"] });
      void qc.invalidateQueries({ queryKey: ["pricing"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Bewaren mislukt."),
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Tarieven laden…
      </div>
    );
  }

  const items = data ?? [];
  const groups = Array.from(new Set(items.map((i) => i.key.split(".")[0] ?? "overig")));

  return (
    <section className="rounded-2xl border bg-card p-5 shadow-sm">
      <header className="mb-4 flex items-start gap-3">
        <span className="mt-0.5 rounded-lg bg-primary/10 p-2 text-primary">
          <Tag className="h-4 w-4" />
        </span>
        <div>
          <h2 className="font-display text-lg leading-tight">Tarieven</h2>
          <p className="text-sm text-muted-foreground">
            Eén lijst voor alles: de prijs op de website én het bedrag dat bezoekers online
            betalen.
          </p>
        </div>
      </header>

      <div className="space-y-6">
        {groups.map((g) => (
          <div key={g}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {GROUP_LABELS[g] ?? g}
            </p>
            <div className="space-y-2">
              {items
                .filter((i) => i.key.startsWith(`${g}.`))
                .map((i) => {
                  const value = draft[i.key] ?? String(i.amount);
                  const changed = draft[i.key] !== undefined && Number(value) !== i.amount;
                  return (
                    <div key={i.key} className="flex items-center gap-3">
                      <span className="min-w-0 flex-1 truncate text-sm">{i.label.nl}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-muted-foreground">€</span>
                        <Input
                          className="w-28"
                          type="number"
                          min={0}
                          step="1"
                          value={value}
                          onChange={(e) => setDraft({ ...draft, [i.key]: e.target.value })}
                        />
                      </div>
                      <Button
                        size="sm"
                        variant={changed ? "default" : "ghost"}
                        disabled={!changed || mutation.isPending}
                        onClick={() => mutation.mutate({ key: i.key, amount: Number(value) })}
                      >
                        Bewaren
                      </Button>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
