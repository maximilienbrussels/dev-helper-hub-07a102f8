import type { Lang } from "./portal-types";
import type { Dict, Entry } from "./portal-i18n/types";
import { shopDict } from "./portal-i18n/shop";
import { academyDict } from "./portal-i18n/academy";
import { calendarDict } from "./portal-i18n/calendar";
import { socialDict } from "./portal-i18n/social";
import { requestsDict } from "./portal-i18n/requests";
import { servicesDict } from "./portal-i18n/services";

export type { Dict, Entry };

const dict: Dict = {
  // Brand & shell
  "app.name": {
    fr: "Maximilien",
    nl: "Maximilien",
    en: "Maximilien",
  },
  "app.brand": { fr: "Maximilien Manager", nl: "Maximilien Manager", en: "Maximilien Manager" },
  "app.portal": { fr: "Portail de gestion", nl: "Beheerportaal", en: "Management portal" },
  "app.session": { fr: "Session sécurisée", nl: "Beveiligde sessie", en: "Secure session" },

  // Navigation
  "nav.today": { fr: "Aujourd'hui", nl: "Vandaag", en: "Today" },
  "nav.requests": { fr: "Demandes", nl: "Aanvragen", en: "Requests" },
  "nav.calendar": { fr: "Calendrier", nl: "Kalender", en: "Calendar" },
  "nav.services": { fr: "Services & Tarifs", nl: "Diensten & Tarieven", en: "Services & Rates" },
  "nav.team": { fr: "Équipe", nl: "Team", en: "Team" },
  "nav.shop": { fr: "Produits & Boutique", nl: "Producten & Webshop", en: "Products & Shop" },
  "nav.scan": { fr: "Scanner", nl: "Scannen", en: "Scan" },
  "nav.pickups": { fr: "Retraits", nl: "Afhalingen", en: "Pickups" },
  "nav.academy": { fr: "Académies", nl: "Academies", en: "Academies" },
  "nav.results": { fr: "Résultats Academy", nl: "Academy-resultaten", en: "Academy results" },
  "nav.social": { fr: "Réseaux sociaux", nl: "Social Media", en: "Social Media" },
  "nav.albums": { fr: "Albums photos", nl: "Fotoalbums", en: "Photo albums" },
  "nav.residents": { fr: "Résidents & animaux", nl: "Bewoners & dieren", en: "Residents & animals" },
  "nav.media": { fr: "Médiathèque", nl: "Mediabibliotheek", en: "Media library" },
  "nav.email": { fr: "E-mail", nl: "E-mail", en: "Email" },
  // Veld-app (maximilien.app)
  "field.today": { fr: "Aujourd'hui", nl: "Vandaag", en: "Today" },
  "field.requests": { fr: "Demandes", nl: "Aanvragen", en: "Requests" },
  "field.scan": { fr: "Scan", nl: "Scan", en: "Scan" },
  "field.services": { fr: "Services", nl: "Diensten", en: "Services" },
  "field.more": { fr: "Plus", nl: "Meer", en: "More" },
  "field.groups": { fr: "Groupes", nl: "Groepen", en: "Groups" },
  "field.visitors": { fr: "Visiteurs", nl: "Bezoekers", en: "Visitors" },
  "field.noToday": { fr: "Aucune activité aujourd'hui.", nl: "Geen activiteiten vandaag.", en: "No activities today." },
  "field.noRequests": { fr: "Aucune demande dans cette liste.", nl: "Geen aanvragen in deze lijst.", en: "No requests in this list." },
  "field.noServices": { fr: "Aucun service actif.", nl: "Geen actieve diensten.", en: "No active services." },
  "field.checkIn": { fr: "Enregistrer", nl: "Aanmelden", en: "Check in" },
  "field.checkedIn": { fr: "Arrivé", nl: "Aangekomen", en: "Arrived" },
  "field.confirm": { fr: "Confirmer", nl: "Bevestigen", en: "Confirm" },
  "field.saving": { fr: "Enregistrement…", nl: "Bezig…", en: "Saving…" },
  "field.retry": { fr: "Réessayer", nl: "Opnieuw proberen", en: "Try again" },
  "field.call": { fr: "Appeler", nl: "Bellen", en: "Call" },
  "field.mail": { fr: "E-mail", nl: "Mailen", en: "Email" },
  "field.search": { fr: "Rechercher par nom ou e-mail", nl: "Zoek op naam of e-mail", en: "Search by name or email" },
  "field.filter.open": { fr: "Ouvert", nl: "Open", en: "Open" },
  "field.filter.new": { fr: "Nouveau", nl: "Nieuw", en: "New" },
  "field.filter.confirmed": { fr: "Confirmé", nl: "Bevestigd", en: "Confirmed" },
  "field.filter.done": { fr: "Terminé", nl: "Afgerond", en: "Done" },
  "field.refresh": { fr: "Actualiser les données", nl: "Gegevens vernieuwen", en: "Refresh data" },
  "field.pullToRefresh": { fr: "Tirez pour actualiser", nl: "Trek om te vernieuwen", en: "Pull to refresh" },
  "field.release": { fr: "Relâchez pour actualiser", nl: "Laat los om te vernieuwen", en: "Release to refresh" },
  "field.refreshing": { fr: "Actualisation…", nl: "Vernieuwen…", en: "Refreshing…" },
  "field.offline": { fr: "Pas de connexion — vous voyez les dernières données chargées", nl: "Geen verbinding — je ziet de laatst geladen gegevens", en: "No connection — showing the last loaded data" },
  "field.offlineWrite": { fr: "Vous êtes hors ligne — cette modification n'a pas été enregistrée.", nl: "Je bent offline — deze wijziging is niet bewaard.", en: "You are offline — this change was not saved." },
  "field.openManager": { fr: "Ouvrir la gestion complète", nl: "Volledig beheer openen", en: "Open full manager" },
  "field.signOut": { fr: "Se déconnecter", nl: "Afmelden", en: "Sign out" },
  "field.language": { fr: "Langue", nl: "Taal", en: "Language" },
  "field.install": { fr: "Installer sur l'écran d'accueil", nl: "Op startscherm zetten", en: "Add to home screen" },
  "field.errorTitle": { fr: "Er ging iets mis", nl: "Er ging iets mis", en: "Something went wrong" },
  "field.team": { fr: "Équipe", nl: "Team", en: "Team" },
  "field.admin": { fr: "Administrateur", nl: "Beheerder", en: "Administrator" },
  "nav.more": { fr: "Plus", nl: "Meer", en: "More" },
  "nav.api": { fr: "API & Intégrations", nl: "API & Integraties", en: "API & Integrations" },
  "nav.copilot": { fr: "Maxim AI", nl: "Maxim AI", en: "Maxim AI" },

  // Sidebar groups
  "navgroup.work": { fr: "Exploitation", nl: "Werking", en: "Operations" },
  "navgroup.content": { fr: "Contenu & communication", nl: "Inhoud & communicatie", en: "Content & communication" },
  "navgroup.admin": { fr: "Paramètres", nl: "Instellingen", en: "Settings" },
  "nav.collapse": { fr: "Réduire le menu", nl: "Menu inklappen", en: "Collapse menu" },
  "nav.expand": { fr: "Déplier le menu", nl: "Menu uitklappen", en: "Expand menu" },

  // Tables
  "table.page": { fr: "Page", nl: "Pagina", en: "Page" },
  "table.results": { fr: "résultats", nl: "resultaten", en: "results" },
  "table.prev": { fr: "Précédent", nl: "Vorige", en: "Previous" },
  "table.next": { fr: "Suivant", nl: "Volgende", en: "Next" },


  // API keys
  "api.title": { fr: "API & Intégrations", nl: "API & Integraties", en: "API & Integrations" },
  "api.subtitle": {
    fr: "Gérez les clés API pour les intégrations externes.",
    nl: "Beheer API-sleutels voor externe integraties.",
    en: "Manage API keys for external integrations.",
  },
  "api.new": { fr: "Nouvelle clé", nl: "Nieuwe sleutel", en: "New key" },
  "api.newTitle": { fr: "Nouvelle clé API", nl: "Nieuwe API-sleutel", en: "New API key" },
  "api.name": { fr: "Nom", nl: "Naam", en: "Name" },
  "api.namePlaceholder": { fr: "Ex. Intégration caisse", nl: "Bv. Kassa-integratie", en: "E.g. POS integration" },
  "api.scopes": { fr: "Portées (scopes)", nl: "Rechten (scopes)", en: "Scopes" },
  "api.group.shop": { fr: "Gestion de la ferme-boutique", nl: "Hoevewinkel beheer", en: "Farm shop management" },
  "api.group.bookings": { fr: "Lecture des réservations", nl: "Boekingen uitlezen", en: "Read bookings" },
  "api.group.maxim": { fr: "Mise à jour base de connaissances Maxim", nl: "Maxim kennisbank update", en: "Maxim knowledge base update" },
  "api.scope.read:products": { fr: "Lire les produits", nl: "Producten lezen", en: "Read products" },
  "api.scope.write:products": { fr: "Modifier les produits", nl: "Producten wijzigen", en: "Write products" },
  "api.scope.read:bookings": { fr: "Lire les réservations", nl: "Boekingen lezen", en: "Read bookings" },
  "api.scope.write:bookings": { fr: "Modifier les réservations", nl: "Boekingen wijzigen", en: "Write bookings" },
  "api.scope.read:animals": { fr: "Lire les animaux", nl: "Dieren lezen", en: "Read animals" },
  "api.scope.write:maxim": { fr: "Publier des annonces Maxim", nl: "Maxim-aankondigingen publiceren", en: "Write Maxim announcements" },
  "api.create": { fr: "Créer la clé", nl: "Sleutel aanmaken", en: "Create key" },
  "api.created": { fr: "Clé créée", nl: "Sleutel aangemaakt", en: "Key created" },
  "api.rawKeyWarning": {
    fr: "Copiez cette clé maintenant : elle ne sera plus jamais affichée.",
    nl: "Kopieer deze sleutel nu: ze wordt daarna nooit meer getoond.",
    en: "Copy this key now: it will never be shown again.",
  },
  "api.copy": { fr: "Copier", nl: "Kopiëren", en: "Copy" },
  "api.copied": { fr: "Copié", nl: "Gekopieerd", en: "Copied" },
  "api.col.name": { fr: "Nom", nl: "Naam", en: "Name" },
  "api.col.prefix": { fr: "Préfixe", nl: "Prefix", en: "Prefix" },
  "api.col.scopes": { fr: "Portées", nl: "Rechten", en: "Scopes" },
  "api.col.lastUsed": { fr: "Dernière utilisation", nl: "Laatst gebruikt", en: "Last used" },
  "api.col.status": { fr: "Statut", nl: "Status", en: "Status" },
  "api.col.actions": { fr: "Actions", nl: "Acties", en: "Actions" },
  "api.active": { fr: "Actif", nl: "Actief", en: "Active" },
  "api.inactive": { fr: "Révoqué", nl: "Ingetrokken", en: "Revoked" },
  "api.deactivate": { fr: "Révoquer", nl: "Deactiveer / Intrekken", en: "Deactivate" },
  "api.reactivate": { fr: "Réactiver", nl: "Heractiveren", en: "Reactivate" },
  "api.never": { fr: "Jamais", nl: "Nooit", en: "Never" },
  "api.empty": { fr: "Aucune clé API pour l'instant.", nl: "Nog geen API-sleutels.", en: "No API keys yet." },
  "api.cancel": { fr: "Annuler", nl: "Annuleren", en: "Cancel" },
  "api.close": { fr: "Fermer", nl: "Sluiten", en: "Close" },

  // Media library
  "media.subtitle": {
    fr: "Une seule source pour toutes les images du portail et du site public.",
    nl: "Eén bron voor alle beelden van portaal en publieke site.",
    en: "One source for every image on the portal and public site.",
  },
  "media.upload": { fr: "Téléverser", nl: "Opladen", en: "Upload" },
  "media.dropHere": {
    fr: "Glissez des images ici ou cliquez pour choisir",
    nl: "Sleep beelden hierheen of klik om te kiezen",
    en: "Drop images here or click to choose",
  },
  "media.dropHint": {
    fr: "JPG, PNG, WebP, GIF, AVIF ou SVG — max. 8 Mo par fichier",
    nl: "JPG, PNG, WebP, GIF, AVIF of SVG — max. 8 MB per bestand",
    en: "JPG, PNG, WebP, GIF, AVIF or SVG — max. 8 MB per file",
  },
  "media.search": { fr: "Rechercher…", nl: "Zoeken…", en: "Search…" },
  "media.allCategories": { fr: "Toutes les catégories", nl: "Alle categorieën", en: "All categories" },
  "media.sortNewest": { fr: "Plus récent", nl: "Nieuwste eerst", en: "Newest first" },
  "media.sortOldest": { fr: "Plus ancien", nl: "Oudste eerst", en: "Oldest first" },
  "media.sortName": { fr: "Nom A–Z", nl: "Naam A–Z", en: "Name A–Z" },
  "media.sortSize": { fr: "Taille", nl: "Grootte", en: "Size" },
  "media.empty": {
    fr: "Aucune image pour l'instant.",
    nl: "Nog geen beelden.",
    en: "No images yet.",
  },
  "media.noResults": {
    fr: "Aucun résultat pour ce filtre.",
    nl: "Geen resultaten voor deze filter.",
    en: "No results for this filter.",
  },
  "media.details": { fr: "Détails", nl: "Details", en: "Details" },
  "media.title": { fr: "Titre", nl: "Titel", en: "Title" },
  "media.alt": { fr: "Texte alternatif", nl: "Alt-tekst", en: "Alt text" },
  "media.altHint": {
    fr: "Décrit l'image pour les lecteurs d'écran et le SEO.",
    nl: "Beschrijft het beeld voor schermlezers en SEO.",
    en: "Describes the image for screen readers and SEO.",
  },
  "media.description": { fr: "Description", nl: "Beschrijving", en: "Description" },
  "media.category": { fr: "Catégorie", nl: "Categorie", en: "Category" },
  "media.copyUrl": { fr: "Copier l'URL", nl: "URL kopiëren", en: "Copy URL" },
  "media.copied": { fr: "URL copiée", nl: "URL gekopieerd", en: "URL copied" },
  "media.replace": { fr: "Remplacer l'image", nl: "Beeld vervangen", en: "Replace image" },
  "media.replaceHint": {
    fr: "L'URL reste identique : chaque page qui utilise cette image est mise à jour.",
    nl: "De URL blijft gelijk: elke pagina die dit beeld gebruikt wordt mee bijgewerkt.",
    en: "The URL stays the same: every page using this image updates too.",
  },
  "media.delete": { fr: "Supprimer", nl: "Verwijderen", en: "Delete" },
  "media.deleteTitle": { fr: "Supprimer cette image ?", nl: "Dit beeld verwijderen?", en: "Delete this image?" },
  "media.deleteBody": {
    fr: "Les pages qui utilisent cette URL afficheront une image manquante. Cette action est définitive.",
    nl: "Pagina's die deze URL gebruiken tonen daarna een ontbrekend beeld. Dit kan niet ongedaan worden gemaakt.",
    en: "Pages using this URL will show a missing image. This cannot be undone.",
  },
  "media.saved": { fr: "Métadonnées enregistrées", nl: "Metadata opgeslagen", en: "Metadata saved" },
  "media.uploaded": { fr: "Image téléversée", nl: "Beeld opgeladen", en: "Image uploaded" },
  "media.replaced": { fr: "Image remplacée", nl: "Beeld vervangen", en: "Image replaced" },
  "media.deleted": { fr: "Image supprimée", nl: "Beeld verwijderd", en: "Image deleted" },
  "media.readOnly": {
    fr: "Vous pouvez consulter la médiathèque, mais pas la modifier.",
    nl: "Je kunt de mediabibliotheek bekijken, maar niet wijzigen.",
    en: "You can browse the media library but not change it.",
  },
  "media.count": { fr: "images", nl: "beelden", en: "images" },
  "media.pick": { fr: "Choisir une image", nl: "Kies een beeld", en: "Choose an image" },
  "media.use": { fr: "Utiliser", nl: "Gebruiken", en: "Use" },
  "media.dimensions": { fr: "Dimensions", nl: "Afmetingen", en: "Dimensions" },
  "media.uploadedOn": { fr: "Ajouté le", nl: "Toegevoegd op", en: "Added on" },
  "media.trash": { fr: "Corbeille", nl: "Prullenbak", en: "Trash" },
  "media.trashEmpty": { fr: "La corbeille est vide.", nl: "De prullenbak is leeg.", en: "The trash is empty." },
  "media.restore": { fr: "Restaurer", nl: "Herstellen", en: "Restore" },
  "media.restored": { fr: "Image restaurée", nl: "Beeld hersteld", en: "Image restored" },
  "media.hardDelete": { fr: "Supprimer définitivement", nl: "Definitief verwijderen", en: "Delete permanently" },
  "media.hardDeleted": { fr: "Image supprimée définitivement", nl: "Beeld definitief verwijderd", en: "Image permanently deleted" },
  "media.hardDeleteTitle": { fr: "Supprimer définitivement cette image ?", nl: "Dit beeld definitief verwijderen?", en: "Permanently delete this image?" },
  "media.hardDeleteBody": {
    fr: "Le fichier est effacé du serveur, sans possibilité de récupération.",
    nl: "Het bestand wordt van de server gewist en kan niet meer hersteld worden.",
    en: "The file is erased from the server and can no longer be recovered.",
  },

  // Account menu
  "menu.settings": { fr: "Paramètres", nl: "Instellingen", en: "Settings" },
  "menu.team": { fr: "Équipe & utilisateurs", nl: "Team & gebruikers", en: "Team & users" },
  "menu.signOut": { fr: "Se déconnecter", nl: "Afmelden", en: "Sign out" },
  "menu.notifications": { fr: "Notifications", nl: "Meldingen", en: "Notifications" },
  "menu.account": { fr: "Mon compte", nl: "Mijn account", en: "My account" },
  "menu.language": { fr: "Langue", nl: "Taal", en: "Language" },
  "menu.security": {
    fr: "Profil & sécurité",
    nl: "Profiel & beveiliging",
    en: "Profile & security",
  },
  "menu.openFieldApp": {
    fr: "Ouvrir dans l'app terrain",
    nl: "Openen in de veld-app",
    en: "Open in the field app",
  },
  "menu.theme": { fr: "Thème", nl: "Thema", en: "Theme" },

  "theme.light": { fr: "Clair", nl: "Licht", en: "Light" },
  "theme.dark": { fr: "Sombre", nl: "Donker", en: "Dark" },
  "theme.system": { fr: "Système", nl: "Systeem", en: "System" },


  "role.admin": { fr: "Admin", nl: "Admin", en: "Admin" },
  "role.team": { fr: "Équipe", nl: "Team", en: "Team" },

  // Today
  "today.groups": { fr: "Groupes aujourd'hui", nl: "Groepen vandaag", en: "Groups today" },
  "today.visitors": {
    fr: "Visiteurs au total",
    nl: "Totaal aantal bezoekers",
    en: "Total visitors",
  },
  "today.zones": { fr: "Zones réservées", nl: "Gereserveerde zones", en: "Reserved zones" },
  "today.timeline": { fr: "Planning du jour", nl: "Dagplanning", en: "Day planning" },
  "today.empty": {
    fr: "Aucune réservation aujourd'hui.",
    nl: "Vandaag geen reservaties.",
    en: "No bookings today.",
  },
  "today.checkin": { fr: "Check-in", nl: "Check-in", en: "Check-in" },
  "today.arrived": { fr: "Arrivé", nl: "Aangekomen", en: "Arrived" },
  "today.arrivedToast": { fr: "groupe arrivé", nl: "groep aangekomen", en: "group arrived" },
  "today.undoToast": {
    fr: "Check-in annulé",
    nl: "Check-in ongedaan gemaakt",
    en: "Check-in undone",
  },
  "today.call": { fr: "Appeler", nl: "Bellen", en: "Call" },

  // Notes
  "notes.internal": { fr: "Notes internes", nl: "Interne notities", en: "Internal notes" },
  "notes.add": { fr: "Ajouter une note…", nl: "Notitie toevoegen…", en: "Add a note…" },
  "notes.none": { fr: "Aucune note.", nl: "Nog geen notities.", en: "No notes yet." },

  // Requests
  "requests.kanban": { fr: "Kanban", nl: "Kanban", en: "Kanban" },
  "requests.table": { fr: "Tableau", nl: "Tabel", en: "Table" },
  "requests.list": { fr: "Liste", nl: "Lijst", en: "List" },
  "requests.search": { fr: "Rechercher…", nl: "Zoeken…", en: "Search…" },
  "requests.filterStatus": { fr: "Tous les statuts", nl: "Alle statussen", en: "All statuses" },
  "requests.filterFrom": { fr: "Date de début", nl: "Datum vanaf", en: "Date from" },
  "requests.filterUntil": { fr: "Date de fin", nl: "Datum tot", en: "Date until" },
  "requests.filterReset": { fr: "Réinitialiser", nl: "Wissen", en: "Reset" },
  "requests.count": { fr: "demandes", nl: "aanvragen", en: "requests" },
  "requests.empty": { fr: "Aucune demande.", nl: "Geen aanvragen.", en: "No requests." },
  "requests.filters": { fr: "Filtres rapides", nl: "Snelle filters", en: "Quick filters" },
  "requests.allFilters": { fr: "Tout", nl: "Alles", en: "All" },

  // Statuses
  "status.nieuw": { fr: "Nouveau", nl: "Nieuw", en: "New" },
  "status.in_behandeling": { fr: "En traitement", nl: "In behandeling", en: "In progress" },
  "status.offerte_verzonden": { fr: "Devis envoyé", nl: "Offerte verzonden", en: "Quote sent" },
  "status.gereserveerd": {
    fr: "Réservé / Payé",
    nl: "Gereserveerd / Betaald",
    en: "Booked / Paid",
  },
  "status.afgerond": { fr: "Terminé", nl: "Afgerond", en: "Completed" },
  "status.geannuleerd": { fr: "Annulé", nl: "Geannuleerd", en: "Cancelled" },
  statusChanged: { fr: "Statut mis à jour", nl: "Status bijgewerkt", en: "Status updated" },

  // Types
  "type.teambuilding": { fr: "Teambuilding", nl: "Teambuilding", en: "Teambuilding" },
  "type.privatisering": { fr: "Privatisation", nl: "Privatisering", en: "Private hire" },
  "type.zaalverhuur": { fr: "Location de salle", nl: "Zaalverhuur", en: "Room rental" },
  "type.geblokkeerd": { fr: "Bloqué", nl: "Geblokkeerd", en: "Blocked" },

  // Actions
  "action.confirm": {
    fr: "Envoyer confirmation",
    nl: "Stuur bevestiging",
    en: "Send confirmation",
  },
  "action.quote": { fr: "Envoyer lien devis", nl: "Stuur offerte-link", en: "Send quote link" },
  "action.reject": { fr: "Refuser", nl: "Wijs af", en: "Reject" },
  "action.delete": { fr: "Supprimer", nl: "Verwijderen", en: "Delete" },

  // Calendar
  "calendar.filter": { fr: "Filtrer par lieu", nl: "Filter op ruimte", en: "Filter by location" },
  "calendar.all": { fr: "Tous les espaces", nl: "Alle ruimtes", en: "All spaces" },
  "calendar.block": { fr: "Bloquer une date", nl: "Datum blokkeren", en: "Block a date" },
  "calendar.blocked": { fr: "Bloqué", nl: "Geblokkeerd", en: "Blocked" },
  "calendar.newBooking": { fr: "Réservation", nl: "Reservering", en: "Booking" },
  "calendar.manualBooking": {
    fr: "Réservation manuelle",
    nl: "Handmatige reservering",
    en: "Manual booking",
  },
  "calendar.month": { fr: "Mois", nl: "Maand", en: "Month" },
  "calendar.agenda": { fr: "Agenda", nl: "Agenda", en: "Agenda" },
  "calendar.today": { fr: "Aujourd'hui", nl: "Vandaag", en: "Today" },
  "calendar.prev": { fr: "Mois précédent", nl: "Vorige maand", en: "Previous month" },
  "calendar.next": { fr: "Mois suivant", nl: "Volgende maand", en: "Next month" },
  "calendar.noneDay": {
    fr: "Aucune réservation ce jour.",
    nl: "Geen reservaties op deze dag.",
    en: "No bookings on this day.",
  },
  "calendar.noneMonth": {
    fr: "Aucune réservation ce mois-ci.",
    nl: "Geen reservaties deze maand.",
    en: "No bookings this month.",
  },
  "calendar.reason": { fr: "Motif", nl: "Reden", en: "Reason" },
  "calendar.reasonHint": {
    fr: "Entretien, jour de fermeture, école…",
    nl: "Onderhoud, sluitingsdag, school…",
    en: "Maintenance, closing day, school…",
  },
  "calendar.blockAction": { fr: "Bloquer", nl: "Blokkeren", en: "Block" },
  "calendar.blockedToast": { fr: "Date bloquée", nl: "Datum geblokkeerd", en: "Date blocked" },
  "calendar.checkTimes": {
    fr: "Vérifiez la date et les heures",
    nl: "Controleer datum en uren",
    en: "Check the date and times",
  },

  // Services
  "services.title": { fr: "Services & Tarifs", nl: "Diensten & Tarieven", en: "Services & Rates" },
  "services.active": { fr: "En ligne", nl: "Online", en: "Online" },
  "services.inactive": { fr: "Hors ligne", nl: "Offline", en: "Offline" },
  "services.count": { fr: "formules", nl: "arrangementen", en: "packages" },
  "services.edit": { fr: "Modifier le service", nl: "Dienst bewerken", en: "Edit service" },
  "services.basePrice": { fr: "Prix de base (€)", nl: "Basisprijs (€)", en: "Base price (€)" },
  "services.visible": {
    fr: "Visible sur le site",
    nl: "Zichtbaar op de website",
    en: "Visible on the website",
  },
  "services.title.label": { fr: "Titre", nl: "Titel", en: "Title" },
  "services.desc.label": { fr: "Description", nl: "Beschrijving", en: "Description" },
  "services.saved": { fr: "Service mis à jour", nl: "Dienst bijgewerkt", en: "Service updated" },
  "services.online": {
    fr: "Service en ligne",
    nl: "Dienst online gezet",
    en: "Service set online",
  },
  "services.offline": {
    fr: "Service hors ligne",
    nl: "Dienst offline gezet",
    en: "Service set offline",
  },

  // Team
  "team.members": { fr: "collaborateurs actifs", nl: "actieve medewerkers", en: "active staff" },
  "team.matrix": { fr: "Matrice des droits", nl: "Rechtenmatrix", en: "Permission matrix" },
  "team.action": { fr: "Action", nl: "Actie", en: "Action" },
  "team.active": { fr: "Actif", nl: "Actief", en: "Active" },
  "team.inactive": { fr: "Inactif", nl: "Inactief", en: "Inactive" },
  "team.add": { fr: "Collaborateur", nl: "Medewerker", en: "Staff member" },
  "team.addTitle": {
    fr: "Ajouter un collaborateur",
    nl: "Medewerker toevoegen",
    en: "Add a staff member",
  },
  "team.master": { fr: "Master admin", nl: "Master admin", en: "Master admin" },
  "team.denied": { fr: "Accès refusé", nl: "Geen toegang", en: "Access denied" },
  "team.deniedBody": {
    fr: "Seuls les administrateurs gèrent les profils de l'équipe.",
    nl: "Enkel beheerders kunnen teamprofielen beheren.",
    en: "Only administrators can manage team profiles.",
  },
  "team.updated": {
    fr: "Collaborateur mis à jour",
    nl: "Teamlid bijgewerkt",
    en: "Staff member updated",
  },

  // Permission rows
  "perm.today": {
    fr: "Aperçu du jour & check-ins",
    nl: "Dagoverzicht & check-ins",
    en: "Day overview & check-ins",
  },
  "perm.requests": {
    fr: "Voir les demandes & changer les statuts",
    nl: "Aanvragen bekijken & statussen wijzigen",
    en: "View requests & change statuses",
  },
  "perm.notes": {
    fr: "Ajouter des notes internes",
    nl: "Interne notities toevoegen",
    en: "Add internal notes",
  },
  "perm.calendar": {
    fr: "Bloquer le calendrier & réserver",
    nl: "Kalender blokkeren & reservaties",
    en: "Block the calendar & book",
  },
  "perm.rates": {
    fr: "Modifier tarifs & textes",
    nl: "Tarieven & teksten bewerken",
    en: "Edit rates & texts",
  },
  "perm.delete": {
    fr: "Supprimer définitivement des demandes",
    nl: "Aanvragen definitief verwijderen",
    en: "Permanently delete requests",
  },
  "perm.team": {
    fr: "Gérer l'équipe & les rôles",
    nl: "Teamleden & rollen beheren",
    en: "Manage staff & roles",
  },

  // Rights & roles
  "right.view_today": { fr: "Voir l'aperçu du jour", nl: "Dagoverzicht bekijken", en: "View today's overview" },
  "right.view_requests": { fr: "Voir les demandes", nl: "Aanvragen bekijken", en: "View requests" },
  "right.manage_requests": { fr: "Gérer les demandes", nl: "Aanvragen beheren", en: "Manage requests" },
  "right.view_calendar": { fr: "Voir le calendrier", nl: "Kalender bekijken", en: "View calendar" },
  "right.manage_calendar": { fr: "Gérer le calendrier", nl: "Kalender beheren", en: "Manage calendar" },
  "right.view_services": { fr: "Voir les services", nl: "Diensten bekijken", en: "View services" },
  "right.manage_services": {
    fr: "Gérer services & tarifs",
    nl: "Diensten & tarieven beheren",
    en: "Manage services & rates",
  },
  "right.view_shop": { fr: "Voir la boutique", nl: "Webshop bekijken", en: "View shop" },
  "right.manage_products": { fr: "Gérer les produits", nl: "Producten beheren", en: "Manage products" },
  "right.manage_orders": { fr: "Gérer les commandes", nl: "Bestellingen beheren", en: "Manage orders" },
  "right.view_academy": { fr: "Voir les académies", nl: "Academies bekijken", en: "View academies" },
  "right.manage_academy": {
    fr: "Gérer les académies",
    nl: "Academykaarten beheren",
    en: "Manage academies",
  },
  "right.publish_academy": {
    fr: "Publier les académies",
    nl: "Academykaarten publiceren",
    en: "Publish academies",
  },
  "right.view_team": { fr: "Voir l'équipe", nl: "Team bekijken", en: "View team" },
  "right.manage_team": {
    fr: "Gérer l'équipe & les rôles",
    nl: "Team & rollen beheren",
    en: "Manage team & roles",
  },
  "right.manage_rights": {
    fr: "Gérer la matrice des droits",
    nl: "Rechtenmatrix beheren",
    en: "Manage rights matrix",
  },
  "right.view_media": { fr: "Voir la médiathèque", nl: "Mediabibliotheek bekijken", en: "View media library" },
  "right.manage_media": {
    fr: "Téléverser, remplacer & supprimer des médias",
    nl: "Media opladen, vervangen & verwijderen",
    en: "Upload, replace & delete media",
  },
  "right.view_audit": {
    fr: "Voir le journal des modifications",
    nl: "Wijzigingslogboek bekijken",
    en: "View change log",
  },
  "right.manage_settings": {
    fr: "Gérer les paramètres du site",
    nl: "Site-instellingen beheren",
    en: "Manage site settings",
  },
  "right.manage_content": {
    fr: "Gérer le contenu des pages",
    nl: "Paginateksten beheren",
    en: "Manage page content",
  },
  "nav.site": { fr: "Site", nl: "Site", en: "Site" },
  "nav.log": { fr: "Journal", nl: "Logboek", en: "Log" },

  "log.title": { fr: "Journal & corbeille", nl: "Logboek & prullenbak", en: "Log & trash" },
  "log.subtitle": {
    fr: "Qui a modifié quoi, et récupération des éléments supprimés (30 jours).",
    nl: "Wie wijzigde wat, en herstel van verwijderde items (30 dagen).",
    en: "Who changed what, and recovery of deleted items (30 days).",
  },
  "log.empty": { fr: "Rien à afficher", nl: "Nog niets te tonen", en: "Nothing to show yet" },
  "log.restore": { fr: "Restaurer", nl: "Herstellen", en: "Restore" },
  "log.trash": { fr: "Corbeille", nl: "Prullenbak", en: "Trash" },
  "log.activity": { fr: "Activité", nl: "Activiteit", en: "Activity" },

  // Team & roles management
  "team.title": { fr: "Équipe & rôles", nl: "Team & rollen", en: "Team & roles" },
  "team.activeCount": {
    fr: "collaborateurs actifs",
    nl: "actieve medewerkers",
    en: "active team members",
  },
  "team.addPerson": { fr: "Ajouter une personne", nl: "Persoon toevoegen", en: "Add person" },
  "team.addPersonHint": {
    fr: "La personne reçoit un e-mail pour choisir son mot de passe.",
    nl: "De persoon krijgt een e-mail om een eigen wachtwoord te kiezen.",
    en: "The person receives an email to choose their own password.",
  },
  "team.fullName": { fr: "Nom complet", nl: "Volledige naam", en: "Full name" },
  "team.workEmail": { fr: "E-mail professionnel", nl: "Werk-e-mailadres", en: "Work email" },
  "team.roles": { fr: "Rôles", nl: "Rollen", en: "Roles" },
  "team.rolesHint": {
    fr: "Cochez un ou plusieurs rôles. Les droits s'additionnent.",
    nl: "Vink één of meerdere rollen aan. Rechten worden samengevoegd.",
    en: "Tick one or more roles. Permissions add up.",
  },
  "team.inviteLang": { fr: "Langue de l'invitation", nl: "Taal van de uitnodiging", en: "Invitation language" },
  "team.invited": { fr: "Invitation envoyée", nl: "Uitnodiging verstuurd", en: "Invitation sent" },
  "team.saved": { fr: "Enregistré", nl: "Opgeslagen", en: "Saved" },
  "team.noAccess": { fr: "Pas d'accès", nl: "Geen toegang", en: "No access" },
  "team.noAccessTeam": {
    fr: "Votre rôle n'a pas accès à la gestion d'équipe.",
    nl: "Je rol heeft geen toegang tot teambeheer.",
    en: "Your role has no access to team management.",
  },
  "team.photos.title": { fr: "Photos de profil", nl: "Profielfoto's", en: "Profile photos" },
  "team.photos.help": {
    fr: "Ces photos apparaissent sur la page publique « Qui sommes-nous ». JPG, PNG ou WebP, max. 5 MB.",
    nl: "Deze foto's verschijnen op de publieke pagina \u201cWie zijn we\u201d. JPG, PNG of WebP, max. 5 MB.",
    en: "These photos appear on the public \u201cWho we are\u201d page. JPG, PNG or WebP, max. 5 MB.",
  },
  "team.photos.upload": { fr: "Choisir une photo", nl: "Foto kiezen", en: "Choose a photo" },
  "team.photos.replace": { fr: "Remplacer", nl: "Vervangen", en: "Replace" },
  "team.photos.remove": { fr: "Supprimer", nl: "Verwijderen", en: "Remove" },
  "team.photos.uploading": { fr: "Envoi en cours\u2026", nl: "Bezig met uploaden\u2026", en: "Uploading\u2026" },
  "team.photos.saved": { fr: "Photo mise \u00e0 jour", nl: "Foto bijgewerkt", en: "Photo updated" },
  "team.photos.removed": { fr: "Photo supprim\u00e9e", nl: "Foto verwijderd", en: "Photo removed" },
  "team.photos.error": {
    fr: "La photo n'a pas pu \u00eatre enregistr\u00e9e.",
    nl: "De foto kon niet bewaard worden.",
    en: "The photo could not be saved.",
  },
  "team.owner": { fr: "Propriétaire", nl: "Eigenaar", en: "Owner" },
  "team.ownerAll": {
    fr: "Accès total, sans restriction",
    nl: "Volledige toegang, zonder beperking",
    en: "Full access, no restrictions",
  },
  "roles.title": { fr: "Rôles & droits", nl: "Rollen & rechten", en: "Roles & permissions" },
  "roles.subtitle": {
    fr: "Cochez par rôle ce qui est autorisé. Les changements sont immédiats.",
    nl: "Vink per rol aan wat toegestaan is. Wijzigingen gelden meteen.",
    en: "Tick per role what is allowed. Changes apply immediately.",
  },
  "roles.newRole": { fr: "Nouveau rôle", nl: "Nieuwe rol", en: "New role" },
  "roles.key": { fr: "Clé technique", nl: "Technische sleutel", en: "Technical key" },
  "roles.keyHint": {
    fr: "Minuscules, chiffres et _ (ex. gids_weekend)",
    nl: "Kleine letters, cijfers en _ (bv. gids_weekend)",
    en: "Lowercase, digits and _ (e.g. weekend_guide)",
  },
  "roles.labelNl": { fr: "Nom (NL)", nl: "Naam (NL)", en: "Name (NL)" },
  "roles.labelFr": { fr: "Nom (FR)", nl: "Naam (FR)", en: "Name (FR)" },
  "roles.labelEn": { fr: "Nom (EN)", nl: "Naam (EN)", en: "Name (EN)" },
  "roles.created": { fr: "Rôle créé", nl: "Rol aangemaakt", en: "Role created" },
  "roles.deleted": { fr: "Rôle supprimé", nl: "Rol verwijderd", en: "Role deleted" },
  "roles.delete": { fr: "Supprimer le rôle", nl: "Rol verwijderen", en: "Delete role" },
  "roles.builtin": { fr: "Rôle intégré", nl: "Ingebouwde rol", en: "Built-in role" },
  "roles.alwaysAll": {
    fr: "Tous les droits, toujours",
    nl: "Altijd alle rechten",
    en: "All permissions, always",
  },
  "roles.onlyManagers": {
    fr: "Seuls les propriétaires et administrateurs peuvent régler les droits.",
    nl: "Enkel eigenaars en beheerders kunnen rechten instellen.",
    en: "Only owners and administrators can set permissions.",
  },
  "roles.selectAll": { fr: "Tout cocher", nl: "Alles aanvinken", en: "Select all" },
  "roles.clearAll": { fr: "Tout décocher", nl: "Alles uitvinken", en: "Clear all" },
  "page.noAccess": {
    fr: "Votre rôle n'a pas accès à cette page. Demandez à un administrateur d'ajouter ce droit.",
    nl: "Je rol heeft geen toegang tot deze pagina. Vraag een beheerder om het recht toe te voegen.",
    en: "Your role has no access to this page. Ask an administrator to grant this permission.",
  },
  "common.loading": { fr: "Chargement…", nl: "Laden…", en: "Loading…" },


  // Common
  "common.save": { fr: "Enregistrer", nl: "Opslaan", en: "Save" },
  "common.cancel": { fr: "Annuler", nl: "Annuleren", en: "Cancel" },
  "common.close": { fr: "Fermer", nl: "Sluiten", en: "Close" },
  "common.price": { fr: "Prix", nl: "Prijs", en: "Price" },
  "common.guests": { fr: "Personnes", nl: "Personen", en: "Guests" },
  "common.location": { fr: "Lieu", nl: "Ruimte", en: "Location" },
  "common.date": { fr: "Date", nl: "Datum", en: "Date" },
  "common.status": { fr: "Statut", nl: "Status", en: "Status" },
  "common.client": { fr: "Client", nl: "Klant", en: "Client" },
  "common.add": { fr: "Ajouter", nl: "Toevoegen", en: "Add" },
  "common.delete": { fr: "Supprimer", nl: "Verwijderen", en: "Delete" },

  "common.type": { fr: "Type", nl: "Type", en: "Type" },
  "common.from": { fr: "De", nl: "Van", en: "From" },
  "common.to": { fr: "À", nl: "Tot", en: "To" },
  "common.room": { fr: "Espace", nl: "Ruimte", en: "Space" },
  "common.name": { fr: "Nom du client", nl: "Klantnaam", en: "Client name" },
  "common.email": { fr: "E-mail", nl: "E-mail", en: "Email" },
  "common.phone": { fr: "Téléphone", nl: "Telefoon", en: "Phone" },
  "common.private": { fr: "Particulier", nl: "Particulier", en: "Private" },
  "common.empty": { fr: "Vide", nl: "Leeg", en: "Empty" },
  "common.readonly": {
    fr: "Lecture seule (rôle équipe)",
    nl: "Alleen-lezen (teamrol)",
    en: "Read-only (team role)",
  },
  "common.understood": { fr: "Compris", nl: "Begrepen", en: "Understood" },
  "common.error": {
    fr: "Une erreur est survenue.",
    nl: "Er ging iets mis.",
    en: "Something went wrong.",
  },
};

/** Losse woordenboeken per pagina worden hier samengevoegd. */
const copilotDict: Dict = {
  "copilot.title": { fr: "Maxim AI Assistant", nl: "Maxim AI Assistent", en: "Maxim AI Assistant" },
  "copilot.subtitle": {
    fr: "Demandez à Maxim AI de modifier les paramètres du site, les tarifs, les horaires ou les images.",
    nl: "Vraag Maxim AI om site-instellingen, tarieven, openingsuren of afbeeldingen aan te passen.",
    en: "Ask Maxim AI to update site settings, rates, opening hours or images.",
  },
  "copilot.placeholder": {
    fr: "Écrivez votre demande…",
    nl: "Typ je vraag of opdracht…",
    en: "Type your request…",
  },
  "copilot.send": { fr: "Envoyer", nl: "Versturen", en: "Send" },
  "copilot.attach": { fr: "Joindre une image", nl: "Afbeelding toevoegen", en: "Attach image" },
  "copilot.dropHint": {
    fr: "Déposez une image ici (PNG, JPG, WebP)",
    nl: "Zet hier een afbeelding neer (PNG, JPG, WebP)",
    en: "Drop an image here (PNG, JPG, WebP)",
  },
  "copilot.thinking": { fr: "Maxim AI réfléchit…", nl: "Maxim AI denkt na…", en: "Maxim AI is thinking…" },
  "copilot.actionExecuted": { fr: "Action exécutée", nl: "Actie uitgevoerd", en: "Action executed" },
  "copilot.viewLive": { fr: "[ Voir en ligne sur le site ]", nl: "[ Bekijk live op website ]", en: "[ View live on website ]" },
  "copilot.sendTestMail": { fr: "[ Envoyer un e-mail test ]", nl: "[ Stuur testmail ]", en: "[ Send test email ]" },
  "copilot.undo": { fr: "[ Annuler ]", nl: "[ Ongedaan maken ]", en: "[ Undo ]" },
  "copilot.undone": { fr: "Annulé", nl: "Ongedaan gemaakt", en: "Undone" },
  "copilot.testMailSent": { fr: "E-mail test envoyé", nl: "Testmail verstuurd", en: "Test email sent" },
  "copilot.examplesTitle": { fr: "Exemples", nl: "Voorbeelden", en: "Examples" },
  "copilot.example1": {
    fr: "Mets à jour la bannière d'annonce : …",
    nl: "Zet de aankondiging op: …",
    en: "Set the announcement banner to: …",
  },
  "copilot.example2": {
    fr: "Augmente le prix de location de la salle à €…",
    nl: "Verhoog de zaalhuur naar €…",
    en: "Increase the room rental price to €…",
  },
  "copilot.example3": {
    fr: "Ferme la ferme le …",
    nl: "Sluit de boerderij op …",
    en: "Close the farm on …",
  },
  "copilot.error": { fr: "Une erreur est survenue.", nl: "Er ging iets mis.", en: "Something went wrong." },
};

const merged: Dict = {
  ...dict,
  ...requestsDict,
  ...servicesDict,
  ...shopDict,
  ...academyDict,
  ...calendarDict,
  ...socialDict,
  ...copilotDict,
};

/** Bijgehouden ontbrekende sleutels per taal — voor de diagnosepagina. */
const missingKeys: Record<Lang, Set<string>> = { nl: new Set(), fr: new Set(), en: new Set() };

export const translate = (key: string, lang: Lang): string => {
  const entry = merged[key];
  const own = entry?.[lang];
  if (own) return own;
  missingKeys[lang].add(key);
  // Terugval: eerst Engels, dan Nederlands, anders de ruwe sleutel.
  if (entry) {
    if (lang !== "en" && entry.en) return entry.en;
    if (lang !== "nl" && entry.nl) return entry.nl;
  }
  return key;
};

/** Snapshot van ontbrekende portaal-sleutels per taal, voor de diagnose-UI. */
export function getMissingPortalI18nKeys(): Record<Lang, string[]> {
  return {
    nl: [...missingKeys.nl].sort(),
    fr: [...missingKeys.fr].sort(),
    en: [...missingKeys.en].sort(),
  };
}
