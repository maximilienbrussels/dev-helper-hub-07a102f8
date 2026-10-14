import { useEffect, useState } from "react";
import { toast } from "sonner";
import { KeyRound, Copy, ShieldAlert } from "lucide-react";
import { usePortal } from "@/lib/portal-store";
import { PageHeader } from "@/components/portal/portal-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  fetchApiKeys,
  createApiKeyFn,
  setApiKeyActiveFn,
  SCOPE_GROUPS,
} from "@/lib/api-keys.functions";
import type { ApiKeyPublic } from "@/lib/api-keys.server";
import { SyncSettings } from "@/components/admin/SyncSettings";

const GROUP_LABEL_KEY: Record<(typeof SCOPE_GROUPS)[number]["key"], string> = {
  shop: "api.group.shop",
  bookings: "api.group.bookings",
  maxim: "api.group.maxim",
};

export function ApiKeysPage() {
  const { t, lang } = usePortal();
  const [keys, setKeys] = useState<ApiKeyPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<string[]>([]);
  const [rawKey, setRawKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setKeys(await fetchApiKeys());
    } catch {
      toast.error(t("common.error") || "Er ging iets mis.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const toggleScope = (scope: string, checked: boolean) => {
    setScopes((prev) => (checked ? [...new Set([...prev, scope])] : prev.filter((s) => s !== scope)));
  };

  const resetDialog = () => {
    setName("");
    setScopes([]);
    setRawKey(null);
  };

  const handleCreate = async () => {
    if (!name.trim() || scopes.length === 0) return;
    setSaving(true);
    try {
      const res = await createApiKeyFn({ data: { name: name.trim(), scopes: scopes as never } });
      setRawKey(res.rawKey);
      toast.success(t("api.created"));
      await load();
    } catch {
      toast.error(t("common.error") || "Er ging iets mis.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: string, active: boolean) => {
    setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, is_active: active } : k)));
    try {
      await setApiKeyActiveFn({ data: { id, active } });
    } catch {
      toast.error(t("common.error") || "Er ging iets mis.");
      await load();
    }
  };

  const copyRawKey = async () => {
    if (!rawKey) return;
    await navigator.clipboard.writeText(rawKey);
    toast.success(t("api.copied"));
  };

  const dateFmt = (value: string | null) =>
    value ? new Date(value).toLocaleString(lang === "nl" ? "nl-BE" : lang === "fr" ? "fr-BE" : "en-GB") : t("api.never");

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("api.title")}
        subtitle={t("api.subtitle")}
        action={
          <Dialog
            open={open}
            onOpenChange={(v) => {
              setOpen(v);
              if (!v) resetDialog();
            }}
          >
            <Button onClick={() => setOpen(true)}>
              <KeyRound className="mr-2 size-4" />
              {t("api.new")}
            </Button>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{t("api.newTitle")}</DialogTitle>
              </DialogHeader>

              {!rawKey ? (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>{t("api.name")}</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t("api.namePlaceholder")}
                    />
                  </div>
                  <div className="space-y-3">
                    <Label>{t("api.scopes")}</Label>
                    {SCOPE_GROUPS.map((group) => (
                      <div key={group.key} className="rounded-lg border border-border/70 p-3">
                        <p className="mb-2 text-sm font-semibold">{t(GROUP_LABEL_KEY[group.key])}</p>
                        <div className="space-y-2">
                          {group.scopes.map((scope) => (
                            <label key={scope} className="flex items-center gap-2 text-sm">
                              <Checkbox
                                checked={scopes.includes(scope)}
                                onCheckedChange={(c) => toggleScope(scope, Boolean(c))}
                              />
                              {t(`api.scope.${scope}`)}
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-warning-foreground">
                    <ShieldAlert className="mt-0.5 size-4 shrink-0" />
                    <p>{t("api.rawKeyWarning")}</p>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-muted p-2 font-mono text-xs break-all">
                    {rawKey}
                  </div>
                  <Button variant="outline" onClick={copyRawKey}>
                    <Copy className="mr-2 size-4" />
                    {t("api.copy")}
                  </Button>
                </div>
              )}

              <DialogFooter>
                {!rawKey ? (
                  <>
                    <Button variant="ghost" onClick={() => setOpen(false)}>
                      {t("api.cancel")}
                    </Button>
                    <Button disabled={!name.trim() || scopes.length === 0 || saving} onClick={handleCreate}>
                      {t("api.create")}
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => {
                      setOpen(false);
                      resetDialog();
                    }}
                  >
                    {t("api.close")}
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("api.col.name")}</TableHead>
              <TableHead>{t("api.col.prefix")}</TableHead>
              <TableHead>{t("api.col.scopes")}</TableHead>
              <TableHead>{t("api.col.lastUsed")}</TableHead>
              <TableHead>{t("api.col.status")}</TableHead>
              <TableHead className="text-right">{t("api.col.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!loading && keys.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  {t("api.empty")}
                </TableCell>
              </TableRow>
            )}
            {keys.map((k) => (
              <TableRow key={k.id}>
                <TableCell className="font-medium">{k.name}</TableCell>
                <TableCell className="font-mono text-xs">{k.prefix}…</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {k.scopes.map((s) => (
                      <Badge key={s} variant="secondary" className="text-[10px]">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{dateFmt(k.last_used_at)}</TableCell>
                <TableCell>
                  <Badge variant={k.is_active ? "default" : "outline"}>
                    {k.is_active ? t("api.active") : t("api.inactive")}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-xs text-muted-foreground">
                      {k.is_active ? t("api.deactivate") : t("api.reactivate")}
                    </span>
                    <Switch checked={k.is_active} onCheckedChange={(v) => handleToggle(k.id, v)} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Koppelingen</h2>
        <SyncSettings />
      </section>
    </div>
  );
}
