import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { WalletBadges } from "@/components/WalletBadges";
import { NavHeader } from "@/components/NavHeader";
import { HoefjesPad } from "@/components/HoefjesPad";
import { listAcademies, listMyCertificaten } from "@/lib/academy.functions";
import { neonSupabaseCompat as supabase } from "@/lib/neon-auth-compat";
import { combineName } from "@/lib/auth";
import { LocalLink } from "@/components/LocalLink";
import { pathFor } from "@/lib/routes-i18n";
import { useT } from "@/lib/i18n";
import { academyName } from "@/lib/academy-i18n";
import {
  Rabbit,
  Bird,
  Squirrel,
  PawPrint,
  Cat,
  Dog,
  Fish,
  Lock,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BadgeMedal } from "@/components/BadgeMedal";
import { stashRedirect } from "@/lib/redirect";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const iconMap: Record<string, LucideIcon> = { Rabbit, Bird, Squirrel, PawPrint, Cat, Dog, Fish };

export const academiesQO = queryOptions({
  queryKey: ["academies", "public"],
  queryFn: () => listAcademies(),
});

export function MijnHoefjes() {
  const { data: academies } = useSuspenseQuery(academiesQO);
  const navigate = useNavigate();
  const { t, lang } = useT();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [preview, setPreview] = useState<{
    naam: string;
    slug: string;
    unlocked: boolean;
  } | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setIsLoggedIn(!!data.user);
      setUserId(data.user?.id ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsLoggedIn(!!session?.user);
      setUserId(session?.user?.id ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const certFn = useServerFn(listMyCertificaten);
  const { data: certs } = useQuery({
    queryKey: ["my-certificaten"],
    queryFn: () => certFn(),
    enabled: isLoggedIn === true,
  });

  const { data: profile } = useQuery({
    queryKey: ["my-profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, first_name, last_name, full_name, hoefjes_balance, role")
        .eq("id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const behaaldeSlugs = new Set(
    (certs ?? []).map((c) => academies.find((a) => a.id === c.academy_id)?.slug).filter(Boolean),
  );

  const hoefjes = profile?.hoefjes_balance ?? certs?.length ?? 0;
  const doel = 12;

  return (
    <div className="min-h-screen bg-[color:var(--surface-page)]">
      <NavHeader />
      <section>
        <div className="mx-auto max-w-4xl px-4 py-12 md:py-16 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-primary">{t("mine.eyebrow")}</p>
          <h1 className="font-serif mt-5 text-5xl leading-[1.05] tracking-tight md:text-6xl italic text-[color:var(--color-terracotta)]">
            {t("mine.title")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            {t("mine.lede")}
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-4xl px-4 pb-16 space-y-12">
        {isLoggedIn === false && (
          <section className="rounded-3xl border border-primary/30 bg-card/70 p-6 text-center shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wider">
              {t("mine.loginPromptTitle")}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{t("mine.loginPromptBody")}</p>
            <Button
              onClick={() => {
                stashRedirect(pathFor("pass", lang));
                navigate({ to: pathFor("login", lang) as never });
              }}
              className="mt-4 rounded-full min-h-[48px] px-6"
            >
              {t("mine.loginBtn")}
            </Button>
          </section>
        )}

        {isLoggedIn === true && userId && (
          <section className="rounded-[2rem] border border-primary/30 bg-card p-6 shadow-sm md:p-8">
            <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-primary">
                  Mijn klantenkaart
                </p>
                <h2 className="font-serif mt-2 text-3xl italic tracking-tight text-[color:var(--ink-forest)]">
                  {combineName(profile?.first_name, profile?.last_name, profile?.full_name) ??
                    profile?.email ??
                    "Welkom!"}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">{profile?.email}</p>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="font-mono text-4xl text-[color:var(--color-terracotta)]">
                    {hoefjes}
                  </span>
                  <span className="text-sm text-muted-foreground">gespaarde Hoefjes</span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2 justify-self-center rounded-2xl border border-border bg-[color:var(--surface-page)] p-4">
                <QRCodeSVG
                  value={`fermemaximilien:customer:${userId}`}
                  size={128}
                  bgColor="#FAF8F5"
                  fgColor="#2a1810"
                  level="M"
                />
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Scan aan de kassa
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Hoefjespad — organic curving trail */}
        <section className="rounded-[2.5rem] border border-border/60 bg-card/70 p-6 md:p-10">
          <div className="mb-6 flex items-baseline justify-between border-b border-dashed border-border pb-4">
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
              {t("mine.progress")}
            </p>
            <p className="font-mono text-sm text-[color:var(--color-terracotta)]">
              {hoefjes} / {doel}
            </p>
          </div>
          <HoefjesPad collected={hoefjes} total={doel} />
        </section>

        {/* Trofeeënkast */}
        <section>
          <div className="mb-6 flex items-baseline justify-between">
            <h2 className="font-serif text-3xl italic tracking-tight text-[color:var(--ink-forest)]">
              {t("mine.trophy")}
            </h2>
            <LocalLink
              to={pathFor("academy", lang)}
              className="text-xs uppercase tracking-[0.2em] text-primary hover:underline"
            >
              {t("mine.allAcademies")}
            </LocalLink>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {academies.map((a) => {
              const Icon = (a.badge_icon ? iconMap[a.badge_icon] : undefined) ?? PawPrint;
              const behaald = behaaldeSlugs.has(a.slug);
              const cert = certs?.find((c) => c.academy_id === a.id);
              return (
                <div
                  key={a.id}
                  className={
                    "relative flex flex-col items-center rounded-3xl border p-6 text-center transition " +
                    (behaald
                      ? "border-primary/30 bg-card shadow-sm animate-in fade-in zoom-in-95"
                      : "border-dashed border-border bg-card/40")
                  }
                >
                  <button
                    type="button"
                    onClick={() =>
                      setPreview({ naam: academyName(a, lang), slug: a.slug, unlocked: behaald })
                    }
                    aria-label={`${academyName(a, lang)} — badge`}
                    className="rounded-full transition hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-terracotta)]"
                  >
                    <BadgeMedal Icon={Icon} unlocked={behaald} size={80} />
                  </button>
                  <h3
                    className={
                      "mt-4 text-lg font-semibold " +
                      (behaald ? "text-foreground" : "text-muted-foreground/70")
                    }
                  >
                    {academyName(a, lang)}
                  </h3>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    {behaald ? t("mine.done") : t("mine.locked")}
                  </p>
                  {behaald && cert ? (
                    <Link
                      to="/certificaat/$id"
                      params={{ id: cert.id }}
                      className="mt-4 inline-flex min-h-[48px] w-full items-center justify-center rounded-full border border-primary bg-primary px-4 text-xs font-semibold uppercase tracking-wider text-primary-foreground hover:bg-primary/90"
                    >
                      {t("mine.viewCert")}
                    </Link>
                  ) : (
                    <LocalLink
                      to={pathFor("academy", lang, a.slug)}
                      className="mt-4 inline-flex min-h-[48px] w-full items-center justify-center rounded-full border border-border px-4 text-xs font-semibold uppercase tracking-wider text-foreground hover:border-primary hover:text-primary"
                    >
                      {t("mine.startAcademy")}
                    </LocalLink>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Wallet integraties */}
        <section className="rounded-[2.5rem] border border-border/60 bg-card/70 p-6 md:p-10">
          <h2 className="font-serif text-3xl italic tracking-tight text-[color:var(--ink-forest)]">
            {t("mine.wallet.title")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("mine.wallet.body")}</p>
          <WalletBadges />
          <p className="mt-4 text-xs text-muted-foreground">{t("mine.wallet.soon")}</p>
        </section>
      </main>

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-sm rounded-3xl bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl italic">
              {preview?.naam} Academy
            </DialogTitle>
            <DialogDescription>
              {preview?.unlocked ? t("mine.done") : t("mine.locked")}
            </DialogDescription>
          </DialogHeader>
          {preview && (
            <div className="flex flex-col items-center gap-5 pb-2 pt-2">
              <BadgeMedal
                Icon={
                  iconMap[academies.find((a) => a.slug === preview.slug)?.badge_icon ?? ""] ??
                  PawPrint
                }
                unlocked={preview.unlocked}
                size={160}
              />
              {preview.unlocked ? (
                <p className="text-center text-sm text-muted-foreground">
                  {t("mine.done")} — {preview.naam} Academy
                </p>
              ) : (
                <LocalLink
                  to={pathFor("academy", lang, preview.slug)}
                  className="inline-flex min-h-[48px] items-center rounded-full bg-primary px-6 text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground"
                >
                  {t("mine.startAcademy")}
                </LocalLink>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
