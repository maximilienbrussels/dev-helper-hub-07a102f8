import donkeyAsset from "@/assets/foto/foto-ezel.jpg.asset.json";
import goatAsset from "@/assets/foto/foto-geit.jpg.asset.json";
import sheepAsset from "@/assets/foto/foto-schapen.jpg.asset.json";
import ponyAsset from "@/assets/foto/foto-pony.jpg.asset.json";
import alpacaAsset from "@/assets/foto/foto-alpaca-wit.jpg.asset.json";
import peacockAsset from "@/assets/foto/foto-pauw.jpg.asset.json";
import weideAsset from "@/assets/foto/foto-weide-stal.jpg.asset.json";
import geitMadeliefjesAsset from "@/assets/foto/foto-geit-madeliefjes.jpg.asset.json";
import moestuinAsset from "@/assets/foto/foto-moestuin-bakken.jpg.asset.json";
import konijnAsset from "@/assets/foto/foto-konijn-stal.jpg.asset.json";
import kippenAsset from "@/assets/foto/foto-kippen-ren.jpg.asset.json";
import eendenAsset from "@/assets/foto/foto-eenden-vijver.jpg.asset.json";

// Geen AI-beelden: voor soorten zonder eigen foto gebruiken we een echte
// boerderijfoto als placeholder tot er een echte foto beschikbaar is.
const rabbit = konijnAsset.url;
const lamb = geitMadeliefjesAsset.url;
const bee = moestuinAsset.url;

// Map species to a real farm photo. Fallback keeps layout intact per §8.
export function imageForSpecies(species: string): string | null {
  const s = species.toLowerCase();
  if (s.includes("ezel") || s.includes("âne") || s.includes("donkey")) return donkeyAsset.url;
  if (s.includes("geit") || s.includes("chèvre") || s.includes("goat")) return goatAsset.url;
  if (s.includes("konijn") || s.includes("lapin") || s.includes("rabbit")) return rabbit;
  if (s.includes("lam") || s.includes("agneau") || s.includes("lamb")) return lamb;
  if (s.includes("schaap") || s.includes("mouton") || s.includes("sheep")) return sheepAsset.url;
  if (s.includes("pony") || s.includes("paard") || s.includes("horse") || s.includes("cheval"))
    return ponyAsset.url;
  if (s.includes("alpaca") || s.includes("alpaga")) return alpacaAsset.url;
  if (s.includes("pauw") || s.includes("paon") || s.includes("peacock")) return peacockAsset.url;
  if (s.includes("kip") || s.includes("haan") || s.includes("poule") || s.includes("chicken"))
    return kippenAsset.url;
  if (s.includes("eend") || s.includes("canard") || s.includes("duck") || s.includes("gans"))
    return eendenAsset.url;
  if (s.includes("bij") || s.includes("abeille") || s.includes("bee")) return bee;
  return null;
}
