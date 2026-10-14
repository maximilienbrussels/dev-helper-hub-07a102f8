import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CheckCircle2, ListChecks } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  FieldCard,
  FieldEmpty,
  FieldMeta,
  FieldPageHeader,
  FieldSkeletonList,
  StatusPill,
} from "@/components/veld/field-ui";
import { useTasks } from "@/lib/use-tasks";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/veld/taken")({
  head: () => ({
    meta: [
      { title: "Taken — Maximilien veld-app" },
      { name: "description", content: "Dagelijkse terreintaken per zone met afvinken." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Taken — Maximilien veld-app" },
      { property: "og:description", content: "Dagelijkse terreintaken per zone met afvinken." },
    ],
  }),
  component: FieldTasks,
});

function FieldTasks() {
  const { board, isLoading, setTaskStatus } = useTasks();
  const [zone, setZone] = useState<string>("all");
  const [mine, setMine] = useState(false);

  const list = useMemo(
    () =>
      board.tasks
        .filter((t) => t.status === "open" || t.status === "bezig")
        .filter((t) => zone === "all" || t.zone_id === zone)
        .filter((t) => !mine || t.assigned_to === board.currentUserId)
        .sort((a, b) => (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999")),
    [board, zone, mine],
  );

  const zoneName = (id: string | null) =>
    board.zones.find((z) => z.id === id)?.name ?? "Geen zone";

  return (
    <div className="space-y-4">
      <FieldPageHeader title="Taken" subtitle="Werk van vandaag op het terrein" />

      <div className="flex gap-2 overflow-x-auto pb-1">
        <FilterChip active={mine} onClick={() => setMine((v) => !v)} label="Mijn taken" />
        <FilterChip active={zone === "all"} onClick={() => setZone("all")} label="Alle zones" />
        {board.zones.map((z) => (
          <FilterChip
            key={z.id}
            active={zone === z.id}
            onClick={() => setZone(z.id)}
            label={z.name}
          />
        ))}
      </div>

      {isLoading ? (
        <FieldSkeletonList />
      ) : list.length === 0 ? (
        <FieldEmpty
          icon={<ListChecks className="size-6" />}
          title="Geen openstaande taken"
          hint="Nieuwe taken verschijnen hier zodra ze zijn aangemaakt."
        />
      ) : (
        <ul className="space-y-3">
          {list.map((task) => (
            <li key={task.id}>
              <FieldCard>
                <p className="text-base font-semibold">{task.title}</p>
                <FieldMeta>
                  {zoneName(task.zone_id)}
                  {task.due_date ? ` · ${task.due_date}` : ""}
                </FieldMeta>
                {task.description ? (
                  <p className="mt-2 text-sm text-muted-foreground">{task.description}</p>
                ) : null}
                <div className="mt-3 flex items-center justify-between gap-3">
                  <StatusPill tone={task.priority === "hoog" ? "active" : "neutral"}>
                    {task.priority}
                  </StatusPill>
                  <Button
                    className="min-h-[48px]"
                    onClick={() => setTaskStatus({ id: task.id, status: "afgerond" })}
                  >
                    <CheckCircle2 className="mr-2 size-5" /> Afronden
                  </Button>
                </div>
              </FieldCard>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground",
      )}
    >
      {label}
    </button>
  );
}
