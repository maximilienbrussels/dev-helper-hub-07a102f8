import { deepTx } from "@/lib/i18n-extra";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { useT } from "@/lib/i18n";
import { TERMS_DOC } from "@/lib/legal-pages";

export function TermsPage() {
  const { lang, tx } = useT();
  return <LegalDocument doc={deepTx(tx, TERMS_DOC[lang])} />;
}

export default TermsPage;
