/**
 * Client-safe helpers voor de dynamische boekingskalender.
 * Koppelt de publieke formules (productkeuze op /boeking) aan de
 * `formula_type`-waarden in de tabellen booking_slots / booking_slot_rules.
 */

export const FORMULA_TYPES = [
  "zaal_halve_dag",
  "zaal_volledige_dag",
  "kinderfeestje",
  "teambuilding",
  "stage",
] as const;

export type FormulaType = (typeof FORMULA_TYPES)[number];

export const FORMULA_LABELS: Record<FormulaType, string> = {
  zaal_halve_dag: "Zaal — halve dag",
  zaal_volledige_dag: "Zaal — volledige dag",
  kinderfeestje: "Kinderfeestje",
  teambuilding: "Teambuilding",
  stage: "Vakantiestage",
};

/** Manier waarop de bezoeker een moment kiest. */
export type BookingMode = "slots" | "week" | "none";

/** Productid op /boeking → formula_type in de databank (null = geen datum nodig). */
export const PRODUCT_FORMULA: Record<string, FormulaType | null> = {
  zaalverhuur_halve_dag: "zaal_halve_dag",
  zaalverhuur_dag: "zaal_volledige_dag",
  feestje: "kinderfeestje",
  teambuilding: "teambuilding",
  stage_week: "stage",
  peterschap_maand: null,
};

export function bookingMode(product: string): BookingMode {
  const formula = PRODUCT_FORMULA[product];
  if (!formula) return "none";
  return formula === "stage" ? "week" : "slots";
}

export type PublicSlot = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  remaining: number;
};

export type AvailabilityResponse = {
  slots: PublicSlot[];
  blockedDates: string[];
};

export const WEEKDAY_LABELS = [
  "Zondag",
  "Maandag",
  "Dinsdag",
  "Woensdag",
  "Donderdag",
  "Vrijdag",
  "Zaterdag",
];

/** yyyy-mm-dd in lokale tijd (nooit via toISOString: dat schuift een dag). */
export function isoDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function parseIsoDate(value: string): Date {
  return new Date(`${value}T12:00:00`);
}

export const hhmm = (value: string) => value.slice(0, 5);
