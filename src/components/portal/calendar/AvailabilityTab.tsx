/**
 * Beheer van de publieke boekingsbeschikbaarheid:
 * - standaardregels per formule en weekdag,
 * - slots genereren voor een periode,
 * - handmatige overrides per slot (capaciteit, blokkeren, notitie),
 * - sluitingsdagen blokkeren.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Ban, Loader2, Plus, RefreshCw, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePermissions } from "@/lib/use-permissions";
import {
  FORMULA_LABELS,
  FORMULA_TYPES,
  WEEKDAY_LABELS,
  isoDate,
  type FormulaType,
} from "@/lib/availability";
import {
  deleteSlot,
  deleteSlotRule,
  fetchAvailabilityAdmin,
  generateSlots,
  saveSlot,
  saveSlotRule,
  toggleBlockedDate,
  type AvailabilityAdminSnapshot,
} from "@/lib/availability.functions";

const monthStart = () => {
  const d = new Date();
  d.setDate(1);
  return isoDate(d);
};
const monthsAhead = (n: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() + n);
  return isoDate(d);
};

type NewRule = {
  formulaType: FormulaType;
  weekday: number;
  startTime: string;
  endTime: string;
  maxCapacity: number;
};

export function AvailabilityTab() {
  const { can } = usePermissions();
  const canManage = can("manage_calendar");

  const load = useServerFn(fetchAvailabilityAdmin);
  const doSaveRule = useServerFn(saveSlotRule);
  const doDeleteRule = useServerFn(deleteSlotRule);
  const doGenerate = useServerFn(generateSlots);
  const doSaveSlot = useServerFn(saveSlot);
  const doDeleteSlot = useServerFn(deleteSlot);
  const doToggleBlocked = useServerFn(toggleBlockedDate);

  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(() => monthsAhead(3));
  const [data, setData] = useState<AvailabilityAdminSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [formulaFilter, setFormulaFilter] = useState<FormulaType | "all">("all");
  const [blockDate, setBlockDate] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [newRule, setNewRule] = useState<NewRule>({
    formulaType: "zaal_halve_dag",
    weekday: 1,
    startTime: "09:30",
    endTime: "13:30",
    maxCapacity: 1,
  });

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setData(await load({ data: { from, to } }));
    } catch {
      toast.error("Beschikbaarheid kon niet worden geladen.");
    } finally {
      setLoading(false);
    }
  }, [from, to, load]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function run(action: () => Promise<unknown>, message: string) {
    setBusy(true);
    try {
      await action();
      toast.success(message);
      await refresh();
    } catch {
      toast.error("Actie mislukt. Probeer opnieuw.");
    } finally {
      setBusy(false);
    }
  }

  const rules = useMemo(
    () =>
      (data?.rules ?? []).filter(
        (r) => formulaFilter === "all" || r.formulaType === formulaFilter,
      ),
    [data, formulaFilter],
  );
  const slots = useMemo(
    () =>
      (data?.slots ?? []).filter(
        (s) => formulaFilter === "all" || s.formulaType === formulaFilter,
      ),
    [data, formulaFilter],
  );

  const label = (f: string) => FORMULA_LABELS[f as FormulaType] ?? f;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-border/60 bg-card p-4">
        <div className="space-y-1">
          <Label htmlFor="av-from">Van</Label>
          <Input
            id="av-from"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-40"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="av-to">Tot</Label>
          <Input
            id="av-to"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-40"
          />
        </div>
        <div className="space-y-1">
          <Label>Formule</Label>
          <Select
            value={formulaFilter}
            onValueChange={(v) => setFormulaFilter(v as FormulaType | "all")}
          >
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle formules</SelectItem>
              {FORMULA_TYPES.map((f) => (
                <SelectItem key={f} value={f}>
                  {FORMULA_LABELS[f]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={() => void refresh()} disabled={loading || busy}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          Vernieuwen
        </Button>
        {canManage ? (
          <Button
            disabled={busy}
            onClick={() =>
              void run(
                () =>
                  doGenerate({
                    data: {
                      from,
                      to,
                      ...(formulaFilter === "all" ? {} : { formulaType: formulaFilter }),
                    },
                  }),
                "Slots aangemaakt volgens de standaardregels.",
              )
            }
          >
            <Plus className="size-4" /> Slots genereren
          </Button>
        ) : null}
      </div>

      {/* -------------------------------------------------- standaardregels */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-[color:var(--ink-forest)]">
          Standaardregels per weekdag
        </h3>
        <div className="overflow-x-auto rounded-2xl border border-border/60">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Formule</th>
                <th className="px-3 py-2">Dag</th>
                <th className="px-3 py-2">Uren</th>
                <th className="px-3 py-2">Capaciteit</th>
                <th className="px-3 py-2">Actief</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r.id} className="border-t border-border/50">
                  <td className="px-3 py-2">{label(r.formulaType)}</td>
                  <td className="px-3 py-2">{WEEKDAY_LABELS[r.weekday]}</td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {r.startTime} – {r.endTime}
                  </td>
                  <td className="px-3 py-2">{r.maxCapacity}</td>
                  <td className="px-3 py-2">
                    <Switch
                      checked={r.isActive}
                      disabled={!canManage || busy}
                      onCheckedChange={(v) =>
                        void run(
                          () =>
                            doSaveRule({
                              data: {
                                id: r.id,
                                formulaType: r.formulaType as FormulaType,
                                weekday: r.weekday,
                                startTime: r.startTime,
                                endTime: r.endTime,
                                maxCapacity: r.maxCapacity,
                                isActive: v,
                              },
                            }),
                          v ? "Regel geactiveerd." : "Regel gepauzeerd.",
                        )
                      }
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    {canManage ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={busy}
                        onClick={() =>
                          void run(
                            () => doDeleteRule({ data: { id: r.id } }),
                            "Regel verwijderd.",
                          )
                        }
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    ) : null}
                  </td>
                </tr>
              ))}
              {rules.length === 0 && !loading ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                    Nog geen regels voor deze selectie.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {canManage ? (
          <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-dashed border-border/70 p-4">
            <div className="space-y-1">
              <Label>Formule</Label>
              <Select
                value={newRule.formulaType}
                onValueChange={(v) =>
                  setNewRule((s) => ({ ...s, formulaType: v as FormulaType }))
                }
              >
                <SelectTrigger className="w-52">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORMULA_TYPES.map((f) => (
                    <SelectItem key={f} value={f}>
                      {FORMULA_LABELS[f]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Weekdag</Label>
              <Select
                value={String(newRule.weekday)}
                onValueChange={(v) => setNewRule((s) => ({ ...s, weekday: Number(v) }))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WEEKDAY_LABELS.map((d, i) => (
                    <SelectItem key={d} value={String(i)}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="rule-start">Start</Label>
              <Input
                id="rule-start"
                type="time"
                value={newRule.startTime}
                onChange={(e) => setNewRule((s) => ({ ...s, startTime: e.target.value }))}
                className="w-32"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="rule-end">Einde</Label>
              <Input
                id="rule-end"
                type="time"
                value={newRule.endTime}
                onChange={(e) => setNewRule((s) => ({ ...s, endTime: e.target.value }))}
                className="w-32"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="rule-cap">Capaciteit</Label>
              <Input
                id="rule-cap"
                type="number"
                min={1}
                max={500}
                value={newRule.maxCapacity}
                onChange={(e) =>
                  setNewRule((s) => ({ ...s, maxCapacity: Number(e.target.value) || 1 }))
                }
                className="w-28"
              />
            </div>
            <Button
              disabled={busy}
              onClick={() =>
                void run(
                  () => doSaveRule({ data: { ...newRule, isActive: true } }),
                  "Regel opgeslagen.",
                )
              }
            >
              <Plus className="size-4" /> Regel toevoegen
            </Button>
          </div>
        ) : null}
      </section>

      {/* ------------------------------------------------------ sluitingsdagen */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-[color:var(--ink-forest)]">Sluitingsdagen</h3>
        <div className="flex flex-wrap gap-2">
          {(data?.blockedDates ?? []).map((b) => (
            <span
              key={b.id}
              className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm"
            >
              {b.date} · {b.reason}
              {canManage ? (
                <button
                  type="button"
                  aria-label={`Sluitingsdag ${b.date} vrijgeven`}
                  disabled={busy}
                  onClick={() =>
                    void run(
                      () => doToggleBlocked({ data: { date: b.date } }),
                      "Dag vrijgegeven.",
                    )
                  }
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </button>
              ) : null}
            </span>
          ))}
          {(data?.blockedDates ?? []).length === 0 && !loading ? (
            <p className="text-sm text-muted-foreground">Geen sluitingsdagen in deze periode.</p>
          ) : null}
        </div>
        {canManage ? (
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label htmlFor="block-date">Datum</Label>
              <Input
                id="block-date"
                type="date"
                value={blockDate}
                onChange={(e) => setBlockDate(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="block-reason">Reden</Label>
              <Input
                id="block-reason"
                value={blockReason}
                placeholder="Feestdag"
                onChange={(e) => setBlockReason(e.target.value)}
                className="w-52"
              />
            </div>
            <Button
              variant="outline"
              disabled={busy || !blockDate}
              onClick={() =>
                void run(async () => {
                  await doToggleBlocked({
                    data: {
                      date: blockDate,
                      ...(blockReason.trim() ? { reason: blockReason.trim() } : {}),
                    },
                  });
                  setBlockDate("");
                  setBlockReason("");
                }, "Sluitingsdag bijgewerkt.")
              }
            >
              <Ban className="size-4" /> Dag blokkeren
            </Button>
          </div>
        ) : null}
      </section>

      {/* ------------------------------------------------------------- slots */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-[color:var(--ink-forest)]">
          Slots in deze periode
        </h3>
        <div className="overflow-x-auto rounded-2xl border border-border/60">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Datum</th>
                <th className="px-3 py-2">Formule</th>
                <th className="px-3 py-2">Uren</th>
                <th className="px-3 py-2">Bezet</th>
                <th className="px-3 py-2">Capaciteit</th>
                <th className="px-3 py-2">Geblokkeerd</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {slots.map((s) => (
                <tr key={s.id} className="border-t border-border/50">
                  <td className="px-3 py-2 font-mono text-xs">{s.date}</td>
                  <td className="px-3 py-2">{label(s.formulaType)}</td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {s.startTime} – {s.endTime}
                  </td>
                  <td className="px-3 py-2">{s.bookedCount}</td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      min={1}
                      max={500}
                      defaultValue={s.maxCapacity}
                      disabled={!canManage || busy}
                      className="w-20"
                      onBlur={(e) => {
                        const next = Number(e.target.value) || s.maxCapacity;
                        if (next === s.maxCapacity) return;
                        void run(
                          () =>
                            doSaveSlot({
                              data: {
                                id: s.id,
                                formulaType: s.formulaType as FormulaType,
                                date: s.date,
                                startTime: s.startTime,
                                endTime: s.endTime,
                                maxCapacity: next,
                                isBlocked: s.isBlocked,
                                ...(s.note ? { note: s.note } : {}),
                              },
                            }),
                          "Capaciteit bijgewerkt.",
                        );
                      }}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Switch
                      checked={s.isBlocked}
                      disabled={!canManage || busy}
                      onCheckedChange={(v) =>
                        void run(
                          () =>
                            doSaveSlot({
                              data: {
                                id: s.id,
                                formulaType: s.formulaType as FormulaType,
                                date: s.date,
                                startTime: s.startTime,
                                endTime: s.endTime,
                                maxCapacity: s.maxCapacity,
                                isBlocked: v,
                                ...(s.note ? { note: s.note } : {}),
                              },
                            }),
                          v ? "Slot geblokkeerd." : "Slot vrijgegeven.",
                        )
                      }
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    {canManage ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={busy}
                        onClick={() =>
                          void run(
                            () => doDeleteSlot({ data: { id: s.id } }),
                            "Slot verwijderd.",
                          )
                        }
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    ) : null}
                  </td>
                </tr>
              ))}
              {slots.length === 0 && !loading ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                    Nog geen slots. Gebruik “Slots genereren”.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
