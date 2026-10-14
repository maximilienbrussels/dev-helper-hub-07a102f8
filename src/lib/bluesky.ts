/**
 * Publieke Bluesky (AT Protocol) feed — geen externe widgets, geen API-key.
 * Data komt rechtstreeks van de officiële publieke endpoint.
 */
import { infiniteQueryOptions, queryOptions, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import type { Lang } from "@/lib/i18n";
import { useHiddenSocialIds } from "@/lib/social-hidden";

export const BSKY_HANDLE = "maximilien.brussels";
export const BSKY_DID = "did:plc:kuakjs2akq25rsneaaer334e";
export const BSKY_PROFILE_URL = `https://bsky.app/profile/${BSKY_HANDLE}`;

const API = "https://public.api.bsky.app/xrpc";
/** Publieke PDS-endpoint, enkel voor auth + schrijfacties (permanent verwijderen). */
const PDS_API = "https://bsky.social/xrpc";

export type BskyImage = { url: string; alt: string; aspectRatio?: { width: number; height: number } };

export type BskyVideo = { playlist: string; thumbnail?: string; alt?: string };

export type BskyFacetLink = { start: number; end: number; kind: "link" | "tag" | "mention"; value: string };

export type BskyCounts = { likes: number; reposts: number; replies: number };

export type BskyPost = {
  uri: string;
  url: string;
  text: string;
  createdAt: string;
  facets: BskyFacetLink[];
  images: BskyImage[];
  video: BskyVideo | null;
  counts: BskyCounts;
  author: { displayName: string; handle: string; avatar?: string };
};

/* ---------------- ruwe API-vormen (minimaal getypeerd) ---------------- */

type RawFacet = {
  index?: { byteStart?: number; byteEnd?: number };
  features?: Array<{ $type?: string; uri?: string; tag?: string; did?: string }>;
};

type RawEmbed = {
  $type?: string;
  images?: Array<{ fullsize?: string; thumb?: string; alt?: string; aspectRatio?: { width: number; height: number } }>;
  playlist?: string;
  thumbnail?: string;
  alt?: string;
  media?: RawEmbed;
};

type RawPost = {
  uri?: string;
  indexedAt?: string;
  likeCount?: number;
  repostCount?: number;
  quoteCount?: number;
  replyCount?: number;
  author?: { did?: string; handle?: string; displayName?: string; avatar?: string };
  record?: { text?: string; createdAt?: string; facets?: RawFacet[] };
  embed?: RawEmbed;
};

export type BskyProfile = {
  displayName: string;
  handle: string;
  avatar?: string;
  description?: string;
  followersCount?: number;
  postsCount?: number;
};

/* ---------------- helpers ---------------- */

/** Byte-offsets van facets omzetten naar tekst-indexen (UTF-8 → UTF-16). */
function byteToCharIndex(text: string): (byteIndex: number) => number {
  const encoder = new TextEncoder();
  const map = new Map<number, number>();
  let bytes = 0;
  for (let i = 0; i < text.length; ) {
    map.set(bytes, i);
    const cp = text.codePointAt(i)!;
    const chunk = String.fromCodePoint(cp);
    bytes += encoder.encode(chunk).length;
    i += chunk.length;
  }
  map.set(bytes, text.length);
  return (byteIndex) => map.get(byteIndex) ?? text.length;
}

function cleanFacets(text: string, raw: RawFacet[] | undefined): BskyFacetLink[] {
  if (!raw?.length) return [];
  const toChar = byteToCharIndex(text);
  const out: BskyFacetLink[] = [];
  for (const f of raw) {
    const feature = f.features?.[0];
    const start = toChar(f.index?.byteStart ?? 0);
    const end = toChar(f.index?.byteEnd ?? 0);
    if (end <= start) continue;
    if (feature?.uri) out.push({ start, end, kind: "link", value: feature.uri });
    else if (feature?.tag)
      out.push({ start, end, kind: "tag", value: `https://bsky.app/hashtag/${encodeURIComponent(feature.tag)}` });
    else if (feature?.did)
      out.push({ start, end, kind: "mention", value: `https://bsky.app/profile/${feature.did}` });
  }
  return out.sort((a, b) => a.start - b.start);
}

function cleanEmbed(embed: RawEmbed | undefined): { images: BskyImage[]; video: BskyVideo | null } {
  const media = embed?.$type?.includes("recordWithMedia") ? embed?.media : embed;
  const images: BskyImage[] = (media?.images ?? [])
    .map((img) => ({
      url: img.fullsize ?? img.thumb ?? "",
      alt: img.alt ?? "",
      aspectRatio: img.aspectRatio,
    }))
    .filter((i) => Boolean(i.url));
  const video = media?.playlist
    ? { playlist: media.playlist, thumbnail: media.thumbnail, alt: media.alt }
    : null;
  return { images, video };
}

/** rkey uit een at:// URI halen voor de publieke permalink. */
function postUrl(uri: string, handle: string) {
  const rkey = uri.split("/").pop() ?? "";
  return `https://bsky.app/profile/${handle}/post/${rkey}`;
}

/** rkey (record-key) uit een at:// URI halen — nodig om een record te verwijderen. */
export function rkeyFromUri(uri: string): string {
  return uri.split("/").pop() ?? "";
}

function cleanPost(raw: RawPost): BskyPost | null {
  if (!raw.uri) return null;
  const handle = raw.author?.handle ?? BSKY_HANDLE;
  const text = raw.record?.text ?? "";
  const { images, video } = cleanEmbed(raw.embed);
  return {
    uri: raw.uri,
    url: postUrl(raw.uri, handle),
    text,
    createdAt: raw.record?.createdAt ?? raw.indexedAt ?? new Date().toISOString(),
    facets: cleanFacets(text, raw.record?.facets),
    images,
    video,
    counts: {
      likes: raw.likeCount ?? 0,
      reposts: (raw.repostCount ?? 0) + (raw.quoteCount ?? 0),
      replies: raw.replyCount ?? 0,
    },

    author: {
      displayName: raw.author?.displayName ?? "Maximilien Brussels",
      handle,
      avatar: raw.author?.avatar,
    },
  };
}

/* ---------------- client-cache (localStorage, 5 min) ---------------- */

const CACHE_TTL = 5 * 60_000;
const CACHE_PREFIX = "bsky:feed:v2:";

export type BskyPage = { posts: BskyPost[]; cursor: string | null };

function cacheKey(limit: number) {
  return `${CACHE_PREFIX}${limit}`;
}

function readCache(limit: number): BskyPage | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(cacheKey(limit));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at: number; page: BskyPage };
    if (!parsed?.at || Date.now() - parsed.at > CACHE_TTL) return null;
    return parsed.page;
  } catch {
    return null;
  }
}

function writeCache(limit: number, page: BskyPage) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(cacheKey(limit), JSON.stringify({ at: Date.now(), page }));
  } catch {
    /* quota of privémodus — cache is optioneel */
  }
}

/** Wist de lokale feedcache — bv. na een permanente verwijdering. */
export function clearBlueskyCache(): void {
  if (typeof window === "undefined") return;
  try {
    for (let i = window.localStorage.length - 1; i >= 0; i -= 1) {
      const key = window.localStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) window.localStorage.removeItem(key);
    }
  } catch {
    /* privémodus of quota — geen probleem */
  }
}

/* ---------------- schrijfacties (enkel server-side, met app-wachtwoord) ---------------- */

export type BskySession = { accessJwt: string; did: string };

/**
 * Meldt aan bij de PDS met een app-wachtwoord (nooit het hoofdwachtwoord).
 * Enkel bedoeld om vanaf de server aangeroepen te worden.
 */
export async function createBlueskySession(identifier: string, password: string): Promise<BskySession> {
  const res = await fetch(`${PDS_API}/com.atproto.server.createSession`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ identifier, password }),
  });
  if (!res.ok) throw new Error(`Bluesky-aanmelding mislukt (${res.status})`);
  const json = (await res.json()) as { accessJwt?: string; did?: string };
  if (!json.accessJwt || !json.did) throw new Error("Bluesky-aanmelding gaf geen geldige sessie terug.");
  return { accessJwt: json.accessJwt, did: json.did };
}

/** Verwijdert een post definitief van Bluesky via com.atproto.repo.deleteRecord. */
export async function deleteBlueskyRecord(input: { accessJwt: string; did: string; rkey: string }): Promise<void> {
  const res = await fetch(`${PDS_API}/com.atproto.repo.deleteRecord`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${input.accessJwt}` },
    body: JSON.stringify({ repo: input.did, collection: "app.bsky.feed.post", rkey: input.rkey }),
  });
  if (!res.ok) throw new Error(`Permanent verwijderen op Bluesky mislukt (${res.status})`);
}

/* ---------------- fetchers ---------------- */

function feedUrl(limit: number, cursor: string | undefined, filter: string) {
  const params = new URLSearchParams({ actor: BSKY_DID, limit: String(limit), filter });
  if (cursor) params.set("cursor", cursor);
  return `${API}/app.bsky.feed.getAuthorFeed?${params.toString()}`;
}

/** Eén pagina van de feed, met cursor voor "laad meer". */
export async function fetchBlueskyPage(limit = 24, cursor?: string): Promise<BskyPage> {
  let res = await fetch(feedUrl(limit, cursor, "posts_no_replies"), {
    headers: { accept: "application/json" },
  });
  if (!res.ok)
    res = await fetch(feedUrl(limit, cursor, "posts_with_media_no_replies_or_reposts"), {
      headers: { accept: "application/json" },
    });
  if (!res.ok) throw new Error(`Bluesky API ${res.status}`);
  const json = (await res.json()) as {
    feed?: Array<{ post?: RawPost; reason?: unknown }>;
    cursor?: string;
  };
  const posts = (json.feed ?? [])
    .filter((item) => !item.reason)
    .map((item) => cleanPost(item.post ?? {}))
    .filter((p): p is BskyPost => Boolean(p));
  return { posts, cursor: json.cursor ?? null };
}

/** Eerste pagina met localStorage-cache van 5 minuten. */
export async function fetchBlueskyFirstPage(limit = 24): Promise<BskyPage> {
  const cached = readCache(limit);
  if (cached) return cached;
  const page = await fetchBlueskyPage(limit);
  writeCache(limit, page);
  return page;
}

export async function fetchBlueskyFeed(limit = 24): Promise<BskyPost[]> {
  const page = await fetchBlueskyFirstPage(limit);
  return page.posts;
}


export async function fetchBlueskyProfile(): Promise<BskyProfile> {
  const res = await fetch(
    `${API}/app.bsky.actor.getProfile?actor=${encodeURIComponent(BSKY_HANDLE)}`,
    { headers: { accept: "application/json" } },
  );
  if (!res.ok) throw new Error(`Bluesky API ${res.status}`);
  const json = (await res.json()) as BskyProfile;
  return {
    displayName: json.displayName ?? "Maximilien Brussels",
    handle: json.handle ?? BSKY_HANDLE,
    avatar: json.avatar,
    description: json.description,
    followersCount: json.followersCount,
    postsCount: json.postsCount,
  };
}

/* ---------------- hooks ---------------- */

export const blueskyFeedQO = (limit = 24) =>
  queryOptions({
    queryKey: ["bluesky", "feed", limit],
    queryFn: () => fetchBlueskyFeed(limit),
    staleTime: CACHE_TTL,
    // Nieuwe posts verschijnen automatisch, ook zonder herladen.
    refetchInterval: CACHE_TTL,
    refetchOnWindowFocus: true,
    retry: 1,
  });

export const blueskyInfiniteFeedQO = (limit = 24) =>
  infiniteQueryOptions({
    queryKey: ["bluesky", "feed", "infinite", limit],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      pageParam ? fetchBlueskyPage(limit, pageParam) : fetchBlueskyFirstPage(limit),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last: BskyPage) => last.cursor ?? undefined,
    staleTime: CACHE_TTL,
    refetchOnWindowFocus: false,
    retry: 1,
  });

export const blueskyProfileQO = queryOptions({
  queryKey: ["bluesky", "profile"],
  queryFn: () => fetchBlueskyProfile(),
  staleTime: 30 * 60_000,
  refetchInterval: 30 * 60_000,
  retry: 1,
});


/** Feed + profiel in één hook, client-side (geen SSR-blokkering). */
export function useBlueskyFeed(limit = 24) {
  const feed = useQuery(blueskyFeedQO(limit));
  const profile = useQuery(blueskyProfileQO);
  const hidden = useHiddenSocialIds("bluesky");
  return {
    posts: hidden.filter(feed.data ?? [], (p) => p.uri),
    profile: profile.data,
    isLoading: feed.isLoading,
    isError: feed.isError,
    refetch: feed.refetch,
  };
}

/** Gepagineerde feed met "laad meer" via de Bluesky-cursor. */
export function useBlueskyInfiniteFeed(limit = 12) {
  const feed = useInfiniteQuery(blueskyInfiniteFeedQO(limit));
  const profile = useQuery(blueskyProfileQO);
  const hidden = useHiddenSocialIds("bluesky");
  return {
    posts: hidden.filter(feed.data?.pages.flatMap((p) => p.posts) ?? [], (p) => p.uri),
    profile: profile.data,
    isLoading: feed.isLoading,
    isError: feed.isError,
    hasMore: feed.hasNextPage,
    isLoadingMore: feed.isFetchingNextPage,
    loadMore: feed.fetchNextPage,
    refetch: feed.refetch,
  };
}

/* ---------------- tijdweergave ---------------- */

const LOCALES: Record<Lang, string> = { nl: "nl-BE", fr: "fr-BE", en: "en-GB" };

export function relativeTime(iso: string, lang: Lang, now: Date = new Date()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Math.round((then - now.getTime()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(LOCALES[lang], { numeric: "auto" });
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["week", 604_800],
    ["day", 86_400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, secs] of units) {
    if (Math.abs(diff) >= secs) return rtf.format(Math.round(diff / secs), unit);
  }
  return rtf.format(diff, "second");
}

export function absoluteDate(iso: string, lang: Lang): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(LOCALES[lang], { day: "numeric", month: "long", year: "numeric" });
}
