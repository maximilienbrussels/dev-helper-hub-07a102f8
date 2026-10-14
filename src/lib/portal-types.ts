export type LocationId = "chalet" | "zaal" | "prairie" | "boerderij";

export type BookingType = "teambuilding" | "privatisering" | "zaalverhuur" | "geblokkeerd";

export type BookingStatus =
  "nieuw" | "in_behandeling" | "offerte_verzonden" | "gereserveerd" | "afgerond" | "geannuleerd";

export type DayStatus = "verwacht" | "aangekomen";

export interface Booking {
  id: string;
  type: BookingType;
  status: BookingStatus;
  client_name: string;
  client_org?: string;
  client_email: string;
  client_phone: string;
  date: string; // yyyy-mm-dd
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  location_id: LocationId;
  guests_count: number;
  options?: string[];
  internal_notes: string[];
  price: number;
  day_status: DayStatus;
  created_at: string;
}

export interface LocationInfo {
  id: LocationId;
  name: string;
  capacity: number;
  base_price: number;
  color: string; // tailwind token class suffix
}

export interface Service {
  id: string;
  title_fr: string;
  title_nl: string;
  title_en: string;
  desc_fr: string;
  desc_nl: string;
  desc_en: string;
  price: number;
  location_id: LocationId;
  active: boolean;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: "admin" | "team";
  active: boolean;
}

export type Lang = "fr" | "nl" | "en";
