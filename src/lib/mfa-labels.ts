/** Pure helpers for authenticator labels and recovery-code files (browser + server safe). */

export function totpIssuer(staff: boolean): string {
  return staff ? "Maximilien Beheer" : "Maximilien";
}

export function totpUri(secret: string, email: string, staff: boolean): string {
  const issuer = totpIssuer(staff);
  const label = encodeURIComponent(`${issuer}:${email || "account"}`);
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

export function recoveryCodesText(email: string, codes: string[], createdAt: Date): string {
  return [
    "Maximilien — herstelcodes voor je tweede stap",
    `Account: ${email || "onbekend"}`,
    `Aangemaakt: ${createdAt.toISOString().slice(0, 16).replace("T", " ")} UTC`,
    "",
    ...codes.map((c, i) => `${String(i + 1).padStart(2, " ")}. ${c}`),
    "",
    "Elke code werkt één keer. Bewaar dit bestand op een veilige plek.",
    "Nieuwe codes maken maakt deze codes ongeldig.",
    "",
  ].join("\n");
}
