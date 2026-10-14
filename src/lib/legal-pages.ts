/**
 * Juridische pagina's — privacybeleid en algemene voorwaarden.
 * Beknopt, Belgisch/Europees, drietalig. Geen marketingtaal.
 */

import type { Lang } from "@/lib/i18n";

export type LegalBlock = { h: string; p?: string[]; ul?: string[] };

export type LegalDoc = {
  eyebrow: string;
  title: string;
  lede: string;
  updated: string;
  blocks: LegalBlock[];
  footnote: string;
};

const UPDATED = { nl: "Laatst bijgewerkt: september 2026", fr: "Dernière mise à jour : septembre 2026", en: "Last updated: September 2026" };

export const PRIVACY_DOC: Record<Lang, LegalDoc> = {
  nl: {
    eyebrow: "Privacy",
    title: "Privacybeleid",
    lede: "Wie we zijn, welke gegevens we verwerken en welke rechten je hebt onder de AVG (GDPR).",
    updated: UPDATED.nl,
    footnote:
      "Vragen over dit beleid of over je gegevens? Schrijf naar contact@maximilien.brussels. We antwoorden binnen 30 dagen.",
    blocks: [
      {
        h: "1. Verwerkingsverantwoordelijke",
        p: [
          "Maximilien vzw, Schipperijkaai 2, 1000 Brussel, ondernemingsnummer BE 0446.485.159, is verantwoordelijk voor de verwerking van je persoonsgegevens.",
          "Contact voor privacyvragen: contact@maximilien.brussels.",
        ],
      },
      {
        h: "2. Welke gegevens en waarom",
        p: ["We verwerken enkel gegevens die je zelf doorgeeft, en enkel voor het doel waarvoor je ze geeft."],
        ul: [
          "Account: naam, e-mailadres, taal en inloggegevens — om je toegang te geven tot je reservaties, bestellingen en certificaten (uitvoering van de overeenkomst).",
          "Reservaties (zaalverhuur, schoolanimaties, workshops, verjaardagen): contactgegevens, organisatie, datum, groepsgrootte en praktische opmerkingen — om je aanvraag te behandelen en de dag voor te bereiden (uitvoering van de overeenkomst).",
          "Webshopbestellingen: naam, e-mailadres, bestelde producten en afhaalmoment — om de bestelling klaar te zetten en de factuur op te maken (overeenkomst en wettelijke boekhoudplicht).",
          "Contactformulieren: naam, e-mailadres en je bericht — om je vraag te beantwoorden (gerechtvaardigd belang).",
          "Academy: voornaam en score — om je certificaat op te maken en te kunnen verifiëren (uitvoering van de overeenkomst).",
        ],
      },
      {
        h: "3. Transactionele e-mails",
        p: [
          "Bevestigingen, herinneringen, afhaalberichten en certificaten versturen we via Brevo (Sendinblue SAS, Frankrijk), onze verwerker voor transactionele e-mail.",
          "Die mails vertrekken via een apart, geïsoleerd subdomein (send.maximilien.site) en bevatten geen leesbevestigingen of trackingpixels.",
          "Deze e-mails horen bij je aanvraag of bestelling. We versturen geen commerciële nieuwsbrief zonder je uitdrukkelijke toestemming, en elke nieuwsbrief bevat een uitschrijflink.",
        ],
      },
      {
        h: "4. Waar je gegevens staan",
        p: [
          "Onze databank draait bij Neon in een Europese regio. Foto's en documenten staan bij Scaleway (Frankrijk). Betalingen verlopen via Stripe; wij ontvangen nooit je kaartgegevens.",
          "Alle verwerkers zijn gebonden door een verwerkersovereenkomst conform artikel 28 AVG. We verplaatsen je gegevens niet buiten de Europese Economische Ruimte zonder een geldig doorgiftemechanisme.",
        ],
      },
      {
        h: "5. Cookies en meting",
        p: [
          "We plaatsen enkel functionele cookies: je sessie, je taalkeuze en je winkelmandje. Daarvoor is geen toestemming vereist.",
          "Geen advertentiecookies, geen trackingpixels, geen externe analysediensten en geen leesbevestigingen in onze e-mails.",
        ],
      },
      {
        h: "6. Bewaartermijnen",
        ul: [
          "Contactberichten: maximaal 2 jaar.",
          "Reservaties en bestellingen: 7 jaar, zoals de boekhoudwetgeving voorschrijft.",
          "Account en certificaten: zolang je je account behoudt; daarna verwijderen we ze binnen 30 dagen.",
          "Serverlogs: maximaal 12 maanden, voor beveiliging en foutopsporing.",
        ],
      },
      {
        h: "7. Wie je gegevens ziet",
        p: [
          "Enkel medewerkers en vrijwilligers die je vraag behandelen, met toegangsrechten per rol. We verkopen of verhuren je gegevens nooit.",
          "We delen gegevens enkel met de hierboven genoemde verwerkers, of wanneer een wettelijke verplichting ons daartoe dwingt.",
        ],
      },
      {
        h: "8. Je rechten",
        p: [
          "Je hebt recht op inzage, verbetering, verwijdering, beperking en overdraagbaarheid van je gegevens, en je kan bezwaar maken tegen een verwerking op basis van gerechtvaardigd belang. Gegeven toestemming kan je altijd intrekken.",
          "Stuur je vraag naar contact@maximilien.brussels. Ben je niet tevreden met ons antwoord, dan kan je klacht indienen bij de Gegevensbeschermingsautoriteit, Drukpersstraat 35, 1000 Brussel — gegevensbeschermingsautoriteit.be.",
        ],
      },
      {
        h: "9. Kinderen",
        p: [
          "Voor schoolbezoeken en stages werken we met de gegevens van de school of de ouder, niet met accounts van kinderen. Deelnemerslijsten verwijderen we na afloop van de activiteit.",
        ],
      },
      {
        h: "10. Wijzigingen",
        p: [
          "We passen dit beleid aan wanneer onze diensten of verwerkers wijzigen. De datum bovenaan geeft de laatste versie aan.",
        ],
      },
    ],
  },
  fr: {
    eyebrow: "Confidentialité",
    title: "Politique de confidentialité",
    lede: "Qui nous sommes, quelles données nous traitons et quels droits vous avez au titre du RGPD.",
    updated: UPDATED.fr,
    footnote:
      "Une question sur cette politique ou sur vos données ? Écrivez à contact@maximilien.brussels. Nous répondons sous 30 jours.",
    blocks: [
      {
        h: "1. Responsable du traitement",
        p: [
          "L'ASBL Maximilien, Quai du Batelage 2, 1000 Bruxelles, numéro d'entreprise BE 0446.485.159, est responsable du traitement de vos données à caractère personnel.",
          "Contact pour les questions de confidentialité : contact@maximilien.brussels.",
        ],
      },
      {
        h: "2. Quelles données et pourquoi",
        p: ["Nous ne traitons que les données que vous nous transmettez, et uniquement pour la finalité prévue."],
        ul: [
          "Compte : nom, adresse e-mail, langue et données de connexion — pour vous donner accès à vos réservations, commandes et certificats (exécution du contrat).",
          "Réservations (location de salle, animations scolaires, ateliers, anniversaires) : coordonnées, organisation, date, taille du groupe et remarques pratiques — pour traiter votre demande et préparer la journée (exécution du contrat).",
          "Commandes de la boutique : nom, e-mail, produits commandés et créneau de retrait — pour préparer la commande et établir la facture (contrat et obligation comptable).",
          "Formulaires de contact : nom, e-mail et message — pour répondre à votre question (intérêt légitime).",
          "Académie : prénom et score — pour établir et vérifier votre certificat (exécution du contrat).",
        ],
      },
      {
        h: "3. E-mails transactionnels",
        p: [
          "Confirmations, rappels, avis de retrait et certificats sont envoyés via Brevo (Sendinblue SAS, France), notre sous-traitant pour l'e-mail transactionnel.",
          "Ces e-mails partent d'un sous-domaine distinct et isolé (send.maximilien.site) et ne contiennent ni accusés de lecture ni pixels de suivi.",
          "Ces e-mails font partie de votre demande ou commande. Aucune newsletter commerciale n'est envoyée sans votre consentement explicite, et chaque newsletter comporte un lien de désinscription.",
        ],
      },
      {
        h: "4. Où sont vos données",
        p: [
          "Notre base de données est hébergée chez Neon dans une région européenne. Les photos et documents sont stockés chez Scaleway (France). Les paiements passent par Stripe ; nous ne recevons jamais vos données de carte.",
          "Tous nos sous-traitants sont liés par un contrat conforme à l'article 28 du RGPD. Nous ne transférons pas vos données hors de l'Espace économique européen sans mécanisme de transfert valable.",
        ],
      },
      {
        h: "5. Cookies et mesure d'audience",
        p: [
          "Nous n'utilisons que des cookies fonctionnels : session, choix de langue et panier. Ils ne nécessitent pas de consentement.",
          "Pas de cookies publicitaires, pas de pixels de suivi, pas de services d'analyse externes et pas d'accusés de lecture dans nos e-mails.",
        ],
      },
      {
        h: "6. Durées de conservation",
        ul: [
          "Messages de contact : 2 ans maximum.",
          "Réservations et commandes : 7 ans, comme l'impose la législation comptable.",
          "Compte et certificats : tant que vous conservez votre compte ; ensuite supprimés sous 30 jours.",
          "Journaux serveur : 12 mois maximum, pour la sécurité et le dépannage.",
        ],
      },
      {
        h: "7. Qui accède à vos données",
        p: [
          "Uniquement les membres de l'équipe et les bénévoles qui traitent votre demande, avec des droits d'accès par rôle. Nous ne vendons ni ne louons jamais vos données.",
          "Nous ne les partageons qu'avec les sous-traitants cités ci-dessus, ou lorsqu'une obligation légale nous y contraint.",
        ],
      },
      {
        h: "8. Vos droits",
        p: [
          "Vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation et de portabilité, et vous pouvez vous opposer à un traitement fondé sur l'intérêt légitime. Un consentement donné peut être retiré à tout moment.",
          "Adressez votre demande à contact@maximilien.brussels. Si notre réponse ne vous satisfait pas, vous pouvez introduire une plainte auprès de l'Autorité de protection des données, Rue de la Presse 35, 1000 Bruxelles — autoriteprotectiondonnees.be.",
        ],
      },
      {
        h: "9. Enfants",
        p: [
          "Pour les visites scolaires et les stages, nous travaillons avec les données de l'école ou du parent, jamais avec des comptes d'enfants. Les listes de participants sont supprimées après l'activité.",
        ],
      },
      {
        h: "10. Modifications",
        p: [
          "Nous adaptons cette politique lorsque nos services ou sous-traitants évoluent. La date en haut de page indique la dernière version.",
        ],
      },
    ],
  },
  en: {
    eyebrow: "Privacy",
    title: "Privacy policy",
    lede: "Who we are, which data we process and the rights you have under the GDPR.",
    updated: UPDATED.en,
    footnote:
      "Questions about this policy or your data? Write to contact@maximilien.brussels. We reply within 30 days.",
    blocks: [
      {
        h: "1. Data controller",
        p: [
          "Maximilien non-profit (ASBL/VZW), Quai du Batelage 2, 1000 Brussels, company number BE 0446.485.159, is the controller of your personal data.",
          "Privacy contact: contact@maximilien.brussels.",
        ],
      },
      {
        h: "2. What we process and why",
        p: ["We only process data you give us yourself, and only for the purpose it was given for."],
        ul: [
          "Account: name, e-mail address, language and sign-in credentials — to give you access to your bookings, orders and certificates (performance of the contract).",
          "Bookings (venue rental, school activities, workshops, birthdays): contact details, organisation, date, group size and practical notes — to handle your request and prepare the day (performance of the contract).",
          "Farm shop orders: name, e-mail, ordered products and pickup slot — to prepare the order and issue the invoice (contract and statutory accounting duty).",
          "Contact forms: name, e-mail and your message — to answer your question (legitimate interest).",
          "Academy: first name and score — to issue and verify your certificate (performance of the contract).",
        ],
      },
      {
        h: "3. Transactional e-mail",
        p: [
          "Confirmations, reminders, pickup notices and certificates are sent through Brevo (Sendinblue SAS, France), our processor for transactional e-mail.",
          "Those emails are sent from a separate, isolated subdomain (send.maximilien.site) and contain no read receipts or tracking pixels.",
          "These messages are part of your request or order. We send no commercial newsletter without your explicit consent, and every newsletter carries an unsubscribe link.",
        ],
      },
      {
        h: "4. Where your data lives",
        p: [
          "Our database runs on Neon in a European region. Photos and documents are stored with Scaleway (France). Payments go through Stripe; we never receive your card details.",
          "All processors are bound by a data processing agreement under Article 28 GDPR. We do not move your data outside the European Economic Area without a valid transfer mechanism.",
        ],
      },
      {
        h: "5. Cookies and measurement",
        p: [
          "We set functional cookies only: your session, your language choice and your basket. These require no consent.",
          "No advertising cookies, no tracking pixels, no external analytics services and no read receipts in our e-mails.",
        ],
      },
      {
        h: "6. Retention periods",
        ul: [
          "Contact messages: 2 years maximum.",
          "Bookings and orders: 7 years, as accounting law requires.",
          "Account and certificates: for as long as you keep your account; deleted within 30 days after closure.",
          "Server logs: 12 months maximum, for security and troubleshooting.",
        ],
      },
      {
        h: "7. Who can see your data",
        p: [
          "Only staff and volunteers handling your request, with role-based access rights. We never sell or rent your data.",
          "We share data only with the processors named above, or where a legal obligation requires it.",
        ],
      },
      {
        h: "8. Your rights",
        p: [
          "You have the right to access, rectification, erasure, restriction and portability, and you may object to processing based on legitimate interest. Consent given can be withdrawn at any time.",
          "Send your request to contact@maximilien.brussels. If our answer does not satisfy you, you can lodge a complaint with the Belgian Data Protection Authority, Rue de la Presse 35, 1000 Brussels — dataprotectionauthority.be.",
        ],
      },
      {
        h: "9. Children",
        p: [
          "For school visits and camps we work with the data of the school or the parent, never with children's accounts. Participant lists are deleted after the activity.",
        ],
      },
      {
        h: "10. Changes",
        p: [
          "We update this policy when our services or processors change. The date at the top shows the current version.",
        ],
      },
    ],
  },
};

export const TERMS_DOC: Record<Lang, LegalDoc> = {
  nl: {
    eyebrow: "Voorwaarden",
    title: "Algemene voorwaarden",
    lede: "De afspraken voor zaalverhuur, schoolanimaties, workshops en bestellingen in de hoevewinkel.",
    updated: UPDATED.nl,
    footnote:
      "Een vraag over deze voorwaarden of over een reservatie? Schrijf naar contact@maximilien.brussels.",
    blocks: [
      {
        h: "1. Toepassing",
        p: [
          "Deze voorwaarden gelden voor elke reservatie, inschrijving en bestelling bij Maximilien vzw, Schipperijkaai 2, 1000 Brussel, BE 0446.485.159.",
          "Afwijkingen gelden enkel wanneer we ze schriftelijk bevestigen. Bij tegenstrijdigheid heeft de schriftelijke offerte voorrang op deze voorwaarden.",
        ],
      },
      {
        h: "2. Reservaties en bevestiging",
        p: [
          "Een aanvraag via de site is een voorstel, geen reservatie. De reservatie komt tot stand zodra wij ze per e-mail bevestigen met datum, uur, formule en prijs.",
          "Voor zaalverhuur en teambuilding kan een voorschot van 30 % gevraagd worden; de datum wordt pas vastgelegd na ontvangst daarvan.",
        ],
      },
      {
        h: "3. Prijzen en betaling",
        p: [
          "Prijzen staan in euro. Als vzw factureren we onze pedagogische activiteiten zonder btw; op verhuur en producten vermelden we de btw op de factuur.",
          "Online betalingen verlopen via Stripe. Facturen zijn betaalbaar binnen 14 dagen, tenzij anders overeengekomen.",
        ],
      },
      {
        h: "4. Annulering door jou",
        ul: [
          "Zaalverhuur, seminaries en teambuilding: kosteloos tot 30 dagen vooraf; 50 % tussen 30 en 7 dagen; 100 % binnen 7 dagen.",
          "Schoolanimaties en workshops: kosteloos verplaatsen tot 14 dagen vooraf; daarna rekenen we 50 % aan, binnen 48 uur het volledige bedrag.",
          "Vakantiestages: kosteloos tot 21 dagen vooraf; daarna terugbetaling enkel op medisch attest.",
          "Annuleren doe je per e-mail; de datum van je e-mail telt.",
        ],
      },
      {
        h: "5. Annulering of wijziging door ons",
        p: [
          "Kunnen we een activiteit niet laten doorgaan door overmacht — extreem weer, dierenziekte, sluiting van het park of een technisch probleem — dan stellen we een nieuwe datum voor of betalen we het betaalde bedrag volledig terug.",
          "Onze activiteiten gaan grotendeels buiten door. Bij slecht weer passen we het programma aan; dat is geen grond voor terugbetaling.",
        ],
      },
      {
        h: "6. Hoevewinkel",
        p: [
          "Bestellingen worden afgehaald op de boerderij tijdens het gekozen afhaalmoment. We verzenden niet.",
          "Verse producten hangen af van de oogst en de dieren; bij onbeschikbaarheid bieden we een alternatief of betalen we dat artikel terug. Niet-afgehaalde bestellingen bewaren we tot 48 uur na het afhaalmoment.",
        ],
      },
      {
        h: "7. Herroepingsrecht",
        p: [
          "Als consument heb je 14 dagen herroepingsrecht op online aankopen. Dat recht geldt niet voor snel bederfelijke producten (artikel VI.53 Wetboek economisch recht) en niet voor een activiteit met een afgesproken datum, zoals een verhuur, animatie of stage.",
          "Voor niet-bederfelijke artikelen volstaat een e-mail naar contact@maximilien.brussels binnen 14 dagen na afhaling.",
        ],
      },
      {
        h: "8. Op de boerderij",
        p: [
          "De boerderij is een levende landbouwsite. Volg altijd de aanwijzingen van het team, blijf op de aangeduide paden en voeder de dieren niet zonder toestemming.",
          "Kinderen blijven onder toezicht van hun ouders, leerkrachten of begeleiders. Bij schoolbezoeken zorgt de school voor voldoende begeleiders volgens de afgesproken verhouding.",
          "Roken, alcohol buiten afspraak, drones en honden zijn niet toegelaten op het erf.",
        ],
      },
      {
        h: "9. Aansprakelijkheid",
        p: [
          "We zijn verzekerd voor burgerlijke aansprakelijkheid. Onze aansprakelijkheid blijft beperkt tot het bedrag van de reservatie of bestelling, behalve bij opzet, zware fout of lichamelijke schade.",
          "De huurder is aansprakelijk voor schade aan de infrastructuur, het materiaal of de dieren die door zijn groep wordt veroorzaakt. Persoonlijke bezittingen blijven onder je eigen verantwoordelijkheid.",
        ],
      },
      {
        h: "10. Beeldmateriaal",
        p: [
          "Tijdens activiteiten maken we soms foto's. Publicatie gebeurt enkel met toestemming; bij groepen vragen we die via de school of organisator. Je kan je verzet op elk moment melden en we verwijderen het beeld.",
        ],
      },
      {
        h: "11. Gebruik van de website",
        p: [
          "Teksten, foto's, illustraties en het logo blijven eigendom van de vzw. Overname zonder schriftelijke toestemming is niet toegelaten; voor pers stellen we een mediakit ter beschikking.",
          "We streven naar een permanent beschikbare site, maar garanderen geen ononderbroken toegang.",
        ],
      },
      {
        h: "12. Klachten en toepasselijk recht",
        p: [
          "Meld een klacht binnen 14 dagen na de activiteit of levering via contact@maximilien.brussels. We zoeken eerst samen een oplossing.",
          "Het Belgische recht is van toepassing. Geschillen behoren tot de bevoegdheid van de rechtbanken van Brussel. Consumenten kunnen ook terecht bij het Europese ODR-platform (ec.europa.eu/consumers/odr).",
        ],
      },
    ],
  },
  fr: {
    eyebrow: "Conditions",
    title: "Conditions générales",
    lede: "Les règles applicables à la location de salle, aux animations scolaires, aux ateliers et aux commandes de la boutique.",
    updated: UPDATED.fr,
    footnote:
      "Une question sur ces conditions ou sur une réservation ? Écrivez à contact@maximilien.brussels.",
    blocks: [
      {
        h: "1. Champ d'application",
        p: [
          "Ces conditions s'appliquent à toute réservation, inscription et commande auprès de l'ASBL Maximilien, Quai du Batelage 2, 1000 Bruxelles, BE 0446.485.159.",
          "Toute dérogation doit être confirmée par écrit. En cas de contradiction, l'offre écrite prime sur les présentes conditions.",
        ],
      },
      {
        h: "2. Réservation et confirmation",
        p: [
          "Une demande introduite via le site est une proposition, pas une réservation. Celle-ci naît dès notre confirmation par e-mail mentionnant date, heure, formule et prix.",
          "Pour la location de salle et le team building, un acompte de 30 % peut être demandé ; la date n'est bloquée qu'à sa réception.",
        ],
      },
      {
        h: "3. Prix et paiement",
        p: [
          "Les prix sont exprimés en euros. En tant qu'ASBL, nous facturons nos activités pédagogiques sans TVA ; pour les locations et les produits, la TVA figure sur la facture.",
          "Les paiements en ligne passent par Stripe. Les factures sont payables sous 14 jours, sauf accord contraire.",
        ],
      },
      {
        h: "4. Annulation de votre part",
        ul: [
          "Location de salle, séminaires et team building : sans frais jusqu'à 30 jours avant ; 50 % entre 30 et 7 jours ; 100 % dans les 7 jours.",
          "Animations scolaires et ateliers : report gratuit jusqu'à 14 jours avant ; ensuite 50 %, et la totalité dans les 48 heures.",
          "Stages de vacances : sans frais jusqu'à 21 jours avant ; ensuite remboursement uniquement sur certificat médical.",
          "L'annulation se fait par e-mail ; la date de votre e-mail fait foi.",
        ],
      },
      {
        h: "5. Annulation ou modification de notre part",
        p: [
          "Si une activité ne peut avoir lieu pour cause de force majeure — météo extrême, maladie animale, fermeture du parc ou incident technique — nous proposons une nouvelle date ou remboursons intégralement les sommes versées.",
          "Nos activités se déroulent essentiellement en extérieur. En cas de mauvais temps, nous adaptons le programme ; cela ne donne pas lieu à remboursement.",
        ],
      },
      {
        h: "6. Boutique fermière",
        p: [
          "Les commandes se retirent à la ferme pendant le créneau choisi. Nous n'expédions pas.",
          "Les produits frais dépendent des récoltes et des animaux ; en cas d'indisponibilité, nous proposons une alternative ou remboursons l'article. Les commandes non retirées sont conservées 48 heures après le créneau.",
        ],
      },
      {
        h: "7. Droit de rétractation",
        p: [
          "En tant que consommateur, vous disposez de 14 jours de rétractation pour un achat en ligne. Ce droit ne s'applique pas aux denrées périssables (article VI.53 du Code de droit économique) ni aux activités à date convenue, telles qu'une location, une animation ou un stage.",
          "Pour les articles non périssables, un e-mail à contact@maximilien.brussels dans les 14 jours du retrait suffit.",
        ],
      },
      {
        h: "8. Sur le site de la ferme",
        p: [
          "La ferme est un site agricole vivant. Suivez les consignes de l'équipe, restez sur les chemins indiqués et ne nourrissez pas les animaux sans autorisation.",
          "Les enfants restent sous la surveillance de leurs parents, enseignants ou accompagnants. Pour les visites scolaires, l'école assure le nombre d'accompagnants convenu.",
          "Le tabac, l'alcool hors accord préalable, les drones et les chiens ne sont pas admis dans la cour.",
        ],
      },
      {
        h: "9. Responsabilité",
        p: [
          "Nous sommes assurés en responsabilité civile. Notre responsabilité est limitée au montant de la réservation ou de la commande, sauf dol, faute lourde ou dommage corporel.",
          "Le locataire répond des dégâts causés par son groupe aux infrastructures, au matériel ou aux animaux. Les effets personnels restent sous votre responsabilité.",
        ],
      },
      {
        h: "10. Images",
        p: [
          "Des photos sont parfois prises pendant les activités. Toute publication se fait avec accord ; pour les groupes, il est demandé via l'école ou l'organisateur. Vous pouvez vous y opposer à tout moment et l'image sera retirée.",
        ],
      },
      {
        h: "11. Utilisation du site web",
        p: [
          "Textes, photos, illustrations et logo restent la propriété de l'ASBL. Toute reprise sans autorisation écrite est interdite ; un kit média est disponible pour la presse.",
          "Nous visons une disponibilité permanente du site, sans pouvoir garantir un accès ininterrompu.",
        ],
      },
      {
        h: "12. Réclamations et droit applicable",
        p: [
          "Introduisez toute réclamation dans les 14 jours suivant l'activité ou la livraison via contact@maximilien.brussels. Nous cherchons d'abord une solution ensemble.",
          "Le droit belge est applicable. Les litiges relèvent des tribunaux de Bruxelles. Les consommateurs peuvent aussi recourir à la plateforme européenne RLL (ec.europa.eu/consumers/odr).",
        ],
      },
    ],
  },
  en: {
    eyebrow: "Terms",
    title: "Terms and conditions",
    lede: "The rules for venue rental, school activities, workshops and farm shop orders.",
    updated: UPDATED.en,
    footnote: "A question about these terms or about a booking? Write to contact@maximilien.brussels.",
    blocks: [
      {
        h: "1. Scope",
        p: [
          "These terms apply to every booking, registration and order with Maximilien non-profit, Quai du Batelage 2, 1000 Brussels, BE 0446.485.159.",
          "Any departure from them applies only when we confirm it in writing. In case of conflict, the written quote prevails over these terms.",
        ],
      },
      {
        h: "2. Bookings and confirmation",
        p: [
          "A request through the site is a proposal, not a booking. The booking exists once we confirm it by e-mail with date, time, formula and price.",
          "For venue rental and team building a 30% deposit may be requested; the date is only held once we receive it.",
        ],
      },
      {
        h: "3. Prices and payment",
        p: [
          "Prices are in euro. As a non-profit we invoice our educational activities without VAT; for rentals and products VAT is shown on the invoice.",
          "Online payments run through Stripe. Invoices are payable within 14 days unless agreed otherwise.",
        ],
      },
      {
        h: "4. Cancellation by you",
        ul: [
          "Venue rental, seminars and team building: free up to 30 days ahead; 50% between 30 and 7 days; 100% within 7 days.",
          "School activities and workshops: free rescheduling up to 14 days ahead; after that 50%, and the full amount within 48 hours.",
          "Holiday camps: free up to 21 days ahead; after that a refund only on a medical certificate.",
          "Cancel by e-mail; the date of your e-mail counts.",
        ],
      },
      {
        h: "5. Cancellation or change by us",
        p: [
          "If an activity cannot take place due to force majeure — extreme weather, animal disease, closure of the park or a technical incident — we propose a new date or refund what you paid in full.",
          "Our activities largely take place outdoors. In poor weather we adapt the programme; that is not a ground for a refund.",
        ],
      },
      {
        h: "6. Farm shop",
        p: [
          "Orders are collected at the farm during the chosen pickup slot. We do not ship.",
          "Fresh produce depends on the harvest and the animals; if an item is unavailable we offer an alternative or refund it. Uncollected orders are kept for 48 hours after the slot.",
        ],
      },
      {
        h: "7. Right of withdrawal",
        p: [
          "As a consumer you have 14 days to withdraw from an online purchase. This right does not apply to perishable goods (Article VI.53 of the Belgian Code of Economic Law), nor to activities on an agreed date such as a rental, activity or camp.",
          "For non-perishable items, an e-mail to contact@maximilien.brussels within 14 days of collection is enough.",
        ],
      },
      {
        h: "8. On the farm",
        p: [
          "The farm is a working agricultural site. Follow the team's instructions, stay on the marked paths and do not feed the animals without permission.",
          "Children remain under the supervision of their parents, teachers or group leaders. For school visits, the school provides the agreed number of supervisors.",
          "Smoking, alcohol outside prior agreement, drones and dogs are not allowed in the farmyard.",
        ],
      },
      {
        h: "9. Liability",
        p: [
          "We carry civil liability insurance. Our liability is limited to the amount of the booking or order, except in cases of intent, gross negligence or personal injury.",
          "The hirer is liable for damage caused by their group to the buildings, equipment or animals. Personal belongings remain your own responsibility.",
        ],
      },
      {
        h: "10. Photography",
        p: [
          "We sometimes take photographs during activities. Publication only happens with consent; for groups it is requested through the school or organiser. You can object at any time and we remove the image.",
        ],
      },
      {
        h: "11. Use of the website",
        p: [
          "Texts, photos, illustrations and the logo remain the property of the non-profit. Reuse without written permission is not allowed; a media kit is available for press.",
          "We aim for a permanently available site but cannot guarantee uninterrupted access.",
        ],
      },
      {
        h: "12. Complaints and applicable law",
        p: [
          "Report a complaint within 14 days of the activity or delivery at contact@maximilien.brussels. We look for a solution together first.",
          "Belgian law applies. Disputes fall under the courts of Brussels. Consumers may also use the European ODR platform (ec.europa.eu/consumers/odr).",
        ],
      },
    ],
  },
};
