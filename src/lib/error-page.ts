function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function renderErrorPage(error?: unknown): string {
  const details =
    error instanceof Error
      ? `${error.toString()}\n\n${error.stack ?? ""}`
      : error == null
        ? "Geen onderliggende uitzondering beschikbaar. Raadpleeg de serverlogs."
        : String(error);

  return `<!doctype html>
<html lang="nl">
  <head>
    <meta charset="utf-8" />
    <title>Deze pagina kon niet laden</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      * { box-sizing: border-box; }
      body { font: 15px/1.5 system-ui, -apple-system, sans-serif; background: #fafafa; color: #111; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 28rem; width: 100%; text-align: center; padding: 2rem; }
      .eyebrow { color: #6b7280; font-size: .75rem; font-weight: 700; text-transform: uppercase; margin: 0 0 .75rem; }
      h1 { font-size: 1.5rem; margin: 0 0 0.5rem; }
      p { color: #4b5563; margin: 0 0 1.5rem; }
      pre { max-height: 15rem; overflow: auto; white-space: pre-wrap; overflow-wrap: anywhere; text-align: left; background: #fee2e2; color: #7f1d1d; border-radius: .375rem; padding: 1rem; margin: 1rem 0; font: 12px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: 0.5rem 1rem; border-radius: 0.375rem; font: inherit; cursor: pointer; text-decoration: none; border: 1px solid transparent; }
      .primary { background: #111; color: #fff; }
      .secondary { background: #fff; color: #111; border-color: #d1d5db; }
    </style>
  </head>
  <body>
    <div class="card">
      <div role="alert">
      <p class="eyebrow">Technische fout</p>
       <pre>${escapeHtml(details)}</pre>
      <h1>Deze pagina kon niet laden</h1>
      <p>Er ging iets mis bij het openen van de pagina. Laad opnieuw om de nieuwste versie te gebruiken.</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">Opnieuw laden</button>
        <a class="secondary" href="/">Naar de startpagina</a>
      </div>
      </div>
    </div>
  </body>
</html>`;
}
