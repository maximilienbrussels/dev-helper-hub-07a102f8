/**
 * Audiogids: laat een antwoord van Maxim hardop voorlezen.
 *
 * De browser vraagt de spraak op via onze eigen server (/api/speak) en speelt
 * de PCM-chunks (24 kHz, mono) meteen af met de Web Audio API, zodat het
 * voorlezen begint terwijl de rest nog binnenkomt. Er speelt altijd maar één
 * antwoord tegelijk.
 */

let currentStop: (() => void) | null = null;

/** Stop wat er nu wordt voorgelezen (indien iets speelt). */
export function stopSpeaking(): void {
  currentStop?.();
  currentStop = null;
}

/**
 * Leest `text` hardop voor. Resolvet wanneer alles is afgespeeld of gestopt.
 * Gooit een fout wanneer de spraakdienst niet bereikbaar is.
 */
export async function speakText(text: string): Promise<void> {
  if (typeof window === "undefined") return;
  stopSpeaking();

  const AudioCtx =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) throw new Error("no-audio");

  const ctx = new AudioCtx({ sampleRate: 24000 });
  if (ctx.state === "suspended") await ctx.resume().catch(() => {});

  const controller = new AbortController();
  const sources: AudioBufferSourceNode[] = [];
  let stopped = false;
  let playhead = 0;
  let pending = new Uint8Array(0);

  const cleanup = () => {
    stopped = true;
    controller.abort();
    for (const s of sources) {
      try {
        s.stop();
      } catch {
        /* al gestopt */
      }
    }
    void ctx.close().catch(() => {});
  };
  currentStop = cleanup;

  const playChunk = (incoming: Uint8Array) => {
    if (stopped) return;
    const bytes = new Uint8Array(pending.length + incoming.length);
    bytes.set(pending);
    bytes.set(incoming, pending.length);
    const usable = bytes.length - (bytes.length % 2);
    pending = bytes.slice(usable);
    if (usable === 0) return;
    const samples = new Int16Array(bytes.buffer, 0, usable / 2);
    const floats = Float32Array.from(samples, (s) => s / 32768);
    const buffer = ctx.createBuffer(1, floats.length, 24000);
    buffer.copyToChannel(floats, 0);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    playhead = playhead === 0 ? ctx.currentTime + 0.05 : Math.max(playhead, ctx.currentTime);
    source.start(playhead);
    playhead += buffer.duration;
    sources.push(source);
  };

  let res: Response;
  try {
    res = await fetch("/api/speak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    });
  } catch (err) {
    cleanup();
    if (currentStop === null && stopped) return;
    throw err;
  }

  if (!res.ok || !res.body) {
    cleanup();
    throw new Error(`speak-failed-${res.status}`);
  }

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffered = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffered += value;
      const lines = buffered.split("\n");
      buffered = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        let evt: { type?: string; audio?: string };
        try {
          evt = JSON.parse(payload) as { type?: string; audio?: string };
        } catch {
          continue;
        }
        if (evt.type !== "speech.audio.delta" || !evt.audio) continue;
        const binary = atob(evt.audio);
        const chunk = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) chunk[i] = binary.charCodeAt(i);
        playChunk(chunk);
      }
    }
  } catch {
    // Afgebroken door de bezoeker of netwerkfout: gewoon stoppen.
  }

  // Laat de reeds ingeplande audio uitspelen voor we de context sluiten.
  const remaining = Math.max(0, playhead - ctx.currentTime) * 1000 + 200;
  await new Promise<void>((resolve) => setTimeout(resolve, stopped ? 0 : remaining));
  if (currentStop === cleanup) {
    currentStop = null;
    if (!stopped) void ctx.close().catch(() => {});
  }
}
