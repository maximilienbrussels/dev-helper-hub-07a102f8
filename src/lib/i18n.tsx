import { useNavigate, useRouterState } from "@tanstack/react-router";
import { translatePath } from "@/lib/routes-i18n";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Globe, Check } from "lucide-react";
import {
  EXTRA_DICTS,
  EXTRA_LANGS,
  isExtraLang,
  translatePhrase,
  visibleExtraLangs,
  type ExtraLang,
} from "@/lib/i18n-extra";

export type Lang = "nl" | "fr" | "en";

type Dict = Record<string, string>;

const NL: Dict = {
  "nav.hub": "Hub",
  "nav.academy": "Academy",
  "nav.webshop": "Winkel",
  "nav.about": "Wie zijn we",
  "nav.contact": "Contact",
  "nav.support": "Steun",
  "nav.mine": "Mijn Hoefjes",
  "nav.admin": "Beheer",
  "nav.account": "Mijn account",
  "nav.cart": "Winkelmandje",
  "nav.signin": "Aanmelden",
  "lang.label": "Taal",
  "gallery.rental.title": "Zalen in beeld",
  "gallery.rental.alt": "Foto zaal",
  "gallery.camps.title": "Sfeerbeelden van de stages",
  "gallery.camps.alt": "Stagefoto",
  "gallery.animations.title": "Animaties in beeld",
  "gallery.animations.alt": "Animatiefoto",
  "gallery.seminars.title": "Seminaries in beeld",
  "gallery.seminars.alt": "Seminariefoto",
  "gallery.teambuilding.title": "Teambuilding in beeld",
  "gallery.teambuilding.alt": "Teambuildingfoto",
  "theme.label": "Thema",
  "theme.light": "Licht",
  "theme.dark": "Donker",
  "theme.system": "Systeem",
  "footer.contact": "Direct contact",
  "footer.contactLink": "Contactformulier",
  "footer.menu": "Menu",
  "footer.follow": "Volg ons",
  "footer.location": "Locatie",
  "footer.openInMaps": "Open in Google Maps",
  "chat.title": "Maxim — Gids",
  "chat.greeting":
    "Bonjour ! Ik ben Maxim, jouw gids op Maximilien. Waarmee kan ik je helpen?",
  "chat.placeholder": "Stel je vraag aan Maxim…",
  "chat.send": "Stuur",
  "chat.close": "Minimaliseer",
  "chat.open": "Chat met Maxim",
  "chat.busy": "Bezig…",
  "chat.err.rate": "Even geduld — te veel vragen tegelijk.",
  "chat.err.credits": "Momenteel niet beschikbaar.",
  "chat.err.generic": "Er ging iets mis. Probeer opnieuw.",
  "contact.title": "Contact",
  "contact.subtitle": "We horen graag van je — kom langs, bel of schrijf.",
  "contact.form.name": "Naam",
  "contact.form.email": "E-mailadres",
  "contact.form.message": "Bericht",
  "contact.form.send": "Verstuur bericht",
  "contact.form.sent": "Bedankt! Je bericht is voorbereid in je mail-app.",
  "contact.phone": "Telefoon",
  "contact.hours": "Bereikbaar",
  "contact.hours.value": "Dinsdag tot zaterdag · 10:00 – 16:30",
  "contact.whatsapp": "WhatsApp",
  "contact.sms": "SMS",
  "contact.callback": "Vraag een terugbelverzoek",
  "about.title": "Wie zijn we",
  "about.lede":
    "Maximilien is een stadsboerderij in het hart van Brussel — een plek van ontmoeting, educatie en sociale cohesie.",
  "about.history.title": "Onze geschiedenis",
  "about.history.body":
    "Sinds meer dan dertig jaar verwelkomt de boerderij bewoners van de Noordwijk en van heel Brussel. Wat begon als een sociaal-educatief project rond dieren en de moestuin, is uitgegroeid tot een levendige plek waar natuur, duurzame landbouw en samenleven elkaar ontmoeten.",
  "about.mission.title": "Onze missie",
  "about.mission.body":
    "Wij zetten in op dierenwelzijn, milieu-educatie, lokale en duurzame landbouw, en op sociale cohesie tussen buurtbewoners. Onze animaties tonen de biodiversiteit als een cyclus: niets gaat verloren, alles verandert.",
  "about.team.title": "Het team",
  "about.team.body":
    "Achter de boerderij staat een gepassioneerd team van animatoren, dierenverzorgers en vrijwilligers. Deze pagina wordt binnenkort aangevuld met portretten en korte bio's.",
  "support.title": "Steun de boerderij",
  "support.lede":
    "Elke bijdrage — groot of klein — helpt om onze dieren te voeden, ateliers te organiseren en de boerderij toegankelijk te houden voor iedereen.",
  "support.wero.title": "Wero — direct via je bank-app",
  "support.wero.body":
    "Wero is het snelste voor mobiele donaties. Scan de QR of gebruik onderstaand e-mailadres in je bank-app.",
  "support.transfer.title": "Overschrijving",
  "support.transfer.body": "Vermeld als mededeling: 'Steun ferme' of het doel dat je wil steunen.",
  "support.goals.title": "Concrete doelen",
  "support.goal.food": "Voer voor Boudewijn de ezel",
  "support.goal.food.body": "€25 = één week hooi en granen voor onze ezels.",
  "support.goal.workshop": "Een schoolklas ontvangen",
  "support.goal.workshop.body": "€80 = een educatief atelier voor een klas van 20 kinderen.",
  "support.goal.shelter": "Onderhoud van de stallen",
  "support.goal.shelter.body": "€150 = stro en materiaal voor een maand.",
  "common.readMore": "Lees meer",
  "hub.practical": "Praktisch",
  "hub.contactIntro": "Een vraag over deze pagina? Stuur ons gerust een bericht.",
  "hub.faq": "Veelgestelde vragen",
  "hub.notFound.title": "Deze pagina bestaat nog niet",
  "hub.notFound.body": "Kies een onderwerp uit het menu of ga terug naar de",
  "hub.notFound.home": "homepagina",
  "footer.partners": "Partners & steun",
  "footer.mapLink": "Bekijk locatie op kaart →",
  "footer.becomePartner": "Word partner →",
  "footer.ourPartners": "Onze partners & netwerken",
  "footer.supportedBy": "Met de steun van & in samenwerking met",
  "about.pillars.title": "Onze pijlers",
  "about.pillar.welfare": "Dierenwelzijn",
  "about.pillar.welfare.body": "Dagelijkse zorg, ruimte en respect voor elk dier op de boerderij.",
  "about.pillar.education": "Educatie & sensibilisatie",
  "about.pillar.education.body": "Ateliers voor scholen, gezinnen en buurtgroepen.",
  "about.pillar.biodiversity": "Biodiversiteit",
  "about.pillar.biodiversity.body": "Een levende groene corridor in het hart van Brussel.",
  "about.pillar.social": "Sociale cohesie",
  "about.pillar.social.body": "Een ontmoetingsplek die openstaat voor elke bewoner.",
  "about.gov.title": "Bestuur",
  "about.gov.body":
    "De vzw wordt bestuurd door een vrijwillig bestuursorgaan dat waakt over onze missie en financiën.",
  "about.gov.president": "Voorzitter",
  "about.gov.vicepresident": "Ondervoorzitter",
  "about.gov.treasurer": "Penningmeester",
  "about.gov.secretary": "Secretaris",
  "about.gov.member": "Bestuurder",
  "about.partners.title": "Partners & netwerken",
  "about.partners.body":
    "We werken samen met overheden en met natuur- en kinderboerderijnetwerken.",
  "about.role.director": "Directeur",
  "about.role.projects": "Projectverantwoordelijke",
  "about.role.site": "Sitebeheer",
  "partners.brussels.desc": "Stad Brussel",
  "partners.fao.desc": "Voedsel- en Landbouworganisatie van de VN",
  "partners.fedeau.desc": "Federatie van Brusselse verenigingen",
  "partners.natagora.desc": "Réseau Nature",
  "partners.ffa.desc": "Federatie van kinderboerderijen",
  "partners.leefmilieu.desc": "Leefmilieu Brussel",
  // Common
  "common.copy": "Kopieer",
  "common.back": "Terug",
  "common.loading": "Laden…",
  "common.tryAgain": "Probeer opnieuw",
  "common.goHome": "Naar de hub",
  // 404 / errors
  "err.404.title": "Pagina niet gevonden",
  "err.404.body": "De pagina die je zoekt bestaat niet of is verplaatst.",
  "err.boundary.title": "Deze pagina laadde niet",
  "err.boundary.body": "Er ging iets mis. Probeer te vernieuwen of ga terug naar de hub.",
  // Home
  "home.eyebrow": "Stadsboerderij · Brussel 1000",
  "brand.name": "Maximilien",
  "brand.tagline": "Stadsboerderij · Brussel 1000",
  "footer.mission":
    "Een stadsboerderij waar dieren, buurt en educatie samenkomen — midden in Brussel.",
  "home.cta.academy": "Bezoek de Academy",
  "home.cta.support": "Steun het project",
  "home.status.open": "Nu geopend",
  "home.status.closed": "Momenteel gesloten",
  "status.open": "Nu geopend",
  "status.closingSoon": "Sluit over {mins} min",
  "status.openingSoon": "Opent om {time}",
  "status.closed": "Gesloten · opent om {time}",
  "status.closedNextDay": "Gesloten · {day} weer open om {time}",
  "status.tomorrow": "morgen",
  "status.viewHours": "Alle openingsuren",
  "status.closedNoTime": "Vandaag gesloten",
  "cert.pickup.title": "Haal je fysieke certificaat op",
  "cert.pickup.body":
    "Ontvang een officieel exemplaar gedrukt op luxe papier met een authentieke stempel — op te halen bij de receptie van de boerderij.",
  "cert.pickup.cta": "Claim fysiek certificaat",

  "cert.pickup.voucher": "Bon nr.",
  "cert.pickup.show": "Toon deze bon of QR-code aan het onthaal.",
  "cert.pickup.claimed": "Aangevraagd",
  "cert.share": "Certificaat delen",
  "cert.shareCopied": "Link gekopieerd naar je klembord.",
  "cert.verifyHint": "Scan om te verifiëren",
  "cert.signature": "Team Maximilien",
  "cert.signatureRole": "Hoofd Educatie",
  "verify.title": "Certificaat verifiëren",
  "verify.checking": "Certificaat controleren…",
  "verify.valid": "Geverifieerd certificaat",
  "verify.invalid": "Dit certificaatnummer is niet bekend.",
  "verify.issuedTo": "Uitgereikt aan {name} op {date}.",

  "home.vision.title": "Onze visie",
  "home.vision.default":
    "Stadsbewoners opnieuw verbinden met de cyclus van het leven, met respect voor het milieu en de sociale band.",
  "home.residents": "De bewoners",
  "home.discoverAll": "Ontdek allemaal →",
  "home.hub.title": "Ontdek de boerderij",
  "home.hub.body":
    "Kies je hub — school, gezin, bedrijf of buurt — en vind meteen wat je zoekt: activiteiten, verhuur, vrijwilligerswerk of steun.",
  "home.hub.school": "School & Non-profit →",
  "home.hub.family": "Familie & Feest →",
  "home.hub.business": "Bedrijf & Teambuilding →",
  "home.hub.support": "Steun de boerderij →",
  // Verhuur
  "rent.eyebrow": "Verhuur & Privéverhuur",
  "rent.title": "Ruimtes voor jouw event op de boerderij",
  "rent.lede":
    "Onze onthaalzaal en polyvalente ruimte zijn beschikbaar voor scholen, gezinnen en bedrijven. Kies je doelgroep hieronder — daar vind je concrete formules en tarieven.",
  "rent.view": "Bekijk",
  "rent.help": "Ander doel of niet zeker welke ruimte je nodig hebt?",
  "rent.contactUs": "Neem contact op",
  "rent.helpTail": "— we denken graag mee.",
  "rent.school.label": "Scholen & Non-profit",
  "rent.school.body": "Sociaal tarief. Onthaalzaal + overdekte zone voor picknick of workshop.",
  "rent.family.label": "Gezinnen & Verjaardagen",
  "rent.family.body": "Halve dag met animator, dieren-rondleiding en creatieve hoek.",
  "rent.biz.label": "Bedrijven & Seminaries",
  "rent.biz.body": "Polyvalente ruimte voor vergaderingen, teambuilding en events tot 40 personen.",
  // Support extras
  "support.wero.emailLabel": "Wero · e-mail",
  "support.beneficiary": "Begunstigde",
  "support.iban": "IBAN",
  "support.bic": "BIC",
  // About / team roles
  "about.role.coord": "Coördinatrice & educatie",
  "about.role.animals": "Dierenverzorger",
  "about.role.garden": "Moestuin & compost",
  "about.role.volunteers": "Vrijwilligers",
  "about.role.volunteers.sub": "Buurtbewoners & scholen",
  // Webshop
  "shop.eyebrow": "Click & Collect · Brussel 1000",
  "shop.title": "Hoevewinkel",
  "shop.lede":
    "Verpakkingsvrij en lokaal geproduceerd. Reserveer je bestelling en haal ze op aan de boerderij — breng zelf je zak, emmer of doos mee.",
  "shop.packagingFree": "Verpakkingsvrij",
  "shop.deposit": "Statiegeld retour",
  "shop.offer": "Aanbod",
  "shop.count": "{n} lokale producten",
  "shop.empty": "Er zijn momenteel geen producten beschikbaar.",
  "shop.badge.packaging": "Verpakkingsvrij",
  "shop.badge.deposit": "Statiegeld",
  "shop.addToCart": "In mand",
  "shop.added": "{title} toegevoegd",
  "shop.viewCart": "Bekijk mand",
  "shop.badge.bio": "Bio",
  // Productpagina
  "product.back": "Terug",
  "product.breadcrumb.shop": "Hoevewinkel",
  "product.notFound": "Dit product bestaat niet (meer).",
  "product.packaging": "Verpakking",
  "product.quantity": "Aantal",
  "product.producer": "Herkomst",
  "product.distance": "{km} km van je afhaalpunt",
  "product.impact": "Je bespaart {g} g verpakkingsafval per stuk.",
  "product.bundle": "Vaak samen gekocht",
  "product.bundleAdd": "Voeg bundel toe",
  "product.ingredients": "Samenstelling",
  "product.storage": "Bewaren",
  "product.pickup": "Afhalen",
  "product.deposit": "Statiegeld {amount} — retour aan de balie",
  // Cart drawer
  "cart.added.title": "Toegevoegd aan je mand",
  "cart.crossSell": "Past hier goed bij",
  "cart.progress.reached": "Top! Je krijgt een zakje boerderijzaden cadeau.",
  "cart.progress.remaining": "Nog {amount} tot een gratis zakje boerderijzaden.",

  // Cart
  "cart.title": "Je mand",
  "cart.empty": "Je mand is leeg.",
  "cart.continue": "Verder winkelen",
  "cart.subtotal": "Subtotaal",
  "cart.checkout": "Verder naar afrekenen →",
  "cart.pickup.title": "Kies je pickup-moment",
  "cart.pickup.placeholder": "— Kies een moment —",
  "cart.pickup.day": "Kies datum",
  "cart.pickup.time": "Kies tijdstip",
  "cart.bagPledge":
    "Ik neem mijn eigen herbruikbare zak, emmer of doos mee zodat dit aanbod verpakkingsvrij blijft.",
  "cart.method": "Betaalmethode",
  "cart.method.iban": "Overschrijving (IBAN)",
  "cart.method.bancontact": "Bancontact",
  "cart.method.wero": "Wero",
  "cart.total": "Totaal",
  "cart.back": "Terug",
  "cart.confirm": "Bevestig",
  "cart.placed": "Bestelling geplaatst",
  "cart.reference": "Referentie",
  "cart.pickupLine": "Pickup aan de boerderij",
  "cart.onAppointment": "op afspraak",
  "cart.transfer": "Overschrijving",
  "cart.amount": "Bedrag",
  "cart.communication": "Mededeling",
  "cart.onlineSoon": "Online betaling ({method}) volgt binnenkort.",
  "cart.newOrder": "Nieuwe bestelling starten",
  "cart.perUnit": "/ stuk",
  "cart.less": "Minder",
  "cart.more": "Meer",
  "cart.remove": "Verwijder",
  // Mijn hoefjes
  "mine.eyebrow": "Klantenkaart · Loyaliteit",
  "mine.title": "Mijn Hoefjes",
  "mine.lede":
    "Verzamel Hoefjes bij elke Academy die je behaalt of vrijwilligersbeurt aan de boerderij. Voltooi je trofeeënkast en krijg voordelen aan de kassa.",
  "mine.loginPromptTitle": "Log in om je Hoefjes te zien",
  "mine.loginPromptBody": "Je badges, certificaten en Hoefjes staan gekoppeld aan je account.",
  "mine.loginBtn": "Inloggen of registreren",
  "mine.progress": "Voortgang",
  "mine.hoefjeReached": "Hoefje behaald",
  "mine.hoefjeNot": "Nog niet behaald",
  "mine.trophy": "Trofeeënkast",
  "mine.allAcademies": "Alle academies →",
  "mine.done": "Behaald",
  "mine.locked": "Vergrendeld",
  "mine.viewCert": "Bekijk certificaat",
  "mine.startAcademy": "Start Academy",
  "mine.wallet.title": "Voeg toe aan je wallet",
  "mine.wallet.body":
    "Bewaar je Hoefjeskaart op je telefoon, zodat ze altijd bij je is aan de kassa.",
  "mine.wallet.add": "Toevoegen",
  "mine.wallet.link": "Koppelen",
  "mine.wallet.soon": "Wallet-integratie komt binnenkort beschikbaar.",
  "mine.reward.coffee": "Gratis koffie/thee",
  "mine.reward.shop": "10% shop korting",
  "mine.reward.activity": "Gratis activiteit",
  // Academy
  "aca.eyebrow": "Educatief programma",
  "aca.title": "Kies je Academy",
  "aca.lede":
    "Elk dier heeft zijn eigen Academy. Slaag voor de test en behaal een officieel geverifieerd welzijnscertificaat + een unieke badge in je trofeeënkast.",
  "aca.qPass": "{n} vragen · slaag bij {m}",
  "aca.empty": "Er zijn nog geen actieve academies. Vraag het team om er één te activeren.",
  "aca.search": "Zoek een dier…",
  "aca.noResults": "Geen Academy gevonden voor “{q}”.",
  "aca.clear": "Filters wissen",
  "aca.count": "{n} academies",
  "aca.popular": "Meest gekozen",
  "aca.cat.all": "Alle dieren",
  "aca.cat.huisdieren": "Huisdieren in de stad",
  "aca.cat.knaagdieren": "Knaagdieren & kleine zoogdieren",
  "aca.cat.boerderij": "Stadsboerderij",
  "aca.cat.exoten": "Exoten & reptielen",
  "aca.cat.invertebraten": "Spinnen & insecten",
  "aca.cat.vogels": "Vogels",
  "aca.cat.pluimvee": "Pluimvee & watervogels",
  "aca.cat.biodiversiteit": "Biodiversiteit & natuur",
  "aca.cat.moestuin": "Moestuin & bodem",
  "aca.cat.stadsnatuur": "Stadsnatuur & wild",
  "aca.cat.vijver": "Vijver & natuur",
  "aca.cat.etiquette": "Boerderij-etiquette",
  "aca.cat.valkuilen": "⚠️ Impulsaankopen & valkuilen",

  "aca.loading": "Academy laden…",
  "aca.backAll": "← Alle academies",
  "aca.info": "{n} vragen · slaag bij {m} correcte antwoorden.",
  "aca.firstName": "Voornaam",
  "aca.lastName": "Achternaam",
  "aca.lastNameHint": "Verplicht: je achternaam komt op het certificaat.",
  "aca.mod.label": "Module {i} van 3",
  "aca.mod.1": "Huisvesting & omgeving",
  "aca.mod.2": "Voeding & gezondheid",
  "aca.mod.3": "Gedrag & hanteren",
  "aca.modDone.title": "Module {i} voltooid 🎉",
  "aca.modDone.body":
    "Gefeliciteerd! Je rondde “{name}” af met {ok} van {n} juist. Klaar voor de volgende module?",
  "aca.modDone.cta": "Volgende module →",
  "aca.modDone.last": "Naar het overzicht →",
  "aca.listen": "Vraag voorlezen",
  "aca.stopListen": "Stop voorlezen",
  "aca.speed": "Voorleessnelheid",
  "aca.speed.slow": "Traag",
  "aca.speed.normal": "Normaal",
  "aca.speed.fast": "Snel",
  "aca.noVoice": "Je toestel heeft geen stem voor deze taal. Voorlezen klinkt dan in een andere taal.",
  "aca.playAudio": "Geluid beluisteren",
  "aca.correct": "Juist!",
  "aca.wrong": "Niet juist",
  "aca.didYouKnow": "Wist je dat?",
  "aca.continue": "Verder →",
  "aca.check": "Nakijken",

  "aca.question": "Vraag {i} / {n}",
  "aca.prev": "Vorige",
  "aca.next": "Volgende →",
  "aca.toOverview": "Naar overzicht →",
  "aca.ready.title": "Klaar om in te leveren",
  "aca.ready.body": "Vul je volledige naam in — die komt op je certificaat te staan.",
  "aca.needLogin.title": "Log in om je certificaat te ontvangen",
  "aca.needLogin.body":
    "Je moet ingelogd zijn om een officieel certificaat te ontvangen en je badge te ontgrendelen.",
  "aca.toLogin": "Naar login",
  "aca.claim.title": "Je certificaat is klaar!",
  "aca.claim.body":
    "Meld je aan of maak een account om je certificaat op te halen en je badge te ontgrendelen. Je naam en antwoorden blijven bewaard.",
  "aca.claim.google": "Doorgaan met Google",
  "aca.claim.email": "Aanmelden met e-mail",
  "aca.claim.register": "Nog geen account? Registreren",

  "aca.fullName": "Volledige naam",
  "aca.namePlaceholder": "Bv. Jan De Vries",
  "aca.review": "← Antwoorden nakijken",
  "aca.request": "Certificaat aanvragen",
  "aca.submitting": "Inleveren…",
  "aca.passed": "Geslaagd! Certificaat #{n}",
  "aca.failed": "Score {s} — nog niet geslaagd, probeer opnieuw.",
  "aca.loadError": "Kon academy niet laden",
  "aca.submitError": "Fout bij inleveren",
  "aca.qPassMod": "{n} vragen ({k} modules) · slaag per module",
  "aca.infoMod": "{n} vragen in {k} modules · minstens {m} juist per module.",
  "aca.mod.labelK": "Module {i} van {k}",
  "aca.exit": "Quiz verlaten",
  "aca.progress": "Module {i}/{k} · vraag {a}/{b}",
  "aca.modDone.pass": "Je scoorde {ok}/{n} — module behaald.",
  "aca.modFail.title": "Module {i} nog niet behaald",
  "aca.modFail.body":
    "Je had {ok} van {n} juist. Je hebt minstens {m} juiste antwoorden nodig om de volgende module te openen.",
  "aca.modFail.cta": "Module opnieuw proberen",
  "aca.finalUnlocked": "Alle modules behaald — je certificaat staat klaar.",
  // Auth
  "auth.eyebrow": "Team",
  "auth.signIn": "Inloggen",
  "auth.signUp": "Account aanmaken",
  "auth.desc": "Alleen voor medewerkers en beheerders van La Ferme.",
  "auth.google": "Verder met Google",
  "auth.or": "of",
  "auth.fullName": "Volledige naam",
  "auth.email": "E-mail",
  "auth.password": "Wachtwoord",
  "auth.doSignUp": "Registreren",
  "auth.doSignIn": "Inloggen",
  "auth.toSignUp": "Nieuw teamlid? Account aanmaken",
  "auth.toSignIn": "Al een account? Inloggen",
  "auth.created": "Account aangemaakt",
  "auth.error": "Er ging iets mis",
  "auth.googleFail": "Google login mislukt",
  "auth.back": "← Ferme Maximilien",
  "login.eyebrow": "Bezoekers",
  "login.title": "Welkom bij Maximilien",
  "login.desc":
    "Log in of maak een account aan om je Hoefjes, badges en spaarvoordelen te bekijken.",
  "login.tab.signin": "Inloggen",
  "login.tab.signup": "Account aanmaken",
  "login.google": "Verder met Google",
  "login.or": "of",
  "login.fullName": "Volledige naam",
  "login.email": "E-mail",
  "login.password": "Wachtwoord",
  "login.doSignIn": "Inloggen",
  "login.doSignUp": "Account aanmaken",
  "login.created": "Account aangemaakt — check je mailbox.",
  "login.error": "Er ging iets mis",
  "login.googleFail": "Google login mislukt",
  "login.back": "← Terug naar de site",
  // QR
  "qr.unknownTitle": "Onbekende QR",
  "qr.unknownBody": "Deze QR-code komt niet overeen met een dier op de boerderij.",
  "qr.backHub": "Terug naar hub",
  "qr.aiOpens": "De AI-gids opent automatisch en spreekt als {name}.",
  "qr.greeting": "Gegroet! Ik ben {name}. Welkom bij mijn weide. Wat wil je weten?",
  // Certificate
  "cert.official": "Certificat officiel · Officieel certificaat",
  "cert.confirms": "Hierbij wordt bevestigd dat",
  "cert.participant": "Geregistreerd deelnemer",
  "cert.completedBody":
    "met succes de {name} Academy heeft afgerond, en daarmee de vereiste kennis heeft aangetoond over het welzijn, de verzorging en het natuurlijke gedrag van deze diersoort.",
  "cert.score": "Score behaald:",
  "cert.issuedOn": "Uitgegeven op",
  "cert.certNr": "Certificaat nr.",
  "cert.nthGraduate": "{ord} geslaagde",
  "cert.loading": "Certificaat laden…",
  "cert.notFound": "Certificaat niet gevonden.",
  "cert.backBadges": "Terug naar mijn badges",
  "cert.print": "Afdrukken / PDF",
  "cert.download": "Downloaden",
  "cert.downloading": "Certificaat wordt klaargemaakt…",
  "cert.downloadDone": "Certificaat gedownload.",
  "cert.downloadFail": "Downloaden mislukt. Probeer Afdrukken / PDF.",
  "cert.footer":
    "Certificaat #{nr} · Jij bent de {ord} expert die succesvol slaagde voor de {name} Academy.",
};

const FR: Dict = {
  "nav.hub": "Accueil",
  "nav.academy": "Académie",
  "nav.webshop": "Boutique",
  "nav.about": "Qui sommes-nous",
  "nav.contact": "Contact",
  "nav.support": "Soutenir",
  "nav.mine": "Mes Sabots",
  "nav.admin": "Admin",
  "nav.account": "Mon compte",
  "nav.cart": "Panier",
  "nav.signin": "Se connecter",
  "lang.label": "Langue",
  "gallery.rental.title": "Les salles en images",
  "gallery.rental.alt": "Photo de salle",
  "gallery.camps.title": "Les stages en images",
  "gallery.camps.alt": "Photo de stage",
  "gallery.animations.title": "Les animations en images",
  "gallery.animations.alt": "Photo d'animation",
  "gallery.seminars.title": "Les séminaires en images",
  "gallery.seminars.alt": "Photo de séminaire",
  "gallery.teambuilding.title": "Le teambuilding en images",
  "gallery.teambuilding.alt": "Photo de teambuilding",
  "theme.label": "Thème",
  "theme.light": "Clair",
  "theme.dark": "Sombre",
  "theme.system": "Système",
  "footer.contact": "Contact direct",
  "footer.contactLink": "Formulaire de contact",
  "footer.menu": "Menu",
  "footer.follow": "Suivez-nous",
  "footer.location": "Localisation",
  "footer.openInMaps": "Ouvrir dans Google Maps",
  "chat.title": "Maxim — Guide",
  "chat.greeting":
    "Bonjour ! Je suis Maxim, votre guide à Maximilien. Comment puis-je vous aider ?",
  "chat.placeholder": "Posez votre question à Maxim…",
  "chat.send": "Envoyer",
  "chat.close": "Réduire",
  "chat.open": "Discuter avec Maxim",
  "chat.busy": "En cours…",
  "chat.err.rate": "Un instant — trop de questions à la fois.",
  "chat.err.credits": "Indisponible pour le moment.",
  "chat.err.generic": "Une erreur s'est produite. Réessayez.",
  "contact.title": "Contact",
  "contact.subtitle": "Passez nous voir, appelez ou écrivez — nous serons ravis d'échanger.",
  "contact.form.name": "Nom",
  "contact.form.email": "Adresse e-mail",
  "contact.form.message": "Message",
  "contact.form.send": "Envoyer le message",
  "contact.form.sent": "Merci ! Votre message est prêt dans votre application mail.",
  "contact.phone": "Téléphone",
  "contact.hours": "Joignable",
  "contact.hours.value": "Mardi au samedi · 10h00 – 16h30",
  "contact.whatsapp": "WhatsApp",
  "contact.sms": "SMS",
  "contact.callback": "Demander un rappel",
  "about.title": "Qui sommes-nous",
  "about.lede":
    "Maximilien est une ferme d'animation urbaine au cœur de Bruxelles — un lieu de rencontre, d'éducation et de cohésion sociale.",
  "about.history.title": "Notre histoire",
  "about.history.body":
    "Depuis plus de trente ans, la ferme accueille les habitants du Quartier Nord et de tout Bruxelles. Née comme un projet socio-éducatif autour des animaux et du potager, elle est devenue un espace vivant où nature, agriculture durable et vivre-ensemble se rencontrent.",
  "about.mission.title": "Notre mission",
  "about.mission.body":
    "Nous œuvrons pour le bien-être animal, l'éducation à l'environnement, l'agriculture locale et durable, et la cohésion sociale. Nos animations montrent la biodiversité comme un cycle : rien ne se perd, tout se transforme.",
  "about.team.title": "L'équipe",
  "about.team.body":
    "Derrière la ferme, une équipe passionnée d'animateurs, soigneurs et bénévoles. Cette page sera bientôt enrichie de portraits et de courtes biographies.",
  "support.title": "Soutenir la ferme",
  "support.lede":
    "Chaque contribution — grande ou petite — aide à nourrir nos animaux, organiser des ateliers et garder la ferme accessible à toutes et tous.",
  "support.wero.title": "Wero — directement via votre application bancaire",
  "support.wero.body":
    "Wero est le moyen le plus rapide pour les dons mobiles. Scannez le QR ou utilisez l'adresse e-mail ci-dessous dans votre app bancaire.",
  "support.transfer.title": "Virement",
  "support.transfer.body": "Mentionnez en communication : « Soutien ferme » ou l'objectif choisi.",
  "support.goals.title": "Objectifs concrets",
  "support.goal.food": "De la nourriture pour Boudewijn l'âne",
  "support.goal.food.body": "25 € = une semaine de foin et de céréales pour nos ânes.",
  "support.goal.workshop": "Accueillir une classe",
  "support.goal.workshop.body": "80 € = un atelier éducatif pour une classe de 20 enfants.",
  "support.goal.shelter": "Entretien des étables",
  "support.goal.shelter.body": "150 € = paille et matériel pour un mois.",
  "common.readMore": "Lire la suite",
  "hub.practical": "Pratique",
  "hub.contactIntro": "Une question sur cette page ? Écrivez-nous.",
  "hub.faq": "Questions fréquentes",
  "hub.notFound.title": "Cette page n'existe pas encore",
  "hub.notFound.body": "Choisissez un sujet dans le menu ou revenez à la",
  "hub.notFound.home": "page d'accueil",
  "footer.partners": "Partenaires & soutien",
  "footer.mapLink": "Voir la localisation sur la carte →",
  "footer.becomePartner": "Devenir partenaire →",
  "footer.ourPartners": "Nos partenaires & réseaux",
  "footer.supportedBy": "Avec le soutien de & en collaboration avec",
  "about.pillars.title": "Nos piliers",
  "about.pillar.welfare": "Bien-être animal",
  "about.pillar.welfare.body":
    "Des soins quotidiens, de l'espace et du respect pour chaque animal.",
  "about.pillar.education": "Éducation & sensibilisation",
  "about.pillar.education.body": "Des animations pour les écoles, les familles et le quartier.",
  "about.pillar.biodiversity": "Biodiversité",
  "about.pillar.biodiversity.body": "Un corridor vert vivant au cœur de Bruxelles.",
  "about.pillar.social": "Cohésion sociale",
  "about.pillar.social.body": "Un lieu de rencontre ouvert à tous les habitants.",
  "about.gov.title": "Conseil d'administration",
  "about.gov.body":
    "L'ASBL est administrée par un conseil bénévole qui veille à sa mission et à ses finances.",
  "about.gov.president": "Président·e",
  "about.gov.vicepresident": "Vice-président·e",
  "about.gov.treasurer": "Trésorier·ère",
  "about.gov.secretary": "Secrétaire",
  "about.gov.member": "Administrateur·rice",
  "about.partners.title": "Partenaires & réseaux",
  "about.partners.body":
    "Nous travaillons avec les pouvoirs publics et les réseaux nature et fermes d'animation.",
  "about.role.director": "Direction",
  "about.role.projects": "Chargé·e de projets",
  "about.role.site": "Gestion du site",
  "partners.brussels.desc": "Ville de Bruxelles",
  "partners.fao.desc": "Organisation des Nations Unies pour l'alimentation et l'agriculture",
  "partners.fedeau.desc": "Fédération d'associations bruxelloises",
  "partners.natagora.desc": "Réseau Nature",
  "partners.ffa.desc": "Fédération belge francophone des fermes d'animation",
  "partners.leefmilieu.desc": "Bruxelles Environnement",
  "common.copy": "Copier",
  "common.back": "Retour",
  "common.loading": "Chargement…",
  "common.tryAgain": "Réessayer",
  "common.goHome": "Retour à l'accueil",
  "err.404.title": "Page introuvable",
  "err.404.body": "La page recherchée n'existe pas ou a été déplacée.",
  "err.boundary.title": "Cette page n'a pas chargé",
  "err.boundary.body":
    "Une erreur s'est produite. Essayez de rafraîchir ou de revenir à l'accueil.",
  "home.eyebrow": "Ferme Urbaine · Bruxelles 1000",
  "brand.name": "Maximilien",
  "brand.tagline": "Ferme Urbaine · Bruxelles 1000",
  "footer.mission":
    "Une ferme urbaine où animaux, quartier et éducation se rencontrent — au cœur de Bruxelles.",
  "home.cta.academy": "Visitez l'Académie",
  "home.cta.support": "Soutenir le projet",
  "home.status.open": "Ouvert maintenant",
  "home.status.closed": "Actuellement fermé",
  "status.open": "Ouvert maintenant",
  "status.closingSoon": "Ferme dans {mins} min",
  "status.openingSoon": "Ouvre à {time}",
  "status.closed": "Fermé · ouvre à {time}",
  "status.closedNextDay": "Fermé · réouverture {day} à {time}",
  "status.tomorrow": "demain",
  "status.viewHours": "Tous les horaires",
  "status.closedNoTime": "Fermé aujourd'hui",
  "cert.pickup.title": "Retirez votre certificat physique",
  "cert.pickup.body":
    "Recevez un exemplaire imprimé sur papier de luxe avec un vrai tampon — à retirer à la ferme.",
  "cert.pickup.cta": "Demander le certificat physique",
  "cert.pickup.voucher": "Bon n°",
  "cert.pickup.show": "Présentez ce bon ou ce QR-code à l'accueil.",
  "cert.pickup.claimed": "Demandé",
  "cert.share": "Partager le certificat",
  "cert.shareCopied": "Lien copié dans le presse-papiers.",
  "cert.verifyHint": "Scannez pour vérifier",
  "cert.signature": "Équipe Maximilien",
  "cert.signatureRole": "Responsable pédagogique",
  "verify.title": "Vérifier le certificat",
  "verify.checking": "Vérification du certificat…",
  "verify.valid": "Certificat vérifié",
  "verify.invalid": "Ce numéro de certificat est inconnu.",
  "verify.issuedTo": "Délivré à {name} le {date}.",

  "home.vision.title": "Notre vision",
  "home.vision.default":
    "Reconnecter les habitants de la ville au cycle du vivant, dans le respect de l'environnement et du lien social.",
  "home.residents": "Les habitants",
  "home.discoverAll": "Tout découvrir →",
  "home.hub.title": "Découvrez la ferme",
  "home.hub.body":
    "Choisissez votre espace — école, famille, entreprise ou quartier — et trouvez directement ce que vous cherchez : activités, location, bénévolat ou soutien.",
  "home.hub.school": "École & Non-profit →",
  "home.hub.family": "Famille & Fête →",
  "home.hub.business": "Entreprise & Teambuilding →",
  "home.hub.support": "Soutenir la ferme →",
  "rent.eyebrow": "Location & Privatisation",
  "rent.title": "Des espaces pour votre événement à la ferme",
  "rent.lede":
    "Notre salle d'accueil et notre espace polyvalent sont disponibles pour écoles, familles et entreprises. Choisissez votre public ci-dessous — vous y trouverez des formules et tarifs concrets.",
  "rent.view": "Voir",
  "rent.help": "Autre objectif ou pas sûr·e de l'espace qu'il vous faut ?",
  "rent.contactUs": "Contactez-nous",
  "rent.helpTail": "— nous vous accompagnons.",
  "rent.school.label": "Écoles & Non-profit",
  "rent.school.body": "Tarif social. Salle d'accueil + zone couverte pour pique-nique ou atelier.",
  "rent.family.label": "Familles & Anniversaires",
  "rent.family.body": "Demi-journée avec animateur, visite des animaux et coin créatif.",
  "rent.biz.label": "Entreprises & Séminaires",
  "rent.biz.body":
    "Espace polyvalent pour réunions, teambuilding et événements jusqu'à 40 personnes.",
  "support.wero.emailLabel": "Wero · e-mail",
  "support.beneficiary": "Bénéficiaire",
  "support.iban": "IBAN",
  "support.bic": "BIC",
  "about.role.coord": "Coordinatrice & éducation",
  "about.role.animals": "Soigneur animalier",
  "about.role.garden": "Potager & compost",
  "about.role.volunteers": "Bénévoles",
  "about.role.volunteers.sub": "Voisins & écoles",
  "shop.eyebrow": "Click & Collect · Bruxelles 1000",
  "shop.title": "Boutique fermière",
  "shop.lede":
    "Sans emballage et produits localement. Réservez votre commande et venez la chercher à la ferme — apportez votre sac, seau ou boîte.",
  "shop.packagingFree": "Sans emballage",
  "shop.deposit": "Consigne retour",
  "shop.offer": "Offre",
  "shop.count": "{n} produits locaux",
  "shop.empty": "Aucun produit disponible pour l'instant.",
  "shop.badge.packaging": "Sans emballage",
  "shop.badge.deposit": "Consigne",
  "shop.addToCart": "Au panier",
  "shop.added": "{title} ajouté",
  "shop.viewCart": "Voir le panier",
  "cart.title": "Votre panier",
  "cart.empty": "Votre panier est vide.",
  "cart.continue": "Continuer les achats",
  "cart.subtotal": "Sous-total",
  "cart.checkout": "Passer à la caisse →",
  "cart.pickup.title": "Choisissez votre créneau de retrait",
  "cart.pickup.placeholder": "— Choisissez un créneau —",
  "cart.pickup.day": "Choisissez la date",
  "cart.pickup.time": "Choisissez l'heure",
  "cart.bagPledge":
    "J'apporte mon propre sac, seau ou boîte réutilisable pour rester sans emballage.",
  "cart.method": "Mode de paiement",
  "cart.method.iban": "Virement (IBAN)",
  "cart.method.bancontact": "Bancontact",
  "cart.method.wero": "Wero",
  "cart.total": "Total",
  "cart.back": "Retour",
  "cart.confirm": "Confirmer",
  "cart.placed": "Commande passée",
  "cart.reference": "Référence",
  "cart.pickupLine": "Retrait à la ferme",
  "cart.onAppointment": "sur rendez-vous",
  "cart.transfer": "Virement",
  "cart.amount": "Montant",
  "cart.communication": "Communication",
  "cart.onlineSoon": "Le paiement en ligne ({method}) sera bientôt disponible.",
  "cart.newOrder": "Nouvelle commande",
  "cart.perUnit": "/ pièce",
  "cart.less": "Moins",
  "cart.more": "Plus",
  "cart.remove": "Supprimer",
  "mine.eyebrow": "Carte fidélité",
  "mine.title": "Mes Sabots",
  "mine.lede":
    "Collectionnez des Sabots à chaque Académie réussie ou permanence de bénévolat à la ferme. Complétez votre vitrine et profitez d'avantages à la caisse.",
  "mine.loginPromptTitle": "Connectez-vous pour voir vos Sabots",
  "mine.loginPromptBody": "Vos badges, certificats et Sabots sont liés à votre compte.",
  "mine.loginBtn": "Se connecter ou s'inscrire",
  "mine.progress": "Progression",
  "mine.hoefjeReached": "Sabot obtenu",
  "mine.hoefjeNot": "Pas encore obtenu",
  "mine.trophy": "Vitrine des trophées",
  "mine.allAcademies": "Toutes les académies →",
  "mine.done": "Obtenu",
  "mine.locked": "Verrouillé",
  "mine.viewCert": "Voir le certificat",
  "mine.startAcademy": "Démarrer l'Académie",
  "mine.wallet.title": "Ajouter à votre wallet",
  "mine.wallet.body": "Gardez votre carte Sabots sur votre téléphone, toujours prête à la caisse.",
  "mine.wallet.add": "Ajouter",
  "mine.wallet.link": "Lier",
  "mine.wallet.soon": "L'intégration wallet arrive bientôt.",
  "mine.reward.coffee": "Café/thé offert",
  "mine.reward.shop": "-10% en boutique",
  "mine.reward.activity": "Activité offerte",
  "aca.eyebrow": "Programme éducatif",
  "aca.title": "Choisissez votre Académie",
  "aca.lede":
    "Chaque animal a son Académie. Réussissez le test et obtenez un certificat de bien-être officiel + un badge unique dans votre vitrine.",
  "aca.qPass": "{n} questions · réussite à {m}",
  "aca.empty": "Aucune académie active pour l'instant. Demandez à l'équipe d'en activer une.",
  "aca.search": "Chercher un animal…",
  "aca.noResults": "Aucune Académie trouvée pour « {q} ».",
  "aca.clear": "Effacer les filtres",
  "aca.count": "{n} académies",
  "aca.popular": "Les plus choisies",
  "aca.cat.all": "Tous les animaux",
  "aca.cat.huisdieren": "Animaux de compagnie en ville",
  "aca.cat.knaagdieren": "Rongeurs & petits mammifères",
  "aca.cat.boerderij": "Ferme urbaine",
  "aca.cat.exoten": "Exotiques & reptiles",
  "aca.cat.invertebraten": "Araignées & insectes",
  "aca.cat.vogels": "Oiseaux",
  "aca.cat.pluimvee": "Volaille & oiseaux d'eau",
  "aca.cat.biodiversiteit": "Biodiversité & nature",
  "aca.cat.moestuin": "Potager & sol",
  "aca.cat.stadsnatuur": "Nature urbaine & faune sauvage",
  "aca.cat.vijver": "Mare & nature",
  "aca.cat.etiquette": "Étiquette à la ferme",
  "aca.cat.valkuilen": "⚠️ Achats impulsifs & pièges",

  "aca.loading": "Chargement de l'Académie…",
  "aca.backAll": "← Toutes les académies",
  "aca.info": "{n} questions · réussite à {m} bonnes réponses.",
  "aca.firstName": "Prénom",
  "aca.lastName": "Nom",
  "aca.lastNameHint": "Obligatoire : votre nom figurera sur le certificat.",
  "aca.mod.label": "Module {i} sur 3",
  "aca.mod.1": "Habitat & environnement",
  "aca.mod.2": "Alimentation & santé",
  "aca.mod.3": "Comportement & manipulation",
  "aca.modDone.title": "Module {i} terminé 🎉",
  "aca.modDone.body":
    "Bravo ! Tu as terminé « {name} » avec {ok} bonnes réponses sur {n}. Prêt pour la suite ?",
  "aca.modDone.cta": "Module suivant →",
  "aca.modDone.last": "Vers le récapitulatif →",
  "aca.listen": "Lire la question à voix haute",
  "aca.stopListen": "Arrêter la lecture",
  "aca.speed": "Vitesse de lecture",
  "aca.speed.slow": "Lent",
  "aca.speed.normal": "Normal",
  "aca.speed.fast": "Rapide",
  "aca.noVoice":
    "Votre appareil n'a pas de voix pour cette langue. La lecture se fera dans une autre langue.",
  "aca.playAudio": "Écouter le son",
  "aca.correct": "Correct !",
  "aca.wrong": "Incorrect",
  "aca.didYouKnow": "Le saviez-vous ?",
  "aca.continue": "Continuer →",
  "aca.check": "Vérifier",

  "aca.question": "Question {i} / {n}",
  "aca.prev": "Précédent",
  "aca.next": "Suivant →",
  "aca.toOverview": "Vers le récapitulatif →",
  "aca.ready.title": "Prêt à envoyer",
  "aca.ready.body": "Indiquez votre nom complet — il figurera sur votre certificat.",
  "aca.needLogin.title": "Connectez-vous pour recevoir votre certificat",
  "aca.needLogin.body":
    "Vous devez être connecté·e pour recevoir un certificat officiel et débloquer votre badge.",
  "aca.toLogin": "Vers la connexion",
  "aca.claim.title": "Votre certificat est prêt !",
  "aca.claim.body":
    "Connectez-vous ou créez un compte pour réclamer votre certificat et débloquer votre badge. Votre nom et vos réponses sont conservés.",
  "aca.claim.google": "Continuer avec Google",
  "aca.claim.email": "Se connecter par e-mail",
  "aca.claim.register": "Pas encore de compte ? S'inscrire",

  "aca.fullName": "Nom complet",
  "aca.namePlaceholder": "Ex. Jean Dupont",
  "aca.review": "← Revoir mes réponses",
  "aca.request": "Demander le certificat",
  "aca.submitting": "Envoi…",
  "aca.passed": "Réussi ! Certificat #{n}",
  "aca.failed": "Score {s} — pas encore réussi, réessayez.",
  "aca.loadError": "Impossible de charger l'académie",
  "aca.submitError": "Erreur lors de l'envoi",
  "aca.qPassMod": "{n} questions ({k} modules) · réussite par module",
  "aca.infoMod": "{n} questions en {k} modules · au moins {m} bonnes réponses par module.",
  "aca.mod.labelK": "Module {i} sur {k}",
  "aca.exit": "Quitter le quiz",
  "aca.progress": "Module {i}/{k} · question {a}/{b}",
  "aca.modDone.pass": "Score {ok}/{n} — module réussi.",
  "aca.modFail.title": "Module {i} pas encore réussi",
  "aca.modFail.body":
    "Tu as {ok} bonnes réponses sur {n}. Il en faut au moins {m} pour débloquer le module suivant.",
  "aca.modFail.cta": "Recommencer ce module",
  "aca.finalUnlocked": "Tous les modules sont réussis — ton certificat est prêt.",
  "auth.eyebrow": "Équipe",
  "auth.signIn": "Connexion",
  "auth.signUp": "Créer un compte",
  "auth.desc": "Réservé au personnel et administrateurs de La Ferme.",
  "auth.google": "Continuer avec Google",
  "auth.or": "ou",
  "auth.fullName": "Nom complet",
  "auth.email": "E-mail",
  "auth.password": "Mot de passe",
  "auth.doSignUp": "S'inscrire",
  "auth.doSignIn": "Se connecter",
  "auth.toSignUp": "Nouveau ? Créer un compte",
  "auth.toSignIn": "Déjà un compte ? Se connecter",
  "auth.created": "Compte créé",
  "auth.error": "Une erreur s'est produite",
  "auth.googleFail": "Échec de la connexion Google",
  "auth.back": "← Ferme Maximilien",
  "login.eyebrow": "Visiteurs",
  "login.title": "Bienvenue chez Maximilien",
  "login.desc": "Connectez-vous ou créez un compte pour voir vos Sabots, badges et avantages.",
  "login.tab.signin": "Connexion",
  "login.tab.signup": "Créer un compte",
  "login.google": "Continuer avec Google",
  "login.or": "ou",
  "login.fullName": "Nom complet",
  "login.email": "E-mail",
  "login.password": "Mot de passe",
  "login.doSignIn": "Se connecter",
  "login.doSignUp": "Créer un compte",
  "login.created": "Compte créé — vérifiez votre boîte mail.",
  "login.error": "Une erreur s'est produite",
  "login.googleFail": "Échec de la connexion Google",
  "login.back": "← Retour au site",
  "qr.unknownTitle": "QR inconnu",
  "qr.unknownBody": "Ce QR ne correspond à aucun animal de la ferme.",
  "qr.backHub": "Retour à l'accueil",
  "qr.aiOpens": "Le guide IA s'ouvre automatiquement et parle en tant que {name}.",
  "qr.greeting": "Bonjour ! Je suis {name}. Bienvenue dans mon enclos. Que veux-tu savoir ?",
  "cert.official": "Certificat officiel · Officieel certificaat",
  "cert.confirms": "Il est certifié que",
  "cert.participant": "Participant·e enregistré·e",
  "cert.completedBody":
    "a réussi l'Académie {name}, démontrant ainsi les connaissances requises sur le bien-être, les soins et le comportement naturel de cette espèce.",
  "cert.score": "Score obtenu :",
  "cert.issuedOn": "Émis le",
  "cert.certNr": "Certificat n°",
  "cert.nthGraduate": "{ord} lauréat·e",
  "cert.loading": "Chargement du certificat…",
  "cert.notFound": "Certificat introuvable.",
  "cert.backBadges": "Retour à mes badges",
  "cert.print": "Imprimer / PDF",
  "cert.download": "Télécharger",
  "cert.downloading": "Préparation du certificat…",
  "cert.downloadDone": "Certificat téléchargé.",
  "cert.downloadFail": "Échec du téléchargement. Essayez Imprimer / PDF.",
  "cert.footer": "Certificat #{nr} · Vous êtes le·la {ord} expert·e à réussir l'Académie {name}.",
  "shop.badge.bio": "Bio",
  "product.back": "Retour",
  "product.breadcrumb.shop": "Boutique fermière",
  "product.notFound": "Ce produit n'existe plus.",
  "product.packaging": "Emballage",
  "product.quantity": "Quantité",
  "product.producer": "Origine",
  "product.distance": "à {km} km de votre point de retrait",
  "product.impact": "Vous évitez {g} g de déchets d'emballage par pièce.",
  "product.bundle": "Souvent achetés ensemble",
  "product.bundleAdd": "Ajouter le lot",
  "product.ingredients": "Composition",
  "product.storage": "Conservation",
  "product.pickup": "Retrait",
  "product.deposit": "Consigne {amount} — remboursée au comptoir",
  "cart.added.title": "Ajouté à votre panier",
  "cart.crossSell": "Se marie bien avec",
  "cart.progress.reached": "Super ! Vous recevez un sachet de graines de la ferme en cadeau.",
  "cart.progress.remaining": "Encore {amount} pour un sachet de graines offert.",
};

const EN: Dict = {
  "nav.hub": "Home",
  "nav.academy": "Academy",
  "nav.webshop": "Shop",
  "nav.about": "About us",
  "nav.contact": "Contact",
  "nav.support": "Support",
  "nav.mine": "My Hooves",
  "nav.admin": "Admin",
  "nav.account": "My account",
  "nav.cart": "Cart",
  "nav.signin": "Sign in",
  "lang.label": "Language",
  "gallery.rental.title": "Rooms in pictures",
  "gallery.rental.alt": "Room photo",
  "gallery.camps.title": "Camps in pictures",
  "gallery.camps.alt": "Camp photo",
  "gallery.animations.title": "Activities in pictures",
  "gallery.animations.alt": "Activity photo",
  "gallery.seminars.title": "Seminars in pictures",
  "gallery.seminars.alt": "Seminar photo",
  "gallery.teambuilding.title": "Team building in pictures",
  "gallery.teambuilding.alt": "Team building photo",
  "theme.label": "Theme",
  "theme.light": "Light",
  "theme.dark": "Dark",
  "theme.system": "System",
  "footer.contact": "Direct contact",
  "footer.contactLink": "Contact form",
  "footer.menu": "Menu",
  "footer.follow": "Follow us",
  "footer.location": "Location",
  "footer.openInMaps": "Open in Google Maps",
  "chat.title": "Maxim — Guide",
  "chat.greeting": "Hi! I'm Maxim, your guide at Maximilien. How can I help?",
  "chat.placeholder": "Ask Maxim a question…",
  "chat.send": "Send",
  "chat.close": "Minimise",
  "chat.open": "Chat with Maxim",
  "chat.busy": "Working…",
  "chat.err.rate": "One moment — too many questions at once.",
  "chat.err.credits": "Currently unavailable.",
  "chat.err.generic": "Something went wrong. Please try again.",
  "contact.title": "Contact",
  "contact.subtitle": "Come by, call or write — we'd love to hear from you.",
  "contact.form.name": "Name",
  "contact.form.email": "Email address",
  "contact.form.message": "Message",
  "contact.form.send": "Send message",
  "contact.form.sent": "Thanks! Your message is ready in your mail app.",
  "contact.phone": "Phone",
  "contact.hours": "Reachable",
  "contact.hours.value": "Tuesday to Saturday · 10:00 – 16:30",
  "contact.whatsapp": "WhatsApp",
  "contact.sms": "SMS",
  "contact.callback": "Request a callback",
  "about.title": "About us",
  "about.lede":
    "Maximilien is an urban farm in the heart of Brussels — a place of encounter, education and social cohesion.",
  "about.history.title": "Our history",
  "about.history.body":
    "For over thirty years the farm has welcomed residents of the Noord/Nord neighbourhood and of Brussels at large. What began as a social-educational project around animals and the vegetable garden has grown into a lively place where nature, sustainable agriculture and community meet.",
  "about.mission.title": "Our mission",
  "about.mission.body":
    "We stand for animal welfare, environmental education, local and sustainable agriculture, and social cohesion between neighbours. Our activities show biodiversity as a cycle: nothing is lost, everything is transformed.",
  "about.team.title": "The team",
  "about.team.body":
    "Behind the farm is a passionate team of animators, caretakers and volunteers. This page will soon be filled with portraits and short bios.",
  "support.title": "Support the farm",
  "support.lede":
    "Every contribution — big or small — helps us feed our animals, run workshops and keep the farm open to all.",
  "support.wero.title": "Wero — straight from your bank app",
  "support.wero.body":
    "Wero is the fastest way to donate on mobile. Scan the QR or use the email below in your bank app.",
  "support.transfer.title": "Bank transfer",
  "support.transfer.body":
    "Please add as reference: 'Farm support' or the goal you'd like to back.",
  "support.goals.title": "Concrete goals",
  "support.goal.food": "Food for Boudewijn the donkey",
  "support.goal.food.body": "€25 = one week of hay and grain for our donkeys.",
  "support.goal.workshop": "Welcoming a school class",
  "support.goal.workshop.body": "€80 = one educational workshop for a class of 20 children.",
  "support.goal.shelter": "Barn upkeep",
  "support.goal.shelter.body": "€150 = straw and materials for a month.",
  "common.readMore": "Read more",
  "hub.practical": "Practical",
  "hub.contactIntro": "A question about this page? Send us a message.",
  "hub.faq": "Frequently asked",
  "hub.notFound.title": "This page doesn't exist yet",
  "hub.notFound.body": "Pick a topic from the menu or head back to the",
  "hub.notFound.home": "home page",
  "footer.partners": "Partners & support",
  "footer.mapLink": "See location on map →",
  "footer.becomePartner": "Become a partner →",
  "footer.ourPartners": "Our partners & networks",
  "footer.supportedBy": "With the support of & in collaboration with",
  "about.pillars.title": "Our pillars",
  "about.pillar.welfare": "Animal welfare",
  "about.pillar.welfare.body": "Daily care, space and respect for every animal on the farm.",
  "about.pillar.education": "Education & awareness",
  "about.pillar.education.body": "Workshops for schools, families and neighbourhood groups.",
  "about.pillar.biodiversity": "Biodiversity",
  "about.pillar.biodiversity.body": "A living green corridor in the heart of Brussels.",
  "about.pillar.social": "Social cohesion",
  "about.pillar.social.body": "A meeting place open to every resident of the city.",
  "about.gov.title": "Board of directors",
  "about.gov.body":
    "The non-profit is governed by a volunteer board that safeguards our mission and finances.",
  "about.gov.president": "President",
  "about.gov.vicepresident": "Vice-president",
  "about.gov.treasurer": "Treasurer",
  "about.gov.secretary": "Secretary",
  "about.gov.member": "Board member",
  "about.partners.title": "Partners & networks",
  "about.partners.body":
    "We work together with public authorities and nature and animation-farm networks.",
  "about.role.director": "Director",
  "about.role.projects": "Project manager",
  "about.role.site": "Site management",
  "partners.brussels.desc": "City of Brussels",
  "partners.fao.desc": "Food and Agriculture Organization of the UN",
  "partners.fedeau.desc": "Federation of Brussels non-profits",
  "partners.natagora.desc": "Réseau Nature",
  "partners.ffa.desc": "Belgian federation of animation farms",
  "partners.leefmilieu.desc": "Brussels Environment",
  "common.copy": "Copy",
  "common.back": "Back",
  "common.loading": "Loading…",
  "common.tryAgain": "Try again",
  "common.goHome": "Go home",
  "err.404.title": "Page not found",
  "err.404.body": "The page you're looking for doesn't exist or has been moved.",
  "err.boundary.title": "This page didn't load",
  "err.boundary.body": "Something went wrong on our end. You can try refreshing or head back home.",
  "home.eyebrow": "Urban Farm · Brussels 1000",
  "brand.name": "Maximilien",
  "brand.tagline": "Urban Farm · Brussels 1000",
  "footer.mission":
    "An urban farm where animals, neighbourhood and education meet — in the heart of Brussels.",
  "home.cta.academy": "Visit the Academy",
  "home.cta.support": "Support the project",
  "home.status.open": "Open now",
  "home.status.closed": "Currently closed",
  "status.open": "Open now",
  "status.closingSoon": "Closes in {mins} min",
  "status.openingSoon": "Opens at {time}",
  "status.closed": "Closed · opens at {time}",
  "status.closedNextDay": "Closed · open again {day} at {time}",
  "status.tomorrow": "tomorrow",
  "status.viewHours": "All opening hours",
  "status.closedNoTime": "Closed today",
  "cert.pickup.title": "Pick up your physical certificate",
  "cert.pickup.body":
    "Get a printed copy on luxury paper with a real stamp — collect it at the farm.",
  "cert.pickup.cta": "Request physical certificate",
  "cert.pickup.voucher": "Voucher no.",
  "cert.pickup.show": "Show this voucher or QR code at the reception.",
  "cert.pickup.claimed": "Requested",
  "cert.share": "Share certificate",
  "cert.shareCopied": "Link copied to your clipboard.",
  "cert.verifyHint": "Scan to verify",
  "cert.signature": "Team Maximilien",
  "cert.signatureRole": "Head of Education",
  "verify.title": "Verify certificate",
  "verify.checking": "Checking certificate…",
  "verify.valid": "Verified certificate",
  "verify.invalid": "This certificate number is unknown.",
  "verify.issuedTo": "Issued to {name} on {date}.",

  "home.vision.title": "Our vision",
  "home.vision.default":
    "Reconnect city dwellers with the cycle of life, respecting the environment and the social bond.",
  "home.residents": "The residents",
  "home.discoverAll": "Discover all →",
  "home.hub.title": "Discover the farm",
  "home.hub.body":
    "Pick your hub — school, family, business or neighbourhood — and find what you need: activities, rentals, volunteering or support.",
  "home.hub.school": "School & Non-profit →",
  "home.hub.family": "Family & Party →",
  "home.hub.business": "Business & Teambuilding →",
  "home.hub.support": "Support the farm →",
  "rent.eyebrow": "Rentals & Private hire",
  "rent.title": "Spaces for your event at the farm",
  "rent.lede":
    "Our welcome hall and multipurpose space are available for schools, families and businesses. Pick your audience below — you'll find concrete packages and rates.",
  "rent.view": "View",
  "rent.help": "Different goal or not sure which space you need?",
  "rent.contactUs": "Get in touch",
  "rent.helpTail": "— we're happy to help.",
  "rent.school.label": "Schools & Non-profit",
  "rent.school.body": "Social rate. Welcome hall + covered picnic/workshop area.",
  "rent.family.label": "Families & Birthdays",
  "rent.family.body": "Half-day with a guide, animal tour and creative corner.",
  "rent.biz.label": "Business & Seminars",
  "rent.biz.body": "Multipurpose room for meetings, teambuilding and events up to 40 people.",
  "support.wero.emailLabel": "Wero · email",
  "support.beneficiary": "Beneficiary",
  "support.iban": "IBAN",
  "support.bic": "BIC",
  "about.role.coord": "Coordinator & education",
  "about.role.animals": "Animal caretaker",
  "about.role.garden": "Vegetable garden & compost",
  "about.role.volunteers": "Volunteers",
  "about.role.volunteers.sub": "Neighbours & schools",
  "shop.eyebrow": "Click & Collect · Brussels 1000",
  "shop.title": "Farm shop",
  "shop.lede":
    "Packaging-free and locally produced. Reserve your order and pick it up at the farm — bring your own bag, bucket or box.",
  "shop.packagingFree": "Packaging-free",
  "shop.deposit": "Deposit return",
  "shop.offer": "Selection",
  "shop.count": "{n} local products",
  "shop.empty": "No products available at the moment.",
  "shop.badge.packaging": "Packaging-free",
  "shop.badge.deposit": "Deposit",
  "shop.addToCart": "Add",
  "shop.added": "{title} added",
  "shop.viewCart": "View cart",
  "cart.title": "Your cart",
  "cart.empty": "Your cart is empty.",
  "cart.continue": "Continue shopping",
  "cart.subtotal": "Subtotal",
  "cart.checkout": "Proceed to checkout →",
  "cart.pickup.title": "Choose your pickup slot",
  "cart.pickup.placeholder": "— Pick a slot —",
  "cart.pickup.day": "Choose date",
  "cart.pickup.time": "Choose time",
  "cart.bagPledge": "I bring my own reusable bag, bucket or box to keep this offer packaging-free.",
  "cart.method": "Payment method",
  "cart.method.iban": "Bank transfer (IBAN)",
  "cart.method.bancontact": "Bancontact",
  "cart.method.wero": "Wero",
  "cart.total": "Total",
  "cart.back": "Back",
  "cart.confirm": "Confirm",
  "cart.placed": "Order placed",
  "cart.reference": "Reference",
  "cart.pickupLine": "Pickup at the farm",
  "cart.onAppointment": "by appointment",
  "cart.transfer": "Bank transfer",
  "cart.amount": "Amount",
  "cart.communication": "Reference",
  "cart.onlineSoon": "Online payment ({method}) coming soon.",
  "cart.newOrder": "Start a new order",
  "cart.perUnit": "/ each",
  "cart.less": "Less",
  "cart.more": "More",
  "cart.remove": "Remove",
  "mine.eyebrow": "Loyalty card",
  "mine.title": "My Hooves",
  "mine.lede":
    "Collect Hooves for every Academy you complete or volunteer shift at the farm. Fill your trophy case and unlock perks at the till.",
  "mine.loginPromptTitle": "Sign in to see your Hooves",
  "mine.loginPromptBody": "Your badges, certificates and Hooves are tied to your account.",
  "mine.loginBtn": "Sign in or register",
  "mine.progress": "Progress",
  "mine.hoefjeReached": "Hoof earned",
  "mine.hoefjeNot": "Not yet earned",
  "mine.trophy": "Trophy case",
  "mine.allAcademies": "All academies →",
  "mine.done": "Earned",
  "mine.locked": "Locked",
  "mine.viewCert": "View certificate",
  "mine.startAcademy": "Start Academy",
  "mine.wallet.title": "Add to your wallet",
  "mine.wallet.body": "Keep your Hooves card on your phone, always ready at the till.",
  "mine.wallet.add": "Add",
  "mine.wallet.link": "Link",
  "mine.wallet.soon": "Wallet integration coming soon.",
  "mine.reward.coffee": "Free coffee/tea",
  "mine.reward.shop": "10% shop discount",
  "mine.reward.activity": "Free farm activity",
  "aca.eyebrow": "Educational programme",
  "aca.title": "Choose your Academy",
  "aca.lede":
    "Each animal has its own Academy. Pass the test and earn an officially verified welfare certificate + a unique badge in your trophy case.",
  "aca.qPass": "{n} questions · pass at {m}",
  "aca.empty": "No active academies yet. Ask the team to enable one.",
  "aca.search": "Search an animal…",
  "aca.noResults": "No Academy found for “{q}”.",
  "aca.clear": "Clear filters",
  "aca.count": "{n} academies",
  "aca.popular": "Most chosen",
  "aca.cat.all": "All animals",
  "aca.cat.huisdieren": "City pets",
  "aca.cat.knaagdieren": "Rodents & small mammals",
  "aca.cat.boerderij": "City farm",
  "aca.cat.exoten": "Exotics & reptiles",
  "aca.cat.invertebraten": "Spiders & insects",
  "aca.cat.vogels": "Birds",
  "aca.cat.pluimvee": "Poultry & waterfowl",
  "aca.cat.biodiversiteit": "Biodiversity & nature",
  "aca.cat.moestuin": "Vegetable garden & soil",
  "aca.cat.stadsnatuur": "Urban nature & wildlife",
  "aca.cat.vijver": "Pond & nature",
  "aca.cat.etiquette": "Farm etiquette",
  "aca.cat.valkuilen": "⚠️ Impulse buys & pitfalls",

  "aca.loading": "Loading Academy…",
  "aca.backAll": "← All academies",
  "aca.info": "{n} questions · pass at {m} correct answers.",
  "aca.firstName": "First name",
  "aca.lastName": "Last name",
  "aca.lastNameHint": "Required: your last name appears on the certificate.",
  "aca.mod.label": "Module {i} of 3",
  "aca.mod.1": "Housing & environment",
  "aca.mod.2": "Food & health",
  "aca.mod.3": "Behaviour & handling",
  "aca.modDone.title": "Module {i} completed 🎉",
  "aca.modDone.body":
    "Well done! You finished “{name}” with {ok} out of {n} correct. Ready for the next module?",
  "aca.modDone.cta": "Next module →",
  "aca.modDone.last": "To the summary →",
  "aca.listen": "Read question aloud",
  "aca.stopListen": "Stop reading",
  "aca.speed": "Reading speed",
  "aca.speed.slow": "Slow",
  "aca.speed.normal": "Normal",
  "aca.speed.fast": "Fast",
  "aca.noVoice":
    "Your device has no voice for this language, so reading aloud may sound in another language.",
  "aca.playAudio": "Play the sound",
  "aca.correct": "Correct!",
  "aca.wrong": "Not correct",
  "aca.didYouKnow": "Did you know?",
  "aca.continue": "Continue →",
  "aca.check": "Check",

  "aca.question": "Question {i} / {n}",
  "aca.prev": "Previous",
  "aca.next": "Next →",
  "aca.toOverview": "To overview →",
  "aca.ready.title": "Ready to submit",
  "aca.ready.body": "Enter your full name — it will appear on your certificate.",
  "aca.needLogin.title": "Sign in to receive your certificate",
  "aca.needLogin.body":
    "You need to be signed in to receive an official certificate and unlock your badge.",
  "aca.toLogin": "Go to sign in",
  "aca.claim.title": "Your certificate is ready!",
  "aca.claim.body":
    "Sign in or create an account to claim your certificate and unlock your badge. Your name and answers are saved.",
  "aca.claim.google": "Continue with Google",
  "aca.claim.email": "Sign in with email",
  "aca.claim.register": "No account yet? Create one",

  "aca.fullName": "Full name",
  "aca.namePlaceholder": "e.g. Jane Doe",
  "aca.review": "← Review answers",
  "aca.request": "Request certificate",
  "aca.submitting": "Submitting…",
  "aca.passed": "Passed! Certificate #{n}",
  "aca.failed": "Score {s} — not passing yet, try again.",
  "aca.loadError": "Could not load academy",
  "aca.submitError": "Error while submitting",
  "aca.qPassMod": "{n} questions ({k} modules) · pass per module",
  "aca.infoMod": "{n} questions in {k} modules · at least {m} correct per module.",
  "aca.mod.labelK": "Module {i} of {k}",
  "aca.exit": "Leave quiz",
  "aca.progress": "Module {i}/{k} · question {a}/{b}",
  "aca.modDone.pass": "You scored {ok}/{n} — module passed.",
  "aca.modFail.title": "Module {i} not passed yet",
  "aca.modFail.body":
    "You scored {ok} out of {n}. You need at least {m} correct answers to unlock the next module.",
  "aca.modFail.cta": "Retry this module",
  "aca.finalUnlocked": "All modules passed — your certificate is ready.",
  "auth.eyebrow": "Team",
  "auth.signIn": "Sign in",
  "auth.signUp": "Create account",
  "auth.desc": "For staff and administrators of La Ferme only.",
  "auth.google": "Continue with Google",
  "auth.or": "or",
  "auth.fullName": "Full name",
  "auth.email": "Email",
  "auth.password": "Password",
  "auth.doSignUp": "Register",
  "auth.doSignIn": "Sign in",
  "auth.toSignUp": "New team member? Create account",
  "auth.toSignIn": "Already have an account? Sign in",
  "auth.created": "Account created",
  "auth.error": "Something went wrong",
  "auth.googleFail": "Google sign-in failed",
  "auth.back": "← Ferme Maximilien",
  "login.eyebrow": "Visitors",
  "login.title": "Welcome to Maximilien",
  "login.desc": "Sign in or create an account to see your Hooves, badges and loyalty rewards.",
  "login.tab.signin": "Sign in",
  "login.tab.signup": "Create account",
  "login.google": "Continue with Google",
  "login.or": "or",
  "login.fullName": "Full name",
  "login.email": "Email",
  "login.password": "Password",
  "login.doSignIn": "Sign in",
  "login.doSignUp": "Create account",
  "login.created": "Account created — check your inbox.",
  "login.error": "Something went wrong",
  "login.googleFail": "Google sign-in failed",
  "login.back": "← Back to the site",
  "qr.unknownTitle": "Unknown QR",
  "qr.unknownBody": "This QR code doesn't match any animal at the farm.",
  "qr.backHub": "Back to the hub",
  "qr.aiOpens": "The AI guide opens automatically and speaks as {name}.",
  "qr.greeting": "Hello! I'm {name}. Welcome to my paddock. What would you like to know?",
  "cert.official": "Official certificate",
  "cert.confirms": "This certifies that",
  "cert.participant": "Registered participant",
  "cert.completedBody":
    "successfully completed the {name} Academy, demonstrating the required knowledge of welfare, care and natural behaviour of this species.",
  "cert.score": "Score achieved:",
  "cert.issuedOn": "Issued on",
  "cert.certNr": "Certificate no.",
  "cert.nthGraduate": "{ord} graduate",
  "cert.loading": "Loading certificate…",
  "cert.notFound": "Certificate not found.",
  "cert.backBadges": "Back to my badges",
  "cert.print": "Print / PDF",
  "cert.download": "Download",
  "cert.downloading": "Preparing your certificate…",
  "cert.downloadDone": "Certificate downloaded.",
  "cert.downloadFail": "Download failed. Try Print / PDF.",
  "cert.footer": "Certificate #{nr} · You are the {ord} expert to pass the {name} Academy.",
  "shop.badge.bio": "Organic",
  "product.back": "Back",
  "product.breadcrumb.shop": "Farm shop",
  "product.notFound": "This product is no longer available.",
  "product.packaging": "Packaging",
  "product.quantity": "Quantity",
  "product.producer": "Origin",
  "product.distance": "{km} km from your pick-up point",
  "product.impact": "You save {g} g of packaging waste per item.",
  "product.bundle": "Often bought together",
  "product.bundleAdd": "Add bundle",
  "product.ingredients": "Composition",
  "product.storage": "Storage",
  "product.pickup": "Pick-up",
  "product.deposit": "Deposit {amount} — refunded at the counter",
  "cart.added.title": "Added to your basket",
  "cart.crossSell": "Goes well with this",
  "cart.progress.reached": "Great! You get a bag of farm seeds for free.",
  "cart.progress.remaining": "{amount} more for a free bag of farm seeds.",
};

const EXTRA: Record<Lang, Dict> = {
  nl: {
    "aca.retry.title": "Helaas, nog niet geslaagd",
    "aca.retry.body": "Je hebt {s} gehaald. Je hebt minstens {m}/{n} nodig om te slagen.",
    "aca.retry.cta": "Probeer opnieuw",
    "aca.retry.back": "Terug naar alle academies",
    "cert.honours": "Met Onderscheiding · 100%",
    "verify.honours": "Met Onderscheiding (100% score)",
    "auth.inviteOnly": "Beheerdersaccounts worden enkel op uitnodiging aangemaakt.",
    "admin.denied": "Geen toegang tot het beheerpaneel.",
    "cert.seal.auth": "GEAUTHENTICEERD",
    "cert.lang.label": "Taal van het certificaat",
    "cert.side.front": "Voorzijde",
    "cert.side.back": "Achterzijde",
    "cert.back.title": "Curriculum & behaalde competenties / modules",
    "cert.back.intro":
      "Deze houder heeft onderstaande modules doorlopen en met succes afgerond binnen het educatieve programma van Maximilien.",
    "cert.mod1": "Dierenwelzijn, voeding & verzorging",
    "cert.mod1.body": "Basisbehoeften, dagelijkse voeding, drinkwater en gezondheidscontrole.",
    "cert.mod2": "Kuddegedrag & lichaamstaal",
    "cert.mod2.body": "Sociale structuur, stresssignalen en veilige benadering van de dieren.",
    "cert.mod3": "Huisvesting & hygiënestandaarden",
    "cert.mod3.body": "Stalinrichting, strooisel, reiniging en preventie van ziektes.",
    "cert.issue.title": "Fysieke uitreiking",
    "cert.issue.place": "Fysiek uitgereikt te Brussel op",
    "cert.issue.signature": "Handtekening",
    "cert.issue.stamp": "Ruimte voor fysieke inktstempel",
    "cert.partners": "Officiële partners & erkenningen",
    "cert.actions.title": "Deel je resultaat",
    "cert.actions.linkedin": "Voeg toe aan LinkedIn-profiel",
    "cert.actions.youthpass": "Claim Youthpass / Open Badge",
    "cert.pickup.locationLabel": "Onthaal",
    "cert.pickup.location": "Quai du Batelage 2, 1000 Bruxelles",
    "cert.pickup.hoursLabel": "Afhaaluren",
    "cert.pickup.hours": "Di – Zo: 10:00 – 17:00",
    "cert.pickup.email": "Stuur afhaalbon naar mijn e-mail",
    "cert.pickup.emailSent": "We sturen je afhaalbon naar je e-mailadres.",
    "verify.issuer": "Maximilien • Brussel / Bruxelles",
    "verify.pdf": "Bekijk / download originele PDF",
    "verify.backSite": "← Naar Maximilien",
    "cert.actions.badgeDone": "Open Badge (JSON-LD) gedownload.",
    "verify.lookupHint": "Typ het certificaatnummer over om de echtheid te controleren.",
    "verify.lookupLabel": "Certificaatnummer",
    "verify.lookupCta": "Controleer",
    "cert.lang.hint": "Wijzigt enkel dit certificaat en de PDF, niet de website.",
    "cert.actions.pdf": "Download PDF (A4)",
    "cert.actions.share": "Deel link",
    "cert.digital.title": "Digitale uitreiking",
    "cert.digital.place": "Digitaal uitgereikt te Brussel op",
    "cert.digital.stamp": "Digitaal gestempeld",
    "cert.pdfDone": "PDF gedownload.",
  },
  fr: {
    "aca.retry.title": "Dommage, pas encore réussi",
    "aca.retry.body": "Vous avez obtenu {s}. Il faut au moins {m}/{n} pour réussir.",
    "aca.retry.cta": "Réessayer",
    "aca.retry.back": "Retour aux académies",
    "cert.honours": "Avec Distinction · 100%",
    "verify.honours": "Avec distinction (score de 100%)",
    "auth.inviteOnly": "Les comptes d'administration sont créés uniquement sur invitation.",
    "admin.denied": "Accès au panneau d'administration refusé.",
    "cert.seal.auth": "AUTHENTIFIÉ",
    "cert.lang.label": "Langue du certificat",
    "cert.side.front": "Recto",
    "cert.side.back": "Verso",
    "cert.back.title": "Curriculum & compétences acquises / modules",
    "cert.back.intro":
      "Le·la titulaire a suivi et réussi les modules ci-dessous dans le cadre du programme pédagogique de Maximilien.",
    "cert.mod1": "Bien-être animal, alimentation & soins",
    "cert.mod1.body": "Besoins de base, alimentation quotidienne, eau et contrôle de santé.",
    "cert.mod2": "Comportement de troupeau & langage corporel",
    "cert.mod2.body": "Structure sociale, signaux de stress et approche sécurisée des animaux.",
    "cert.mod3": "Hébergement & normes d'hygiène",
    "cert.mod3.body": "Aménagement, litière, nettoyage et prévention des maladies.",
    "cert.issue.title": "Remise physique",
    "cert.issue.place": "Remis physiquement à Bruxelles le",
    "cert.issue.signature": "Signature",
    "cert.issue.stamp": "Espace pour le tampon encreur physique",
    "cert.partners": "Partenaires officiels & accréditations",
    "cert.actions.title": "Partagez votre résultat",
    "cert.actions.linkedin": "Ajouter au profil LinkedIn",
    "cert.actions.youthpass": "Obtenir le Youthpass / Open Badge",
    "cert.pickup.locationLabel": "Accueil",
    "cert.pickup.location": "Quai du Batelage 2, 1000 Bruxelles",
    "cert.pickup.hoursLabel": "Heures de retrait",
    "cert.pickup.hours": "Ma – Di : 10:00 – 17:00",
    "cert.pickup.email": "Envoyer le bon de retrait par e-mail",
    "cert.pickup.emailSent": "Nous envoyons votre bon de retrait par e-mail.",
    "verify.issuer": "Maximilien • Bruxelles / Brussel",
    "verify.pdf": "Voir / télécharger le PDF original",
    "verify.backSite": "← Vers Maximilien",
    "cert.actions.badgeDone": "Open Badge (JSON-LD) téléchargé.",
    "verify.lookupHint": "Saisissez le numéro du certificat pour en vérifier l'authenticité.",
    "verify.lookupLabel": "Numéro de certificat",
    "verify.lookupCta": "Vérifier",
    "cert.lang.hint": "Ne change que ce certificat et le PDF, pas le site.",
    "cert.actions.pdf": "Télécharger le PDF (A4)",
    "cert.actions.share": "Partager le lien",
    "cert.digital.title": "Remise numérique",
    "cert.digital.place": "Délivré numériquement à Bruxelles le",
    "cert.digital.stamp": "Tamponné numériquement",
    "cert.pdfDone": "PDF téléchargé.",
  },
  en: {
    "aca.retry.title": "Not passed yet",
    "aca.retry.body": "You scored {s}. You need at least {m}/{n} to pass.",
    "aca.retry.cta": "Try again",
    "aca.retry.back": "Back to all academies",
    "cert.honours": "With Distinction · 100%",
    "verify.honours": "With distinction (100% score)",
    "auth.inviteOnly": "Admin accounts are created by invitation only.",
    "admin.denied": "No access to the admin panel.",
    "cert.seal.auth": "AUTHENTICATED",
    "cert.lang.label": "Certificate language",
    "cert.side.front": "Front",
    "cert.side.back": "Back",
    "cert.back.title": "Curriculum & acquired competences / modules",
    "cert.back.intro":
      "The holder completed and passed the modules below within the educational programme of Maximilien.",
    "cert.mod1": "Animal welfare, feeding & care",
    "cert.mod1.body": "Basic needs, daily feeding, drinking water and health checks.",
    "cert.mod2": "Herd behaviour & body language",
    "cert.mod2.body": "Social structure, stress signals and safe handling of the animals.",
    "cert.mod3": "Housing & hygiene standards",
    "cert.mod3.body": "Barn layout, bedding, cleaning and disease prevention.",
    "cert.issue.title": "Physical issuance",
    "cert.issue.place": "Physically issued in Brussels on",
    "cert.issue.signature": "Signature",
    "cert.issue.stamp": "Space for the physical ink stamp",
    "cert.partners": "Official partners & accreditations",
    "cert.actions.title": "Share your result",
    "cert.actions.linkedin": "Add to LinkedIn profile",
    "cert.actions.youthpass": "Claim Youthpass / Open Badge",
    "cert.pickup.locationLabel": "Reception",
    "cert.pickup.location": "Quai du Batelage 2, 1000 Bruxelles",
    "cert.pickup.hoursLabel": "Pickup hours",
    "cert.pickup.hours": "Tue – Sun: 10:00 – 17:00",
    "cert.pickup.email": "Send pickup voucher to my e-mail",
    "cert.pickup.emailSent": "We'll send your pickup voucher by e-mail.",
    "verify.issuer": "Maximilien • Brussels / Bruxelles",
    "verify.pdf": "View / download original PDF",
    "verify.backSite": "← To Maximilien",
    "cert.actions.badgeDone": "Open Badge (JSON-LD) downloaded.",
    "verify.lookupHint": "Enter the certificate number to check its authenticity.",
    "verify.lookupLabel": "Certificate number",
    "verify.lookupCta": "Check",
    "cert.lang.hint": "Changes only this certificate and the PDF, not the website.",
    "cert.actions.pdf": "Download PDF (A4)",
    "cert.actions.share": "Share link",
    "cert.digital.title": "Digital issuance",
    "cert.digital.place": "Digitally issued in Brussels on",
    "cert.digital.stamp": "Digitally stamped",
    "cert.pdfDone": "PDF downloaded.",
  },
};

/** Kids-spoor, delen & printbaar werkblad. */
const KIDS: Record<Lang, Dict> = {
  nl: {
    "common.close": "Sluiten",
    "kids.title": "Goed gedaan! 🎉",
    "kids.body":
      "Je hebt alle modules van {name} gehaald: {ok} van {n} juist. Dit diploma blijft op dit toestel — we bewaren niets online.",
    "kids.privacy":
      "Voor kinderen vragen we geen account, geen e-mail en geen achternaam. Je voornaam blijft enkel op dit toestel.",
    "kids.nameLabel": "Voornaam of bijnaam (optioneel)",
    "kids.namePlaceholder": "bv. Sam",
    "kids.diploma": "Junior Dierenverzorger",
    "kids.print": "Print mijn diploma",
    "kids.keep": "Bewaar op dit toestel",
    "kids.again": "Nog een keer spelen",
    "kids.saved": "Diploma bewaard op dit toestel.",
    "share.cta": "Deel je prestatie",
    "share.text": "Ik haalde de {name} Academy van Maximilien!",
    "share.copied": "Link gekopieerd.",
    "share.failed": "Delen lukte niet.",
    "work.print": "Print A4-werkblad",
    "work.title": "Werkblad · Kies je Academy",
    "work.intro":
      "Kruis aan welke Academy je wil doen. Neem dit blad mee naar de boerderij of naar de klas.",
    "work.name": "Naam",
    "work.date": "Datum",
    "work.col.animal": "Dier / Academy",
    "work.col.notes": "Mijn notities",
    "work.footer": "Maximilien · Quai du Batelage 2, 1000 Brussel",
  },
  fr: {
    "common.close": "Fermer",
    "kids.title": "Bravo ! 🎉",
    "kids.body":
      "Tu as réussi tous les modules de {name} : {ok} bonnes réponses sur {n}. Ce diplôme reste sur cet appareil — rien n'est enregistré en ligne.",
    "kids.privacy":
      "Pour les enfants, nous ne demandons ni compte, ni e-mail, ni nom de famille. Ton prénom reste uniquement sur cet appareil.",
    "kids.nameLabel": "Prénom ou surnom (facultatif)",
    "kids.namePlaceholder": "p.ex. Sam",
    "kids.diploma": "Junior Soigneur d'animaux",
    "kids.print": "Imprimer mon diplôme",
    "kids.keep": "Garder sur cet appareil",
    "kids.again": "Rejouer",
    "kids.saved": "Diplôme enregistré sur cet appareil.",
    "share.cta": "Partage ta réussite",
    "share.text": "J'ai réussi l'Académie {name} de Maximilien !",
    "share.copied": "Lien copié.",
    "share.failed": "Le partage a échoué.",
    "work.print": "Imprimer la fiche A4",
    "work.title": "Fiche de travail · Choisis ton Académie",
    "work.intro":
      "Coche l'Académie que tu veux suivre. Emporte cette fiche à la ferme ou en classe.",
    "work.name": "Nom",
    "work.date": "Date",
    "work.col.animal": "Animal / Académie",
    "work.col.notes": "Mes notes",
    "work.footer": "Maximilien · Quai du Batelage 2, 1000 Bruxelles",
  },
  en: {
    "common.close": "Close",
    "kids.title": "Well done! 🎉",
    "kids.body":
      "You passed every module of {name}: {ok} out of {n} correct. This diploma stays on this device — nothing is stored online.",
    "kids.privacy":
      "For children we ask for no account, no e-mail and no surname. Your first name stays on this device only.",
    "kids.nameLabel": "First name or nickname (optional)",
    "kids.namePlaceholder": "e.g. Sam",
    "kids.diploma": "Junior Animal Carer",
    "kids.print": "Print my diploma",
    "kids.keep": "Keep on this device",
    "kids.again": "Play again",
    "kids.saved": "Diploma saved on this device.",
    "share.cta": "Share your achievement",
    "share.text": "I passed the {name} Academy at Maximilien!",
    "share.copied": "Link copied.",
    "share.failed": "Sharing failed.",
    "work.print": "Print A4 worksheet",
    "work.title": "Worksheet · Choose your Academy",
    "work.intro": "Tick the Academy you want to take. Bring this sheet to the farm or to class.",
    "work.name": "Name",
    "work.date": "Date",
    "work.col.animal": "Animal / Academy",
    "work.col.notes": "My notes",
    "work.footer": "Maximilien · Quai du Batelage 2, 1000 Brussels",
  },
};

const DICTS: Record<Lang, Dict> = {
  nl: { ...NL, ...EXTRA.nl, ...KIDS.nl },
  fr: { ...FR, ...EXTRA.fr, ...KIDS.fr },
  en: { ...EN, ...EXTRA.en, ...KIDS.en },
};

/** Vertaalfunctie voor een specifieke taal (bv. het certificaat, los van de site-taal). */
/** Bijgehouden ontbrekende sleutels per taal — voor de diagnosepagina. */
const missingKeys: Record<Lang, Set<string>> = { nl: new Set(), fr: new Set(), en: new Set() };

function resolve(lang: Lang, k: string, extra?: ExtraLang | null): string {
  if (extra) {
    const hit = EXTRA_DICTS[extra]?.[k];
    if (hit !== undefined) return hit;
  }
  const own = DICTS[lang][k];
  if (own !== undefined) return own;
  missingKeys[lang].add(k);
  // Terugval: eerst Nederlands (brontaal), dan Engels, anders een leesbare tekst.
  if (lang !== "nl" && DICTS.nl[k] !== undefined) return DICTS.nl[k]!;
  if (lang !== "en" && DICTS.en[k] !== undefined) return DICTS.en[k]!;
  // Nooit een ruwe sleutel tonen zoals "common.title": maak er leesbare tekst van.
  const last = k.split(".").pop() ?? k;
  return last
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());
}

export function tFor(lang: Lang) {
  return (k: string) => resolve(lang, k);
}

/** Snapshot van ontbrekende publieke-site-sleutels per taal, voor de diagnose-UI. */
export function getMissingI18nKeys(): Record<Lang, string[]> {
  return {
    nl: [...missingKeys.nl].sort(),
    fr: [...missingKeys.fr].sort(),
    en: [...missingKeys.en].sort(),
  };
}

type I18nValue = {
  /** Basistaal van de URL (nl/fr/en). Extra talen gebruiken Engels als basis. */
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: string) => string;
  /** Gekozen extra taal achter het wereldbolletje (of null). */
  extra: ExtraLang | null;
  setExtra: (x: ExtraLang | null) => void;
  /** Kies uit een { nl, fr, en, de?, ar?, … }-object de juiste tekst. */
  pick: <V>(obj: Partial<Record<Lang | ExtraLang, V>> & Record<Lang, V>) => V;
  /** Vertaal een vaste Engelse zin naar de extra taal (anders ongewijzigd). */
  tx: (s: string) => string;
};
const I18nCtx = createContext<I18nValue>({
  lang: "nl",
  setLang: () => {},
  t: (k) => k,
  extra: null,
  setExtra: () => {},
  pick: (o) => o.nl,
  tx: (s) => s,
});
const EXTRA_KEY = "user_extra_language";

/** Bewaarde taalkeuze van de bezoeker. */
const STORAGE_KEY = "user_preferred_language";
/** Oudere sleutel/cookie; blijft geschreven zodat SSR-doorverwijzingen werken. */
const LEGACY_KEY = "ferme.lang";

function isSupported(v: string | null | undefined): v is Lang {
  return v === "nl" || v === "fr" || v === "en";
}

/** Taal uit het URL-voorvoegsel (/en, /nl, /fr) — die heeft altijd voorrang. */
function langFromPath(pathname: string): Lang | null {
  const seg = pathname.split("/").filter(Boolean)[0]?.toLowerCase();
  return isSupported(seg) ? seg : null;
}

/** Houdt <html lang>, content-language en og:locale gelijk aan de actieve taal. */
function syncDocumentLanguage(l: Lang, extra?: ExtraLang | null) {
  if (typeof document === "undefined") return;
  const meta = extra ? EXTRA_LANGS.find((x) => x.code === extra) : null;
  document.documentElement.lang = meta ? meta.htmlLang : l;
  document.documentElement.dir = meta?.dir ?? "ltr";
  const set = (selector: string, attr: "content", value: string, create: () => HTMLMetaElement) => {
    let el = document.head.querySelector<HTMLMetaElement>(selector);
    if (!el) {
      el = create();
      document.head.appendChild(el);
    }
    el.setAttribute(attr, value);
  };
  set('meta[http-equiv="content-language"]', "content", l, () => {
    const m = document.createElement("meta");
    m.setAttribute("http-equiv", "content-language");
    return m;
  });
  set('meta[property="og:locale"]', "content", localeFor(l).replace("-", "_"), () => {
    const m = document.createElement("meta");
    m.setAttribute("property", "og:locale");
    return m;
  });
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("nl");
  const [extra, setExtraState] = useState<ExtraLang | null>(null);

  useEffect(() => {
    try {
      // ?taal=de laat een (nog niet vrijgegeven) taal voorvertonen.
      const q = new URLSearchParams(window.location.search).get("taal");
      const saved = q ?? localStorage.getItem(EXTRA_KEY);
      if (isExtraLang(saved) && langFromPath(window.location.pathname) === "en") {
        setExtraState(saved);
        if (q) localStorage.setItem(EXTRA_KEY, q);
      }
    } catch {
      /* noop */
    }
  }, []);

  const setExtra = (x: ExtraLang | null) => {
    setExtraState(x);
    try {
      if (x) localStorage.setItem(EXTRA_KEY, x);
      else localStorage.removeItem(EXTRA_KEY);
      document.cookie = `user_extra_lang=${x ?? ""}; path=/; max-age=${x ? 31536000 : 0}; samesite=lax`;
    } catch {
      /* noop */
    }
  };

  useEffect(() => {
    try {
      // 1. URL-voorvoegsel is bepalend.
      const fromUrl = langFromPath(window.location.pathname);
      if (fromUrl) {
        setLangState(fromUrl);
        localStorage.setItem(STORAGE_KEY, fromUrl);
        return;
      }
      // 2. Bewaarde keuze (met migratie van de oude sleutel).
      const saved = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_KEY);
      if (isSupported(saved)) {
        setLangState(saved);
        localStorage.setItem(STORAGE_KEY, saved);
        return;
      }
      // 3. Taal van de browser.
      const nav = (navigator.language || "nl").slice(0, 2).toLowerCase();
      if (nav === "fr" || nav === "en") setLangState(nav);
    } catch {
      /* noop */
    }
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    // Een andere basistaal (behalve Engels als drager) zet de extra taal uit.
    if (l !== "en") setExtra(null);
    try {
      localStorage.setItem(STORAGE_KEY, l);
      localStorage.setItem(LEGACY_KEY, l);
      // Cookie zodat de server (SSR / doorverwijzing vanaf "/") dezelfde taal kiest.
      document.cookie = `${LEGACY_KEY}=${l}; path=/; max-age=31536000; samesite=lax`;
      // Lichte cookie voor eventuele externe/edge-consumers.
      document.cookie = `user_lang=${l}; path=/; max-age=31536000; samesite=lax`;
      syncDocumentLanguage(l);
    } catch {
      /* noop */
    }
  };

  useEffect(() => {
    try {
      syncDocumentLanguage(lang, extra);
    } catch {
      /* noop */
    }
  }, [lang, extra]);

  const t = (k: string) => resolve(lang, k, extra);
  const pick: I18nValue["pick"] = (obj) => (extra && obj[extra] !== undefined ? obj[extra]! : obj[lang]);
  const tx = (s: string) => (lang === "en" ? translatePhrase(extra, s) : s);
  return (
    <I18nCtx.Provider value={{ lang, setLang, t, extra, setExtra, pick, tx }}>{children}</I18nCtx.Provider>
  );
}

export function useT() {
  return useContext(I18nCtx);
}

export function formatT(str: string, vars: Record<string, string | number>): string {
  return str.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

export function localeFor(lang: Lang | ExtraLang): string {
  const x = EXTRA_LANGS.find((e) => e.code === lang);
  if (x) return x.locale;
  return lang === "fr" ? "fr-BE" : lang === "en" ? "en-GB" : "nl-BE";
}

export function LanguageSwitcher({ className = "inline-flex" }: { className?: string }) {
  const { lang, setLang, extra, setExtra } = useT();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // Zoekparameters en anker blijven behouden (winkelmandje, filters, stappen).
  const searchStr = useRouterState({ select: (s) => s.location.searchStr });
  const hash = useRouterState({ select: (s) => s.location.hash });
  const codes: Lang[] = ["nl", "fr", "en"];

  const switchTo = (c: Lang, keepExtra = false) => {
    setLang(c);
    if (!keepExtra) setExtra(null);
    const first = pathname.split("/").filter(Boolean)[0];
    if (first !== "nl" && first !== "fr" && first !== "en") return;
    const suffix = `${searchStr && searchStr !== "?" ? (searchStr.startsWith("?") ? searchStr : `?${searchStr}`) : ""}${hash ? (hash.startsWith("#") ? hash : `#${hash}`) : ""}`;
    navigate({ to: `${translatePath(pathname, c)}${suffix}` as never, replace: true });
  };

  return (
    <div
      className={
        "items-center gap-1 rounded-full border border-border bg-muted/50 p-1 " + className
      }
      role="group"
      aria-label="Language"
    >
      {codes.map((c) => {
        const active = c === lang && !extra;
        return (
          <button
            key={c}
            type="button"
            onClick={(e) => {
              // Voorkomt dat het mobiele menu meteen dichtklapt.
              e.stopPropagation();
              switchTo(c);
            }}
            aria-pressed={active}
            className={
              // Op kleine schermen extra compact zodat de hele kopbalk past.
              "uppercase tracking-[0.08em] transition-colors " +
              (active
                ? "rounded-full bg-primary px-2 py-1 text-[11px] font-bold text-primary-foreground shadow-sm sm:px-2.5 sm:text-xs"
                : "rounded-full px-1.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground sm:px-2 sm:text-xs")
            }

          >
            {c}
          </button>
        );
      })}
      <MoreLanguages
        extra={extra}
        onPick={(x) => {
          setExtra(x);
          switchTo("en", true);
        }}
      />
    </div>
  );
}

/** Wereldbolletje met alle extra talen; onafgewerkte talen zijn zichtbaar maar uitgeschakeld. */
function MoreLanguages({
  extra,
  onPick,
}: {
  extra: ExtraLang | null;
  onPick: (x: ExtraLang) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const list = visibleExtraLangs(extra);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);
  const active = list.find((x) => x.code === extra);
  const comingSoon = langComingSoonLabel();
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="More languages · Plus de langues · Meer talen"
        title="More languages · Plus de langues · Meer talen"
        className={
          "inline-flex items-center gap-1 rounded-full px-1.5 py-1 text-[11px] font-medium transition-colors sm:px-2 sm:text-xs " +
          (active
            ? "bg-primary font-bold text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground")
        }
      >
        <Globe className="size-3.5" aria-hidden="true" />
        {active ? <span className="uppercase">{active.short}</span> : null}
      </button>
      {open ? (
        <ul
          role="listbox"
          className="fixed inset-x-4 top-32 z-50 grid max-h-[calc(100dvh-9rem)] grid-cols-2 overflow-auto overscroll-contain rounded-2xl border border-border bg-background p-1.5 text-foreground shadow-2xl md:absolute md:inset-x-auto md:end-0 md:top-full md:mt-2 md:max-h-80 md:w-56 md:grid-cols-1 md:bg-popover md:text-popover-foreground"
        >
          {list.map((x) => (
            <li key={x.code}>
              <button
                type="button"
                role="option"
                aria-selected={x.code === extra}
                aria-disabled={!x.ready}
                disabled={!x.ready}
                lang={x.htmlLang}
                dir={x.dir}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  onPick(x.code);
                }}
                className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-start text-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:bg-transparent"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{x.native}</span>
                  <span className="block truncate text-xs text-muted-foreground" dir="ltr">
                    {x.english}
                  </span>
                </span>
                {x.ready ? (
                  x.code === extra ? <Check className="size-4 shrink-0 text-primary" /> : null
                ) : (
                  <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground" dir="ltr">
                    {comingSoon}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function langComingSoonLabel(): string {
  if (typeof document === "undefined") return "Coming soon";
  const lang = document.documentElement.lang.toLowerCase();
  if (lang.startsWith("nl")) return "Binnenkort";
  if (lang.startsWith("fr")) return "Bientôt";
  if (lang.startsWith("de")) return "Demnächst";
  return "Coming soon";
}
