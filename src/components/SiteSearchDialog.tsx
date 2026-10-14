import { useEffect, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useT } from "@/lib/i18n";
import { pathFor } from "@/lib/routes-i18n";
import { getHubMenu } from "@/lib/hub-content";

type SearchEntry = { label: string; href: string; hint?: string };

const COPY = {
  nl: { placeholder: "Zoek op de site…", empty: "Geen resultaten gevonden.", title: "Snel zoeken" },
  fr: { placeholder: "Rechercher sur le site…", empty: "Aucun résultat.", title: "Recherche rapide" },
  en: { placeholder: "Search the site…", empty: "No results found.", title: "Quick search" },
} as const;

/** Vaste kernbestemmingen, opgebouwd via `pathFor` zodat links altijd geldig blijven. */
function coreEntries(lang: "nl" | "fr" | "en"): SearchEntry[] {
  const g = (nl: string, fr: string, en: string) => (lang === "fr" ? fr : lang === "en" ? en : nl);
  return [
    { label: g("Dieren", "Animaux", "Animals"), href: pathFor("animals", lang) },
    { label: g("Educatie & workshops", "Éducation & ateliers", "Education & workshops"), href: pathFor("education", lang) },
    { label: g("Academy (quiz & weetjes)", "Academy (quiz)", "Academy (quiz)"), href: pathFor("academy", lang) },
    { label: g("Bezoek & tarieven", "Visite & tarifs", "Visit & prices"), href: pathFor("visit", lang) },
    { label: g("Zaalverhuur", "Location de salle", "Venue rental"), href: pathFor("rental", lang) },
    { label: g("Vakantiestages", "Stages", "Holiday camps"), href: pathFor("camps", lang) },
    { label: g("Hoevewinkel", "Boutique fermière", "Farm shop"), href: pathFor("shop", lang) },
    { label: g("Kalender & evenementen", "Agenda & événements", "Calendar & events"), href: pathFor("events", lang) },
    { label: g("Contact", "Contact", "Contact"), href: pathFor("contact", lang) },
    { label: g("Steun ons", "Nous soutenir", "Support us"), href: pathFor("support", lang) },
  ];
}

export function SiteSearchDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { lang } = useT();
  const navigate = useNavigate();
  const c = COPY[lang];

  const groups = useMemo(() => {
    const hubs = getHubMenu(lang);
    return [
      { key: "core", label: c.title, items: coreEntries(lang) },
      ...hubs.map((h) => ({ key: h.key, label: h.label, items: h.items })),
    ];
  }, [lang, c.title]);

  const go = (href: string) => {
    onOpenChange(false);
    navigate({ to: href as never });
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder={c.placeholder} />
      <CommandList>
        <CommandEmpty>{c.empty}</CommandEmpty>
        {groups.map((g) =>
          g.items.length === 0 ? null : (
            <CommandGroup key={g.key} heading={g.label}>
              {g.items.map((item) => (
                <CommandItem
                  key={item.href}
                  value={`${item.label} ${item.hint ?? ""}`}
                  onSelect={() => go(item.href)}
                >
                  <div className="flex flex-col">
                    <span>{item.label}</span>
                    {item.hint && <span className="text-xs text-muted-foreground">{item.hint}</span>}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          ),
        )}
      </CommandList>
    </CommandDialog>
  );
}

/** Globale sneltoets Cmd/Ctrl+K om de zoekdialoog te openen. */
export function useSiteSearchShortcut(setOpen: (v: boolean | ((o: boolean) => boolean)) => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [setOpen]);
}
