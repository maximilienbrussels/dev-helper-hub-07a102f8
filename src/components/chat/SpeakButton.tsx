/**
 * Audiogids-knop: leest een antwoord van Maxim hardop voor, zodat bezoekers
 * met volle handen (kinderen, buggy, tas) toch alles kunnen volgen.
 */
import { useEffect, useRef, useState } from "react";
import { Loader2, Square, Volume2 } from "lucide-react";

import type { Lang } from "@/lib/i18n";
import { speakText, stopSpeaking } from "@/lib/speak";

const COPY: Record<Lang, { play: string; stop: string; fail: string }> = {
  nl: { play: "Lees voor", stop: "Stop met voorlezen", fail: "Voorlezen lukte even niet." },
  fr: { play: "Lire à voix haute", stop: "Arrêter la lecture", fail: "La lecture a échoué." },
  en: { play: "Read aloud", stop: "Stop reading", fail: "Reading aloud failed." },
};

export function SpeakButton({
  text,
  lang,
  autoPlay = false,
}: {
  text: string;
  lang: Lang;
  autoPlay?: boolean;
}) {
  const c = COPY[lang] ?? COPY.nl;
  const [state, setState] = useState<"idle" | "playing" | "failed">("idle");
  const startedRef = useRef(false);

  async function play() {
    setState("playing");
    try {
      await speakText(text);
      setState("idle");
    } catch {
      setState("failed");
    }
  }

  function stop() {
    stopSpeaking();
    setState("idle");
  }

  useEffect(() => {
    if (!autoPlay || startedRef.current || !text) return;
    startedRef.current = true;
    void play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay, text]);

  useEffect(() => () => stopSpeaking(), []);

  return (
    <button
      type="button"
      onClick={state === "playing" ? stop : () => void play()}
      className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2 py-1 text-[11px] text-muted-foreground transition hover:bg-muted"
      title={state === "playing" ? c.stop : c.play}
      aria-label={state === "playing" ? c.stop : c.play}
    >
      {state === "playing" ? (
        <>
          <Square className="h-3 w-3" />
          {c.stop}
        </>
      ) : state === "failed" ? (
        <>
          <Volume2 className="h-3 w-3" />
          {c.fail}
        </>
      ) : (
        <>
          <Volume2 className="h-3 w-3" />
          {c.play}
        </>
      )}
    </button>
  );
}

export function SpeakLoading() {
  return <Loader2 className="h-3 w-3 animate-spin" />;
}
