import { useParams } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Award, CalendarHeart, GraduationCap, Lock, Loader2, Sprout, UserPlus, UserCheck } from "lucide-react";
import { toast } from "sonner";

import { NavHeader } from "@/components/NavHeader";
import { Button } from "@/components/ui/button";
import { HoefjesPad } from "@/components/HoefjesPad";
import { useAuth } from "@/lib/auth";
import { isLang, DEFAULT_LANG, type Lang } from "@/lib/routes-i18n";
import { getPublicProfile, getFollowState, setFollow, type TimelineItem } from "@/lib/public-profile.functions";

const C = {
  nl: {
    anon: "Boerderijvriend", since: "Lid sinds", followers: "volgers", following: "volgend", follow: "Volgen", unfollow: "Volgend",
    timeline: "Tijdlijn", badges: "Badges", certs: "Certificaten", hooi: "Spaarpad", earned: (a: string) => `Behaalde het certificaat ${a}`,
    joined: "Werd lid van Maximilien", of: (a: number, b: number) => `${a} van ${b} behaald`, verify: "Bekijk certificaat",
    priv: "Dit profiel is privé", privText: "De eigenaar deelt dit profiel (nog) niet.", nf: "Profiel niet gevonden", nfText: "Controleer de link.",
    empty: "Nog niets te tonen.", hooiCount: (n: number) => `${n} hooi gespaard`, loginToFollow: "Log in om te volgen.",
  },
  fr: {
    anon: "Ami de la ferme", since: "Membre depuis", followers: "abonnés", following: "abonnements", follow: "Suivre", unfollow: "Abonné",
    timeline: "Fil d'activité", badges: "Badges", certs: "Certificats", hooi: "Parcours", earned: (a: string) => `A obtenu le certificat ${a}`,
    joined: "A rejoint Maximilien", of: (a: number, b: number) => `${a} sur ${b} obtenus`, verify: "Voir le certificat",
    priv: "Ce profil est privé", privText: "Le propriétaire ne partage pas (encore) ce profil.", nf: "Profil introuvable", nfText: "Vérifiez le lien.",
    empty: "Rien à afficher pour l'instant.", hooiCount: (n: number) => `${n} foin épargné`, loginToFollow: "Connectez-vous pour suivre.",
  },
  en: {
    anon: "Farm friend", since: "Member since", followers: "followers", following: "following", follow: "Follow", unfollow: "Following",
    timeline: "Timeline", badges: "Badges", certs: "Certificates", hooi: "Savings path", earned: (a: string) => `Earned the ${a} certificate`,
    joined: "Joined Maximilien", of: (a: number, b: number) => `${a} of ${b} earned`, verify: "View certificate",
    priv: "This profile is private", privText: "The owner doesn't share this profile (yet).", nf: "Profile not found", nfText: "Please check the link.",
    empty: "Nothing to show yet.", hooiCount: (n: number) => `${n} hay saved`, loginToFollow: "Sign in to follow.",
  },
} as const;

function fmt(d: string, lang: Lang) {
  return new Date(d).toLocaleDateString(lang === "en" ? "en-GB" : `${lang}-BE`, { day: "numeric", month: "long", year: "numeric" });
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[color:var(--surface-page)]">
      <NavHeader />
      <main className="mx-auto max-w-3xl px-4 py-10 md:py-14">{children}</main>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-[1.75rem] border border-border bg-card p-6 shadow-sm md:p-8">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider">
        <span className="text-primary [&_svg]:size-4">{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export function PublicProfilePage({ notFoundView }: { notFoundView?: boolean }) {
  const params = useParams({ strict: false }) as { lang?: string; id?: string };
  const lang: Lang = isLang(params.lang) ? params.lang : DEFAULT_LANG;
  const c = C[lang];
  const id = (params.id ?? "").toLowerCase();
  const fetchProfile = useServerFn(getPublicProfile);
  const q = useQuery({
    queryKey: ["public-profile", id],
    queryFn: () => fetchProfile({ data: { id } }),
    enabled: !notFoundView && /^[a-z2-9]{10}$/.test(id),
  });

  if (notFoundView || q.data?.status === "not_found" || q.isError) {
    return (
      <Shell>
        <div className="py-16 text-center">
          <h1 className="font-serif text-3xl italic">{c.nf}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{c.nfText}</p>
        </div>
      </Shell>
    );
  }
  if (!q.data) {
    return (
      <Shell>
        <Loader2 className="mx-auto size-6 animate-spin text-muted-foreground" />
      </Shell>
    );
  }
  if (q.data.status === "private") {
    return (
      <Shell>
        <div className="py-16 text-center">
          <Lock className="mx-auto size-8 text-muted-foreground" aria-hidden />
          <h1 className="mt-4 font-serif text-3xl italic">{c.priv}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{c.privText}</p>
        </div>
      </Shell>
    );
  }

  const p = q.data;
  const name = p.name || c.anon;
  return (
    <Shell>
      <header className="flex flex-wrap items-center gap-5">
        {p.avatarUrl ? (
          <img src={p.avatarUrl} alt="" className="size-20 rounded-full object-cover ring-2 ring-border" />
        ) : (
          <div className="grid size-20 place-items-center rounded-full bg-[color:var(--color-terracotta)] text-2xl font-semibold text-[color:var(--color-cream)]">
            {name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-serif text-3xl italic tracking-tight text-[color:var(--color-terracotta)] md:text-4xl">{name}</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {c.since} {fmt(p.memberSince, lang)}
            {p.followers !== null && (
              <>
                {" · "}
                <strong className="text-foreground">{p.followers}</strong> {c.followers} · <strong className="text-foreground">{p.following}</strong> {c.following}
              </>
            )}
          </p>
          {p.bio && <p className="mt-2 text-sm">{p.bio}</p>}
        </div>
        <FollowButton id={id} lang={lang} />
      </header>

      <div className="mt-8 grid gap-5">
        {p.timeline && (
          <Section title={c.timeline} icon={<CalendarHeart />}>
            {p.timeline.length === 0 ? (
              <p className="text-sm text-muted-foreground">{c.empty}</p>
            ) : (
              <ol className="relative space-y-5 border-l border-border pl-6">
                {p.timeline.map((t, i) => (
                  <TimelineRow key={i} item={t} lang={lang} />
                ))}
              </ol>
            )}
          </Section>
        )}

        {p.badges && (
          <Section title={c.badges} icon={<Award />}>
            <p className="text-sm text-muted-foreground">{c.of(p.badges.achieved.length, p.badges.total)}</p>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[color:var(--surface-page)]">
              <div
                className="h-full rounded-full bg-[color:var(--color-terracotta)]"
                style={{ width: `${p.badges.total ? Math.round((p.badges.achieved.length / p.badges.total) * 100) : 0}%` }}
              />
            </div>
          </Section>
        )}

        {p.certificates && p.certificates.length > 0 && (
          <Section title={c.certs} icon={<GraduationCap />}>
            <ul className="grid gap-3 sm:grid-cols-2">
              {p.certificates.map((cert, i) => (
                <li key={i} className="flex items-center justify-between gap-3 rounded-2xl border border-border p-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{cert.academy[lang]}</p>
                    <p className="text-xs text-muted-foreground">{fmt(cert.date, lang)}</p>
                  </div>
                  {cert.code && (
                    <a href={`/verifieer/${cert.code}`} className="shrink-0 text-xs font-medium text-primary underline-offset-4 hover:underline">
                      {c.verify}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {p.hooi !== null && (
          <Section title={c.hooi} icon={<Sprout />}>
            <p className="mb-4 text-sm text-muted-foreground">{c.hooiCount(p.hooi)}</p>
            <HoefjesPad collected={p.hooi} total={12} />
          </Section>
        )}
      </div>
    </Shell>
  );
}

function TimelineRow({ item, lang }: { item: TimelineItem; lang: Lang }) {
  const c = C[lang];
  return (
    <li className="relative">
      <span className="absolute -left-[31px] top-1 grid size-4 place-items-center rounded-full bg-[color:var(--color-terracotta)] ring-4 ring-card" aria-hidden />
      <p className="text-sm font-medium">{item.kind === "certificate" ? c.earned(item.academy[lang]) : c.joined}</p>
      <p className="text-xs text-muted-foreground">{fmt(item.date, lang)}</p>
    </li>
  );
}

function FollowButton({ id, lang }: { id: string; lang: Lang }) {
  const c = C[lang];
  const { isLoggedIn } = useAuth() as { isLoggedIn?: boolean };
  const qc = useQueryClient();
  const stateFn = useServerFn(getFollowState);
  const followFn = useServerFn(setFollow);
  const st = useQuery({ queryKey: ["follow", id], queryFn: () => stateFn({ data: { id } }), enabled: Boolean(isLoggedIn) });
  const m = useMutation({
    mutationFn: (follow: boolean) => followFn({ data: { id, follow } }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["follow", id] });
      void qc.invalidateQueries({ queryKey: ["public-profile", id] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Er ging iets mis."),
  });
  if (!isLoggedIn) {
    return (
      <Button variant="outline" className="rounded-full" onClick={() => toast.message(c.loginToFollow)}>
        <UserPlus className="mr-2 size-4" /> {c.follow}
      </Button>
    );
  }
  if (!st.data || st.data.self) return null;
  return (
    <Button
      variant={st.data.following ? "outline" : "default"}
      className="rounded-full"
      disabled={m.isPending}
      onClick={() => m.mutate(!st.data!.following)}
    >
      {st.data.following ? <UserCheck className="mr-2 size-4" /> : <UserPlus className="mr-2 size-4" />}
      {st.data.following ? c.unfollow : c.follow}
    </Button>
  );
}
