import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { PickupScanner } from "@/components/portal/PickupScanner";

export const Route = createFileRoute("/veld/scanner")({
  head: () => ({
    meta: [
      { title: "Scanner — Maximilien veld-app" },
      { name: "description", content: "QR- en certificaatscanner voor afhalingen op het terrein." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Scanner — Maximilien veld-app" },
      { property: "og:description", content: "QR- en certificaatscanner voor afhalingen op het terrein." },
    ],
  }),
  component: FieldScanner,
});

function FieldScanner() {
  const navigate = useNavigate();
  return (
    <div className="space-y-4">
      <h1 className="pt-1 text-2xl font-bold">Scanner</h1>
      <PickupScanner onClose={() => void navigate({ to: "/veld" })} />
    </div>
  );
}
