/**
 * Publieke serverfunctie met het volledige openingsurenbeeld: weekregels,
 * uitzonderingen, actuele status en de schema.org-payload voor JSON-LD.
 */
import { createServerFn } from "@tanstack/react-start";
import { seasonFor } from "@/lib/opening-hours";
import { brusselsNow, computeOpeningStatus, type OpeningStatus } from "@/lib/opening-status";
import {
  openingHoursSpecification,
  specialOpeningHoursSpecification,
  weekFromRows,
  type DayHours,
} from "@/lib/opening-schema";

export type OpeningSchedule = {
  week: DayHours[];
  openingHoursSpecification: ReturnType<typeof openingHoursSpecification>;
  specialOpeningHoursSpecification: ReturnType<typeof specialOpeningHoursSpecification>;
  status: Record<"nl" | "fr" | "en", OpeningStatus>;
};

export const getOpeningSchedule = createServerFn({ method: "GET" }).handler(
  async (): Promise<OpeningSchedule> => {
    const { readOpeningData } = await import("@/lib/opening-hours.server");
    const { hours, exceptions } = await readOpeningData();
    const week = weekFromRows(hours, seasonFor(brusselsNow().month));
    return {
      week,
      openingHoursSpecification: openingHoursSpecification(week),
      specialOpeningHoursSpecification: specialOpeningHoursSpecification(exceptions),
      status: {
        nl: computeOpeningStatus(hours, exceptions, "nl"),
        fr: computeOpeningStatus(hours, exceptions, "fr"),
        en: computeOpeningStatus(hours, exceptions, "en"),
      },
    };
  },
);
