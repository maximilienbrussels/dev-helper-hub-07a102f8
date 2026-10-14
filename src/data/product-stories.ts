// Diepgaande storytelling voor de duurzame "een leven lang"-items.
// Gekoppeld op product-id, net zoals de editoriale laag in src/data/products.ts.

export type ProductStory = {
  /** Kopregel boven de titel in de modal. */
  eyebrow: string;
  tagline: string;
  /** Het duurzame verhaal: materiaalkeuze en filosofie. */
  story: string;
  refill: { title: string; body: string };
  collection: { title: string; body: string };
  /** Regels onder "Prijs" in de modal. */
  pricing: string[];
};

export const PRODUCT_STORIES: Record<number, ProductStory> = {
  8: {
    eyebrow: "Stadsboerderij Maximilien Editie",
    tagline: "Een schrijfmaatje voor het leven.",
    story:
      "Stadsboerderij Maximilien zegt nee tegen wegwerpplastic. Dit potlood is vervaardigd uit stevig, mat-gepoedercoat gerecycleerd aluminium in onze kenmerkende terracotta huiskleur. Het is ontworpen om jarenlang intensief teken- en schrijfplezier te bieden.",
    refill: {
      title: "🔄 Hoe vul je hem na jaren weer op?",
      body: "Is het potloodstiftje op? Gooi het potlood nooit weg! Dit potlood gebruikt universele 2.0 mm vulpotlood-vullingen. Je koopt een doosje met 12 nieuwe vullingen voor ongeveer € 1,50 bij elke lokale schrijfwarenwinkel of boekenwinkel in Brussel.",
    },
    collection: {
      title: "🎨 De Brusselse Verzamellijn",
      body: "Dit terracotta item is Deel 1 van de Brusselse Natuurlijn. Spaar binnenkort ook de groene editie (Leefmilieu Brussel) en de zwarte editie (Stad Brussel)!",
    },
    pricing: [
      "🏅 GRATIS bij het behalen van Level 3 (5 academies)",
      "💶 € 3,50 los te koop aan de kassa van de stadsboerderij (100% van de opbrengst gaat naar de verzorging van de dieren).",
    ],
  },
  7: {
    eyebrow: "Stadsboerderij Maximilien Editie",
    tagline: "Eén pen, een leven lang schrijven.",
    story:
      "Geen wegwerpbalpen, maar een stevige pen uit gerecycleerd aluminium met dezelfde mat-gepoedercoate terracotta afwerking. Zwaar in de hand, gemaakt om mee te gaan en om hersteld te worden in plaats van weggegooid.",
    refill: {
      title: "🔄 Hoe vul je hem na jaren weer op?",
      body: "Schroef de pen open en vervang de universele G2-vulling (Parker-formaat). Zo'n vulling koop je voor ongeveer € 2,00 in elke lokale schrijfwarenwinkel in Brussel — en de pen zelf blijft gewoon van jou.",
    },
    collection: {
      title: "🎨 De Brusselse Verzamellijn",
      body: "De terracotta pen hoort bij Deel 1 van de Brusselse Natuurlijn, samen met het ecopotlood. Later volgen de groene editie (Leefmilieu Brussel) en de zwarte editie (Stad Brussel).",
    },
    pricing: [
      "🏅 GRATIS bij het behalen van Level 5 (10 academies)",
      "💶 € 6,50 los te koop aan de kassa van de stadsboerderij (100% van de opbrengst gaat naar de verzorging van de dieren).",
    ],
  },
};

export function storyForProduct(id: number): ProductStory | null {
  return PRODUCT_STORIES[id] ?? null;
}
