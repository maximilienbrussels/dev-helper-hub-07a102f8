/**
 * Teamtoewijzingen voor één reservatie: teamlid + taak toevoegen/verwijderen.
 * Gebruikt in BookingDetail.
 */
import { useState } from "react";
import { Trash2, UserPlus } from "lucide-react";
import { usePortal } from "@/lib/portal-store";
import type { Assignment } from "@/lib/calendar-admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AssignmentsSection({
  bookingId,
  assignments,
  onAssign,
  onRemove,
}: {
  bookingId: string;
  assignments: Assignment[];
  onAssign: (input: { bookingId: string; profileId: string; task: string }) => void;
  onRemove: (input: { id: string }) => void;
}) {
  const { t, staff } = usePortal();
  const [profileId, setProfileId] = useState<string>("");
  const [task, setTask] = useState("");

  const active = staff.filter((s) => s.active);

  return (
    <div>
      <p className="mb-1.5 text-xs font-bold tracking-wide text-muted-foreground uppercase">
        {t("calendar.assignedStaff")}
      </p>
      <ul className="space-y-1.5">
        {assignments.length ? (
          assignments.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between gap-2 rounded-md border-l-2 border-l-accent bg-surface px-3 py-2 text-sm"
            >
              <span className="min-w-0 truncate">
                <span className="font-semibold">{a.profileName}</span>
                {a.task ? <span className="text-muted-foreground"> · {a.task}</span> : null}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 shrink-0 text-destructive hover:bg-destructive/10"
                aria-label={t("calendar.removeAssignment")}
                onClick={() => onRemove({ id: a.id })}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </li>
          ))
        ) : (
          <li className="text-sm text-muted-foreground">{t("calendar.noAssignments")}</li>
        )}
      </ul>

      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
        <Select value={profileId} onValueChange={setProfileId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("calendar.assignStaff")} />
          </SelectTrigger>
          <SelectContent>
            {active.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          value={task}
          maxLength={160}
          placeholder={t("calendar.taskPlaceholder")}
          onChange={(e) => setTask(e.target.value)}
        />
        <Button
          size="sm"
          disabled={!profileId}
          onClick={() => {
            onAssign({ bookingId, profileId, task: task.trim() });
            setProfileId("");
            setTask("");
          }}
        >
          <UserPlus className="size-4" />
          <span className="sm:hidden">{t("calendar.assignStaff")}</span>
        </Button>
      </div>
    </div>
  );
}
