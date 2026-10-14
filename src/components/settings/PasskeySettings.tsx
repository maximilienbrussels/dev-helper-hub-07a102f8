/**
 * Passkeys beheren in de accountinstellingen: registreren, bekijken,
 * hernoemen en verwijderen (met bevestiging).
 */
import { useState } from "react";
import { Fingerprint, Loader2, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { usePasskeys, type PasskeyRecord } from "@/hooks/usePasskeys";

const UNSUPPORTED = "Passkeys worden niet ondersteund door deze browser";

/** 📱 telefoon/tablet, 💻 laptop met ingebouwde sensor, 🔑 losse sleutel. */
function deviceIcon(pk: PasskeyRecord): string {
  const name = (pk.device_name ?? "").toLowerCase();
  const transports = pk.transports ?? [];
  if (/iphone|ipad|android|telefoon|phone/.test(name)) return "📱";
  if (/mac|windows|laptop|book|linux|hello/.test(name)) return "💻";
  if (transports.includes("usb") || transports.includes("nfc") || transports.includes("ble")) {
    return "🔑";
  }
  return transports.includes("internal") ? "💻" : "🔑";
}

function formatDate(iso: string | null): string {
  if (!iso) return "nog nooit gebruikt";
  return new Date(iso).toLocaleDateString("nl-BE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function PasskeySettings() {
  const { passkeys, loading, registering, deletingId, supported, register, remove, rename } =
    usePasskeys();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const registerButton = (
    <Button
      type="button"
      onClick={() => void register()}
      disabled={!supported || registering}
      className="min-h-[44px] rounded-full"
    >
      {registering ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Fingerprint className="mr-2 h-4 w-4" />
      )}
      🔑 Passkey Registreren
    </Button>
  );

  return (
    <Card className="rounded-3xl">
      <CardHeader>
        <CardTitle className="text-base">Passkeys</CardTitle>
        <CardDescription>
          Log sneller en veiliger in met Face ID, vingerafdruk of je toestel-pincode — geen
          wachtwoord nodig.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <p className="text-xs text-muted-foreground">Passkeys laden…</p>
        ) : (passkeys?.length ?? 0) === 0 ? (
          <p className="text-xs text-muted-foreground">Je hebt nog geen passkeys toegevoegd.</p>
        ) : (
          <ul className="space-y-2">
            {passkeys!.map((pk) => (
              <li
                key={pk.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-border p-3"
              >
                {editingId === pk.id ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Naam van dit toestel"
                      className="h-9"
                    />
                    <Button
                      size="sm"
                      onClick={async () => {
                        if (!editName.trim()) return;
                        await rename(pk.id, editName.trim());
                        setEditingId(null);
                      }}
                    >
                      Opslaan
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                      Annuleren
                    </Button>
                  </div>
                ) : (
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      <span aria-hidden className="mr-1.5">
                        {deviceIcon(pk)}
                      </span>
                      {pk.device_name ?? "Onbekend toestel"}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Toegevoegd op {formatDate(pk.created_at)} · Laatst gebruikt:{" "}
                      {formatDate(pk.last_used_at)}
                    </p>
                  </div>
                )}
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label="Naam wijzigen"
                    onClick={() => {
                      setEditingId(pk.id);
                      setEditName(pk.device_name ?? "");
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label="Passkey verwijderen"
                    disabled={deletingId === pk.id}
                    onClick={() => setConfirmId(pk.id)}
                  >
                    {deletingId === pk.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-destructive" />
                    )}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {supported ? (
          registerButton
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-block">{registerButton}</span>
              </TooltipTrigger>
              <TooltipContent>{UNSUPPORTED}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </CardContent>

      <AlertDialog open={confirmId !== null} onOpenChange={(o) => !o && setConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deze passkey verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              Je kunt daarna niet meer met dit toestel inloggen zonder wachtwoord of e-maillink.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                const id = confirmId;
                setConfirmId(null);
                if (id) await remove(id);
              }}
            >
              🗑️ Verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
