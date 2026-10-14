/**
 * Beveiliging: tweestapsverificatie, gekoppelde accounts en passkeys.
 */
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConnectedAccounts } from "@/components/settings/ConnectedAccounts";
import { PasskeySettings } from "@/components/settings/PasskeySettings";

export function SecuritySettings() {
  return (
    <div className="space-y-3">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="size-4" /> Tweestapsverificatie
          </CardTitle>
          <CardDescription>
            Bevestig je telefoonnummer, koppel een authenticator-app en maak herstelcodes aan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <a href="/beveiliging?next=/account">Beveiliging beheren</a>
          </Button>
        </CardContent>
      </Card>
      <ConnectedAccounts />
      <PasskeySettings />
    </div>
  );
}
