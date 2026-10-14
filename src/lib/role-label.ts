import type { Lang } from "./portal-types";
import type { RoleInfo } from "./rights.functions";

/** Naam van een rol in de taal van het portaal. */
export function roleLabel(role: RoleInfo | undefined, lang: Lang): string {
  if (!role) return "";
  return role.labels[lang] || role.labels.nl || role.role;
}

/** Naam van een rol op basis van de sleutel. */
export function roleLabelFor(roles: RoleInfo[], key: string, lang: Lang): string {
  return roleLabel(
    roles.find((r) => r.role === key),
    lang,
  ) || key;
}
