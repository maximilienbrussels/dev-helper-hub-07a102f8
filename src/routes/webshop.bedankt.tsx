import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { useT, formatT, type Lang } from "@/lib/i18n";
import { deepTx } from "@/lib/i18n-extra";
import { pathFor } from "@/lib/routes-i18n";
import { LocalLink } from "@/components/LocalLink";

const THANKS_COPY: Record<
  Lang,
  {
    shop: string;
    noPaymentTitle: string;
    noPaymentBody: string;
    backToShop: string;
    placedTitle: string;
    orderRef: (r: string) => string;
    paidBody: string;
    spamBody: string;
  }
> = {
  nl: {
    shop: "Hoevewinkel",
    noPaymentTitle: "Nog geen betaling gevonden",
    noPaymentBody:
      "We zien hier geen afgeronde betaling. Rond je bestelling af in de winkelmand — je komt na het betalen automatisch op deze pagina terug.",
    backToShop: "Terug naar de hoevewinkel",
    placedTitle: "Bestelling geplaatst",
    orderRef: (r) => `Bestelling ${r}`,
    paidBody:
      "Je betaling is goed ontvangen. Je krijgt zo meteen een bevestigingsmail met je factuur in bijlage. Neem die mee — of toon ze op je telefoon — wanneer je je bestelling komt afhalen op de boerderij.",
    spamBody: "Geen mail ontvangen na een kwartier? Kijk even in je ongewenste post of schrijf ons op",
  },
  fr: {
    shop: "Boutique de la ferme",
    noPaymentTitle: "Aucun paiement trouvé",
    noPaymentBody:
      "Nous ne voyons pas de paiement finalisé ici. Terminez votre commande dans le panier — vous reviendrez automatiquement sur cette page après le paiement.",
    backToShop: "Retour à la boutique de la ferme",
    placedTitle: "Commande enregistrée",
    orderRef: (r) => `Commande ${r}`,
    paidBody:
      "Votre paiement a bien été reçu. Vous recevrez dans un instant un e-mail de confirmation avec votre facture en pièce jointe. Emportez-la — ou montrez-la sur votre téléphone — lors du retrait de votre commande à la ferme.",
    spamBody:
      "Pas d'e-mail après un quart d'heure ? Vérifiez vos courriers indésirables ou écrivez-nous à",
  },
  en: {
    shop: "Farm shop",
    noPaymentTitle: "No payment found yet",
    noPaymentBody:
      "We don't see a completed payment here. Finish your order in the cart — after paying you'll come back to this page automatically.",
    backToShop: "Back to the farm shop",
    placedTitle: "Order placed",
    orderRef: (r) => `Order ${r}`,
    paidBody:
      "Your payment came through. You'll receive a confirmation email with your invoice attached in a moment. Bring it along — or show it on your phone — when you collect your order at the farm.",
    spamBody: "No email after fifteen minutes? Check your spam folder or write to us at",
  },
};

/** Bedanktpagina na een geslaagde betaling via de Stripe-betaalpagina. */
export const Route = createFileRoute("/webshop/bedankt")({
  validateSearch: z.object({ session_id: z.string().optional(), ref: z.string().optional() }),

  head: () => ({
    meta: [
      { title: "Bedankt voor je bestelling — Hoevewinkel Maximilien" },
      {
        name: "description",
        content:
          "Je betaling is gelukt. Je ontvangt je bevestiging en factuur per e-mail van de stadsboerderij.",
      },
      { property: "og:title", content: "Bedankt voor je bestelling — Hoevewinkel Maximilien" },
      {
        property: "og:description",
        content: "Je betaling is gelukt. Bevestiging en factuur volgen per e-mail.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ThankYou,
});

function ThankYou() {
  const { session_id: sessionId, ref: orderRef } = Route.useSearch();
  const { lang, extra, tx } = useT();
  const c = deepTx(tx, THANKS_COPY[lang]);

  // Zonder Stripe-sessie is er geen afgeronde betaling: geen bevestiging tonen.
  if (!sessionId) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col justify-center gap-6 px-6 py-20">
        <h1 className="text-3xl font-semibold">{c.noPaymentTitle}</h1>
        <p className="text-muted-foreground">
          {c.noPaymentBody}
        </p>
        <div>
          <LocalLink
            to={pathFor("shop", lang)}
            className="inline-flex rounded-md bg-primary px-5 py-3 text-primary-foreground"
          >
            {c.backToShop}
          </LocalLink>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col justify-center gap-6 px-6 py-20">
      <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
        {c.shop}
      </p>
      <h1 className="text-3xl font-semibold">{c.placedTitle}</h1>
      {orderRef ? (
        <p className="font-mono text-sm font-semibold">{extra ? formatT(tx("Order {r}"), { r: orderRef }) : c.orderRef(orderRef)}</p>
      ) : null}

      <p className="text-muted-foreground">
        {c.paidBody}
      </p>
      <p className="text-muted-foreground">
        {c.spamBody}{" "}
        <a className="underline" href="mailto:hallo@maximilien.brussels">
          hallo@maximilien.brussels
        </a>
        .
      </p>
      <div>
        <LocalLink
          to={pathFor("shop", lang)}
          className="inline-flex rounded-md bg-primary px-5 py-3 text-primary-foreground"
        >
          {c.backToShop}
        </LocalLink>
      </div>
    </main>
  );
}
