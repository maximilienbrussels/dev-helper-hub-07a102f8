import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Check, Clock, Sparkles, Users } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useT } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { sendContactMessage } from "@/lib/email.functions";
import { useHoneypot } from "@/components/HoneypotField";
import {
  PRIVATISATION_EXTRAS,
  RENTAL_INCLUDED,
  RENTAL_RULES,
  RENTAL_SPACES,
  RENTAL_TIME_SLOTS,
  rentalPrice,
  type RentalDuration,
  type RentalSpace,
} from "@/lib/rental-spaces";
import { Illustration } from "@/components/Illustration";
import chaletDagdeelAsset from "@/assets/illustrations/chalet-dagdeel.webp.asset.json";
import { usePricing } from "@/lib/use-pricing";

const COPY: Record<
  Lang,
  {
    eyebrow: string;
    title: string;
    lede: string;
    spacesTitle: string;
    halfDay: string;
    fullDay: string;
    upTo: string;
    hours: (n: number) => string;
    request: string;
    included: string;
    extras: string;
    rules: string;
    duration: string;
    date: string;
    slot: string;
    people: string;
    eventType: string;
    org: string;
    contact: string;
    email: string;
    phone: string;
    notes: string;
    total: string;
    estimate: string;
    send: string;
    sending: string;
    sent: string;
    sentBody: string;
    failed: string;
    chooseDate: string;
    chaletAlt: string;
  }
> = {
  nl: {
    eyebrow: "Verhuur",
    title: "Onze ruimtes & formules",
    lede: "Huur een losse ruimte voor je workshop of vergadering, of privatiseer de volledige boerderij voor je groot event.",
    spacesTitle: "Losse ruimtes huren",
    halfDay: "Halve dag",
    fullDay: "Hele dag",
    upTo: "Tot",
    hours: (n) => `${n} uur`,
    request: "Aanvraag indienen",
    included: "Inbegrepen bij elke huur",
    extras: "Extra inbegrepen bij privatisering",
    rules: "Praktische afspraken",
    duration: "Formule",
    date: "Gewenste datum",
    slot: "Startuur",
    people: "Aantal personen",
    eventType: "Type evenement",
    org: "Organisatie of bedrijf",
    contact: "Contactpersoon",
    email: "E-mail",
    phone: "Telefoon",
    notes: "Vertel kort over je event",
    total: "Richtprijs",
    estimate: "Onder voorbehoud van beschikbaarheid — we bevestigen per e-mail.",
    send: "Aanvraag versturen",
    sending: "Versturen…",
    sent: "Aanvraag verstuurd",
    sentBody: "We nemen zo snel mogelijk contact op om je datum te bevestigen.",
    failed: "Versturen lukte niet. Mail ons gerust op contact@maximilien.brussels.",
    chooseDate: "Kies een datum in de kalender.",
    chaletAlt: "Foto van het chalet op de boerderij",
  },
  fr: {
    eyebrow: "Location",
    title: "Nos espaces & formules",
    lede: "Louez un espace pour votre atelier ou réunion, ou privatisez toute la ferme pour votre grand événement.",
    spacesTitle: "Louer nos locaux",
    halfDay: "Demi-journée",
    fullDay: "Journée",
    upTo: "Jusqu'à",
    hours: (n) => `${n} heures`,
    request: "Envoyer une demande",
    included: "Inclus dans chaque location",
    extras: "Inclus en plus lors d'une privatisation",
    rules: "Informations pratiques",
    duration: "Formule",
    date: "Date souhaitée",
    slot: "Heure de début",
    people: "Nombre de personnes",
    eventType: "Type d'événement",
    org: "Organisation ou entreprise",
    contact: "Personne de contact",
    email: "E-mail",
    phone: "Téléphone",
    notes: "Parlez-nous brièvement de votre événement",
    total: "Prix indicatif",
    estimate: "Sous réserve de disponibilité — nous confirmons par e-mail.",
    send: "Envoyer la demande",
    sending: "Envoi…",
    sent: "Demande envoyée",
    sentBody: "Nous vous recontactons au plus vite pour confirmer votre date.",
    failed: "L'envoi a échoué. N'hésitez pas à nous écrire à contact@maximilien.brussels.",
    chooseDate: "Choisissez une date dans le calendrier.",
    chaletAlt: "Photo du chalet à la ferme",
  },
  en: {
    eyebrow: "Venue hire",
    title: "Our spaces & formulas",
    lede: "Rent a single space for your workshop or meeting, or hire the whole farm privately for a large event.",
    spacesTitle: "Rent our spaces",
    halfDay: "Half day",
    fullDay: "Full day",
    upTo: "Up to",
    hours: (n) => `${n} hours`,
    request: "Send a request",
    included: "Included with every rental",
    extras: "Extra with a full private hire",
    rules: "Practical arrangements",
    duration: "Formula",
    date: "Preferred date",
    slot: "Start time",
    people: "Number of people",
    eventType: "Type of event",
    org: "Organisation or company",
    contact: "Contact person",
    email: "E-mail",
    phone: "Phone",
    notes: "Tell us briefly about your event",
    total: "Indicative price",
    estimate: "Subject to availability — we confirm by e-mail.",
    send: "Send request",
    sending: "Sending…",
    sent: "Request sent",
    sentBody: "We will get back to you shortly to confirm your date.",
    failed: "Sending failed. Feel free to e-mail us at contact@maximilien.brussels.",
    chooseDate: "Pick a date in the calendar.",
    chaletAlt: "Photo of the farm chalet",
  },
};

const fieldClass =
  "mt-2 h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-[color:var(--color-terracotta)]";

/** Verhuuraanbod: losse ruimtes, privatisering en directe aanvraagflow. */
export function RentalSpaces() {
  const { price } = usePricing();
  const { lang } = useT();
  const c = COPY[lang];
  const [active, setActive] = useState<{ space: RentalSpace; duration: RentalDuration } | null>(
    null,
  );
  const spaces = RENTAL_SPACES.filter((s) => !s.featured);
  const vip = RENTAL_SPACES.find((s) => s.featured)!;
  const vipCopy = vip.copy[lang];

  return (
    <section id="ruimtes" className="mt-16 md:mt-24">
      <p className="text-[11px] uppercase tracking-[0.25em] text-[color:var(--color-terracotta)] font-medium">
        {c.eyebrow}
      </p>
      <h2 className="font-serif mt-3 text-3xl text-[color:var(--ink-forest)] md:text-4xl">
        {c.title}
      </h2>
      <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-foreground/90">{c.lede}</p>

      <h3 className="mt-10 text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
        {c.spacesTitle}
      </h3>
      <div className="mt-4 grid gap-5 md:grid-cols-3">
        {spaces.map((s) => {
          const copy = s.copy[lang];
          return (
            <article
              key={s.slug}
              className="flex flex-col rounded-3xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              {s.slug === "chalet" && (
                <Illustration
                  src={chaletDagdeelAsset.url}
                  alt={c.chaletAlt}
                  className="mb-4 aspect-video w-full"
                />
              )}
              <h4 className="font-serif text-xl leading-snug text-[color:var(--ink-forest)]">
                {copy.title}
              </h4>
              <p className="mt-2 inline-flex items-center gap-1.5 text-[12px] text-muted-foreground">
                <Users className="h-3.5 w-3.5" aria-hidden /> {c.upTo} {s.capacity}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-foreground/90">{copy.lede}</p>
              <ul className="mt-4 flex-1 space-y-1.5 text-sm text-foreground/90">
                {copy.details.map((d) => (
                  <li key={d} className="flex gap-2">
                    <span
                      aria-hidden
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--color-terracotta)]"
                    />
                    {d}
                  </li>
                ))}
              </ul>
              <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-border/60 pt-4 text-sm">
                <div>
                  <dt className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    {c.halfDay}
                  </dt>
                  <dd className="font-semibold text-[color:var(--ink-forest)]">€ {price(`rental.${s.slug}.half`, s.halfDay ?? 0)}</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    {c.fullDay}
                  </dt>
                  <dd className="font-semibold text-[color:var(--ink-forest)]">€ {price(`rental.${s.slug}.full`, s.fullDay)}</dd>
                </div>
              </dl>
              <button
                type="button"
                onClick={() => setActive({ space: s, duration: "half" })}
                className="mt-5 inline-flex items-center justify-center gap-1.5 rounded-full bg-[color:var(--color-terracotta)] px-4 py-2.5 text-[12px] font-semibold uppercase tracking-widest text-white transition-colors hover:bg-[color:var(--surface-forest)]"
              >
                {c.request}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </button>
            </article>
          );
        })}
      </div>

      <article className="mt-6 overflow-hidden rounded-3xl border border-[color:var(--color-terracotta)]/40 bg-[color:var(--surface-page)]/70 p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-xl">
            <p className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.25em] text-[color:var(--color-terracotta)]">
              <Sparkles className="h-3.5 w-3.5" aria-hidden /> VIP
            </p>
            <h3 className="font-serif mt-2 text-2xl text-[color:var(--ink-forest)] md:text-3xl">
              {vipCopy.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-foreground/90">{vipCopy.lede}</p>
            <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" aria-hidden /> {c.upTo} {vip.capacity}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" aria-hidden /> {c.hours(vip.fixedHours ?? 10)}
              </span>
            </p>
          </div>
          <div className="text-right">
            <p className="font-serif text-4xl text-[color:var(--ink-forest)]">€ {price(`rental.${vip.slug}.full`, vip.fullDay)}</p>
            <button
              type="button"
              onClick={() => setActive({ space: vip, duration: "full" })}
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[color:var(--ink-forest)] px-5 py-2.5 text-[12px] font-semibold uppercase tracking-widest text-[color:var(--surface-page)] transition-opacity hover:opacity-90"
            >
              {c.request}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        </div>
        <ul className="mt-6 grid gap-2 border-t border-border/60 pt-5 text-sm text-foreground/90 md:grid-cols-2">
          {PRIVATISATION_EXTRAS[lang].map((e) => (
            <li key={e} className="flex gap-2">
              <Check
                className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--color-terracotta)]"
                aria-hidden
              />
              {e}
            </li>
          ))}
        </ul>
      </article>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <div className="rounded-3xl border border-border bg-card p-6">
          <h3 className="text-[11px] uppercase tracking-[0.25em] text-[color:var(--color-terracotta)] font-medium">
            {c.included}
          </h3>
          <ul className="mt-4 space-y-2 text-sm text-foreground/90">
            {RENTAL_INCLUDED[lang].map((i) => (
              <li key={i} className="flex gap-2">
                <Check
                  className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--color-terracotta)]"
                  aria-hidden
                />
                {i}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl bg-[color:var(--surface-page)]/70 p-6">
          <h3 className="text-[11px] uppercase tracking-[0.25em] text-[color:var(--color-terracotta)] font-medium">
            {c.rules}
          </h3>
          <ul className="mt-4 space-y-2 text-sm text-foreground/90">
            {RENTAL_RULES[lang].map((r) => (
              <li key={r} className="flex gap-2">
                <span
                  aria-hidden
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--color-terracotta)]"
                />
                {r}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <RentalRequestDialog selection={active} onClose={() => setActive(null)} />
    </section>
  );
}

function RentalRequestDialog({
  selection,
  onClose,
}: {
  selection: { space: RentalSpace; duration: RentalDuration } | null;
  onClose: () => void;
}) {
  const { lang } = useT();
  const c = COPY[lang];
  const [duration, setDuration] = useState<RentalDuration>("half");
  const [date, setDate] = useState<Date | undefined>();
  const [slot, setSlot] = useState<string>(RENTAL_TIME_SLOTS[0]);
  const [people, setPeople] = useState("30");
  const [eventType, setEventType] = useState("");
  const [org, setOrg] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [failed, setFailed] = useState(false);
  const [openedFor, setOpenedFor] = useState<string | null>(null);
  const send = useServerFn(sendContactMessage);
  const hp = useHoneypot();

  const space = selection?.space;
  const copy = space?.copy[lang];

  // Synchroniseer de voorgeselecteerde formule wanneer een andere ruimte opent.
  if (selection && openedFor !== selection.space.slug) {
    setOpenedFor(selection.space.slug);
    setDuration(selection.duration);
    setSent(false);
    setFailed(false);
  }

  const { price } = usePricing();
  const total = space
    ? price(`rental.${space.slug}.${duration}`, rentalPrice(space, duration))
    : 0;
  const durationLabel =
    space?.halfDay === null
      ? c.hours(space.fixedHours ?? 10)
      : duration === "half"
        ? c.halfDay
        : c.fullDay;

  function close() {
    onClose();
    setTimeout(() => {
      setOpenedFor(null);
      setDate(undefined);
      setSent(false);
      setFailed(false);
    }, 200);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !space || !copy) return;
    setBusy(true);
    setFailed(false);
    const dateLabel = date ? date.toLocaleDateString(lang === "en" ? "en-GB" : lang) : "—";
    const bericht = [
      `${copy.title} — ${durationLabel} (€ ${total})`,
      `${c.date}: ${dateLabel} — ${slot}`,
      `${c.people}: ${people}`,
      `${c.eventType}: ${eventType || "—"}`,
      `${c.org}: ${org || "—"}`,
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
          inbox: "bedrijf",
          onderwerp: `Verhuuraanvraag — ${copy.title}`,
          naam: name,
          email,
          bericht,
          pagina: "Verhuur",
        },
      });
      setSent(true);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  // Voorkom dat de achtergrond meescrollt terwijl de popup open staat (extra
  // vangnet naast Radix' eigen scroll-lock, en werkt ook nog als iOS bounce-scroll geeft).
  useEffect(() => {
    if (!selection) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [selection]);

  return (
    <Dialog open={!!selection} onOpenChange={(open) => !open && close()}>
      <DialogContent
        className={
          // Mobiel: bottom-sheet die alleen op opacity/transform animeert (geen
          // hoogte/breedte-animatie), vaste positie t.o.v. de viewport zodat er
          // geen reflow tijdens de transitie is, en een eigen scrollcontainer met
          // safe-area-padding zodat niets achter de topbar verdwijnt.
          "inset-x-0 bottom-0 top-auto left-0 h-[100dvh] max-h-[100dvh] w-full max-w-none " +
          "translate-x-0 translate-y-0 gap-0 rounded-t-3xl rounded-b-none border-x-0 border-b-0 p-0 " +
          "duration-200 ease-out will-change-transform " +
          "data-[state=open]:slide-in-from-bottom-8 data-[state=closed]:slide-out-to-bottom-8 " +
          "data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100 " +
          "motion-reduce:!animate-none motion-reduce:transition-none " +
          // Vanaf md: terug naar het bestaande, ongewijzigde desktop-uiterlijk.
          "sm:inset-auto sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:h-auto sm:max-h-[85vh] sm:w-full " +
          "sm:max-w-2xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:gap-4 sm:rounded-lg sm:border sm:p-6 " +
          "sm:data-[state=open]:slide-in-from-bottom-0 sm:data-[state=closed]:slide-out-to-bottom-0 " +
          "sm:data-[state=open]:zoom-in-95 sm:data-[state=closed]:zoom-out-95"
        }
      >
        <div className="flex h-full min-h-0 flex-col overflow-y-auto overscroll-contain px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))] sm:h-auto sm:px-0 sm:pb-0 sm:pt-0">
          {space && copy && (
            <>
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl text-[color:var(--ink-forest)]">
                  {copy.title}
                </DialogTitle>
                <DialogDescription>
                  {c.upTo} {space.capacity} · {durationLabel} · € {total}
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
                <form onSubmit={submit} className="mt-2 grid gap-6">
                  {space.halfDay !== null && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                        {c.duration}
                      </p>
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        {(["half", "full"] as RentalDuration[]).map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setDuration(d)}
                            className={`rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                              duration === d
                                ? "border-transparent bg-[color:var(--color-terracotta)] text-white"
                                : "border-border bg-background text-foreground/90 hover:border-[color:var(--color-terracotta)]"
                            }`}
                          >
                            {d === "half" ? c.halfDay : c.fullDay} — €{" "}
                            {price(`rental.${space.slug}.${d}`, (d === "half" ? space.halfDay : space.fullDay) ?? 0)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                        {c.date}
                      </p>
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        disabled={{ before: new Date() }}
                        className="mt-2 rounded-xl border border-border"
                      />
                      {!date && (
                        <p className="mt-2 text-xs text-muted-foreground">{c.chooseDate}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                        {c.slot}
                      </p>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {RENTAL_TIME_SLOTS.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setSlot(s)}
                            className={`rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                              slot === s
                                ? "border-transparent bg-[color:var(--color-terracotta)] text-white"
                                : "border-border bg-background text-foreground/90 hover:border-[color:var(--color-terracotta)]"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                      <label className="mt-4 block">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                          {c.people}
                        </span>
                        <input
                          type="number"
                          min={1}
                          value={people}
                          onChange={(e) => setPeople(e.target.value)}
                          className={fieldClass}
                        />
                      </label>
                      <label className="mt-4 block">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                          {c.eventType}
                        </span>
                        <input
                          value={eventType}
                          onChange={(e) => setEventType(e.target.value)}
                          className={fieldClass}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className="block min-w-0">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                        {c.org}
                      </span>
                      <input
                        value={org}
                        onChange={(e) => setOrg(e.target.value)}
                        className={fieldClass}
                      />
                    </label>
                    <label className="block min-w-0">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                        {c.contact}
                      </span>
                      <input
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={fieldClass}
                      />
                    </label>
                    <label className="block min-w-0">
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
                    <label className="block min-w-0">
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

                  <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border/60 pt-5">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                        {c.total}
                      </p>
                      <p className="text-lg font-semibold text-[color:var(--ink-forest)]">
                        € {total}
                      </p>
                      <p className="text-[11px] text-muted-foreground">{c.estimate}</p>
                    </div>
                    <button
                      type="submit"
                      disabled={busy}
                      className="rounded-full bg-[color:var(--color-terracotta)] px-6 py-3 text-[12px] font-semibold uppercase tracking-widest text-white transition-colors hover:bg-[color:var(--surface-forest)] disabled:opacity-60"
                    >
                      {busy ? c.sending : c.send}
                    </button>
                  </div>
                {hp.field}
      </form>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
