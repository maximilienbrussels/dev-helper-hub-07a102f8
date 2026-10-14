/**
 * Takenmotor: terreinzones en taken voor de veld-app en het beheerportaal.
 * Lezen mag iedereen met `view_tasks`; schrijven vereist `manage_tasks`
 * (taken) of `manage_zones` (zones). Alle controles gebeuren serverzijdig.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireAuth } from "@/lib/auth-middleware";
import { requirePermission } from "@/lib/portal-permissions";
import { combineName } from "@/lib/auth";

export type TaskStatus = "open" | "bezig" | "afgerond" | "geannuleerd";
export type TaskPriority = "laag" | "normaal" | "hoog";

export interface FarmZone {
  id: string;
  name: string;
  description: string;
  sort_order: number;
  active: boolean;
}

export interface FarmTask {
  id: string;
  zone_id: string | null;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to: string | null;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface TaskBoard {
  zones: FarmZone[];
  tasks: FarmTask[];
  staff: { id: string; name: string }[];
  currentUserId: string;
}

const idInput = z.object({ id: z.string().uuid() });

const zoneInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(400).default(""),
  sort_order: z.number().int().min(0).max(9999).default(0),
  active: z.boolean().default(true),
});

const taskInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000).default(""),
  zone_id: z.string().uuid().nullable().default(null),
  assigned_to: z.string().uuid().nullable().default(null),
  due_date: z.string().trim().min(1).nullable().default(null),
  priority: z.enum(["laag", "normaal", "hoog"]).default("normaal"),
  status: z.enum(["open", "bezig", "afgerond", "geannuleerd"]).default("open"),
});

const statusInput = z.object({
  id: z.string().uuid(),
  status: z.enum(["open", "bezig", "afgerond", "geannuleerd"]),
});

export const fetchTaskBoard = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<TaskBoard> => {
    await requirePermission(context, "view_tasks");
    const { dbAdmin: db } = await import("@/lib/db-admin.server");

    const [zones, tasks, profiles] = await Promise.all([
      db.from("farm_zones").select("*").order("sort_order", { ascending: true }),
      db.from("tasks").select("*").order("created_at", { ascending: false }),
      db.from("profiles").select("*").order("created_at", { ascending: true }),
    ]);

    return {
      zones: (zones.data ?? []).map((z) => ({
        id: z.id,
        name: z.name,
        description: z.description ?? "",
        sort_order: Number(z.sort_order ?? 0),
        active: z.active !== false,
      })),
      tasks: (tasks.data ?? []).map((t) => ({
        id: t.id,
        zone_id: t.zone_id ?? null,
        title: t.title,
        description: t.description ?? "",
        status: (t.status ?? "open") as TaskStatus,
        priority: (t.priority ?? "normaal") as TaskPriority,
        assigned_to: t.assigned_to ?? null,
        due_date: t.due_date ? String(t.due_date).slice(0, 10) : null,
        completed_at: t.completed_at ?? null,
        created_at: t.created_at,
      })),
      staff: (profiles.data ?? [])
        .filter((p) => p.active !== false)
        .map((p) => ({
          id: p.id,
          name: combineName(p.first_name, p.last_name, p.full_name) || p.email || "Medewerker",
        })),
      currentUserId: context.userId,
    };
  });

export const saveZone = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => zoneInput.parse(d))
  .handler(async ({ data, context }) => {
    await requirePermission(context, "manage_zones");
    const { dbAdmin: db } = await import("@/lib/db-admin.server");
    const row = {
      name: data.name,
      description: data.description,
      sort_order: data.sort_order,
      active: data.active,
      updated_at: new Date().toISOString(),
    };
    const { error } = data.id
      ? await db.from("farm_zones").update(row).eq("id", data.id)
      : await db.from("farm_zones").insert(row);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteZone = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => idInput.parse(d))
  .handler(async ({ data, context }) => {
    await requirePermission(context, "manage_zones");
    const { dbAdmin: db } = await import("@/lib/db-admin.server");
    const { error } = await db.from("farm_zones").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const saveTask = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => taskInput.parse(d))
  .handler(async ({ data, context }) => {
    await requirePermission(context, "manage_tasks");
    const { dbAdmin: db } = await import("@/lib/db-admin.server");
    const now = new Date().toISOString();
    const row = {
      title: data.title,
      description: data.description,
      zone_id: data.zone_id,
      assigned_to: data.assigned_to,
      due_date: data.due_date,
      priority: data.priority,
      status: data.status,
      completed_at: data.status === "afgerond" ? now : null,
      updated_at: now,
    };
    const { error } = data.id
      ? await db.from("tasks").update(row).eq("id", data.id)
      : await db.from("tasks").insert({ ...row, created_by: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setTaskStatus = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => statusInput.parse(d))
  .handler(async ({ data, context }) => {
    await requirePermission(context, "manage_tasks");
    const { dbAdmin: db } = await import("@/lib/db-admin.server");
    const now = new Date().toISOString();
    const { error } = await db
      .from("tasks")
      .update({
        status: data.status,
        completed_at: data.status === "afgerond" ? now : null,
        updated_at: now,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteTask = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => idInput.parse(d))
  .handler(async ({ data, context }) => {
    await requirePermission(context, "manage_tasks");
    const { dbAdmin: db } = await import("@/lib/db-admin.server");
    const { error } = await db.from("tasks").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
