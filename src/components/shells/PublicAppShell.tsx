import { Suspense, type ReactNode } from "react";
import { useParams } from "@tanstack/react-router";

import { PageSkeleton } from "@/components/common/PageSkeleton";
import { SiteFooter } from "@/components/SiteFooter";

import { SiteAnnouncementBar } from "@/components/SiteAnnouncementBar";
import { AIChatDrawer } from "@/components/AIChatDrawer";
import { MaximChatProvider } from "@/lib/maxim-chat";
import { useSiteConfig } from "@/lib/use-site-config";
import { DEFAULT_LANG, isLang } from "@/lib/routes-i18n";

/**
 * Shell van de publieke bezoekerssite (maximilien.brussels).
 * Bevat uitsluitend publieke chrome — geen enkele admin-import,
 * zodat de admin-code volledig uit deze bundel blijft.
 *
 * De Maxim-chat wordt hier één keer gemonteerd, buiten de pagina-inhoud.
 * Zo blijft hij bij navigatie gemonteerd: gesprek, open-status en gesleepte
 * positie blijven exact behouden.
 */
export default function PublicAppShell({ children }: { children: ReactNode }) {
  const params = useParams({ strict: false }) as { lang?: string };
  const config = useSiteConfig();
  const chatEnabled = config.chat?.chatEnabled !== false;
  const lang = isLang(params.lang ?? "") ? (params.lang as "nl" | "fr" | "en") : DEFAULT_LANG;

  return (
    <MaximChatProvider>
      <div className="flex min-h-screen w-full max-w-full flex-col overflow-x-hidden bg-background text-foreground">
        <SiteAnnouncementBar lang={lang} />
        {/* flex-1 houdt de inhoudszone op volle hoogte, ook terwijl er nog
            gegevens of beelden laden — zo blijft de voettekst onderaan. */}
        <main className="relative w-full flex-1">
          <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
        </main>
        <SiteFooter />
      </div>
      {chatEnabled ? <AIChatDrawer /> : null}
    </MaximChatProvider>
  );
}

