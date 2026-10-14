import { collectDeviceInfo } from "@/lib/hard-reload";
import { logClientError } from "@/lib/error-log.functions";

type LovableErrorOptions = {
  mechanism?: "manual" | "onerror" | "unhandledrejection" | "react_error_boundary";
  handled?: boolean;
  severity?: "error" | "warning" | "info";
};

type LovableEvents = {
  captureException?: (
    error: unknown,
    context?: Record<string, unknown>,
    options?: LovableErrorOptions,
  ) => void;
};

declare global {
  interface Window {
    __lovableEvents?: LovableEvents;
    __farmErrorHooksInstalled?: boolean;
  }
}

function toError(value: unknown): { name: string; message: string; stack: string | null } {
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack ?? null };
  }
  return { name: "UnknownError", message: String(value).slice(0, 500), stack: null };
}

const recentlySent = new Set<string>();

/** Stuurt een fout naar het eigen foutendashboard (best effort, nooit blokkerend). */
export async function persistClientError(
  error: unknown,
  extra: {
    boundary?: string | null;
    reported?: boolean;
    contact_name?: string | null;
    contact_email?: string | null;
    contact_note?: string | null;
  } = {},
): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const e = toError(error);
  const key = `${e.name}:${e.message}:${extra.boundary ?? ""}:${extra.reported ? "r" : ""}`;
  if (!extra.reported) {
    if (recentlySent.has(key)) return false;
    recentlySent.add(key);
    window.setTimeout(() => recentlySent.delete(key), 30_000);
  }

  try {
    const res = await logClientError({
      data: {
        message: e.message || "Onbekende fout",
        error_name: e.name,
        stack: e.stack?.slice(0, 8000) ?? null,
        boundary: extra.boundary ?? null,
        app_version: import.meta.env.MODE,
        reported: extra.reported ?? false,
        contact_name: extra.contact_name ?? null,
        contact_email: extra.contact_email ?? null,
        contact_note: extra.contact_note ?? null,
        ...collectDeviceInfo(),
      },
    });
    return Boolean(res?.ok);
  } catch {
    return false;
  }
}

export function reportLovableError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  window.__lovableEvents?.captureException?.(
    error,
    {
      source: "react_error_boundary",
      route: window.location.pathname,
      ...context,
    },
    {
      mechanism: "react_error_boundary",
      handled: false,
      severity: "error",
    },
  );
  void persistClientError(error, { boundary: String(context["boundary"] ?? "react") });
}

/** Vangt globale runtime-fouten en niet-afgehandelde promises op. */
export function installGlobalErrorLogging() {
  if (typeof window === "undefined" || window.__farmErrorHooksInstalled) return;
  window.__farmErrorHooksInstalled = true;
  window.addEventListener("error", (event) => {
    void persistClientError(event.error ?? event.message, { boundary: "window.onerror" });
  });
  window.addEventListener("unhandledrejection", (event) => {
    void persistClientError(event.reason, { boundary: "unhandledrejection" });
  });
}
