import { deepTx } from "@/lib/i18n-extra";
import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useT } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { sendContactMessage } from "@/lib/email.functions";
import { useHoneypot } from "@/components/HoneypotField";

const COPY: Record<Lang, { failed: string }> = {
  nl: { failed: "Versturen lukte niet. Mail ons gerust op contact@maximilien.brussels." },
  fr: { failed: "L'envoi a échoué. N'hésitez pas à nous écrire à contact@maximilien.brussels." },
  en: { failed: "Sending failed. Feel free to e-mail us at contact@maximilien.brussels." },
};
/**
 * Reusable contact form placed on every content page. Each instance carries its
 * own page context so the farm sees which page a question came from.
 */
export function PageContactForm({
  context,
  inbox,
  title,
  intro,
}: {
  /** Short page identifier used in the e-mail subject, e.g. "Schoolbezoek". */
  context: string;
  /** Sleutel van de juiste inbox, bv. "stages" → stage@maximilien.brussels. */
  inbox?: string;
  /** Page-specific heading — required so every form is written for the page it's on. */
  title: string;
  intro?: string;
}) {
  const { t, lang, tx } = useT();
  const c = deepTx(tx, COPY[lang]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
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
          inbox,
          onderwerp: context,
          naam: name,
          email,
          bericht: msg,
          pagina: context,
          lang,
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
    <section className="mt-16 rounded-3xl border border-border bg-card p-6 shadow-sm md:mt-20 md:p-10">
      <h2 className="font-serif text-2xl text-[color:var(--ink-forest)]">{tx(title)}</h2>
      {intro && <p className="mt-2 text-sm text-foreground/90">{tx(intro)}</p>}
      <form onSubmit={submit} className="mt-6 grid gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
              {t("contact.form.name")}
            </span>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-[color:var(--color-terracotta)]"
            />
          </label>
          <label className="block min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
              {t("contact.form.email")}
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-[color:var(--color-terracotta)]"
            />
          </label>
        </div>
        <label className="block">
          <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            {t("contact.form.message")}
          </span>
          <textarea
            required
            rows={5}
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
            {t("contact.form.send")}
          </button>
          {sent && (
            <span className="text-sm text-[color:var(--color-sage)]">{t("contact.form.sent")}</span>
          )}
          {failed && <span className="text-sm text-destructive">{c.failed}</span>}
        </div>
      {hp.field}
      </form>
    </section>
  );
}
