import { createFileRoute } from "@tanstack/react-router";
import { MapPin, Sprout } from "lucide-react";

import { usePortal } from "@/lib/portal-store";
import { locationName } from "@/lib/portal-data";
import {
  FieldCard,
  FieldEmpty,
  FieldMeta,
  FieldPageHeader,
} from "@/components/veld/field-ui";

export const Route = createFileRoute("/veld/diensten")({
  head: () => ({
    meta: [
      { title: "Diensten — Maximilien veld-app" },
      { name: "description", content: "Actieve diensten en tarieven van de stadsboerderij." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Diensten — Maximilien veld-app" },
      { property: "og:description", content: "Actieve diensten en tarieven van de stadsboerderij." },
    ],
  }),
  component: FieldServices,
});

function FieldServices() {
  const { services, lang } = usePortal();
  const active = services.filter((s) => s.active);

  const title = (s: (typeof services)[number]) =>
    lang === "fr" ? s.title_fr : lang === "en" ? s.title_en : s.title_nl;
  const desc = (s: (typeof services)[number]) =>
    lang === "fr" ? s.desc_fr : lang === "en" ? s.desc_en : s.desc_nl;

  return (
    <div className="space-y-4">
      <FieldPageHeader
        eyebrow="Aanbod"
        title="Diensten"
        subtitle={`${active.length} actief`}
      />
      {active.length === 0 ? (
        <FieldEmpty
          icon={<Sprout className="h-6 w-6" aria-hidden />}
          title="Geen actieve diensten"
          hint="Diensten worden in het volledige beheer geactiveerd."
        />
      ) : (
        <ul className="space-y-3">
          {active.map((s) => (
            <li key={s.id}>
              <FieldCard>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[17px] font-semibold leading-snug">{title(s)}</p>
                  <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-[15px] font-bold tabular-nums">
                    € {s.price}
                  </span>
                </div>
                <FieldMeta>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" aria-hidden />
                    {locationName(s.location_id)}
                  </span>
                </FieldMeta>
                {desc(s) && <p className="mt-2 text-[14.5px] leading-relaxed">{desc(s)}</p>}
              </FieldCard>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
