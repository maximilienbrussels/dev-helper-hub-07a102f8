/**
 * Wettelijke vermeldingen — overgenomen van lafermeduparcmaximilien.be/mentions-legales.
 */

import type { Lang } from "@/lib/i18n";

export const LEGAL_ENTITY = {
  name: "Maximilien VZW / ASBL",
  address: "Schipperijkaai 2 / Quai du Batelage 2, 1000 Brussel",
  vat: "BE 0446.485.159",
  editor: "Philippine Braye",
  editorEmail: "philippine@lafermeduparcmaximilien.be",
  hosting: "OVH",
};

export type LegalSection = { title: Record<Lang, string>; body: Record<Lang, string[]> };

export const LEGAL_COPY: Record<
  Lang,
  {
    eyebrow: string;
    title: string;
    lede: string;
    formTitle: string;
    formIntro: string;
    orgLabel: string;
    addressLabel: string;
    vatLabel: string;
    editorLabel: string;
    hostingLabel: string;
  }
> = {
  nl: {
    eyebrow: "Informatie",
    title: "Wettelijke vermeldingen",
    lede: "Gebruiksvoorwaarden van de online diensten van vzw Maximilien.",
    formTitle: "Een juridische vraag over de site?",
    formIntro: "Laat het ons weten — we bekijken het en antwoorden je persoonlijk.",
    orgLabel: "Vereniging zonder winstoogmerk",
    addressLabel: "Adres",
    vatLabel: "BTW-nummer",
    editorLabel: "Verantwoordelijke uitgever",
    hostingLabel: "Hosting",
  },
  fr: {
    eyebrow: "Informations",
    title: "Mentions légales",
    lede: "Conditions d'utilisation des services en ligne de l'ASBL Maximilien.",
    formTitle: "Une question juridique sur le site ?",
    formIntro: "Écrivez-nous — nous examinons votre demande et vous répondons personnellement.",
    orgLabel: "Association sans but lucratif",
    addressLabel: "Adresse",
    vatLabel: "Numéro de TVA",
    editorLabel: "Éditeur responsable",
    hostingLabel: "Hébergement",
  },
  en: {
    eyebrow: "Information",
    title: "Legal notice",
    lede: "Terms of use for the online services of the non-profit Maximilien.",
    formTitle: "A legal question about the site?",
    formIntro: "Write to us — we look into it and reply personally.",
    orgLabel: "Non-profit organisation",
    addressLabel: "Address",
    vatLabel: "VAT number",
    editorLabel: "Responsible editor",
    hostingLabel: "Hosting",
  },
};

export const LEGAL_SECTIONS: LegalSection[] = [
  {
    title: { nl: "Inleiding", fr: "Introduction", en: "Introduction" },
    body: {
      nl: [
        "Vzw Maximilien, Schipperijkaai 2, 1000 Brussel, ingeschreven in de KBO onder nummer BE 0446.485.159, bepaalt hierna de voorwaarden voor het gebruik van haar online diensten.",
        "Beheer van de online diensten: Philippine Braye. Hosting: OVH.",
        "Deze voorwaarden worden aangevuld door ons privacybeleid.",
      ],
      fr: [
        "L'ASBL Maximilien, Quai du Batelage 2, 1000 Bruxelles, inscrite à la BCE sous le n° BE 0446.485.159, définit dans les présentes les conditions d'utilisation de ses services en ligne.",
        "Gestion des services en ligne : Philippine Braye. Hébergement : OVH.",
        "Ces conditions sont complétées par notre politique de confidentialité.",
      ],
      en: [
        "The non-profit Maximilien, Quai du Batelage 2, 1000 Brussels, registered with the Belgian Crossroads Bank under BE 0446.485.159, sets out below the conditions for using its online services.",
        "Online services management: Philippine Braye. Hosting: OVH.",
        "These terms are completed by our privacy policy.",
      ],
    },
  },
  {
    title: { nl: "Aansprakelijkheid", fr: "Responsabilité", en: "Liability" },
    body: {
      nl: [
        "De toegang tot en het gebruik van de site gebeuren onder de volledige verantwoordelijkheid van de gebruiker.",
        "De boerderij doet al het mogelijke om correcte informatie te verstrekken.",
        "De boerderij garandeert niet dat de diensten op elk moment bereikbaar zijn.",
        "De gebruiker is als enige verantwoordelijk voor de beveiliging van zijn eigen apparatuur.",
        "Aansprakelijkheid voor indirecte schade is uitgesloten.",
      ],
      fr: [
        "L'accès et l'utilisation du site sont soumis à l'entière responsabilité de l'utilisateur.",
        "La ferme met tout en œuvre pour délivrer une information correcte.",
        "La ferme ne garantit pas que les services seront accessibles à tout moment.",
        "L'utilisateur est seul responsable de la sécurité de son équipement informatique.",
        "La responsabilité pour les dommages indirects est exclue.",
      ],
      en: [
        "Access to and use of the site are entirely the user's responsibility.",
        "The farm does everything possible to provide accurate information.",
        "The farm does not guarantee that the services are available at all times.",
        "Users are solely responsible for the security of their own equipment.",
        "Liability for indirect damages is excluded.",
      ],
    },
  },
  {
    title: { nl: "Gebruiksvoorwaarden", fr: "Conditions d'accès", en: "Conditions of access" },
    body: {
      nl: [
        "De gebruiker onthoudt zich van elke handeling die in strijd is met de wet en verbindt zich ertoe:",
        "de diensten als een goede huisvader te gebruiken;",
        "juiste informatie mee te delen;",
        "de informatie niet te wijzigen zonder akkoord;",
        "de inhoud niet te reproduceren zonder toestemming.",
      ],
      fr: [
        "L'utilisateur s'interdit tout acte contraire à la loi et s'engage à :",
        "utiliser les services en bon père de famille ;",
        "communiquer des informations exactes ;",
        "ne pas modifier les informations sans accord ;",
        "ne pas reproduire le contenu sans autorisation.",
      ],
      en: [
        "Users refrain from any unlawful act and undertake to:",
        "use the services with due care;",
        "provide accurate information;",
        "not alter information without agreement;",
        "not reproduce content without permission.",
      ],
    },
  },
  {
    title: {
      nl: "Intellectuele eigendom",
      fr: "Propriété intellectuelle",
      en: "Intellectual property",
    },
    body: {
      nl: [
        "De boerderij blijft eigenaar van alle rechten op teksten, logo's en beelden. Elke reproductie zonder toestemming is verboden.",
      ],
      fr: [
        "La ferme reste propriétaire de tous les droits relatifs aux textes, logos et images. Toute reproduction est interdite sans autorisation.",
      ],
      en: [
        "The farm retains all rights to texts, logos and images. Any reproduction without permission is prohibited.",
      ],
    },
  },
  {
    title: { nl: "Beschikbaarheid", fr: "Disponibilité", en: "Availability" },
    body: {
      nl: ["We streven naar beschikbaarheid 7 dagen op 7 en 24 uur op 24, zonder gegarandeerde permanente toegang."],
      fr: ["Nous visons une disponibilité 7j/7 et 24h/24, sans garantie d'accès permanent."],
      en: ["We aim for availability 24/7, without any guarantee of permanent access."],
    },
  },
  {
    title: { nl: "Wijzigingen", fr: "Modification", en: "Changes" },
    body: {
      nl: ["De boerderij behoudt zich het recht voor de informatie op elk moment te wijzigen."],
      fr: ["La ferme se réserve le droit de modifier les informations à tout moment."],
      en: ["The farm reserves the right to change the information at any time."],
    },
  },
  {
    title: { nl: "Persoonsgegevens", fr: "Données personnelles", en: "Personal data" },
    body: {
      nl: [
        "We besteden de grootste zorg aan de bescherming van je gegevens. Alle details staan in ons privacybeleid.",
      ],
      fr: [
        "Nous consacrons le plus grand soin à la protection de vos données. Consultez notre politique de confidentialité pour le détail.",
      ],
      en: [
        "We take the greatest care in protecting your data. See our privacy policy for the details.",
      ],
    },
  },
  {
    title: { nl: "Diversen", fr: "Divers", en: "Miscellaneous" },
    body: {
      nl: ["Het Belgische recht is van toepassing. Geschillen behoren tot de bevoegdheid van de Belgische rechtbanken."],
      fr: ["Le droit belge est applicable. Tout litige relève des tribunaux belges compétents."],
      en: ["Belgian law applies. Any dispute falls under the competent Belgian courts."],
    },
  },
];
