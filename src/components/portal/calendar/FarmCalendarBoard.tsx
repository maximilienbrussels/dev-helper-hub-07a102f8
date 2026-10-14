/**
 * Volwaardige agenda-engine op basis van FullCalendar. Vervangt de vroegere
 * handgemaakte HTML-maandroostertjes met vier weergaven: zones (per ruimte),
 * week met uurraster, maandoverzicht en lijstweergave voor mobiel.
 */
import { useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import type {
  EventClickArg,
  EventDropArg,
  EventInput,
  DateSelectArg,
  BusinessHoursInput,
} from "@fullcalendar/core";
import nlLocale from "@fullcalendar/core/locales/nl";
import frLocale from "@fullcalendar/core/locales/fr";
import type { EventResizeDoneArg } from "@fullcalendar/interaction";
import type { Booking, LocationId } from "@/lib/portal-types";
import type { CalendarEvent, OpeningExceptionRow, OpeningHourRow } from "@/lib/calendar-admin.functions";
import { LOCATIONS } from "@/lib/portal-data";
import { seasonFor } from "@/lib/opening-hours";
import "./farm-calendar.css";

export type BoardView = "zones" | "timeGridWeek" | "dayGridMonth" | "listWeek";

/** Merkkleuren per categorie. */
export const CATEGORY_COLOR: Record<Booking["type"], string> = {
  teambuilding: "#1d3528", // 🏫 Schoolanimaties & groepen — bosgroen
  privatisering: "#c1622f", // 🎂 Workshops & stages — terracotta
  zaalverhuur: "#1f3a68", // 🏛️ Zaalverhuur — marineblauw
  geblokkeerd: "#6b7280", // ⚠️ Geblokkeerd / onderhoud — leisteen
};

const EVENT_COLOR = "#4f7a5c";

type Props = {
  view: BoardView;
  bookings: Booking[];
  events: CalendarEvent[];
  openingHours: OpeningHourRow[];
  exceptions: OpeningExceptionRow[];
  lang: string;
  editable: boolean;
  focusDate: string;
  /** Klik of sleep op een lege dag/uurvak: opent het toevoegformulier. */
  onDateClick: (date: string, times?: { start: string; end: string }) => void;
  /** Zichtbare categorieën; leeg of ontbrekend betekent alles tonen. */
  visibleCategories?: Booking["type"][];
  onEventClick: (bookingId: string) => void;
  onMove: (input: {
    id: string;
    date: string;
    start_time: string;
    end_time: string;
  }) => void;
};

const hhmm = (d: Date) =>
  `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function FarmCalendarBoard(props: Props) {
  const { view, bookings, events, openingHours, exceptions, lang, editable, focusDate } = props;

  // Gesloten uren grijs kleuren: openingsuren van het huidige seizoen.
  const businessHours = useMemo<BusinessHoursInput>(() => {
    const season = seasonFor(new Date(focusDate + "T12:00:00").getMonth() + 1);
    const rows = openingHours.filter((h) => h.season === season && h.isOpen);
    if (rows.length === 0)
      return [{ daysOfWeek: [1, 2, 3, 4, 5, 6, 0], startTime: "08:00", endTime: "20:00" }];
    return rows.map((h) => ({
      daysOfWeek: [h.weekday],
      startTime: h.openTime?.slice(0, 5) ?? "08:00",
      endTime: h.closeTime?.slice(0, 5) ?? "20:00",
    }));
  }, [openingHours, focusDate]);

  // Sluitingsdagen als achtergrondgebeurtenis.
  const closedBackground = useMemo<EventInput[]>(
    () =>
      exceptions
        .filter((e) => e.closed)
        .map((e) => ({
          id: `closed-${e.id}`,
          start: e.dateFrom,
          end: new Date(new Date(e.dateTo + "T12:00:00").getTime() + 86400000)
            .toISOString()
            .slice(0, 10),
          display: "background",
          color: "#9aa39c",
          title: e.reasonNl,
        })),
    [exceptions],
  );

  const allowed = props.visibleCategories;
  const shows = (type: Booking["type"]) => !allowed || allowed.includes(type);

  const buildEvents = (locationFilter?: LocationId): EventInput[] => [
    ...bookings
      .filter((b) => b.status !== "geannuleerd")
      .filter((b) => shows(b.type))
      .filter((b) => !locationFilter || b.location_id === locationFilter)
      .map<EventInput>((b) => ({
        id: b.id,
        title: b.type === "geblokkeerd" ? "Geblokkeerd" : b.client_name,
        start: `${b.date}T${b.start_time}`,
        end: `${b.date}T${b.end_time}`,
        backgroundColor: CATEGORY_COLOR[b.type],
        borderColor: CATEGORY_COLOR[b.type],
        textColor: "#fbf8f1",
        editable: editable && b.type !== "geblokkeerd" ? true : editable,
        extendedProps: { kind: "booking", locationId: b.location_id },
      })),
    ...events
      .filter((e) => !locationFilter || e.locationId === locationFilter)
      .map<EventInput>((e) => ({
        id: `event-${e.id}`,
        title: e.titleNl,
        start: `${e.date}T${e.startTime}`,
        end: `${e.date}T${e.endTime}`,
        backgroundColor: EVENT_COLOR,
        borderColor: EVENT_COLOR,
        textColor: "#fbf8f1",
        editable: false,
        extendedProps: { kind: "event" },
      })),
    ...closedBackground,
  ];

  const locale = lang === "fr" ? frLocale : lang === "nl" ? nlLocale : undefined;

  const handleClick = (arg: EventClickArg) => {
    const kind = arg.event.extendedProps["kind"];
    if (kind === "booking" && arg.event.id) props.onEventClick(arg.event.id);
  };

  const handleMove = (arg: EventDropArg | EventResizeDoneArg) => {
    const start = arg.event.start;
    const end = arg.event.end ?? start;
    if (!start || !end || arg.event.extendedProps["kind"] !== "booking") {
      arg.revert();
      return;
    }
    props.onMove({
      id: arg.event.id,
      date: ymd(start),
      start_time: hhmm(start),
      end_time: hhmm(end),
    });
  };

  // Selectie of klik op een leeg vak opent meteen het toevoegformulier, met de
  // gekozen dag en (in de weekweergave) het gekozen uurvak al ingevuld.
  const handleSelect = (arg: DateSelectArg) =>
    props.onDateClick(
      ymd(arg.start),
      arg.allDay ? undefined : { start: hhmm(arg.start), end: hhmm(arg.end) },
    );

  const handleDateClick = (arg: { date: Date; dateStr: string; allDay: boolean }) => {
    if (arg.allDay) {
      props.onDateClick(arg.dateStr.slice(0, 10));
      return;
    }
    const end = new Date(arg.date.getTime() + 60 * 60 * 1000);
    props.onDateClick(ymd(arg.date), { start: hhmm(arg.date), end: hhmm(end) });
  };

  const shared = {
    plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
    locale,
    firstDay: 1,
    height: "auto" as const,
    nowIndicator: true,
    slotMinTime: "08:00:00",
    slotMaxTime: "20:00:00",
    allDaySlot: false,
    businessHours,
    editable,
    eventDurationEditable: editable,
    eventStartEditable: editable,
    selectable: true,
    initialDate: focusDate,
    eventClick: handleClick,
    eventDrop: handleMove,
    eventResize: handleMove,
    select: handleSelect,
    dateClick: handleDateClick,
    eventTimeFormat: { hour: "2-digit", minute: "2-digit", hour12: false } as const,
  };

  if (view === "zones") {
    return (
      <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
        {LOCATIONS.map((loc) => (
          <div key={loc.id} className="farm-calendar">
            <p className="mb-2 text-xs font-bold tracking-wide uppercase">{loc.name}</p>
            <FullCalendar
              {...shared}
              key={`${loc.id}-${focusDate}`}
              initialView="timeGridDay"
              headerToolbar={false}
              events={buildEvents(loc.id)}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="farm-calendar">
      <FullCalendar
        {...shared}
        key={`${view}-${focusDate}`}
        initialView={view}
        headerToolbar={{ left: "prev,next today", center: "title", right: "" }}
        events={buildEvents()}
      />
    </div>
  );
}

/** Wordt gebruikt door de pagina om de legende te tonen. */
export const CATEGORY_LEGEND: { key: Booking["type"]; label: string; color: string }[] = [
  { key: "teambuilding", label: "🏫 Schoolanimaties & groepen", color: CATEGORY_COLOR.teambuilding },
  { key: "privatisering", label: "🎂 Workshops & stages", color: CATEGORY_COLOR.privatisering },
  { key: "zaalverhuur", label: "🏛️ Zaalverhuur", color: CATEGORY_COLOR.zaalverhuur },
  { key: "geblokkeerd", label: "⚠️ Geblokkeerd / onderhoud", color: CATEGORY_COLOR.geblokkeerd },
];
