/**
 * Server-only adminbewerkingen op onze eigen gebruikerstabel.
 *
 * Vroeger riepen deze functies de externe Neon Auth-API aan; nu werken ze
 * rechtstreeks op `public.app_users` en versturen de mails via onze eigen
 * mailer (Brevo) in de huisstijl.
 */
import * as auth from "./local-auth.server";

type AuthResult = { ok: boolean; status: number; body: unknown; error: string | null };

const ok = (body: unknown = null): AuthResult => ({ ok: true, status: 200, body, error: null });
const nok = (error: string, status = 400): AuthResult => ({ ok: false, status, body: null, error });

/** Maakt een account aan (of vindt een bestaand account). */
export async function createUser(input: {
  email: string;
  password: string;
  name?: string;
  callbackURL?: string;
}): Promise<AuthResult & { userId: string | null }> {
  try {
    const { user, created } = await auth.createUser({
      email: input.email,
      password: input.password,
      name: input.name,
    });
    return {
      ...(created ? ok({ user }) : nok("Dit e-mailadres is al geregistreerd.", 409)),
      userId: user.id,
    };
  } catch (error) {
    return {
      ...nok(error instanceof Error ? error.message : "Account aanmaken mislukt.", 500),
      userId: null,
    };
  }
}

/** Stuurt een wachtwoordherstellink via onze eigen mail. */
export async function sendPasswordReset(email: string, _redirectTo: string): Promise<AuthResult> {
  try {
    const { sendAuthLink } = await import("./auth-email.server");
    await sendAuthLink("reset", email, undefined, "/wachtwoord-herstellen");
    return ok();
  } catch (error) {
    return nok(error instanceof Error ? error.message : "Herstelmail versturen mislukt.", 500);
  }
}

/** Stuurt een (nieuwe) bevestigingsmail. */
export async function sendVerificationEmail(
  email: string,
  callbackURL: string,
): Promise<AuthResult> {
  try {
    const { sendAuthLink } = await import("./auth-email.server");
    await sendAuthLink("verify", email, undefined, pathOf(callbackURL, "/account"));
    return ok();
  } catch (error) {
    return nok(error instanceof Error ? error.message : "Bevestigingsmail versturen mislukt.", 500);
  }
}

/** Stuurt een inloglink (magic link). */
export async function sendMagicLink(email: string, callbackURL: string): Promise<AuthResult> {
  try {
    const { sendAuthLink } = await import("./auth-email.server");
    await sendAuthLink("magic", email, undefined, pathOf(callbackURL, "/account"));
    return ok();
  } catch (error) {
    return nok(error instanceof Error ? error.message : "Inloglink versturen mislukt.", 500);
  }
}

function pathOf(url: string, fallback: string): string {
  if (url.startsWith("/")) return url;
  try {
    const parsed = new URL(url);
    return `${parsed.pathname}${parsed.search}` || fallback;
  } catch {
    return fallback;
  }
}

/**
 * Nodigt een medewerker uit: maakt het account aan (zonder wachtwoord) zodat
 * de collega via de uitnodigingsmail een wachtwoord kan kiezen.
 */
export async function inviteUser(input: {
  email: string;
  name: string;
  redirectTo: string;
}): Promise<{ userId: string | null; error: string | null }> {
  try {
    const { user } = await auth.createUser({ email: input.email, name: input.name });
    return { userId: user.id, error: null };
  } catch (error) {
    return { userId: null, error: error instanceof Error ? error.message : "Uitnodigen mislukt." };
  }
}

/** Zet een nieuw wachtwoord met een herstel-token. */
export async function resetPasswordWithToken(
  token: string,
  newPassword: string,
): Promise<AuthResult> {
  const consumed = await auth.consumeToken(token, "reset");
  if (!consumed) return nok("Deze herstellink is verlopen of al gebruikt.", 400);
  const { user } = await auth.createUser({ email: consumed.email, emailVerified: true });
  await auth.setPassword(user.id, newPassword);
  return ok({ user });
}
