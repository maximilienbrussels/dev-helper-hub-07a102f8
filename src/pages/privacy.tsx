import { deepTx } from "@/lib/i18n-extra";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { useT } from "@/lib/i18n";
import { PRIVACY_DOC } from "@/lib/legal-pages";

export function PrivacyPage() {
  const { lang, tx } = useT();
  return <LegalDocument doc={deepTx(tx, PRIVACY_DOC[lang])} />;
}

export default PrivacyPage;
