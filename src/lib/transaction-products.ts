/**
 * Koppelt elk betaalproduct aan het transactietype (referentieprefix),
 * het btw-tarief en het mailsjabloon van de transactionele engine.
 */
import type { TransactionKind } from "./referenceGenerator";

export type TransactionProduct = {
  kind: TransactionKind;
  /** 21% voor verhuur/teambuilding, 6% voor activiteiten, 0% voor giften. */
  vatRate: number;
};

export const PRODUCT_TRANSACTION: Record<string, TransactionProduct> = {
  zaalverhuur_halve_dag: { kind: "invoice", vatRate: 21 },
  zaalverhuur_dag: { kind: "invoice", vatRate: 21 },
  feestje: { kind: "invoice", vatRate: 21 },
  teambuilding: { kind: "invoice", vatRate: 21 },
  peterschap_maand: { kind: "donation", vatRate: 0 },
  stage_week: { kind: "ticket", vatRate: 6 },
  hoevewinkel: { kind: "shop", vatRate: 6 },
};

export function transactionForProduct(product: string): TransactionProduct {
  return PRODUCT_TRANSACTION[product] ?? { kind: "invoice", vatRate: 21 };
}
