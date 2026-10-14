/** Gedeelde rijvorm voor productbeheer in het portaal. */
export type ProductRow = {
  id: number;
  title: string;
  description: string | null;
  title_nl: string | null;
  title_fr: string | null;
  title_en: string | null;
  desc_nl: string | null;
  desc_fr: string | null;
  desc_en: string | null;
  price_cents: number;
  stock_quantity: number;
  is_catalog: boolean;
  organisation_id: number;
  availability: string | null;
  required_level: number | null;
};
