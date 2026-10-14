import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock,
  Download,
  Leaf,
  Loader2,
  Users,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import invitationAsset from "@/assets/uitnodiging-boerderijfeest.pdf.asset.json";
import {
  BIRTHDAY_DEPOSIT,
  BIRTHDAY_HOUSE_RULES,
  BIRTHDAY_PACKAGES,
  EXTRA_CHILD_PRICE,
  INCLUDED_CHILDREN,
  MAX_CHILDREN,
  birthdayTotal,
  type BirthdayPackage,
} from "@/lib/birthday-packages";
import { usePricing } from "@/lib/use-pricing";

const COPY: Record<
  Lang,
  {
    eyebrow: string;
    title: string;
    lede: string;
    book: string;
    included: string;
    programme: string;
    houseRules: string;
    houseRulesLede: string;
    deposit: string;
    extraChild: string;
    step: (n: number) => string;
    stepPackage: string;
    stepGroup: string;
    stepDetails: string;
    date: string;
    slot: string;
    children: string;
    adults: string;
    guests: string;
    contact: string;
    email: string;
    phone: string;
    childName: string;
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
    weekdayHint: (day: string) => string;
    weekdays: Record<number, string>;
    invitationTitle: string;
    invitationBody: string;
    invitationCta: string;
  }
> = {
  nl: {
    eyebrow: "Kinderfeestjes & verjaardagen",
    title: "Vier je verjaardag op de boerderij",
    lede: "Drie formules met begeleide rondleiding, keuken en eigen koer. Kies je pakket, je datum en vraag je feest meteen aan.",
    book: "Bekijk & boek",
    included: "Inbegrepen in de prijs",
    programme: "Verloop van de dag",
    houseRules: "Huisregels",
    houseRulesLede: "Even goed doorlezen: dit voorkomt verrassingen op de dag zelf.",
    deposit: `+ € ${BIRTHDAY_DEPOSIT} waarborg in cash bij aankomst (terugbetaald)`,
    extraChild: `Vanaf het 16e kind: + € ${EXTRA_CHILD_PRICE} per kind (max. ${MAX_CHILDREN})`,
    step: (n) => `Stap ${n} van 3`,
    stepPackage: "Pakket & datum",
    stepGroup: "Aantal deelnemers",
    stepDetails: "Jouw gegevens",
    date: "Datum",
    slot: "Startuur",
    children: "Aantal kinderen",
    adults: "Aantal volwassenen",
    guests: "Aantal deelnemers",
    contact: "Contactpersoon",
    email: "E-mail",
    phone: "Telefoon",
    childName: "Naam & leeftijd van de jarige",
    notes: "Opmerkingen",
    total: "Richtprijs",
    estimate: "Onder voorbehoud van beschikbaarheid — we bevestigen per e-mail.",
    back: "Terug",
    next: "Volgende",
    send: "Aanvraag versturen",
    sent: "Aanvraag verstuurd",
    sentBody:
      "We nemen zo snel mogelijk contact op om je feest te bevestigen. Ondertussen kan je de uitnodigingskaarten al downloaden.",
    failed: "Versturen lukte niet. Mail ons gerust op familie@maximilien.brussels.",
    chooseDate: "Kies een datum in de kalender.",
    weekdayHint: (day) => `Feestjes gaan door op ${day}.`,
    weekdays: { 3: "woensdag", 6: "zaterdag" },
    invitationTitle: "Download gratis de officiële boerderij-uitnodigingskaart (PDF)",
    invitationBody:
      "Print de kant-en-klare uitnodigingen af en deel ze uit aan de klasgenootjes — vul enkel nog datum, uur en telefoonnummer in.",
    invitationCta: "Uitnodigingskaart downloaden",
  },
  fr: {
    eyebrow: "Anniversaires & fêtes d'enfants",
    title: "Fêtez votre anniversaire à la ferme",
    lede: "Trois formules avec visite guidée, cuisine équipée et cour privative. Choisissez votre formule, votre date et envoyez votre demande.",
    book: "Voir & réserver",
    included: "Compris dans le prix",
    programme: "Déroulé de la journée",
    houseRules: "Règlement",
    houseRulesLede: "À lire attentivement : cela évite les surprises le jour même.",
    deposit: `+ caution de € ${BIRTHDAY_DEPOSIT} en cash à l'arrivée (restituée)`,
    extraChild: `Dès le 16e enfant : + € ${EXTRA_CHILD_PRICE} par enfant (max. ${MAX_CHILDREN})`,
    step: (n) => `Étape ${n} sur 3`,
    stepPackage: "Formule & date",
    stepGroup: "Nombre de participants",
    stepDetails: "Vos coordonnées",
    date: "Date",
    slot: "Heure de début",
    children: "Nombre d'enfants",
    adults: "Nombre d'adultes",
    guests: "Nombre de participants",
    contact: "Personne de contact",
    email: "E-mail",
    phone: "Téléphone",
    childName: "Prénom & âge de l'enfant fêté·e",
    notes: "Remarques",
    total: "Prix indicatif",
    estimate: "Sous réserve de disponibilité — nous confirmons par e-mail.",
    back: "Retour",
    next: "Suivant",
    send: "Envoyer la demande",
    sent: "Demande envoyée",
    sentBody:
      "Nous vous recontactons au plus vite pour confirmer la fête. En attendant, téléchargez déjà les cartons d'invitation.",
    failed: "L'envoi a échoué. N'hésitez pas à nous écrire à familie@maximilien.brussels.",
    chooseDate: "Choisissez une date dans le calendrier.",
    weekdayHint: (day) => `Les fêtes ont lieu le ${day}.`,
    weekdays: { 3: "mercredi", 6: "samedi" },
    invitationTitle: "Téléchargez gratuitement le carton d'invitation de la ferme (PDF)",
    invitationBody:
      "Imprimez les invitations prêtes à l'emploi et distribuez-les aux camarades de classe — il ne reste que la date, l'heure et le téléphone à compléter.",
    invitationCta: "Télécharger le carton d'invitation",
  },
  en: {
    eyebrow: "Children's parties & birthdays",
    title: "Celebrate your birthday at the farm",
    lede: "Three packages with a guided tour, kitchen and private courtyard. Pick a package and a date, then send your request.",
    book: "View & book",
    included: "Included in the price",
    programme: "How the day runs",
    houseRules: "House rules",
    houseRulesLede: "Worth reading carefully — it avoids surprises on the day.",
    deposit: `+ € ${BIRTHDAY_DEPOSIT} cash deposit on arrival (refunded)`,
    extraChild: `From the 16th child: + € ${EXTRA_CHILD_PRICE} per child (max. ${MAX_CHILDREN})`,
    step: (n) => `Step ${n} of 3`,
    stepPackage: "Package & date",
    stepGroup: "Number of participants",
    stepDetails: "Your details",
    date: "Date",
    slot: "Start time",
    children: "Number of children",
    adults: "Number of adults",
    guests: "Number of participants",
    contact: "Contact person",
    email: "E-mail",
    phone: "Phone",
    childName: "Name & age of the birthday child",
    notes: "Notes",
    total: "Indicative price",
    estimate: "Subject to availability — we confirm by e-mail.",
    back: "Back",
    next: "Next",
    send: "Send request",
    sent: "Request sent",
    sentBody:
      "We will get back to you shortly to confirm the party. Meanwhile you can already download the invitation cards.",
    failed: "Sending failed. Feel free to e-mail us at familie@maximilien.brussels.",
    chooseDate: "Pick a date in the calendar.",
    weekdayHint: (day) => `Parties take place on ${day}.`,
    weekdays: { 3: "Wednesday", 6: "Saturday" },
    invitationTitle: "Download the farm's official invitation card for free (PDF)",
    invitationBody:
      "Print the ready-made invitations and hand them out to classmates — just fill in the date, time and phone number.",
    invitationCta: "Download the invitation card",
  },
};

const fieldClass =
  "mt-2 h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-[color:var(--color-terracotta)]";

/** Verjaardagsformules, huisregels en aanvraagflow voor gezinnen. */
export function BirthdayPackages() {
  const { price } = usePricing();
  const { lang } = useT();
  const c = COPY[lang];
  const [active, setActive] = useState<BirthdayPackage | null>(null);

  return (
    <section id="verjaardagen" className="mt-16 md:mt-24">
      <p className="text-[11px] uppercase tracking-[0.25em] text-[color:var(--color-terracotta)] font-medium">
        {c.eyebrow}
      </p>
      <h2 className="font-serif mt-3 text-3xl text-[color:var(--ink-forest)] md:text-4xl">
        {c.title}
      </h2>
      <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-foreground/90">{c.lede}</p>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {BIRTHDAY_PACKAGES.map((p) => {
          const copy = p.copy[lang];
          return (
            <article
              key={p.slug}
              className="flex flex-col rounded-3xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                {copy.day}
              </p>
              <h3 className="font-serif mt-2 text-xl leading-snug text-[color:var(--ink-forest)]">
                {copy.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-foreground/90">{copy.lede}</p>
              <p className="mt-3 inline-flex items-center gap-1.5 text-[12px] text-muted-foreground">
                <Users className="h-3.5 w-3.5" aria-hidden /> {copy.capacity}
              </p>
              <ul className="mt-4 flex-1 space-y-1.5 text-sm text-foreground/90">
                {copy.included.map((i) => (
                  <li key={i} className="flex gap-2">
                    <Check
                      className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--color-terracotta)]"
                      aria-hidden
                    />
                    {i}
                  </li>
                ))}
              </ul>
              <div className="mt-5 border-t border-border/60 pt-4">
                <p className="text-lg font-semibold text-[color:var(--ink-forest)]">€ {price(`birthday.${p.slug}`, p.price)}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{c.deposit}</p>
                {p.allowsExtraChildren && (
                  <p className="text-[11px] text-muted-foreground">{c.extraChild}</p>
                )}
                <button
                  type="button"
                  onClick={() => setActive(p)}
                  className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-[color:var(--color-terracotta)] px-4 py-2.5 text-[12px] font-semibold uppercase tracking-widest text-white transition-colors hover:bg-[color:var(--surface-forest)]"
                >
                  {c.book}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <InvitationCard />

      <div className="mt-6 rounded-3xl bg-[color:var(--surface-page)]/70 p-6 md:p-8">
        <h3 className="text-[11px] uppercase tracking-[0.25em] text-[color:var(--color-terracotta)] font-medium">
          {c.houseRules}
        </h3>
        <p className="mt-2 text-sm text-foreground/90">{c.houseRulesLede}</p>
        <Accordion type="single" collapsible className="mt-4">
          {BIRTHDAY_HOUSE_RULES.map((r) => (
            <AccordionItem key={r.id} value={r.id}>
              <AccordionTrigger className="text-left text-sm font-semibold text-[color:var(--ink-forest)]">
                <span className="flex items-center gap-2.5">
                  <RuleIcon id={r.id} />
                  {r.copy[lang].title}
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-1.5 text-sm text-foreground/90">
                  {r.copy[lang].body.map((b) => (
                    <li key={b} className="flex gap-2">
                      <span
                        aria-hidden
                        className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--color-terracotta)]"
                      />
                      {b}
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <BirthdayDialog pkg={active} onClose={() => setActive(null)} />
    </section>
  );
}

function RuleIcon({ id }: { id: string }) {
  const cls = "h-4 w-4 shrink-0 text-[color:var(--color-terracotta)]";
  if (id === "eco") return <Leaf className={cls} aria-hidden />;
  if (id === "access") return <Users className={cls} aria-hidden />;
  if (id === "cancel") return <CalendarDays className={cls} aria-hidden />;
  return <Clock className={cls} aria-hidden />;
}

function InvitationCard() {
  const { lang } = useT();
  const c = COPY[lang];
  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-5 rounded-3xl border border-[color:var(--color-terracotta)]/40 bg-card p-6 md:p-8">
      <div className="max-w-xl">
        <h3 className="font-serif text-xl text-[color:var(--ink-forest)] md:text-2xl">
          {c.invitationTitle}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-foreground/90">{c.invitationBody}</p>
      </div>
      <a
        href={invitationAsset.url}
        download="uitnodiging-boerderijfeest.pdf"
        className="inline-flex items-center gap-2 rounded-full bg-[color:var(--ink-forest)] px-5 py-3 text-[12px] font-semibold uppercase tracking-widest text-[color:var(--surface-page)] transition-opacity hover:opacity-90"
      >
        <Download className="h-4 w-4" aria-hidden />
        {c.invitationCta}
      </a>
    </div>
  );
}

function BirthdayDialog({ pkg, onClose }: { pkg: BirthdayPackage | null; onClose: () => void }) {
  const { price } = usePricing();
  const { lang } = useT();
  const c = COPY[lang];
  const [step, setStep] = useState(1);
  const [date, setDate] = useState<Date | undefined>();
  const [slot, setSlot] = useState<string>("");
  const [children, setChildren] = useState("15");
  const [adults, setAdults] = useState("5");
  const [guests, setGuests] = useState("30");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [childName, setChildName] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [failed, setFailed] = useState(false);
  const [openedFor, setOpenedFor] = useState<string | null>(null);
  const send = useServerFn(sendContactMessage);
  const hp = useHoneypot();

  const copy = pkg?.copy[lang];

  if (pkg && openedFor !== pkg.slug) {
    setOpenedFor(pkg.slug);
    setStep(1);
    setSlot(pkg.slots[0]);
    setSent(false);
    setFailed(false);
    setDate(undefined);
  }

  const total = pkg ? birthdayTotal(pkg, Number(children) || 0) : 0;

  function close() {
    onClose();
    setTimeout(() => setOpenedFor(null), 200);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !pkg || !copy) return;
    setBusy(true);
    setFailed(false);
    const dateLabel = date ? date.toLocaleDateString(lang === "en" ? "en-GB" : lang) : "—";
    const bericht = [
      `${copy.title} — ${copy.day} (€ ${price(`birthday.${pkg.slug}`, pkg.price)})`,
      `${c.date}: ${dateLabel} — ${slot}`,
      pkg.allowsExtraChildren
        ? `${c.children}: ${children} · ${c.adults}: ${adults}`
        : `${c.guests}: ${guests}`,
      `${c.childName}: ${childName || "—"}`,
      `${c.total}: € ${total} (${c.deposit})`,
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
          onderwerp: `Verjaardagsaanvraag — ${copy.title}`,
          naam: name,
          email,
          bericht,
          pagina: "Kinderfeestjes & verjaardagen",
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
    <Dialog open={!!pkg} onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        {pkg && copy && (
          <>
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl text-[color:var(--ink-forest)]">
                {copy.title}
              </DialogTitle>
              <DialogDescription>
                {copy.day} · {copy.capacity} · € {price(`birthday.${pkg.slug}`, pkg.price)}
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
                <a
                  href={invitationAsset.url}
                  download="uitnodiging-boerderijfeest.pdf"
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-[color:var(--ink-forest)] px-5 py-3 text-[12px] font-semibold uppercase tracking-widest text-[color:var(--surface-page)] transition-opacity hover:opacity-90"
                >
                  <Download className="h-4 w-4" aria-hidden />
                  {c.invitationCta}
                </a>
              </div>
            ) : (
              <form onSubmit={submit} className="mt-2">
                <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                  {c.step(step)} ·{" "}
                  {step === 1 ? c.stepPackage : step === 2 ? c.stepGroup : c.stepDetails}
                </p>

                {step === 1 && (
                  <div className="mt-5 grid gap-6 sm:grid-cols-2">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                        {c.date}
                      </p>
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        disabled={[{ before: new Date() }, (d: Date) => d.getDay() !== pkg.weekday]}
                        className="mt-2 rounded-xl border border-border"
                      />
                      <p className="mt-2 text-xs text-muted-foreground">
                        {date ? c.weekdayHint(c.weekdays[pkg.weekday]) : c.chooseDate}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                        {c.slot}
                      </p>
                      <div className="mt-2 grid gap-2">
                        {pkg.slots.map((s) => (
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
                      <h4 className="mt-6 text-sm font-semibold text-[color:var(--ink-forest)]">
                        {c.programme}
                      </h4>
                      <dl className="mt-2 space-y-1.5 text-sm text-foreground/90">
                        {copy.schedule.map((s) => (
                          <div key={s.time} className="flex gap-3">
                            <dt className="w-20 shrink-0 text-muted-foreground">{s.time}</dt>
                            <dd>{s.what}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="mt-5 grid gap-5">
                    {pkg.allowsExtraChildren ? (
                      <div className="grid gap-5 sm:grid-cols-2">
                        <label className="block">
                          <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                            {c.children}
                          </span>
                          <input
                            type="number"
                            min={1}
                            max={MAX_CHILDREN}
                            value={children}
                            onChange={(e) => setChildren(e.target.value)}
                            className={fieldClass}
                          />
                          <span className="mt-1 block text-[11px] text-muted-foreground">
                            {c.extraChild}
                          </span>
                        </label>
                        <label className="block">
                          <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                            {c.adults}
                          </span>
                          <input
                            type="number"
                            min={1}
                            max={pkg.maxAdults ?? 5}
                            value={adults}
                            onChange={(e) => setAdults(e.target.value)}
                            className={fieldClass}
                          />
                        </label>
                      </div>
                    ) : (
                      <label className="block sm:max-w-xs">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                          {c.guests}
                        </span>
                        <input
                          type="number"
                          min={1}
                          max={pkg.maxGuests ?? 40}
                          value={guests}
                          onChange={(e) => setGuests(e.target.value)}
                          className={fieldClass}
                        />
                      </label>
                    )}
                    <div className="rounded-2xl bg-[color:var(--surface-page)]/70 p-5">
                      <h4 className="text-sm font-semibold text-[color:var(--ink-forest)]">
                        {c.included}
                      </h4>
                      <ul className="mt-2 space-y-1.5 text-sm text-foreground/90">
                        {copy.included.map((i) => (
                          <li key={i} className="flex gap-2">
                            <Check
                              className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--color-terracotta)]"
                              aria-hidden
                            />
                            {i}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-3 text-[12px] text-muted-foreground">{c.deposit}</p>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="mt-5 grid gap-5">
                    <div className="grid gap-5 sm:grid-cols-2">
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
                          {c.childName}
                        </span>
                        <input
                          value={childName}
                          onChange={(e) => setChildName(e.target.value)}
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
                        onClick={() => setStep(step + 1)}
                        disabled={step === 1 && !date}
                        className="rounded-full bg-[color:var(--color-terracotta)] px-6 py-2.5 text-[12px] font-semibold uppercase tracking-widest text-white transition-colors hover:bg-[color:var(--surface-forest)] disabled:opacity-50"
                      >
                        {c.next}
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={busy}
                        className="inline-flex items-center gap-2 rounded-full bg-[color:var(--color-terracotta)] px-6 py-2.5 text-[12px] font-semibold uppercase tracking-widest text-white transition-colors hover:bg-[color:var(--surface-forest)] disabled:opacity-60"
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
