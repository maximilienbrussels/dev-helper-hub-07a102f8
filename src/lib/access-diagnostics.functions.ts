/**
 * "Mijn toegang": wat de server over de huidige sessie ziet.
 * Geeft nooit sleutelwaarden terug — enkel of ze aanwezig zijn.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "@/lib/auth-middleware";

export type AccessDiagnostics = {
  email: string | null;
  userId: string;
  roles: string[];
  isFixedOwner: boolean;
  isPortalAdmin: boolean;
  fullAccess: boolean;
  permissions: string[];
  storage: {
    configured: boolean;
    hasAccessKey: boolean;
    hasSecretKey: boolean;
    bucket: string;
    endpoint: string;
    region: string;
    corsConfigured: boolean | null;
    corsOrigins: string[];
    corsError: string | null;
  };
  email_service: { brevoConfigured: boolean };
  database: { ok: boolean; error: string | null };
  checkedAt: string;
};

export const getMyAccess = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<AccessDiagnostics> => {
    const { resolveAccess, loadGrantedPermissions } = await import("@/lib/permission-core.server");
    const access = await resolveAccess({ userId: context.userId, claims: context.claims });

    let permissions: string[] = [];
    if (access.fullAccess) {
      const { PERMISSIONS } = await import("@/lib/rights.functions");
      permissions = [...PERMISSIONS];
    } else {
      permissions = await loadGrantedPermissions(access.roles);
    }

    const { s3ConfigStatus, bucketCorsStatus } = await import("@/lib/s3.server");
    const s3 = s3ConfigStatus();
    const cors = s3.configured
      ? await bucketCorsStatus()
      : { configured: null, origins: [], error: "Opslagsleutels ontbreken." };

    let dbOk = false;
    let dbError: string | null = null;
    try {
      const { db } = await import("@/lib/neon.server");
      await db()`select 1`;
      dbOk = true;
    } catch (error) {
      dbError = error instanceof Error ? error.message : String(error);
    }

    return {
      email: access.email,
      userId: access.userId,
      roles: access.roles,
      isFixedOwner: access.isFixedOwner,
      isPortalAdmin: access.isPortalAdmin,
      fullAccess: access.fullAccess,
      permissions,
      storage: {
        configured: s3.configured,
        hasAccessKey: s3.hasAccessKey,
        hasSecretKey: s3.hasSecretKey,
        bucket: s3.bucket,
        endpoint: s3.endpoint,
        region: s3.region,
        corsConfigured: cors.configured,
        corsOrigins: cors.origins,
        corsError: cors.error,
      },
      email_service: { brevoConfigured: Boolean(process.env["BREVO_API_KEY"]) },
      database: { ok: dbOk, error: dbError },
      checkedAt: new Date().toISOString(),
    };
  });
