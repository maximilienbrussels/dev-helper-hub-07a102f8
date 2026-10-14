import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useMaximAnimal } from "@/lib/maxim-chat";
import { getAnimals } from "@/lib/data.functions";
import { imageForSpecies } from "@/lib/animal-images";
import { useT, formatT } from "@/lib/i18n";
import { handleImageError } from "@/lib/image-fallback";

const animalsQO = queryOptions({ queryKey: ["animals"], queryFn: () => getAnimals() });

export const Route = createFileRoute("/qr/$animalId")({
  loader: async ({ params, context }) => {
    // Fail-safe: een databasefout tijdens SSR mag de pagina niet laten crashen.
    const animals = await context.queryClient.ensureQueryData(animalsQO).catch((err) => {
      console.error("SSR data loading warning (qr):", err);
      return [];
    });
    const animal = animals.find((a) => a.id === parseInt(params.animalId, 10));
    if (!animal) throw notFound();
    return { animalId: animal.id };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData ? `Ontmoet · Ferme Maximilien` : "Dier niet gevonden",
      },
    ],
  }),
  component: AnimalPage,
  notFoundComponent: () => <QrNotFound />,
  errorComponent: ({ error }) => (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <p className="text-sm text-destructive">{error instanceof Error ? error.message : String(error)}</p>
    </div>
  ),
});

function AnimalPage() {
  const { animalId } = Route.useLoaderData();
  const { data: animals } = useSuspenseQuery(animalsQO);
  const animal = animals.find((a) => a.id === animalId)!;
  const { t } = useT();

  // De globale chat neemt de rol van dit dier op en opent automatisch.
  useMaximAnimal({ id: animal.id, name: animal.name }, true);

  useEffect(() => {
    document.body.classList.add("outdoor-mode");
    return () => document.body.classList.remove("outdoor-mode");
  }, []);

  const img = imageForSpecies(animal.species);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-4 py-3">
        <Link to="/" className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          ← Ferme Maximilien
        </Link>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-6 space-y-6">
        {img && (
          <div className="border border-border overflow-hidden">
            <img loading="lazy" onError={handleImageError}
              src={img}
              alt={`${animal.name} — ${animal.species}`}
              width={900}
              height={900}
              className="aspect-square h-full w-full object-cover object-[50%_35%]"
            />
          </div>
        )}
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-primary">{animal.species}</p>
          <h1 className="mt-2 text-5xl font-bold tracking-tight">{animal.name}</h1>
          <p className="mt-4 text-lg leading-relaxed">{animal.description}</p>
        </div>
        <div className="border border-dashed border-border p-4 text-sm text-muted-foreground">
          {formatT(t("qr.aiOpens"), { name: animal.name })}
        </div>
      </main>
    </div>
  );
}

function QrNotFound() {
  const { t } = useT();
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-sm text-center border border-border p-6">
        <h1 className="text-lg font-semibold uppercase tracking-[0.2em]">{t("qr.unknownTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("qr.unknownBody")}</p>
        <Link
          to="/"
          className="mt-4 inline-flex min-h-[48px] items-center border border-border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] hover:border-primary hover:text-primary"
        >
          {t("qr.backHub")}
        </Link>
      </div>
    </div>
  );
}
