import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

/**
 * Rendert het antwoord van de assistent als Markdown.
 * - interne links ([tekst](/pad)) navigeren binnen de SPA, zonder page reload
 * - tel:/mailto:-links worden klikbare knoppen
 * - externe links openen in een nieuw tabblad
 */
export function ChatMarkdown({ children }: { children: string }) {
  return (
    <div className="space-y-2 [&_li]:ml-4 [&_li]:list-disc [&_ol_li]:list-decimal [&_p]:leading-relaxed [&_strong]:font-semibold">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ children }) => (
            <div className="-mx-1 overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-[color:var(--surface-page)] text-foreground">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="border border-border px-2 py-1 font-semibold">{children}</th>
          ),
          td: ({ children }) => <td className="border border-border px-2 py-1 align-top">{children}</td>,
          input: (props) => (
            <input
              {...props}
              disabled={false}
              className="mr-2 h-3.5 w-3.5 translate-y-[2px] accent-[color:var(--color-terracotta)]"
            />
          ),
          li: ({ children, ...rest }) => {
            const isTask = "checked" in rest && rest.checked !== null && rest.checked !== undefined;
            return <li className={isTask ? "!list-none !ml-0" : undefined}>{children}</li>;
          },
          p: ({ children }) => <p>{children}</p>,
          ul: ({ children }) => <ul className="space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="space-y-1">{children}</ol>,
          a: ({ href, children }) => <ChatLink href={href}>{children}</ChatLink>,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

const pill =
  "inline-flex items-center gap-1 rounded-full bg-[color:var(--surface-page)] px-2.5 py-1 text-xs font-semibold text-[color:var(--color-terracotta)] underline-offset-2 hover:underline";

/** De assistent kent generieke paden; hier vertalen we ze naar echte routes. */
const PATH_ALIASES: Record<string, string> = {
  "/bedrijven/teambuilding-seminaries": "/bezoekers/bedrijf",
  "/buurt/compost": "/betrokkenheid/vrijwilligers",
  "/feestjes/verjaardag": "/bezoekers/familie",
  "/educatie/stages": "/vakantiestages",
  "/steun/peterschap": "/adoptie",
};

function ChatLink({ href, children }: { href?: string; children: ReactNode }) {
  if (!href) return <span>{children}</span>;

  if (href.startsWith("tel:") || href.startsWith("mailto:")) {
    return (
      <a href={href} className={pill}>
        {children}
      </a>
    );
  }

  if (href.startsWith("/")) {
    return (
      <Link to={href as never} className={pill}>
        {children}
      </Link>
    );
  }

  return (
    <a href={href} target="_blank" rel="noreferrer noopener" className={pill}>
      {children}
    </a>
  );
}
