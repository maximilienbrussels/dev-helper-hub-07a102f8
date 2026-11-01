# Admin login herstellen op maximilien.site

## Probleem (bevestigd in de code)
Op maximilien.site (admin-modus) mogen alleen bepaalde pagina's laden. De pagina voor de tweede beveiligingsstap (`/beveiliging`) staat daar niet tussen. Na inloggen met Google stuurt het portaal je naar `/beveiliging`, de site blokkeert die pagina en stuurt je terug naar `/auth`. Resultaat: portaal laadt even en je staat weer op het inlogscherm.

Het e-mailveld dat je eruit gooit komt uit dezelfde hoek: de inlogpagina wisselt kort tussen layouts en sessiecontroles, waardoor het veld opnieuw wordt opgebouwd terwijl je klikt.

## Wat we aanpassen
1. **Beveiligingspagina toelaten op de admin-site**
   `/beveiliging` (en het profiel/MFA-pad) toevoegen aan de toegelaten admin-paden, zodat de tweede stap kan laden en je daarna automatisch in `/nl/vandaag` landt.
2. **Inlogscherm stabiel houden**
   `/auth` altijd in één vaste layout tonen (geen wissel tussen publieke en admin-layout na laden), en achtergrond-sessiecontroles mogen het formulier niet meer vervangen terwijl je typt.
3. **Na Google/code/link correct doorsturen**
   In admin-modus altijd naar het portaal (`/nl/vandaag`) of `/beveiliging` sturen, nooit naar `/account` (die pagina bestaat niet op de admin-site en veroorzaakt ook een terugsprong).
4. **Controle**
   Tests toevoegen voor: `/beveiliging` toegelaten in admin-modus, Google-terugkeer in admin-modus gaat nooit naar `/account`. Daarna in de browser met admin-modus nagaan dat het e-mailveld focus houdt en `/beveiliging` niet terugspringt.

## Technische details
- `src/lib/app-mode.ts`: `/beveiliging` in `ADMIN_PATH_PREFIXES` (en de serverside redirect op regel ~271 volgt automatisch).
- `src/routes/__root.tsx` + `src/components/shells/AdminAppShell.tsx`: shell voor `isSharedAuthPath` deterministisch kiezen bij SSR en eerste client-render, zodat er geen remount gebeurt.
- `src/routes/auth.index.tsx`: formulier blijft gemonteerd; klantensessie-melding als banner erboven.
- `src/lib/google-oauth.server.ts` / `landingPathForRole`: in admin-modus vaste superadmins herkennen en `/account` vervangen door portaalpad.
- Nieuwe tests naast `src/test/portal-login.test.ts`.

## Na de bouw
Push naar GitHub zodat Vercel opnieuw deployt; echte login op maximilien.site kan ik zelf niet testen.
