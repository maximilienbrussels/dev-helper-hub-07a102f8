import { LegalDocument } from "@/components/legal/LegalDocument";
import { useT } from "@/lib/i18n";
import { STATUS_DOC } from "@/lib/status-page";
import { deepTx } from "@/lib/i18n-extra";

export function StatusPage() {
  const { lang, tx } = useT();
  return <LegalDocument doc={deepTx(tx, STATUS_DOC[lang])} />;
}

export default StatusPage;
