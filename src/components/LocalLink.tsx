import { Link, type LinkComponentProps } from "@tanstack/react-router";
import type { ReactNode } from "react";

/**
 * Link naar een gelokaliseerd pad (string uit routes-i18n).
 * De paden worden dynamisch samengesteld, dus we omzeilen de statische padtypes.
 */
export function LocalLink({
  to,
  children,
  ...rest
}: Omit<LinkComponentProps<"a">, "to" | "search" | "params"> & {
  to: string;
  search?: Record<string, unknown>;
  params?: Record<string, unknown>;
  children?: ReactNode;
}) {
  return (
    <Link to={to as never} {...(rest as object)}>
      {children}
    </Link>
  );
}
