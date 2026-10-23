# Roadmap (opdracht architectuur/beveiliging/vertaling)

- [x] P1.1 email-shell veilige fallback voor PUBLIC_SITE_URL
- [x] P1.2 Node-listeners in error-capture
- [x] P2.1 superadmin altijd geverifieerd + email_verified_at bijwerken
- [x] P2.2 MFA-noodtoegang voor superadmin zonder 2FA-factor
- [x] P2.3 ROUT-knop op /auth
- [ ] P2.4 ensurePortalSchema controleren op verse database (wacht op DATABASE_URL)
- [~] P3 Alle talen volledig afwerken: nl/fr/en controleren; de/ar/tr/es/it/pt/pl/ro/zgh aanvullen, publieke pagina’s en Academy/documenten apart controleren; elke taal blijft ready=false tot volledige controle. Arabisch: 2116/2766 inventariskandidaten ontbreken bij aanvang.
- [ ] P4 ROUT Badge API (wacht op ROUT_API_KEY + database)
- [~] P5 https://maximilien.brussels/ als publiek domein controleren: domeinstatus, redirect-URL’s en ROUT-login/callbacks; fouten oplossen en tests uitvoeren.
- [~] P6 Beheerlogin: terugval bij toegangscontrole oplossen, e-mailinvoer en Google-start controleren; echte login op Vercel verifiëren zodra een testsessie beschikbaar is.
