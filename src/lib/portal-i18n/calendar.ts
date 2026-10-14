import type { Dict } from "./types";

/**
 * Vertaalsleutels voor het volwaardig kalenderbeheer (NL/FR/EN).
 * Sleutels die al in het hoofdwoordenboek bestaan (bv. `calendar.filter`,
 * `common.from`, `action.delete`) worden hier bewust hergebruikt en dus niet
 * herhaald.
 */
export const calendarDict: Dict = {
  "calendar.conflictPrefix": { fr: "Attention", nl: "Let op", en: "Heads up" },
  // Tabbladen
  "calendar.tab.agenda": { fr: "Agenda", nl: "Agenda", en: "Agenda" },
  "calendar.tab.team": { fr: "Équipe", nl: "Team", en: "Team" },
  "calendar.tab.hours": {
    fr: "Heures d'ouverture",
    nl: "Openingsuren",
    en: "Opening hours",
  },
  "calendar.tab.events": { fr: "Événements", nl: "Evenementen", en: "Events" },

  // Filters
  "calendar.filterStaff": {
    fr: "Filtrer par collaborateur",
    nl: "Filter op medewerker",
    en: "Filter by staff member",
  },
  "calendar.allStaff": { fr: "Toute l'équipe", nl: "Hele team", en: "Whole team" },
  "calendar.myDaysOnly": {
    fr: "Afficher uniquement mes jours",
    nl: "Toon enkel mijn dagen",
    en: "Show only my days",
  },

  // Weekdagen (korte vorm)
  "calendar.weekday.mon": { fr: "Lu", nl: "Ma", en: "Mo" },
  "calendar.weekday.tue": { fr: "Ma", nl: "Di", en: "Tu" },
  "calendar.weekday.wed": { fr: "Me", nl: "Wo", en: "We" },
  "calendar.weekday.thu": { fr: "Je", nl: "Do", en: "Th" },
  "calendar.weekday.fri": { fr: "Ve", nl: "Vr", en: "Fr" },
  "calendar.weekday.sat": { fr: "Sa", nl: "Za", en: "Sa" },
  "calendar.weekday.sun": { fr: "Di", nl: "Zo", en: "Su" },

  // Bewerken/verwijderen van reservaties en blokkades
  "calendar.edit": { fr: "Modifier", nl: "Bewerken", en: "Edit" },
  "calendar.editBooking": {
    fr: "Modifier la réservation",
    nl: "Reservatie bewerken",
    en: "Edit booking",
  },
  "calendar.editBlock": { fr: "Modifier le blocage", nl: "Blokkade bewerken", en: "Edit block" },
  "calendar.deleteBlock": {
    fr: "Supprimer le blocage",
    nl: "Blokkade verwijderen",
    en: "Delete block",
  },
  "calendar.deleteConfirm": {
    fr: "Voulez-vous vraiment supprimer ceci ?",
    nl: "Weet je zeker dat je dit wil verwijderen?",
    en: "Are you sure you want to delete this?",
  },
  "calendar.updated": { fr: "Mis à jour", nl: "Bijgewerkt", en: "Updated" },
  "calendar.deleted": { fr: "Supprimé", nl: "Verwijderd", en: "Deleted" },
  "calendar.save": { fr: "Enregistrer", nl: "Opslaan", en: "Save" },
  "calendar.cancel": { fr: "Annuler", nl: "Annuleren", en: "Cancel" },
  "calendar.close": { fr: "Fermer", nl: "Sluiten", en: "Close" },

  // Team-toewijzingen
  "calendar.assignedStaff": {
    fr: "Collaborateurs assignés",
    nl: "Toegewezen medewerkers",
    en: "Assigned staff",
  },
  "calendar.assignStaff": {
    fr: "Assigner un collaborateur",
    nl: "Medewerker toewijzen",
    en: "Assign staff member",
  },
  "calendar.task": { fr: "Tâche", nl: "Taak", en: "Task" },
  "calendar.taskPlaceholder": {
    fr: "Ex. accueil, catering, animation…",
    nl: "Bv. onthaal, catering, animatie…",
    en: "E.g. welcome desk, catering, activities…",
  },
  "calendar.noAssignments": {
    fr: "Nog geen collaborateur assigné.",
    nl: "Nog geen medewerker toegewezen.",
    en: "No staff assigned yet.",
  },
  "calendar.assigned": {
    fr: "Collaborateur assigné",
    nl: "Medewerker toegewezen",
    en: "Staff member assigned",
  },
  "calendar.removeAssignment": {
    fr: "Retirer l'assignation",
    nl: "Toewijzing verwijderen",
    en: "Remove assignment",
  },

  // Openingsuren
  "calendar.season.zomer": { fr: "Été", nl: "Zomer", en: "Summer" },
  "calendar.season.winter": { fr: "Hiver", nl: "Winter", en: "Winter" },
  "calendar.openDay": { fr: "Ouvert", nl: "Open", en: "Open" },
  "calendar.closedDay": { fr: "Fermé", nl: "Gesloten", en: "Closed" },
  "calendar.hoursSaved": {
    fr: "Heures d'ouverture enregistrées",
    nl: "Openingsuren opgeslagen",
    en: "Opening hours saved",
  },
  "calendar.exceptions": {
    fr: "Fermetures et heures exceptionnelles",
    nl: "Sluitingen en afwijkende uren",
    en: "Closures and exceptional hours",
  },
  "calendar.addException": {
    fr: "Ajouter une exception",
    nl: "Uitzondering toevoegen",
    en: "Add exception",
  },
  "calendar.dateFrom": { fr: "Du", nl: "Van datum", en: "From date" },
  "calendar.dateTo": { fr: "Au", nl: "Tot datum", en: "To date" },
  "calendar.closedOption": { fr: "Fermé complètement", nl: "Volledig gesloten", en: "Fully closed" },
  "calendar.customHours": {
    fr: "Heures spécifiques",
    nl: "Afwijkende uren",
    en: "Custom hours",
  },
  "calendar.reasonNl": { fr: "Motif (NL)", nl: "Reden (NL)", en: "Reason (NL)" },
  "calendar.reasonFr": { fr: "Motif (FR)", nl: "Reden (FR)", en: "Reason (FR)" },
  "calendar.reasonEn": { fr: "Motif (EN)", nl: "Reden (EN)", en: "Reason (EN)" },
  "calendar.noExceptions": {
    fr: "Aucune exception enregistrée.",
    nl: "Nog geen uitzonderingen.",
    en: "No exceptions yet.",
  },

  // Evenementen
  "calendar.addEvent": { fr: "Ajouter un événement", nl: "Evenement toevoegen", en: "Add event" },
  "calendar.editEvent": {
    fr: "Modifier l'événement",
    nl: "Evenement bewerken",
    en: "Edit event",
  },
  "calendar.titleNl": { fr: "Titre (NL)", nl: "Titel (NL)", en: "Title (NL)" },
  "calendar.titleFr": { fr: "Titre (FR)", nl: "Titel (FR)", en: "Title (FR)" },
  "calendar.titleEn": { fr: "Titre (EN)", nl: "Titel (EN)", en: "Title (EN)" },
  "calendar.publicVisible": {
    fr: "Visible publiquement",
    nl: "Publiek zichtbaar",
    en: "Publicly visible",
  },
  "calendar.publicHint": {
    fr: "Apparaît aussi dans le calendrier public du site.",
    nl: "Verschijnt ook in de publieke kalender op de website.",
    en: "Also appears in the public calendar on the website.",
  },
  "calendar.noEvents": {
    fr: "Aucun événement pour l'instant.",
    nl: "Nog geen evenementen.",
    en: "No events yet.",
  },
  "calendar.eventSaved": {
    fr: "Événement enregistré",
    nl: "Evenement opgeslagen",
    en: "Event saved",
  },
  "calendar.eventDeleted": {
    fr: "Événement supprimé",
    nl: "Evenement verwijderd",
    en: "Event deleted",
  },

  // BookingDetail
  "calendar.chosenOptions": {
    fr: "Options choisies",
    nl: "Gekozen opties",
    en: "Chosen options",
  },
  "calendar.noteAdded": {
    fr: "Note interne ajoutée",
    nl: "Interne notitie toegevoegd",
    en: "Internal note added",
  },
  "calendar.confirmSentToast": {
    fr: "Confirmation envoyée à",
    nl: "Bevestiging verzonden naar",
    en: "Confirmation sent to",
  },
  "calendar.quoteSentToast": {
    fr: "Lien de devis envoyé",
    nl: "Offerte-link verzonden",
    en: "Quote link sent",
  },
  "calendar.rejectedToast": {
    fr: "Demande refusée",
    nl: "Aanvraag afgewezen",
    en: "Request rejected",
  },
  "calendar.deletedRequestToast": {
    fr: "Demande supprimée",
    nl: "Aanvraag verwijderd",
    en: "Request deleted",
  },

  // Extra sleutels voor CalendarPage/BookingDetail
  "calendar.today": { fr: "Aujourd'hui", nl: "Vandaag", en: "Today" },
  "calendar.blockSlot": { fr: "Bloquer un créneau", nl: "Slot blokkeren", en: "Block slot" },
  "calendar.manualBooking": {
    fr: "Réservation manuelle",
    nl: "Handmatige reservering",
    en: "Manual booking",
  },
  "calendar.noBookingsToday": {
    fr: "Aucune réservation ce jour-là.",
    nl: "Geen reservaties op deze dag.",
    en: "No bookings on this day.",
  },
  "calendar.blocked": { fr: "Bloqué", nl: "Geblokkeerd", en: "Blocked" },
  "calendar.previousMonth": { fr: "Mois précédent", nl: "Vorige maand", en: "Previous month" },
  "calendar.nextMonth": { fr: "Mois suivant", nl: "Volgende maand", en: "Next month" },
  "calendar.clientName": { fr: "Nom du client", nl: "Klantnaam", en: "Client name" },
  "calendar.reason": { fr: "Motif", nl: "Reden", en: "Reason" },
  "calendar.reasonPlaceholder": {
    fr: "Entretien, jour de fermeture, école…",
    nl: "Onderhoud, sluitingsdag, school…",
    en: "Maintenance, closure day, school…",
  },
  "calendar.type": { fr: "Type", nl: "Type", en: "Type" },
  "calendar.type.zaalverhuur": { fr: "Location de salle", nl: "Zaalverhuur", en: "Hall rental" },
  "calendar.type.teambuilding": { fr: "Team building", nl: "Teambuilding", en: "Team building" },
  "calendar.type.privatisering": {
    fr: "Privatisation",
    nl: "Privatisering",
    en: "Privatisation",
  },
  "calendar.checkFields": {
    fr: "Vérifiez la date et les heures",
    nl: "Controleer datum en uren",
    en: "Check the date and times",
  },
  "calendar.checkNameFields": {
    fr: "Complétez le nom, la date et des heures valides",
    nl: "Vul klantnaam, datum en geldige uren in",
    en: "Fill in a client name, date and valid times",
  },
  "calendar.blockedToast": { fr: "Créneau bloqué", nl: "Slot geblokkeerd", en: "Slot blocked" },
  "calendar.bookingAdded": {
    fr: "Réservation ajoutée",
    nl: "Reservering toegevoegd",
    en: "Booking added",
  },
  "calendar.noAccess": {
    fr: "Vous n'avez pas accès au calendrier.",
    nl: "Je hebt geen toegang tot de kalender.",
    en: "You don't have access to the calendar.",
  },
  "calendar.dayOccupancy": {
    fr: "Occupation",
    nl: "Bezetting",
    en: "Occupancy",
  },
  "calendar.weekdayShort": {
    fr: "Lu,Ma,Me,Je,Ve,Sa,Di",
    nl: "Ma,Di,Wo,Do,Vr,Za,Zo",
    en: "Mo,Tu,We,Th,Fr,Sa,Su",
  },
};
