import { useState } from "react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Crown, Loader2, Lock, ShieldCheck, UserPlus } from "lucide-react";
import { usePortal } from "@/lib/portal-store";
import { usePermissions } from "@/lib/use-permissions";
import { RightsMatrix } from "@/components/portal/RightsMatrix";
import { PageHeader } from "@/components/portal/portal-ui";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { roleLabel } from "@/lib/role-label";
import {
  addPortalUser,
  fetchPortalUsers,
  setUserActive,
  setUserRoles,
  type PortalUser,
  type RoleInfo,
} from "@/lib/rights.functions";
import {
  listTeamAvatars,
  setTeamAvatar,
  type TeamAvatarMap,
} from "@/lib/team-avatars.functions";
import { TEAM, BOARD } from "@/lib/about-content";
import { UPLOAD_ACCEPT, uploadToStorage } from "@/lib/storage-client";
import { cn } from "@/lib/utils";

export function TeamPage() {
  const { t, lang } = usePortal();
  const { data: rights, can, isLoading: rightsLoading } = usePermissions();
  const queryClient = useQueryClient();
  const loadUsers = useServerFn(fetchPortalUsers);
  const rolesFn = useServerFn(setUserRoles);
  const activeFn = useServerFn(setUserActive);

  const mayManage = can("manage_team");
  const users = useQuery<PortalUser[]>({
    queryKey: ["portal", "team-users"],
    queryFn: () => loadUsers(),
    enabled: !rightsLoading && can("view_team"),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["portal", "team-users"] });

  const saveRoles = useMutation({
    mutationFn: (input: { userId: string; roles: string[] }) => rolesFn({ data: input }),
    onSuccess: () => {
      toast.success(t("team.saved"));
      void refresh();
    },
    onError: (e: Error) => toast.error(e.message || t("common.error")),
  });

  const saveActive = useMutation({
    mutationFn: (input: { userId: string; active: boolean }) => activeFn({ data: input }),
    onSuccess: () => {
      toast.success(t("team.saved"));
      void refresh();
    },
    onError: (e: Error) => toast.error(e.message || t("common.error")),
  });

  if (!rightsLoading && !can("view_team")) {
    return (
      <div className="grid place-items-center rounded-xl border border-dashed border-border p-12 text-center">
        <Lock className="size-8 text-muted-foreground" />
        <p className="mt-3 font-semibold">{t("team.noAccess")}</p>
        <p className="text-sm text-muted-foreground">{t("team.noAccessTeam")}</p>
      </div>
    );
  }

  const roles: RoleInfo[] = rights?.roles ?? [];
  const list = users.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("team.title")}
        subtitle={`${list.filter((u) => u.active).length} ${t("team.activeCount")}`}
        action={mayManage ? <AddPersonDialog roles={roles} /> : null}
      />

      {users.isLoading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> {t("common.loading")}
        </p>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {list.map((u) => {
            const isOwner = u.roles.includes("owner");
            return (
              <li key={u.id} className="rounded-xl border border-border bg-card p-4">
                <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
                    {(u.name || u.email)
                      .split(" ")
                      .slice(0, 2)
                      .map((p) => p[0]?.toUpperCase())
                      .join("")}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{u.name || u.email}</p>
                    <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="hidden text-xs text-muted-foreground sm:inline">
                      {u.active ? t("team.active") : t("team.inactive")}
                    </span>
                    <Switch
                      checked={u.active}
                      aria-label={t("team.active")}
                      disabled={!mayManage || isOwner || saveActive.isPending}
                      onCheckedChange={(v) => saveActive.mutate({ userId: u.id, active: v })}
                    />
                  </div>
                </div>

                {isOwner ? (
                  <p className="mt-3 inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                    <Crown className="size-3.5" /> {t("team.owner")} — {t("team.ownerAll")}
                  </p>
                ) : null}

                <div className="mt-3">
                  <p className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <ShieldCheck className="size-3.5" /> {t("team.roles")}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    {roles.map((role) => {
                      const checked = u.roles.includes(role.role);
                      const lockOwner = role.role === "owner" && !rights?.isOwner;
                      return (
                        <label
                          key={role.role}
                          className={cn(
                            "flex items-center gap-2 text-sm",
                            (!mayManage || lockOwner) && "opacity-60",
                          )}
                        >
                          <Checkbox
                            checked={checked}
                            disabled={!mayManage || lockOwner || saveRoles.isPending}
                            onCheckedChange={(v) =>
                              saveRoles.mutate({
                                userId: u.id,
                                roles:
                                  v === true
                                    ? [...u.roles, role.role]
                                    : u.roles.filter((r) => r !== role.role),
                              })
                            }
                          />
                          {roleLabel(role, lang)}
                        </label>
                      );
                    })}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {mayManage ? <TeamPhotos /> : null}

      <RightsMatrix />
    </div>
  );
}

/** Profielfoto's van de publieke teampagina beheren. */
function TeamPhotos() {
  const { t, lang } = usePortal();
  const queryClient = useQueryClient();
  const loadAvatars = useServerFn(listTeamAvatars);
  const saveAvatar = useServerFn(setTeamAvatar);
  const [busy, setBusy] = useState<string | null>(null);

  const avatars = useQuery<TeamAvatarMap>({
    queryKey: ["portal", "team-avatars"],
    queryFn: () => loadAvatars(),
  });

  const people = [...TEAM, ...BOARD];

  async function apply(personKey: string, imageUrl: string | null) {
    setBusy(personKey);
    try {
      const next = await saveAvatar({ data: { personKey, imageUrl } });
      queryClient.setQueryData(["portal", "team-avatars"], next);
      toast.success(imageUrl ? t("team.photos.saved") : t("team.photos.removed"));
    } catch {
      toast.error(t("team.photos.error"));
    } finally {
      setBusy(null);
    }
  }

  async function onPick(personKey: string, file: File | undefined) {
    if (!file) return;
    setBusy(personKey);
    try {
      // uploadToStorage komt uit de statische import hierboven.
      const { publicUrl } = await uploadToStorage(file, "team");
      await apply(personKey, publicUrl);
    } catch {
      toast.error(t("team.photos.error"));
      setBusy(null);
    }
  }

  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <h2 className="text-base font-semibold">{t("team.photos.title")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("team.photos.help")}</p>

      <ul className="mt-4 grid gap-3 lg:grid-cols-2">
        {people.map((person) => {
          const url = avatars.data?.[person.id];
          const pending = busy === person.id;
          return (
            <li
              key={person.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3"
            >
              {url ? (
                <img
                  src={url}
                  alt={person.name}
                  className="size-14 shrink-0 rounded-full object-cover"
                  loading="lazy"
                />
              ) : (
                <span className="grid size-14 shrink-0 place-items-center rounded-full bg-primary text-base font-bold text-primary-foreground">
                  {person.name.charAt(0).toUpperCase()}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{person.name}</p>
                <p className="truncate text-xs text-muted-foreground">{person.subject}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm" disabled={pending}>
                  <label className="cursor-pointer">
                    {pending
                      ? t("team.photos.uploading")
                      : url
                        ? t("team.photos.replace")
                        : t("team.photos.upload")}
                    <input
                      type="file"
                      accept={UPLOAD_ACCEPT}
                      className="sr-only"
                      disabled={pending}
                      onChange={(e) => {
                        void onPick(person.id, e.target.files?.[0]);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </Button>
                {url ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    onClick={() => void apply(person.id, null)}
                  >
                    {t("team.photos.remove")}
                  </Button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
      {avatars.isLoading ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> {t("common.loading")}
        </p>
      ) : null}
      <span className="sr-only">{lang}</span>
    </section>
  );
}

/** Persoon toevoegen: naam, e-mail, rollen aanvinken en taal van de uitnodiging. */
function AddPersonDialog({ roles }: { roles: RoleInfo[] }) {
  const { t, lang } = usePortal();
  const { data: rights } = usePermissions();
  const queryClient = useQueryClient();
  const add = useServerFn(addPortalUser);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [selected, setSelected] = useState<string[]>(["team"]);
  const [mailLang, setMailLang] = useState<"nl" | "fr" | "en">(lang);

  const mutation = useMutation({
    mutationFn: () =>
      add({
        data: {
          name: name.trim(),
          email: email.trim(),
          roles: selected,
          lang: mailLang,
          redirectTo: `${window.location.origin}/wachtwoord-herstellen`,
        },
      }),
    onSuccess: () => {
      toast.success(t("team.invited"));
      void queryClient.invalidateQueries({ queryKey: ["portal", "team-users"] });
      setOpen(false);
      setName("");
      setEmail("");
      setSelected(["team"]);
    },
    onError: (e: Error) => toast.error(e.message || t("common.error")),
  });

  const toggle = (role: string) =>
    setSelected((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus className="size-4" />
          <span className="hidden sm:inline">{t("team.addPerson")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("team.addPerson")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{t("team.addPersonHint")}</p>
          <div>
            <Label htmlFor="add-name">{t("team.fullName")}</Label>
            <Input
              id="add-name"
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="add-mail">{t("team.workEmail")}</Label>
            <Input
              id="add-mail"
              type="email"
              maxLength={255}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <Label>{t("team.roles")}</Label>
            <div className="mt-1 grid gap-2 sm:grid-cols-2">
              {roles.map((role) => {
                const lockOwner = role.role === "owner" && !rights?.isOwner;
                return (
                  <label
                    key={role.role}
                    className={cn("flex items-center gap-2 text-sm", lockOwner && "opacity-60")}
                  >
                    <Checkbox
                      checked={selected.includes(role.role)}
                      disabled={lockOwner}
                      onCheckedChange={() => toggle(role.role)}
                    />
                    {roleLabel(role, lang)}
                  </label>
                );
              })}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">{t("team.rolesHint")}</p>
          </div>
          <div>
            <Label>{t("team.inviteLang")}</Label>
            <Select value={mailLang} onValueChange={(v) => setMailLang(v as "nl" | "fr" | "en")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nl">Nederlands</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            disabled={
              mutation.isPending ||
              name.trim().length < 2 ||
              !email.includes("@") ||
              selected.length === 0
            }
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            {t("team.addPerson")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
