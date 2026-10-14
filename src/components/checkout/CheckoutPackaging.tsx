/**
 * <CheckoutPackaging /> — keuze uit drie verpakkingsopties met directe
 * prijsimpact. De toeslag wordt server-side hercontroleerd (order.server.ts).
 */
import type { Lang } from "@/lib/i18n";

export type PackagingChoice = "own_container" | "paper_bag" | "cotton_bag";

/** Toeslag in cent per bestelling. */
export const PACKAGING_FEES_CENTS: Record<PackagingChoice, number> = {
  own_container: 0,
  paper_bag: 50,
  cotton_bag: 250,
};

export function packagingFeeCents(choice: PackagingChoice): number {
  return PACKAGING_FEES_CENTS[choice] ?? 0;
}

/** Waarde die in de databank belandt (`orders.packaging_option`). */
export type PackagingOption = "BYO" | "PAPER_BAG" | "COTTON_BAG";

export const PACKAGING_OPTION: Record<PackagingChoice, PackagingOption> = {
  own_container: "BYO",
  paper_bag: "PAPER_BAG",
  cotton_bag: "COTTON_BAG",
};

type Copy = {
  legend: string;
  options: Record<PackagingChoice, { title: string; subtitle: string; badge: string }>;
};

const COPY: Record<Lang, Copy> = {
  nl: {
    legend: "Verpakking",
    options: {
      own_container: {
        title: "🌱 Ik breng mijn eigen verpakking/doos mee (Gratis)",
        subtitle: "100% verpakkingsvrij",
        badge: "Gratis (€0,00)",
      },
      paper_bag: {
        title: "📦 Recyclebaar kartonnen zakje",
        subtitle: "Lichte papieren draagtas voor onderweg",
        badge: "+ €0,50",
      },
      cotton_bag: {
        title: "🛍️ Herbruikbare stoffen draagtas",
        subtitle: "Stevig bio-katoen met stadsboerderij-logo",
        badge: "+ €2,50",
      },
    },
  },
  fr: {
    legend: "Emballage",
    options: {
      own_container: {
        title: "🌱 J'apporte mon propre contenant/boîte (Gratuit)",
        subtitle: "100% sans emballage",
        badge: "Gratuit (€0,00)",
      },
      paper_bag: {
        title: "📦 Sachet en carton recyclable",
        subtitle: "Sac papier léger pour la route",
        badge: "+ €0,50",
      },
      cotton_bag: {
        title: "🛍️ Tote bag réutilisable en tissu",
        subtitle: "Coton bio solide avec le logo de la ferme urbaine",
        badge: "+ €2,50",
      },
    },
  },
  en: {
    legend: "Packaging",
    options: {
      own_container: {
        title: "🌱 I bring my own container/box (Free)",
        subtitle: "100% packaging-free",
        badge: "Free (€0.00)",
      },
      paper_bag: {
        title: "📦 Recyclable paper bag",
        subtitle: "Light paper carrier for the road",
        badge: "+ €0.50",
      },
      cotton_bag: {
        title: "🛍️ Reusable cotton tote",
        subtitle: "Sturdy organic cotton with city-farm logo",
        badge: "+ €2.50",
      },
    },
  },
};

const ORDER: PackagingChoice[] = ["own_container", "paper_bag", "cotton_bag"];

type Props = {
  value: PackagingChoice;
  onChange: (value: PackagingChoice) => void;
  lang: Lang;
};

export function CheckoutPackaging({ value, onChange, lang }: Props) {
  const copy = COPY[lang] ?? COPY.nl;
  return (
    <fieldset className="space-y-2">
      <legend className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {copy.legend}
      </legend>
      <div role="radiogroup" className="space-y-2">
        {ORDER.map((id) => {
          const o = copy.options[id];
          const active = value === id;
          return (
            <label
              key={id}
              className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors ${
                active
                  ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                  : "border-border bg-[color:var(--surface-page)] hover:border-primary/50"
              }`}
            >
              <input
                type="radio"
                name="packaging"
                value={id}
                checked={active}
                onChange={() => onChange(id)}
                className="mt-1 h-4 w-4 accent-[color:var(--color-primary)]"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold leading-snug">{o.title}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{o.subtitle}</span>
              </span>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 font-mono text-[11px] ${
                  id === "own_container"
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {o.badge}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
