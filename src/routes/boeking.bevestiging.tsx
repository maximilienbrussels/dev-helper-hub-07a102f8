import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { NavHeader } from "@/components/NavHeader";
import { getBookingStatus } from "@/lib/booking.functions";
import { CheckCircle2, Clock, Loader2 } from "lucide-react";

export const Route = createFileRoute("/boeking/bevestiging")({
  validateSearch: (search: Record<string, unknown>) => ({
    ref: typeof search["ref"] === "string" ? search["ref"] : "",
  }),
  head: () => ({
    meta: [
      { title: "Boeking bevestigd — Stadsboerderij Maximilien" },
      {
        name: "description",
        content: "Het overzicht van je reservatie op de stadsboerderij met je boekingsreferentie.",
      },
      { property: "og:title", content: "Boeking bevestigd — Stadsboerderij Maximilien" },
      { property: "og:description", content: "Je reservatie op de stadsboerderij is geregistreerd." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ConfirmationPage,
});

function ConfirmationPage() {
  const { ref } = Route.useSearch();
  const query = useQuery({
    queryKey: ["booking", ref],
    queryFn: () => getBookingStatus({ data: { reference: ref } }),
    enabled: ref.length > 3,
    // De webhook van Stripe kan enkele seconden nalopen.
    refetchInterval: (q) => (q.state.data?.status === "PAID" ? false : 4000),
  });

  const booking = query.data;
  const paid = booking?.status === "PAID";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavHeader />
      <main className="mx-auto max-w-2xl px-4 py-20 md:px-8 md:py-28">
        {!ref ? (
          <p className="text-muted-foreground">
            Geen boekingsreferentie gevonden.{" "}
            <Link to="/boeking" className="underline">
              Start een nieuwe boeking
            </Link>
            .
          </p>
        ) : query.isPending ? (
          <p className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Je boeking wordt opgehaald…
          </p>
        ) : !booking ? (
          <p className="text-muted-foreground">
            We vinden geen boeking met referentie <span className="font-mono">{ref}</span>. Bel ons
            op +32 2 331 53 91 en we zoeken het samen uit.
          </p>
        ) : (
          <section className="rounded-3xl border border-border/60 bg-card p-7 shadow-sm md:p-10">
            <div className="flex items-center gap-3">
              {paid ? (
                <CheckCircle2 className="size-7 text-[color:var(--ink-forest)]" />
              ) : (
                <Clock className="size-7 text-[color:var(--color-terracotta)]" />
              )}
              <h1 className="font-serif text-3xl text-[color:var(--ink-forest)] md:text-4xl">
                {paid ? "Boeking bevestigd" : "Betaling wordt verwerkt"}
              </h1>
            </div>
            <p className="mt-4 text-muted-foreground">
              {paid
                ? "Je betaling is ontvangen. De bevestigingsmail met alle details is naar je mailbox verstuurd."
                : "We wachten op de definitieve bevestiging van je bank. Deze pagina werkt automatisch bij."}
            </p>

            <dl className="mt-8 space-y-3 text-sm">
              {[
                ["Referentie", booking.reference],
                ["Formule", booking.formule],
                ["Datum", booking.datum],
                ["Personen", String(booking.personen)],
                ["Bedrag", `€${(booking.bedrag_cent / 100).toFixed(2).replace(".", ",")}`],
                ["E-mail", booking.email],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex justify-between gap-4 border-b border-border/50 pb-2"
                >
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-medium">{value}</dd>
                </div>
              ))}
            </dl>

            <Link
              to="/"
              className="mt-9 inline-flex rounded-full bg-[color:var(--ink-forest)] px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
            >
              Terug naar de boerderij
            </Link>
          </section>
        )}
      </main>
    </div>
  );
}
