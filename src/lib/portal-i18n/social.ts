import type { Dict } from "./types";

/** Teksten voor de portaalpagina "social" (NL/FR/EN). */
export const socialDict: Dict = {
  "social.title": { fr: "Social", nl: "Social", en: "Social" },
  "social.subtitle": {
    fr: "Messages entrants, publications propres et banque d'images.",
    nl: "Binnenkomende berichten, eigen posts en beeldbank.",
    en: "Incoming posts, your own posts and the image library.",
  },
  "social.tab.incoming": { fr: "Messages entrants", nl: "Binnenkomend", en: "Incoming" },
  "social.tab.own": { fr: "Publications propres", nl: "Eigen berichten", en: "Own posts" },
  "social.tab.library": { fr: "Banque d'images", nl: "Beeldbank", en: "Image library" },

  "social.hide": { fr: "Masquer", nl: "Verbergen", en: "Hide" },
  "social.show": { fr: "Afficher", nl: "Tonen", en: "Show" },
  "social.hidden": { fr: "Masqué", nl: "Verborgen", en: "Hidden" },
  "social.visible": { fr: "Visible", nl: "Zichtbaar", en: "Visible" },
  "social.hiddenToast": { fr: "Message masqué", nl: "Bericht verborgen", en: "Post hidden" },
  "social.shownToast": { fr: "Message affiché", nl: "Bericht zichtbaar", en: "Post visible" },
  "social.openOriginal": { fr: "Voir l'original", nl: "Bekijk origineel", en: "View original" },
  "social.noIncoming": {
    fr: "Aucun message entrant pour l'instant.",
    nl: "Nog geen binnenkomende berichten.",
    en: "No incoming posts yet.",
  },

  "social.newPost": { fr: "Nouvelle publication", nl: "Nieuw bericht", en: "New post" },
  "social.editPost": { fr: "Modifier la publication", nl: "Bericht bewerken", en: "Edit post" },
  "social.textNl": { fr: "Texte (NL)", nl: "Tekst (NL)", en: "Text (NL)" },
  "social.textFr": { fr: "Texte (FR)", nl: "Tekst (FR)", en: "Text (FR)" },
  "social.textEn": { fr: "Texte (EN)", nl: "Tekst (EN)", en: "Text (EN)" },
  "social.image": { fr: "Image", nl: "Afbeelding", en: "Image" },
  "social.chooseImage": { fr: "Choisir une image", nl: "Afbeelding kiezen", en: "Choose image" },
  "social.removeImage": { fr: "Retirer l'image", nl: "Afbeelding verwijderen", en: "Remove image" },
  "social.link": { fr: "Lien (optionnel)", nl: "Link (optioneel)", en: "Link (optional)" },
  "social.publishedOn": { fr: "Publié le", nl: "Gepubliceerd op", en: "Published on" },
  "social.active": { fr: "Actif", nl: "Actief", en: "Active" },
  "social.noPosts": {
    fr: "Aucune publication propre pour l'instant.",
    nl: "Nog geen eigen berichten.",
    en: "No own posts yet.",
  },
  "social.saved": { fr: "Publication enregistrée", nl: "Bericht opgeslagen", en: "Post saved" },
  "social.deleted": { fr: "Publication supprimée", nl: "Bericht verwijderd", en: "Post deleted" },
  "social.deleteConfirm": {
    fr: "Supprimer cette publication ?",
    nl: "Dit bericht verwijderen?",
    en: "Delete this post?",
  },
  "social.textRequired": {
    fr: "Le texte néerlandais est obligatoire.",
    nl: "Nederlandse tekst is verplicht.",
    en: "Dutch text is required.",
  },
  "social.noAccess": {
    fr: "Vous n'avez pas accès à Social.",
    nl: "Je hebt geen toegang tot Social.",
    en: "You don't have access to Social.",
  },

  "social.hardDelete": { fr: "Supprimer définitivement", nl: "Definitief verwijderen", en: "Delete permanently" },
  "social.hardDeleteTitle": {
    fr: "Supprimer définitivement cette publication Bluesky ?",
    nl: "Deze Bluesky-post definitief verwijderen?",
    en: "Permanently delete this Bluesky post?",
  },
  "social.hardDeleteBody": {
    fr: "La publication est effacée de Bluesky même, sans possibilité de récupération.",
    nl: "De post wordt op Bluesky zelf gewist en kan niet meer hersteld worden.",
    en: "The post is erased from Bluesky itself and cannot be recovered.",
  },
  "social.hardDeleted": {
    fr: "Publication définitivement supprimée",
    nl: "Post definitief verwijderd",
    en: "Post permanently deleted",
  },
};
