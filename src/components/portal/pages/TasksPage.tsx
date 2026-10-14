/** Beheerpagina: terreintaken aanmaken, toewijzen, filteren en afronden. */
import { useMemo, useState } from "react";
import { CheckCircle2, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTasks, type TaskFormInput } from "@/lib/use-tasks";
import type { FarmTask } from "@/lib/tasks.functions";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  open: "Open",
  bezig: "Bezig",
  afgerond: "Afgerond",
  geannuleerd: "Geannuleerd",
};

const EMPTY_FORM: TaskFormInput = {
  title: "",
  description: "",
  zone_id: null,
  assigned_to: null,
  due_date: null,
  priority: "normaal",
  status: "open",
};

export function TasksPage() {
  const { board, isLoading, saveTask, setTaskStatus, deleteTask } = useTasks();
  const [zoneFilter, setZoneFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("open");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<TaskFormInput>(EMPTY_FORM);

  const zoneName = (id: string | null) =>
    board.zones.find((z) => z.id === id)?.name ?? "Geen zone";
  const staffName = (id: string | null) =>
    board.staff.find((s) => s.id === id)?.name ?? "Niet toegewezen";

  const list = useMemo(
    () =>
      board.tasks
        .filter((t) => zoneFilter === "all" || t.zone_id === zoneFilter)
        .filter((t) =>
          statusFilter === "all"
            ? true
            : statusFilter === "open"
              ? t.status === "open" || t.status === "bezig"
              : t.status === statusFilter,
        ),
    [board.tasks, zoneFilter, statusFilter],
  );

  const edit = (task: FarmTask) => {
    setForm({
      id: task.id,
      title: task.title,
      description: task.description,
      zone_id: task.zone_id,
      assigned_to: task.assigned_to,
      due_date: task.due_date,
      priority: task.priority,
      status: task.status,
    });
    setOpen(true);
  };

  const submit = () => {
    if (!form.title.trim()) return;
    saveTask(form);
    setOpen(false);
    setForm(EMPTY_FORM);
  };

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">Taken & terreinzones</h1>
          <p className="text-sm text-muted-foreground">
            Maak taken aan, wijs ze toe aan een medewerker en volg ze op per zone.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setForm(EMPTY_FORM)}>
              <Plus className="mr-2 size-4" /> Nieuwe taak
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{form.id ? "Taak bewerken" : "Nieuwe taak"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label htmlFor="task-title">Titel</Label>
                <Input
                  id="task-title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="task-desc">Omschrijving</Label>
                <Textarea
                  id="task-desc"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="task-zone">Zone</Label>
                  <select
                    id="task-zone"
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={form.zone_id ?? ""}
                    onChange={(e) => setForm({ ...form, zone_id: e.target.value || null })}
                  >
                    <option value="">Geen zone</option>
                    {board.zones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="task-staff">Toegewezen aan</Label>
                  <select
                    id="task-staff"
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={form.assigned_to ?? ""}
                    onChange={(e) => setForm({ ...form, assigned_to: e.target.value || null })}
                  >
                    <option value="">Niet toegewezen</option>
                    {board.staff.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="task-due">Vervaldatum</Label>
                  <Input
                    id="task-due"
                    type="date"
                    value={form.due_date ?? ""}
                    onChange={(e) => setForm({ ...form, due_date: e.target.value || null })}
                  />
                </div>
                <div>
                  <Label htmlFor="task-priority">Prioriteit</Label>
                  <select
                    id="task-priority"
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={form.priority}
                    onChange={(e) =>
                      setForm({ ...form, priority: e.target.value as TaskFormInput["priority"] })
                    }
                  >
                    <option value="laag">Laag</option>
                    <option value="normaal">Normaal</option>
                    <option value="hoog">Hoog</option>
                  </select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={submit}>Bewaren</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <div className="flex flex-wrap gap-2">
        <select
          aria-label="Filter op zone"
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          value={zoneFilter}
          onChange={(e) => setZoneFilter(e.target.value)}
        >
          <option value="all">Alle zones</option>
          {board.zones.map((z) => (
            <option key={z.id} value={z.id}>
              {z.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter op status"
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="open">Openstaand</option>
          <option value="afgerond">Afgerond</option>
          <option value="geannuleerd">Geannuleerd</option>
          <option value="all">Alles</option>
        </select>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Laden…</p>
      ) : list.length === 0 ? (
        <p className="rounded-xl border border-border/70 bg-card p-6 text-sm text-muted-foreground">
          Geen taken in deze selectie.
        </p>
      ) : (
        <ul className="space-y-2">
          {list.map((task) => (
            <li
              key={task.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border/70 bg-card p-4"
            >
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "truncate font-semibold",
                    task.status === "afgerond" && "text-muted-foreground line-through",
                  )}
                >
                  {task.title}
                </p>
                {task.description ? (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {task.description}
                  </p>
                ) : null}
                <p className="mt-2 text-xs text-muted-foreground">
                  {zoneName(task.zone_id)} · {staffName(task.assigned_to)} ·{" "}
                  {task.due_date ?? "geen datum"} · {task.priority} ·{" "}
                  {STATUS_LABEL[task.status] ?? task.status}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button size="sm" variant="outline" onClick={() => edit(task)}>
                  Bewerken
                </Button>
                {task.status !== "afgerond" ? (
                  <Button
                    size="sm"
                    onClick={() => setTaskStatus({ id: task.id, status: "afgerond" })}
                  >
                    <CheckCircle2 className="mr-1 size-4" /> Afronden
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setTaskStatus({ id: task.id, status: "open" })}
                  >
                    Heropenen
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label="Taak verwijderen"
                  onClick={() => deleteTask({ id: task.id })}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
