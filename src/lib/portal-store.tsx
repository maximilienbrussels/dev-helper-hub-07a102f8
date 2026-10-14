import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { translate } from "./portal-i18n";
import {
  DEFAULT_LANG,
  isLang,
  legacyPage,
  pageFromSlug,
  SLUGS,
  type PortalPage,
} from "./portal-routes";
import {
  addBookingNote,
  blockSlot as blockSlotFn,
  createBooking,
  createService as createServiceFn,
  deleteBooking,
  deleteService as deleteServiceFn,
  fetchPortalData,
  reorderServices,
  saveService,
  saveStaffMember,
  setBookingStatus,
  setCheckIn,
  toggleServiceActive,
} from "./portal.functions";

import type {
  Booking,
  BookingStatus,
  Lang,
  LocationId,
  Service,
  StaffMember,
} from "./portal-types";

export const MASTER_ADMIN_EMAIL = "jona@delplanche.com";

interface PortalState {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  page: PortalPage;
  role: "admin" | "team";
  isAdmin: boolean;
  isMaster: (email: string) => boolean;
  loading: boolean;
  /** Bezig met verversen (pull-to-refresh of knop). */
  refreshing: boolean;
  /** Haalt de portaalgegevens opnieuw op zonder de pagina te herladen. */
  refresh: () => Promise<void>;
  /** True zolang een wijziging voor deze boeking wordt opgeslagen. */
  isBookingBusy: (id: string) => boolean;
  /** Foutmelding van de laatste mislukte wijziging voor deze boeking. */
  bookingError: (id: string) => string | null;
  /** Verbergt de foutmelding weer (bv. bij opnieuw proberen). */
  clearBookingError: (id: string) => void;
  currentUser: StaffMember;
  bookings: Booking[];
  services: Service[];
  staff: StaffMember[];
  setStatus: (id: string, status: BookingStatus) => void;
  toggleCheckIn: (id: string) => void;
  addNote: (id: string, note: string) => void;
  addBooking: (b: Omit<Booking, "id" | "created_at" | "internal_notes" | "day_status">) => void;
  blockSlot: (input: {
    date: string;
    start_time: string;
    end_time: string;
    location_id: LocationId;
    reason: string;
  }) => void;
  removeBooking: (id: string) => void;
  updateService: (s: Service) => void;
  addService: (s: Omit<Service, "id">) => void;
  removeService: (id: string) => void;
  moveService: (id: string, direction: -1 | 1) => void;
  toggleService: (id: string) => void;
  updateStaff: (s: StaffMember) => void;
}


const PortalContext = createContext<PortalState | null>(null);

const EMPTY_USER: StaffMember = {
  id: "",
  name: "Medewerker",
  email: "",
  role: "team",
  active: true,
};

const FIELD_LANG_KEY = "maxim.field.lang";

function storedFieldLang(): Lang {
  if (typeof window === "undefined") return DEFAULT_LANG;
  const value = window.localStorage.getItem(FIELD_LANG_KEY) ?? "";
  return isLang(value) ? (value as Lang) : DEFAULT_LANG;
}

/**
 * `standaloneLang` is voor de veld-app: die heeft geen taal in het pad, dus
 * bewaren we de keuze lokaal in plaats van naar een andere route te springen.
 */
export function PortalProvider({
  children,
  standaloneLang = false,
}: {
  children: ReactNode;
  standaloneLang?: boolean;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const segments = pathname.split("/").filter(Boolean);
  const [fieldLang, setFieldLang] = useState<Lang>(storedFieldLang);
  const pathLang: Lang = isLang(segments[0] ?? "") ? (segments[0] as Lang) : DEFAULT_LANG;
  const lang: Lang = standaloneLang ? fieldLang : pathLang;
  const page: PortalPage =
    (isLang(segments[0] ?? "")
      ? pageFromSlug(lang, segments[1] ?? "")
      : legacyPage(segments[0] ?? "")) ?? "today";
  const setLang = (next: Lang) => {
    if (standaloneLang) {
      setFieldLang(next);
      if (typeof window !== "undefined") window.localStorage.setItem(FIELD_LANG_KEY, next);
      return;
    }
    navigate({ to: "/$lang/$", params: { lang: next, _splat: SLUGS[next][page] } });
  };
  const queryClient = useQueryClient();

  const load = useServerFn(fetchPortalData);
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["portal"],
    queryFn: () => load(),
  });

  // Per boeking bijhouden of er iets loopt en of de laatste poging mislukte,
  // zodat de veld-app dat op de kaart zelf kan tonen.
  const [busyBookings, setBusyBookings] = useState<Record<string, true>>({});
  const [bookingErrors, setBookingErrors] = useState<Record<string, string>>({});

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["portal"] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryClient]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["portal"] });
  const onError = (e: unknown) =>
    toast.error(e instanceof Error ? e.message : translate("common.error", lang));

  const statusFn = useServerFn(setBookingStatus);
  const checkInFn = useServerFn(setCheckIn);
  const noteFn = useServerFn(addBookingNote);
  const createFn = useServerFn(createBooking);
  const blockFn = useServerFn(blockSlotFn);
  const deleteFn = useServerFn(deleteBooking);
  const serviceFn = useServerFn(saveService);
  const serviceCreateFn = useServerFn(createServiceFn);
  const serviceDeleteFn = useServerFn(deleteServiceFn);
  const serviceReorderFn = useServerFn(reorderServices);
  const serviceToggleFn = useServerFn(toggleServiceActive);
  const staffFn = useServerFn(saveStaffMember);


  const mutate = <TInput,>(fn: (input: { data: TInput }) => Promise<unknown>, success?: string) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useMutation({
      mutationFn: (input: TInput) => fn({ data: input }),
      onSuccess: () => {
        invalidate();
        if (success) toast.success(success);
      },
      onError,
    });

  const statusM = mutate(statusFn, translate("statusChanged", lang));
  const checkInM = mutate(checkInFn);
  const noteM = mutate(noteFn);
  const createM = mutate(createFn);
  const blockM = mutate(blockFn);
  const deleteM = mutate(deleteFn);
  const serviceM = mutate(serviceFn, translate("services.saved", lang));
  const serviceCreateM = mutate(serviceCreateFn, translate("services.created", lang));
  const serviceDeleteM = mutate(serviceDeleteFn, translate("services.deleted", lang));
  const serviceReorderM = mutate(serviceReorderFn);
  const serviceToggleM = mutate(serviceToggleFn, translate("services.saved", lang));

  const staffM = mutate(staffFn, translate("team.updated", lang));

  /** Voert een boekingswijziging uit met bezig-status, offline-check en fout per kaart. */
  async function runBooking(id: string, action: () => Promise<unknown>) {
    setBookingErrors((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });

    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      const message = translate("field.offlineWrite", lang);
      setBookingErrors((prev) => ({ ...prev, [id]: message }));
      toast.error(message);
      return;
    }

    setBusyBookings((prev) => ({ ...prev, [id]: true }));
    try {
      await action();
    } catch (e) {
      // De toast komt al uit onError van de mutatie; hier enkel de kaart markeren.
      const message = e instanceof Error ? e.message : translate("common.error", lang);
      setBookingErrors((prev) => ({ ...prev, [id]: message }));
    } finally {
      setBusyBookings((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  }

  const bookings = data?.bookings ?? [];
  const services = data?.services ?? [];
  const staff = data?.staff ?? [];
  const role: "admin" | "team" = data?.currentRole === "admin" ? "admin" : "team";
  const isAdmin = role === "admin";

  const value = useMemo<PortalState>(() => {
    const currentUser = staff.find((s) => s.id === data?.currentUserId) ?? EMPTY_USER;

    return {
      lang,
      setLang,
      t: (key: string) => translate(key, lang),
      page,
      role,
      isAdmin,
      isMaster: (email: string) => email.trim().toLowerCase() === MASTER_ADMIN_EMAIL,
      loading: isLoading,
      refreshing: isFetching && !isLoading,
      refresh,
      isBookingBusy: (id: string) => Boolean(busyBookings[id]),
      bookingError: (id: string) => bookingErrors[id] ?? null,
      clearBookingError: (id: string) =>
        setBookingErrors((prev) => {
          if (!(id in prev)) return prev;
          const next = { ...prev };
          delete next[id];
          return next;
        }),
      currentUser,
      bookings,
      services,
      staff,
      setStatus: (id, status) => void runBooking(id, () => statusM.mutateAsync({ id, status })),
      toggleCheckIn: (id) => {
        const b = bookings.find((x) => x.id === id);
        void runBooking(id, () =>
          checkInM.mutateAsync({ id, arrived: b?.day_status !== "aangekomen" }),
        );
      },
      addNote: (id, body) => noteM.mutate({ id, body }),
      addBooking: (b) =>
        createM.mutate({
          type: b.type,
          status: b.status,
          client_name: b.client_name,
          client_org: b.client_org ?? "",
          client_email: b.client_email,
          client_phone: b.client_phone,
          date: b.date,
          start_time: b.start_time,
          end_time: b.end_time,
          location_id: b.location_id,
          guests_count: b.guests_count,
          options: b.options ?? [],
          price: b.price,
        }),
      blockSlot: (input) => blockM.mutate(input),
      removeBooking: (id) => deleteM.mutate({ id }),
      updateService: (s) => serviceM.mutate(s),
      addService: (s) => serviceCreateM.mutate(s),
      removeService: (id) => serviceDeleteM.mutate({ id }),
      moveService: (id, direction) => {
        const ids = services.map((s) => s.id);
        const from = ids.indexOf(id);
        const to = from + direction;
        if (from < 0 || to < 0 || to >= ids.length) return;
        const next = [...ids];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved as string);
        serviceReorderM.mutate({ ids: next });
      },

      toggleService: (id) => {
        const s = services.find((x) => x.id === id);
        serviceToggleM.mutate({ id, active: !s?.active });
      },
      updateStaff: (s) => staffM.mutate({ id: s.id, name: s.name, role: s.role, active: s.active }),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, page, role, isAdmin, isLoading, isFetching, data, busyBookings, bookingErrors, refresh]);

  return createElement(PortalContext.Provider, { value }, children);
}

export function usePortal() {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error("usePortal must be used within PortalProvider");
  return ctx;
}
