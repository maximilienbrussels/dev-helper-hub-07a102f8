/**
 * "Mail me dit overzicht": stuurt het chatantwoord (planning, tarieven,
 * afhaalcode …) via Brevo naar het adres dat de bezoeker zelf ingeeft.
 */
import { useState } from "react";
import { authFetch } from "@/lib/auth-fetch";
import { Mail } from "lucide-react";

import type { Lang } from "@/lib/i18n";

const COPY: Record<Lang, { open: string; placeholder: string; send: string; sending: string; ok: string; fail: string }> = {
  nl: {
    open: "✉️ Mail me dit overzicht",
    placeholder: "Wordt naar je account-e-mailadres gestuurd. Log in om te mailen.",
    send: "Versturen",
    sending: "Versturen…",
    ok: "Verstuurd! Kijk zeker ook even in je spam.",
    fail: "Versturen lukte niet. Ben je ingelogd?",
  },
  fr: {
    open: "✉️ Envoyez-moi ce récapitulatif",
    placeholder: "votre@email.be",
    send: "Envoyer",
    sending: "Envoi…",
    ok: "Envoyé ! Vérifiez aussi vos spams.",
    fail: "L'envoi a échoué. Êtes-vous connecté ?",
  },
  en: {
    open: "✉️ Email me this overview",
    placeholder: "your@email.com",
    send: "Send",
    sending: "Sending…",
    ok: "Sent! Do check your spam folder too.",
    fail: "Sending failed. Are you signed in?",
  },
};

export function EmailAnswerButton({ text, lang }: { text: string; lang: Lang }) {
  const t = COPY[lang] ?? COPY.nl;
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "ok" | "fail">("idle");

  async function send() {
    setState("sending");
    try {
      const res = await authFetch("/api/chat/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text, lang }),
      });
      setState(res.ok ? "ok" : "fail");
    } catch {
      setState("fail");
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 ml-2 inline-flex items-center gap-1.5 rounded-full bg-[color:var(--surface-page)] px-3 py-1.5 text-xs font-semibold text-[color:var(--color-terracotta)] ring-1 ring-border transition hover:brightness-95"
      >
        <Mail className="size-3.5" /> {t.open}
      </button>
    );
  }

  if (state === "ok") {
    return <p className="mt-2 text-xs text-emerald-300">{t.ok}</p>;
  }

  return (
    <form
      className="mt-2 flex flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        void send();
      }}
    >
      <button
        type="submit"
        disabled={state === "sending"}
        className="rounded-full bg-[color:var(--color-terracotta)] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
      >
        {state === "sending" ? t.sending : t.send}
      </button>
      {state === "fail" ? <p className="w-full text-xs text-amber-300">{t.fail}</p> : null}
    </form>
  );
}
