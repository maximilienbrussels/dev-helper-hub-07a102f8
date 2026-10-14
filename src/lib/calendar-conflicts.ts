/**
 * Zachte conflictdetectie voor de agenda: overlapt een nieuwe reservatie,
 * blokkade of eigen evenement met iets anders in dezelfde ruimte?
 */
import type { LocationId } from "./portal-types";

export type CalendarSlot = {
  date: string;
  start_time: string;
  end_time: string;
  location_id: LocationId;
};

export type ConflictItem = CalendarSlot & { id?: string; label: string };

function overlaps(a: CalendarSlot, b: CalendarSlot): boolean {
  if (a.date !== b.date || a.location_id !== b.location_id) return false;
  return a.start_time < b.end_time && b.start_time < a.end_time;
}

/** Alle bestaande items die met het gekozen tijdslot botsen. */
export function findConflicts(
  slot: CalendarSlot,
  existing: ConflictItem[],
  ignoreId?: string,
): ConflictItem[] {
  if (!slot.date || slot.end_time <= slot.start_time) return [];
  return existing.filter((item) => item.id !== ignoreId && overlaps(slot, item));
}

/** Leesbare waarschuwing, bv. "Polyvalente zaal is al bezet 14:00–16:00 (Schoolbezoek)". */
export function conflictMessage(
  locationName: string,
  conflicts: ConflictItem[],
  prefix = "Let op",
): string | null {
  if (conflicts.length === 0) return null;
  const parts = conflicts
    .slice(0, 3)
    .map((c) => `${c.start_time}–${c.end_time}${c.label ? ` (${c.label})` : ""}`);
  return `${prefix}: ${locationName} is al gereserveerd ${parts.join(", ")}.`;
}
