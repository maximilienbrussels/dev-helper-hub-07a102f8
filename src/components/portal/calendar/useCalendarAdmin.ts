/** Gedeelde data-hook voor het kalenderbeheer: eigen serverfuncties, los van portal-store. */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  assignStaffToBooking,
  deleteBlock,
  deleteEvent,
  deleteOpeningException,
  fetchCalendarAdmin,
  removeAssignment,
  saveEvent,
  saveOpeningException,
  saveOpeningHour,
  updateBlock,
  updateBooking,
} from "@/lib/calendar-admin.functions";

export function useCalendarAdmin() {
  const queryClient = useQueryClient();
  const load = useServerFn(fetchCalendarAdmin);
  const { data, isLoading } = useQuery({
    queryKey: ["calendar-admin"],
    queryFn: () => load(),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["calendar-admin"] });
    queryClient.invalidateQueries({ queryKey: ["portal"] });
  };
  const onError = (e: unknown) => toast.error(e instanceof Error ? e.message : "Error");

  const mutate = <TInput,>(fn: (input: { data: TInput }) => Promise<unknown>) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useMutation({
      mutationFn: (input: TInput) => fn({ data: input }),
      onSuccess: invalidate,
      onError,
    });

  const updateBookingM = mutate(useServerFn(updateBooking));
  const updateBlockM = mutate(useServerFn(updateBlock));
  const deleteBlockM = mutate(useServerFn(deleteBlock));
  const assignM = mutate(useServerFn(assignStaffToBooking));
  const removeAssignM = mutate(useServerFn(removeAssignment));
  const saveHourM = mutate(useServerFn(saveOpeningHour));
  const saveExceptionM = mutate(useServerFn(saveOpeningException));
  const deleteExceptionM = mutate(useServerFn(deleteOpeningException));
  const saveEventM = mutate(useServerFn(saveEvent));
  const deleteEventM = mutate(useServerFn(deleteEvent));

  return {
    data,
    isLoading,
    updateBooking: updateBookingM.mutate,
    updateBlock: updateBlockM.mutate,
    deleteBlock: deleteBlockM.mutate,
    assignStaff: assignM.mutate,
    removeAssignment: removeAssignM.mutate,
    saveOpeningHour: saveHourM.mutate,
    saveException: saveExceptionM.mutate,
    deleteException: deleteExceptionM.mutate,
    saveEvent: saveEventM.mutate,
    deleteEvent: deleteEventM.mutate,
  };
}
