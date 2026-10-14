import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { verifyLoginCode } from "@/lib/auth-email.functions";
import { applySession } from "@/lib/neon-auth-compat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Invoerveld voor de 6-cijferige code uit de inlogmail. Bij een geldige code
 * geeft de server de verificatie-URL terug; daar haalt de browser de sessie op.
 */
export function LoginCodeForm({
  email,
  next,
  className = "",
}: {
  email: string;
  next?: string;
  className?: string;
}) {
  const verify = useServerFn(verifyLoginCode);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      toast.error("Vul de 6-cijferige code in.");
      return;
    }
    setBusy(true);
    try {
      const res = (await verify({ data: { email, code, next } })) as {
        token: string;
        user: Parameters<typeof applySession>[1];
        next: string;
      };
      applySession(res.token, res.user);
      window.location.replace(res.next || next || "/account");
    } catch (err) {
      toast.error(
        err instanceof Error && err.message
          ? err.message
          : "Deze code klopt niet of is verlopen.",
      );
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className={`space-y-3 text-left ${className}`}>
      <div>
        <Label htmlFor="login-code">Of vul de code uit de mail in</Label>
        <Input
          id="login-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          placeholder="123456"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          className="mt-1 h-12 text-center text-lg tracking-[0.4em]"
        />
      </div>
      <Button type="submit" variant="outline" className="w-full" disabled={busy}>
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Aanmelden met code
      </Button>
    </form>
  );
}
