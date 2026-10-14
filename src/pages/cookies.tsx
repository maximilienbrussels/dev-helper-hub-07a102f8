import { deepTx } from "@/lib/i18n-extra";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { useT } from "@/lib/i18n";
import { COOKIES_DOC } from "@/lib/cookie-statement";

export function CookiesPage() {
  const { lang, tx } = useT();
  return <LegalDocument doc={deepTx(tx, COOKIES_DOC[lang])} />;
}

export default CookiesPage;
