/**
 * Catalogus van rechten en rollen — bewust zonder server- of clientafhankelijkheden,
 * zodat zowel de serverkant (rechtencontrole) als de interface hem kan invoeren
 * zonder kringverwijzingen.
 */
export const PERMISSIONS = [
  "view_today",
  "view_requests",
  "manage_requests",
  "view_calendar",
  "manage_calendar",
  "view_services",
  "manage_services",
  "view_shop",
  "manage_products",
  "manage_orders",
  "view_academy",
  "manage_academy",
  "publish_academy",
  "view_team",
  "manage_team",
  "manage_rights",
  "view_media",
  "manage_media",
  "view_audit",
  "manage_settings",
  "manage_content",
  "view_tasks",
  "manage_tasks",
  "manage_zones",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

/** Ingebouwde rollen. Eigen rollen komen uit de tabel `role_meta`. */
export const BUILTIN_ROLES = ["owner", "super_admin", "admin", "staff", "team"] as const;
/** Rollen met altijd alle rechten; niet aanpasbaar of verwijderbaar. */
export const FULL_ACCESS_ROLES = ["owner", "super_admin"] as const;
