import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { lazy, Suspense, useState } from "react";
import { NavHeader } from "@/components/NavHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useT } from "@/lib/i18n";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Clock,
  Loader2,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BookingCalendar, type SelectedSlot } from "@/components/booking/BookingCalendar";
import { bookingMode, PRODUCT_FORMULA, type FormulaType } from "@/lib/availability";

const StripeEmbeddedCheckout = lazy(() => import("@/components/checkout/StripeEmbeddedCheckout"));

type ProductId =
  | "zaalverhuur_halve_dag"
  | "zaalverhuur_dag"
  | "feestje"
  | "teambuilding"
  | "peterschap_maand"
  | "stage_week";

type Product = {
  id: ProductId;
  label: string;
  price: string;
  group: string;
  hint: string;
};

const PRODUCTS: Product[] = [
  {
    id: "zaalverhuur_halve_dag",
    label: "Zaal — halve dag",
    price: "€150",
    group: "Zaalverhuur",
    hint: "4 uur · 09:30–13:30 of 13:30–17:30",
  },
  {
    id: "zaalverhuur_dag",
    label: "Zaal — volledige dag",
    price: "€250",
    group: "Zaalverhuur",
    hint: "09:00–17:00 · inclusief keuken",
  },
  {
    id: "feestje",
    label: "Kinderfeestje",
    price: "€180",
    group: "Zaalverhuur",
    hint: "max. 15 kinderen · woensdag & zaterdag",
  },
  {
    id: "teambuilding",
    label: "Teambuilding — halve dag",
    price: "€450",
    group: "Zaalverhuur",
    hint: "begeleide boerderijactiviteiten",
  },
  {
    id: "peterschap_maand",
    label: "Peterschap",
    price: "€60",
    group: "Peterschap",
    hint: "steun een dier een jaar lang",
  },
  {
    id: "stage_week",
    label: "Vakantiestage — één week",
    price: "€140",
    group: "Stages",
    hint: "maandag t.e.m. vrijdag · 09:00–16:00",
  },
];

type Intent = { clientSecret: string; reference: string; amountCent: number; label: string };

const STEPS = ["Formule", "Datum", "Gegevens"] as const;

function StepBar({ step, onBack }: { step: number; onBack: () => void }) {
  return (
    <div className="flex items-center gap-3">
      {step > 0 ? (
        <button
          type="button"
          onClick={onBack}
          className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition hover:bg-muted"
          aria-label="Vorige stap"
        >
          <ArrowLeft className="size-4" />
        </button>
      ) : null}
      <ol className="flex flex-1 items-center gap-2">
        {STEPS.map((label, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <li key={label} className="flex flex-1 items-center gap-2">
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition",
                  done
                    ? "bg-[color:var(--ink-forest)] text-background"
                    : active
                      ? "bg-[color:var(--color-terracotta)] text-background"
                      : "border border-border/70 text-muted-foreground",
                )}
              >
                {done ? <Check className="size-3.5" /> : i + 1}
              </span>
              <span
                className={cn(
                  "hidden text-xs font-medium sm:inline",
                  active ? "text-[color:var(--ink-forest)]" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
              {i < STEPS.length - 1 ? (
                <span
                  className={cn(
                    "h-px flex-1 rounded",
                    done ? "bg-[color:var(--ink-forest)]" : "bg-border",
                  )}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}



export const Route = createFileRoute("/boeking/")({
  head: () => ({
    meta: [
      { title: "Boeken en betalen — Stadsboerderij Maximilien" },
      {
        name: "description",
        content:
          "Reserveer online een zaal, teambuilding, kinderfeestje, vakantiestage of peterschap op de stadsboerderij en betaal veilig met Bancontact, iDEAL of kaart.",
      },
      { property: "og:title", content: "Boeken en betalen — Stadsboerderij Maximilien" },
      {
        property: "og:description",
        content: "Reserveer een zaal, stage of peterschap en betaal direct online.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BookingPage,
});

function BookingPage() {
  const { lang } = useT();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductId>("zaalverhuur_halve_dag");
  const [intent, setIntent] = useState<Intent | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slot, setSlot] = useState<SelectedSlot | null>(null);
  const [step, setStep] = useState(0);

  const mode = bookingMode(product);
  const formula = PRODUCT_FORMULA[product] as FormulaType | null;
  const chosen = PRODUCTS.find((p) => p.id === product)!;

  function changeProduct(id: ProductId) {
    setProduct(id);
    setSlot(null);
    setError(null);
  }

  function next() {
    if (step === 0) {
      // Peterschap slaat de datumstap over.
      setStep(bookingMode(product) === "none" ? 2 : 1);
      return;
    }
    if (step === 1 && !slot) {
      setError("Kies eerst een datum en een tijdslot.");
      return;
    }
    setError(null);
    setStep(2);
  }

  function back() {
    setError(null);
    setStep(step === 2 && mode === "none" ? 0 : Math.max(0, step - 1));
  }

  const dateLabel = slot
    ? new Date(`${slot.date}T12:00:00`).toLocaleDateString("nl-BE", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    : null;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (mode !== "none" && !slot) {
      setError("Kies eerst een datum en een tijdslot.");
      setStep(1);
      return;
    }
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    // Peterschap heeft geen datum: we boeken op vandaag.
    const datum = slot?.date ?? new Date().toISOString().slice(0, 10);
    try {
      const res = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          product,
          naam: String(fd.get("naam") ?? ""),
          email: String(fd.get("email") ?? ""),
          telefoon: String(fd.get("telefoon") ?? "") || undefined,
          datum,
          slotId: slot?.slotId,
          startTime: slot?.startTime,
          endTime: slot?.endTime,
          personen: Number(fd.get("personen") ?? 1),
          opmerking: String(fd.get("opmerking") ?? "") || undefined,
          lang,
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setIntent((await res.json()) as Intent);
    } catch {
      setError(
        "We konden de betaling niet starten. Probeer opnieuw of bel ons op +32 2 331 53 91.",
      );
    } finally {
      setBusy(false);
    }
  }

  const groups = [...new Set(PRODUCTS.map((p) => p.group))];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavHeader />
      <main className="mx-auto max-w-3xl px-4 py-14 md:px-8 md:py-20">
        <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-[color:var(--color-terracotta)]">
          Reserveren
        </p>
        <h1 className="font-serif mt-4 text-4xl leading-[1.02] tracking-tight text-[color:var(--ink-forest)] md:text-5xl">
          Boek je moment op de boerderij
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
          Drie korte stappen: kies je formule, prik een moment en betaal veilig online. Je
          bevestiging valt meteen in je mailbox.
        </p>

        {intent ? (
          <section className="mt-10 rounded-3xl border border-border/60 bg-card p-6 shadow-sm md:p-8">
            <h2 className="font-serif text-2xl text-[color:var(--ink-forest)]">
              Betaling — {intent.label}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Referentie <span className="font-mono font-semibold">{intent.reference}</span> ·{" "}
              {(intent.amountCent / 100).toFixed(2).replace(".", ",")} EUR
            </p>
            <div className="mt-6">
              <Suspense
                fallback={
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" /> Betaalmodule wordt geladen…
                  </div>
                }
              >
                <StripeEmbeddedCheckout
                  clientSecret={intent.clientSecret}
                  reference={intent.reference}
                  amountLabel={`€${(intent.amountCent / 100).toFixed(2).replace(".", ",")}`}
                  onPaid={(ref) => navigate({ to: "/boeking/bevestiging", search: { ref } })}
                />
              </Suspense>
            </div>
          </section>
        ) : (
          <form
            onSubmit={submit}
            className="mt-10 overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm"
          >
            <div className="border-b border-border/60 bg-muted/40 px-5 py-4 md:px-8">
              <StepBar step={step} onBack={back} />
            </div>

            {/* Vaste samenvatting van de keuzes tot nu toe. */}
            {step > 0 ? (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border/60 px-5 py-3 text-sm md:px-8">
                <span className="flex items-center gap-2 font-medium text-[color:var(--ink-forest)]">
                  <Sparkles className="size-4 text-[color:var(--color-terracotta)]" />
                  {chosen.label}
                </span>
                <span className="font-mono text-xs text-muted-foreground">{chosen.price}</span>
                {dateLabel ? (
                  <>
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <CalendarDays className="size-4" /> {dateLabel}
                    </span>
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="size-4" /> {slot?.startTime} – {slot?.endTime}
                    </span>
                  </>
                ) : null}
              </div>
            ) : null}

            <div className="space-y-8 px-5 py-7 md:px-8 md:py-9">
              {step === 0 ? (
                <fieldset className="space-y-6">
                  <legend className="sr-only">Formule</legend>
                  {groups.map((group) => (
                    <div key={group} className="space-y-3">
                      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                        {group}
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {PRODUCTS.filter((p) => p.group === group).map((p) => {
                          const active = product === p.id;
                          return (
                            <label
                              key={p.id}
                              className={cn(
                                "group relative cursor-pointer rounded-2xl border p-4 transition",
                                active
                                  ? "border-[color:var(--ink-forest)] bg-[color:var(--ink-forest)]/[0.04] shadow-sm"
                                  : "border-border/60 hover:border-[color:var(--color-terracotta)]/60 hover:bg-muted/50",
                              )}
                            >
                              <input
                                type="radio"
                                name="product"
                                value={p.id}
                                checked={active}
                                onChange={() => changeProduct(p.id)}
                                className="sr-only"
                              />
                              <div className="flex items-start justify-between gap-3">
                                <span className="text-sm font-semibold text-[color:var(--ink-forest)]">
                                  {p.label}
                                </span>
                                <span className="font-mono text-xs font-semibold text-[color:var(--color-terracotta)]">
                                  {p.price}
                                </span>
                              </div>
                              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                                {p.hint}
                              </p>
                              {active ? (
                                <span className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-[color:var(--ink-forest)] text-background">
                                  <Check className="size-3.5" />
                                </span>
                              ) : null}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </fieldset>
              ) : null}

              {step === 1 && mode !== "none" && formula ? (
                <fieldset className="space-y-4">
                  <legend className="text-sm font-semibold text-[color:var(--ink-forest)]">
                    {mode === "week" ? "Kies je startweek (maandag)" : "Kies datum en tijdslot"}
                  </legend>
                  <BookingCalendar
                    formula={formula}
                    mode={mode}
                    value={slot}
                    onChange={(v) => {
                      setSlot(v);
                      setError(null);
                    }}
                  />
                </fieldset>
              ) : null}

              {step === 2 ? (
                <>
                  {mode === "none" ? (
                    <p className="rounded-2xl border border-border/60 bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                      Voor een peterschap is geen datum nodig — je steun loopt een jaar vanaf de
                      betaling.
                    </p>
                  ) : null}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="naam">Naam</Label>
                      <Input id="naam" name="naam" required minLength={2} maxLength={120} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail</Label>
                      <Input id="email" name="email" type="email" required maxLength={160} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefoon">Telefoon (optioneel)</Label>
                      <Input id="telefoon" name="telefoon" maxLength={40} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="personen" className="flex items-center gap-2">
                        <Users className="size-4 text-muted-foreground" /> Aantal personen
                      </Label>
                      <Input
                        id="personen"
                        name="personen"
                        type="number"
                        min={1}
                        max={200}
                        defaultValue={1}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="opmerking">Opmerking (optioneel)</Label>
                    <Textarea id="opmerking" name="opmerking" rows={4} maxLength={2000} />
                  </div>
                </>
              ) : null}

              {error ? (
                <p
                  role="alert"
                  className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
                >
                  {error}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-3 border-t border-border/60 bg-muted/40 px-5 py-5 md:flex-row md:items-center md:justify-between md:px-8">
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="size-4" /> Veilig betalen met Bancontact, iDEAL of kaart
              </p>
              {step < 2 ? (
                <Button
                  type="button"
                  size="lg"
                  onClick={next}
                  disabled={step === 1 && !slot}
                  className="w-full md:w-auto"
                >
                  Volgende stap
                </Button>
              ) : (
                <Button type="submit" size="lg" disabled={busy} className="w-full md:w-auto">
                  {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                  Ga verder naar de betaling
                </Button>
              )}
            </div>
          </form>
        )}
      </main>
    </div>
  );
}

