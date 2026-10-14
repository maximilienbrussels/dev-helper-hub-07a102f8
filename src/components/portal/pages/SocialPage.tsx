import { useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, ExternalLink, ImageIcon, Pencil, Plus, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { usePortal } from "@/lib/portal-store";
import { usePermissions } from "@/lib/use-permissions";
import { PageHeader } from "@/components/portal/portal-ui";
import { MediaPage } from "@/components/portal/pages/MediaPage";
import { ImagePickerModal } from "@/components/portal/media/ImagePickerModal";
import { useHiddenPosts, useSocialPosts } from "@/components/portal/social/useSocialAdmin";
import type { SocialPost } from "@/lib/social-admin.functions";
import { useBlueskyFeed, relativeTime } from "@/lib/bluesky";
import { useMastodonFeed } from "@/lib/mastodon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { handleImageError } from "@/lib/image-fallback";

type IncomingItem = {
  platform: "bluesky" | "mastodon";
  postId: string;
  text: string;
  createdAt: string;
  url: string;
  image?: string;
};

export function SocialPage() {
  const { t, lang } = usePortal();
  const { can } = usePermissions();
  const canManage = can("manage_media");

  return (
    <div className="space-y-4">
      <PageHeader title={t("social.title")} subtitle={t("social.subtitle")} />

      <Tabs defaultValue="incoming">
        <TabsList>
          <TabsTrigger value="incoming">{t("social.tab.incoming")}</TabsTrigger>
          <TabsTrigger value="own">{t("social.tab.own")}</TabsTrigger>
          <TabsTrigger value="library">{t("social.tab.library")}</TabsTrigger>
        </TabsList>

        <TabsContent value="incoming">
          <IncomingTab canManage={canManage} />
        </TabsContent>

        <TabsContent value="own">
          <OwnPostsTab canManage={canManage} lang={lang} />
        </TabsContent>

        <TabsContent value="library">
          <MediaPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function IncomingTab({ canManage }: { canManage: boolean }) {
  const { t, lang } = usePortal();
  const { posts: bskyPosts, isLoading: bskyLoading } = useBlueskyFeed(24);
  const { posts: mastoPosts } = useMastodonFeed(12);
  const { isHidden, hideMutation, unhideMutation, hardDeleteMutation, isLoading } =
    useHiddenPosts();
  const [confirmDelete, setConfirmDelete] = useState<IncomingItem | null>(null);

  const items: IncomingItem[] = [
    ...bskyPosts.map((p) => ({
      platform: "bluesky" as const,
      postId: p.uri,
      text: p.text,
      createdAt: p.createdAt,
      url: p.url,
      image: p.images[0]?.url,
    })),
    ...mastoPosts.map((p) => ({
      platform: "mastodon" as const,
      postId: p.id,
      text: p.text,
      createdAt: p.createdAt,
      url: p.url,
      image: p.media[0]?.preview,
    })),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  if (bskyLoading || isLoading)
    return <p className="p-6 text-sm text-muted-foreground">{t("common.loading")}</p>;

  if (items.length === 0)
    return (
      <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        {t("social.noIncoming")}
      </p>
    );

  return (
    <>
      <ul className="space-y-2">
        {items.map((item) => {
          const hidden = isHidden(item.platform, item.postId);
          return (
            <li
              key={`${item.platform}-${item.postId}`}
              className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 sm:flex-row sm:items-start"
            >
              {item.image ? (
                <img
                  src={item.image}
                  alt=""
                  loading="lazy"
                  className="h-20 w-20 shrink-0 rounded-md object-cover"
                  onError={handleImageError}
                />
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
                  {item.platform}
                  <span>·</span>
                  {relativeTime(item.createdAt, lang)}
                  <span
                    className={
                      hidden
                        ? "rounded-full bg-muted px-2 py-0.5 text-[10px] normal-case"
                        : "rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary normal-case"
                    }
                  >
                    {hidden ? t("social.hidden") : t("social.visible")}
                  </span>
                </p>
                <p className="mt-1 text-sm whitespace-pre-line">{item.text}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button asChild variant="ghost" size="sm">
                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="size-4" /> {t("social.openOriginal")}
                    </a>
                  </Button>
                  {canManage ? (
                    hidden ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          unhideMutation.mutate(
                            { platform: item.platform, postId: item.postId },
                            { onSuccess: () => toast.success(t("social.shownToast")) },
                          );
                        }}
                      >
                        <Eye className="size-4" /> {t("social.show")}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          hideMutation.mutate(
                            { platform: item.platform, postId: item.postId },
                            { onSuccess: () => toast.success(t("social.hiddenToast")) },
                          );
                        }}
                      >
                        <EyeOff className="size-4" /> {t("social.hide")}
                      </Button>
                    )
                  ) : null}
                  {canManage && item.platform === "bluesky" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setConfirmDelete(item)}
                    >
                      <Trash2 className="size-4" /> {t("social.hardDelete")}
                    </Button>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <AlertDialog open={confirmDelete != null} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("social.hardDeleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("social.hardDeleteBody")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!confirmDelete) return;
                hardDeleteMutation.mutate(confirmDelete.postId, {
                  onSuccess: () => toast.success(t("social.hardDeleted")),
                });
                setConfirmDelete(null);
              }}
            >
              {t("social.hardDelete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function OwnPostsTab({ canManage, lang }: { canManage: boolean; lang: "nl" | "fr" | "en" }) {
  const { t } = usePortal();
  const { posts, isLoading, createMutation, updateMutation, deleteMutation } = useSocialPosts();
  const [editing, setEditing] = useState<SocialPost | null>(null);
  const [creating, setCreating] = useState(false);

  const textFor = (p: SocialPost) =>
    lang === "nl" ? p.tekstNl : lang === "en" ? p.tekstEn || p.tekstNl : p.tekstFr || p.tekstNl;

  return (
    <div className="space-y-3">
      {canManage ? (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="size-4" /> {t("social.newPost")}
          </Button>
        </div>
      ) : null}

      {isLoading ? (
        <p className="p-6 text-sm text-muted-foreground">{t("common.loading")}</p>
      ) : posts.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {t("social.noPosts")}
        </p>
      ) : (
        <ul className="space-y-2">
          {posts.map((p) => (
            <li
              key={p.id}
              className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 sm:flex-row sm:items-start"
            >
              {p.mediaUrl ? (
                <img
                  src={p.mediaUrl}
                  alt=""
                  loading="lazy"
                  className="h-20 w-20 shrink-0 rounded-md object-cover"
                  onError={handleImageError}
                />
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
                  {p.gepubliceerdOp.slice(0, 10)} ·{" "}
                  {p.actief ? t("social.visible") : t("social.hidden")}
                </p>
                <p className="mt-1 text-sm whitespace-pre-line">{textFor(p)}</p>
                {p.link ? (
                  <a
                    href={p.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="size-3" /> {p.link}
                  </a>
                ) : null}
              </div>
              {canManage ? (
                <div className="flex shrink-0 gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditing(p)}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (!window.confirm(t("social.deleteConfirm"))) return;
                      deleteMutation.mutate(p.id, {
                        onSuccess: () => toast.success(t("social.deleted")),
                      });
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {creating ? (
        <PostDialog
          open
          onOpenChange={(o) => !o && setCreating(false)}
          lang={lang}
          onSave={(values) => {
            createMutation.mutate(values, {
              onSuccess: () => {
                toast.success(t("social.saved"));
                setCreating(false);
              },
            });
          }}
        />
      ) : null}

      {editing ? (
        <PostDialog
          open
          post={editing}
          lang={lang}
          onOpenChange={(o) => !o && setEditing(null)}
          onSave={(values) => {
            updateMutation.mutate(
              { id: editing.id, ...values },
              {
                onSuccess: () => {
                  toast.success(t("social.saved"));
                  setEditing(null);
                },
              },
            );
          }}
        />
      ) : null}
    </div>
  );
}

type PostValues = {
  tekstNl: string;
  tekstFr: string;
  tekstEn: string;
  mediaUrl: string | null;
  mediaId: string | null;
  link: string;
  gepubliceerdOp: string;
  actief: boolean;
};

function PostDialog({
  open,
  onOpenChange,
  onSave,
  post,
  lang,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (values: PostValues) => void;
  post?: SocialPost;
  lang: "nl" | "fr" | "en";
}) {
  const { t } = usePortal();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [form, setForm] = useState<PostValues>({
    tekstNl: post?.tekstNl ?? "",
    tekstFr: post?.tekstFr ?? "",
    tekstEn: post?.tekstEn ?? "",
    mediaUrl: post?.mediaUrl ?? null,
    mediaId: post?.mediaId ?? null,
    link: post?.link ?? "",
    gepubliceerdOp: (post?.gepubliceerdOp ?? new Date().toISOString()).slice(0, 10),
    actief: post?.actief ?? true,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{post ? t("social.editPost") : t("social.newPost")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label htmlFor="sp-nl">{t("social.textNl")}</Label>
            <Textarea
              id="sp-nl"
              rows={3}
              maxLength={1000}
              value={form.tekstNl}
              onChange={(e) => setForm({ ...form, tekstNl: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="sp-fr">{t("social.textFr")}</Label>
            <Textarea
              id="sp-fr"
              rows={3}
              maxLength={1000}
              value={form.tekstFr}
              onChange={(e) => setForm({ ...form, tekstFr: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="sp-en">{t("social.textEn")}</Label>
            <Textarea
              id="sp-en"
              rows={3}
              maxLength={1000}
              value={form.tekstEn}
              onChange={(e) => setForm({ ...form, tekstEn: e.target.value })}
            />
          </div>

          <div>
            <Label>{t("social.image")}</Label>
            <div className="mt-1 flex items-center gap-3">
              {form.mediaUrl ? (
                <img loading="lazy"
                  src={form.mediaUrl}
                  alt=""
                  className="h-16 w-16 rounded-md border border-border object-cover"
                  onError={handleImageError}
                />
              ) : (
                <span className="grid h-16 w-16 place-items-center rounded-md border border-dashed border-border">
                  <ImageIcon className="size-5 text-muted-foreground" />
                </span>
              )}
              <Button type="button" variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
                {t("social.chooseImage")}
              </Button>
              {form.mediaUrl ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setForm({ ...form, mediaUrl: null, mediaId: null })}
                >
                  {t("social.removeImage")}
                </Button>
              ) : null}
            </div>
          </div>

          <div>
            <Label htmlFor="sp-link">{t("social.link")}</Label>
            <Input
              id="sp-link"
              maxLength={400}
              value={form.link}
              onChange={(e) => setForm({ ...form, link: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="sp-date">{t("social.publishedOn")}</Label>
              <Input
                id="sp-date"
                type="date"
                value={form.gepubliceerdOp}
                onChange={(e) => setForm({ ...form, gepubliceerdOp: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2 sm:pt-6">
              <Switch
                id="sp-actief"
                checked={form.actief}
                onCheckedChange={(v) => setForm({ ...form, actief: v })}
              />
              <Label htmlFor="sp-actief">{t("social.active")}</Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={() => {
              if (!form.tekstNl.trim()) {
                toast.error(t("social.textRequired"));
                return;
              }
              onSave({
                ...form,
                tekstNl: form.tekstNl.trim(),
                tekstFr: form.tekstFr.trim(),
                tekstEn: form.tekstEn.trim(),
                link: form.link.trim(),
                gepubliceerdOp: new Date(`${form.gepubliceerdOp}T12:00:00Z`).toISOString(),
              });
            }}
          >
            {t("common.save")}
          </Button>
        </DialogFooter>

        <ImagePickerModal
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          lang={lang}
          uploadCategory="general"
          selectedId={form.mediaId}
          onSelect={(asset) => setForm((f) => ({ ...f, mediaUrl: asset.url, mediaId: asset.id }))}
        />
      </DialogContent>
    </Dialog>
  );
}
