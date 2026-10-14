import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";

import { confirmMyEmailChange } from "@/lib/email-change.functions";
import { Button } from "@/components/ui/button";
import { MLogo } from "@/components/MLogo";

const searchSchema = z.object({ token: z.string().optional() });

export const Route = createFileRoute("/e-mailadres-bevestigen")({
  ssr: false,
  validateSearch: (search) => searchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "E-mailadres bevestigen — Maximilien" },
      {
        name: "description",
        content: "Bevestig je nieuwe e-mailadres voor je account bij de boerderij.",
      },
      { property: "og:title", content: "E-mailadres bevestigen — Maximilien" },
      { property: "og:description", content: "Bevestig je nieuwe e-mailadres." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ConfirmEmailPage,
});

function ConfirmEmailPage() {
  const { token } = Route.useSearch();
  const confirm = useServerFn(confirmMyEmailChange);
  const [state, setState] = useState<"bezig" | "ok" | "fout">("bezig");
  const [message, setMessage] = useState<string>("");
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    if (!token) {
      setState("fout");
      setMessage("Deze link is onvolledig. Vraag een nieuwe bevestigingslink aan in je account.");
      return;
    }
    void confirm({ data: { token } })
      .then((res) => {
        setState("ok");
        setMessage(
          res.email
            ? `Je e-mailadres is nu ${res.email}. Al je bestellingen en Hoefjes blijven behouden.`
            : "Je e-mailadres is bijgewerkt.",
        );
      })
      .catch((error: Error) => {
        setState("fout");
        setMessage(error.message);
      });
  }, [confirm, token]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <MLogo className="h-12 w-12" />
      <h1 className="text-2xl font-semibold">E-mailadres bevestigen</h1>
      {state === "bezig" ? (
        <p className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Even geduld…
        </p>
      ) : (
        <p className={state === "fout" ? "text-destructive" : "text-muted-foreground"}>{message}</p>
      )}
      <Button asChild className="h-11">
        <Link to="/account">Naar mijn account</Link>
      </Button>
    </main>
  );
}
