import { useEffect, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { NavHeader } from "@/components/NavHeader";
import { useT } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { ResidentPhoto } from "@/components/ResidentPhoto";
import { useAlbumPhotos } from "@/lib/use-album-photos";
import { speciesIn } from "@/lib/routes-i18n";
import { handleImageError } from "@/lib/image-fallback";
import { animalsQO } from "@/pages/animals";

type Tier = { id: string; label: Record<Lang, string> };

const TIERS: Tier[] = [
  { id: "basis", label: { nl: "€5 / maand", fr: "5 € / mois", en: "€5 / month" } },
  { id: "vriend", label: { nl: "€10 / maand", fr: "10 € / mois", en: "€10 / month" } },
  { id: "beschermer", label: { nl: "€50 / jaar", fr: "50 € / an", en: "€50 / year" } },
];

const COPY: Record<
  Lang,
  {
    title: string;
    lede: string;
    step1: string;
    step2: string;
    step3: string;
    nameLabel: string;
    emailLabel: string;
    cta: string;
    unavailable: string;
    processing: string;
    thanksTitle: string;
    thanksBody: (animal: string) => string;
    download: string;
    error: string;
    back: string;
  }
> = {
  nl: {
    title: "Word Peter of Meter",
    lede: "Adopteer symbolisch een dier van de boerderij en steun zo hun dagelijkse zorg, voeding en welzijn.",
    step1: "1. Kies een dier",
    step2: "2. Kies een formule",
    step3: "3. Jouw gegevens",
    nameLabel: "Naam",
    emailLabel: "E-mailadres",
    cta: "💚 Word Peter of Meter",
    unavailable: "Betalingen zijn tijdelijk niet beschikbaar. Probeer later opnieuw.",
    processing: "Je betaling wordt verwerkt…",
    thanksTitle: "Bedankt voor je steun! 💚",
    thanksBody: (animal) => `Je bent nu officieel Peter/Meter van ${animal}.`,
    download: "Download certificaat",
    error: "Er ging iets mis. Probeer later opnieuw.",
    back: "Kies opnieuw",
  },
  fr: {
    title: "Devenez marraine ou parrain",
    lede: "Adoptez symboliquement un animal de la ferme et soutenez ses soins, sa nourriture et son bien-être au quotidien.",
    step1: "1. Choisissez un animal",
    step2: "2. Choisissez une formule",
    step3: "3. Vos coordonnées",
    nameLabel: "Nom",
    emailLabel: "Adresse e-mail",
    cta: "💚 Devenir marraine/parrain",
    unavailable: "Les paiements sont temporairement indisponibles. Réessayez plus tard.",
    processing: "Votre paiement est en cours de traitement…",
    thanksTitle: "Merci pour votre soutien ! 💚",
    thanksBody: (animal) => `Vous êtes désormais officiellement marraine/parrain de ${animal}.`,
    download: "Télécharger le certificat",
    error: "Une erreur est survenue. Réessayez plus tard.",
    back: "Recommencer",
  },
  en: {
    title: "Become a sponsor",
    lede: "Symbolically adopt a farm animal and support their daily care, food and wellbeing.",
    step1: "1. Pick an animal",
    step2: "2. Pick a tier",
    step3: "3. Your details",
    nameLabel: "Name",
    emailLabel: "Email address",
    cta: "💚 Become a sponsor",
    unavailable: "Payments are temporarily unavailable. Please try again later.",
    processing: "Your payment is being processed…",
    thanksTitle: "Thank you for your support! 💚",
    thanksBody: (animal) => `You are now officially sponsoring ${animal}.`,
    download: "Download certificate",
    error: "Something went wrong. Please try again later.",
    back: "Start over",
  },
};

type Animal = { id: number; name: string; species: string; image_url: string | null };

type StatusResponse = {
  status: string;
  animalName?: string;
  tier?: string;
  certificateId?: string | null;
};

export function SponsorPage() {
  const { lang } = useT();

  const c = COPY[lang];
  const { data: animals } = useSuspenseQuery(animalsQO);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [cameFromCheckout, setCameFromCheckout] = useState(false);
  const [statusData, setStatusData] = useState<StatusResponse | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("status") === "success" && params.get("session_id")) {
      setCameFromCheckout(true);
      setSessionId(params.get("session_id"));
    }
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    let stopped = false;
    async function poll() {
      try {
        const res = await fetch(`/api/sponsorship/status?session_id=${encodeURIComponent(sessionId ?? "")}`);
        const data = (await res.json()) as StatusResponse;
        if (stopped) return;
        setStatusData(data);
        if (data.status !== "paid") {
          setTimeout(poll, 2500);
        }
      } catch {
        if (!stopped) setTimeout(poll, 4000);
      }
    }
    poll();
    return () => {
      stopped = true;
    };
  }, [sessionId]);

  if (cameFromCheckout) {
    return (
      <div className="min-h-screen bg-background">
        <NavHeader />
        <main className="mx-auto w-full max-w-2xl px-5 py-16 text-center">
          {statusData?.status === "paid" ? (
            <>
              <h1 className="font-serif text-3xl text-foreground">{c.thanksTitle}</h1>
              <p className="mt-4 text-muted-foreground">
                {c.thanksBody(statusData.animalName ?? "")}
              </p>
              {statusData.certificateId ? (
                <a
                  href={`/api/sponsorship/certificate/${statusData.certificateId}`}
                  className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
                >
                  {c.download}
                </a>
              ) : null}
            </>
          ) : (
            <p className="mt-4 text-muted-foreground">{c.processing}</p>
          )}
        </main>
      </div>
    );
  }

  return <SponsorForm animals={(animals ?? []) as Animal[]} lang={lang} c={c} />;
}

function SponsorForm({
  animals,
  lang,
  c,
}: {
  animals: Animal[];
  lang: Lang;
  c: (typeof COPY)[Lang];
}) {
  const albumPhotos = useAlbumPhotos();
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [tier, setTier] = useState<Tier | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [error, setError] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!animal || !tier || busy) return;
    setBusy(true);
    setError(false);
    setUnavailable(false);
    try {
      const res = await fetch("/api/sponsorship/create-session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          animalId: animal.id,
          animalName: animal.name,
          tierId: tier.id,
          sponsorName: name.trim(),
          sponsorEmail: email.trim(),
          lang,
        }),
      });
      if (res.status === 503) {
        setUnavailable(true);
        return;
      }
      const data = (await res.json()) as { url?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <NavHeader />
      <main className="mx-auto w-full max-w-4xl px-5 py-12">
        <h1 className="font-serif text-4xl text-foreground">{c.title}</h1>
        <p className="mt-3 text-muted-foreground">{c.lede}</p>

        <form onSubmit={submit} className="mt-10 space-y-10">
          <section>
            <h2 className="font-serif text-xl text-foreground">{c.step1}</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {animals.map((a) => (
                <button
                  type="button"
                  key={a.id}
                  onClick={() => setAnimal(a)}
                  className={`overflow-hidden rounded-2xl border bg-card text-left transition-shadow hover:shadow-md ${
                    animal?.id === a.id
                      ? "border-primary ring-2 ring-primary"
                      : "border-border"
                  }`}
                >
                  <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
                    <ResidentPhoto
                      animal={a}
                      albums={albumPhotos}
                      speciesLabel={speciesIn(a.species, lang)}
                    />
                  </div>
                  <div className="p-3">
                    <p className="font-serif text-lg text-foreground">
                      {a.name} de {speciesIn(a.species, lang)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground">{c.step2}</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {TIERS.map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setTier(t)}
                  className={`rounded-full border px-5 py-2.5 text-sm font-semibold ${
                    tier?.id === t.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-foreground"
                  }`}
                >
                  {t.label[lang]}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground">{c.step3}</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-sm">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {c.nameLabel}
                </span>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none"
                />
              </label>
              <label className="text-sm">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {c.emailLabel}
                </span>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none"
                />
              </label>
            </div>
          </section>

          {unavailable ? (
            <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
              {c.unavailable}
            </p>
          ) : null}
          {error ? <p className="text-sm text-destructive">{c.error}</p> : null}

          <button
            type="submit"
            disabled={!animal || !tier || !name.trim() || !email.trim() || busy}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {c.cta}
          </button>
        </form>
      </main>
    </div>
  );
}
