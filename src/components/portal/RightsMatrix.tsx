import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Lock, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { usePermissions } from "@/lib/use-permissions";
import { usePortal } from "@/lib/portal-store";
import { roleLabel } from "@/lib/role-label";
import {
  PERMISSIONS,
  FULL_ACCESS_ROLES,
  createRole,
  deleteRole,
  setRolePermission,
  type Permission,
  type RoleInfo,
} from "@/lib/rights.functions";

/** Rollen & rechten: per rol aanvinken wat toegestaan is + eigen rollen maken. */
export function RightsMatrix() {
  const { t, lang } = usePortal();
  const { data, isLoading, can } = usePermissions();
  const queryClient = useQueryClient();
  const saveFn = useServerFn(setRolePermission);
  const removeFn = useServerFn(deleteRole);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["portal", "rights"] });

  const save = useMutation({
    mutationFn: (input: { role: string; permission: Permission; allowed: boolean }) =>
      saveFn({ data: input }),
    onSuccess: () => {
      toast.success(t("team.saved"));
      void refresh();
    },
    onError: (e: Error) => toast.error(e.message || t("common.error")),
  });

  const remove = useMutation({
    mutationFn: (role: string) => removeFn({ data: { role } }),
    onSuccess: () => {
      toast.success(t("roles.deleted"));
      void refresh();
    },
    onError: (e: Error) => toast.error(e.message || t("common.error")),
  });

  const [expanded, setExpanded] = useState(false);

  const allowed = (role: string, permission: Permission) =>
    Boolean(data?.matrix.find((m) => m.role === role && m.permission === permission)?.allowed);

  if (!isLoading && !can("manage_rights")) {
    return (
      <section className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        <Lock className="mx-auto size-6" />
        <p className="mt-2">{t("roles.onlyManagers")}</p>
      </section>
    );
  }

  const roles: RoleInfo[] = data?.roles ?? [];

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-bold">
            <ShieldCheck className="size-4 text-muted-foreground" /> {t("roles.title")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("roles.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            aria-expanded={expanded}
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            {t("roles.title")}
          </Button>
          <NewRoleDialog />
        </div>
      </div>

      {!expanded ? null : isLoading ? (
        <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {roles.map((role) => {
            const full = (FULL_ACCESS_ROLES as readonly string[]).includes(role.role);
            return (
              <article key={role.role} className="rounded-xl border border-border bg-card p-4">
                <header className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{roleLabel(role, lang)}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {role.builtin ? t("roles.builtin") : role.role}
                    </p>
                  </div>
                  {full ? (
                    <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                      {t("roles.alwaysAll")}
                    </span>
                  ) : role.builtin ? null : (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t("roles.delete")}
                      onClick={() => remove.mutate(role.role)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </header>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {PERMISSIONS.map((p) => (
                    <label
                      key={p}
                      className="flex items-start gap-2 rounded-md px-1 py-1 text-sm hover:bg-muted/50"
                    >
                      <Checkbox
                        className="mt-0.5"
                        checked={full || allowed(role.role, p)}
                        disabled={full || save.isPending}
                        onCheckedChange={(v) =>
                          save.mutate({ role: role.role, permission: p, allowed: v === true })
                        }
                      />
                      <span className="leading-snug">{t(`right.${p}`)}</span>
                    </label>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

/** Eigen rol aanmaken met meertalige naam en aangevinkte rechten. */
function NewRoleDialog() {
  const { t } = usePortal();
  const queryClient = useQueryClient();
  const create = useServerFn(createRole);
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState("");
  const [nl, setNl] = useState("");
  const [fr, setFr] = useState("");
  const [en, setEn] = useState("");
  const [perms, setPerms] = useState<Permission[]>([]);

  const mutation = useMutation({
    mutationFn: () =>
      create({
        data: {
          role: key.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_"),
          labelNl: nl.trim(),
          labelFr: (fr || nl).trim(),
          labelEn: (en || nl).trim(),
          permissions: perms,
        },
      }),
    onSuccess: () => {
      toast.success(t("roles.created"));
      void queryClient.invalidateQueries({ queryKey: ["portal", "rights"] });
      setOpen(false);
      setKey("");
      setNl("");
      setFr("");
      setEn("");
      setPerms([]);
    },
    onError: (e: Error) => toast.error(e.message || t("common.error")),
  });

  const toggle = (p: Permission) =>
    setPerms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="size-4" /> {t("roles.newRole")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("roles.newRole")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="role-key">{t("roles.key")}</Label>
            <Input
              id="role-key"
              value={key}
              maxLength={31}
              placeholder="gids_weekend"
              onChange={(e) => setKey(e.target.value)}
            />
            <p className="mt-1 text-[11px] text-muted-foreground">{t("roles.keyHint")}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label htmlFor="role-nl">{t("roles.labelNl")}</Label>
              <Input id="role-nl" value={nl} maxLength={60} onChange={(e) => setNl(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="role-fr">{t("roles.labelFr")}</Label>
              <Input id="role-fr" value={fr} maxLength={60} onChange={(e) => setFr(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="role-en">{t("roles.labelEn")}</Label>
              <Input id="role-en" value={en} maxLength={60} onChange={(e) => setEn(e.target.value)} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label>{t("roles.title")}</Label>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="ghost" onClick={() => setPerms([...PERMISSIONS])}>
                  {t("roles.selectAll")}
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setPerms([])}>
                  {t("roles.clearAll")}
                </Button>
              </div>
            </div>
            <div className="mt-1 grid gap-2 sm:grid-cols-2">
              {PERMISSIONS.map((p) => (
                <label key={p} className="flex items-start gap-2 text-sm">
                  <Checkbox
                    className="mt-0.5"
                    checked={perms.includes(p)}
                    onCheckedChange={() => toggle(p)}
                  />
                  <span className="leading-snug">{t(`right.${p}`)}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            disabled={mutation.isPending || key.trim().length < 3 || nl.trim().length < 2}
            onClick={() => mutation.mutate()}
          >
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
