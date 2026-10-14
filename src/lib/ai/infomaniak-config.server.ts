/**
 * Eén plek waar de Infomaniak AI-credentials gelezen worden.
 *
 * Historisch bestonden er twee naamgevingen (`INFOMANIAK_API_KEY` /
 * `INFOMANIAK_PRODUCT_ID` en `INFOMANIAK_AI_*`). Beide worden aanvaard zodat
 * de chat werkt ongeacht welke variant er in de serverinstellingen staat.
 */

function env(name: string): string {
  return (process.env[name] ?? "").trim();
}

export type InfomaniakAiConfig = { apiKey: string; productId: string };

/** Leest de AI-sleutel en het product-ID; lege strings wanneer niet ingesteld. */
export function infomaniakAiCredentials(): InfomaniakAiConfig {
  return {
    apiKey: env("INFOMANIAK_AI_API_KEY") || env("INFOMANIAK_API_KEY"),
    productId: env("INFOMANIAK_AI_PRODUCT_ID") || env("INFOMANIAK_PRODUCT_ID"),
  };
}

/** True wanneer zowel sleutel als product-ID beschikbaar zijn. */
export function infomaniakAiConfigured(): boolean {
  const { apiKey, productId } = infomaniakAiCredentials();
  return Boolean(apiKey && productId);
}

/** Basis-URL van de OpenAI-compatibele Infomaniak-endpoint. */
export function infomaniakAiBaseUrl(productId: string): string {
  return `https://api.infomaniak.com/1/ai/${productId}/openai`;
}
