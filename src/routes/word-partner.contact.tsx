import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { NavHeader } from "@/components/NavHeader";
import { sendContactMessage } from "@/lib/email.functions";
import { useHoneypot } from "@/components/HoneypotField";
import { useT, type Lang } from "@/lib/i18n";

export const Route = createFileRoute("/word-partner/contact")({
  head: () => ({
    meta: [
      { title: "Partnerschap aanvragen — Maximilien" },
      {
        name: "description",
        content:
          "Vul het intakeformulier in en we nemen contact op met een partnervoorstel op maat.",
      },
      { property: "og:title", content: "Partnerschap aanvragen — Maximilien" },
      {
        property: "og:description",
        content: "Intakeformulier voor bedrijven en organisaties die partner willen worden.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/word-partner/contact" }],
  }),
  component: PartnerIntakePage,
});

const COPY: Record<
  Lang,
  {
    eyebrow: string;
    title: string;
    intro: string;
    types: string[];
    orgLabel: string;
    personLabel: string;
    emailLabel: string;
    typeLabel: string;
    messageLabel: string;
    submit: string;
    sent: string;
    failed: string;
  }
> = {
  nl: {
    eyebrow: "Intakeformulier",
    title: "Partnerschap aanvragen",
    intro:
      "Vertel ons kort over je organisatie en waar je aan denkt — we nemen snel contact op met een voorstel op maat.",
    types: [
      "Sponsoring",
      "MVO / maatschappelijke impact",
      "Teambuilding",
      "Structurele samenwerking",
      "Anders",
    ],
    orgLabel: "Organisatienaam",
    personLabel: "Contactpersoon",
    emailLabel: "E-mailadres",
    typeLabel: "Type samenwerking",
    messageLabel: "Bericht",
    submit: "Aanvraag versturen",
    sent: "Bedankt — je aanvraag is verstuurd. Je ontvangt meteen een bevestiging per mail.",
    failed: "Versturen lukte niet. Mail ons gerust op partners@maximilien.brussels.",
  },
  fr: {
    eyebrow: "Formulaire de contact",
    title: "Demander un partenariat",
    intro:
      "Parlez-nous brièvement de votre organisation et de ce à quoi vous pensez — nous vous recontactons rapidement avec une proposition sur mesure.",
    types: [
      "Sponsoring",
      "RSE / impact sociétal",
      "Teambuilding",
      "Collaboration structurelle",
      "Autre",
    ],
    orgLabel: "Nom de l'organisation",
    personLabel: "Personne de contact",
    emailLabel: "Adresse e-mail",
    typeLabel: "Type de collaboration",
    messageLabel: "Message",
    submit: "Envoyer la demande",
    sent: "Merci — votre demande a été envoyée. Vous recevrez immédiatement une confirmation par e-mail.",
    failed: "L'envoi a échoué. N'hésitez pas à nous écrire à partners@maximilien.brussels.",
  },
  en: {
    eyebrow: "Intake form",
    title: "Request a partnership",
    intro:
      "Tell us briefly about your organisation and what you have in mind — we'll get back to you quickly with a tailor-made proposal.",
    types: [
      "Sponsorship",
      "CSR / social impact",
      "Team building",
      "Structural partnership",
      "Other",
    ],
    orgLabel: "Organisation name",
    personLabel: "Contact person",
    emailLabel: "Email address",
    typeLabel: "Type of partnership",
    messageLabel: "Message",
    submit: "Send request",
    sent: "Thanks — your request has been sent. You'll receive a confirmation email right away.",
    failed: "Sending failed. Feel free to email us at partners@maximilien.brussels.",
  },
};

const fieldClass =
  "mt-2 h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-[color:var(--color-terracotta)]";
const labelClass = "text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground";

function PartnerIntakePage() {
  const { lang } = useT();
  const c = COPY[lang];
  const [org, setOrg] = useState("");
  const [person, setPerson] = useState("");
  const [email, setEmail] = useState("");
  const [type, setType] = useState(c.types[0]);
  const [msg, setMsg] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const send = useServerFn(sendContactMessage);
  const hp = useHoneypot();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setFailed(false);
    try {
      await send({
        data: {
          website_hp: hp.value,
          inbox: "partner",
          onderwerp: `Partneraanvraag — ${type}`,
          naam: person,
          organisatie: org,
          email,
          bericht: msg,
          pagina: "/word-partner/contact",
        },
      });
      setSent(true);
      setMsg("");
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[color:var(--surface-page)] text-foreground">
      <NavHeader />
      <main className="mx-auto max-w-2xl px-4 py-16 md:px-8 md:py-24">
        <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-[color:var(--color-terracotta)]">
          {c.eyebrow}
        </p>
        <h1 className="font-serif mt-4 text-4xl leading-tight tracking-tight text-[color:var(--ink-forest)] md:text-5xl">
          {c.title}
        </h1>
        <p className="mt-5 text-base leading-relaxed text-foreground/90">{c.intro}</p>

        <form
          onSubmit={submit}
          className="mt-10 grid gap-5 rounded-3xl border border-border bg-card p-6 shadow-sm md:p-10"
        >
          <label className="block">
            <span className={labelClass}>{c.orgLabel}</span>
            <input
              required
              maxLength={120}
              value={org}
              onChange={(e) => setOrg(e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>{c.personLabel}</span>
            <input
              required
              maxLength={100}
              value={person}
              onChange={(e) => setPerson(e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="block">
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
          <label className="block">
            <span className={labelClass}>{c.typeLabel}</span>
            <select value={type} onChange={(e) => setType(e.target.value)} className={fieldClass}>
              {c.types.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={labelClass}>{c.messageLabel}</span>
            <textarea
              required
              rows={5}
              maxLength={2000}
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-border bg-background p-4 text-sm outline-none focus:border-[color:var(--color-terracotta)]"
            />
          </label>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-[color:var(--surface-forest)] px-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--color-cream)] transition-colors hover:bg-[color:var(--color-terracotta)] disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {c.submit}
            </button>
            {sent && <span className="text-sm text-[color:var(--color-sage)]">{c.sent}</span>}
            {failed && <span className="text-sm text-destructive">{c.failed}</span>}
          </div>
        {hp.field}
      </form>
      </main>
    </div>
  );
}
