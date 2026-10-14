import { PagePhotoBand } from "@/components/PagePhotoBand";
import { NavHeader } from "@/components/NavHeader";
import { MastodonShareButton } from "@/components/social/MastodonShareButton";
import { useT } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { Copy, Smartphone, Loader2 } from "lucide-react";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { sendDonationConfirmation } from "@/lib/email.functions";
import { LocalLink } from "@/components/LocalLink";
import { subPathFor } from "@/lib/routes-i18n";

const COPY: Record<
  Lang,
  {
    formTitle: string;
    formBody: string;
    thanks: (email: string) => string;
    structuredRef: string;
    amountPlaceholder: string;
    nameLabel: string;
    emailLabel: string;
    submit: string;
    failed: string;
    sponsorTitle: string;
    sponsorBody: string;
    sponsorCta: string;
  }
> = {
  nl: {
    formTitle: "Bevestig je gift",
    formBody:
      "Laat je gegevens achter en we sturen je meteen een bevestiging met het bedrag, onze rekeninggegevens en een gestructureerde mededeling voor je overschrijving.",
    thanks: (email) => `Bedankt! De bevestiging is onderweg naar ${email}.`,
    structuredRef: "Gestructureerde mededeling",
    amountPlaceholder: "Ander bedrag",
    nameLabel: "Naam",
    emailLabel: "E-mailadres",
    submit: "Stuur mij de bevestiging",
    failed: "Versturen lukte niet. Probeer later opnieuw.",
    sponsorTitle: "Word Peter of Meter",
    sponsorBody: "Adopteer symbolisch een dier van de boerderij en steun hun dagelijkse zorg.",
    sponsorCta: "Ontdek Peter/Meterschap",
  },
  fr: {
    formTitle: "Confirmez votre don",
    formBody:
      "Laissez vos coordonnées et nous vous envoyons aussitôt une confirmation avec le montant, nos coordonnées bancaires et une communication structurée pour votre virement.",
    thanks: (email) => `Merci ! La confirmation est en route vers ${email}.`,
    structuredRef: "Communication structurée",
    amountPlaceholder: "Autre montant",
    nameLabel: "Nom",
    emailLabel: "Adresse e-mail",
    submit: "Envoyez-moi la confirmation",
    failed: "L'envoi a échoué. Réessayez plus tard.",
    sponsorTitle: "Devenez marraine ou parrain",
    sponsorBody: "Adoptez symboliquement un animal de la ferme et soutenez ses soins quotidiens.",
    sponsorCta: "Découvrir le parrainage",
  },
  en: {
    formTitle: "Confirm your donation",
    formBody:
      "Leave your details and we'll immediately send you a confirmation with the amount, our account details and a structured reference for your transfer.",
    thanks: (email) => `Thank you! The confirmation is on its way to ${email}.`,
    structuredRef: "Structured reference",
    amountPlaceholder: "Other amount",
    nameLabel: "Name",
    emailLabel: "E-mail address",
    submit: "Send me the confirmation",
    failed: "Sending failed. Please try again later.",
    sponsorTitle: "Become a sponsor",
    sponsorBody: "Symbolically adopt a farm animal and support their daily care.",
    sponsorCta: "Discover sponsorship",
  },
};

const IBAN = "BE00 0000 0000 0000";
const BIC = "GEBABEBB";
const NAME = "ASBL Maximilien";
const WERO_EMAIL = "dons@maximilien.brussels";

export function SupportPage() {
  const { t, lang } = useT();
  const c0 = COPY[lang];
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (val: string, key: string) => {
    navigator.clipboard.writeText(val).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  const GOALS = [
    { title: t("support.goal.food"), body: t("support.goal.food.body"), amount: "€25" },
    { title: t("support.goal.workshop"), body: t("support.goal.workshop.body"), amount: "€80" },
    { title: t("support.goal.shelter"), body: t("support.goal.shelter.body"), amount: "€150" },
  ];

  return (
    <div className="min-h-screen bg-[color:var(--surface-page)] text-foreground">
      <NavHeader />
      <PagePhotoBand photo="schapen" />
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-12 md:px-8 md:pt-16">
        {/* Hero */}
        <header className="relative overflow-hidden rounded-[2rem] border border-[color:var(--color-sage)]/40 bg-[color:var(--color-sage)]/10 px-6 py-14 md:px-14 md:py-20">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[color:var(--color-terracotta)]/10 blur-2xl"
          />
          <div className="relative max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--color-terracotta)]">
              {t("support.title")}
            </p>
            <h1 className="font-serif mt-5 text-4xl leading-[1.02] tracking-tight text-[color:var(--ink-forest)] sm:text-5xl md:text-6xl">
              {t("support.lede")}
            </h1>
            <div className="mt-8 h-px w-24 bg-[color:var(--color-terracotta)]/50" />
          </div>
        </header>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {/* Wero */}
          <div className="min-w-0 rounded-3xl border border-[color:var(--color-sage)]/40 bg-card p-6 shadow-sm transition-shadow hover:shadow-md sm:p-8">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[color:var(--color-sage)]/25 text-[color:var(--ink-forest)]">
                <Smartphone className="h-5 w-5" />
              </span>
              <h2 className="font-serif text-2xl italic text-[color:var(--ink-forest)] md:text-3xl">
                {t("support.wero.title")}
              </h2>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-foreground/90">
              {t("support.wero.body")}
            </p>
            <div className="mt-6 rounded-2xl border border-border/70 bg-[color:var(--surface-page)] p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                {t("support.wero.emailLabel")}
              </p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <code className="min-w-0 break-all text-sm">{WERO_EMAIL}</code>
                <button
                  type="button"
                  onClick={() => copy(WERO_EMAIL, "wero")}
                  className="inline-flex shrink-0 min-h-[48px] sm:min-h-[36px] items-center gap-1 rounded-full border border-border px-3 text-xs hover:border-[color:var(--color-terracotta)]"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copied === "wero" ? "✓" : t("common.copy")}
                </button>
              </div>
            </div>
          </div>

          {/* Bank transfer */}
          <div className="min-w-0 rounded-3xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md sm:p-8">
            <h2 className="font-serif text-2xl italic text-[color:var(--ink-forest)] md:text-3xl">
              {t("support.transfer.title")}
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-foreground/90">
              {t("support.transfer.body")}
            </p>

            <dl className="mt-6 space-y-3 text-sm">
              <BankLine
                label={t("support.beneficiary")}
                value={NAME}
                onCopy={() => copy(NAME, "name")}
                copied={copied === "name"}
                copyLabel={t("common.copy")}
              />
              <BankLine
                label={t("support.iban")}
                value={IBAN}
                onCopy={() => copy(IBAN.replace(/\s/g, ""), "iban")}
                copied={copied === "iban"}
                copyLabel={t("common.copy")}
              />
              <BankLine
                label={t("support.bic")}
                value={BIC}
                onCopy={() => copy(BIC, "bic")}
                copied={copied === "bic"}
                copyLabel={t("common.copy")}
              />
            </dl>
          </div>
        </div>

        <DonationForm />

        <MastodonShareButton className="mt-8" text={t("support.title")} />

        {/* Sponsorship */}
        <section className="mt-14 rounded-3xl border border-[color:var(--color-sage)]/40 bg-[color:var(--color-sage)]/10 p-6 shadow-sm sm:p-8">
          <h2 className="font-serif text-2xl italic text-[color:var(--ink-forest)] md:text-3xl">
            {c0.sponsorTitle}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-foreground/90">{c0.sponsorBody}</p>
          <LocalLink
            to={subPathFor("support", lang, "sponsor")}
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-[color:var(--color-terracotta)] px-5 py-2.5 text-sm font-semibold text-[color:var(--color-terracotta)] hover:bg-[color:var(--color-terracotta)]/10"
          >
            💚 {c0.sponsorCta}
          </LocalLink>
        </section>

        {/* Concrete goals */}
        <section className="mt-20">
          <h2 className="font-serif text-3xl italic text-[color:var(--ink-forest)] md:text-4xl">
            {t("support.goals.title")}
          </h2>
          <div className="mt-3 h-px w-20 bg-[color:var(--color-terracotta)]/50" />
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {GOALS.map((g) => (
              <div
                key={g.title}
                className="flex flex-col rounded-3xl border border-border bg-card p-7 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[color:var(--color-terracotta)]/40 hover:shadow-md"
              >
                <span className="inline-flex w-fit rounded-full bg-[color:var(--color-terracotta)]/10 px-4 py-1.5 font-serif text-2xl italic text-[color:var(--color-terracotta)]">
                  {g.amount}
                </span>
                <h3 className="mt-4 text-lg font-semibold leading-snug text-[color:var(--ink-forest)]">
                  {g.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground/90">{g.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

const AMOUNTS = [2500, 8000, 15000];

function DonationForm() {
  const { lang } = useT();
  const c = COPY[lang];
  const [naam, setNaam] = useState("");
  const [email, setEmail] = useState("");
  const [bedrag, setBedrag] = useState(2500);
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState(false);
  const [ref, setRef] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const send = useServerFn(sendDonationConfirmation);

  const cents = custom.trim()
    ? Math.round(parseFloat(custom.replace(",", ".")) * 100) || 0
    : bedrag;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || cents < 100) return;
    setBusy(true);
    setFailed(false);
    try {
      const res = await send({
        data: { email: email.trim(), naam: naam.trim() || undefined, bedrag_cent: cents },
      });
      setRef(res.referentie);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  const fieldClass =
    "mt-2 h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-[color:var(--color-terracotta)]";
  const labelClass = "text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground";

  return (
    <section className="mt-16 rounded-3xl border border-border bg-card p-6 shadow-sm md:p-10">
      <h2 className="font-serif text-2xl italic text-[color:var(--ink-forest)] md:text-3xl">
        {c.formTitle}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-foreground/90">{c.formBody}</p>

      {ref ? (
        <div className="mt-6 rounded-2xl border border-[color:var(--color-sage)] bg-[color:var(--surface-page)] p-5">
          <p className="text-sm">{c.thanks(email)}</p>
          <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            {c.structuredRef}
          </p>
          <p className="mt-1 font-mono text-lg text-[color:var(--ink-forest)]">{ref}</p>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-6 grid gap-5">
          <div className="flex flex-wrap gap-2">
            {AMOUNTS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => {
                  setBedrag(a);
                  setCustom("");
                }}
                className={`min-h-[48px] rounded-full border px-5 text-sm font-semibold transition-colors ${
                  !custom.trim() && bedrag === a
                    ? "border-[color:var(--color-terracotta)] bg-[color:var(--color-terracotta)] text-white"
                    : "border-border hover:border-[color:var(--color-terracotta)]"
                }`}
              >
                €{a / 100}
              </button>
            ))}
            <input
              inputMode="decimal"
              placeholder={c.amountPlaceholder}
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              className="h-12 w-36 rounded-full border border-border bg-background px-4 text-sm outline-none focus:border-[color:var(--color-terracotta)]"
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block min-w-0">
              <span className={labelClass}>{c.nameLabel}</span>
              <input
                value={naam}
                maxLength={120}
                onChange={(e) => setNaam(e.target.value)}
                className={fieldClass}
              />
            </label>
            <label className="block min-w-0">
              <span className={labelClass}>{c.emailLabel}</span>
              <input
                type="email"
                required
                maxLength={255}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={fieldClass}
              />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="submit"
              disabled={busy || cents < 100}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-[color:var(--surface-forest)] px-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--color-cream)] transition-colors hover:bg-[color:var(--color-terracotta)] disabled:opacity-60"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {c.submit}
            </button>
            {failed && <span className="text-sm text-destructive">{c.failed}</span>}
          </div>
        </form>
      )}
    </section>
  );
}

function BankLine({
  label,
  value,
  onCopy,
  copied,
  copyLabel,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  copied: boolean;
  copyLabel: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-3">
      <div className="min-w-0">
        <dt className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
          {label}
        </dt>
        <dd className="mt-1 break-all font-medium">{value}</dd>
      </div>
      <button
        type="button"
        onClick={onCopy}
        className="inline-flex shrink-0 min-h-[48px] sm:min-h-[36px] items-center gap-1 rounded-full border border-border px-3 text-xs hover:border-[color:var(--color-terracotta)]"
      >
        <Copy className="h-3.5 w-3.5" />
        {copied ? "✓" : copyLabel}
      </button>
    </div>
  );
}
