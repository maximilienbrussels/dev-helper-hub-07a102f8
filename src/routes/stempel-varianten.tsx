import { createFileRoute } from "@tanstack/react-router";
import { RubberStamp, STAMP_VARIANTS } from "@/components/RubberStamp";

export const Route = createFileRoute("/stempel-varianten")({
  head: () => ({
    meta: [
      { title: "Stempelvarianten — Maximilien" },
      {
        name: "description",
        content:
          "Vergelijk de rubberen inktstempels voor het adoptiecertificaat en kies de variant die het meest handgestempeld aanvoelt.",
      },
      { property: "og:title", content: "Stempelvarianten voor het certificaat" },
      {
        property: "og:description",
        content: "Vijf varianten van de donkergroene onthaalstempel naast elkaar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StampVariantsPage,
});

function StampVariantsPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">Stempelvarianten</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Elke variant verschilt in inktkorrel, dekking en rotatie. Zeg welke letter je het beste
        vindt, dan zet ik die op de achterzijde van het certificaat.
      </p>

      <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {STAMP_VARIANTS.map((v) => (
          <figure
            key={v.id}
            className="rounded-none border border-border bg-[#FBF8F1] p-6 text-center shadow-[0_10px_30px_rgba(0,0,0,0.08)]"
          >
            <div className="mx-auto grid h-40 w-40 place-items-center">
              <RubberStamp variant={v.id} className="h-36 w-36" />
            </div>
            <figcaption className="mt-4">
              <span className="block text-sm font-semibold uppercase tracking-wider text-foreground">
                {v.id === "default" ? v.label : `${v.id.toUpperCase()} — ${v.label}`}
              </span>

              <span className="mt-1 block text-xs text-muted-foreground">{v.hint}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </main>
  );
}
