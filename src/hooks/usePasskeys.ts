/**
 * Passkeys (WebAuthn) beheren: ondersteuning nakijken, registreren, tonen en
 * verwijderen. De challenge komt altijd van de server; de browser opent de
 * systeemprompt (Face ID, Touch ID, Windows Hello) via navigator.credentials.
 */
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { isPasskeyCancelled, isPasskeySupported } from "@/lib/auth/passkey";
import {
  deleteMyPasskey,
  finishPasskeyRegistration,
  listMyPasskeys,
  renameMyPasskey,
  startPasskeyRegistration,
} from "@/lib/webauthn.functions";

export type PasskeyRecord = {
  id: string;
  device_name: string | null;
  transports: string[] | null;
  backed_up: boolean;
  created_at: string;
  last_used_at: string | null;
};

/** Verzint een herkenbare naam: "MacBook Touch ID", "iPhone Face ID", … */
export function guessDeviceNickname(): string | undefined {
  if (typeof navigator === "undefined") return undefined;
  const ua = navigator.userAgent;
  if (/iPhone/i.test(ua)) return "iPhone Face ID";
  if (/iPad/i.test(ua)) return "iPad Face ID";
  if (/Macintosh|Mac OS X/i.test(ua)) return "MacBook Touch ID";
  if (/Android/i.test(ua)) return "Android vingerafdruk";
  if (/Windows/i.test(ua)) return "Windows Hello";
  if (/Linux/i.test(ua)) return "Linux beveiligingssleutel";
  return undefined;
}

export function usePasskeys() {
  const [passkeys, setPasskeys] = useState<PasskeyRecord[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [supported, setSupported] = useState(false);
  const [platformAuthenticator, setPlatformAuthenticator] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listMyPasskeys();
      setPasskeys(data as PasskeyRecord[]);
    } catch {
      toast.error("Kon je passkeys niet ophalen.");
      setPasskeys([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    const ok = isPasskeySupported();
    setSupported(ok);
    if (ok && typeof window.PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable === "function") {
      void window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then((available) => {
          if (alive) setPlatformAuthenticator(available);
        })
        .catch(() => {
          if (alive) setPlatformAuthenticator(false);
        });
    }
    void refresh();
    return () => {
      alive = false;
    };
  }, [refresh]);

  const register = useCallback(async () => {
    if (!isPasskeySupported()) {
      toast.error("Passkeys worden niet ondersteund door deze browser");
      return false;
    }
    setRegistering(true);
    try {
      const { startRegistration } = await import("@simplewebauthn/browser");
      const options = await startPasskeyRegistration();
      let attResp;
      try {
        attResp = await startRegistration({ optionsJSON: options });
      } catch (err) {
        if (isPasskeyCancelled(err)) {
          toast.error("❌ Registratie geannuleerd of mislukt");
          return false;
        }
        throw err;
      }
      await finishPasskeyRegistration({
        data: { response: attResp, deviceName: guessDeviceNickname() },
      });
      toast.success("✅ Passkey succesvol geregistreerd");
      await refresh();
      return true;
    } catch (err) {
      toast.error(
        err instanceof Error && err.message
          ? `❌ ${err.message}`
          : "❌ Registratie geannuleerd of mislukt",
      );
      return false;
    } finally {
      setRegistering(false);
    }
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    setDeletingId(id);
    try {
      await deleteMyPasskey({ data: { id } });
      setPasskeys((prev) => prev?.filter((p) => p.id !== id) ?? null);
      toast.success("Passkey verwijderd.");
      return true;
    } catch {
      toast.error("Kon deze passkey niet verwijderen.");
      return false;
    } finally {
      setDeletingId(null);
    }
  }, []);

  const rename = useCallback(async (id: string, name: string) => {
    try {
      await renameMyPasskey({ data: { id, name } });
      setPasskeys((prev) => prev?.map((p) => (p.id === id ? { ...p, device_name: name } : p)) ?? null);
      toast.success("Naam bijgewerkt.");
      return true;
    } catch {
      toast.error("Kon de naam niet wijzigen.");
      return false;
    }
  }, []);

  return {
    passkeys,
    loading,
    registering,
    deletingId,
    supported,
    platformAuthenticator,
    refresh,
    register,
    remove,
    rename,
  };
}
