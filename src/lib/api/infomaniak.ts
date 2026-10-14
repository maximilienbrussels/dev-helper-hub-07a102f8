/**
 * Browserzijde van de Infomaniak-koppeling.
 * Praat uitsluitend met onze eigen server (`/api/infomaniak/*`) — nooit
 * rechtstreeks met api.infomaniak.com (CORS + geheimen).
 */
import { apiFetch } from "./client";

export type InfomaniakScope = "calendar" | "contacts" | "newsletter";

export type InfomaniakStatusResponse = {
  configured: boolean;
  ok: boolean;
  productId: string | null;
  account: { email?: string; display_name?: string } | null;
  domains: Array<{ domain: string; ok: boolean }>;
  error: string | null;
  errorCode: string | null;
  checkedAt: string;
  scopes: Array<{
    scope: string;
    last_sync_at: string | null;
    last_status: string | null;
    last_message: string | null;
    item_count: number;
  }>;
};

export type InfomaniakSyncResponse = {
  ok: boolean;
  results: Array<{ scope: InfomaniakScope; ok: boolean; count: number; message: string }>;
};

export function getInfomaniakStatus() {
  return apiFetch<InfomaniakStatusResponse>("/api/infomaniak/status");
}

export function runInfomaniakSync(scopes?: InfomaniakScope[]) {
  return apiFetch<InfomaniakSyncResponse>("/api/infomaniak/sync", {
    method: "POST",
    body: { ...(scopes ? { scopes } : {}) },
  });
}
