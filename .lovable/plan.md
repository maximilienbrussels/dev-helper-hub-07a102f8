# Fix admin portal login

## What goes wrong

1. **Email field loses focus.** When the login page loads, the app first picks the "public" or "admin" look and then switches to the other one. Switching rebuilds the whole page, so the cursor gets thrown out of the field you clicked.
2. **Magic link and code fail.**
   - The login link is used twice in a row. The first try uses up the link, the second then says "expired".
   - Asking for a new code makes the earlier code invalid without saying so.
   - Several parts of the app redirect you after login at the same time, and they get in each other's way.
3. **Google and password say "no access".** There are several causes:
   - An owner without two-step verification is let in, but every action afterwards is refused. That is the "no rights" message.
   - A password account whose email address has not been confirmed is signed in, then refused.
   - Two rules decide who belongs to the team. One also counts deactivated members, so a code is sent but access is refused.
   - When the database is briefly unreachable, you see "no access" instead of "please try again".
   - Google can be linked to another email address than the one you chose.
4. **Mobile sometimes looks like desktop.** For a moment at startup, the app assumes a desktop screen.

## What I will change

1. **Stable login page:** decide public or admin once, before the page is drawn, so nothing gets rebuilt while you type.
2. **Login link works the first time:** use each link exactly once, even when it is triggered twice, and keep the successful result.
3. **One place handles what happens after login:** check access, send you to two-step setup if needed, then to the dashboard.
4. **Clear messages instead of "no access":**
   - "Confirm your email address first", with a button to send the email again
   - "Set up two-step verification", with a direct link
   - "We could not check access, try again"
   - "This account (email address) is not a team member"
5. **Owners without two-step verification:** the screen and the server follow the same rule. You are sent to the two-step setup page right after login instead of getting stuck in the portal. You choose this below.
6. **Codes:** a new code no longer cancels the previous one within 15 minutes. The screen says when a code was sent.
7. **Team membership:** deactivated members are refused from the start, with the same message everywhere.
8. **Login check tool for the owner:** shows which account you are signed in with, whether the email is confirmed, your roles and your two-step status. The tool is visible only to the fixed owners.
9. **Mobile:** layout follows screen width from the very first moment, with no desktop flash.

## Check afterwards

- In a browser test: click and type in the email field, request a code and log in with it, use a login link once, and log in with a password on an account that is not confirmed.
- Tests for: link used twice, owner without two-step verification, deactivated member, database outage, and the login check tool visible only to owners.
- Live login on maximilien.site can only be checked after publishing.

## Technical details

- `__root.tsx`/`app-mode.ts`: compute shared-auth mode identically on server and client and keep a stable shell ancestor.
- `inloglink.tsx`: one promise per token, shared between effect runs; `consumeToken` atomically via `delete ... returning`.
- `permission-core.server.ts`: `resolveAccess` follows the same MFA rule as `resolveTeamAccess`; `isTeamEmail` requires an `active` row; database errors throw a separate error instead of returning false.
- `portal-access.functions.ts`: return a reason code (`unverified`, `mfa_setup`, `not_member`, `backend_error`); `auth.index.tsx` shows the matching message.
- `local-auth.server.ts` `mintLoginCode`: do not delete codes that are still valid.
- Merge the redirect logic in `auth.tsx`, `LoginCodeForm` and `inloglink` into `portalLoginDestination`.
- `use-mobile`/`use-platform`: CSS-first, with an "unknown" state instead of desktop.
