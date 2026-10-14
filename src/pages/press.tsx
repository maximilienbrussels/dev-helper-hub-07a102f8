/**
 * Persruimte / Espace presse / Press room.
 * Downloadbare logo's in verschillende formaten en kleurvarianten, merkkleuren,
 * persfoto's (met uitsnede op maat), kerncijfers, standaardtekst, webbanners,
 * link-previews, persberichten en het perscontact.
 */
import { useState } from "react";
import {
  BarChart3,
  Camera,
  Check,
  Copy,
  Download,
  ExternalLink,
  EyeOff,
  FileText,
  Leaf,
  Mail,
  Package,
  Palette,
  Phone,
  Quote,
  Server,
  Shapes,
  ShieldCheck,
  Sliders,
  type LucideIcon,
} from "lucide-react";

import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import { SITE_URL } from "@/lib/routes-i18n";
import { NavHeader } from "@/components/NavHeader";
import { PhotoCropperModal } from "@/components/press/PhotoCropperModal";
import { PartnerBanners } from "@/components/press/PartnerBanners";
import { OpenGraphGenerator } from "@/components/press/OpenGraphGenerator";

import fotoErf from "@/assets/foto/foto-erf-pad.jpg.asset.json";
import fotoMoestuin from "@/assets/foto/foto-moestuin-bakken.jpg.asset.json";
import sfeerKinderenAsset from "@/assets/sfeer-kinderen-zaden.jpg.asset.json";
const sfeerKinderen = sfeerKinderenAsset.url;
import fotoTrojaansPaard from "@/assets/foto/foto-trojaans-paard.jpg.asset.json";
import fotoGeiten from "@/assets/foto/foto-geiten-groep.jpg.asset.json";
import fotoAlpacas from "@/assets/foto/foto-alpacas-twee.jpg.asset.json";
import fotoPauw from "@/assets/foto/foto-pauw-pronkend.jpg.asset.json";
import { handleImageError } from "@/lib/image-fallback";

type Lang = "nl" | "fr" | "en";
type T3 = Record<Lang, string>;

const PRESS_EMAIL = "pers@maximilien.brussels";
const PRESS_PHONE = "+32 2 201 56 09";
const PHOTOS_ZIP = "/pers/persfotos-maximilien.zip";

const COPY = {
  eyebrow: { nl: "Persruimte", fr: "Espace presse", en: "Press room" } as T3,
  title: {
    nl: "Pers & mediakit",
    fr: "Presse & kit média",
    en: "Press & media kit",
  } as T3,
  lede: {
    nl: "Alles wat journalisten, partners en scholen nodig hebben om over de stadsboerderij te berichten: logo's in verschillende formaten, merkkleuren, persfoto's, kerncijfers en onze woordvoering.",
    fr: "Tout ce dont les journalistes, partenaires et écoles ont besoin pour parler de la ferme urbaine : logos en plusieurs formats, couleurs de marque, photos de presse, chiffres clés et contacts presse.",
    en: "Everything journalists, partners and schools need to cover the city farm: logos in several formats, brand colours, press photos, key figures and our press contacts.",
  } as T3,
  logosTitle: { nl: "Logo's", fr: "Logos", en: "Logos" } as T3,
  logosLede: {
    nl: "Gebruik het logo altijd ongewijzigd, met voldoende vrije ruimte rondom (minstens de hoogte van de 'm') en nooit uitgerekt, gedraaid of van een schaduw voorzien.",
    fr: "Utilisez toujours le logo tel quel, avec une zone de protection suffisante (au moins la hauteur du « m »), sans l'étirer, le pivoter ni lui ajouter d'ombre.",
    en: "Always use the logo unmodified, with enough clear space around it (at least the height of the 'm'), never stretched, rotated or with added shadows.",
  } as T3,
  lockupsTitle: {
    nl: "Logo met naam",
    fr: "Logo avec nom",
    en: "Logo with wordmark",
  } as T3,
  lockupsLede: {
    nl: "Het beeldmerk samen met de naam — horizontaal voor brede plaatsen, gestapeld voor smalle. Gebruik één versie per drager.",
    fr: "L'emblème accompagné du nom — horizontal pour les espaces larges, empilé pour les étroits. Une seule version par support.",
    en: "The emblem paired with the name — horizontal for wide spaces, stacked for narrow ones. Use one version per surface.",
  } as T3,
  iconsTitle: {
    nl: "Iconen & avatars",
    fr: "Icônes & avatars",
    en: "Icons & avatars",
  } as T3,
  creamBackground: {
    nl: "JPG op crème",
    fr: "JPG sur fond crème",
    en: "JPG on cream",
  } as T3,
  forestBackground: {
    nl: "JPG op bosgroen",
    fr: "JPG sur fond vert forêt",
    en: "JPG on forest green",
  } as T3,
  clearSpace: {
    nl: "Vrije ruimte: houd rondom minstens de hoogte van de 'm' vrij.",
    fr: "Zone de protection : gardez au moins la hauteur du « m » tout autour.",
    en: "Clear space: keep at least the height of the 'm' free on all sides.",
  } as T3,
  colorsTitle: { nl: "Merkkleuren", fr: "Couleurs de marque", en: "Brand colours" } as T3,
  photosTitle: { nl: "Persfoto's", fr: "Photos de presse", en: "Press photos" } as T3,
  photosLede: {
    nl: "Vrij te gebruiken in redactionele context, met bronvermelding “© Maximilien”.",
    fr: "Libres d'utilisation en contexte rédactionnel, avec la mention « © Maximilien ».",
    en: "Free for editorial use with the credit “© Maximilien”.",
  } as T3,
  photosZip: {
    nl: "Download alle persfoto's (ZIP — hoge resolutie)",
    fr: "Télécharger toutes les photos (ZIP — haute résolution)",
    en: "Download all press photos (ZIP — high res)",
  } as T3,
  customDownload: {
    nl: "Download op maat",
    fr: "Sur mesure",
    en: "Custom download",
  } as T3,
  factsTitle: { nl: "Kerncijfers", fr: "Chiffres clés", en: "Key figures" } as T3,
  boilerplateTitle: {
    nl: "Standaard beschrijving van de boerderij",
    fr: "Description standard de la ferme",
    en: "Standard description of the farm",
  } as T3,
  contactTitle: { nl: "Perscontact", fr: "Contact presse", en: "Press contact" } as T3,
  contactLede: {
    nl: "Voor interviews, opnames op het erf of extra beeldmateriaal.",
    fr: "Pour les interviews, tournages à la ferme ou visuels supplémentaires.",
    en: "For interviews, filming on site or additional visuals.",
  } as T3,
  download: { nl: "Download", fr: "Télécharger", en: "Download" } as T3,
  zip: {
    nl: "Volledig logopakket (ZIP · SVG, PNG, JPG)",
    fr: "Kit logo complet (ZIP · SVG, PNG, JPG)",
    en: "Full logo kit (ZIP · SVG, PNG, JPG)",
  } as T3,
  copy: { nl: "Kopieer", fr: "Copier", en: "Copy" } as T3,
  copied: { nl: "Gekopieerd", fr: "Copié", en: "Copied" } as T3,
  copyText: {
    nl: "Kopieer tekst",
    fr: "Copier le texte",
    en: "Copy text",
  } as T3,
  copyQuote: {
    nl: "Kopieer citaat",
    fr: "Copier la citation",
    en: "Copy quote",
  } as T3,
  releasesTitle: { nl: "Persberichten", fr: "Communiqués de presse", en: "Press releases" } as T3,
  releasesLede: {
    nl: "Onze recentste persberichten in PDF.",
    fr: "Nos communiqués les plus récents en PDF.",
    en: "Our most recent press releases in PDF.",
  } as T3,
  quoteTitle: {
    nl: "Citaat voor de pers",
    fr: "Citation pour la presse",
    en: "Quote for the press",
  } as T3,
  mediaTitle: { nl: "In de media", fr: "Dans les médias", en: "In the media" } as T3,
  usage: {
    nl: "Gebruiksvoorwaarden: logo's en foto's mogen gebruikt worden voor redactionele en informatieve doeleinden. Commercieel gebruik of gebruik dat een samenwerking suggereert vraagt onze schriftelijke toestemming.",
    fr: "Conditions d'utilisation : logos et photos peuvent être utilisés à des fins rédactionnelles et informatives. Tout usage commercial ou laissant supposer un partenariat requiert notre accord écrit.",
    en: "Terms of use: logos and photos may be used for editorial and informational purposes. Commercial use, or use suggesting a partnership, requires our written consent.",
  } as T3,
  techEyebrow: {
    nl: "Digitale soevereiniteit",
    fr: "Souveraineté numérique",
    en: "Digital sovereignty",
  } as T3,
  techTitle: {
    nl: "Ons digitaal manifest",
    fr: "Notre manifeste numérique",
    en: "Our tech manifesto",
  } as T3,
  techLede: {
    nl: "Deze site is gebouwd zoals we onze boerderij runnen: sober, transparant en met respect voor wie langskomt. Geen trackers, geen cookiebanners, geen data die Europa verlaat.",
    fr: "Ce site est conçu comme nous gérons la ferme : sobre, transparent et respectueux de celles et ceux qui passent. Pas de traceurs, pas de bannières cookies, aucune donnée qui quitte l'Europe.",
    en: "This site is built the way we run the farm: sober, transparent and respectful of everyone who visits. No trackers, no cookie banners, no data leaving Europe.",
  } as T3,
  techFooter: {
    nl: "Architectuur & platform door Delplanche —",
    fr: "Architecture & plateforme par Delplanche —",
    en: "Architecture & platform by Delplanche —",
  } as T3,
};

const TECH_PRINCIPLES: {
  id: string;
  icon: LucideIcon;
  title: T3;
  text: T3;
  link?: { href: string; label: string };
}[] = [
  {
    id: "no-trackers",
    icon: EyeOff,
    title: {
      nl: "Nul trackers, cookievrij",
      fr: "Zéro traceur, sans cookies",
      en: "Zero trackers, cookie-free",
    },
    text: {
      nl: "Volledige privacy voor elke bezoeker: geen advertentiepixels, geen profilering en dus ook geen cookiebanner die je moet wegklikken.",
      fr: "Une confidentialité totale pour chaque visiteur : aucun pixel publicitaire, aucun profilage et donc aucune bannière cookies à écarter.",
      en: "Complete privacy for every visitor: no advertising pixels, no profiling and therefore no cookie banner to click away.",
    },
  },
  {
    id: "gdpr",
    icon: ShieldCheck,
    title: {
      nl: "GDPR- & AVG-conform",
      fr: "Conforme au RGPD",
      en: "GDPR compliant",
    },
    text: {
      nl: "Vanaf de eerste regel code gebouwd rond de Europese privacywetgeving: dataminimalisatie, duidelijke bewaartermijnen en volledige inzage.",
      fr: "Construit dès la première ligne de code autour du droit européen : minimisation des données, durées de conservation claires et accès complet.",
      en: "Built around European data-protection law from the first line of code: data minimisation, clear retention periods and full access rights.",
    },
  },
  {
    id: "eea",
    icon: Server,
    title: {
      nl: "Soevereine EER-infrastructuur",
      fr: "Infrastructure souveraine EEE",
      en: "Sovereign EEA infrastructure",
    },
    text: {
      nl: "Gehost op groene, beveiligde Europese cloudinfrastructuur. Architectuur & platform door Delplanche.",
      fr: "Hébergé sur une infrastructure cloud européenne verte et sécurisée. Architecture & plateforme par Delplanche.",
      en: "Hosted on green, secure European cloud infrastructure. Architecture & platform by Delplanche.",
    },
    link: { href: "https://delplanche.cloud", label: "delplanche.cloud" },
  },
  {
    id: "open",
    icon: Leaf,
    title: {
      nl: "Open & transparant",
      fr: "Ouvert & transparent",
      en: "Open & transparent",
    },
    text: {
      nl: "Aangedreven door duurzame, moderne webarchitectuur: lichte pagina's, open standaarden en een laag energieverbruik.",
      fr: "Propulsé par une architecture web moderne et durable : pages légères, standards ouverts et faible consommation d'énergie.",
      en: "Powered by sustainable, modern web architecture: light pages, open standards and low energy use.",
    },
  },
];

const NAV_PILLS: { href: string; icon: LucideIcon; label: T3 }[] = [
  { href: "#kerncijfers", icon: BarChart3, label: COPY.factsTitle },
  { href: "#logos", icon: Shapes, label: COPY.logosTitle },
  { href: "#kleuren", icon: Palette, label: COPY.colorsTitle },
  { href: "#fotos", icon: Camera, label: COPY.photosTitle },
  { href: "#tekst", icon: FileText, label: COPY.boilerplateTitle },
  { href: "#digitaal", icon: ShieldCheck, label: COPY.techEyebrow },
  { href: "#contact", icon: Mail, label: COPY.contactTitle },
];

/** Logo met naam: horizontaal en gestapeld, in vier kleurvarianten. */
const LOCKUPS: {
  id: string;
  name: T3;
  note: T3;
  preview: string;
  previewBg: string;
  aspect: string;
  files: { label: string | T3; href: string }[];
}[] = [
  {
    id: "horizontaal",
    name: {
      nl: "Horizontaal — beeldmerk + naam",
      fr: "Horizontal — emblème + nom",
      en: "Horizontal — emblem + name",
    },
    note: {
      nl: "Voor briefhoofden, websitekoppen en banners.",
      fr: "Pour en-têtes, bandeaux de site et bannières.",
      en: "For letterheads, site headers and banners.",
    },
    preview: "/pers/lockup-horizontaal-terracotta.svg",
    previewBg: "#F7F3EB",
    aspect: "aspect-[39/10]",
    files: [
      { label: "SVG terracotta", href: "/pers/lockup-horizontaal-terracotta.svg" },
      { label: { nl: "SVG wit", fr: "SVG blanc", en: "SVG white" }, href: "/pers/lockup-horizontaal-wit.svg" },
      { label: { nl: "SVG bosgroen", fr: "SVG vert forêt", en: "SVG forest green" }, href: "/pers/lockup-horizontaal-bosgroen.svg" },
      { label: { nl: "SVG zwart", fr: "SVG noir", en: "SVG black" }, href: "/pers/lockup-horizontaal-zwart.svg" },
      { label: "PNG 1600 px", href: "/pers/lockup-horizontaal-terracotta-1600px.png" },
    ],
  },
  {
    id: "gestapeld",
    name: {
      nl: "Gestapeld — beeldmerk boven naam",
      fr: "Empilé — emblème au-dessus du nom",
      en: "Stacked — emblem above name",
    },
    note: {
      nl: "Voor affiches, sociale media en smalle dragers.",
      fr: "Pour affiches, réseaux sociaux et supports étroits.",
      en: "For posters, social media and narrow surfaces.",
    },
    preview: "/pers/lockup-gestapeld-bosgroen.svg",
    previewBg: "#F7F3EB",
    aspect: "aspect-[22/18]",
    files: [
      { label: "SVG terracotta", href: "/pers/lockup-gestapeld-terracotta.svg" },
      { label: { nl: "SVG wit", fr: "SVG blanc", en: "SVG white" }, href: "/pers/lockup-gestapeld-wit.svg" },
      { label: { nl: "SVG bosgroen", fr: "SVG vert forêt", en: "SVG forest green" }, href: "/pers/lockup-gestapeld-bosgroen.svg" },
      { label: { nl: "SVG zwart", fr: "SVG noir", en: "SVG black" }, href: "/pers/lockup-gestapeld-zwart.svg" },
      { label: "PNG 1600 px", href: "/pers/lockup-gestapeld-bosgroen-1600px.png" },
    ],
  },
];


const LOGO_VARIANTS: {
  id: string;
  name: T3;
  note: T3;
  preview: string;
  previewBg: string;
  files: { label: string | T3; href: string }[];
}[] = [
  {
    id: "terracotta",
    name: {
      nl: "Hoofdlogo — terracotta",
      fr: "Logo principal — terracotta",
      en: "Primary — terracotta",
    },
    note: {
      nl: "Voor lichte achtergronden (crème, wit, papier).",
      fr: "Pour fonds clairs (crème, blanc, papier).",
      en: "For light backgrounds (cream, white, paper).",
    },
    preview: "/pers/logo-maximilien-terracotta-500px.png",
    previewBg: "var(--color-cream, #F7F3EB)",
    files: [
      { label: "SVG", href: "/pers/logo-maximilien-terracotta.svg" },
      { label: "PNG 250 px", href: "/pers/logo-maximilien-terracotta-250px.png" },
      { label: "PNG 500 px", href: "/pers/logo-maximilien-terracotta-500px.png" },
      { label: "PNG 1000 px", href: "/pers/logo-maximilien-terracotta-1000px.png" },
      { label: COPY.creamBackground, href: "/pers/logo-maximilien-op-creme-1000px.jpg" },
    ],
  },
  {
    id: "wit",
    name: {
      nl: "Wit — voor donkere achtergronden",
      fr: "Blanc — pour fonds foncés",
      en: "White — for dark backgrounds",
    },
    note: {
      nl: "Voor foto's, bosgroene vlakken en video.",
      fr: "Pour photos, aplats vert forêt et vidéo.",
      en: "For photos, forest-green blocks and video.",
    },
    preview: "/pers/logo-maximilien-wit-500px.png",
    previewBg: "#1D3528",
    files: [
      { label: "SVG", href: "/pers/logo-maximilien-wit.svg" },
      { label: "PNG 250 px", href: "/pers/logo-maximilien-wit-250px.png" },
      { label: "PNG 500 px", href: "/pers/logo-maximilien-wit-500px.png" },
      { label: "PNG 1000 px", href: "/pers/logo-maximilien-wit-1000px.png" },
      { label: COPY.forestBackground, href: "/pers/logo-maximilien-op-bosgroen-1000px.jpg" },
    ],
  },
  {
    id: "bosgroen",
    name: { nl: "Bosgroen", fr: "Vert forêt", en: "Forest green" },
    note: {
      nl: "Voor rustige, eenkleurige toepassingen.",
      fr: "Pour des applications sobres, monochromes.",
      en: "For calm, single-colour applications.",
    },
    preview: "/pers/logo-maximilien-bosgroen-500px.png",
    previewBg: "#F7F3EB",
    files: [
      { label: "SVG", href: "/pers/logo-maximilien-bosgroen.svg" },
      { label: "PNG 250 px", href: "/pers/logo-maximilien-bosgroen-250px.png" },
      { label: "PNG 500 px", href: "/pers/logo-maximilien-bosgroen-500px.png" },
      { label: "PNG 1000 px", href: "/pers/logo-maximilien-bosgroen-1000px.png" },
    ],
  },
  {
    id: "zwart",
    name: { nl: "Zwart — drukwerk", fr: "Noir — impression", en: "Black — print" },
    note: {
      nl: "Voor zwart-witdruk, fax, stempels en krantenpapier.",
      fr: "Pour impression N/B, tampons et papier journal.",
      en: "For black-and-white print, stamps and newsprint.",
    },
    preview: "/pers/logo-maximilien-zwart-500px.png",
    previewBg: "#FFFFFF",
    files: [
      { label: "SVG", href: "/pers/logo-maximilien-zwart.svg" },
      { label: "PNG 250 px", href: "/pers/logo-maximilien-zwart-250px.png" },
      { label: "PNG 500 px", href: "/pers/logo-maximilien-zwart-500px.png" },
      { label: "PNG 1000 px", href: "/pers/logo-maximilien-zwart-1000px.png" },
    ],
  },
];

const ICON_FILES: { label: T3; href: string; size: string }[] = [
  {
    label: { nl: "Social avatar", fr: "Avatar réseaux", en: "Social avatar" },
    href: "/pers/logo-maximilien-avatar-1000x1000.jpg",
    size: "1000 × 1000 px",
  },
  {
    label: { nl: "App-icoon", fr: "Icône d'app", en: "App icon" },
    href: "/icons/pwa-512x512.png",
    size: "512 × 512 px",
  },
  {
    label: { nl: "Apple touch-icoon", fr: "Icône Apple touch", en: "Apple touch icon" },
    href: "/icons/apple-touch-icon.png",
    size: "180 × 180 px",
  },
  { label: { nl: "Favicon", fr: "Favicon", en: "Favicon" }, href: "/favicon.svg", size: "SVG" },
  {
    label: { nl: "App-icoon", fr: "Icône d'app", en: "App icon" },
    href: "/icons/taskbar-512.png",
    size: "PNG 512",
  },
];

const COLORS: { name: T3; hex: string; use: T3 }[] = [
  {
    name: { nl: "Bosgroen", fr: "Vert forêt", en: "Forest green" },
    hex: "#1D3528",
    use: {
      nl: "Basiskleur, vlakken en tekst",
      fr: "Couleur de base, aplats et texte",
      en: "Base colour, blocks and text",
    },
  },
  {
    name: { nl: "Terracotta", fr: "Terracotta", en: "Terracotta" },
    hex: "#C15C3A",
    use: {
      nl: "Accenten, knoppen en logo",
      fr: "Accents, boutons et logo",
      en: "Accents, buttons and logo",
    },
  },
  {
    name: { nl: "Crème", fr: "Crème", en: "Cream" },
    hex: "#F7F3EB",
    use: { nl: "Achtergronden en papier", fr: "Fonds et papier", en: "Backgrounds and paper" },
  },
  {
    name: { nl: "Salie", fr: "Sauge", en: "Sage" },
    hex: "#9CB29B",
    use: {
      nl: "Randen en rustige vlakken",
      fr: "Bordures et aplats doux",
      en: "Borders and soft blocks",
    },
  },
];

const PHOTOS: { src: string; caption: T3 }[] = [
  {
    src: fotoErf.url,
    caption: {
      nl: "Het erf met de woontorens op de achtergrond",
      fr: "La cour et les tours en arrière-plan",
      en: "The farmyard with the towers behind",
    },
  },
  {
    src: fotoMoestuin.url,
    caption: {
      nl: "De moestuin in volle zomer",
      fr: "Le potager en plein été",
      en: "The kitchen garden in high summer",
    },
  },
  {
    src: sfeerKinderen,
    caption: {
      nl: "Kinderen zaaien tijdens een animatie",
      fr: "Des enfants sèment pendant une animation",
      en: "Children sowing during an activity",
    },
  },
  {
    src: fotoGeiten.url,
    caption: { nl: "Onze geiten", fr: "Nos chèvres", en: "Our goats" },
  },
  {
    src: fotoAlpacas.url,
    caption: { nl: "De alpaca's", fr: "Les alpagas", en: "The alpacas" },
  },
  {
    src: fotoPauw.url,
    caption: {
      nl: "Onze pauw pronkt",
      fr: "Notre paon fait la roue",
      en: "Our peacock displaying",
    },
  },
  {
    src: fotoTrojaansPaard.url,
    caption: {
      nl: "Het houten paard op het erf",
      fr: "Le cheval en bois dans la cour",
      en: "The wooden horse in the yard",
    },
  },
];

const FACTS: { value: string; label: T3 }[] = [
  { value: "1996", label: { nl: "Opgericht", fr: "Fondée en", en: "Founded" } },
  {
    value: "1 ha",
    label: { nl: "Boerderij in de stad", fr: "De ferme en ville", en: "Of farm in the city" },
  },
  {
    value: "~120",
    label: { nl: "Dieren op het erf", fr: "Animaux à la ferme", en: "Animals on the farm" },
  },
  {
    value: "10.000+",
    label: { nl: "Bezoekers per jaar", fr: "Visiteurs par an", en: "Visitors a year" },
  },
];

const RELEASES: { href: string; name: T3; date: string }[] = [
  {
    href: "/pers/persberichten/persbericht-nieuwe-moestuin-2026.pdf",
    date: "2026",
    name: {
      nl: "Persbericht — nieuwe moestuin 2026",
      fr: "Communiqué — nouveau potager 2026",
      en: "Press release — new kitchen garden 2026",
    },
  },
  {
    href: "/pers/persberichten/persbericht-jaarverslag.pdf",
    date: "2025",
    name: {
      nl: "Persbericht — jaarverslag",
      fr: "Communiqué — rapport annuel",
      en: "Press release — annual report",
    },
  },
];

const QUOTE: T3 = {
  nl: "Laat stadsbewoners in het hart van Brussel opnieuw verbinding maken met de natuur, de dieren en elkaar. Onze boerderij is een ademruimte voor de hele stad.",
  fr: "Permettre aux habitants du cœur de Bruxelles de renouer avec la nature, les animaux et les autres. Notre ferme est un espace de respiration pour toute la ville.",
  en: "Letting people in the heart of Brussels reconnect with nature, with the animals and with each other. Our farm is a breathing space for the whole city.",
};

const QUOTE_SOURCE: T3 = {
  nl: "— Woordvoering / directie Maximilien",
  fr: "— Porte-parole / direction Maximilien",
  en: "— Spokesperson / management, Maximilien",
};

const MEDIA_OUTLETS = ["BRUZZ", "BX1", "RTBF", "LE SOIR", "DE STANDAARD"];

const BOILERPLATE: T3 = {
  nl: "Maximilien is een stadsboerderij en sociale onderneming in hartje Brussel, pal naast het Noordstation. Op één hectare tussen de woontorens leven zo'n 120 dieren, groeit een moestuin en draait een buurtcompost. De vzw combineert dierenwelzijn en stadslandbouw met educatie, socioprofessionele inschakeling en vrijwilligerswerk: schoolanimaties, vakantiestages, verjaardagen, teambuilding en zaalverhuur maken de werking mogelijk. De boerderij is gratis toegankelijk voor iedereen.",
  fr: "Maximilien est une ferme urbaine et une entreprise sociale au cœur de Bruxelles, juste à côté de la gare du Nord. Sur un hectare entre les tours vivent quelque 120 animaux, avec un potager et un compost de quartier. L'ASBL allie bien-être animal et agriculture urbaine à l'éducation, l'insertion socioprofessionnelle et le bénévolat : animations scolaires, stages, anniversaires, teambuilding et location de salles font vivre le projet. La ferme est accessible gratuitement à toutes et tous.",
  en: "Maximilien is a city farm and social enterprise in the heart of Brussels, right next to the North Station. On one hectare between the tower blocks live some 120 animals, alongside a kitchen garden and a neighbourhood compost. The non-profit combines animal welfare and urban agriculture with education, work integration and volunteering: school activities, holiday camps, birthdays, team building and venue rental keep the project running. The farm is free to visit for everyone.",
};

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  return {
    copied,
    copy(value: string, id: string, message: string) {
      void navigator.clipboard.writeText(value).then(() => {
        setCopied(id);
        toast.success(message);
        window.setTimeout(() => setCopied((c) => (c === id ? null : c)), 1800);
      });
    },
  };
}

const CARD =
  "rounded-3xl border border-border bg-[color:var(--surface-page)] p-6 shadow-[0_1px_0_rgba(0,0,0,0.03)]";
const DARK_CARD = "rounded-3xl border border-white/12 bg-white/[0.06] p-6";
const SECTION_TITLE = "font-serif text-2xl text-[color:var(--ink-forest)] md:text-3xl";
const SECTION_TITLE_LIGHT = "font-serif text-2xl text-[color:var(--color-cream)] md:text-3xl";
const DOWNLOAD_BTN =
  "inline-flex min-h-[40px] items-center gap-2 rounded-full border border-border px-4 text-xs font-medium text-foreground/90 transition-colors hover:border-[color:var(--color-terracotta)] hover:text-[color:var(--color-terracotta)]";
const DOWNLOAD_BTN_LIGHT =
  "inline-flex min-h-[40px] items-center gap-2 rounded-full border border-white/25 px-4 text-xs font-medium text-[color:var(--color-cream)]/95 transition-colors hover:border-white hover:text-white";

export function PressPage() {
  const { lang } = useT();
  const l = lang as Lang;
  const { copied, copy } = useCopy();
  const [cropper, setCropper] = useState<{ src: string; alt: string } | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavHeader />
      <main>
      {/* Hero + kerncijfers op bosgroen */}
      <section className="border-b border-border bg-[color:var(--surface-forest,#1D3528)] px-4 py-16 text-[color:var(--color-cream)] md:px-8 md:py-24">
        <div className="mx-auto max-w-5xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[color:var(--color-terracotta)]">
            {COPY.eyebrow[l]}
          </p>
          <h1 className="mt-4 font-serif text-4xl italic md:text-5xl">{COPY.title[l]}</h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed opacity-90">{COPY.lede[l]}</p>

          {/* Sprongnavigatie */}
          <nav className="mt-8 flex flex-wrap gap-2.5" aria-label={COPY.title[l]}>
            {NAV_PILLS.map((p) => (
              <JumpLink key={p.href} item={p} lang={l} />
            ))}
          </nav>

          {/* Kerncijfers */}
          <section id="kerncijfers" className="mt-12 scroll-mt-24">
            <h2 className={SECTION_TITLE_LIGHT}>{COPY.factsTitle[l]}</h2>
            <dl className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              {FACTS.map((f) => (
                <div key={f.value} className={`${DARK_CARD} text-center`}>
                  <dt className="font-serif text-3xl text-[color:var(--color-terracotta)]">
                    {f.value}
                  </dt>
                  <dd className="mt-2 text-xs uppercase tracking-[0.18em] text-[color:var(--color-cream)]/95">
                    {f.label[l]}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </section>

      {/* Logo's + merkkleuren op een rustige, lichte ondergrond */}
      <div className="border-b border-border bg-background px-4 py-12 md:px-8 md:py-14">
        <div className="mx-auto max-w-5xl space-y-12">
          {/* Logo's */}
          <section id="logos" className="scroll-mt-24">
            <h2 className={SECTION_TITLE}>{COPY.logosTitle[l]}</h2>
            <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
              {COPY.logosLede[l]}
            </p>
            <a
              href="/pers/maximilien-logopakket.zip"
              download
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-[color:var(--color-terracotta)] px-5 py-2.5 text-sm font-semibold text-[color:var(--color-cream)] shadow-sm transition hover:opacity-90"
            >
              <Download className="h-4 w-4" /> {COPY.zip[l]}
            </a>

            <div className="mt-8 border-t border-border pt-8">
              <h3 className="font-serif text-xl text-[color:var(--ink-forest)] md:text-2xl">
                {COPY.lockupsTitle[l]}
              </h3>
              <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{COPY.lockupsLede[l]}</p>
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                {LOCKUPS.map((v) => (
                  <article key={v.id} className={CARD}>
                    <div
                      className={`flex ${v.aspect} max-h-52 items-center justify-center rounded-2xl border border-border p-6`}
                      style={{ background: v.previewBg }}
                    >
                      <img
                        onError={handleImageError}
                        src={v.preview}
                        alt={v.name[l]}
                        className="max-h-full w-auto"
                        loading="lazy"
                      />
                    </div>
                    <h4 className="mt-4 font-serif text-lg text-[color:var(--ink-forest)]">{v.name[l]}</h4>
                    <p className="mt-1 text-sm text-muted-foreground">{v.note[l]}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {v.files.map((f) => (
                        <a key={f.href} href={f.href} download className={DOWNLOAD_BTN}>
                          <Download className="h-3.5 w-3.5" /> {typeof f.label === "string" ? f.label : f.label[l]}
                        </a>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {LOGO_VARIANTS.map((v) => (
                <article key={v.id} className={CARD}>
                  <div
                    className="flex h-36 items-center justify-center rounded-2xl border border-border"
                    style={{ background: v.previewBg }}
                  >
                    <img
                      onError={handleImageError}
                      src={v.preview}
                      alt={v.name[l]}
                      className="h-20 w-auto"
                      loading="lazy"
                    />
                  </div>
                  <h3 className="mt-4 font-serif text-lg text-[color:var(--ink-forest)]">
                    {v.name[l]}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">{v.note[l]}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {v.files.map((f) => (
                      <a key={f.href} href={f.href} download className={DOWNLOAD_BTN}>
                        <Download className="h-3.5 w-3.5" /> {typeof f.label === "string" ? f.label : f.label[l]}
                      </a>
                    ))}
                  </div>
                </article>
              ))}
            </div>

            {/* Iconen en avatars */}
            <h3 className="mt-10 font-serif text-xl text-[color:var(--ink-forest)] md:text-2xl">{COPY.iconsTitle[l]}</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ICON_FILES.map((icon) => (
                <a
                  key={icon.href}
                  href={icon.href}
                  download
                  className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-[color:var(--color-terracotta)]"
                >
                  <img
                    onError={handleImageError}
                    src={icon.href}
                    alt={icon.label[l]}
                    className="h-12 w-12 rounded-lg object-contain"
                    loading="lazy"
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {icon.label[l]}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {icon.size}
                    </span>
                  </span>
                </a>
              ))}
            </div>
          </section>

          {/* Merkkleuren */}
          <section id="kleuren" className="scroll-mt-24">
            <h2 className={SECTION_TITLE}>{COPY.colorsTitle[l]}</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => copy(c.hex, c.hex, `${c.hex} — ${COPY.copied[l]}`)}
                  className="rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-[color:var(--color-terracotta)]"
                >
                  <span
                    className="block h-16 w-full rounded-xl border border-border"
                    style={{ background: c.hex }}
                  />
                  <span className="mt-3 block text-sm font-medium text-foreground">
                    {c.name[l]}
                  </span>
                  <span className="mt-1 inline-flex items-center gap-2 font-mono text-xs uppercase text-muted-foreground">
                    {c.hex}
                    {copied === c.hex ? (
                      <Check className="h-3.5 w-3.5 text-[color:var(--color-terracotta)]" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </span>
                  <span className="mt-2 block text-xs text-muted-foreground">
                    {c.use[l]}
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Persfoto's, banners en link-previews op neutrale achtergrond */}
      <div className="mx-auto max-w-5xl space-y-16 px-4 py-16 md:px-8">
        {/* Persfoto's */}
        <section id="fotos" className="scroll-mt-24">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className={SECTION_TITLE}>{COPY.photosTitle[l]}</h2>
              <p className="mt-3 max-w-2xl text-sm text-muted-foreground">{COPY.photosLede[l]}</p>
            </div>
            <a
              href={PHOTOS_ZIP}
              download
              className="inline-flex items-center gap-2 rounded-full bg-[color:var(--color-terracotta)] px-5 py-3 text-sm font-semibold text-[color:var(--color-cream)] shadow-sm transition hover:opacity-90"
            >
              <Package className="h-4 w-4" /> 📦 {COPY.photosZip[l]}
            </a>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {PHOTOS.map((p) => (
              <figure
                key={p.src}
                className="overflow-hidden rounded-3xl border border-border bg-card"
              >
                <img
                  onError={handleImageError}
                  src={p.src}
                  alt={p.caption[l]}
                  className="aspect-[4/3] w-full object-cover object-[50%_40%]"
                  loading="lazy"
                />
                <figcaption className="space-y-3 p-4">
                  <span className="block text-xs text-muted-foreground">{p.caption[l]}</span>
                  <span className="flex flex-wrap gap-2">
                    <a href={p.src} download className={DOWNLOAD_BTN}>
                      <Download className="h-3.5 w-3.5" /> {COPY.download[l]}
                    </a>
                    <button
                      type="button"
                      onClick={() => setCropper({ src: p.src, alt: p.caption[l] })}
                      className={DOWNLOAD_BTN}
                    >
                      <Sliders className="h-3.5 w-3.5" /> {COPY.customDownload[l]}
                    </button>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* Webbanners & partnerkit */}
        <PartnerBanners lang={l} />

        {/* Link-previews / Open Graph */}
        <OpenGraphGenerator lang={l} />

        {/* In de media */}
        <section aria-label={COPY.mediaTitle[l]}>
          <h2 className={SECTION_TITLE}>{COPY.mediaTitle[l]}</h2>
          <ul className="mt-6 flex flex-wrap items-center gap-x-10 gap-y-4 opacity-60">
            {MEDIA_OUTLETS.map((m) => (
              <li
                key={m}
                className="font-serif text-lg uppercase tracking-[0.18em] text-[color:var(--ink-forest)] grayscale"
              >
                {m}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Standaardtekst, persberichten, citaat en contact op crème */}
      <div className="bg-background px-4 py-16 md:px-8">
        <div className="mx-auto max-w-5xl space-y-16 text-foreground">
          {/* Standaard beschrijving */}
          <section id="tekst" className="scroll-mt-24">
            <h2 className="font-serif text-2xl text-foreground md:text-3xl">
              {COPY.boilerplateTitle[l]}
            </h2>
            <div className="mt-6 rounded-3xl border border-border bg-card p-6">
              <p className="text-sm leading-relaxed text-foreground/90">{BOILERPLATE[l]}</p>
              <button
                type="button"
                onClick={() => copy(BOILERPLATE[l], "boiler", COPY.copied[l])}
                className="mt-4 inline-flex min-h-[40px] items-center gap-2 rounded-full border border-border px-4 text-xs font-medium text-foreground transition-colors hover:border-[color:var(--color-terracotta)] hover:text-[color:var(--color-terracotta)]"
              >
                {copied === "boiler" ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}{" "}
                {COPY.copyText[l]}
              </button>
            </div>
          </section>

          {/* Citaat voor de pers */}
          <section aria-label={COPY.quoteTitle[l]}>
            <h2 className="font-serif text-2xl text-foreground md:text-3xl">{COPY.quoteTitle[l]}</h2>
            <blockquote className="mt-6 rounded-3xl border-l-4 border-[color:var(--color-terracotta)] bg-card p-6">
              <Quote className="h-5 w-5 text-[color:var(--color-terracotta)]" aria-hidden />
              <p className="mt-3 font-serif text-lg italic leading-relaxed text-foreground">
                “{QUOTE[l]}”
              </p>
              <footer className="mt-3 text-xs uppercase tracking-[0.16em] text-foreground/70">
                {QUOTE_SOURCE[l]}
              </footer>
              <button
                type="button"
                onClick={() =>
                  copy(`“${QUOTE[l]}” ${QUOTE_SOURCE[l]}`, "quote", COPY.copied[l])
                }
                className="mt-4 inline-flex min-h-[40px] items-center gap-2 rounded-full border border-border px-4 text-xs font-medium text-foreground transition-colors hover:border-[color:var(--color-terracotta)] hover:text-[color:var(--color-terracotta)]"
              >
                {copied === "quote" ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}{" "}
                {COPY.copyQuote[l]}
              </button>
            </blockquote>
          </section>

          {/* Persberichten */}
          <section id="persberichten" className="scroll-mt-24">
            <h2 className="font-serif text-2xl text-foreground md:text-3xl">
              {COPY.releasesTitle[l]}
            </h2>
            <p className="mt-3 text-sm text-foreground/70">{COPY.releasesLede[l]}</p>
            <ul className="mt-6 grid gap-4 md:grid-cols-2">
              {RELEASES.map((r) => (
                <li key={r.href}>
                  <a
                    href={r.href}
                    download
                    className="flex items-center gap-4 rounded-3xl border border-border bg-card p-5 transition-colors hover:border-[color:var(--color-terracotta)]"
                  >
                    <FileText className="h-6 w-6 shrink-0 text-[color:var(--color-terracotta)]" />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-foreground">{r.name[l]}</span>
                      <span className="block text-xs text-foreground/60">PDF · {r.date}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>

          {/* Digitale soevereiniteit & tech-manifest */}
          <section id="digitaal" className="scroll-mt-24">
            <div className="overflow-hidden rounded-[2rem] border border-border bg-[color:var(--surface-forest,#1D3528)] p-8 text-[color:var(--color-cream)] md:p-12">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[color:var(--color-terracotta)]">
                {COPY.techEyebrow[l]}
              </p>
              <h2 className="mt-4 font-serif text-2xl italic md:text-4xl">{COPY.techTitle[l]}</h2>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[color:var(--color-cream)]/85 md:text-base">
                {COPY.techLede[l]}
              </p>

              <ul className="mt-10 grid gap-4 md:grid-cols-2">
                {TECH_PRINCIPLES.map((p) => {
                  const Icon = p.icon;
                  return (
                    <li
                      key={p.id}
                      className="group rounded-3xl border border-white/12 bg-white/[0.05] p-6 transition-colors hover:border-white/30"
                    >
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.06]">
                        <Icon className="h-5 w-5 text-[color:var(--color-terracotta)]" />
                      </span>
                      <h3 className="mt-4 font-serif text-lg text-[color:var(--color-cream)]">
                        {p.title[l]}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-[color:var(--color-cream)]/80">
                        {p.text[l]}
                      </p>
                      {p.link ? (
                        <a
                          href={p.link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-[color:var(--color-terracotta)] hover:underline"
                        >
                          {p.link.label} <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : null}
                    </li>
                  );
                })}
              </ul>

              <p className="mt-8 text-xs leading-relaxed text-[color:var(--color-cream)]/70">
                {COPY.techFooter[l]}{" "}
                <a
                  href="https://delplanche.cloud"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-[color:var(--color-cream)] underline underline-offset-4 hover:text-[color:var(--color-terracotta)]"
                >
                  delplanche.cloud
                </a>
              </p>
            </div>
          </section>

          {/* Perscontact */}

          <section id="contact" className="scroll-mt-24">
            <h2 className="font-serif text-2xl text-foreground md:text-3xl">
              {COPY.contactTitle[l]}
            </h2>
            <p className="mt-3 text-sm text-foreground/70">{COPY.contactLede[l]}</p>
            <div className="mt-6 flex flex-col gap-3 rounded-3xl border border-border bg-card p-6 text-sm">
              <a
                href={`mailto:${PRESS_EMAIL}`}
                className="inline-flex items-center gap-2 text-foreground hover:text-[color:var(--color-terracotta)]"
              >
                <Mail className="h-4 w-4" /> {PRESS_EMAIL}
              </a>
              <a
                href="tel:+3222015609"
                className="inline-flex items-center gap-2 text-foreground hover:text-[color:var(--color-terracotta)]"
              >
                <Phone className="h-4 w-4" /> {PRESS_PHONE}
              </a>
              <a
                href="https://www.openstreetmap.org/?mlat=50.8636&mlon=4.3560#map=17/50.8636/4.3560"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-foreground hover:text-[color:var(--color-terracotta)]"
              >
                <ExternalLink className="h-4 w-4" /> Quai du Batelage 2, 1000 Brussel
              </a>
              <span className="font-mono text-xs text-foreground/60">{SITE_URL}</span>
            </div>
            <p className="mt-6 text-xs leading-relaxed text-foreground/70">{COPY.usage[l]}</p>
          </section>
        </div>
      </div>

      <PhotoCropperModal
        open={cropper !== null}
        src={cropper?.src ?? ""}
        alt={cropper?.alt ?? ""}
        lang={l}
        onClose={() => setCropper(null)}
      />
      </main>
    </div>
  );
}

function JumpLink({ item, lang }: { item: (typeof NAV_PILLS)[number]; lang: Lang }) {
  const Icon = item.icon;
  return (
    <a href={item.href} className={DOWNLOAD_BTN_LIGHT}>
      <Icon className="h-3.5 w-3.5" aria-hidden /> {item.label[lang]}
    </a>
  );
}
