/**
 * Drietalige teksten (NL/FR/EN) voor de transactionele mails.
 * Puur data — geen server-only imports, zodat ook de UI de taal kan meesturen.
 */
export type MailLang = "nl" | "fr" | "en";

export function normalizeMailLang(v: unknown): MailLang {
  return v === "fr" || v === "en" ? v : "nl";
}

type Copy = {
  htmlLang: string;
  /** Voettekst onderaan elke mail. */
  disclaimer: (domein: string) => string;
  linkFallback: string;
  friend: string;
  visitor: string;
  hello: (naam: string) => string;

  contactReceipt: {
    subject: (onderwerp: string) => string;
    preview: string;
    kicker: string;
    title: string;
    intro: string;
    subjectLabel: string;
    urgent: (mail: string) => string;
    cta: string;
  };

  donation: {
    subject: (bedrag: string) => string;
    preview: (bedrag: string) => string;
    kicker: string;
    title: string;
    intro: string;
    lineLabel: string;
    total: string;
    beneficiary: string;
    iban: string;
    bic: string;
    reference: string;
    thanks: string;
    cta: string;
  };

  verify: {
    subject: string;
    preview: string;
    kicker: string;
    title: string;
    intro: string;
    cta: string;
    small: string;
  };

  reset: {
    subject: string;
    preview: string;
    kicker: string;
    title: string;
    intro: string;
    cta: string;
    small: string;
  };
};

export const MAIL_COPY: Record<MailLang, Copy> = {
  nl: {
    htmlLang: "nl",
    disclaimer: (d) =>
      `Je ontvangt deze mail omdat je een actie uitvoerde op ${d}. Wij versturen geen reclame en gebruiken geen trackingpixels.`,
    linkFallback: "Werkt de knop niet? Kopieer deze link in je browser:",
    friend: "vriend van de boerderij",
    visitor: "bezoeker",
    hello: (n) => `Dag ${n},`,
    contactReceipt: {
      subject: (o) => `We hebben je bericht ontvangen — ${o}`,
      preview: "Bedankt voor je bericht aan de stadsboerderij.",
      kicker: "Bevestiging",
      title: "Bericht goed ontvangen",
      intro:
        "Bedankt voor je bericht. We hebben het goed ontvangen en antwoorden doorgaans binnen twee werkdagen. Hieronder vind je een kopie van wat je ons stuurde.",
      subjectLabel: "Onderwerp",
      urgent: (m) => `Dringend? Bel of mail ons gerust rechtstreeks via ${m}.`,
      cta: "Ontdek de boerderij",
    },
    donation: {
      subject: (b) => `Bedankt voor je gift van ${b}`,
      preview: (b) => `Bevestiging van je gift van ${b}.`,
      kicker: "Steun",
      title: "Bedankt voor je gift",
      intro:
        "Hartelijk dank voor je steun. Hieronder vind je het overzicht van je gift en de gegevens om de overschrijving af te ronden.",
      lineLabel: "Gift aan de stadsboerderij",
      total: "Totaal",
      beneficiary: "Begunstigde",
      iban: "IBAN",
      bic: "BIC",
      reference: "Betaalreferentie (gestructureerde mededeling)",
      thanks:
        "Elke euro gaat rechtstreeks naar voer, ateliers en onderhoud van de stallen. Dankjewel om de boerderij mee overeind te houden.",
      cta: "Bekijk onze doelen",
    },
    verify: {
      subject: "Bevestig je e-mailadres — Maximilien",
      preview: "Bevestig je e-mailadres om je account te activeren.",
      kicker: "Account",
      title: "Bevestig je e-mailadres",
      intro:
        "Welkom bij de stadsboerderij! Bevestig je e-mailadres om je account te activeren. Daarna kan je je Hoefjes sparen, bestellingen plaatsen en academy-certificaten behalen.",
      cta: "Bevestig mijn e-mailadres",
      small:
        "Deze link is 24 uur geldig en kan één keer gebruikt worden. Heb jij geen account aangemaakt? Dan mag je deze mail gerust negeren — er gebeurt niets.",
    },
    reset: {
      subject: "Nieuw wachtwoord instellen — Maximilien",
      preview: "Stel een nieuw wachtwoord in voor je account.",
      kicker: "Accountbeveiliging",
      title: "Nieuw wachtwoord instellen",
      intro:
        "Je vroeg een nieuw wachtwoord aan voor je account. Klik hieronder om er een in te stellen.",
      cta: "Nieuw wachtwoord instellen",
      small:
        "Deze link is 1 uur geldig en kan één keer gebruikt worden. Heb jij dit niet aangevraagd? Dan blijft je huidige wachtwoord gewoon geldig en hoef je niets te doen.",
    },
  },

  fr: {
    htmlLang: "fr",
    disclaimer: (d) =>
      `Vous recevez cet e-mail suite à une action effectuée sur ${d}. Nous n'envoyons aucune publicité et n'utilisons aucun pixel de suivi.`,
    linkFallback: "Le bouton ne fonctionne pas ? Copiez ce lien dans votre navigateur :",
    friend: "ami·e de la ferme",
    visitor: "visiteur·euse",
    hello: (n) => `Bonjour ${n},`,
    contactReceipt: {
      subject: (o) => `Nous avons bien reçu votre message — ${o}`,
      preview: "Merci pour votre message à la ferme urbaine.",
      kicker: "Confirmation",
      title: "Message bien reçu",
      intro:
        "Merci pour votre message. Nous l'avons bien reçu et répondons généralement sous deux jours ouvrables. Vous trouverez ci-dessous une copie de votre envoi.",
      subjectLabel: "Objet",
      urgent: (m) => `Urgent ? Appelez-nous ou écrivez directement à ${m}.`,
      cta: "Découvrir la ferme",
    },
    donation: {
      subject: (b) => `Merci pour votre don de ${b}`,
      preview: (b) => `Confirmation de votre don de ${b}.`,
      kicker: "Soutien",
      title: "Merci pour votre don",
      intro:
        "Merci beaucoup pour votre soutien. Voici le récapitulatif de votre don et les données nécessaires au virement.",
      lineLabel: "Don à la ferme urbaine",
      total: "Total",
      beneficiary: "Bénéficiaire",
      iban: "IBAN",
      bic: "BIC",
      reference: "Référence de paiement (communication structurée)",
      thanks:
        "Chaque euro sert directement au fourrage, aux ateliers et à l'entretien des étables. Merci de faire vivre la ferme.",
      cta: "Voir nos projets",
    },
    verify: {
      subject: "Confirmez votre adresse e-mail — Maximilien",
      preview: "Confirmez votre adresse e-mail pour activer votre compte.",
      kicker: "Compte",
      title: "Confirmez votre adresse e-mail",
      intro:
        "Bienvenue à la ferme urbaine ! Confirmez votre adresse e-mail pour activer votre compte. Vous pourrez ensuite collecter vos Sabots, passer commande et obtenir des certificats de l'academy.",
      cta: "Confirmer mon adresse e-mail",
      small:
        "Ce lien est valable 24 heures et ne peut être utilisé qu'une seule fois. Vous n'avez pas créé de compte ? Ignorez simplement cet e-mail.",
    },
    reset: {
      subject: "Définir un nouveau mot de passe — Maximilien",
      preview: "Définissez un nouveau mot de passe pour votre compte.",
      kicker: "Sécurité du compte",
      title: "Définir un nouveau mot de passe",
      intro:
        "Vous avez demandé un nouveau mot de passe pour votre compte. Cliquez ci-dessous pour en choisir un.",
      cta: "Définir un nouveau mot de passe",
      small:
        "Ce lien est valable 1 heure et ne peut être utilisé qu'une seule fois. Vous n'êtes pas à l'origine de cette demande ? Votre mot de passe actuel reste valable.",
    },
  },

  en: {
    htmlLang: "en",
    disclaimer: (d) =>
      `You are receiving this email because of an action on ${d}. We never send advertising and use no tracking pixels.`,
    linkFallback: "Button not working? Copy this link into your browser:",
    friend: "friend of the farm",
    visitor: "visitor",
    hello: (n) => `Hello ${n},`,
    contactReceipt: {
      subject: (o) => `We received your message — ${o}`,
      preview: "Thanks for your message to the city farm.",
      kicker: "Confirmation",
      title: "Message received",
      intro:
        "Thanks for your message. We received it and usually reply within two working days. Below is a copy of what you sent us.",
      subjectLabel: "Subject",
      urgent: (m) => `Urgent? Call us or write directly to ${m}.`,
      cta: "Discover the farm",
    },
    donation: {
      subject: (b) => `Thank you for your ${b} donation`,
      preview: (b) => `Confirmation of your ${b} donation.`,
      kicker: "Support",
      title: "Thank you for your donation",
      intro:
        "Thank you warmly for your support. Below is an overview of your donation and the details to complete the transfer.",
      lineLabel: "Donation to the city farm",
      total: "Total",
      beneficiary: "Beneficiary",
      iban: "IBAN",
      bic: "BIC",
      reference: "Payment reference (structured communication)",
      thanks:
        "Every euro goes straight to feed, workshops and stable maintenance. Thank you for keeping the farm going.",
      cta: "See our goals",
    },
    verify: {
      subject: "Confirm your email address — Maximilien",
      preview: "Confirm your email address to activate your account.",
      kicker: "Account",
      title: "Confirm your email address",
      intro:
        "Welcome to the city farm! Confirm your email address to activate your account. You can then collect Hooves, place orders and earn academy certificates.",
      cta: "Confirm my email address",
      small:
        "This link is valid for 24 hours and can be used once. Didn't create an account? You can safely ignore this email.",
    },
    reset: {
      subject: "Set a new password — Maximilien",
      preview: "Set a new password for your account.",
      kicker: "Account security",
      title: "Set a new password",
      intro: "You requested a new password for your account. Click below to choose one.",
      cta: "Set a new password",
      small:
        "This link is valid for 1 hour and can be used once. Didn't request this? Your current password stays valid.",
    },
  },
};
