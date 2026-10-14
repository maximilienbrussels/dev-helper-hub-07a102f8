import { useEffect, useMemo, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

let stripePromise: Promise<Stripe | null> | null = null;

/** Laadt Stripe.js met de publiceerbare sleutel van de server. */
function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    stripePromise = fetch("/api/stripe-config")
      .then((r) => r.json() as Promise<{ publishableKey: string | null }>)
      .then((d) => (d.publishableKey ? loadStripe(d.publishableKey) : null));
  }
  return stripePromise;
}

type Props = {
  clientSecret: string;
  reference: string;
  amountLabel: string;
  onPaid: (reference: string) => void;
};

function PayForm({ reference, amountLabel, onPaid }: Omit<Props, "clientSecret">) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setBusy(true);
    setError(null);

    const { error: err, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/boeking/bevestiging?ref=${encodeURIComponent(reference)}`,
      },
      redirect: "if_required",
    });

    if (err) {
      setError(err.message ?? "De betaling kon niet worden afgerond.");
      setBusy(false);
      return;
    }
    if (paymentIntent && (paymentIntent.status === "succeeded" || paymentIntent.status === "processing")) {
      onPaid(reference);
      return;
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <PaymentElement options={{ layout: "tabs" }} />
      {error ? (
        <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button type="submit" size="lg" disabled={busy || !stripe} className="w-full">
        {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
        {busy ? "Betaling wordt verwerkt…" : `Betaal ${amountLabel}`}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Beveiligde betaling via Stripe — Bancontact, iDEAL, kaart, Apple&nbsp;Pay en Google&nbsp;Pay.
      </p>
    </form>
  );
}

export default function StripeEmbeddedCheckout({ clientSecret, ...rest }: Props) {
  const [stripe, setStripe] = useState<Stripe | null | "loading">("loading");

  useEffect(() => {
    let alive = true;
    getStripe().then((s) => {
      if (alive) setStripe(s);
    });
    return () => {
      alive = false;
    };
  }, []);

  const options = useMemo(
    () =>
      ({
        clientSecret,
        appearance: {
          theme: "flat" as const,
          variables: { colorPrimary: "#2F5D3A", borderRadius: "12px", fontSizeBase: "15px" },
        },
      }) as const,
    [clientSecret],
  );

  if (stripe === "loading") {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card px-4 py-6 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Betaalmodule wordt geladen…
      </div>
    );
  }
  if (!stripe) {
    return (
      <p className="rounded-xl bg-muted px-4 py-6 text-sm text-muted-foreground">
        Online betalen is tijdelijk niet beschikbaar. Bel ons op +32 2 331 53 91 of mail naar
        info@lafermeduparcmaximilien.be en we regelen je boeking manueel.
      </p>
    );
  }

  return (
    <Elements stripe={stripe} options={options}>
      <PayForm {...rest} />
    </Elements>
  );
}
