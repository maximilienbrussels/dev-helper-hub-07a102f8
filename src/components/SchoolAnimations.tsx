import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, CalendarDays, Check, Clock, Loader2, Users } from "lucide-react";
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
  MAX_GROUP_SIZE,
  PICNIC_OPTIONS,
  SCHOOL_ANIMATIONS,
  SECOND_ANIMATOR_PRICE,
  TIME_SLOTS,
  type PicnicId,
  type SchoolAnimation,
} from "@/lib/school-animations";
import { usePricing } from "@/lib/use-pricing";

const COPY: Record<
  Lang,
  {
    eyebrow: string;
    title: string;
    lede: string;
    view: string;
    perGroup: string;
    programme: string;
    bring: string;
    learn: string;
    rules: string;
    rulesGroup: string;
    rulesCancel: string;
    picnic: string;
    picnicLabels: Record<PicnicId, string>;
    free: string;
    step: (n: number) => string;
    stepOptions: string;
    stepDate: string;
    stepDetails: string;
    date: string;
    slot: string;
    pupils: string;
    school: string;
    contact: string;
    email: string;
    phone: string;
    notes: string;
    total: string;
    estimate: string;
    back: string;
    next: string;
    send: string;
    sent: string;
    sentBody: string;
    failed: string;
    chooseDate: string;
    extraAnimator: string;
  }
> = {
  nl: {
    eyebrow: "Scholen & educatie",
    title: "Ons animaties-aanbod",
    lede: "Zes educatieve animaties, begeleid door onze animatoren. Kies een animatie, vink je opties aan en vraag meteen een datum aan.",
    view: "Bekijk & boek",
    perGroup: "per groep",
    programme: "Dagprogramma",
    bring: "Wat breng je mee?",
    learn: "Wat leren de leerlingen?",
    rules: "Praktische regels",
    rulesGroup: `Maximaal ${MAX_GROUP_SIZE} leerlingen per groep. Vanaf 26 leerlingen zetten we een tweede animator in (+ € ${SECOND_ANIMATOR_PRICE}).`,
    rulesCancel: "Annuleren kan tot minstens 5 werkdagen op voorhand.",
    picnic: "Middagpauze",
    picnicLabels: {
      park: "Buiten eten in het park",
      chalet: "Overdekte chalet huren",
      zaal: "Polyvalente zaal met keuken",
    },
    free: "Gratis",
    step: (n) => `Stap ${n} van 3`,
    stepOptions: "Opties & groep",
    stepDate: "Datum & tijdslot",
    stepDetails: "Jouw gegevens",
    date: "Datum",
    slot: "Tijdslot",
    pupils: "Aantal leerlingen",
    school: "School of organisatie",
    contact: "Contactpersoon",
    email: "E-mail",
    phone: "Telefoon",
    notes: "Opmerkingen",
    total: "Richtprijs",
    estimate: "Onder voorbehoud van beschikbaarheid — we bevestigen per e-mail.",
    back: "Terug",
    next: "Volgende",
    send: "Aanvraag versturen",
    sent: "Aanvraag verstuurd",
    sentBody: "We nemen zo snel mogelijk contact op om je datum te bevestigen.",
    failed: "Versturen lukte niet. Mail ons gerust op contact@maximilien.brussels.",
    chooseDate: "Kies een datum in de kalender.",
    extraAnimator: "Tweede animator",
  },
  fr: {
    eyebrow: "Écoles & éducation",
    title: "Notre offre d'animations",
    lede: "Six animations éducatives encadrées par nos animateurs. Choisissez une animation, cochez vos options et demandez directement une date.",
    view: "Voir & réserver",
    perGroup: "par groupe",
    programme: "Programme de la journée",
    bring: "À prévoir",
    learn: "Ce que les élèves apprennent",
    rules: "Règles pratiques",
    rulesGroup: `Maximum ${MAX_GROUP_SIZE} élèves par groupe. Dès 26 élèves, un deuxième animateur est prévu (+ € ${SECOND_ANIMATOR_PRICE}).`,
    rulesCancel: "Annulation possible jusqu'à 5 jours ouvrables à l'avance.",
    picnic: "Pause de midi",
    picnicLabels: {
      park: "Manger dehors dans le parc",
      chalet: "Location du chalet couvert",
      zaal: "Salle polyvalente avec cuisine",
    },
    free: "Gratuit",
    step: (n) => `Étape ${n} sur 3`,
    stepOptions: "Options & groupe",
    stepDate: "Date & créneau",
    stepDetails: "Vos coordonnées",
    date: "Date",
    slot: "Créneau",
    pupils: "Nombre d'élèves",
    school: "École ou organisation",
    contact: "Personne de contact",
    email: "E-mail",
    phone: "Téléphone",
    notes: "Remarques",
    total: "Prix indicatif",
    estimate: "Sous réserve de disponibilité — nous confirmons par e-mail.",
    back: "Retour",
    next: "Suivant",
    send: "Envoyer la demande",
    sent: "Demande envoyée",
    sentBody: "Nous vous recontactons au plus vite pour confirmer votre date.",
    failed: "L'envoi a échoué. N'hésitez pas à nous écrire à contact@maximilien.brussels.",
    chooseDate: "Choisissez une date dans le calendrier.",
    extraAnimator: "Deuxième animateur",
  },
  en: {
    eyebrow: "Schools & education",
    title: "Our activity programme",
    lede: "Six educational activities led by our facilitators. Pick an activity, tick your options and request a date right away.",
    view: "View & book",
    perGroup: "per group",
    programme: "Day programme",
    bring: "What to bring",
    learn: "What pupils learn",
    rules: "Practical rules",
    rulesGroup: `Maximum ${MAX_GROUP_SIZE} pupils per group. From 26 pupils a second facilitator joins (+ € ${SECOND_ANIMATOR_PRICE}).`,
    rulesCancel: "Cancellation is possible up to 5 working days in advance.",
    picnic: "Lunch break",
    picnicLabels: {
      park: "Eat outside in the park",
      chalet: "Rent the covered chalet",
      zaal: "Multi-purpose hall with kitchen",
    },
    free: "Free",
    step: (n) => `Step ${n} of 3`,
    stepOptions: "Options & group",
    stepDate: "Date & time slot",
    stepDetails: "Your details",
    date: "Date",
    slot: "Time slot",
    pupils: "Number of pupils",
    school: "School or organisation",
    contact: "Contact person",
    email: "E-mail",
    phone: "Phone",
    notes: "Notes",
    total: "Indicative price",
    estimate: "Subject to availability — we confirm by e-mail.",
    back: "Back",
    next: "Next",
    send: "Send request",
    sent: "Request sent",
    sentBody: "We will get back to you shortly to confirm your date.",
    failed: "Sending failed. Feel free to e-mail us at contact@maximilien.brussels.",
    chooseDate: "Pick a date in the calendar.",
    extraAnimator: "Second facilitator",
  },
};

const fieldClass =
  "mt-2 h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-[color:var(--color-terracotta)]";

/** Educatief aanbod voor scholen + interactieve aanvraag-flow. */
export function SchoolAnimations() {
  const { price } = usePricing();
  const { lang } = useT();
  const c = COPY[lang];
  const [active, setActive] = useState<SchoolAnimation | null>(null);

  return (
    <section id="animaties" className="mt-16 md:mt-24">
      <p className="text-[11px] uppercase tracking-[0.25em] text-[color:var(--color-terracotta)] font-medium">
        {c.eyebrow}
      </p>
      <h2 className="font-serif mt-3 text-3xl text-[color:var(--ink-forest)] md:text-4xl">
        {c.title}
      </h2>
      <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-foreground/90">{c.lede}</p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {SCHOOL_ANIMATIONS.map((a) => {
          const copy = a.copy[lang];
          return (
            <article
              key={a.slug}
              className="flex flex-col rounded-3xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                {copy.season}
              </p>
              <h3 className="font-serif mt-2 text-xl leading-snug text-[color:var(--ink-forest)]">
                {copy.title}
              </h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-foreground/90">{copy.lede}</p>
              <dl className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted-foreground">
                <dd className="inline-flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" aria-hidden /> {copy.age}
                </dd>
                <dd className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" aria-hidden /> {copy.duration}
                </dd>
              </dl>
              <div className="mt-5 flex items-center justify-between gap-3 border-t border-border/60 pt-4">
                <p className="text-sm font-semibold text-[color:var(--ink-forest)]">
                  € {price(`animation.${a.slug}`, a.price)}
                  <span className="ml-1 text-[11px] font-normal text-muted-foreground">
                    {c.perGroup}
                  </span>
                </p>
                <button
                  type="button"
                  onClick={() => setActive(a)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--color-terracotta)] px-4 py-2 text-[12px] font-semibold uppercase tracking-widest text-white transition-colors hover:bg-[color:var(--surface-forest)]"
                >
                  {c.view}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-8 rounded-3xl bg-[color:var(--surface-page)]/70 p-6 md:p-8">
        <h3 className="text-[11px] uppercase tracking-[0.25em] text-[color:var(--color-terracotta)] font-medium">
          {c.rules}
        </h3>
        <ul className="mt-4 grid gap-3 text-sm text-foreground/90 md:grid-cols-2">
          <li>{c.rulesGroup}</li>
          <li>{c.rulesCancel}</li>
          <li>
            {c.picnic}: {c.picnicLabels.park} — {c.free} · {c.picnicLabels.chalet} — € 50 ·{" "}
            {c.picnicLabels.zaal} — € 100
          </li>
        </ul>
      </div>

      <BookingDialog animation={active} onClose={() => setActive(null)} />
    </section>
  );
}

function BookingDialog({
  animation,
  onClose,
}: {
  animation: SchoolAnimation | null;
  onClose: () => void;
}) {
  const { lang } = useT();
  const { price } = usePricing();
  const c = COPY[lang];
  const [step, setStep] = useState(1);
  const [picnic, setPicnic] = useState<PicnicId>("park");
  const [pupils, setPupils] = useState("25");
  const [date, setDate] = useState<Date | undefined>();
  const [slot, setSlot] = useState<string>(TIME_SLOTS[0]);
  const [school, setSchool] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [failed, setFailed] = useState(false);
  const send = useServerFn(sendContactMessage);
  const hp = useHoneypot();

  const copy = animation?.copy[lang];
  const pupilCount = Number(pupils) || 0;
  const extraAnimator = pupilCount > MAX_GROUP_SIZE;
  const picnicPrice = PICNIC_OPTIONS.find((p) => p.id === picnic)!.price;
  const total = useMemo(
    () => (animation ? price(`animation.${animation.slug}`, animation.price) : 0) + picnicPrice + (extraAnimator ? SECOND_ANIMATOR_PRICE : 0),
    [animation, picnicPrice, extraAnimator],
  );

  function reset() {
    setStep(1);
    setSent(false);
    setFailed(false);
    setDate(undefined);
  }

  function close() {
    onClose();
    setTimeout(reset, 200);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !animation || !copy) return;
    setBusy(true);
    setFailed(false);
    const dateLabel = date ? date.toLocaleDateString(lang === "en" ? "en-GB" : lang) : "—";
    const bericht = [
      `${copy.title} (€ ${price(`animation.${animation.slug}`, animation.price)})`,
      `${c.date}: ${dateLabel} — ${slot}`,
      `${c.pupils}: ${pupils}`,
      `${c.picnic}: ${c.picnicLabels[picnic]} (€ ${picnicPrice})`,
      extraAnimator ? `${c.extraAnimator}: € ${SECOND_ANIMATOR_PRICE}` : null,
      `${c.total}: € ${total}`,
      `${c.school}: ${school}`,
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
          inbox: "school",
          onderwerp: `Schoolaanvraag — ${copy.title}`,
          naam: name,
          email,
          bericht,
          pagina: "Scholen & educatie",
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
    <Dialog open={!!animation} onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        {animation && copy && (
          <>
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl text-[color:var(--ink-forest)]">
                {copy.title}
              </DialogTitle>
              <DialogDescription>
                {copy.age} · {copy.duration} · € {price(`animation.${animation.slug}`, animation.price)} {c.perGroup}
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
                  {c.step(step)} ·{" "}
                  {step === 1 ? c.stepOptions : step === 2 ? c.stepDate : c.stepDetails}
                </p>

                {step === 1 && (
                  <div className="mt-5 grid gap-6">
                    <div>
                      <h4 className="text-sm font-semibold text-[color:var(--ink-forest)]">
                        {c.learn}
                      </h4>
                      <ul className="mt-2 space-y-1.5 text-sm text-foreground/90">
                        {copy.learn.map((l) => (
                          <li key={l} className="flex gap-2">
                            <span
                              aria-hidden
                              className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--color-terracotta)]"
                            />
                            {l}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div>
                        <h4 className="text-sm font-semibold text-[color:var(--ink-forest)]">
                          {c.programme}
                        </h4>
                        <dl className="mt-2 space-y-1.5 text-sm text-foreground/90">
                          {copy.schedule.map((s) => (
                            <div key={s.time} className="flex gap-3">
                              <dt className="w-12 shrink-0 tabular-nums text-muted-foreground">
                                {s.time}
                              </dt>
                              <dd>{s.what}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-[color:var(--ink-forest)]">
                          {c.bring}
                        </h4>
                        <ul className="mt-2 space-y-1.5 text-sm text-foreground/90">
                          {copy.bring.map((b) => (
                            <li key={b}>{b}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-[color:var(--ink-forest)]">
                        {c.picnic}
                      </h4>
                      <div className="mt-2 grid gap-2">
                        {PICNIC_OPTIONS.map((p) => (
                          <label
                            key={p.id}
                            className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm"
                          >
                            <span className="flex items-center gap-3">
                              <input
                                type="radio"
                                name="picnic"
                                checked={picnic === p.id}
                                onChange={() => setPicnic(p.id)}
                                className="accent-[color:var(--color-terracotta)]"
                              />
                              {c.picnicLabels[p.id]}
                            </span>
                            <span className="font-medium text-[color:var(--ink-forest)]">
                              {p.price === 0 ? c.free : `+ € ${p.price}`}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <label className="block">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                        {c.pupils}
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={60}
                        value={pupils}
                        onChange={(e) => setPupils(e.target.value)}
                        className={fieldClass}
                      />
                      {extraAnimator && (
                        <span className="mt-2 block text-xs text-[color:var(--color-terracotta)]">
                          {c.rulesGroup}
                        </span>
                      )}
                    </label>
                  </div>
                )}

                {step === 2 && (
                  <div className="mt-5 grid gap-6 md:grid-cols-[auto_1fr]">
                    <div className="rounded-2xl border border-border bg-background p-2">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        disabled={{ before: new Date() }}
                      />
                    </div>
                    <div>
                      <h4 className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--ink-forest)]">
                        <CalendarDays className="h-4 w-4" aria-hidden />
                        {c.slot}
                      </h4>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {TIME_SLOTS.map((s) => (
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
                      {!date && (
                        <p className="mt-4 text-xs text-muted-foreground">{c.chooseDate}</p>
                      )}
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="mt-5 grid gap-5">
                    <div className="grid gap-5 sm:grid-cols-2">
                      <label className="block min-w-0">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                          {c.school}
                        </span>
                        <input
                          required
                          value={school}
                          onChange={(e) => setSchool(e.target.value)}
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
                    <p className="text-[11px] text-muted-foreground">{c.estimate}</p>
                  </div>
                  <div className="flex gap-2">
                    {step > 1 && (
                      <button
                        type="button"
                        onClick={() => setStep(step - 1)}
                        className="rounded-full border border-border px-5 py-2.5 text-[12px] font-semibold uppercase tracking-widest text-foreground/90 hover:bg-accent"
                      >
                        {c.back}
                      </button>
                    )}
                    {step < 3 ? (
                      <button
                        type="button"
                        disabled={step === 2 && !date}
                        onClick={() => setStep(step + 1)}
                        className="rounded-full bg-[color:var(--color-terracotta)] px-5 py-2.5 text-[12px] font-semibold uppercase tracking-widest text-white transition-colors hover:bg-[color:var(--surface-forest)] disabled:opacity-50"
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
