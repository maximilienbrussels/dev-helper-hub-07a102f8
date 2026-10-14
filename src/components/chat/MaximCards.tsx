import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Clock,
  Leaf,
  MapPin,
  Phone,
  Mail,
  ArrowRight,
  Check,
  X,
  AlertTriangle,
} from "lucide-react";
import type { Lang } from "@/lib/i18n";
import {
  COMPOST_COPY,
  HANDOFF_COPY,
  HOURS_COPY,
  LINK_TOPICS,
  checkCompost,
  type CompostVerdict,
  type MaximCard,
} from "@/lib/maxim-context";
import { sendContactMessage } from "@/lib/email.functions";
import { useHoneypot } from "@/components/HoneypotField";

const shell =
  "mt-2 rounded-2xl border border-border bg-card p-3 text-foreground shadow-sm dark:border-border dark:bg-muted dark:text-foreground";

/** Openingsuren, adres en directe contactknoppen. */
function HoursCard({ lang }: { lang: Lang }) {
  const c = HOURS_COPY[lang];
  return (
    <div className={shell}>
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
        <Clock className="h-3.5 w-3.5 text-[color:var(--color-terracotta)]" /> {c.title}
      </p>
      <ul className="mt-2 space-y-1 text-xs">
        <li>{c.summer}</li>
        <li>{c.winter}</li>
        <li className="font-semibold text-[color:var(--color-terracotta)]">{c.access}</li>
        <li className="flex items-center gap-1.5 text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" /> {c.address}
        </li>
      </ul>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        <a
          href="tel:+3223315391"
          className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--color-terracotta)] px-3 py-1.5 text-xs font-semibold text-white"
        >
          <Phone className="h-3.5 w-3.5" /> {c.call}
        </a>
        <a
          href="mailto:info@lafermeduparcmaximilien.be"
          className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-foreground dark:bg-muted dark:text-foreground"
        >
          <Mail className="h-3.5 w-3.5" /> {c.mail}
        </a>
      </div>
    </div>
  );
}

/** Contextuele doorverwijskaart met SPA-link. */
function LinkCard({ lang, topic }: { lang: Lang; topic: keyof typeof LINK_TOPICS }) {
  const t = LINK_TOPICS[topic];
  return (
    <div className={shell}>
      <p className="text-xs font-bold">{t.label[lang]}</p>
      <p className="mt-1 text-xs text-muted-foreground">{t.desc[lang]}</p>
      <Link
        to={t.href as never}
        className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[color:var(--color-terracotta)] px-3 py-1.5 text-xs font-semibold text-white"
      >
        {t.label[lang]} <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

const VERDICT_STYLE: Record<CompostVerdict, string> = {
  yes: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100",
  no: "bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-100",
  careful: "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100",
  unknown: "bg-muted text-foreground dark:bg-muted dark:text-foreground",
};

/** Interactieve checker: mag dit in de buurtcompost? */
function CompostChecker({ lang }: { lang: Lang }) {
  const c = COMPOST_COPY[lang];
  const [value, setValue] = useState("");
  const [result, setResult] = useState<{ verdict: CompostVerdict; key: string } | null>(null);

  return (
    <div className={shell}>
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
        <Leaf className="h-3.5 w-3.5 text-emerald-600" /> {c.title}
      </p>
      <form
        className="mt-2 flex gap-1.5"
        onSubmit={(e) => {
          e.preventDefault();
          setResult(checkCompost(value));
        }}
      >
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={c.placeholder}
          className="min-h-[36px] flex-1 min-w-0 rounded-full bg-muted px-3 text-xs text-foreground outline-none placeholder:text-foreground focus:ring-2 focus:ring-emerald-400 dark:bg-muted dark:text-foreground"
        />
        <button
          type="submit"
          className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
        >
          {c.button}
        </button>
      </form>
      {result && (
        <div className={`mt-2 rounded-xl px-3 py-2 text-xs ${VERDICT_STYLE[result.verdict]}`}>
          <p className="flex items-center gap-1.5 font-semibold">
            {result.verdict === "yes" ? (
              <Check className="h-3.5 w-3.5" />
            ) : result.verdict === "no" ? (
              <X className="h-3.5 w-3.5" />
            ) : (
              <AlertTriangle className="h-3.5 w-3.5" />
            )}
            {c[result.verdict]}
          </p>
          {c.reasons[result.key] ? <p className="mt-1">{c.reasons[result.key]}</p> : null}
        </div>
      )}
      <Link
        to={"/buurt/compost" as never}
        className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-300"
      >
        {c.link} <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

/** Doorgeefformulier: de vraag gaat rechtstreeks naar het team. */
function HandoffForm({ lang, context }: { lang: Lang; context: string }) {
  const c = HANDOFF_COPY[lang];
  const [naam, setNaam] = useState("");
  const [email, setEmail] = useState("");
  const [telefoon, setTelefoon] = useState("");
  const [bericht, setBericht] = useState(context.slice(0, 800));
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  const hp = useHoneypot();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "sending") return;
    setState("sending");
    try {
      await sendContactMessage({
        data: {
          website_hp: hp.value,
          onderwerp: "Chatvraag via Max",
          naam,
          email,
          telefoon: telefoon || undefined,
          bericht: bericht.length >= 5 ? bericht : "Vraag via de chat-assistent.",
          pagina: typeof window !== "undefined" ? window.location.pathname : undefined,
          lang,
        },
      });
      setState("done");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className={shell}>
        <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
          <Check className="h-3.5 w-3.5" /> {c.done}
        </p>
      </div>
    );
  }

  const field =
    "min-h-[36px] w-full rounded-lg bg-muted px-3 py-1.5 text-xs text-foreground outline-none placeholder:text-foreground focus:ring-2 focus:ring-[color:var(--color-apricot)] dark:bg-muted dark:text-foreground";

  return (
    <div className={shell}>
      <p className="text-xs font-bold uppercase tracking-wider">{c.title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{c.intro}</p>
      <form className="mt-2 space-y-1.5" onSubmit={submit}>
        <input
          required
          maxLength={120}
          value={naam}
          onChange={(e) => setNaam(e.target.value)}
          placeholder={c.name}
          className={field}
        />
        <input
          required
          type="email"
          maxLength={255}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={c.email}
          className={field}
        />
        <input
          type="tel"
          maxLength={40}
          value={telefoon}
          onChange={(e) => setTelefoon(e.target.value)}
          placeholder={c.phone}
          className={field}
        />
        <textarea
          required
          rows={3}
          maxLength={2000}
          value={bericht}
          onChange={(e) => setBericht(e.target.value)}
          placeholder={c.message}
          className={field}
        />
        <button
          type="submit"
          disabled={state === "sending"}
          className="w-full rounded-full bg-[color:var(--color-terracotta)] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
        >
          {state === "sending" ? c.sending : c.submit}
        </button>
      {hp.field}
      </form>
      {state === "error" && <p className="mt-1.5 text-xs text-destructive">{c.failed}</p>}
      <a
        href="tel:+3223315391"
        className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[color:var(--color-terracotta)] underline-offset-2 hover:underline"
      >
        <Phone className="h-3.5 w-3.5" /> {c.call} +32 2 331 53 91
      </a>
    </div>
  );
}

/** Rendert de kaart die bij het laatste antwoord van Max hoort. */
export function MaximInlineCard({
  card,
  lang,
  context,
}: {
  card: MaximCard;
  lang: Lang;
  context: string;
}) {
  if (card.kind === "hours") return <HoursCard lang={lang} />;
  if (card.kind === "compost") return <CompostChecker lang={lang} />;
  if (card.kind === "handoff") return <HandoffForm lang={lang} context={context} />;
  return <LinkCard lang={lang} topic={card.topic} />;
}
