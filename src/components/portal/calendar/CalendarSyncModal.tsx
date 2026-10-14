/**
 * Modal om de boerderijagenda in een persoonlijke agenda-app te zetten:
 * één klik naar Google Calendar, een tokenized iCal-link voor Infomaniak,
 * Outlook, Apple of Samsung, plus stap-voor-stap uitleg per platform.
 */
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  CalendarSync,
  Copy,
  Download,
  ExternalLink,
  Loader2,
  RefreshCw,
  Trash2,
} from "lucide-react";
import {
  clearCalendarFeed,
  getMyCalendarFeed,
  rotateCalendarFeedToken,
  saveCalendarFeedFilters,
  type FeedSettings,
} from "@/lib/calendar-feed.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const GUIDES: { id: string; title: string; steps: string[] }[] = [
  {
    id: "infomaniak",
    title: "Infomaniak",
    steps: [
      "Open kSuite en ga naar Agenda.",
      "Klik op Instellingen → Agenda's.",
      "Kies “Externe agenda toevoegen” → “Via URL”.",
      "Plak de iCal-link hierboven en bevestig.",
    ],
  },
  {
    id: "google",
    title: "Google Calendar",
    steps: [
      "Open Google Calendar op een computer.",
      "Klik links bij “Andere agenda's” op de + knop.",
      "Kies “Via URL”.",
      "Plak de iCal-link en klik op “Agenda toevoegen”.",
    ],
  },
  {
    id: "apple",
    title: "Apple / iPhone",
    steps: [
      "Ga naar Instellingen → Agenda → Accounts.",
      "Tik op “Voeg account toe” → “Andere”.",
      "Kies “Geabonneerde agenda toevoegen”.",
      "Plak de iCal-link en bewaar.",
    ],
  },
  {
    id: "outlook",
    title: "Microsoft Outlook",
    steps: [
      "Open Outlook Agenda.",
      "Klik op “Agenda toevoegen”.",
      "Kies “Abonneren van internet”.",
      "Plak de iCal-link en geef de agenda een naam.",
    ],
  },
];

export function CalendarSyncModal() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const load = useServerFn(getMyCalendarFeed);
  const rotate = useServerFn(rotateCalendarFeedToken);
  const save = useServerFn(saveCalendarFeedFilters);
  const clear = useServerFn(clearCalendarFeed);

  const { data, isLoading, isError, refetch, isFetching } = useQuery<FeedSettings>({
    queryKey: ["calendar-feed"],
    queryFn: () => load({ data: undefined }),
    enabled: open,
    retry: 1,
  });

  const [filters, setFilters] = useState({
    includeAssigned: true,
    includeSchools: true,
    includeAll: false,
  });

  useEffect(() => {
    if (data)
      setFilters({
        includeAssigned: data.includeAssigned,
        includeSchools: data.includeSchools,
        includeAll: data.includeAll,
      });
  }, [data]);

  const onDone = (next: FeedSettings) => {
    queryClient.setQueryData(["calendar-feed"], next);
  };

  const saveM = useMutation({
    mutationFn: (input: typeof filters) => save({ data: input }),
    onSuccess: (next) => {
      onDone(next as FeedSettings);
      toast.success("Feedinstellingen bewaard.");
    },
    onError: () => toast.error("De instellingen konden niet bewaard worden."),
  });

  const rotateM = useMutation({
    mutationFn: () => rotate({ data: undefined }),
    onSuccess: (next) => {
      onDone(next as FeedSettings);
      toast.success("Nieuw token aangemaakt. De oude link werkt niet meer.");
    },
    onError: () => toast.error("Het vernieuwen lukte niet. Probeer het zo opnieuw."),
  });

  const clearM = useMutation({
    mutationFn: () => clear({ data: undefined }),
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: ["calendar-feed"] });
      await refetch();
      toast.success("De agendalink is gewist. Er staat een nieuwe link klaar.");
    },
    onError: () => toast.error("De agendalink kon niet gewist worden. Probeer het zo opnieuw."),
  });

  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const feedUrl = data ? `${origin}/api/public/calendar/feed?token=${data.token}` : "";
  const googleUrl = feedUrl
    ? `https://calendar.google.com/calendar/r/settings/addbyurl?cid=${encodeURIComponent(feedUrl)}`
    : "";

  const downloadIcs = async () => {
    if (!feedUrl) return;
    try {
      const res = await fetch(feedUrl);
      if (!res.ok) throw new Error("Feed niet bereikbaar");
      const blob = new Blob([await res.text()], { type: "text/calendar;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "maximilien-agenda.ics";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Het .ics-bestand kon niet gedownload worden.");
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(feedUrl);
      toast.success("Link gekopieerd naar het klembord.");
    } catch {
      toast.error("Kopiëren lukte niet — selecteer de link handmatig.");
    }
  };

  const toggle = (key: keyof typeof filters) => (checked: boolean) => {
    const next = { ...filters, [key]: checked };
    setFilters(next);
    saveM.mutate(next);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <CalendarSync className="size-4" />
          <span className="hidden sm:inline">Agenda toevoegen / synchroniseren</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Synchroniseer met Google / Infomaniak</DialogTitle>
          <DialogDescription>
            Zet de boerderijagenda in je eigen agenda-app. De link is persoonlijk — deel hem niet.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <p className="inline-flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Feed wordt klaargezet…
          </p>
        ) : isError || !data ? (
          <div className="space-y-3 py-6">
            <p className="text-sm text-destructive">
              De agendalink kon niet klaargezet worden. Probeer het opnieuw.
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className="size-4" /> Opnieuw proberen
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <section className="space-y-2">
              <p className="text-sm font-semibold">Wat wil je ontvangen?</p>
              {(
                [
                  ["includeAssigned", "Alleen mijn toegewezen diensten & taken"],
                  ["includeSchools", "Schoolbezoeken & workshops"],
                  ["includeAll", "Volledige boerderij-agenda"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={filters[key]} onCheckedChange={(c) => toggle(key)(c === true)} />
                  {label}
                </label>
              ))}
            </section>

            <section className="space-y-2">
              <Button asChild className="w-full">
                <a href={googleUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="size-4" /> Toevoegen aan Google Agenda
                </a>
              </Button>
              <Button variant="outline" className="w-full" onClick={downloadIcs}>
                <Download className="size-4" /> Download .ics-bestand
              </Button>
            </section>

            <section className="space-y-2">
              <Label htmlFor="ical-url">iCal-link (Infomaniak, Outlook, Apple, Samsung)</Label>
              <Input id="ical-url" readOnly value={feedUrl} onFocus={(e) => e.target.select()} />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copy}>
                  <Copy className="size-4" /> Kopieer iCal-link
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => rotateM.mutate()}
                  disabled={rotateM.isPending}
                >
                  <RefreshCw className="size-4" /> Vernieuw token
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearM.mutate()}
                  disabled={clearM.isPending}
                >
                  <Trash2 className="size-4" /> Link wissen
                </Button>
              </div>
            </section>

            <Accordion type="single" collapsible className="w-full">
              {GUIDES.map((g) => (
                <AccordionItem key={g.id} value={g.id}>
                  <AccordionTrigger className="text-sm">{g.title}</AccordionTrigger>
                  <AccordionContent>
                    <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
                      {g.steps.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ol>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
