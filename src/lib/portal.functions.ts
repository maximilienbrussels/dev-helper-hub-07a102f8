import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "@/lib/auth-middleware";
import { combineName, splitName } from "@/lib/auth";
import { requirePermission } from "@/lib/portal-permissions";
import { safeError } from "@/lib/safe-error";
import { z } from "zod";
import {
  bookingInput,
  blockInput,
  noteInput,
  reorderInput,
  serviceCreateInput,
  serviceInput,
  staffInput,
  statusInput,
  idInput,
  mapBooking,
  type PortalSnapshot,
} from "./portal-mapping";


export const fetchPortalData = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<PortalSnapshot> => {
    const { userId } = context;
    // Enkel medewerkers (team of beheer, met tweede stap) zien boekingen en profielen.
    const { resolveTeamAccess } = await import("@/lib/permission-core.server");
    const team = await resolveTeamAccess({ userId, claims: context.claims });
    if (!team.allowed) throw new Error("Geen toegang tot het portaal.");
    // Rechtstreeks op Neon: de oude Data API-client schreef/las niet meer.
    const { dbAdmin: supabase } = await import("@/lib/db-admin.server");

    const [bookings, notes, services, profiles, roles] = await Promise.all([
      supabase
        .from("bookings")
        .select("*")
        .is("deleted_at", null)
        .order("event_date", { ascending: true }),
      supabase.from("booking_notes").select("*").order("created_at", { ascending: true }),
      supabase.from("services").select("*").order("sort_order", { ascending: true }),
      supabase.from("profiles").select("*").order("created_at", { ascending: true }),
      supabase.from("user_roles").select("*"),
    ]);

    // De dienstenlijst mag het hele portaal niet blokkeren wanneer de tabel
    // ontbreekt of leeg is; de pagina toont dan gewoon een lege staat.
    const firstError = bookings.error || notes.error || profiles.error || roles.error;
    if (firstError) throw new Error(firstError.message);

    const roleOf = (id: string) =>
      (roles.data ?? []).some(
        (r) =>
          r.user_id === id &&
          (r.role === "admin" || r.role === "super_admin" || r.role === "owner"),
      )
        ? "admin"
        : "team";

    return {
      bookings: (bookings.data ?? []).map((b) => mapBooking(b, notes.data ?? [])),
      services: (services.data ?? []).map((s) => ({
        id: s.id,
        title_fr: s.title_fr,
        title_nl: s.title_nl,
        title_en: s.title_en,
        desc_fr: s.desc_fr,
        desc_nl: s.desc_nl,
        desc_en: s.desc_en,
        price: Number(s.price),
        location_id: s.location_id as PortalSnapshot["services"][number]["location_id"],
        active: s.active,
      })),
      staff: (profiles.data ?? []).map((p) => ({
        id: p.id,
        name: combineName(p.first_name, p.last_name, p.full_name) || p.email || "",
        email: p.email ?? "",
        role: roleOf(p.id) as "admin" | "team",
        active: p.active,
      })),

      currentUserId: userId,
      currentRole: roleOf(userId) as "admin" | "team",
    };
  });

export const setBookingStatus = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => statusInput.parse(d))
  .handler(async ({ data, context }) => {
    await requirePermission(context, "manage_requests");
    const { error } = await context.supabase
      .from("bookings")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setCheckIn = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) =>
    z.object({ id: z.string().uuid(), arrived: z.boolean() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await requirePermission(context, "manage_requests");
    const { error } = await context.supabase
      .from("bookings")
      .update({ day_status: data.arrived ? "aangekomen" : "verwacht" })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addBookingNote = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => noteInput.parse(d))
  .handler(async ({ data, context }) => {
    await requirePermission(context, "manage_requests");
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("first_name, last_name, full_name, email")
      .eq("id", context.userId)
      .maybeSingle();
    const { error } = await context.supabase.from("booking_notes").insert({
      booking_id: data.id,
      author_id: context.userId,
      author_name:
        combineName(profile?.first_name, profile?.last_name, profile?.full_name) ||
        profile?.email ||
        "Medewerker",
      body: data.body,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const createBooking = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => bookingInput.parse(d))
  .handler(async ({ data, context }) => {
    await requirePermission(context, "manage_calendar");
    const { error } = await context.supabase.from("bookings").insert({
      type: data.type,
      status: data.status,
      client_name: data.client_name,
      client_org: data.client_org || null,
      client_email: data.client_email,
      client_phone: data.client_phone,
      event_date: data.date,
      start_time: data.start_time,
      end_time: data.end_time,
      location_id: data.location_id,
      guests_count: data.guests_count,
      options: data.options ?? [],
      price: data.price,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const blockSlot = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => blockInput.parse(d))
  .handler(async ({ data, context }) => {
    await requirePermission(context, "manage_calendar");
    const { error } = await context.supabase.from("bookings").insert({
      type: "geblokkeerd",
      status: "gereserveerd",
      client_name: data.reason || "Niet beschikbaar",
      client_email: "",
      client_phone: "",
      event_date: data.date,
      start_time: data.start_time,
      end_time: data.end_time,
      location_id: data.location_id,
      guests_count: 0,
      price: 0,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteBooking = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => idInput.parse(d))
  .handler(async ({ data, context }) => {
    await requirePermission(context, "manage_requests");
    // Zacht verwijderen: 30 dagen herstelbaar via Logboek & prullenbak.
    const { error } = await context.supabase
      .from("bookings")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw safeError(new Error(error.message), "Verwijderen lukte niet.");
    const { recordAudit } = await import("./audit.server");
    await recordAudit({
      actorId: context.userId,
      actorEmail: (context.claims as { email?: string } | null)?.email ?? null,
      action: "delete",
      entity: "booking",
      entityId: data.id,
      summary: "Boeking naar de prullenbak",
    });
    return { ok: true };
  });

export const saveService = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => serviceInput.parse(d))
  .handler(async ({ data, context }) => {
    await requirePermission(context, "manage_services");
    const { dbAdmin } = await import("@/lib/db-admin.server");
    const { id, ...fields } = data;
    const { data: rows, error } = await dbAdmin
      .from("services")
      .update(fields)
      .eq("id", id)
      .select("id");
    if (!error && (!rows || rows.length === 0)) {
      throw new Error("Deze dienst bestaat niet meer. Ververs de pagina.");
    }
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const createService = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => serviceCreateInput.parse(d))
  .handler(async ({ data, context }) => {
    await requirePermission(context, "manage_services");
    const { dbAdmin } = await import("@/lib/db-admin.server");
    const { data: last } = await dbAdmin
      .from("services")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { error } = await dbAdmin
      .from("services")
      .insert({ ...data, sort_order: Number(last?.sort_order ?? 0) + 1 })
      .select("id");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteService = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => idInput.parse(d))
  .handler(async ({ data, context }) => {
    await requirePermission(context, "manage_services");
    const { dbAdmin } = await import("@/lib/db-admin.server");
    const { error } = await dbAdmin.from("services").delete().eq("id", data.id).select("id");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Bewaart de nieuwe sortering van de diensten (volgorde op de website). */
export const reorderServices = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => reorderInput.parse(d))
  .handler(async ({ data, context }) => {
    await requirePermission(context, "manage_services");
    const { dbAdmin } = await import("@/lib/db-admin.server");
    for (const [index, id] of data.ids.entries()) {
      const { error } = await dbAdmin
        .from("services")
        .update({ sort_order: index + 1 })
        .eq("id", id);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const toggleServiceActive = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => z.object({ id: z.string().uuid(), active: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    await requirePermission(context, "manage_services");
    const { dbAdmin } = await import("@/lib/db-admin.server");
    const { error } = await dbAdmin
      .from("services")
      .update({ active: data.active })
      .eq("id", data.id)
      .select("id");
    if (error) throw new Error(error.message);
    return { ok: true };
  });


export const saveStaffMember = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => staffInput.parse(d))
  .handler(async ({ data, context }) => {
    await requirePermission(context, "manage_team");
    if (data.id === context.userId && data.role !== "admin") {
      throw new Error("Je kan je eigen beheerdersrol niet verwijderen.");
    }

    const { first_name, last_name } = splitName(data.name);
    const { error } = await context.supabase
      .from("profiles")
      .update({ first_name, last_name, active: data.active })
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    const { dbAdmin } = await import("@/lib/db-admin.server");
    await dbAdmin.from("user_roles").delete().eq("user_id", data.id);
    const { error: insertError } = await dbAdmin
      .from("user_roles")
      .insert({ user_id: data.id, role: data.role });
    if (insertError) throw new Error(insertError.message);
    return { ok: true };
  });

/** Invite-only account creation: admins invite colleagues by e-mail. */
export const inviteStaffMember = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) =>
    z
      .object({
        email: z.string().trim().email().max(255),
        name: z.string().trim().min(2).max(80),
        role: z.enum(["admin", "team"]),
        redirectTo: z.string().url().max(300),
        lang: z.enum(["nl", "fr", "en"]).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await requirePermission(context, "manage_team");

    const { dbAdmin } = await import("@/lib/db-admin.server");
    const { inviteUser } = await import("./neon-auth-admin.server");
    const invited = await inviteUser({
      email: data.email,
      name: data.name,
      redirectTo: data.redirectTo,
    });
    if (invited.error) throw new Error(invited.error);

    // Sjabloon 1: uitnodiging in de huisstijl en de taal van de collega, met
    // een eigen link om meteen een wachtwoord te kiezen.
    const { sendAuthLink } = await import("./auth-email.server");
    const { normalizeMailLang } = await import("./email-copy");
    await sendAuthLink(
      "invite",
      data.email,
      data.name,
      "/wachtwoord-herstellen",
      normalizeMailLang(data.lang),
    );

    const userId = invited.userId;
    if (userId) {
      const { first_name, last_name } = splitName(data.name);
      await dbAdmin.from("profiles").update({ first_name, last_name }).eq("id", userId);
      await dbAdmin.from("user_roles").delete().eq("user_id", userId);
      const { error: roleInsert } = await dbAdmin
        .from("user_roles")
        .insert({ user_id: userId, role: data.role });
      if (roleInsert) throw new Error(roleInsert.message);
    }
    return { ok: true };
  });
