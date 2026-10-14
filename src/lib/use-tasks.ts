/** Gedeelde data-hook voor de takenmotor (veld-app én beheerportaal). */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import {
  deleteTask,
  deleteZone,
  fetchTaskBoard,
  saveTask,
  saveZone,
  setTaskStatus,
  type TaskBoard,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/tasks.functions";

export type TaskFormInput = {
  id?: string;
  title: string;
  description: string;
  zone_id: string | null;
  assigned_to: string | null;
  due_date: string | null;
  priority: TaskPriority;
  status: TaskStatus;
};

export type ZoneFormInput = {
  id?: string;
  name: string;
  description: string;
  sort_order: number;
  active: boolean;
};

const EMPTY: TaskBoard = { zones: [], tasks: [], staff: [], currentUserId: "" };

export function useTasks() {
  const queryClient = useQueryClient();
  const load = useServerFn(fetchTaskBoard);
  const saveTaskFn = useServerFn(saveTask);
  const statusFn = useServerFn(setTaskStatus);
  const deleteTaskFn = useServerFn(deleteTask);
  const saveZoneFn = useServerFn(saveZone);
  const deleteZoneFn = useServerFn(deleteZone);

  const query = useQuery({ queryKey: ["tasks-board"], queryFn: () => load() });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["tasks-board"] });
  const onError = (e: unknown) => toast.error(e instanceof Error ? e.message : "Er ging iets mis");

  const saveTaskM = useMutation({
    mutationFn: (input: TaskFormInput) => saveTaskFn({ data: input }),
    onSuccess: invalidate,
    onError,
  });
  const statusM = useMutation({
    mutationFn: (input: { id: string; status: TaskStatus }) => statusFn({ data: input }),
    onSuccess: invalidate,
    onError,
  });
  const deleteTaskM = useMutation({
    mutationFn: (input: { id: string }) => deleteTaskFn({ data: input }),
    onSuccess: invalidate,
    onError,
  });
  const saveZoneM = useMutation({
    mutationFn: (input: ZoneFormInput) => saveZoneFn({ data: input }),
    onSuccess: invalidate,
    onError,
  });
  const deleteZoneM = useMutation({
    mutationFn: (input: { id: string }) => deleteZoneFn({ data: input }),
    onSuccess: invalidate,
    onError,
  });

  return {
    board: query.data ?? EMPTY,
    isLoading: query.isLoading,
    saveTask: saveTaskM.mutate,
    setTaskStatus: statusM.mutate,
    deleteTask: deleteTaskM.mutate,
    saveZone: saveZoneM.mutate,
    deleteZone: deleteZoneM.mutate,
  };
}
