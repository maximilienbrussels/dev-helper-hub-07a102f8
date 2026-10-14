/**
 * Redactionele paspoortinhoud per diersoort (drietalig).
 *
 * De databank bevat enkel naam, soort en beschrijving. Ras, karakter,
 * voedingsregels en weetjes zijn hier redactioneel vastgelegd per soort en
 * kunnen later door het portaal overschreven worden.
 */
import type { Lang } from "@/lib/i18n";
import donkeyAsset from "@/assets/foto/foto-ezel.jpg.asset.json";
import goatAsset from "@/assets/foto/foto-geit.jpg.asset.json";
import goatGroupAsset from "@/assets/foto/foto-geiten-groep.jpg.asset.json";
import goatDaisyAsset from "@/assets/foto/foto-geit-madeliefjes.jpg.asset.json";
import sheepAsset from "@/assets/foto/foto-schapen.jpg.asset.json";
import ponyAsset from "@/assets/foto/foto-pony.jpg.asset.json";
import ponyTreeAsset from "@/assets/foto/foto-pony-boom.jpg.asset.json";
import ponyAutumnAsset from "@/assets/foto/foto-pony-herfst.jpg.asset.json";
import alpacaAsset from "@/assets/foto/foto-alpaca-wit.jpg.asset.json";
import alpacaTwoAsset from "@/assets/foto/foto-alpacas-twee.jpg.asset.json";
import alpacaMeadowAsset from "@/assets/foto/foto-alpacas-weide.jpg.asset.json";
import peacockAsset from "@/assets/foto/foto-pauw.jpg.asset.json";
import peacockProudAsset from "@/assets/foto/foto-pauw-pronkend.jpg.asset.json";
import meadowAsset from "@/assets/foto/foto-weide-stal.jpg.asset.json";
import pathAsset from "@/assets/foto/foto-erf-pad.jpg.asset.json";

export type SpeciesKey = "donkey" | "goat" | "sheep" | "pony" | "alpaca" | "peacock" | "generic";

export type Fact = { q: string; a: string };

export type PassportCopy = {
  breed: string;
  latin: string;
  character: string;
  feeding: string;
  facts: Fact[];
};

export function speciesKey(species: string): SpeciesKey {
  const s = species.toLowerCase();
  if (/(ezel|âne|ane|donkey)/.test(s)) return "donkey";
  if (/(geit|chèvre|chevre|goat)/.test(s)) return "goat";
  if (/(schaap|lam|mouton|agneau|sheep|lamb)/.test(s)) return "sheep";
  if (/(pony|paard|cheval|horse)/.test(s)) return "pony";
  if (/(alpaca|alpaga)/.test(s)) return "alpaca";
  if (/(pauw|paon|peacock)/.test(s)) return "peacock";
  return "generic";
}

export function galleryFor(key: SpeciesKey): string[] {
  switch (key) {
    case "donkey":
      return [donkeyAsset.url, meadowAsset.url, pathAsset.url];
    case "goat":
      return [goatAsset.url, goatGroupAsset.url, goatDaisyAsset.url];
    case "sheep":
      return [sheepAsset.url, meadowAsset.url, pathAsset.url];
    case "pony":
      return [ponyAsset.url, ponyTreeAsset.url, ponyAutumnAsset.url];
    case "alpaca":
      return [alpacaAsset.url, alpacaTwoAsset.url, alpacaMeadowAsset.url];
    case "peacock":
      return [peacockAsset.url, peacockProudAsset.url, pathAsset.url];
    default:
      return [meadowAsset.url, pathAsset.url, goatGroupAsset.url];
  }
}

const NL: Record<SpeciesKey, PassportCopy> = {
  donkey: {
    breed: "Ezel",
    latin: "Equus asinus",
    character: "Lief, erg nieuwsgierig en dol op een kopje krauwen.",
    feeding: "Geef mij a.u.b. GEEN brood of etensresten! Daar word ik ernstig ziek van. Hooi en gras zijn mijn favoriet.",
    facts: [
      { q: "Waarom balken ezels?", a: "Balken is roepen: zo blijven ezels over grote afstand met elkaar in contact. Je hoort het soms tot drie kilometer ver." },
      { q: "Hoeveel drinkt een ezel per dag?", a: "Ongeveer 15 tot 20 liter water, meer op warme dagen. Daarom staat er altijd vers water in de weide." },
      { q: "Waarom hebben ezels zulke grote oren?", a: "Ze horen er heel scherp mee én ze geven warmte af, handig voor een dier dat oorspronkelijk uit droge streken komt." },
    ],
  },
  goat: {
    breed: "Geit",
    latin: "Capra hircus",
    character: "Ondeugend, sociaal en altijd op zoek naar iets om op te klimmen.",
    feeding: "Geef mij a.u.b. GEEN brood, chips of etensresten. Hooi, takken en gras houden mijn maag gezond.",
    facts: [
      { q: "Waarom klimmen geiten zo graag?", a: "Hun voorouders leefden in de bergen. Klimmen is veiligheid zoeken én spelen tegelijk." },
      { q: "Waarom zijn de pupillen rechthoekig?", a: "Daardoor zien geiten bijna rondom zich, ideaal om roofdieren op tijd op te merken." },
      { q: "Eten geiten echt alles?", a: "Nee, dat is een misverstand. Ze proeven veel, maar zijn heel kieskeurig over wat ze doorslikken." },
    ],
  },
  sheep: {
    breed: "Schaap",
    latin: "Ovis aries",
    character: "Rustig, groepsdier en het liefst samen met de kudde.",
    feeding: "Geef mij a.u.b. GEEN brood of etensresten. Gras en hooi zijn precies wat ik nodig heb.",
    facts: [
      { q: "Herkennen schapen gezichten?", a: "Ja, een schaap onthoudt tientallen gezichten van soortgenoten en mensen, jarenlang." },
      { q: "Waarom blijven ze altijd samen?", a: "In een kudde is elk dier veiliger. Alleen staan maakt een schaap onrustig." },
      { q: "Hoe vaak wordt de wol geschoren?", a: "Eén keer per jaar, in het voorjaar. Dat is nodig voor hun comfort in de zomer." },
    ],
  },
  pony: {
    breed: "Pony",
    latin: "Equus ferus caballus",
    character: "Zachtaardig, leergierig en gevoelig voor je stem.",
    feeding: "Geef mij a.u.b. GEEN brood, suiker of etensresten. Hooi en gras, dat is mijn menu.",
    facts: [
      { q: "Slapen pony's rechtstaand?", a: "Meestal wel, dankzij een slim vergrendelsysteem in de poten. Voor diepe slaap gaan ze even liggen." },
      { q: "Hoeveel gras eet een pony per dag?", a: "Een pony graast tot zestien uur per dag, in kleine porties. Zijn maag is klein maar altijd actief." },
      { q: "Waarom spitsen ze hun oren?", a: "De oren wijzen naar wat hun aandacht heeft. Zo lees je precies waar de pony op let." },
    ],
  },
  alpaca: {
    breed: "Alpaca",
    latin: "Vicugna pacos",
    character: "Nieuwsgierig maar verlegen: kijken mag, knuffelen liever niet.",
    feeding: "Geef mij a.u.b. GEEN brood of etensresten. Hooi en gras houden mijn gevoelige maag in orde.",
    facts: [
      { q: "Spugen alpaca's echt?", a: "Zelden naar mensen. Ze doen het vooral onder elkaar, om te zeggen: dit hooi is van mij." },
      { q: "Waarom is alpacawol zo bijzonder?", a: "Ze is licht, warm en bevat geen lanoline, waardoor ze zelden jeukt." },
      { q: "Waarom neuriën alpaca's?", a: "Dat zachte gehum is hun manier om contact te houden met de kudde." },
    ],
  },
  peacock: {
    breed: "Blauwe pauw",
    latin: "Pavo cristatus",
    character: "Trots, luidruchtig en gek op aandacht.",
    feeding: "Geef mij a.u.b. GEEN brood of chips. Granen, insecten en groen zijn mijn echte kost.",
    facts: [
      { q: "Waarom pronkt een pauw?", a: "De waaier is een uitnodiging: hoe meer oogvlekken, hoe interessanter hij is voor een pauwin." },
      { q: "Verliest hij zijn staart?", a: "Elk jaar na de zomer vallen de lange veren uit. In het voorjaar staat de waaier er weer." },
      { q: "Waarom roept hij zo hard?", a: "De schreeuw waarschuwt de groep en laat andere pauwen weten waar hij is." },
    ],
  },
  generic: {
    breed: "Boerderijdier",
    latin: "—",
    character: "Nieuwsgierig en gewend aan bezoek, maar het liefst rustig benaderd.",
    feeding: "Geef mij a.u.b. GEEN brood of etensresten. Ons voer krijgen we van de verzorgers.",
    facts: [
      { q: "Mag ik dichterbij komen?", a: "Rustig en langzaam mag altijd. Snelle bewegingen en lawaai schrikken ons af." },
      { q: "Wie zorgt er voor mij?", a: "De verzorgers en vrijwilligers van de boerderij, elke dag opnieuw." },
      { q: "Waarom staat er een QR-code?", a: "Zo kan je mijn verhaal lezen zonder mij te storen." },
    ],
  },
};

const FR: Record<SpeciesKey, PassportCopy> = {
  donkey: {
    breed: "Âne",
    latin: "Equus asinus",
    character: "Doux, très curieux et fan des grattouilles.",
    feeding: "Ne me donnez SURTOUT pas de pain ni de restes ! J'en tombe gravement malade. Le foin et l'herbe, voilà mon régal.",
    facts: [
      { q: "Pourquoi les ânes braient-ils ?", a: "Le braiment est un appel : il permet de rester en contact à plusieurs kilomètres." },
      { q: "Combien boit un âne par jour ?", a: "Entre 15 et 20 litres d'eau, davantage quand il fait chaud." },
      { q: "Pourquoi de si grandes oreilles ?", a: "Elles captent le moindre bruit et aident à évacuer la chaleur." },
    ],
  },
  goat: {
    breed: "Chèvre",
    latin: "Capra hircus",
    character: "Espiègle, sociable et toujours prête à grimper.",
    feeding: "Ne me donnez pas de pain, de chips ni de restes. Foin, branches et herbe gardent mon estomac en forme.",
    facts: [
      { q: "Pourquoi grimper autant ?", a: "Ses ancêtres vivaient en montagne : grimper, c'est se mettre en sécurité et jouer." },
      { q: "Pourquoi ces pupilles rectangulaires ?", a: "Elles offrent une vision presque panoramique pour repérer les prédateurs." },
      { q: "Une chèvre mange-t-elle tout ?", a: "Non : elle goûte beaucoup mais choisit très soigneusement ce qu'elle avale." },
    ],
  },
  sheep: {
    breed: "Mouton",
    latin: "Ovis aries",
    character: "Calme, grégaire et rassuré au milieu du troupeau.",
    feeding: "Pas de pain ni de restes s'il vous plaît. L'herbe et le foin me suffisent.",
    facts: [
      { q: "Les moutons reconnaissent-ils les visages ?", a: "Oui, ils en mémorisent des dizaines pendant des années." },
      { q: "Pourquoi rester groupés ?", a: "Le troupeau protège : seul, un mouton devient vite anxieux." },
      { q: "Quand tond-on la laine ?", a: "Une fois par an, au printemps, pour leur confort d'été." },
    ],
  },
  pony: {
    breed: "Poney",
    latin: "Equus ferus caballus",
    character: "Doux, curieux d'apprendre et sensible à votre voix.",
    feeding: "Pas de pain, pas de sucre, pas de restes. Foin et herbe, c'est tout mon menu.",
    facts: [
      { q: "Le poney dort-il debout ?", a: "Souvent oui, grâce à un système de verrouillage des membres ; il se couche pour le sommeil profond." },
      { q: "Combien d'herbe par jour ?", a: "Jusqu'à seize heures de pâturage, en petites portions." },
      { q: "Pourquoi dresse-t-il les oreilles ?", a: "Elles pointent vers ce qui l'intéresse : un vrai indicateur d'attention." },
    ],
  },
  alpaca: {
    breed: "Alpaga",
    latin: "Vicugna pacos",
    character: "Curieux mais timide : on regarde, on ne câline pas.",
    feeding: "Pas de pain ni de restes : mon estomac est fragile. Foin et herbe uniquement.",
    facts: [
      { q: "Les alpagas crachent-ils ?", a: "Rarement sur les humains, surtout entre eux pour dire : ce foin est à moi." },
      { q: "Pourquoi cette laine si prisée ?", a: "Légère, chaude et sans lanoline, elle gratte très peu." },
      { q: "Pourquoi ce fredonnement ?", a: "C'est leur façon de garder le contact avec le troupeau." },
    ],
  },
  peacock: {
    breed: "Paon bleu",
    latin: "Pavo cristatus",
    character: "Fier, bruyant et amateur d'attention.",
    feeding: "Pas de pain ni de chips. Graines, insectes et verdure sont ma vraie nourriture.",
    facts: [
      { q: "Pourquoi faire la roue ?", a: "C'est une invitation : plus il y a d'ocelles, plus le paon séduit." },
      { q: "Perd-il sa traîne ?", a: "Chaque année après l'été ; elle repousse au printemps." },
      { q: "Pourquoi crier si fort ?", a: "Le cri avertit le groupe et signale sa position." },
    ],
  },
  generic: {
    breed: "Animal de la ferme",
    latin: "—",
    character: "Curieux et habitué aux visites, mais on approche calmement.",
    feeding: "Pas de pain ni de restes s'il vous plaît : les soigneurs s'occupent de notre nourriture.",
    facts: [
      { q: "Puis-je m'approcher ?", a: "Doucement et lentement, oui. Les gestes brusques nous effraient." },
      { q: "Qui s'occupe de moi ?", a: "Les soigneurs et bénévoles de la ferme, chaque jour." },
      { q: "Pourquoi ce QR code ?", a: "Pour lire mon histoire sans me déranger." },
    ],
  },
};

const EN: Record<SpeciesKey, PassportCopy> = {
  donkey: {
    breed: "Donkey",
    latin: "Equus asinus",
    character: "Gentle, very curious and a big fan of neck scratches.",
    feeding: "Please do NOT give me bread or leftovers! They make me seriously ill. Hay and grass are my favourites.",
    facts: [
      { q: "Why do donkeys bray?", a: "Braying is calling: it keeps donkeys in touch over long distances, sometimes three kilometres." },
      { q: "How much does a donkey drink?", a: "Around 15 to 20 litres of water a day, more when it's warm." },
      { q: "Why such big ears?", a: "They hear extremely well and help release body heat." },
    ],
  },
  goat: {
    breed: "Goat",
    latin: "Capra hircus",
    character: "Playful, social and always looking for something to climb.",
    feeding: "Please no bread, crisps or leftovers. Hay, branches and grass keep my stomach healthy.",
    facts: [
      { q: "Why do goats climb?", a: "Their ancestors lived in mountains: climbing means safety and play." },
      { q: "Why rectangular pupils?", a: "They give almost panoramic vision to spot predators early." },
      { q: "Do goats eat everything?", a: "No. They taste a lot but are very picky about what they swallow." },
    ],
  },
  sheep: {
    breed: "Sheep",
    latin: "Ovis aries",
    character: "Calm flock animal, happiest surrounded by the others.",
    feeding: "Please no bread or leftovers. Grass and hay are exactly what I need.",
    facts: [
      { q: "Do sheep recognise faces?", a: "Yes, they remember dozens of faces for years." },
      { q: "Why stay together?", a: "The flock means safety; alone, a sheep gets anxious." },
      { q: "When is the wool shorn?", a: "Once a year in spring, for their summer comfort." },
    ],
  },
  pony: {
    breed: "Pony",
    latin: "Equus ferus caballus",
    character: "Gentle, eager to learn and sensitive to your voice.",
    feeding: "Please no bread, sugar or leftovers. Hay and grass are my whole menu.",
    facts: [
      { q: "Do ponies sleep standing?", a: "Usually yes, thanks to a locking system in their legs; they lie down for deep sleep." },
      { q: "How much grass per day?", a: "Up to sixteen hours of grazing in small portions." },
      { q: "Why prick their ears?", a: "The ears point at whatever has their attention." },
    ],
  },
  alpaca: {
    breed: "Alpaca",
    latin: "Vicugna pacos",
    character: "Curious but shy: looking is fine, cuddling is not.",
    feeding: "Please no bread or leftovers. Hay and grass keep my sensitive stomach happy.",
    facts: [
      { q: "Do alpacas really spit?", a: "Rarely at people, mostly at each other to say: this hay is mine." },
      { q: "Why is alpaca wool special?", a: "It is light, warm and lanolin-free, so it hardly itches." },
      { q: "Why do they hum?", a: "Humming keeps them in contact with the herd." },
    ],
  },
  peacock: {
    breed: "Indian peafowl",
    latin: "Pavo cristatus",
    character: "Proud, loud and fond of attention.",
    feeding: "Please no bread or crisps. Grain, insects and greens are my real food.",
    facts: [
      { q: "Why fan the tail?", a: "It's an invitation: the more eyespots, the more attractive to a peahen." },
      { q: "Does he lose the train?", a: "Every year after summer; it grows back in spring." },
      { q: "Why call so loudly?", a: "The call warns the group and signals his position." },
    ],
  },
  generic: {
    breed: "Farm animal",
    latin: "—",
    character: "Curious and used to visitors, but best approached calmly.",
    feeding: "Please no bread or leftovers. Our keepers take care of our food.",
    facts: [
      { q: "May I come closer?", a: "Slowly and calmly, yes. Sudden moves and noise startle us." },
      { q: "Who looks after me?", a: "The farm's keepers and volunteers, every single day." },
      { q: "Why the QR code?", a: "So you can read my story without disturbing me." },
    ],
  },
};

const BY_LANG: Record<Lang, Record<SpeciesKey, PassportCopy>> = { nl: NL, fr: FR, en: EN };

export function passportFor(species: string, lang: Lang): PassportCopy {
  return BY_LANG[lang][speciesKey(species)];
}
