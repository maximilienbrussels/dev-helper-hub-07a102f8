import { deepTx } from "@/lib/i18n-extra";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Apple,
  ArrowRight,
  Check,
  Footprints,
  Info,
  Languages,
  Loader2,
  MapPin,
  Shirt,
  SmartphoneCharging,
  Users,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useT, formatT, localeFor } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { sendContactMessage } from "@/lib/email.functions";
import { useHoneypot } from "@/components/HoneypotField";
import {
  CAMP_AGE_MAX,
  CAMP_AGE_MIN,
  CAMP_BASE_PRICE,
  CAMP_CANCELLATION,
  CAMP_MAX_CHILDREN,
  CAMP_MUTUELLE,
  CAMP_PRACTICAL,
  CAMP_SCHEDULE,
  FARM_CAMPS,
  campDateRange,
  campPrice,
  type CampStatus,
  type FarmCamp,
  type RateKind,
  type Season,
} from "@/lib/farm-camps";

const fieldClass =
  "mt-2 h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-[color:var(--color-terracotta)]";

const ICONS: Record<string, typeof MapPin> = {
  "map-pin": MapPin,
  footprints: Footprints,
  shirt: Shirt,
  apple: Apple,
  "smartphone-off": SmartphoneCharging,
  languages: Languages,
};

type Filter = "all" | Season;

const COPY: Record<
  Lang,
  {
    seasons: Record<Filter, string>;
    audience: string;
    from: string;
    perWeek: string;
    status: Record<CampStatus, string>;
    more: string;
    book: string;
    programme: string;
    practical: string;
    cancel: string;
    rate: string;
    rates: Record<RateKind, string>;
    children: string;
    child: (n: number) => string;
    total: string;
    step: (n: number) => string;
    stepRate: string;
    stepDetails: string;
    parent: string;
    childNames: string;
    email: string;
    phone: string;
    notes: string;
    back: string;
    next: string;
    send: string;
    sent: string;
    sentBody: string;
    failed: string;
    empty: string;
  }
> = {
  nl: {
    seasons: { all: "Alles", lente: "Lente", zomer: "Zomer", herfst: "Herfst", winter: "Winter" },
    audience: `${CAMP_AGE_MIN} – ${CAMP_AGE_MAX} jaar • max. ${CAMP_MAX_CHILDREN} kinderen per groep`,
    from: "Vanaf",
    perWeek: "/ week",
    status: { available: "Beschikbaar", few: "Laatste plaatsen", full: "Volboekt" },
    more: "Meer info & dagprogramma",
    book: "Inschrijven",
    programme: "Dagprogramma",
    practical: "Praktisch & wat neem je mee?",
    cancel: "Annuleringsvoorwaarden",
    rate: "Tarief",
    rates: { normal: "Standaard tarief", social: "Sociaal tarief" },
    children: "Aantal kinderen",
    child: (n) => (n === 1 ? "1 kind" : `${n} kinderen`),
    total: "Totaal",
    step: (n) => `Stap ${n} van 2`,
    stepRate: "Tarief & kinderen",
    stepDetails: "Jouw gegevens",
    parent: "Naam ouder / voogd",
    childNames: "Naam en leeftijd van het kind / de kinderen",
    email: "E-mail",
    phone: "Telefoon",
    notes: "Opmerkingen (allergieën, talen, …)",
    back: "Terug",
    next: "Volgende",
    send: "Inschrijving versturen",
    sent: "Aanvraag verstuurd",
    sentBody: "We bevestigen je plaats per e-mail. De inschrijving is definitief na betaling.",
    failed: "Versturen lukte niet. Mail ons gerust op contact@maximilien.brussels.",
    empty: "Geen stages in dit seizoen — kies een ander seizoen.",
  },
  fr: {
    seasons: { all: "Tous", lente: "Printemps", zomer: "Été", herfst: "Automne", winter: "Hiver" },
    audience: `${CAMP_AGE_MIN} – ${CAMP_AGE_MAX} ans • max. ${CAMP_MAX_CHILDREN} enfants par groupe`,
    from: "Dès",
    perWeek: "/ semaine",
    status: { available: "Disponible", few: "Dernières places", full: "Complet" },
    more: "Plus d'infos & programme",
    book: "Réserver",
    programme: "Programme de la journée",
    practical: "Pratique & à emporter",
    cancel: "Conditions d'annulation",
    rate: "Tarif",
    rates: { normal: "Tarif normal", social: "Tarif social" },
    children: "Nombre d'enfants",
    child: (n) => (n === 1 ? "1 enfant" : `${n} enfants`),
    total: "Total",
    step: (n) => `Étape ${n} sur 2`,
    stepRate: "Tarif & enfants",
    stepDetails: "Vos coordonnées",
    parent: "Nom du parent / tuteur",
    childNames: "Nom et âge du/des enfant·s",
    email: "E-mail",
    phone: "Téléphone",
    notes: "Remarques (allergies, langues, …)",
    back: "Retour",
    next: "Suivant",
    send: "Envoyer l'inscription",
    sent: "Demande envoyée",
    sentBody: "Nous confirmons la place par e-mail. L'inscription est effective au paiement.",
    failed: "L'envoi a échoué. Écrivez-nous à contact@maximilien.brussels.",
    empty: "Aucun stage pour cette saison — choisissez une autre saison.",
  },
  en: {
    seasons: { all: "All", lente: "Spring", zomer: "Summer", herfst: "Autumn", winter: "Winter" },
    audience: `${CAMP_AGE_MIN} – ${CAMP_AGE_MAX} years • max. ${CAMP_MAX_CHILDREN} children per group`,
    from: "From",
    perWeek: "/ week",
    status: { available: "Available", few: "Last places", full: "Fully booked" },
    more: "More info & daily schedule",
    book: "Book a place",
    programme: "Daily schedule",
    practical: "Practical info & what to bring",
    cancel: "Cancellation terms",
    rate: "Rate",
    rates: { normal: "Standard rate", social: "Social rate" },
    children: "Number of children",
    child: (n) => (n === 1 ? "1 child" : `${n} children`),
    total: "Total",
    step: (n) => `Step ${n} of 2`,
    stepRate: "Rate & children",
    stepDetails: "Your details",
    parent: "Parent / guardian name",
    childNames: "Name and age of the child(ren)",
    email: "Email",
    phone: "Phone",
    notes: "Notes (allergies, languages, …)",
    back: "Back",
    next: "Next",
    send: "Send registration",
    sent: "Request sent",
    sentBody: "We confirm the place by email. Registration is final upon payment.",
    failed: "Sending failed. Feel free to email contact@maximilien.brussels.",
    empty: "No camps this season — pick another season.",
  },
};

const STATUS_CLASS: Record<CampStatus, string> = {
  available: "bg-emerald-100 text-emerald-900",
  few: "bg-amber-100 text-amber-900",
  full: "bg-muted text-muted-foreground",
};

const FILTERS: Filter[] = ["all", "lente", "zomer", "herfst", "winter"];

/** Vakantiestages: seizoensfilter, kaarten, detailvenster en inschrijvingsflow. */
export function FarmCamps() {
  const { lang, extra, tx } = useT();
  const baseCopy = deepTx(tx, COPY[lang]);
  const c = extra ? {
    ...baseCopy,
    audience: formatT(tx("{min} – {max} years • max. {count} children per group"), { min: CAMP_AGE_MIN, max: CAMP_AGE_MAX, count: CAMP_MAX_CHILDREN }),
    child: (n: number) => n === 1 ? tx("1 child") : formatT(tx("{n} children"), { n }),
    step: (n: number) => formatT(tx("Step {n} of 2"), { n }),
  } : baseCopy;
  const [filter, setFilter] = useState<Filter>("all");
  const [detail, setDetail] = useState<FarmCamp | null>(null);
  const [booking, setBooking] = useState<FarmCamp | null>(null);

  const camps = useMemo(
    () => (filter === "all" ? FARM_CAMPS : FARM_CAMPS.filter((x) => x.season === filter)),
    [filter],
  );

  return (
    <section className="mt-14">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label={c.seasons.all}>
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-2 text-[12px] font-semibold uppercase tracking-widest transition-colors ${
              filter === f
                ? "bg-[color:var(--color-terracotta)] text-white"
                : "border border-border text-foreground/90 hover:bg-accent"
            }`}
          >
            {c.seasons[f]}
          </button>
        ))}
      </div>

      {camps.length === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">{c.empty}</p>
      ) : (
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {camps.map((camp) => (
            <article
              key={camp.slug}
              className="flex flex-col rounded-3xl border border-border/60 bg-[color:var(--surface-page)]/50 p-6"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full border border-border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground/90">
                  {c.seasons[camp.season]}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${STATUS_CLASS[camp.status]}`}
                >
                  {c.status[camp.status]}
                </span>
              </div>

              <h3 className="font-serif mt-4 text-2xl text-[color:var(--ink-forest)]">
                {tx(camp.name[lang])}
              </h3>
              <p className="mt-1 text-sm font-medium tabular-nums text-foreground/90">
                {campDateRange(camp)}
              </p>
              <p className="mt-3 inline-flex items-start gap-2 text-sm text-muted-foreground">
                <Users className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                {c.audience}
              </p>
              {camp.note && (
                <p className="mt-3 inline-flex items-start gap-2 rounded-xl bg-background/70 p-3 text-xs text-foreground/90">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                  {tx(camp.note[lang])}
                </p>
              )}

              <p className="mt-5 text-lg font-semibold text-[color:var(--ink-forest)]">
                {c.from} € {CAMP_BASE_PRICE}{" "}
                <span className="text-xs font-normal text-muted-foreground">{c.perWeek}</span>
              </p>

              <div className="mt-5 flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setDetail(camp)}
                  className="rounded-full border border-border px-4 py-2 text-[12px] font-semibold uppercase tracking-widest text-foreground/90 transition-colors hover:bg-accent"
                >
                  {c.more}
                </button>
                <button
                  type="button"
                  disabled={camp.status === "full"}
                  onClick={() => setBooking(camp)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--color-terracotta)] px-4 py-2 text-[12px] font-semibold uppercase tracking-widest text-white transition-colors hover:bg-[color:var(--surface-forest)] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {camp.status === "full" ? c.status.full : c.book}
                  {camp.status !== "full" && <ArrowRight className="h-3.5 w-3.5" aria-hidden />}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <DetailDialog
        camp={detail}
        onClose={() => setDetail(null)}
        onBook={(camp) => {
          setDetail(null);
          if (camp.status !== "full") setTimeout(() => setBooking(camp), 150);
        }}
      />
      <BookingDialog camp={booking} onClose={() => setBooking(null)} />
    </section>
  );
}

function DetailDialog({
  camp,
  onClose,
  onBook,
}: {
  camp: FarmCamp | null;
  onClose: () => void;
  onBook: (camp: FarmCamp) => void;
}) {
  const { lang, extra, tx } = useT();
  const baseCopy = deepTx(tx, COPY[lang]);
  const c = extra ? {
    ...baseCopy,
    audience: formatT(tx("{min} – {max} years • max. {count} children per group"), { min: CAMP_AGE_MIN, max: CAMP_AGE_MAX, count: CAMP_MAX_CHILDREN }),
    child: (n: number) => n === 1 ? tx("1 child") : formatT(tx("{n} children"), { n }),
    step: (n: number) => formatT(tx("Step {n} of 2"), { n }),
  } : baseCopy;

  return (
    <Dialog open={!!camp} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        {camp && (
          <>
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl text-[color:var(--ink-forest)]">
                {tx(camp.name[lang])}
              </DialogTitle>
              <DialogDescription>
                {new Date(`${camp.start}T12:00:00`).toLocaleDateString(localeFor(extra ?? lang), { day: "numeric", month: "long", year: "numeric" })} → {new Date(`${camp.end}T12:00:00`).toLocaleDateString(localeFor(extra ?? lang), { day: "numeric", month: "long", year: "numeric" })} · {c.audience}
              </DialogDescription>
            </DialogHeader>

            {camp.note && (
              <p className="rounded-xl bg-[color:var(--surface-page)]/70 p-4 text-sm text-foreground/90">
                {tx(camp.note[lang])}
              </p>
            )}

            <section className="mt-2">
              <h4 className="text-[11px] uppercase tracking-[0.25em] text-[color:var(--color-terracotta)] font-medium">
                {c.programme}
              </h4>
              <ol className="mt-4 space-y-0">
                {CAMP_SCHEDULE.map((s) => (
                  <li key={s.time} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <span
                        aria-hidden
                        className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[color:var(--color-terracotta)]"
                      />
                      <span aria-hidden className="w-px flex-1 bg-border" />
                    </div>
                    <p className="pb-4 text-sm text-foreground/90">
                      <span className="block text-xs font-semibold tabular-nums text-muted-foreground">
                        {s.time}
                      </span>
                      {tx(s.what[lang])}
                    </p>
                  </li>
                ))}
              </ol>
            </section>

            <section>
              <h4 className="text-[11px] uppercase tracking-[0.25em] text-[color:var(--color-terracotta)] font-medium">
                {c.practical}
              </h4>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {CAMP_PRACTICAL.map((p) => {
                  const Icon = ICONS[p.icon] ?? Info;
                  return (
                    <li
                      key={p.id}
                      className="rounded-2xl border border-border/60 bg-[color:var(--surface-page)]/50 p-4"
                    >
                      <p className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--ink-forest)]">
                        <Icon
                          className="h-4 w-4 text-[color:var(--color-terracotta)]"
                          aria-hidden
                        />
                        {tx(p.copy[lang].title)}
                      </p>
                      <p className="mt-1.5 text-sm text-foreground/90">{tx(p.copy[lang].body)}</p>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section>
              <h4 className="text-[11px] uppercase tracking-[0.25em] text-[color:var(--color-terracotta)] font-medium">
                {c.cancel}
              </h4>
              <p className="mt-2 text-sm text-foreground/90">{tx(CAMP_CANCELLATION[lang])}</p>
              <p className="mt-2 text-sm text-foreground/90">{tx(CAMP_MUTUELLE[lang])}</p>
            </section>

            <div className="mt-4 flex justify-end border-t border-border/60 pt-5">
              <button
                type="button"
                disabled={camp.status === "full"}
                onClick={() => onBook(camp)}
                className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--color-terracotta)] px-5 py-2.5 text-[12px] font-semibold uppercase tracking-widest text-white transition-colors hover:bg-[color:var(--surface-forest)] disabled:cursor-not-allowed disabled:opacity-45"
              >
                {camp.status === "full" ? c.status.full : c.book}
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function BookingDialog({ camp, onClose }: { camp: FarmCamp | null; onClose: () => void }) {
  const { lang, extra, tx } = useT();
  const baseCopy = deepTx(tx, COPY[lang]);
  const c = extra ? {
    ...baseCopy,
    audience: formatT(tx("{min} – {max} years • max. {count} children per group"), { min: CAMP_AGE_MIN, max: CAMP_AGE_MAX, count: CAMP_MAX_CHILDREN }),
    child: (n: number) => n === 1 ? tx("1 child") : formatT(tx("{n} children"), { n }),
    step: (n: number) => formatT(tx("Step {n} of 2"), { n }),
  } : baseCopy;
  const [step, setStep] = useState(1);
  const [rate, setRate] = useState<RateKind>("normal");
  const [children, setChildren] = useState<1 | 2 | 3>(1);
  const [parent, setParent] = useState("");
  const [kids, setKids] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [failed, setFailed] = useState(false);
  const send = useServerFn(sendContactMessage);
  const hp = useHoneypot();

  const total = campPrice(rate, children);

  function close() {
    onClose();
    setTimeout(() => {
      setStep(1);
      setSent(false);
      setFailed(false);
    }, 200);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !camp) return;
    setBusy(true);
    setFailed(false);
    const bericht = [
      `${tx(camp.name[lang])} — ${campDateRange(camp)}`,
      `${c.rate}: ${c.rates[rate]}`,
      `${c.children}: ${children}`,
      `${c.total}: € ${total}`,
      `${c.childNames}: ${kids}`,
      `${c.phone}: ${phone || "—"}`,
      "",
      notes,
    ]
      .filter(Boolean)
      .join("\n");

    try {
      await send({
        data: {
          website_hp: hp.value,
          inbox: "familie",
          onderwerp: `Stage-inschrijving — ${tx(camp.name[lang])}`,
          naam: parent,
          email,
          bericht,
          pagina: "Vakantiestages",
        },
      });
      setSent(true);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={!!camp} onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        {camp && (
          <>
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl text-[color:var(--ink-forest)]">
                {tx(camp.name[lang])}
              </DialogTitle>
              <DialogDescription>
                {campDateRange(camp)} · {c.audience}
              </DialogDescription>
            </DialogHeader>

            {sent ? (
              <div className="py-8 text-center">
                <Check
                  className="mx-auto h-10 w-10 text-[color:var(--color-terracotta)]"
                  aria-hidden
                />
                <p className="mt-4 font-serif text-xl text-[color:var(--ink-forest)]">{c.sent}</p>
                <p className="mt-2 text-sm text-foreground/90">{c.sentBody}</p>
              </div>
            ) : (
              <form onSubmit={submit} className="mt-2">
                <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                  {c.step(step)} · {step === 1 ? c.stepRate : c.stepDetails}
                </p>

                {step === 1 && (
                  <div className="mt-5 grid gap-6">
                    <div>
                      <h4 className="text-sm font-semibold text-[color:var(--ink-forest)]">
                        {c.rate}
                      </h4>
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        {(["normal", "social"] as RateKind[]).map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setRate(r)}
                            aria-pressed={rate === r}
                            className={`rounded-xl border px-4 py-3 text-sm transition-colors ${
                              rate === r
                                ? "border-[color:var(--color-terracotta)] bg-[color:var(--surface-page)]"
                                : "border-border bg-background hover:bg-accent"
                            }`}
                          >
                            {c.rates[r]}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-[color:var(--ink-forest)]">
                        {c.children}
                      </h4>
                      <div className="mt-2 grid gap-2 sm:grid-cols-3">
                        {([1, 2, 3] as const).map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setChildren(n)}
                            aria-pressed={children === n}
                            className={`rounded-xl border px-4 py-3 text-sm transition-colors ${
                              children === n
                                ? "border-[color:var(--color-terracotta)] bg-[color:var(--surface-page)]"
                                : "border-border bg-background hover:bg-accent"
                            }`}
                          >
                            <span className="block">{c.child(n)}</span>
                            <span className="mt-1 block text-xs text-muted-foreground">
                              € {campPrice(rate, n)}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <p className="rounded-xl bg-[color:var(--surface-page)]/70 p-4 text-sm text-foreground/90">
                      {tx(CAMP_MUTUELLE[lang])}
                    </p>
                  </div>
                )}

                {step === 2 && (
                  <div className="mt-5 grid gap-4">
                    <label className="block">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                        {c.parent}
                      </span>
                      <input
                        required
                        value={parent}
                        onChange={(e) => setParent(e.target.value)}
                        className={fieldClass}
                      />
                    </label>
                    <label className="block">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                        {c.childNames}
                      </span>
                      <input
                        required
                        value={kids}
                        onChange={(e) => setKids(e.target.value)}
                        className={fieldClass}
                      />
                    </label>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                          {c.email}
                        </span>
                        <input
                          required
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={fieldClass}
                        />
                      </label>
                      <label className="block">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                          {c.phone}
                        </span>
                        <input
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className={fieldClass}
                        />
                      </label>
                    </div>
                    <label className="block">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                        {c.notes}
                      </span>
                      <textarea
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-[color:var(--color-terracotta)]"
                      />
                    </label>
                    {failed && <p className="text-sm text-destructive">{c.failed}</p>}
                  </div>
                )}

                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border/60 pt-5">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                      {c.total}
                    </p>
                    <p className="text-lg font-semibold text-[color:var(--ink-forest)]">
                      € {total}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {c.rates[rate]} · {c.child(children)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {step > 1 && (
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="rounded-full border border-border px-5 py-2.5 text-[12px] font-semibold uppercase tracking-widest text-foreground/90 hover:bg-accent"
                      >
                        {c.back}
                      </button>
                    )}
                    {step === 1 ? (
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="rounded-full bg-[color:var(--color-terracotta)] px-5 py-2.5 text-[12px] font-semibold uppercase tracking-widest text-white transition-colors hover:bg-[color:var(--surface-forest)]"
                      >
                        {c.next}
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={busy}
                        className="inline-flex items-center gap-2 rounded-full bg-[color:var(--color-terracotta)] px-5 py-2.5 text-[12px] font-semibold uppercase tracking-widest text-white transition-colors hover:bg-[color:var(--surface-forest)] disabled:opacity-60"
                      >
                        {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
                        {c.send}
                      </button>
                    )}
                  </div>
                </div>
              {hp.field}
      </form>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
