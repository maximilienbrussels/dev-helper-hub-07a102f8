import { useEffect, useMemo, useRef, useState } from "react";
import { authFetch } from "@/lib/auth-fetch";
import { useRouterState } from "@tanstack/react-router";
import { useMaximChatControl } from "@/lib/maxim-chat";

import { useT } from "@/lib/i18n";
import { formatT } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import {
  Rabbit,
  Bird,
  Cat,
  Fish,
  Snail,
  Send,
  Minus,
  Paperclip,
  Mic,
  Volume2,
  VolumeX,
  X,
  Bell,
  BellOff,
  Maximize2,
  Minimize2,
  GripVertical,
} from "lucide-react";

import { MLogo } from "@/components/MLogo";
import euriaLogoAsset from "@/assets/euria-logo.jpg.asset.json";
import { ChatMarkdown } from "@/components/ChatMarkdown";
import { MaximInlineCard } from "@/components/chat/MaximCards";
import { CompostChecker } from "@/components/chat/CompostChecker";
import { PrintItineraryButton, isPrintable } from "@/components/chat/PrintItinerary";
import { ChipScroller } from "@/components/chat/ChipScroller";
import { MapsLinkButton, isTransitAnswer } from "@/components/chat/MapsLink";
import { ChatRouteMap, extractRouteMarker, inferRouteStart } from "@/components/chat/ChatRouteMap";
import { FarmAssetCard } from "@/components/chat/FarmAssetCard";
import { EmailAnswerButton } from "@/components/chat/EmailAnswerButton";
import { SpeakButton } from "@/components/chat/SpeakButton";
import { stopSpeaking } from "@/lib/speak";
import { ZoomableImage } from "@/components/chat/Lightbox";
import { CalendarExportButton, isSchedule } from "@/components/chat/CalendarExport";
import { useQuery } from "@tanstack/react-query";
import { extractAssetMarker, findFarmAsset, FARM_ASSETS } from "@/config/farmAssets";
import { fetchFarmAssets } from "@/lib/farm-assets.functions";
import { useSiteContact } from "@/lib/use-site-config";
import { contactAddressLine } from "@/lib/site-config";
import { buildGreeting, randomTypingLine, suggestReplies } from "@/lib/maxim-suggestions";

/** Statische route wanneer de live MIVB/NMBS-gegevens niet beschikbaar zijn. */
/** Teksten rond het delen van de live locatie. */
const GEO_COPY: Record<
  "nl" | "fr" | "en",
  { gotIt: string; mapsLabel: string; fallback: string; ask: (lat: string, lng: string) => string }
> = {
  nl: {
    gotIt: "Top, ik heb je locatie! Hier is meteen je route naar de boerderij:",
    mapsLabel: "📍 Open route in Google Maps",
    fallback:
      "Geen probleem! Uit welke stad, gemeente of station vertrek je? Dan zoek ik de vlotste route voor je.",
    ask: (lat, lng) =>
      `Mijn huidige locatie is lat: ${lat}, lon: ${lng}. Wat is voor mij de snelste route naar de boerderij?`,
  },
  fr: {
    gotIt: "Super, j'ai votre position ! Voici tout de suite votre itinéraire vers la ferme :",
    mapsLabel: "📍 Ouvrir l'itinéraire dans Google Maps",
    fallback:
      "Pas de souci ! De quelle ville, commune ou gare partez-vous ? Je vous trouve le trajet le plus simple.",
    ask: (lat, lng) =>
      `Ma position actuelle est lat : ${lat}, lon : ${lng}. Quel est le trajet le plus rapide vers la ferme ?`,
  },
  en: {
    gotIt: "Great, I've got your location! Here's your route to the farm:",
    mapsLabel: "📍 Open route in Google Maps",
    fallback:
      "No problem at all! Which city, town or station are you setting off from? I'll find the smoothest route.",
    ask: (lat, lng) =>
      `My current location is lat: ${lat}, lon: ${lng}. What's the fastest route to the farm for me?`,
  },
};

const TRANSIT_FALLBACK: Record<"nl" | "fr" | "en", string> = {
  nl: [
    "De live-tijden zijn even niet bereikbaar, maar dit werkt altijd:",
    "",
    "1. 🚇 Neem metro **2 of 6** tot **IJzer / Yser** — daarna 5 minuten wandelen.",
    "2. 🚆 Of trein tot **Brussel-Noord** — 10 minuten langs het kanaal.",
    "3. 🚊 Tram **51** en bus **46 / 58** stoppen vlakbij het Maximiliaanpark.",
    "4. 🎉 Je staat aan Schipperijkaai 2, 1000 Brussel — gratis binnen!",
  ].join("\n"),
  fr: [
    "Les horaires en direct sont indisponibles, mais ceci fonctionne toujours :",
    "",
    "1. 🚇 Métro **2 ou 6** jusqu'à **Yser / IJzer** — puis 5 minutes à pied.",
    "2. 🚆 Ou train jusqu'à **Bruxelles-Nord** — 10 minutes le long du canal.",
    "3. 🚊 Tram **51** et bus **46 / 58** s'arrêtent près du parc Maximilien.",
    "4. 🎉 Vous voilà Quai du Batelage 2, 1000 Bruxelles — entrée gratuite !",
  ].join("\n"),
  en: [
    "Live times are unavailable right now, but this always works:",
    "",
    "1. 🚇 Metro **2 or 6** to **IJzer / Yser** — then a 5-minute walk.",
    "2. 🚆 Or train to **Brussels-North** — 10 minutes along the canal.",
    "3. 🚊 Tram **51** and buses **46 / 58** stop near Maximilian Park.",
    "4. 🎉 You've arrived at Quai du Batelage 2, 1000 Brussels — free entry!",
  ].join("\n"),
};

import { detectMaximCard } from "@/lib/maxim-context";
import {
  GREETING,
  PRIVACY_BADGE,
  chipsFor,
  instantAnswer,
  nextChipSet,
  type ChipSet,
  type QuickActionId,
} from "@/lib/maxim-instant";
import { handleImageError } from "@/lib/image-fallback";


const COPY: Record<
  Lang,
  {
    guide: string;
    photoTooLarge: string;
    photoReady: string;
    removePhoto: string;
    addPhoto: string;
    stopRecording: string;
    recordVoice: string;
    transcribing: string;
    listening: string;
    recordingTooShort: string;
    transcribeFailed: string;
    noMic: string;
    autoSpeakOn: string;
    autoSpeakOff: string;
    fullscreen: string;
    exitFullscreen: string;
    notifyOn: string;
    notifyOff: string;
    move: string;
    resize: string;
    newReply: string;
    tabAlert: string;
    unreadLabel: string;
  }
> = {
  nl: {
    guide: "gids",
    photoTooLarge: "Foto is te groot (max. 6 MB).",
    photoReady: "Foto klaar om te sturen",
    removePhoto: "Foto verwijderen",
    addPhoto: "Foto toevoegen",
    stopRecording: "Stop opname",
    recordVoice: "Spraak opnemen",
    transcribing: "Transcriberen…",
    listening: "Aan het luisteren…",
    recordingTooShort: "Opname te kort — probeer opnieuw.",
    transcribeFailed: "Transcriptie mislukt.",
    noMic: "Geen microfoontoegang.",
    autoSpeakOn: "Antwoorden hardop voorlezen",
    autoSpeakOff: "Voorlezen uitzetten",
    fullscreen: "Volledig scherm",
    exitFullscreen: "Verlaat volledig scherm",
    notifyOn: "Meldingen aanzetten",
    notifyOff: "Meldingen uitzetten",
    move: "Versleep het venster",
    resize: "Sleep om het venster groter of kleiner te maken",
    newReply: "Maxim heeft geantwoord",
    tabAlert: "Maxim heeft geantwoord! — Stadsboerderij",
    unreadLabel: "nieuwe antwoorden",
  },
  fr: {
    guide: "guide",
    photoTooLarge: "La photo est trop grande (max. 6 Mo).",
    photoReady: "Photo prête à être envoyée",
    removePhoto: "Supprimer la photo",
    addPhoto: "Ajouter une photo",
    stopRecording: "Arrêter l'enregistrement",
    recordVoice: "Enregistrer un message vocal",
    transcribing: "Transcription en cours…",
    listening: "En écoute…",
    recordingTooShort: "Enregistrement trop court — réessayez.",
    transcribeFailed: "La transcription a échoué.",
    noMic: "Pas d'accès au microphone.",
    autoSpeakOn: "Lire les réponses à voix haute",
    autoSpeakOff: "Arrêter la lecture automatique",
    fullscreen: "Plein écran",
    exitFullscreen: "Quitter le plein écran",
    notifyOn: "Activer les notifications",
    notifyOff: "Désactiver les notifications",
    move: "Déplacer la fenêtre",
    resize: "Glissez pour redimensionner la fenêtre",
    newReply: "Maxim a répondu",
    tabAlert: "Maxim a répondu ! — Ferme urbaine",
    unreadLabel: "nouvelles réponses",
  },
  en: {
    guide: "guide",
    photoTooLarge: "Photo is too large (max. 6 MB).",
    photoReady: "Photo ready to send",
    removePhoto: "Remove photo",
    addPhoto: "Add photo",
    stopRecording: "Stop recording",
    recordVoice: "Record voice message",
    transcribing: "Transcribing…",
    listening: "Listening…",
    recordingTooShort: "Recording too short — try again.",
    transcribeFailed: "Transcription failed.",
    noMic: "No microphone access.",
    autoSpeakOn: "Read answers aloud",
    autoSpeakOff: "Turn off reading aloud",
    fullscreen: "Full screen",
    exitFullscreen: "Exit full screen",
    notifyOn: "Enable notifications",
    notifyOff: "Disable notifications",
    move: "Move the window",
    resize: "Drag to resize the window",
    newReply: "Maxim replied",
    tabAlert: "Maxim replied! — City farm",
    unreadLabel: "new replies",
  },
};

type ContentPart = { type: "text"; text: string } | { type: "image"; image: string };

type Msg = {
  role: "user" | "assistant";
  content: string | ContentPart[];
};

function renderMsg(content: Msg["content"]) {
  if (typeof content === "string") return { text: content, image: null as string | null };
  let text = "";
  let image: string | null = null;
  for (const p of content) {
    if (p.type === "text") text += p.text;
    else if (p.type === "image" && !image) image = p.image;
  }
  return { text, image };
}

function lastUserText(msgs: Msg[]) {
  const last = [...msgs].reverse().find((m) => m.role === "user");
  if (!last) return "";
  return renderMsg(last.content).text;
}

interface Props {
  animalId?: number;
  animalName?: string;
  forceOpen?: boolean;
}

const IDLE_MS = 90_000;
/** Match last user message keywords → animal icon. */
function pickAvatar(msgs: Msg[]) {
  const last = lastUserText(msgs).toLowerCase();
  if (/(konijn|lapin|rabbit|hase)/.test(last)) return { Icon: Rabbit, label: "konijn" };
  if (/(kip|poule|chicken|haan|oiseau|vogel|bird|duif)/.test(last))
    return { Icon: Bird, label: "kip" };
  if (/(kat|chat|cat|poes)/.test(last)) return { Icon: Cat, label: "kat" };
  if (/(vis|poisson|fish|aquarium)/.test(last)) return { Icon: Fish, label: "vis" };
  if (/(slak|escargot|snail|compost|worm)/.test(last)) return { Icon: Snail, label: "compost" };
  if (
    /(ezel|âne|ane|donkey|boudewijn|paard|geit|schaap|alpaca|mouton|chèvre|goat|sheep)/.test(last)
  )
    return { Icon: Rabbit, label: "boerderij" };
  return { Icon: null, label: "maxim" };
}

/** Snelkoppelingen: label + eventueel onmiddellijk lokaal antwoord. */


const RETRY_COPY: Record<Lang, { retry: string; call: string }> = {
  nl: { retry: "Probeer opnieuw", call: "Bel direct" },
  fr: { retry: "Réessayer", call: "Appeler" },
  en: { retry: "Try again", call: "Call us" },
};

type Pos = { x: number; y: number };

/** sessionStorage-sleutels: gesprek, open-status en gesleepte posities. */
const SS_MESSAGES = "maxim_messages";
const SS_OPEN = "maxim_is_open";
const SS_POSITION = "maxim_position";
const SS_LAUNCHER_POSITION = "maxim_launcher_position";
const SS_SIZE = "maxim_size";


/** Kleine viewportcheck: op gsm blijft de chat een vaste sheet (geen slepen). */
function useIsSmallScreen() {
  const [small, setSmall] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 639px)");
    const on = () => setSmall(mql.matches);
    on();
    mql.addEventListener("change", on);
    return () => mql.removeEventListener("change", on);
  }, []);
  return small;
}

/**
 * Vloeiend slepen: tijdens de beweging schrijven we rechtstreeks een
 * GPU-transform op het element (één update per animatieframe, geen React
 * re-render). Pas bij loslaten wordt de definitieve positie vastgelegd en
 * bewaard in sessionStorage.
 */
function useDraggable(storageKey: string) {
  const [pos, setPos] = useState<Pos | null>(null);
  const [dragging, setDragging] = useState(false);
  const movedRef = useRef(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Pos;
        if (typeof parsed?.x === "number" && typeof parsed?.y === "number") {
          // Bewaarde positie altijd binnen het zichtbare venster klemmen,
          // zodat de bubbel nooit buiten beeld of achter de rand verdwijnt.
          setPos({
            x: Math.min(Math.max(8, parsed.x), Math.max(8, window.innerWidth - 120)),
            y: Math.min(Math.max(8, parsed.y), Math.max(8, window.innerHeight - 80)),
          });
        }
      }
    } catch {
      /* geen bewaarde positie */
    }
  }, [storageKey]);

  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const trigger = e.currentTarget as HTMLElement;
    // Knoppen in de header mogen gewoon klikken, niet slepen.
    if ((e.target as HTMLElement).closest("button") && trigger.tagName !== "BUTTON") return;
    const el = (trigger.closest("[data-drag-host]") as HTMLElement | null) ?? trigger;
    const rect = el.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const originX = rect.left;
    const originY = rect.top;
    const maxX = Math.max(8, window.innerWidth - rect.width - 8);
    const maxY = Math.max(8, window.innerHeight - rect.height - 8);

    let dx = 0;
    let dy = 0;
    let frame = 0;
    movedRef.current = false;
    setDragging(true);

    const prevTransition = el.style.transition;
    el.style.transition = "none";
    el.style.willChange = "transform";
    try {
      trigger.setPointerCapture(e.pointerId);
    } catch {
      /* pointer capture optioneel */
    }

    const paint = () => {
      frame = 0;
      el.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
    };

    const move = (ev: PointerEvent) => {
      const nextX = Math.min(Math.max(8, originX + (ev.clientX - startX)), maxX);
      const nextY = Math.min(Math.max(8, originY + (ev.clientY - startY)), maxY);
      dx = nextX - originX;
      dy = nextY - originY;
      if (!movedRef.current && Math.abs(dx) + Math.abs(dy) > 3) movedRef.current = true;
      if (!frame) frame = requestAnimationFrame(paint);
    };

    const up = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      if (frame) cancelAnimationFrame(frame);
      try {
        trigger.releasePointerCapture(ev.pointerId);
      } catch {
        /* al vrijgegeven */
      }
      const next = { x: originX + dx, y: originY + dy };
      // Eerst de echte positie zetten, dan pas de transform lossen: geen sprong.
      el.style.left = `${next.x}px`;
      el.style.top = `${next.y}px`;
      el.style.right = "auto";
      el.style.bottom = "auto";
      el.style.transform = "";
      el.style.willChange = "";
      el.style.transition = prevTransition;
      setDragging(false);
      if (movedRef.current) {
        setPos(next);
        try {
          sessionStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          /* opslag geweigerd */
        }
      }
    };

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  }

  // Positie geldig houden bij resize.
  useEffect(() => {
    const onResize = () =>
      setPos((p) =>
        p
          ? {
              x: Math.min(Math.max(8, p.x), Math.max(8, window.innerWidth - 120)),
              y: Math.min(Math.max(8, p.y), Math.max(8, window.innerHeight - 80)),
            }
          : p,
      );
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const reset = () => {
    setPos(null);
    sessionStorage.removeItem(storageKey);
  };

  /** Positie van buitenaf zetten (bv. het venster bij de bubbel openen). */
  const setPosition = (next: Pos | null, persist = true) => {
    setPos(next);
    if (!persist) return;
    try {
      if (next) sessionStorage.setItem(storageKey, JSON.stringify(next));
      else sessionStorage.removeItem(storageKey);
    } catch {
      /* opslag geweigerd */
    }
  };

  return { pos, dragging, movedRef, onPointerDown, reset, setPosition };
}

/** Grenzen van het handmatig herschalen op desktop. */
const MIN_W = 360;
const MIN_H = 480;
const maxW = () => Math.min(900, Math.round(window.innerWidth * 0.85));
const maxH = () => Math.round(window.innerHeight * 0.85);
const clampSize = (w: number, h: number) => ({
  w: Math.min(Math.max(MIN_W, w), Math.max(MIN_W, maxW())),
  h: Math.min(Math.max(MIN_H, h), Math.max(MIN_H, maxH())),
});

/**
 * Zet het chatvenster bij de bubbel: standaard klapt het linksboven open,
 * maar bij te weinig plaats groeit het naar rechts of naar onder. Het venster
 * blijft altijd volledig binnen het scherm.
 */
function anchorToBubble(bubble: Pos, w: number, h: number): Pos & { origin: string } {
  const M = 8;
  const bubbleW = 150;
  const bubbleH = 56;
  let x = bubble.x + bubbleW - w;
  if (x < M) x = bubble.x;
  const growRight = x === bubble.x;
  let y = bubble.y + bubbleH - h;
  const growDown = y < M;
  if (growDown) y = bubble.y;
  return {
    origin: `${growDown ? "top" : "bottom"} ${growRight ? "left" : "right"}`,
    x: Math.min(Math.max(M, x), Math.max(M, window.innerWidth - w - M)),
    y: Math.min(Math.max(M, y), Math.max(M, window.innerHeight - h - M)),
  };
}


export function AIChatDrawer(props: Props = {}) {
  const { t, lang } = useT();
  // Fotokaarten: de vaste lijst, aangevuld met beelden uit de mediabibliotheek.
  const siteContact = useSiteContact();
  const { data: farmAssets } = useQuery({
    queryKey: ["farm-assets"],
    queryFn: () => fetchFarmAssets(),
    staleTime: 10 * 60 * 1000,
  });
  const c = COPY[lang];
  const control = useMaximChatControl();
  // Dierenmodus komt óf van props (losse montage) óf van de globale context.
  const animalId = props.animalId ?? control?.animal?.id;
  const animalName = props.animalName ?? control?.animal?.name;
  const openRequest = control?.openRequest ?? 0;
  const openPrompt = control?.openPrompt ?? null;
  const openImage = control?.openImage ?? null;
  const forceOpen = props.forceOpen ?? false;
  /** Actieve route: gaat mee naar /api/chat zodat Maxim de paginacontext kent. */
  const currentRoute = useRouterState({ select: (s) => s.location.pathname });
  const [hydrated, setHydrated] = useState(false);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [chipSet, setChipSet] = useState<ChipSet>("default");
  /** Reeds aangeklikte suggesties verdwijnen uit de lijst. */
  const [usedChips, setUsedChips] = useState<string[]>([]);

  /** Vraag die pas na een tussenbericht verstuurd wordt (live locatie). */
  const [queued, setQueued] = useState<string | null>(null);
  /** Warm wachtberichtje tijdens het antwoorden. */
  const [typingLine, setTypingLine] = useState<string>(() => randomTypingLine("nl"));
  const [error, setError] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  /** Slim scrollen: meelegen (true) of tijdelijk gepauzeerd door de lezer (false). */
  const stickRef = useRef(true);
  const lastTopRef = useRef(0);
  const alignedRef = useRef("");
  const streamingRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const idleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSentRef = useRef<string>("");
  const [fullscreen, setFullscreen] = useState(false);
  const [notify, setNotify] = useState(false);
  /** Ongelezen antwoorden terwijl de chat dicht is (of het tabblad verborgen). */
  const [unread, setUnread] = useState(0);
  const openRef = useRef(false);
  useEffect(() => {
    openRef.current = open;
    if (open) setUnread(0);
  }, [open]);
  const panelDrag = useDraggable(SS_POSITION);
  const launcherDrag = useDraggable(SS_LAUNCHER_POSITION);
  const isMobile = useIsSmallScreen();

  // Gesprek, open-status en positie overleven navigatie én een handmatige refresh.
  useEffect(() => {
    try {
      const rawMessages = sessionStorage.getItem(SS_MESSAGES);
      if (rawMessages) {
        const parsed = JSON.parse(rawMessages) as Msg[];
        if (Array.isArray(parsed) && parsed.length > 0) setMessages(parsed);
      }
      if (sessionStorage.getItem(SS_OPEN) === "1") setOpen(true);
    } catch {
      /* geen bewaarde chat */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      if (messages.length > 0) sessionStorage.setItem(SS_MESSAGES, JSON.stringify(messages));
      else sessionStorage.removeItem(SS_MESSAGES);
    } catch {
      /* opslag geweigerd of vol */
    }
  }, [messages, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      if (open) sessionStorage.setItem(SS_OPEN, "1");
      else sessionStorage.removeItem(SS_OPEN);
    } catch {
      /* opslag geweigerd */
    }
  }, [open, hydrated]);

  // Externe openverzoeken (bv. een QR-pagina van een dier of de weerbadge).
  const sendRef = useRef<((text?: string) => void) | null>(null);
  useEffect(() => {
    if (openRequest === 0) return;
    setOpen(true);
    if (openImage) setPendingImage(openImage);
    if (openPrompt) {
      const prompt = openPrompt;
      // Bij een foto eerst de pendingImage laten landen, dan versturen.
      const timer = setTimeout(() => sendRef.current?.(prompt), openImage ? 300 : 150);
      return () => clearTimeout(timer);
    }
    return;
    // openPrompt hoort bij dit ene verzoek; enkel de teller triggert opnieuw.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openRequest]);

  // Handmatig gekozen venstergrootte (desktop), bewaard voor de hele sessie.
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [resizing, setResizing] = useState(false);
  /** Vanuit welke hoek het venster opent (kant van de bubbel). */
  const [popOrigin, setPopOrigin] = useState("bottom right");
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SS_SIZE);
      if (raw) {
        const p = JSON.parse(raw) as { w: number; h: number };
        if (typeof p?.w === "number" && typeof p?.h === "number") setSize(clampSize(p.w, p.h));
      }
    } catch {
      /* geen bewaarde grootte */
    }
  }, []);

  /** Slepen aan de linkerrand, bovenrand of linkerbovenhoek van het venster. */
  const startResize = (e: React.PointerEvent, dir: "left" | "top" | "corner") => {
    if (isMobile || fullscreen) return;
    e.preventDefault();
    e.stopPropagation();
    const handle = e.currentTarget as HTMLElement;
    const el = handle.closest("[data-drag-host]") as HTMLElement | null;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const anchored = Boolean(panelDrag.pos);
    setResizing(true);
    try {
      handle.setPointerCapture(e.pointerId);
    } catch {
      /* pointer capture optioneel */
    }

    let next = { w: rect.width, h: rect.height };
    let nextPos: Pos | null = null;
    const move = (ev: PointerEvent) => {
      const wantW = dir === "top" ? rect.width : rect.width - (ev.clientX - startX);
      const wantH = dir === "left" ? rect.height : rect.height - (ev.clientY - startY);
      next = clampSize(wantW, wantH);
      setSize(next);
      if (anchored) {
        nextPos = {
          x: dir === "top" ? rect.left : rect.right - next.w,
          y: dir === "left" ? rect.top : rect.bottom - next.h,
        };
        panelDrag.setPosition(nextPos, false);
      }
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      setResizing(false);
      try {
        sessionStorage.setItem(SS_SIZE, JSON.stringify(next));
      } catch {
        /* opslag geweigerd */
      }
      // De positie die tijdens het slepen is bereikt vastleggen (niet de oude).
      if (anchored && nextPos) panelDrag.setPosition(nextPos);
    };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  // Grootte binnen het scherm houden wanneer het venster kleiner wordt.
  useEffect(() => {
    const onResize = () => setSize((s) => (s ? clampSize(s.w, s.h) : s));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Bij openen: het venster verschijnt bij de gesleepte bubbel, netjes in beeld.
  const launcherPosRef = useRef<Pos | null>(null);
  launcherPosRef.current = launcherDrag.pos;
  const panelPosRef = useRef<Pos | null>(null);
  panelPosRef.current = panelDrag.pos;
  const sizeRef = useRef<{ w: number; h: number } | null>(null);
  sizeRef.current = size;
  useEffect(() => {
    if (!open || isMobile) return;
    const bubble = launcherPosRef.current;
    if (!bubble) return;
    const w = sizeRef.current?.w ?? 380;
    const h = sizeRef.current?.h ?? Math.min(560, Math.round(window.innerHeight * 0.85));
    const anchored = anchorToBubble(bubble, w, h);
    setPopOrigin(anchored.origin);
    panelDrag.setPosition({ x: anchored.x, y: anchored.y });
    // Alleen bij het openen herpositioneren, daarna mag de bezoeker vrij slepen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isMobile]);





  // Meldingen: voorkeur onthouden en alleen tonen wanneer toegestaan.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem("maxim.chat.notify") === "1" && Notification?.permission === "granted")
      setNotify(true);
  }, []);

  async function toggleNotify() {
    if (typeof window === "undefined" || typeof Notification === "undefined") return;
    if (notify) {
      setNotify(false);
      localStorage.removeItem("maxim.chat.notify");
      return;
    }
    const perm =
      Notification.permission === "granted"
        ? "granted"
        : await Notification.requestPermission().catch(() => "denied");
    if (perm === "granted") {
      setNotify(true);
      localStorage.setItem("maxim.chat.notify", "1");
    }
  }

  // Tabtitel: zolang er ongelezen antwoorden zijn, roept het tabblad om aandacht.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const original = document.title;
    if (unread > 0) document.title = `(${unread}) ${c.tabAlert}`;
    const onFocus = () => {
      document.title = original;
    };
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.title = original;
    };
  }, [unread, c.tabAlert]);

  const avatar = useMemo(() => pickAvatar(messages), [messages]);

  useEffect(() => {
    if (forceOpen) setOpen(true);
  }, [forceOpen]);

  useEffect(() => {
    if (!open || messages.length !== 0) return;
    if (animalName) {
      setMessages([{ role: "assistant", content: formatT(t("qr.greeting"), { name: animalName }) }]);
      return;
    }
    // Begroeting met live weer en dagdeel; valt terug op de vaste tekst.
    setMessages([{ role: "assistant", content: GREETING[lang] ?? GREETING.nl }]);
    void (async () => {
      try {
        const res = await fetch("/api/weather");
        if (!res.ok) return;
        const w = (await res.json()) as {
          temperature?: number;
          condition?: Record<string, string>;
        };
        if (typeof w.temperature !== "number") return;
        const condition = w.condition?.[lang] ?? w.condition?.nl ?? "";
        setMessages((prev) =>
          prev.length === 1 && prev[0]?.role === "assistant"
            ? [{ role: "assistant", content: buildGreeting(lang, { temperature: w.temperature!, condition }) }]
            : prev,
        );
      } catch {
        /* stille terugval op de vaste begroeting */
      }
    })();
  }, [open, animalName, messages.length, t, lang]);


  streamingRef.current = streaming;

  // Slim scrollen: zodra Maxims nieuwste antwoord start (of klaar is), komt de
  // bovenkant van dat bericht netjes in beeld — de lezer begint meteen bij de
  // eerste zin in plaats van onderaan te worden gedropt.
  useEffect(() => {
    const sc = scrollRef.current;
    if (!sc) return;
    const bubbles = sc.querySelectorAll<HTMLElement>("[data-maxim-msg]");
    const el = bubbles[bubbles.length - 1];
    if (!el) return;
    // Enkel bij de start of de afronding van een antwoord uitlijnen, niet bij
    // elke stream-update; en alleen zolang de lezer niet handmatig terugbladert.
    const key = `${messages.length}:${streaming ? "stream" : "done"}`;
    if (!stickRef.current || alignedRef.current === key) return;
    alignedRef.current = key;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [messages, streaming]);

  // Handmatige override tijdens het streamen: wie terug naar boven bladert om
  // eerdere berichten te herlezen, wordt niet onderbroken. Zodra de lezer weer
  // onderaan zit (of een nieuwe vraag stuurt), leest de chat automatisch mee.
  useEffect(() => {
    const sc = scrollRef.current;
    if (!sc) return;
    const onScroll = () => {
      const prev = lastTopRef.current;
      lastTopRef.current = sc.scrollTop;
      if (!streamingRef.current) return;
      if (sc.scrollTop < prev - 2) {
        stickRef.current = false;
      } else if (sc.scrollHeight - sc.scrollTop - sc.clientHeight < 48) {
        stickRef.current = true;
      }
    };
    sc.addEventListener("scroll", onScroll, { passive: true });
    return () => sc.removeEventListener("scroll", onScroll);
  }, []);
  // Idle timer — minimise after inactivity
  const bumpIdle = () => {
    if (idleRef.current) clearTimeout(idleRef.current);
    if (!open || streaming || fullscreen) return;
    idleRef.current = setTimeout(() => setOpen(false), IDLE_MS);
  };
  useEffect(() => {
    bumpIdle();
    return () => {
      if (idleRef.current) clearTimeout(idleRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, streaming, messages, input]);

  // Wachtrij: een vraag die pas verstuurd wordt nadat eerdere berichten
  // (bv. de Google Maps-link bij live locatie) in het gesprek staan.
  useEffect(() => {
    if (!queued || streaming) return;
    const text = queued;
    setQueued(null);
    void send(text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queued, streaming]);

  /** Live locatie delen via de browser, met een warme terugvalvraag. */
  function shareLocation(label: string) {
    const copy = GEO_COPY[lang] ?? GEO_COPY.nl;
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setMessages((prev) => [
        ...prev,
        { role: "user", content: label },
        { role: "assistant", content: copy.fallback },
      ]);
      setChipSet("origin");
      return;
    }
    setMessages((prev) => [...prev, { role: "user", content: label }]);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(5);
        const lng = pos.coords.longitude.toFixed(5);
        const link = `https://www.google.com/maps/dir/?api=1&origin=${lat},${lng}&destination=Schipperijkaai+2+1000+Brussel`;
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `${copy.gotIt} [${copy.mapsLabel}](${link})` },
        ]);
        setChipSet("transit");
        setQueued(copy.ask(lat, lng));
      },
      () => {
        setMessages((prev) => [...prev, { role: "assistant", content: copy.fallback }]);
        setChipSet("origin");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }

  // Zodat externe verzoeken (weerbadge) een vraag kunnen versturen.
  useEffect(() => {
    sendRef.current = (text?: string) => {
      void send(text);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  });

  async function send(override?: string, quickId?: QuickActionId) {
    const text = (override ?? input).trim();
    if (streaming) return;
    if (!text && !pendingImage) return;
    if (!override) setInput("");
    lastSentRef.current = text;
    // Een nieuwe vraag betekent: de chat leest weer mee vanaf de volgende reactie.
    stickRef.current = true;
    setTypingLine(randomTypingLine(lang));
    setError(null);

    // Snelkoppelingen met een vast antwoord: onmiddellijk tonen, geen API-call.
    if (quickId) {
      setChipSet(nextChipSet(quickId));

      // Live locatie delen: de browser vraagt toestemming, daarna gaat de vraag
      // met coördinaten naar Maxim.
      if (quickId === "geoloc") {
        shareLocation(text);
        return;
      }

      // Live MIVB/NMBS-tijden komen van onze eigen server, niet van het taalmodel.
      if (quickId === "metrowait") {
        setMessages((prev) => [...prev, { role: "user", content: text }]);
        setStreaming(true);
        try {
          const res = await fetch(`/api/transit?lang=${lang}`);
          const data = (await res.json()) as { markdown?: string };
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: data.markdown ?? TRANSIT_FALLBACK[lang] },
          ]);
        } catch {
          setMessages((prev) => [...prev, { role: "assistant", content: TRANSIT_FALLBACK[lang] }]);
        } finally {
          setStreaming(false);
        }
        return;
      }

      const instant = instantAnswer(quickId, lang, {
        address: contactAddressLine(siteContact),
        phone: siteContact.phone,
        email: siteContact.email,
      });
      if (instant) {
        setMessages((prev) => [
          ...prev,
          { role: "user", content: text },
          { role: "assistant", content: instant },
        ]);
        return;
      }
    }


    const parts: ContentPart[] = [];
    if (pendingImage) parts.push({ type: "image", image: pendingImage });
    if (text) parts.push({ type: "text", text });
    const userMsg: Msg = pendingImage
      ? { role: "user", content: parts }
      : { role: "user", content: text };
    setPendingImage(null);

    const nextHistory: Msg[] = [...messages, userMsg];
    setMessages([...nextHistory, { role: "assistant", content: "" }]);
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await authFetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextHistory, animalId, lang, currentRoute }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const txt = await res.text().catch(() => "");
        if (res.status === 429) setError(t("chat.err.rate"));
        else if (res.status === 401) setError(lang === "fr" ? "Connectez-vous pour discuter avec Maxim." : lang === "en" ? "Sign in to chat with Maxim." : "Log in om met Maxim te chatten.");
        else if (res.status === 402) setError(t("chat.err.credits"));
        else setError(txt || t("chat.err.generic"));
        setMessages(nextHistory);
        setStreaming(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages([...nextHistory, { role: "assistant", content: acc }]);
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setError(t("chat.err.generic"));
        setMessages(nextHistory);
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
      notifyReply();
      if (!openRef.current || (typeof document !== "undefined" && document.hidden)) {
        setUnread((n) => n + 1);
        playChime();
      }
    }
  }

  /** Warm belletje bij een nieuw antwoord; stil wanneer de browser het weigert. */
  function playChime() {
    try {
      const Ctx =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const now = ctx.currentTime;
      [660, 880].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, now + i * 0.16);
        gain.gain.exponentialRampToValueAtTime(0.07, now + i * 0.16 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.16 + 0.34);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + i * 0.16);
        osc.stop(now + i * 0.16 + 0.36);
      });
      window.setTimeout(() => void ctx.close().catch(() => {}), 900);
    } catch {
      /* autoplay geweigerd */
    }
  }

  /** Melding wanneer het antwoord binnenkomt terwijl het tabblad niet actief is. */
  function notifyReply() {
    if (!notify || typeof Notification === "undefined") return;
    if (Notification.permission !== "granted") return;
    if (typeof document !== "undefined" && !document.hidden) return;
    try {
      new Notification(animalName ?? "Maxim", {
        body: c.newReply,
        icon: "/icon-192.png",
        tag: "maxim-chat",
      });
    } catch {
      /* melding niet mogelijk */
    }
  }

  function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/")) return;
    if (f.size > 6 * 1024 * 1024) {
      setError(c.photoTooLarge);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const data = typeof reader.result === "string" ? reader.result : null;
      if (data) setPendingImage(data);
    };
    reader.readAsDataURL(f);
  }

  async function toggleRecord() {
    if (recording) {
      mediaRef.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data);
      };
      mr.onstop = async () => {
        setRecording(false);
        stream.getTracks().forEach((t) => t.stop());
        const type = mr.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        chunksRef.current = [];
        if (blob.size < 2048) {
          setError(c.recordingTooShort);
          return;
        }
        setTranscribing(true);
        try {
          const fd = new FormData();
          const ext = type.includes("mp4") ? "mp4" : type.includes("mpeg") ? "mp3" : "webm";
          fd.append("file", blob, `recording.${ext}`);
          const res = await authFetch("/api/transcribe", { method: "POST", body: fd });
          if (!res.ok) {
            setError(c.transcribeFailed);
            return;
          }
          const { text } = (await res.json()) as { text?: string };
          if (text) setInput((prev) => (prev ? `${prev} ${text}` : text));
        } catch {
          setError(c.transcribeFailed);
        } finally {
          setTranscribing(false);
        }
      };
      mediaRef.current = mr;
      mr.start();
      setRecording(true);
    } catch {
      setError(c.noMic);
    }
  }

  const AvatarIcon = avatar.Icon;
  const Avatar = ({ size = 4 }: { size?: 4 | 5 }) =>
    AvatarIcon ? (
      <AvatarIcon className={size === 5 ? "h-5 w-5" : "h-4 w-4"} />
    ) : (
      <MLogo variant="white" className={size === 5 ? "h-5 w-auto" : "h-4 w-auto"} />
    );

  // Contextuele vervolgsuggesties bij het laatste antwoord van Maxim; wat al
  // aangeklikt is verdwijnt meteen uit de lijst.
  const lastMsg = messages[messages.length - 1];
  const lastAnswer =
    lastMsg && lastMsg.role !== "user" && !streaming ? renderMsg(lastMsg.content).text : "";
  const dockedSuggestions = lastAnswer
    ? suggestReplies(lastAnswer, lang)
        .filter((p) => !usedChips.includes(p.label))
        .slice(0, 3)
    : [];

  // Vóór hydratatie niets tekenen: zo herstellen we open-status en positie zonder flikkering.
  if (!hydrated) return null;


  if (!open) {
    const draggable = !isMobile;
    const style: React.CSSProperties =
      draggable && launcherDrag.pos
        ? { left: launcherDrag.pos.x, top: launcherDrag.pos.y, right: "auto", bottom: "auto" }
        : {};
    return (
      <button
        type="button"
        data-drag-host
        style={style}
        onPointerDown={draggable ? launcherDrag.onPointerDown : undefined}
        onClick={() => {
          if (launcherDrag.movedRef.current) {
            launcherDrag.movedRef.current = false;
            return;
          }
          setOpen(true);
        }}
        onDoubleClick={draggable ? launcherDrag.reset : undefined}
        title={draggable ? c.move : undefined}
        aria-label={t("chat.open")}
        className={
          "group fixed right-4 bottom-[calc(1.25rem+env(safe-area-inset-bottom))] z-[60] inline-flex transform-gpu touch-none [will-change:transform] items-center gap-3 rounded-full bg-[color:var(--color-terracotta)] px-4 py-3 text-sm font-semibold text-white shadow-[0_20px_50px_-15px_rgba(196,101,74,0.65)] ring-1 ring-white/30 transition-all hover:-translate-y-0.5 hover:shadow-[0_25px_60px_-15px_rgba(196,101,74,0.85)] sm:right-6 sm:bottom-6 sm:px-5 " +
          (launcherDrag.dragging ? "cursor-grabbing" : draggable ? "cursor-grab" : "")
        }
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-white/25">
          <Avatar />
        </span>
        <span className="hidden sm:inline">{animalName ?? "Maxim"}</span>
        {unread > 0 && (
          <span
            aria-label={`${unread} ${c.unreadLabel}`}
            className="absolute -top-1 -right-1 grid h-6 w-6 animate-pulse place-items-center rounded-full bg-red-600 text-xs font-bold text-white ring-2 ring-white"
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
    );
  }

  const desktopWindow = !isMobile && !fullscreen;
  const floating = desktopWindow && panelDrag.pos;
  const panelStyle: React.CSSProperties = {
    ...(floating
      ? {
          left: panelDrag.pos!.x,
          top: panelDrag.pos!.y,
          right: "auto",
          bottom: "auto",
        }
      : {}),
    ...(desktopWindow && size ? { width: size.w, height: size.h } : {}),
    ...(desktopWindow && !size ? { width: 380 } : {}),
    ...(desktopWindow && !resizing
      ? { transition: "width 120ms ease, height 120ms ease" }
      : {}),
    ...(desktopWindow ? { transformOrigin: popOrigin } : {}),
  };

  return (
    <div
      data-drag-host
      style={panelStyle}
      className={
        (fullscreen
          ? "fixed inset-2 z-[1000] transform-gpu [will-change:transform] sm:inset-6"
          : "fixed inset-x-3 bottom-3 z-50 max-h-[85dvh] transform-gpu pb-[env(safe-area-inset-bottom)] [will-change:transform] sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[380px] sm:min-w-[360px]") +
        (desktopWindow ? " maxim-pop" : "")
      }
      onMouseMove={bumpIdle}
      onKeyDown={bumpIdle}
    >
      {desktopWindow ? (
        <>
          {/* Sleepranden om het venster met de hand groter of kleiner te maken */}
          <div
            onPointerDown={(e) => startResize(e, "left")}
            title={c.resize}
            className="absolute top-6 bottom-6 -left-1 z-10 w-2.5 cursor-ew-resize touch-none rounded-full hover:bg-[color:var(--color-terracotta)]/25"
          />
          <div
            onPointerDown={(e) => startResize(e, "top")}
            title={c.resize}
            className="absolute -top-1 right-6 left-6 z-10 h-2.5 cursor-ns-resize touch-none rounded-full hover:bg-[color:var(--color-terracotta)]/25"
          />
          <div
            onPointerDown={(e) => startResize(e, "corner")}
            title={c.resize}
            className="absolute -top-1 -left-1 z-20 h-5 w-5 cursor-nwse-resize touch-none rounded-tl-3xl hover:bg-[color:var(--color-terracotta)]/30"
          />
        </>
      ) : null}
      <div
        className={
          "flex flex-col overflow-hidden rounded-3xl border border-[color:var(--color-apricot)]/40 bg-white/95 shadow-[0_30px_80px_-20px_rgba(74,103,65,0.35)] backdrop-blur-lg dark:border-border dark:bg-card/95 " +
          (fullscreen || (desktopWindow && size) ? "h-full" : "max-h-[85dvh]")
        }
      >

        {/* Header — sleepgreep op desktop */}
        <div
          onPointerDown={!isMobile && !fullscreen ? panelDrag.onPointerDown : undefined}
          onDoubleClick={!isMobile && !fullscreen ? panelDrag.reset : undefined}
          className={
            "relative z-20 flex h-[76px] shrink-0 items-center justify-between gap-2 border-b border-border/60 bg-gradient-to-r from-[color:var(--color-terracotta)] to-[color:var(--color-apricot)] px-3 text-white shadow-md backdrop-blur-md select-none sm:px-4 " +
            (!isMobile && !fullscreen

              ? panelDrag.dragging
                ? "cursor-grabbing touch-none"
                : "cursor-grab touch-none"
              : "")
          }
        >
          <div className="flex min-w-0 items-center gap-2.5">
            {!isMobile && !fullscreen ? (
              <GripVertical className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
            ) : null}
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/25 ring-2 ring-white/40">
              <Avatar size={5} />
            </span>
            <div className="flex min-w-0 flex-col items-start gap-1">
              <p className="truncate font-serif text-lg italic">
                {animalName ? `${animalName}` : "Maxim"}
              </p>
              <p className="truncate text-[10px] tracking-[0.2em] uppercase opacity-80">
                {animalName ? animalName.toUpperCase() : "MAXIM"} · {c.guide}
              </p>
              <span
                title={(PRIVACY_BADGE[lang] ?? PRIVACY_BADGE.nl).tooltip}
                className="inline-flex max-w-full cursor-help items-center gap-1.5 whitespace-nowrap rounded-full border border-[color:var(--color-terracotta)]/50 bg-[color:var(--color-terracotta)]/90 px-3 py-1 text-[11px] font-semibold tracking-wide text-white shadow-sm"
              >
                <img
                  src={euriaLogoAsset.url}
                  alt=""
                  className="h-4 w-4 shrink-0 rounded-md object-cover"
                />
                {(PRIVACY_BADGE[lang] ?? PRIVACY_BADGE.nl).label}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              onClick={() => void toggleNotify()}
              aria-label={notify ? c.notifyOff : c.notifyOn}
              title={notify ? c.notifyOff : c.notifyOn}
              aria-pressed={notify}
              className="grid min-h-[44px] min-w-[44px] place-items-center rounded-full hover:bg-white/20"
            >
              {notify ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => setFullscreen((f) => !f)}
              aria-label={fullscreen ? c.exitFullscreen : c.fullscreen}
              title={fullscreen ? c.exitFullscreen : c.fullscreen}
              className="grid min-h-[44px] min-w-[44px] place-items-center rounded-full hover:bg-white/20"
            >
              {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => {
                // Antwoord blijft doorlopen op de achtergrond; de bubbel meldt het.
                setFullscreen(false);
                setOpen(false);
              }}
              aria-label={t("chat.close")}
              className="grid min-h-[44px] min-w-[44px] place-items-center rounded-full hover:bg-white/20"
            >
              <Minus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className={
            "flex-1 overflow-y-auto overscroll-contain bg-[color:var(--surface-page)]/60 px-4 py-4 text-sm dark:bg-slate-950/40 " +
            (fullscreen ? "min-h-0" : "h-[min(20rem,50dvh)] sm:h-80")
          }
        >
          {messages.map((m, i) => {
            const raw = renderMsg(m.content);
            const wantsCompost = m.role !== "user" && raw.text.includes("[[compost-checker]]");
            const withoutCompost = wantsCompost
              ? raw.text.replace(/\[\[compost-checker\]\]/g, "").trim()
              : raw.text;
            // Enkel echte foto's uit het statische manifest — nooit AI-beelden.
            const explicitRoute = m.role === "user" ? null : extractRouteMarker(withoutCompost);
            // Vangnet: zonder [[route:…]] leiden we het vertrekpunt af uit de vraag ervoor.
            const askedBefore = i > 0 && messages[i - 1]?.role === "user" ? renderMsg(messages[i - 1]!.content).text : "";
            const inferredStart =
              m.role === "user" || explicitRoute || !askedBefore ? null : inferRouteStart(askedBefore);
            const routeMarker =
              explicitRoute ?? (inferredStart ? { clean: withoutCompost, start: inferredStart } : null);
            const withoutRoute = routeMarker ? routeMarker.clean : withoutCompost;
            const marker = m.role === "user" ? null : extractAssetMarker(withoutRoute, farmAssets ?? FARM_ASSETS);
            const text = marker ? marker.clean : withoutRoute;
            const farmAsset =
              m.role === "user" || !text ? null : (marker?.asset ?? findFarmAsset(text, farmAssets ?? FARM_ASSETS));
            const image = raw.image;

            const isUser = m.role === "user";
            return (
              <div
                key={i}
                data-maxim-msg={isUser ? undefined : ""}
                className={isUser ? "mb-3 flex justify-end" : "mb-3 flex justify-start"}
              >
                <div
                  className={
                    isUser
                      ? "max-w-[85%] self-end rounded-2xl rounded-br-xs bg-emerald-600 px-4 py-2.5 text-sm text-white shadow-sm"
                      : "max-w-[88%] self-start space-y-2 rounded-2xl rounded-bl-xs border border-slate-700/80 bg-slate-800/95 px-4 py-3 text-sm text-slate-100 shadow-md"
                  }
                >

                  {image && (
                    <ZoomableImage
                      src={image}
                      alt=""
                      className="mb-2 max-h-40 rounded-lg object-cover"
                      onError={handleImageError}
                    />
                  )}
                  {isUser ? (
                    <span className="whitespace-pre-wrap">{text}</span>
                  ) : text ? (
                    <ChatMarkdown>{text}</ChatMarkdown>
                  ) : streaming && i === messages.length - 1 ? (
                    <span className="flex items-center gap-2 py-1 text-xs italic text-muted-foreground">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[color:var(--color-terracotta)]" />
                      {typingLine}
                    </span>
                  ) : null}
                  {wantsCompost && !streaming ? <CompostChecker /> : null}

                  {!isUser && !streaming && text ? (
                    <div className="flex flex-wrap items-center gap-1">
                      <SpeakButton
                        text={text}
                        lang={lang}
                        autoPlay={autoSpeak && i === messages.length - 1}
                      />
                    </div>
                  ) : null}

                  {!isUser && !streaming && text && isPrintable(text) ? (
                    <div className="flex flex-wrap items-center gap-1">
                      <PrintItineraryButton text={text} lang={lang} />
                      <EmailAnswerButton text={text} lang={lang} />
                    </div>
                  ) : null}

                  {!isUser && !streaming && routeMarker ? (
                    <ChatRouteMap start={routeMarker.start} lang={lang} />
                  ) : null}

                  {!isUser && !streaming && !routeMarker && text && isTransitAnswer(text) ? (
                    <MapsLinkButton lang={lang} />
                  ) : null}

                  {!isUser && !streaming && i === messages.length - 1 && text
                    ? (() => {
                        const card = detectMaximCard(lastUserText(messages), text);
                        return card ? (
                          <MaximInlineCard
                            card={card}
                            lang={lang}
                            context={lastUserText(messages)}
                          />
                        ) : null;
                      })()
                    : null}

                  {!isUser && !streaming && farmAsset ? (
                    <FarmAssetCard
                      asset={farmAsset}
                      lang={lang}
                      onAsk={(q) => void send(q)}
                    />
                  ) : null}

                  {!isUser && !streaming && text && isSchedule(text) ? (
                    <CalendarExportButton text={text} lang={lang} />
                  ) : null}

                  {/* Vervolgsuggesties staan gedokt boven het invoerveld. */}

                </div>
              </div>
            );
          })}
          {error && (
            <div className="mt-2 rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <p>{error}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void send(lastSentRef.current)}
                  disabled={!lastSentRef.current || streaming}
                  className="rounded-full bg-destructive px-3 py-1 font-semibold text-white disabled:opacity-50"
                >
                  {RETRY_COPY[lang].retry}
                </button>
                <a
                  href="tel:+3223315391"
                  className="rounded-full bg-card px-3 py-1 font-semibold text-foreground ring-1 ring-border dark:bg-muted dark:text-foreground dark:ring-border"
                >
                  {RETRY_COPY[lang].call} +32 2 331 53 91
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Contextuele vervolgsuggesties, gedokt boven het invoerveld */}
        {dockedSuggestions.length > 0 ? (
          <div className="flex shrink-0 flex-wrap gap-2 border-t border-border/60 bg-card px-2 pt-2">
            {dockedSuggestions.map((p) => (
              <button
                key={p.label}
                type="button"
                disabled={streaming || transcribing}
                onClick={() => {
                  setUsedChips((u) => [...u, p.label]);
                  void send(p.send);
                }}
                className="rounded-full border border-slate-700 bg-slate-800/90 px-3 py-1.5 text-xs text-slate-200 transition-all hover:border-emerald-500 disabled:opacity-40"
              >
                {p.label}
              </button>
            ))}
          </div>
        ) : null}

        {/* Snelle acties */}
        <ChipScroller
          key={chipSet}
          className="shrink-0 border-t border-border/60 bg-card motion-safe:animate-[chip-in_260ms_ease-out] dark:bg-card"
        >
          {chipsFor(chipSet)
            .filter((q) => !usedChips.includes(q.id))
            .map((q) => (
            <button
              key={q.id}
              type="button"
              disabled={streaming || transcribing}
              onClick={() => {
                setUsedChips((u) => [...u, q.id]);
                void send(q.label[lang], q.id);
              }}
              className={
                "inline-flex min-h-[44px] shrink-0 items-center whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold disabled:opacity-40 " +
                (q.id === "geoloc"
                  ? "border-primary bg-primary text-primary-foreground hover:opacity-90"
                  : "border-slate-300 bg-slate-200 text-slate-800 hover:bg-[color:var(--color-apricot)]/40 dark:border-border dark:bg-muted dark:text-slate-200 dark:hover:bg-slate-700")
              }

            >
              {q.label[lang]}
            </button>
          ))}
        </ChipScroller>


        {/* Composer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="shrink-0 bg-card p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] dark:bg-card"
        >
          {pendingImage && (
            <div className="mb-2 flex items-center gap-2 rounded-xl bg-[color:var(--surface-page)]/70 p-1.5">
              <img
                loading="lazy"
                decoding="async"
                src={pendingImage}
                alt=""
                className="h-12 w-12 rounded-md object-cover"
                onError={handleImageError}
              />
              <span className="text-[11px] text-slate-600 dark:text-slate-300">{c.photoReady}</span>
              <button
                type="button"
                onClick={() => setPendingImage(null)}
                aria-label={c.removePhoto}
                className="ml-auto grid h-7 w-7 place-items-center rounded-full hover:bg-black/5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onPickImage}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={streaming || transcribing}
              aria-label={c.addPhoto}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-foreground/90 hover:bg-[color:var(--surface-page)] hover:text-[color:var(--color-terracotta)] disabled:opacity-40 transition-colors"
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={toggleRecord}
              disabled={streaming || transcribing}
              aria-label={recording ? c.stopRecording : c.recordVoice}
              className={
                "grid h-10 w-10 shrink-0 place-items-center rounded-full transition-colors disabled:opacity-40 " +
                (recording
                  ? "bg-red-500 text-white animate-pulse"
                  : "text-foreground/90 hover:bg-[color:var(--surface-page)] hover:text-[color:var(--color-terracotta)]")
              }
            >
              <Mic className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() =>
                setAutoSpeak((v) => {
                  if (v) stopSpeaking();
                  return !v;
                })
              }
              aria-pressed={autoSpeak}
              aria-label={autoSpeak ? c.autoSpeakOff : c.autoSpeakOn}
              title={autoSpeak ? c.autoSpeakOff : c.autoSpeakOn}
              className={
                "grid h-10 w-10 shrink-0 place-items-center rounded-full transition-colors " +
                (autoSpeak
                  ? "bg-[color:var(--color-terracotta)] text-white"
                  : "text-foreground/90 hover:bg-[color:var(--surface-page)] hover:text-[color:var(--color-terracotta)]")
              }
            >
              {autoSpeak ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                transcribing
                  ? c.transcribing
                  : recording
                    ? c.listening
                    : streaming
                      ? t("chat.busy")
                      : t("chat.placeholder")
              }
              disabled={streaming || transcribing}
              className="min-h-[40px] flex-1 min-w-0 rounded-full bg-slate-100 px-4 text-base sm:text-sm text-foreground outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-[color:var(--color-apricot)] disabled:opacity-50 dark:bg-muted dark:text-foreground dark:placeholder:text-slate-500"
            />
            <button
              type="submit"
              disabled={streaming || transcribing || (!input.trim() && !pendingImage)}
              aria-label={t("chat.send")}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[color:var(--color-terracotta)] text-white shadow-md hover:bg-[color:var(--surface-forest)] disabled:opacity-50 transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
