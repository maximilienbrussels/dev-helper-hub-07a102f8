/**
 * Drietalige inhoud voor de pagina "Wie zijn we": tijdlijn, teamleden en bestuur.
 * Los van de i18n-woordenlijst gehouden omdat het om redactionele blokken gaat.
 */

export type Lang = "nl" | "fr" | "en";

type Tri = Record<Lang, string>;

export type Milestone = {
  year: string;
  title: Tri;
  body: Tri;
};

export const MILESTONES: Milestone[] = [
  {
    year: "1987",
    title: {
      nl: "De boerderij wordt geboren",
      fr: "La ferme voit le jour",
      en: "The farm is born",
    },
    body: {
      nl: "Buurtbewoners en jeugdwerkers richten een kleine dierenweide op in het Maximiliaanpark, midden in het hart van Brussel.",
      fr: "Des riverains et des animateurs créent un petit enclos animalier dans le parc Maximilien, en plein cœur de Bruxelles.",
      en: "Neighbours and youth workers create a small animal paddock in Maximilien Park, in the heart of Brussels.",
    },
  },
  {
    year: "1995",
    title: {
      nl: "Eerste schoolprogramma's",
      fr: "Premiers programmes scolaires",
      en: "First school programmes",
    },
    body: {
      nl: "De boerderij ontvangt haar eerste klassen. Educatie rond dieren, voeding en de seizoenen wordt de kern van de werking.",
      fr: "La ferme accueille ses premières classes. L'éducation aux animaux, à l'alimentation et aux saisons devient le cœur du projet.",
      en: "The farm welcomes its first school classes. Education around animals, food and the seasons becomes the core of the project.",
    },
  },
  {
    year: "2008",
    title: {
      nl: "Moestuin, compost en bijen",
      fr: "Potager, compost et abeilles",
      en: "Vegetable garden, compost and bees",
    },
    body: {
      nl: "Een collectieve moestuin, composteringszone en bijenkasten maken van de site een levend voorbeeld van stedelijke kringlopen.",
      fr: "Un potager collectif, une zone de compostage et des ruches font du site un exemple vivant de cycles urbains.",
      en: "A collective garden, composting area and beehives turn the site into a living example of urban cycles.",
    },
  },
  {
    year: "2016",
    title: {
      nl: "Sociale tewerkstelling",
      fr: "Insertion socioprofessionnelle",
      en: "Social employment",
    },
    body: {
      nl: "Stages, sociale tewerkstelling en buurtprojecten geven de boerderij een tweede, sociale roeping naast haar educatieve werk.",
      fr: "Stages, insertion et projets de quartier donnent à la ferme une seconde vocation, sociale, à côté de l'éducatif.",
      en: "Internships, work integration and neighbourhood projects give the farm a second, social vocation alongside education.",
    },
  },
  {
    year: "2020",
    title: {
      nl: "Anker in de buurt",
      fr: "Ancrage dans le quartier",
      en: "An anchor in the neighbourhood",
    },
    body: {
      nl: "Tijdens de coronajaren blijft de boerderij open lucht en rust bieden aan een wijk met weinig groen.",
      fr: "Pendant les années covid, la ferme continue d'offrir air libre et calme à un quartier peu verdurisé.",
      en: "Through the covid years the farm keeps offering open air and calm to a neighbourhood with little greenery.",
    },
  },
  {
    year: "vandaag",
    title: {
      nl: "Eco-sociale stadsboerderij",
      fr: "Ferme urbaine éco-sociale",
      en: "Eco-social city farm",
    },
    body: {
      nl: "Meer dan 30.000 bezoekers per jaar, tientallen dieren, een hoeveproductie zonder verpakking en een groeiend netwerk van scholen en partners.",
      fr: "Plus de 30 000 visiteurs par an, des dizaines d'animaux, une production fermière sans emballage et un réseau croissant d'écoles et de partenaires.",
      en: "Over 30,000 visitors a year, dozens of animals, package-free farm produce and a growing network of schools and partners.",
    },
  },
];

export type Person = {
  id: string;
  name: string;
  /** i18n-sleutel van de functietitel. */
  roleKey: string;
  /** Onderwerp dat op /contact wordt voorgevuld. */
  subject: string;
  quote: Tri;
  bio: Tri;
};

export const TEAM: Person[] = [
  {
    id: "anatole",
    name: "Anatole",
    roleKey: "about.role.director",
    subject: "Directie",
    quote: {
      nl: "Een boerderij in de stad is pas geslaagd als de buurt ze als de hare beschouwt.",
      fr: "Une ferme en ville n'est réussie que si le quartier se l'approprie.",
      en: "A city farm only succeeds when the neighbourhood calls it their own.",
    },
    bio: {
      nl: "Anatole leidt de vzw, bewaakt het meerjarenplan en houdt de brug open tussen de boerderij, de Stad Brussel en onze partners.",
      fr: "Anatole dirige l'ASBL, veille au plan pluriannuel et maintient le lien entre la ferme, la Ville de Bruxelles et nos partenaires.",
      en: "Anatole leads the non-profit, guards the multi-year plan and keeps the bridge open between the farm, the City of Brussels and our partners.",
    },
  },
  {
    id: "karim",
    name: "Karim",
    roleKey: "about.role.animals",
    subject: "Dierenwelzijn",
    quote: {
      nl: "Ik begin elke dag met een ronde langs alle stallen — de dieren vertellen meteen hoe het gaat.",
      fr: "Je commence chaque journée par un tour des étables — les animaux disent tout de suite comment ils vont.",
      en: "Every day starts with a round of the barns — the animals tell you straight away how they are.",
    },
    bio: {
      nl: "Karim verzorgt de geiten, schapen, kippen en konijnen, volgt de dierenarts op en leert bezoekers hoe je een dier rustig benadert.",
      fr: "Karim s'occupe des chèvres, moutons, poules et lapins, assure le suivi vétérinaire et apprend aux visiteurs à approcher un animal calmement.",
      en: "Karim cares for the goats, sheep, chickens and rabbits, follows up with the vet and teaches visitors how to approach an animal calmly.",
    },
  },
  {
    id: "sofia",
    name: "Sofia",
    roleKey: "about.role.garden",
    subject: "Moestuin & compost",
    quote: {
      nl: "Compost is onze mooiste les: afval bestaat niet, alles keert terug naar de grond.",
      fr: "Le compost est notre plus belle leçon : le déchet n'existe pas, tout retourne à la terre.",
      en: "Compost is our finest lesson: waste doesn't exist, everything returns to the soil.",
    },
    bio: {
      nl: "Sofia beheert de collectieve moestuin, de composteringszone en de zadenruil met buurtbewoners en scholen.",
      fr: "Sofia gère le potager collectif, la zone de compostage et l'échange de semences avec les voisins et les écoles.",
      en: "Sofia runs the collective vegetable garden, the composting area and the seed swap with neighbours and schools.",
    },
  },
  {
    id: "youssef",
    name: "Youssef",
    roleKey: "about.role.projects",
    subject: "Projecten & partners",
    quote: {
      nl: "Elk project vertrekt bij een vraag uit de wijk, niet bij een subsidieformulier.",
      fr: "Chaque projet part d'une demande du quartier, pas d'un formulaire de subside.",
      en: "Every project starts with a question from the neighbourhood, not with a grant form.",
    },
    bio: {
      nl: "Youssef bouwt onze projecten uit met scholen, sociale organisaties en bedrijven, en volgt de dossiers en subsidies op.",
      fr: "Youssef développe nos projets avec les écoles, les associations sociales et les entreprises, et suit les dossiers et subsides.",
      en: "Youssef develops our projects with schools, social organisations and companies, and follows up on files and grants.",
    },
  },
  {
    id: "lien",
    name: "Lien",
    roleKey: "about.role.coord",
    subject: "Educatie & schoolbezoeken",
    quote: {
      nl: "Een kind dat voor het eerst een ei uit het stro haalt — dat blijft levenslang bij.",
      fr: "Un enfant qui ramasse son premier œuf dans la paille — ça reste toute une vie.",
      en: "A child picking their first egg out of the straw — that stays for life.",
    },
    bio: {
      nl: "Lien coördineert de dagelijkse werking, plant de schoolbezoeken en workshops en begeleidt onze animatoren.",
      fr: "Lien coordonne le fonctionnement quotidien, planifie les visites scolaires et ateliers et encadre nos animateurs.",
      en: "Lien coordinates daily operations, plans school visits and workshops and supports our facilitators.",
    },
  },
  {
    id: "vrijwilligers",
    name: "Vrijwilligers",
    roleKey: "about.role.volunteers.sub",
    subject: "Vrijwilligers",
    quote: {
      nl: "Zonder onze vrijwilligers zou de boerderij maar half zo levendig zijn.",
      fr: "Sans nos bénévoles, la ferme serait deux fois moins vivante.",
      en: "Without our volunteers the farm would be half as alive.",
    },
    bio: {
      nl: "Buurtbewoners, studenten en scholen helpen wekelijks mee met verzorging, moestuin, onthaal en evenementen.",
      fr: "Voisins, étudiants et écoles aident chaque semaine aux soins, au potager, à l'accueil et aux événements.",
      en: "Neighbours, students and schools help out weekly with animal care, the garden, the welcome desk and events.",
    },
  },
];

export const BOARD: Person[] = [
  {
    id: "dubois",
    name: "N. Dubois",
    roleKey: "about.gov.president",
    subject: "Bestuur — voorzitter",
    quote: {
      nl: "Ons mandaat is eenvoudig: de boerderij toegankelijk en gezond houden voor de volgende generatie.",
      fr: "Notre mandat est simple : garder la ferme accessible et saine pour la génération suivante.",
      en: "Our mandate is simple: keep the farm accessible and healthy for the next generation.",
    },
    bio: {
      nl: "Voorzit het bestuursorgaan, vertegenwoordigt de vzw naar de overheid en waakt over de langetermijnvisie.",
      fr: "Préside le conseil, représente l'ASBL auprès des pouvoirs publics et veille à la vision à long terme.",
      en: "Chairs the board, represents the non-profit towards public authorities and safeguards the long-term vision.",
    },
  },
  {
    id: "peeters",
    name: "M. Peeters",
    roleKey: "about.gov.vicepresident",
    subject: "Bestuur — ondervoorzitter",
    quote: {
      nl: "Een vzw draait op vertrouwen: van vrijwilligers, van buren, van subsidiegevers.",
      fr: "Une ASBL tourne à la confiance : celle des bénévoles, des voisins, des pouvoirs subsidiants.",
      en: "A non-profit runs on trust: from volunteers, neighbours and funders.",
    },
    bio: {
      nl: "Ondersteunt de voorzitter, volgt het personeelsbeleid op en begeleidt de strategische dossiers.",
      fr: "Épaule la présidence, suit la politique du personnel et accompagne les dossiers stratégiques.",
      en: "Supports the chair, follows up on HR policy and guides strategic files.",
    },
  },
  {
    id: "lambert",
    name: "A. Lambert",
    roleKey: "about.gov.treasurer",
    subject: "Bestuur — penningmeester",
    quote: {
      nl: "Elke euro die binnenkomt moet je op de wei kunnen terugzien.",
      fr: "Chaque euro reçu doit se voir sur la prairie.",
      en: "Every euro that comes in should be visible out in the paddock.",
    },
    bio: {
      nl: "Beheert de financiën, de jaarrekening en de opvolging van subsidies en giften.",
      fr: "Gère les finances, les comptes annuels et le suivi des subsides et des dons.",
      en: "Manages the finances, the annual accounts and the follow-up of grants and donations.",
    },
  },
  {
    id: "janssens",
    name: "S. Janssens",
    roleKey: "about.gov.secretary",
    subject: "Bestuur — secretaris",
    quote: {
      nl: "Goede verslagen zijn het geheugen van een vereniging.",
      fr: "De bons procès-verbaux sont la mémoire d'une association.",
      en: "Good minutes are an association's memory.",
    },
    bio: {
      nl: "Bereidt de vergaderingen voor, houdt de statuten en verslagen bij en bewaakt de administratieve verplichtingen.",
      fr: "Prépare les réunions, tient à jour statuts et procès-verbaux et veille aux obligations administratives.",
      en: "Prepares meetings, keeps statutes and minutes up to date and watches over administrative duties.",
    },
  },
  {
    id: "moreau",
    name: "F. Moreau",
    roleKey: "about.gov.member",
    subject: "Bestuur",
    quote: {
      nl: "De boerderij is een publieke plek — ze moet dat ook voelen voor iedereen.",
      fr: "La ferme est un lieu public — cela doit se sentir pour tout le monde.",
      en: "The farm is a public place — it should feel that way for everyone.",
    },
    bio: {
      nl: "Bestuurder met bijzondere aandacht voor toegankelijkheid en de band met de buurtverenigingen.",
      fr: "Administrateur attentif à l'accessibilité et au lien avec les associations de quartier.",
      en: "Board member focused on accessibility and ties with neighbourhood associations.",
    },
  },
  {
    id: "vermeulen",
    name: "K. Vermeulen",
    roleKey: "about.gov.member",
    subject: "Bestuur",
    quote: {
      nl: "Biodiversiteit begint bij een haag, een poel en wat geduld.",
      fr: "La biodiversité commence par une haie, une mare et un peu de patience.",
      en: "Biodiversity starts with a hedge, a pond and a little patience.",
    },
    bio: {
      nl: "Bestuurder met expertise in natuurbeheer, adviseert over biodiversiteit en het terreinbeheer.",
      fr: "Administrateur expert en gestion de la nature, conseille sur la biodiversité et l'entretien du site.",
      en: "Board member with expertise in nature management, advising on biodiversity and site upkeep.",
    },
  },
];
