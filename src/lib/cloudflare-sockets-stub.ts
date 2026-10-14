/**
 * Stub voor `cloudflare:sockets`.
 *
 * `@neondatabase/serverless` importeert die module voor zijn WebSocket/Pool-pad.
 * Buiten de Cloudflare Worker-runtime bestaat ze niet; markeren als "external"
 * laat de import staan en laat de hele serverbundel crashen bij het laden
 * (elke request → 500). We gebruiken alleen de HTTP-driver (`neon()`), dus een
 * stub die pas bij effectief gebruik faalt is veilig en houdt de build portable.
 */
export function connect(): never {
  throw new Error(
    "cloudflare:sockets is niet beschikbaar in deze runtime. Gebruik de Neon HTTP-driver via db().",
  );
}

export default { connect };
