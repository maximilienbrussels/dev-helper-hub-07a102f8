/**
 * Drietalige teksten voor de account- en beveiligingsmails.
 *
 * Puur data (geen server-only imports) zodat de portaal-voorbeeldweergave en de
 * UI dezelfde teksten kunnen gebruiken als de verzendcode.
 */
import type { MailLang } from "./email-copy";

/** Elke mailsjabloon met een actielink of beveiligingsmelding. */
export type AuthMailKind =
  | "invite" // 1 — teamuitnodiging: wachtwoord instellen
  | "teamReset" // 2 — wachtwoord vergeten (team)
  | "teamMagic" // 3 — inloglink voor het team
  | "verify" // 4 — e-mailadres bevestigen (klant)
  | "welcome" // 5 — welkom na bevestiging
  | "reset" // 6 — wachtwoord vergeten (klant)
  | "magic" // 7 — inloglink voor de klant
  | "passwordChanged"; // 8 — beveiligingsmelding na wijziging

export type AuthMailText = {
  subject: string;
  preview: string;
  kicker: string;
  title: string;
  intro: string;
  /** Knoptekst; ontbreekt bij mails zonder actielink. */
  cta?: string;
  small: string;
};

const NL: Record<AuthMailKind, AuthMailText> = {
  invite: {
    subject: "Welkom in het team — stel je wachtwoord in",
    preview: "Stel je wachtwoord in en krijg toegang tot het beheerportaal.",
    kicker: "Teamtoegang",
    title: "Welkom in het team",
    intro:
      "Een beheerder heeft je toegevoegd aan het team van de stadsboerderij. Kies hieronder je eigen wachtwoord; daarna kan je meteen aan de slag in het beheerportaal.",
    cta: "Wachtwoord instellen",
    small:
      "Deze link is 7 dagen geldig en werkt één keer. Verlopen? Vraag een beheerder om je opnieuw uit te nodigen.",
  },
  teamReset: {
    subject: "Nieuw wachtwoord voor het beheerportaal",
    preview: "Stel een nieuw wachtwoord in voor het beheerportaal.",
    kicker: "Teamtoegang",
    title: "Nieuw wachtwoord instellen",
    intro:
      "Je vroeg een nieuw wachtwoord aan voor je medewerkersaccount. Klik hieronder om er een te kiezen.",
    cta: "Nieuw wachtwoord instellen",
    small:
      "Deze link is 1 uur geldig en werkt één keer. Heb jij dit niet aangevraagd? Dan blijft je huidige wachtwoord gewoon geldig — laat het wel weten aan een beheerder.",
  },
  teamMagic: {
    subject: "Je inloglink voor het beheerportaal",
    preview: "Meld je met één klik aan bij het beheerportaal.",
    kicker: "Teamtoegang",
    title: "Je inloglink",
    intro:
      "Klik op de knop hieronder om je aan te melden bij het beheerportaal. Je hebt geen wachtwoord nodig.",
    cta: "Aanmelden bij het portaal",
    small:
      "Deze link is 1 uur geldig en werkt één keer. Deel hem met niemand: wie de link heeft, kan zich als jou aanmelden.",
  },
  verify: {
    subject: "Bevestig je e-mailadres",
    preview: "Bevestig je e-mailadres om je account te activeren.",
    kicker: "Account",
    title: "Bevestig je e-mailadres",
    intro:
      "Welkom bij de stadsboerderij! Bevestig je e-mailadres om je account te activeren. Daarna kan je Hoefjes sparen, bestellingen plaatsen en academy-certificaten behalen.",
    cta: "Bevestig mijn e-mailadres",
    small:
      "Deze link is 24 uur geldig en werkt één keer. Heb jij geen account aangemaakt? Dan mag je deze mail gerust negeren.",
  },
  welcome: {
    subject: "Welkom bij de boerderij",
    preview: "Je account is actief — dit kan je er allemaal mee doen.",
    kicker: "Welkom",
    title: "Je account is actief",
    intro:
      "Je e-mailadres is bevestigd. Spaar Hoefjes bij elk bezoek, bestel producten van het erf via Click & Collect, schrijf je in voor ateliers en volg de gratis Academy met certificaat.",
    cta: "Naar mijn account",
    small:
      "Vragen? Antwoord gewoon op deze mail of bel ons tijdens de openingsuren — we helpen je graag verder.",
  },
  reset: {
    subject: "Nieuw wachtwoord instellen",
    preview: "Stel een nieuw wachtwoord in voor je account.",
    kicker: "Accountbeveiliging",
    title: "Nieuw wachtwoord instellen",
    intro:
      "Je vroeg een nieuw wachtwoord aan voor je account. Klik hieronder om er een in te stellen.",
    cta: "Nieuw wachtwoord instellen",
    small:
      "Deze link is 1 uur geldig en werkt één keer. Heb jij dit niet aangevraagd? Dan blijft je huidige wachtwoord gewoon geldig.",
  },
  magic: {
    subject: "Je inloglink voor de boerderij",
    preview: "Meld je met één klik aan op je account.",
    kicker: "Aanmelden",
    title: "Je inloglink",
    intro:
      "Klik op de knop hieronder om je aan te melden. Je hebt geen wachtwoord nodig — dezelfde link bevestigt ook je e-mailadres.",
    cta: "Aanmelden",
    small:
      "Deze link is 1 uur geldig en werkt één keer. Deel hem met niemand: wie de link heeft, kan zich als jou aanmelden.",
  },
  passwordChanged: {
    subject: "Je wachtwoord is gewijzigd",
    preview: "Ter info: het wachtwoord van je account is aangepast.",
    kicker: "Accountbeveiliging",
    title: "Je wachtwoord is gewijzigd",
    intro:
      "Het wachtwoord van je account is net aangepast. Was jij dat? Dan hoef je niets te doen en kan je deze mail bewaren als bevestiging.",
    cta: "Naar mijn account",
    small:
      "Was jij dit niet? Stel dan onmiddellijk een nieuw wachtwoord in via 'wachtwoord vergeten' en laat het ons weten via contact@maximilien.brussels.",
  },
};

const FR: Record<AuthMailKind, AuthMailText> = {
  invite: {
    subject: "Bienvenue dans l'équipe — définissez votre mot de passe",
    preview: "Définissez votre mot de passe et accédez au portail de gestion.",
    kicker: "Accès équipe",
    title: "Bienvenue dans l'équipe",
    intro:
      "Un administrateur vous a ajouté·e à l'équipe de la ferme urbaine. Choisissez ci-dessous votre propre mot de passe : vous pourrez ensuite accéder directement au portail de gestion.",
    cta: "Définir mon mot de passe",
    small:
      "Ce lien est valable 7 jours et ne fonctionne qu'une seule fois. Expiré ? Demandez à un administrateur de vous réinviter.",
  },
  teamReset: {
    subject: "Nouveau mot de passe pour le portail de gestion",
    preview: "Définissez un nouveau mot de passe pour le portail de gestion.",
    kicker: "Accès équipe",
    title: "Définir un nouveau mot de passe",
    intro:
      "Vous avez demandé un nouveau mot de passe pour votre compte collaborateur. Cliquez ci-dessous pour en choisir un.",
    cta: "Définir un nouveau mot de passe",
    small:
      "Ce lien est valable 1 heure et ne fonctionne qu'une seule fois. Vous n'êtes pas à l'origine de cette demande ? Votre mot de passe actuel reste valable — prévenez tout de même un administrateur.",
  },
  teamMagic: {
    subject: "Votre lien de connexion au portail de gestion",
    preview: "Connectez-vous au portail de gestion en un clic.",
    kicker: "Accès équipe",
    title: "Votre lien de connexion",
    intro:
      "Cliquez sur le bouton ci-dessous pour vous connecter au portail de gestion. Aucun mot de passe n'est nécessaire.",
    cta: "Se connecter au portail",
    small:
      "Ce lien est valable 1 heure et ne fonctionne qu'une seule fois. Ne le partagez avec personne : toute personne disposant du lien peut se connecter en votre nom.",
  },
  verify: {
    subject: "Confirmez votre adresse e-mail",
    preview: "Confirmez votre adresse e-mail pour activer votre compte.",
    kicker: "Compte",
    title: "Confirmez votre adresse e-mail",
    intro:
      "Bienvenue à la ferme urbaine ! Confirmez votre adresse e-mail pour activer votre compte. Vous pourrez ensuite collecter vos Sabots, passer commande et obtenir des certificats de l'academy.",
    cta: "Confirmer mon adresse e-mail",
    small:
      "Ce lien est valable 24 heures et ne fonctionne qu'une seule fois. Vous n'avez pas créé de compte ? Ignorez simplement cet e-mail.",
  },
  welcome: {
    subject: "Bienvenue à la ferme",
    preview: "Votre compte est actif — voici tout ce qu'il permet.",
    kicker: "Bienvenue",
    title: "Votre compte est actif",
    intro:
      "Votre adresse e-mail est confirmée. Collectez des Sabots à chaque visite, commandez les produits de la ferme en Click & Collect, inscrivez-vous aux ateliers et suivez l'Academy gratuite avec certificat.",
    cta: "Vers mon compte",
    small:
      "Des questions ? Répondez simplement à cet e-mail ou appelez-nous pendant les heures d'ouverture.",
  },
  reset: {
    subject: "Définir un nouveau mot de passe",
    preview: "Définissez un nouveau mot de passe pour votre compte.",
    kicker: "Sécurité du compte",
    title: "Définir un nouveau mot de passe",
    intro:
      "Vous avez demandé un nouveau mot de passe pour votre compte. Cliquez ci-dessous pour en choisir un.",
    cta: "Définir un nouveau mot de passe",
    small:
      "Ce lien est valable 1 heure et ne fonctionne qu'une seule fois. Vous n'êtes pas à l'origine de cette demande ? Votre mot de passe actuel reste valable.",
  },
  magic: {
    subject: "Votre lien de connexion à la ferme",
    preview: "Connectez-vous à votre compte en un clic.",
    kicker: "Connexion",
    title: "Votre lien de connexion",
    intro:
      "Cliquez sur le bouton ci-dessous pour vous connecter. Aucun mot de passe n'est nécessaire — ce lien confirme aussi votre adresse e-mail.",
    cta: "Se connecter",
    small:
      "Ce lien est valable 1 heure et ne fonctionne qu'une seule fois. Ne le partagez avec personne.",
  },
  passwordChanged: {
    subject: "Votre mot de passe a été modifié",
    preview: "Pour information : le mot de passe de votre compte a été modifié.",
    kicker: "Sécurité du compte",
    title: "Votre mot de passe a été modifié",
    intro:
      "Le mot de passe de votre compte vient d'être modifié. C'était vous ? Aucune action n'est nécessaire, conservez cet e-mail comme confirmation.",
    cta: "Vers mon compte",
    small:
      "Ce n'était pas vous ? Définissez immédiatement un nouveau mot de passe via « mot de passe oublié » et prévenez-nous à contact@maximilien.brussels.",
  },
};

const EN: Record<AuthMailKind, AuthMailText> = {
  invite: {
    subject: "Welcome to the team — set your password",
    preview: "Set your password and get access to the staff portal.",
    kicker: "Team access",
    title: "Welcome to the team",
    intro:
      "An administrator added you to the city farm team. Choose your own password below and you can get started in the staff portal right away.",
    cta: "Set my password",
    small:
      "This link is valid for 7 days and works once. Expired? Ask an administrator to invite you again.",
  },
  teamReset: {
    subject: "New password for the staff portal",
    preview: "Set a new password for the staff portal.",
    kicker: "Team access",
    title: "Set a new password",
    intro: "You requested a new password for your staff account. Click below to choose one.",
    cta: "Set a new password",
    small:
      "This link is valid for 1 hour and works once. Didn't request it? Your current password stays valid — do let an administrator know.",
  },
  teamMagic: {
    subject: "Your sign-in link for the staff portal",
    preview: "Sign in to the staff portal with one click.",
    kicker: "Team access",
    title: "Your sign-in link",
    intro:
      "Click the button below to sign in to the staff portal. No password needed.",
    cta: "Sign in to the portal",
    small:
      "This link is valid for 1 hour and works once. Don't share it: anyone with the link can sign in as you.",
  },
  verify: {
    subject: "Confirm your email address",
    preview: "Confirm your email address to activate your account.",
    kicker: "Account",
    title: "Confirm your email address",
    intro:
      "Welcome to the city farm! Confirm your email address to activate your account. You can then collect Hooves, place orders and earn academy certificates.",
    cta: "Confirm my email address",
    small:
      "This link is valid for 24 hours and works once. Didn't create an account? You can safely ignore this email.",
  },
  welcome: {
    subject: "Welcome to the farm",
    preview: "Your account is active — here's what you can do with it.",
    kicker: "Welcome",
    title: "Your account is active",
    intro:
      "Your email address is confirmed. Collect Hooves on every visit, order farm products for Click & Collect pickup, sign up for workshops and follow the free Academy with certificate.",
    cta: "Go to my account",
    small: "Questions? Just reply to this email or call us during opening hours.",
  },
  reset: {
    subject: "Set a new password",
    preview: "Set a new password for your account.",
    kicker: "Account security",
    title: "Set a new password",
    intro: "You requested a new password for your account. Click below to choose one.",
    cta: "Set a new password",
    small:
      "This link is valid for 1 hour and works once. Didn't request this? Your current password stays valid.",
  },
  magic: {
    subject: "Your sign-in link for the farm",
    preview: "Sign in to your account with one click.",
    kicker: "Sign in",
    title: "Your sign-in link",
    intro:
      "Click the button below to sign in. No password needed — the same link also confirms your email address.",
    cta: "Sign in",
    small: "This link is valid for 1 hour and works once. Don't share it with anyone.",
  },
  passwordChanged: {
    subject: "Your password was changed",
    preview: "For your information: your account password was changed.",
    kicker: "Account security",
    title: "Your password was changed",
    intro:
      "Your account password was just changed. Was that you? Nothing to do — keep this email as confirmation.",
    cta: "Go to my account",
    small:
      "Wasn't you? Set a new password right away via 'forgot password' and let us know at contact@maximilien.brussels.",
  },
};

export const AUTH_MAIL_COPY: Record<MailLang, Record<AuthMailKind, AuthMailText>> = {
  nl: NL,
  fr: FR,
  en: EN,
};

/** Alle sjablonen, in de volgorde waarin ze in het portaal getoond worden. */
export const AUTH_MAIL_KINDS: AuthMailKind[] = [
  "invite",
  "teamReset",
  "teamMagic",
  "verify",
  "welcome",
  "reset",
  "magic",
  "passwordChanged",
];
