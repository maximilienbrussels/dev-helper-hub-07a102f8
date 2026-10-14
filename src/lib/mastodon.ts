/**
 * Publieke Mastodon-integratie — geen API-key, geen externe widget.
 * Data komt rechtstreeks van de openbare REST-API van de instance.
 */
import { queryOptions, useQuery } from "@tanstack/react-query";
import { useHiddenSocialIds } from "@/lib/social-hidden";

export const MASTODON_INSTANCE = "https://mastodon.social";
export const MASTODON_HANDLE = "maximilien.brussels";
export const MASTODON_ACCT = `@${MASTODON_HANDLE}@${MASTODON_INSTANCE.replace("https://", "")}`;
export const MASTODON_PROFILE_URL = `${MASTODON_INSTANCE}/@${MASTODON_HANDLE}`;

export type MastodonMedia = { id: string; url: string; preview: string; alt: string; type: string };

export type MastodonPost = {
  id: string;
  url: string;
  createdAt: string;
  text: string;
  media: MastodonMedia[];
};

export type MastodonAccount = {
  id: string;
  displayName: string;
  acct: string;
  avatar?: string;
  url: string;
  followersCount?: number;
};

type RawAccount = {
  id?: string;
  display_name?: string;
  acct?: string;
  avatar?: string;
  url?: string;
  followers_count?: number;
};

type RawStatus = {
  id?: string;
  url?: string | null;
  uri?: string;
  created_at?: string;
  content?: string;
  reblog?: unknown;
  media_attachments?: Array<{
    id?: string;
    url?: string;
    preview_url?: string;
    description?: string | null;
    type?: string;
  }>;
};

/** HTML van een toot omzetten naar leesbare platte tekst (veilig, geen innerHTML). */
export function tootToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function fetchMastodonAccount(): Promise<MastodonAccount> {
  const res = await fetch(
    `${MASTODON_INSTANCE}/api/v1/accounts/lookup?acct=${encodeURIComponent(MASTODON_HANDLE)}`,
    { headers: { accept: "application/json" } },
  );
  if (!res.ok) throw new Error(`Mastodon API ${res.status}`);
  const json = (await res.json()) as RawAccount;
  return {
    id: json.id ?? "",
    displayName: json.display_name || "Maximilien Brussels",
    acct: json.acct ?? MASTODON_HANDLE,
    avatar: json.avatar,
    url: json.url ?? MASTODON_PROFILE_URL,
    followersCount: json.followers_count,
  };
}

export async function fetchMastodonFeed(limit = 6): Promise<MastodonPost[]> {
  const account = await fetchMastodonAccount();
  if (!account.id) return [];
  const res = await fetch(
    `${MASTODON_INSTANCE}/api/v1/accounts/${account.id}/statuses?limit=${limit}&exclude_replies=true&exclude_reblogs=true`,
    { headers: { accept: "application/json" } },
  );
  if (!res.ok) throw new Error(`Mastodon API ${res.status}`);
  const json = (await res.json()) as RawStatus[];
  return (Array.isArray(json) ? json : [])
    .filter((s) => !s.reblog && s.id)
    .map((s) => ({
      id: s.id!,
      url: s.url ?? s.uri ?? MASTODON_PROFILE_URL,
      createdAt: s.created_at ?? new Date().toISOString(),
      text: tootToText(s.content ?? ""),
      media: (s.media_attachments ?? [])
        .filter((m) => Boolean(m.preview_url || m.url))
        .map((m) => ({
          id: m.id ?? "",
          url: m.url ?? m.preview_url ?? "",
          preview: m.preview_url ?? m.url ?? "",
          alt: m.description ?? "",
          type: m.type ?? "image",
        })),
    }));
}

export const mastodonFeedQO = (limit = 6) =>
  queryOptions({
    queryKey: ["mastodon", "feed", limit],
    queryFn: () => fetchMastodonFeed(limit),
    staleTime: 5 * 60_000,
    refetchInterval: 10 * 60_000,
    retry: 1,
  });

export const mastodonAccountQO = queryOptions({
  queryKey: ["mastodon", "account"],
  queryFn: () => fetchMastodonAccount(),
  staleTime: 30 * 60_000,
  retry: 1,
});

export function useMastodonFeed(limit = 6) {
  const feed = useQuery(mastodonFeedQO(limit));
  const account = useQuery(mastodonAccountQO);
  const hidden = useHiddenSocialIds("mastodon");
  return {
    posts: hidden.filter(feed.data ?? [], (p) => p.id),
    account: account.data,
    isLoading: feed.isLoading,
    isError: feed.isError,
  };
}

const INSTANCE_KEY = "mastodon:instance";

export function getSavedInstance(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(INSTANCE_KEY) ?? "";
}

export function saveInstance(domain: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(INSTANCE_KEY, normaliseInstance(domain));
}

/** "https://mastodon.social/" → "mastodon.social" */
export function normaliseInstance(input: string): string {
  return input
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "")
    .toLowerCase();
}

/** Share-intent URL van een Mastodon-instance. */
export function mastodonShareUrl(domain: string, text: string, url: string): string {
  const host = normaliseInstance(domain) || "mastodon.social";
  return `https://${host}/share?text=${encodeURIComponent(`${text}\n\n${url}`)}`;
}
