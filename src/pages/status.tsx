import { LegalDocument } from "@/components/legal/LegalDocument";
import { useT } from "@/lib/i18n";
import { STATUS_DOC } from "@/lib/status-page";

export function StatusPage() {
  const { lang } = useT();
  return <LegalDocument doc={STATUS_DOC[lang]} />;
}

export default StatusPage;
