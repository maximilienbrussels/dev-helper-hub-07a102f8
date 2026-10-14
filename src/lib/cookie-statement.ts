/**
 * Cookie-statement — drietalig.
 * De site zet geen tracking- of advertentiecookies; daarom is er geen banner.
 */
import type { Lang } from "@/lib/i18n";
import type { LegalDoc } from "@/lib/legal-pages";

export const COOKIES_DOC: Record<Lang, LegalDoc> = {
  nl: {
    eyebrow: "Cookies",
    title: "Cookie-statement",
    lede: "Deze site zet geen tracking-, advertentie- of analysecookies. Daarom krijg je hier ook geen cookiebanner te zien.",
    updated: "Laatst bijgewerkt: september 2026",
    blocks: [
      {
        h: "1. Geen toestemming nodig",
        p: [
          "De Europese regels vragen enkel toestemming voor cookies die niet strikt noodzakelijk zijn. Wij plaatsen zulke cookies niet, dus is er geen banner en geen keuzescherm.",
          "Je kan de hele site gebruiken zonder ooit iets weg te klikken.",
        ],
      },
      {
        h: "2. Wat we wel bewaren",
        ul: [
          "Sessie: houdt je aangemeld zolang je ingelogd bent. Verdwijnt bij uitloggen.",
          "Taalkeuze: onthoudt of je de site in het Nederlands, Frans of Engels leest.",
          "Winkelmandje: bewaart je bestelling tot je afrekent of het mandje leegmaakt.",
          "Beveiliging: een korte technische sleutel tegen misbruik van formulieren.",
        ],
        p: [
          "Deze gegevens blijven in je eigen browser en worden nooit gebruikt om je te profileren of te volgen.",
        ],
      },
      {
        h: "3. Wat we niet doen",
        ul: [
          "Geen Google Analytics of andere externe meetdiensten.",
          "Geen advertentiepixels van sociale media.",
          "Geen fingerprinting of profielopbouw over websites heen.",
          "Geen leesbevestigingen of trackingpixels in onze e-mails.",
          "Geen doorverkoop of deling van gegevens met adverteerders.",
        ],
      },
      {
        h: "4. Ingesloten inhoud van derden",
        p: [
          "Sommige pagina's tonen kaartmateriaal of video. Die inhoud laden we pas na een klik, zodat er zonder jouw actie niets naar derden vertrekt.",
        ],
      },
      {
        h: "5. Zelf wissen",
        p: [
          "Je kan deze lokale gegevens altijd verwijderen via de instellingen van je browser. De site blijft werken; je bent dan gewoon uitgelogd en je taalkeuze wordt opnieuw gevraagd.",
        ],
      },
    ],
    footnote:
      "Vragen over cookies of privacy? Schrijf naar contact@maximilien.brussels. Meer details vind je in ons privacybeleid.",
  },
  fr: {
    eyebrow: "Cookies",
    title: "Déclaration cookies",
    lede: "Ce site ne dépose aucun cookie de suivi, publicitaire ou d'analyse. C'est pourquoi aucune bannière cookies ne s'affiche.",
    updated: "Dernière mise à jour : septembre 2026",
    blocks: [
      {
        h: "1. Aucun consentement requis",
        p: [
          "Les règles européennes n'exigent un consentement que pour les cookies non strictement nécessaires. Nous n'en déposons aucun : ni bannière, ni écran de choix.",
          "Vous pouvez utiliser tout le site sans jamais rien devoir écarter.",
        ],
      },
      {
        h: "2. Ce que nous conservons",
        ul: [
          "Session : vous garde connecté·e tant que vous êtes identifié·e. Disparaît à la déconnexion.",
          "Choix de langue : retient si vous lisez le site en néerlandais, français ou anglais.",
          "Panier : conserve votre commande jusqu'au paiement ou jusqu'à ce que vous le vidiez.",
          "Sécurité : une courte clé technique contre l'abus des formulaires.",
        ],
        p: [
          "Ces données restent dans votre navigateur et ne servent jamais à vous profiler ou vous suivre.",
        ],
      },
      {
        h: "3. Ce que nous ne faisons pas",
        ul: [
          "Pas de Google Analytics ni d'autre service de mesure externe.",
          "Pas de pixels publicitaires de réseaux sociaux.",
          "Pas d'empreinte numérique ni de profilage entre sites.",
          "Pas d'accusés de lecture ni de pixels de suivi dans nos e-mails.",
          "Aucune revente ou partage de données avec des annonceurs.",
        ],
      },
      {
        h: "4. Contenus tiers intégrés",
        p: [
          "Certaines pages proposent une carte ou une vidéo. Ces contenus ne se chargent qu'après un clic : rien ne part vers un tiers sans votre action.",
        ],
      },
      {
        h: "5. Effacer vous-même",
        p: [
          "Vous pouvez supprimer ces données locales à tout moment dans les réglages de votre navigateur. Le site continue de fonctionner : vous serez simplement déconnecté·e et votre langue sera redemandée.",
        ],
      },
    ],
    footnote:
      "Des questions sur les cookies ou la vie privée ? Écrivez à contact@maximilien.brussels. Plus de détails dans notre politique de confidentialité.",
  },
  en: {
    eyebrow: "Cookies",
    title: "Cookie statement",
    lede: "This site sets no tracking, advertising or analytics cookies. That is why you will never see a cookie banner here.",
    updated: "Last updated: September 2026",
    blocks: [
      {
        h: "1. No consent needed",
        p: [
          "European rules only require consent for cookies that are not strictly necessary. We set none of those, so there is no banner and no consent screen.",
          "You can use the entire site without ever clicking anything away.",
        ],
      },
      {
        h: "2. What we do store",
        ul: [
          "Session: keeps you signed in while you are logged in. Cleared on sign-out.",
          "Language choice: remembers whether you read the site in Dutch, French or English.",
          "Basket: keeps your order until you check out or empty it.",
          "Security: a short technical key that protects our forms from abuse.",
        ],
        p: [
          "This data stays inside your own browser and is never used to profile or follow you.",
        ],
      },
      {
        h: "3. What we do not do",
        ul: [
          "No Google Analytics or other external measurement services.",
          "No social-media advertising pixels.",
          "No fingerprinting or cross-site profiling.",
          "No read receipts or tracking pixels in our e-mails.",
          "No selling or sharing of data with advertisers.",
        ],
      },
      {
        h: "4. Embedded third-party content",
        p: [
          "Some pages offer a map or a video. That content only loads after a click, so nothing leaves for a third party without your action.",
        ],
      },
      {
        h: "5. Clearing it yourself",
        p: [
          "You can delete this local data at any time in your browser settings. The site keeps working: you will simply be signed out and asked for your language again.",
        ],
      },
    ],
    footnote:
      "Questions about cookies or privacy? Write to contact@maximilien.brussels. More detail is in our privacy policy.",
  },
};
