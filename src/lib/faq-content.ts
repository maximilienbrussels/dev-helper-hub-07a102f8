/**
 * Veelgestelde vragen — overgenomen van de oude site (lafermeduparcmaximilien.be/faq)
 * en drietalig gemaakt.
 */

import type { Lang } from "@/lib/i18n";

export type FaqItem = {
  id: string;
  q: Record<Lang, string>;
  a: Record<Lang, string>;
};

export type FaqSection = {
  id: string;
  eyebrow: Record<Lang, string>;
  title: Record<Lang, string>;
  items: FaqItem[];
};

export const FAQ_COPY: Record<Lang, { eyebrow: string; title: string; lede: string }> = {
  nl: {
    eyebrow: "Boerderij",
    title: "Veelgestelde vragen",
    lede: "Alles wat je wil weten vóór je bezoek, je animatie of je evenement op de boerderij.",
  },
  fr: {
    eyebrow: "Ferme",
    title: "Questions fréquentes",
    lede: "Tout ce qu'il faut savoir avant votre visite, votre animation ou votre événement à la ferme.",
  },
  en: {
    eyebrow: "Farm",
    title: "Frequently asked questions",
    lede: "Everything you need to know before your visit, your workshop or your event at the farm.",
  },
};

export const FAQ_SECTIONS: FaqSection[] = [
  {
    id: "algemeen",
    eyebrow: { nl: "Algemeen", fr: "Général", en: "General" },
    title: {
      nl: "De boerderij en de toegang",
      fr: "La ferme et l'accès",
      en: "The farm and access",
    },
    items: [
      {
        id: "waar",
        q: {
          nl: "Waar ligt de boerderij?",
          fr: "Où se trouve la ferme ?",
          en: "Where is the farm?",
        },
        a: {
          nl: "De hoofdingang ligt aan de Schipperijkaai 2, 1000 Brussel. Er is ook een kleine ingang aan de Willebroekkaai 21 (onder meer gebruikt door verjaardagsgezinnen en in de winter).",
          fr: "L'entrée principale se situe au 2 Quai du Batelage, 1000 Bruxelles. Une petite entrée existe aussi au 21 Quai de Willebroek (utilisée notamment par les familles organisatrices d'anniversaire et en hiver).",
          en: "The main entrance is at Quai du Batelage 2, 1000 Brussels. There is also a small entrance at Quai de Willebroek 21 (used by birthday families and in winter).",
        },
      },
      {
        id: "openbaar-vervoer",
        q: {
          nl: "Hoe kom ik met het openbaar vervoer?",
          fr: "Comment venir en transports en commun ?",
          en: "How do I get there by public transport?",
        },
        a: {
          nl: "De boerderij is bereikbaar met tram 51, metro 2 en 6 en verschillende buslijnen. Alle details staan op de pagina Toegankelijkheid.",
          fr: "La ferme est desservie par le tram 51, le métro 2 et 6, ainsi que de nombreuses lignes de bus. Le détail se trouve sur notre page « Accessibilité ».",
          en: "The farm is served by tram 51, metro lines 2 and 6 and several bus lines. Full details are on our Accessibility page.",
        },
      },
      {
        id: "nederlandstalig",
        q: {
          nl: "Ontvangen jullie Nederlandstalige groepen?",
          fr: "Accueillez-vous les groupes néerlandophones ?",
          en: "Do you welcome Dutch-speaking groups?",
        },
        a: {
          nl: "Voorlopig kunnen we jammer genoeg geen groepen in het Nederlands begeleiden. Reservaties in die taal kunnen we niet aannemen.",
          fr: "Pour le moment, nous ne sommes malheureusement pas en mesure d'accueillir des groupes en néerlandais. Les réservations dans cette langue ne peuvent pas être prises en compte.",
          en: "At the moment we are unfortunately unable to host groups in Dutch. Bookings in that language cannot be accepted.",
        },
      },
    ],
  },
  {
    id: "animaties",
    eyebrow: { nl: "School & vzw", fr: "École et asbl", en: "School & non-profit" },
    title: {
      nl: "De pedagogische animaties",
      fr: "Les animations pédagogiques",
      en: "Educational workshops",
    },
    items: [
      {
        id: "leeftijd",
        q: { nl: "Vanaf welke leeftijd?", fr: "À partir de quel âge ?", en: "From what age?" },
        a: {
          nl: "De meeste animaties zijn toegankelijk vanaf 6 jaar. « De dieren en onze 5 zintuigen » past bij elke leeftijd.",
          fr: "La plupart des animations sont accessibles dès 6 ans. L'animation « Les animaux et nos 5 sens » convient à tout âge.",
          en: "Most workshops are suitable from age 6. “The animals and our five senses” works for any age.",
        },
      },
      {
        id: "duur",
        q: {
          nl: "Hoe lang duurt een animatie?",
          fr: "Combien de temps dure une animation ?",
          en: "How long does a workshop last?",
        },
        a: {
          nl: "Reken op 120 minuten voor een animatie, of een volledige dag voor de formule « Een dag op de boerderij » (twee animaties naar keuze).",
          fr: "Comptez 120 minutes pour une animation, ou une journée complète pour la formule « La journée à la ferme » (deux animations au choix).",
          en: "Around 120 minutes for one workshop, or a full day for the “Day at the farm” formula (two workshops of your choice).",
        },
      },
      {
        id: "prijs",
        q: {
          nl: "Wat kost een animatie?",
          fr: "Combien coûte une animation ?",
          en: "What does a workshop cost?",
        },
        a: {
          nl: "Vanaf 250 € per groep (350 € voor « Appel, peer en fruit uit de boomgaard », 500 € voor de volledige dag).",
          fr: "À partir de 250 € / groupe (350 € pour « Pomme, poire et fruits du verger », 500 € pour la journée complète).",
          en: "From €250 per group (€350 for “Apple, pear and orchard fruit”, €500 for the full day).",
        },
      },
      {
        id: "reserveren",
        q: {
          nl: "Hoe reserveer ik een animatie?",
          fr: "Comment réserver une animation ?",
          en: "How do I book a workshop?",
        },
        a: {
          nl: "Rechtstreeks bij elke animatie via de knop Reserveren. Bij « Lees meer » vind je het volledige verloop van elke animatie.",
          fr: "Directement depuis chaque animation via le bouton Réserver. Le détail de chaque animation est disponible via « Lire plus ».",
          en: "Directly from each workshop via the Book button. Full details are behind “Read more”.",
        },
      },
    ],
  },
  {
    id: "verjaardagen",
    eyebrow: { nl: "Familie", fr: "Famille", en: "Family" },
    title: { nl: "De verjaardagsfeestjes", fr: "Les anniversaires", en: "Birthday parties" },
    items: [
      {
        id: "formules",
        q: {
          nl: "Welke verjaardagsformules bieden jullie aan?",
          fr: "Quelles formules d'anniversaire proposez-vous ?",
          en: "Which birthday formulas do you offer?",
        },
        a: {
          nl: "Drie formules: zaterdag kinderen (3u, polyvalente zaal), woensdag kinderen (3u, in de chalet) en zaterdag familiedag (6u30, polyvalente zaal).",
          fr: "Trois formules : samedi enfants (3h, salle polyvalente), mercredi enfants (3h, dans le chalet) et samedi journée famille (6h30, salle polyvalente).",
          en: "Three formulas: Saturday for children (3h, multipurpose room), Wednesday for children (3h, in the chalet) and Saturday family day (6.5h, multipurpose room).",
        },
      },
      {
        id: "aantal",
        q: {
          nl: "Hoeveel kinderen mogen meedoen?",
          fr: "Combien d'enfants peuvent participer ?",
          en: "How many children can take part?",
        },
        a: {
          nl: "Maximaal 15 kinderen en 5 volwassenen zijn inbegrepen. Vanaf het 16e kind: 10 € per extra kind, tot 18 kinderen (omwille van het dierenwelzijn).",
          fr: "15 enfants et 5 adultes maximum sont compris. Dès le 16e enfant : 10 € par enfant supplémentaire, jusqu'à 18 enfants (condition liée au bien-être animal).",
          en: "Up to 15 children and 5 adults are included. From the 16th child: €10 per extra child, up to 18 children (for animal welfare reasons).",
        },
      },
      {
        id: "waarborg",
        q: { nl: "Is er een waarborg?", fr: "Y a-t-il une caution ?", en: "Is there a deposit?" },
        a: {
          nl: "Ja, een waarborg van 50 € cash bij aankomst. Je krijgt die terug als de lokalen proper en opgeruimd zijn en je op het afgesproken uur vertrekt.",
          fr: "Oui, une caution de 50 € en cash à votre arrivée. Elle est restituée au départ si les locaux sont remis au propre et rangés, et si vous partez à l'heure convenue.",
          en: "Yes, a €50 cash deposit on arrival. It is returned if the rooms are left clean and tidy and you leave at the agreed time.",
        },
      },
      {
        id: "eten",
        q: {
          nl: "Wordt er eten voorzien?",
          fr: "La nourriture est-elle fournie ?",
          en: "Is food provided?",
        },
        a: {
          nl: "Nee, we voorzien geen eten of drank: breng je picknick of vieruurtje mee. Vermijd voor het milieu wegwerpversiering en -materiaal (wegwerpborden, plastic bekers, ballonnen, confetti…).",
          fr: "Non, nous ne fournissons ni nourriture ni boissons : apportez votre pique-nique ou votre goûter. Pour l'environnement, merci d'éviter décorations et objets à usage unique (assiettes jetables, gobelets plastique, ballons, confettis…).",
          en: "No, we provide neither food nor drinks: bring your own picnic or snack. For the environment, please avoid single-use decorations and items (paper plates, plastic cups, balloons, confetti…).",
        },
      },
      {
        id: "annulering",
        q: {
          nl: "Wat is het annuleringsbeleid?",
          fr: "Quelle est la politique d'annulation ?",
          en: "What is the cancellation policy?",
        },
        a: {
          nl: "We houden 50 € administratiekosten in. Meer dan 3 weken voor het feest: terugbetaling van 130 €. Binnen de 3 weken voor het feest: geen terugbetaling.",
          fr: "Nous retenons 50 € de frais administratifs. Plus de 3 semaines avant l'événement : remboursement de 130 €. Dans les 3 semaines précédant l'événement : aucun remboursement.",
          en: "We retain €50 in administrative costs. More than 3 weeks before the event: €130 refunded. Within 3 weeks of the event: no refund.",
        },
      },
    ],
  },
  {
    id: "stages",
    eyebrow: { nl: "Familie", fr: "Famille", en: "Family" },
    title: { nl: "De stages", fr: "Les stages", en: "Camps and internships" },
    items: [
      {
        id: "kinderstages",
        q: {
          nl: "Organiseren jullie vakantiestages voor kinderen?",
          fr: "Proposez-vous des stages pour enfants ?",
          en: "Do you run holiday camps for children?",
        },
        a: {
          nl: "Ja, doorheen de seizoenen. Op de pagina Vakantiestages vind je de data en de inschrijving.",
          fr: "Oui, des stages pour enfants sont proposés au fil des saisons. Consultez la page « Stages enfants » pour les dates et l'inscription.",
          en: "Yes, throughout the seasons. See the Holiday camps page for dates and registration.",
        },
      },
      {
        id: "studentenstage",
        q: {
          nl: "Kan ik een studentenstage doen op de boerderij?",
          fr: "Peut-on faire un stage étudiant à la ferme ?",
          en: "Can I do a student internship at the farm?",
        },
        a: {
          nl: "Ja: dierenverzorging, moestuin, imkerij, administratie en HR, onderhoud en stadslandbouw, animatie en projectbeheer. Een cv is verplicht (motivatiebrief optioneel).",
          fr: "Oui : soin animalier, maraîchage, apiculture, gestion administrative et RH, entretien et agriculture urbaine, animation et gestion de projet. Le CV est obligatoire (lettre de motivation facultative).",
          en: "Yes: animal care, market gardening, beekeeping, administration and HR, maintenance and urban agriculture, activities and project management. A CV is required (cover letter optional).",
        },
      },
    ],
  },
  {
    id: "bedrijven",
    eyebrow: { nl: "Bedrijf", fr: "Entreprise", en: "Business" },
    title: {
      nl: "Teambuilding, seminaries en privatisering",
      fr: "Teambuilding, séminaires et privatisation",
      en: "Team building, seminars and private hire",
    },
    items: [
      {
        id: "teambuilding-prijs",
        q: {
          nl: "Wat kost een teambuilding?",
          fr: "Combien coûte un teambuilding ?",
          en: "What does a team building cost?",
        },
        a: {
          nl: "50 € per persoon voor een halve dag (3u) en 80 € per persoon voor een volledige dag (6u), één of twee activiteiten naar keuze, drank inbegrepen.",
          fr: "50 € / personne la demi-journée (3h) et 80 € / personne la journée (6h), une ou deux activités au choix, boissons comprises.",
          en: "€50 per person for a half day (3h) and €80 per person for a full day (6h), one or two activities of your choice, drinks included.",
        },
      },
      {
        id: "capaciteit",
        q: {
          nl: "Hoeveel mensen kunnen jullie ontvangen?",
          fr: "Quelle capacité d'accueil ?",
          en: "What is your capacity?",
        },
        a: {
          nl: "Tot 100 personen op de boerderij (Brussel) en tot 200 personen op het platteland (Sterrebeek).",
          fr: "Jusqu'à 100 personnes à la ferme (Bruxelles) et jusqu'à 200 personnes à la campagne (Sterrebeek).",
          en: "Up to 100 people at the farm (Brussels) and up to 200 people in the countryside (Sterrebeek).",
        },
      },
      {
        id: "privatisering",
        q: {
          nl: "Kan ik de boerderij privatiseren of een zaal huren?",
          fr: "Peut-on privatiser la ferme ou louer une salle ?",
          en: "Can I hire a room or privatise the farm?",
        },
        a: {
          nl: "Ja. Zaalverhuur start vanaf 150 € per halve dag (tot ±150 personen). Volledige privatisering start vanaf 3 000 € (tot 150 personen), van 4u tot meerdere dagen.",
          fr: "Oui. La location de salle démarre à 150 € la demi-journée (jusqu'à ±150 personnes). La privatisation complète démarre à 3 000 € (jusqu'à 150 personnes), de 4h à plusieurs jours.",
          en: "Yes. Room hire starts at €150 per half day (up to ±150 people). Full private hire starts at €3,000 (up to 150 people), from 4 hours to several days.",
        },
      },
    ],
  },
  {
    id: "reservatie",
    eyebrow: { nl: "Reservatie", fr: "Réservation", en: "Booking" },
    title: {
      nl: "Reserveren, betalen en souvenir",
      fr: "Réservation, paiement et souvenir",
      en: "Booking, payment and souvenir",
    },
    items: [
      {
        id: "betalen",
        q: {
          nl: "Hoe reserveer en betaal ik?",
          fr: "Comment réserver et payer ?",
          en: "How do I book and pay?",
        },
        a: {
          nl: "Reserveren gebeurt online of per e-mail. De factuur moet minstens één week voor het evenement betaald zijn.",
          fr: "Les réservations se font en ligne ou par email. La facture doit être réglée au minimum une semaine avant l'événement.",
          en: "Bookings are made online or by e-mail. The invoice must be paid at least one week before the event.",
        },
      },
      {
        id: "aantal-wijzigen",
        q: {
          nl: "Kan het aantal deelnemers nog wijzigen?",
          fr: "Peut-on modifier le nombre de participants ?",
          en: "Can the number of participants change?",
        },
        a: {
          nl: "Ja, tot één week voor het evenement.",
          fr: "Oui, jusqu'à une semaine avant l'événement.",
          en: "Yes, up to one week before the event.",
        },
      },
      {
        id: "souvenir",
        q: {
          nl: "Krijgen we een souvenir mee?",
          fr: "Repart-on avec un souvenir ?",
          en: "Do we get a souvenir?",
        },
        a: {
          nl: "Ja: afhankelijk van de activiteit en het seizoen gaat elke deelnemer naar huis met een huisgemaakte kruidenthee of een potje honing van onze bijen.",
          fr: "Oui : selon l'activité et la saison, chaque participant repart avec une tisane maison ou un pot de miel de nos abeilles.",
          en: "Yes: depending on the activity and season, everyone leaves with a home-made herbal tea or a jar of honey from our bees.",
        },
      },
    ],
  },
];

export const FAQ_FORM: Record<Lang, { title: string; intro: string }> = {
  nl: {
    title: "Vind je jouw antwoord niet?",
    intro: "Stel je vraag hier — we antwoorden zo snel mogelijk.",
  },
  fr: {
    title: "Vous ne trouvez pas votre réponse ?",
    intro: "Posez votre question ici — nous vous répondons au plus vite.",
  },
  en: {
    title: "Can't find your answer?",
    intro: "Ask your question here — we reply as soon as we can.",
  },
};
