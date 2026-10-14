import type { Row } from "@/lib/db-types";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { z } from "zod";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { NavHeader } from "@/components/NavHeader";
import { GoogleWalletButton } from "@/components/wallet/GoogleWalletButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/PasswordInput";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useAuth, initials, firstName, combineName, splitName } from "@/lib/auth";
import { LocalLink } from "@/components/LocalLink";
import { pathFor } from "@/lib/routes-i18n";
import { useT, type Lang } from "@/lib/i18n";
import { notifyWelcome as notifyWelcomeMail } from "@/lib/auth-email.functions";
import { ThemeSwitcher } from "@/lib/theme";
import { listMyOrders, updateMyProfile, updateMyNotificationPref } from "@/lib/account.functions";
import { listMyCertificaten, listAcademies } from "@/lib/academy.functions";
import { neonSupabaseCompat as supabase } from "@/lib/neon-auth-compat";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { SecuritySettings } from "@/components/account/SecuritySettings";
import { PublicProfileCard } from "@/components/account/PublicProfileCard";
import { getMyProfileSettings } from "@/lib/public-profile.functions";
import { HoefjesPad } from "@/components/HoefjesPad";
import { EmailField } from "@/components/account/EmailField";
import { lovable } from "@/integrations/lovable/index";
import { stashRedirect } from "@/lib/redirect";
import {
  Loader2,
  Ticket,
  ShoppingBag,
  GraduationCap,
  Settings,
  CheckCircle2,
  AlertCircle,
  Fingerprint,
  Lock,
  ShieldCheck,
} from "lucide-react";

export const searchSchema = z.object({
  tab: z.enum(["badges", "hoefjes", "bestellingen", "instellingen"]).optional(),
});

type Copy = (typeof COPY)["nl"];

const COPY: Record<
  Lang,
  {
    myAccount: string;
    hello: (name: string) => string;
    tabBadges: string;
    tabHoefjes: string;
    tabOrders: string;
    tabSettings: string;
    loyaltyCard: string;
    welcome: string;
    savedHoefjes: string;
    moreToGo: (n: number) => string;
    scanAtCheckout: string;
    viewBadges: string;
    ordersLoadError: string;
    noOrdersYet: string;
    toShop: string;
    pickup: (d: string) => string;
    pickupQrTitle: string;
    pickupQrHelp: string;
    invoiceDownload: string;
    invoicePending: string;
    product: string;
    myBadges: string;
    achieved: (a: number, b: number) => string;
    score: (n: number) => string;
    locked: string;
    noCoursesYet: string;
    personalData: string;
    nameLabel: string;
    firstNameLabel: string;
    lastNameLabel: string;
    firstNameRequired: string;
    lastNameRequired: string;
    emailLabel: string;
    contactPickup: string;
    contactHint: string;
    phoneLabel: string;
    streetLabel: string;
    postalLabel: string;
    cityLabel: string;
    commsPrefs: string;
    notifyOrdersLabel: string;
    notifyOrdersHint: string;
    notifyAcademyLabel: string;
    notifyAcademyHint: string;
    notifyNewsletterLabel: string;
    notifyNewsletterHint: string;
    display: string;
    theme: string;
    themeHint: string;
    save: string;
    saveSuccess: string;
    saveError: string;
    loginSecurity: string;
    googleAccount: string;
    googleLinked: string;
    googleNotLinked: string;
    linked: string;
    link: string;
    linkFailed: string;
    passkeyBiometrics: string;
    passkeySupported: string;
    passkeyNotSupported: string;
    soon: string;
    changePassword: string;
    changePasswordHint: string;
    currentPassword: string;
    newPassword: string;
    repeatNewPassword: string;
    passwordChanged: string;
    passwordChangedToast: string;
    currentPasswordWrong: string;
    currentPasswordWrongStatus: string;
    noEmailFound: string;
    genericError: string;
    updatePassword: string;
    errRequiredCurrent: string;
    errMinLength: string;
    errMaxLength: string;
    errLower: string;
    errUpper: string;
    errDigit: string;
    errRequiredConfirm: string;
    errMismatch: string;
    errSameAsCurrent: string;
  }
> = {
  nl: {
    myAccount: "Mijn account",
    hello: (name) => `Hallo, ${name}`,
    tabBadges: "Badges",
    tabHoefjes: "Mijn Hooi",
    tabOrders: "Bestellingen",
    tabSettings: "Instellingen",
    loyaltyCard: "Digitale klantenkaart",
    welcome: "Welkom!",
    savedHoefjes: "gespaarde Hoefjes",
    moreToGo: (n) => `Nog ${n} Hoefjes tot je volgende beloning.`,
    scanAtCheckout: "Scan aan de kassa",
    viewBadges: "Bekijk je badges & spaarpad",
    ordersLoadError: "Bestellingen konden niet geladen worden.",
    noOrdersYet: "Je hebt nog geen bestellingen geplaatst.",
    toShop: "Naar de hoevewinkel",
    pickup: (d) => `Afhaling: ${d}`,
    pickupQrTitle: "Afhaalcode",
    pickupQrHelp: "Toon deze code aan een medewerker aan de balie — die scant ze met de teamscanner.",
    invoiceDownload: "Factuur downloaden (PDF)",
    invoicePending: "Factuur volgt na betaling",
    product: "Product",
    myBadges: "Mijn badges",
    achieved: (a, b) => `${a} / ${b} behaald`,
    score: (n) => `Score ${n}`,
    locked: "Vergrendeld",
    noCoursesYet:
      "Je hebt nog geen cursussen afgerond. Start een academy en verdien je eerste badge.",
    personalData: "Persoonlijke gegevens",
    nameLabel: "Naam",
    firstNameLabel: "Voornaam",
    lastNameLabel: "Achternaam",
    firstNameRequired: "Vul je voornaam in.",
    lastNameRequired: "Vul je achternaam in.",
    emailLabel: "E-mailadres",
    contactPickup: "Contact & afhaalgegevens",
    contactHint:
      "We gebruiken je telefoonnummer enkel om je te verwittigen wanneer je Click & Collect bestelling klaarstaat.",
    phoneLabel: "Telefoonnummer",
    streetLabel: "Straat en nummer (optioneel)",
    postalLabel: "Postcode",
    cityLabel: "Gemeente",
    commsPrefs: "Communicatievoorkeuren",
    notifyOrdersLabel: "E-mailnotificaties bij bestellingen",
    notifyOrdersHint: "Bevestiging en bericht wanneer je bestelling klaarstaat.",
    notifyAcademyLabel: "Herinneringen voor Academy workshops",
    notifyAcademyHint: "Een seintje vlak voor je workshop of animatie start.",
    notifyNewsletterLabel: "Nieuwsbrief",
    notifyNewsletterHint: "Nieuws van de boerderij, seizoensproducten en activiteiten.",
    display: "Weergave",
    theme: "Thema",
    themeHint: "Licht, donker of volg de instelling van je toestel.",
    save: "Opslaan",
    saveSuccess: "Je gegevens zijn bijgewerkt.",
    saveError: "Opslaan mislukt. Probeer opnieuw.",
    loginSecurity: "Inloggen & beveiliging",
    googleAccount: "Google account",
    googleLinked: "Gekoppeld — je kan inloggen met Google.",
    googleNotLinked: "Koppel je Google account om sneller in te loggen.",
    linked: "Gekoppeld",
    link: "Koppelen",
    linkFailed: "Koppelen mislukt. Probeer opnieuw.",
    passkeyBiometrics: "Passkey / biometrie",
    passkeySupported:
      "Dit toestel ondersteunt passkeys. Inloggen met vingerafdruk of gezichtsherkenning komt binnenkort.",
    passkeyNotSupported: "Dit toestel ondersteunt (nog) geen passkeys.",
    soon: "Binnenkort",
    changePassword: "Wachtwoord wijzigen",
    changePasswordHint: "Minstens 8 tekens, met een hoofdletter, een kleine letter en een cijfer.",
    currentPassword: "Huidig wachtwoord",
    newPassword: "Nieuw wachtwoord",
    repeatNewPassword: "Herhaal nieuw wachtwoord",
    passwordChanged: "Je wachtwoord is gewijzigd.",
    passwordChangedToast: "Wachtwoord gewijzigd.",
    currentPasswordWrong: "Huidig wachtwoord klopt niet.",
    currentPasswordWrongStatus: "Je huidige wachtwoord is onjuist.",
    noEmailFound: "Geen e-mailadres gevonden voor dit account.",
    genericError: "Er ging iets mis. Probeer het opnieuw.",
    updatePassword: "Wachtwoord bijwerken",
    errRequiredCurrent: "Vul je huidige wachtwoord in.",
    errMinLength: "Minstens 8 tekens.",
    errMaxLength: "Maximaal 72 tekens.",
    errLower: "Gebruik minstens één kleine letter.",
    errUpper: "Gebruik minstens één hoofdletter.",
    errDigit: "Gebruik minstens één cijfer.",
    errRequiredConfirm: "Herhaal je nieuwe wachtwoord.",
    errMismatch: "De wachtwoorden komen niet overeen.",
    errSameAsCurrent: "Kies een ander wachtwoord dan je huidige.",
  },
  fr: {
    myAccount: "Mon compte",
    hello: (name) => `Bonjour, ${name}`,
    tabBadges: "Badges",
    tabHoefjes: "Mes Sabots",
    tabOrders: "Commandes",
    tabSettings: "Paramètres",
    loyaltyCard: "Carte de fidélité numérique",
    welcome: "Bienvenue !",
    savedHoefjes: "Sabots épargnés",
    moreToGo: (n) => `Plus que ${n} Sabots avant votre prochaine récompense.`,
    scanAtCheckout: "Scannez à la caisse",
    viewBadges: "Voir vos badges & votre parcours",
    ordersLoadError: "Impossible de charger les commandes.",
    noOrdersYet: "Vous n'avez pas encore passé de commande.",
    toShop: "Vers la boutique de la ferme",
    pickup: (d) => `Retrait : ${d}`,
    pickupQrTitle: "Code de retrait",
    pickupQrHelp: "Montrez ce code à un membre de l'équipe au comptoir — il le scanne avec le scanner de l'équipe.",
    invoiceDownload: "Télécharger la facture (PDF)",
    invoicePending: "Facture disponible après paiement",
    product: "Produit",
    myBadges: "Mes badges",
    achieved: (a, b) => `${a} / ${b} obtenus`,
    score: (n) => `Score ${n}`,
    locked: "Verrouillé",
    noCoursesYet:
      "Vous n'avez pas encore terminé de cours. Lancez une academy et gagnez votre premier badge.",
    personalData: "Données personnelles",
    nameLabel: "Nom",
    firstNameLabel: "Prénom",
    lastNameLabel: "Nom de famille",
    firstNameRequired: "Indiquez votre prénom.",
    lastNameRequired: "Indiquez votre nom de famille.",
    emailLabel: "Adresse e-mail",
    contactPickup: "Contact & informations de retrait",
    contactHint:
      "Nous utilisons votre numéro de téléphone uniquement pour vous avertir lorsque votre commande Click & Collect est prête.",
    phoneLabel: "Numéro de téléphone",
    streetLabel: "Rue et numéro (facultatif)",
    postalLabel: "Code postal",
    cityLabel: "Commune",
    commsPrefs: "Préférences de communication",
    notifyOrdersLabel: "Notifications e-mail pour les commandes",
    notifyOrdersHint: "Confirmation et message lorsque votre commande est prête.",
    notifyAcademyLabel: "Rappels pour les ateliers Academy",
    notifyAcademyHint: "Un rappel juste avant le début de votre atelier ou animation.",
    notifyNewsletterLabel: "Newsletter",
    notifyNewsletterHint: "Actualités de la ferme, produits de saison et activités.",
    display: "Affichage",
    theme: "Thème",
    themeHint: "Clair, sombre ou selon les réglages de votre appareil.",
    save: "Enregistrer",
    saveSuccess: "Vos informations ont été mises à jour.",
    saveError: "Échec de l'enregistrement. Réessayez.",
    loginSecurity: "Connexion & sécurité",
    googleAccount: "Compte Google",
    googleLinked: "Lié — vous pouvez vous connecter avec Google.",
    googleNotLinked: "Liez votre compte Google pour vous connecter plus rapidement.",
    linked: "Lié",
    link: "Lier",
    linkFailed: "Échec de la liaison. Réessayez.",
    passkeyBiometrics: "Clé d'accès / biométrie",
    passkeySupported:
      "Cet appareil prend en charge les clés d'accès. La connexion par empreinte digitale ou reconnaissance faciale arrive bientôt.",
    passkeyNotSupported: "Cet appareil ne prend pas (encore) en charge les clés d'accès.",
    soon: "Bientôt",
    changePassword: "Changer le mot de passe",
    changePasswordHint: "Au moins 8 caractères, avec une majuscule, une minuscule et un chiffre.",
    currentPassword: "Mot de passe actuel",
    newPassword: "Nouveau mot de passe",
    repeatNewPassword: "Répétez le nouveau mot de passe",
    passwordChanged: "Votre mot de passe a été modifié.",
    passwordChangedToast: "Mot de passe modifié.",
    currentPasswordWrong: "Le mot de passe actuel est incorrect.",
    currentPasswordWrongStatus: "Votre mot de passe actuel est incorrect.",
    noEmailFound: "Aucune adresse e-mail trouvée pour ce compte.",
    genericError: "Une erreur s'est produite. Réessayez.",
    updatePassword: "Mettre à jour le mot de passe",
    errRequiredCurrent: "Saisissez votre mot de passe actuel.",
    errMinLength: "Au moins 8 caractères.",
    errMaxLength: "72 caractères maximum.",
    errLower: "Utilisez au moins une minuscule.",
    errUpper: "Utilisez au moins une majuscule.",
    errDigit: "Utilisez au moins un chiffre.",
    errRequiredConfirm: "Répétez votre nouveau mot de passe.",
    errMismatch: "Les mots de passe ne correspondent pas.",
    errSameAsCurrent: "Choisissez un mot de passe différent de l'actuel.",
  },
  en: {
    myAccount: "My account",
    hello: (name) => `Hello, ${name}`,
    tabBadges: "Badges",
    tabHoefjes: "My Hooves",
    tabOrders: "Orders",
    tabSettings: "Settings",
    loyaltyCard: "Digital loyalty card",
    welcome: "Welcome!",
    savedHoefjes: "Hooves saved",
    moreToGo: (n) => `${n} more Hooves until your next reward.`,
    scanAtCheckout: "Scan at checkout",
    viewBadges: "View your badges & savings path",
    ordersLoadError: "Orders could not be loaded.",
    noOrdersYet: "You haven't placed any orders yet.",
    toShop: "To the farm shop",
    pickup: (d) => `Pickup: ${d}`,
    pickupQrTitle: "Pickup code",
    pickupQrHelp: "Show this code to a staff member at the counter — they scan it with the team scanner.",
    invoiceDownload: "Download invoice (PDF)",
    invoicePending: "Invoice available after payment",
    product: "Product",
    myBadges: "My badges",
    achieved: (a, b) => `${a} / ${b} achieved`,
    score: (n) => `Score ${n}`,
    locked: "Locked",
    noCoursesYet:
      "You haven't completed any courses yet. Start an academy and earn your first badge.",
    personalData: "Personal details",
    nameLabel: "Name",
    firstNameLabel: "First name",
    lastNameLabel: "Last name",
    firstNameRequired: "Enter your first name.",
    lastNameRequired: "Enter your last name.",
    emailLabel: "Email address",
    contactPickup: "Contact & pickup details",
    contactHint:
      "We only use your phone number to notify you when your Click & Collect order is ready.",
    phoneLabel: "Phone number",
    streetLabel: "Street and number (optional)",
    postalLabel: "Postal code",
    cityLabel: "City",
    commsPrefs: "Communication preferences",
    notifyOrdersLabel: "Email notifications for orders",
    notifyOrdersHint: "Confirmation and message when your order is ready.",
    notifyAcademyLabel: "Reminders for Academy workshops",
    notifyAcademyHint: "A heads-up right before your workshop or activity starts.",
    notifyNewsletterLabel: "Newsletter",
    notifyNewsletterHint: "News from the farm, seasonal products and activities.",
    display: "Display",
    theme: "Theme",
    themeHint: "Light, dark, or follow your device setting.",
    save: "Save",
    saveSuccess: "Your details have been updated.",
    saveError: "Saving failed. Please try again.",
    loginSecurity: "Login & security",
    googleAccount: "Google account",
    googleLinked: "Linked — you can sign in with Google.",
    googleNotLinked: "Link your Google account to sign in faster.",
    linked: "Linked",
    link: "Link",
    linkFailed: "Linking failed. Please try again.",
    passkeyBiometrics: "Passkey / biometrics",
    passkeySupported:
      "This device supports passkeys. Signing in with fingerprint or face recognition is coming soon.",
    passkeyNotSupported: "This device doesn't support passkeys (yet).",
    soon: "Coming soon",
    changePassword: "Change password",
    changePasswordHint:
      "At least 8 characters, with an uppercase letter, a lowercase letter and a number.",
    currentPassword: "Current password",
    newPassword: "New password",
    repeatNewPassword: "Repeat new password",
    passwordChanged: "Your password has been changed.",
    passwordChangedToast: "Password changed.",
    currentPasswordWrong: "Current password is incorrect.",
    currentPasswordWrongStatus: "Your current password is incorrect.",
    noEmailFound: "No email address found for this account.",
    genericError: "Something went wrong. Please try again.",
    updatePassword: "Update password",
    errRequiredCurrent: "Enter your current password.",
    errMinLength: "At least 8 characters.",
    errMaxLength: "72 characters maximum.",
    errLower: "Use at least one lowercase letter.",
    errUpper: "Use at least one uppercase letter.",
    errDigit: "Use at least one number.",
    errRequiredConfirm: "Repeat your new password.",
    errMismatch: "The passwords do not match.",
    errSameAsCurrent: "Choose a different password than your current one.",
  },
};

function localeForLang(lang: Lang) {
  return lang === "fr" ? "fr-BE" : lang === "en" ? "en-GB" : "nl-BE";
}

function euro(cents: number) {
  return (cents / 100).toLocaleString("nl-BE", { style: "currency", currency: "EUR" });
}

export function AccountPage() {
  const { isLoggedIn, loading, user, refresh } = useAuth();
  const notifyWelcome = useServerFn(notifyWelcomeMail);
  const { lang } = useT();
  const c = COPY[lang];
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as z.infer<typeof searchSchema>;
  const tab = !search.tab || search.tab === "badges" ? "hoefjes" : search.tab;
  const getProfileFn = useServerFn(getMyProfileSettings);

  // Oude link ?tab=badges → badges staan nu op het openbare profiel.
  useEffect(() => {
    if (loading || !isLoggedIn || search.tab !== "badges") return;
    void getProfileFn()
      .then((p) => {
        if (p?.public_id) window.location.replace(`/${lang}/u/${p.public_id}`);
      })
      .catch(() => undefined);
  }, [loading, isLoggedIn, search.tab, lang, getProfileFn]);


  useEffect(() => {
    if (!loading && !isLoggedIn) {
      stashRedirect(pathFor("account", lang));
      navigate({ to: pathFor("login", lang) as never, replace: true });
    }
  }, [loading, isLoggedIn, navigate]);

  // Welkomstmail (sjabloon 5): de server verstuurt die maximaal één keer per account.
  useEffect(() => {
    if (loading || !isLoggedIn) return;
    void notifyWelcome({ data: { lang } }).catch(() => undefined);
  }, [loading, isLoggedIn, lang, notifyWelcome]);


  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[color:var(--surface-page)]">
        <NavHeader />
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[color:var(--surface-page)]">
      <NavHeader />
      <main className="mx-auto max-w-4xl px-4 py-10 md:py-14">
        <header className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[color:var(--color-terracotta)] text-lg font-semibold text-white">
            {initials(user.name, user.email)}
          </div>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.25em] text-primary">{c.myAccount}</p>
            <h1 className="truncate font-serif text-3xl italic tracking-tight text-[color:var(--color-terracotta)] md:text-4xl">
              {c.hello(firstName(user.name, user.email))}
            </h1>

            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
        </header>

        <Tabs
          value={tab}
          onValueChange={(v) =>
            navigate({
              to: pathFor("account", lang) as never,
              search: { tab: v as typeof tab } as never,
              replace: true,
            })
          }
          className="mt-8"
        >
          <TabsList className="grid h-auto w-full grid-cols-3 gap-1 rounded-2xl bg-card p-1">
            <TabsTrigger value="hoefjes" className="min-h-[44px] rounded-xl text-xs sm:text-sm">
              <Ticket className="mr-1.5 h-4 w-4 shrink-0" /> {c.tabHoefjes}
            </TabsTrigger>
            <TabsTrigger
              value="bestellingen"
              className="min-h-[44px] rounded-xl text-xs sm:text-sm"
            >
              <ShoppingBag className="mr-1.5 h-4 w-4 shrink-0" /> {c.tabOrders}
            </TabsTrigger>
            <TabsTrigger
              value="instellingen"
              className="min-h-[44px] rounded-xl text-xs sm:text-sm"
            >
              <Settings className="mr-1.5 h-4 w-4 shrink-0" /> {c.tabSettings}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="hoefjes" className="mt-6">
            <HoefjesTab
              userId={user.id}
              hoefjes={user.hoefjes}
              name={user.name ?? user.email}
              c={c}
              lang={lang}
            />
          </TabsContent>
          <TabsContent value="bestellingen" className="mt-6">
            <OrdersTab c={c} lang={lang} />
          </TabsContent>
          <TabsContent value="instellingen" className="mt-6">
            <SettingsTab
              userId={user.id}
              name={user.name}
              email={user.email}
              onSaved={refresh}
              c={c}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[1.75rem] border border-border bg-card p-6 shadow-sm md:p-8">
      {children}
    </div>
  );
}

function HoefjesTab({
  userId,
  hoefjes,
  name,
  c,
  lang,
}: {
  userId: string;
  hoefjes: number;
  name: string | null;
  c: Copy;
  lang: Lang;
}) {
  const doel = 12;
  const pct = Math.min(100, Math.round((hoefjes / doel) * 100));
  return (
    <div className="space-y-6">
      <Card>
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.25em] text-primary">{c.loyaltyCard}</p>
            <h2 className="mt-2 truncate font-serif text-3xl italic text-[color:var(--ink-forest)]">
              {name ?? c.welcome}
            </h2>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="font-mono text-4xl text-[color:var(--color-terracotta)]">
                {hoefjes}
              </span>
              <span className="text-sm text-muted-foreground">{c.savedHoefjes}</span>
            </div>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[color:var(--surface-page)]">
              <div
                className="h-full rounded-full bg-[color:var(--color-terracotta)] transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {c.moreToGo(Math.max(0, doel - hoefjes))}
            </p>
          </div>
          <div className="flex flex-col items-center gap-2 justify-self-center rounded-2xl border border-border bg-[color:var(--surface-page)] p-4">
            <QRCodeSVG value={`fermemaximilien:customer:${userId}`} size={116} />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {c.scanAtCheckout}
            </span>
          </div>
        </div>
      </Card>
      <GoogleWalletButton
        memberId={userId}
        memberName={name ?? "Lid"}
        hooiBalance={hoefjes}
        locale={lang as "nl" | "fr" | "en"}
      />
      <Card>
        <HoefjesPad collected={hoefjes} total={doel} />
      </Card>
    </div>
  );
}

const PASS_LABEL: Record<Lang, string> = {
  nl: "Afhaalpas (PDF)",
  fr: "Pass de retrait (PDF)",
  en: "Pickup pass (PDF)",
};

/** Groene "Betaald"- en amber "Te betalen bij afhaling"-badge. */
function orderStatusBadge(status: string, lang: Lang): { label: string; className: string } {
  const copy: Record<string, Record<Lang, string>> = {
    paid: { nl: "Betaald", fr: "Payé", en: "Paid" },
    collected: { nl: "Afgehaald", fr: "Retiré", en: "Collected" },
    pending_pickup: {
      nl: "Te betalen bij afhaling",
      fr: "À payer au retrait",
      en: "Pay on pickup",
    },
    pending: { nl: "In afwachting", fr: "En attente", en: "Pending" },
    cancelled: { nl: "Geannuleerd", fr: "Annulé", en: "Cancelled" },
  };
  const green = "bg-emerald-100 text-emerald-800";
  const amber = "bg-amber-100 text-amber-900";
  const neutral = "bg-[color:var(--surface-page)] text-foreground";
  const className =
    status === "paid" || status === "collected"
      ? green
      : status === "pending_pickup"
        ? amber
        : neutral;
  return { label: copy[status]?.[lang] ?? status, className };
}

function OrdersTab({ c, lang }: { c: Copy; lang: Lang }) {
  const fn = useServerFn(listMyOrders);
  const { data, isLoading, error } = useQuery({ queryKey: ["my-orders"], queryFn: () => fn() });

  if (isLoading)
    return (
      <Card>
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </Card>
    );
  if (error)
    return (
      <Card>
        <p className="text-sm text-muted-foreground">{c.ordersLoadError}</p>
      </Card>
    );
  if (!data || data.length === 0)
    return (
      <Card>
        <p className="text-sm text-muted-foreground">{c.noOrdersYet}</p>
        <LocalLink
          to={pathFor("shop", lang)}
          className="mt-4 inline-flex min-h-[48px] items-center rounded-full bg-[color:var(--color-terracotta)] px-6 text-sm font-medium text-white"
        >
          {c.toShop}
        </LocalLink>
      </Card>
    );

  return (
    <div className="space-y-4">
      {data.map((o) => (
        <Card key={o.id}>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {o.order_reference ?? o.structured_communication}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {c.pickup(new Date(o.pickup_slot).toLocaleString(localeForLang(lang)))}
              </p>
              <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                {(o.order_items ?? []).map((it: Row) => (
                  <li key={it.id} className="truncate">
                    {it.quantity}× {it.products?.title ?? c.product} —{" "}
                    {euro(it.price_at_purchase_cents * it.quantity)}
                  </li>
                ))}
              </ul>
              {o.pickup_qr_url && (
                <div className="mt-4 flex flex-col items-center gap-3 rounded-2xl border border-border bg-[color:var(--surface-page)] p-4 sm:flex-row sm:items-center sm:text-left">
                  <div className="rounded-xl bg-white p-2">
                    <QRCodeSVG value={String(o.pickup_qr_url)} size={104} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                      {c.pickupQrTitle}
                    </p>
                    {o.pickup_code ? (
                      <p className="mt-1 font-mono text-2xl font-bold tracking-[0.3em] text-foreground">
                        {String(o.pickup_code)}
                      </p>
                    ) : null}
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {c.pickupQrHelp}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="shrink-0 text-right">
              <p className="font-mono text-lg">{euro(o.total_price_cents)}</p>
              {(() => {
                const s = orderStatusBadge(o.payment_status, lang);
                return (
                  <span
                    className={`mt-1 inline-block rounded-full px-3 py-1 text-[11px] uppercase tracking-wider ${s.className}`}
                  >
                    {s.label}
                  </span>
                );
              })()}
              {o.pickup_pass_url && (
                <a
                  href={String(o.pickup_pass_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 block text-xs font-medium text-[color:var(--color-forest)] underline underline-offset-4"
                >
                  {PASS_LABEL[lang]}
                </a>
              )}
              {o.invoice_url ? (
                <a
                  href={String(o.invoice_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex min-h-[40px] items-center rounded-full border border-[color:var(--color-forest)] px-4 text-xs font-medium text-[color:var(--color-forest)]"
                >
                  {c.invoiceDownload}
                </a>
              ) : (
                <p className="mt-3 text-[11px] text-muted-foreground">{c.invoicePending}</p>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function AcademyTab({ c }: { c: Copy }) {
  const { lang } = useT();
  const certFn = useServerFn(listMyCertificaten);
  const { data: certs, isLoading } = useQuery({
    queryKey: ["my-certificaten"],
    queryFn: () => certFn(),
  });
  const { data: academies } = useQuery({
    queryKey: ["academies", "public"],
    queryFn: () => listAcademies(),
  });

  if (isLoading)
    return (
      <Card>
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </Card>
    );

  const certByAcademy = new Map((certs ?? []).map((c) => [c.academy_id, c]));
  const list = academies ?? [];
  const behaaldCount = list.filter((a) => certByAcademy.has(a.id)).length;

  return (
    <Card>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider">{c.myBadges}</h2>
        <p className="text-xs text-muted-foreground">{c.achieved(behaaldCount, list.length)}</p>
      </div>

      <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {list.map((a) => {
          const cert = certByAcademy.get(a.id);
          const done = !!cert;
          const inner = (
            <>
              <span
                className={
                  "relative grid h-14 w-14 place-items-center rounded-full transition " +
                  (done
                    ? "bg-[color:var(--surface-page)] ring-2 ring-[color:var(--color-terracotta)]/50"
                    : "bg-muted")
                }
              >
                <GraduationCap
                  className={
                    "h-6 w-6 " +
                    (done ? "text-[color:var(--color-terracotta)]" : "text-muted-foreground/60")
                  }
                />
                <span
                  className={
                    "absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full " +
                    (done
                      ? "bg-[color:var(--surface-forest)] text-[color:var(--color-cream)]"
                      : "bg-muted-foreground/25 text-muted-foreground")
                  }
                >
                  {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Lock className="h-3 w-3" />}
                </span>
              </span>
              <span className="text-xs font-medium leading-tight">{a.diersoort_naam}</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {done ? `Score ${cert!.score}` : "Vergrendeld"}
              </span>
            </>
          );

          return (
            <li key={a.id}>
              {done ? (
                <Link
                  to="/certificaat/$id"
                  params={{ id: cert!.id }}
                  className="flex h-full flex-col items-center gap-2 rounded-2xl border border-[color:var(--color-terracotta)]/40 bg-[color:var(--surface-page)]/50 p-4 text-center transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  {inner}
                </Link>
              ) : (
                <LocalLink
                  to={pathFor("academy", lang, a.slug)}
                  className="flex h-full flex-col items-center gap-2 rounded-2xl border border-dashed border-border p-4 text-center opacity-70 grayscale transition hover:opacity-100 hover:grayscale-0"
                >
                  {inner}
                </LocalLink>
              )}
            </li>
          );
        })}
      </ul>

      {behaaldCount === 0 && <p className="mt-5 text-sm text-muted-foreground">{c.noCoursesYet}</p>}
    </Card>
  );
}

type Prefs = {
  phone: string;
  street: string;
  postal_code: string;
  city: string;
};

type NotifyPrefs = {
  notify_orders: boolean;
  notify_academy: boolean;
  notify_newsletter: boolean;
};

function SettingsTab({
  userId,
  name,
  email,
  onSaved,
  c,
}: {
  userId: string;
  name: string | null;
  email: string | null;
  onSaved: () => Promise<void>;
  c: Copy;
}) {
  const [voornaam, setVoornaam] = useState("");
  const [achternaam, setAchternaam] = useState("");
  const [achternaamWasEmpty, setAchternaamWasEmpty] = useState(true);
  const [nameErrors, setNameErrors] = useState<{ first?: string; last?: string }>({});
  const [prefs, setPrefs] = useState<Prefs>({
    phone: "",
    street: "",
    postal_code: "",
    city: "",
  });
  const saveFn = useServerFn(updateMyProfile);

  const { data: profile } = useQuery({
    queryKey: ["my-profile-settings", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "first_name, last_name, full_name, phone, street, postal_code, city, notify_orders, notify_academy, notify_newsletter",
        )
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!profile) return;
    let first = profile.first_name ?? "";
    let last = profile.last_name ?? "";
    if (!first && !last && (profile.full_name || name)) {
      const split = splitName(profile.full_name ?? name);
      first = split.first_name;
      last = split.last_name;
    }
    setVoornaam(first);
    setAchternaam(last);
    setAchternaamWasEmpty(!last);
    setPrefs({
      phone: profile.phone ?? "",
      street: profile.street ?? "",
      postal_code: profile.postal_code ?? "",
      city: profile.city ?? "",
    });
  }, [profile, name]);

  const save = useMutation({
    mutationFn: () => {
      const errors: { first?: string; last?: string } = {};
      if (!voornaam.trim()) errors.first = c.firstNameRequired;
      if (!achternaamWasEmpty && !achternaam.trim()) errors.last = c.lastNameRequired;
      setNameErrors(errors);
      if (Object.keys(errors).length > 0) {
        throw new Error("validation");
      }
      return saveFn({
        data: {
          first_name: voornaam.trim(),
          last_name: achternaam.trim() || undefined,
          ...prefs,
        },
      });
    },
    onSuccess: async () => {
      await onSaved();
      toast.success(c.saveSuccess);
    },
    onError: (err) => {
      if (!(err instanceof Error && err.message === "validation")) {
        toast.error(c.saveError);
      }
    },
  });

  return (
    <div className="space-y-6">
      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-wider">{c.personalData}</h2>
          <div className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="voornaam">{c.firstNameLabel}</Label>
                <Input
                  id="voornaam"
                  value={voornaam}
                  onChange={(e) => {
                    setVoornaam(e.target.value);
                    setNameErrors((p) => ({ ...p, first: undefined }));
                  }}
                  aria-invalid={!!nameErrors.first}
                  className="mt-1 h-12"
                />
                {nameErrors.first ? (
                  <p className="mt-1 text-sm text-destructive">{nameErrors.first}</p>
                ) : null}
              </div>
              <div>
                <Label htmlFor="achternaam">{c.lastNameLabel}</Label>
                <Input
                  id="achternaam"
                  value={achternaam}
                  onChange={(e) => {
                    setAchternaam(e.target.value);
                    setNameErrors((p) => ({ ...p, last: undefined }));
                  }}
                  aria-invalid={!!nameErrors.last}
                  className="mt-1 h-12"
                />
                {nameErrors.last ? (
                  <p className="mt-1 text-sm text-destructive">{nameErrors.last}</p>
                ) : null}
              </div>
            </div>
            <EmailField email={email} label={c.emailLabel} />

          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-wider">{c.contactPickup}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{c.contactHint}</p>
          <div className="mt-4 space-y-4">
            <div>
              <Label htmlFor="acc-phone">{c.phoneLabel}</Label>
              <Input
                id="acc-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+32 470 12 34 56"
                value={prefs.phone}
                onChange={(e) => setPrefs((p) => ({ ...p, phone: e.target.value }))}
                className="mt-1 h-12"
              />
            </div>
            <div>
              <Label htmlFor="acc-street">{c.streetLabel}</Label>
              <AddressAutocomplete
                id="acc-street"
                value={prefs.street}
                onChange={(v) => setPrefs((p) => ({ ...p, street: v }))}
                onSelect={(s) =>
                  setPrefs((p) => ({
                    ...p,
                    street: s.street || p.street,
                    postal_code: s.postal_code || p.postal_code,
                    city: s.city || p.city,
                  }))
                }
                className="mt-1 h-12"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-[minmax(0,140px)_minmax(0,1fr)]">
              <div>
                <Label htmlFor="acc-zip">{c.postalLabel}</Label>
                <Input
                  id="acc-zip"
                  autoComplete="postal-code"
                  inputMode="numeric"
                  value={prefs.postal_code}
                  onChange={(e) => setPrefs((p) => ({ ...p, postal_code: e.target.value }))}
                  className="mt-1 h-12"
                />
              </div>
              <div>
                <Label htmlFor="acc-city">{c.cityLabel}</Label>
                <Input
                  id="acc-city"
                  autoComplete="address-level2"
                  value={prefs.city}
                  onChange={(e) => setPrefs((p) => ({ ...p, city: e.target.value }))}
                  className="mt-1 h-12"
                />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-wider">{c.display}</h2>
          <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium">{c.theme}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{c.themeHint}</p>
            </div>
            <ThemeSwitcher className="shrink-0" />
          </div>
        </Card>

        <Button type="submit" disabled={save.isPending} className="min-h-[48px] rounded-full px-6">
          {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {c.save}
        </Button>
      </form>

      <CommsPrefsCard userId={userId} profile={profile} c={c} />

      <PublicProfileCard />
      <SecurityCard c={c} />
      <PasswordCard email={email} c={c} />
    </div>
  );
}

type ProfileNotifyRow =
  | {
      notify_orders?: boolean | null;
      notify_academy?: boolean | null;
      notify_newsletter?: boolean | null;
    }
  | null
  | undefined;

function CommsPrefsCard({
  userId,
  profile,
  c,
}: {
  userId: string;
  profile: ProfileNotifyRow;
  c: Copy;
}) {
  const queryClient = useQueryClient();
  const notifyFn = useServerFn(updateMyNotificationPref);
  const [local, setLocal] = useState<NotifyPrefs>({
    notify_orders: true,
    notify_academy: true,
    notify_newsletter: false,
  });

  useEffect(() => {
    if (!profile) return;
    setLocal({
      notify_orders: profile.notify_orders ?? true,
      notify_academy: profile.notify_academy ?? true,
      notify_newsletter: profile.notify_newsletter ?? false,
    });
  }, [profile]);

  const mutation = useMutation({
    mutationFn: (vars: { key: keyof NotifyPrefs; value: boolean }) =>
      notifyFn({ data: { key: vars.key, value: vars.value } }),
    onMutate: (vars) => {
      const previous = local;
      setLocal((p) => ({ ...p, [vars.key]: vars.value }));
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) setLocal(ctx.previous);
      toast.error(c.saveError);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["my-profile-settings", userId] });
    },
  });

  function toggle(key: keyof NotifyPrefs, value: boolean) {
    mutation.mutate({ key, value });
  }

  return (
    <Card>
      <h2 className="text-sm font-semibold uppercase tracking-wider">{c.commsPrefs}</h2>
      <div className="mt-4 divide-y divide-border">
        <ToggleRow
          id="notify-orders"
          label={c.notifyOrdersLabel}
          hint={c.notifyOrdersHint}
          checked={local.notify_orders}
          onChange={(v) => toggle("notify_orders", v)}
        />
        <ToggleRow
          id="notify-academy"
          label={c.notifyAcademyLabel}
          hint={c.notifyAcademyHint}
          checked={local.notify_academy}
          onChange={(v) => toggle("notify_academy", v)}
        />
        <ToggleRow
          id="notify-newsletter"
          label={c.notifyNewsletterLabel}
          hint={c.notifyNewsletterHint}
          checked={local.notify_newsletter}
          onChange={(v) => toggle("notify_newsletter", v)}
        />
      </div>
    </Card>
  );
}

function ToggleRow({
  id,
  label,
  hint,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-4">
      <div className="min-w-0">
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} className="shrink-0" />
    </div>
  );
}

function SecurityCard({ c }: { c: Copy }) {
  return (
    <Card>
      <h2 className="text-sm font-semibold uppercase tracking-wider">{c.loginSecurity}</h2>
      <div className="mt-4">
        <SecuritySettings />
      </div>
    </Card>
  );
}

const makePwSchema = (c: Copy) =>
  z
    .object({
      current: z.string().min(1, { message: c.errRequiredCurrent }),
      next: z
        .string()
        .min(8, { message: c.errMinLength })
        .max(72, { message: c.errMaxLength })
        .regex(/[a-z]/, { message: c.errLower })
        .regex(/[A-Z]/, { message: c.errUpper })
        .regex(/[0-9]/, { message: c.errDigit }),
      confirm: z.string().min(1, { message: c.errRequiredConfirm }),
    })
    .refine((v) => v.next === v.confirm, {
      path: ["confirm"],
      message: c.errMismatch,
    })
    .refine((v) => v.next !== v.current, {
      path: ["next"],
      message: c.errSameAsCurrent,
    });

function PasswordCard({ email, c }: { email: string | null; c: Copy }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    const parsed = makePwSchema(c).safeParse({ current, next, confirm });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    if (!email) {
      setStatus({ type: "err", msg: c.noEmailFound });
      return;
    }
    setPending(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: parsed.data.current,
      });
      if (signInError) {
        setErrors({ current: c.currentPasswordWrong });
        setStatus({ type: "err", msg: c.currentPasswordWrongStatus });
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: parsed.data.next });
      if (error) {
        setStatus({ type: "err", msg: error.message });
        return;
      }
      setCurrent("");
      setNext("");
      setConfirm("");
      setStatus({ type: "ok", msg: c.passwordChanged });
      toast.success(c.passwordChangedToast);
    } catch {
      setStatus({ type: "err", msg: c.genericError });
    } finally {
      setPending(false);
    }
  }

  const field = (
    id: string,
    label: string,
    value: string,
    setValue: (v: string) => void,
    autoComplete: string,
    errKey: string,
  ) => (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <PasswordInput
        id={id}
        autoComplete={autoComplete}
        value={value}
        onChange={(v) => {
          setValue(v);
          setErrors((prev) => ({ ...prev, [errKey]: "" }));
        }}
        aria-invalid={!!errors[errKey]}
        aria-describedby={errors[errKey] ? `${id}-error` : undefined}
        className="mt-1 h-12"
      />
      {errors[errKey] ? (
        <p id={`${id}-error`} className="mt-1 text-sm text-destructive">
          {errors[errKey]}
        </p>
      ) : null}
    </div>
  );

  return (
    <Card>
      <h2 className="text-sm font-semibold uppercase tracking-wider">{c.changePassword}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {c.changePasswordHint}
      </p>
      <form className="mt-4 space-y-4" onSubmit={onSubmit} noValidate>
        {field("curpw", c.currentPassword, current, setCurrent, "current-password", "current")}
        {field("newpw", c.newPassword, next, setNext, "new-password", "next")}
        {field(
          "newpw2",
          c.repeatNewPassword,
          confirm,
          setConfirm,
          "new-password",
          "confirm",
        )}

        {status ? (
          <div
            role="status"
            aria-live="polite"
            className={
              status.type === "ok"
                ? "flex items-start gap-2 rounded-xl border border-primary/30 bg-primary/10 p-3 text-sm text-foreground"
                : "flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
            }
          >
            {status.type === "ok" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} />
            )}
            <span>{status.msg}</span>
          </div>
        ) : null}

        <Button
          type="submit"
          variant="secondary"
          disabled={pending}
          className="min-h-[48px] rounded-full px-6"
        >
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {c.updatePassword}
        </Button>
      </form>
    </Card>
  );
}
