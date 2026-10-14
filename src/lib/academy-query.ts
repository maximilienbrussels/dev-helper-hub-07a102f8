import { queryOptions } from "@tanstack/react-query";
import { listAcademies } from "@/lib/academy.functions";

/** Gedeelde query voor de publieke lijst met academies. */
export const academiesQO = queryOptions({
  queryKey: ["academies", "public"],
  queryFn: () => listAcademies(),
});
