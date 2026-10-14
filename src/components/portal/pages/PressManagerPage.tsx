import { translate } from "@/lib/portal-i18n";
import { usePortal } from "@/lib/portal-store";

export function PressManagerPage() {
  const { lang } = usePortal();
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{translate("nav.press", lang)}</h1>
      <p className="mt-2 text-muted-foreground">Press kit and media relations management.</p>
    </div>
  );
}
