import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import { SecuritySettings } from "@/components/account/SecuritySettings";
import { DEFAULT_LANG, pathFor } from "@/lib/portal-routes";

/** Profiel & accountbeveiliging voor medewerkers in de Maximilien Manager. */
export const Route = createFileRoute("/_authenticated/admin/profiel")({
  component: AdminProfilePage,
  head: () => ({
    meta: [
      { title: "Profiel & beveiliging | Maximilien Manager" },
      {
        name: "description",
        content:
          "Beheer je gekoppelde inlogmethodes en passkeys voor je medewerkersaccount van La Ferme du parc Maximilien.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function AdminProfilePage() {
  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 px-4 py-10">
      <Link
        to={pathFor(DEFAULT_LANG, "today")}
        className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Terug naar het portaal
      </Link>

      <header className="flex items-center gap-3">
        <ShieldCheck className="size-6 text-primary" />
        <div>
          <h1 className="font-display text-2xl">Profiel &amp; beveiliging</h1>
          <p className="text-sm text-muted-foreground">
            Koppel je inlogmethodes en toestellen, zodat je ook op de boerderij vlot kan aanmelden.
          </p>
        </div>
      </header>

      <SecuritySettings />
    </main>
  );
}
