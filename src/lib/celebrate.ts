/**
 * Kleine, afhankelijkheidsvrije feestelijke effecten voor de Academy.
 * Respecteert altijd "beperk beweging" uit de systeeminstellingen.
 */

type Deeltje = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vrot: number;
  kleur: string;
  grootte: number;
  leven: number;
};

const KLEUREN = ["#2f8f4e", "#e2703a", "#f2c14e", "#7fb069", "#d64545", "#3d7ea6"];

function beperkBeweging(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Confettiregen vanaf een punt (0..1 van het scherm).
 * `kracht` bepaalt hoeveel deeltjes er vliegen: klein feestje of groot feest.
 */
export function confetti(opties: { x?: number; y?: number; aantal?: number } = {}) {
  if (typeof document === "undefined" || beperkBeweging()) return;

  const canvas = document.createElement("canvas");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.style.cssText =
    "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999";
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return;
  }
  ctx.scale(dpr, dpr);

  const startX = (opties.x ?? 0.5) * window.innerWidth;
  const startY = (opties.y ?? 0.45) * window.innerHeight;
  const aantal = opties.aantal ?? 90;

  const deeltjes: Deeltje[] = Array.from({ length: aantal }, () => {
    const hoek = Math.random() * Math.PI * 2;
    const snelheid = 4 + Math.random() * 8;
    return {
      x: startX,
      y: startY,
      vx: Math.cos(hoek) * snelheid,
      vy: Math.sin(hoek) * snelheid - 4,
      rot: Math.random() * Math.PI,
      vrot: (Math.random() - 0.5) * 0.3,
      kleur: KLEUREN[Math.floor(Math.random() * KLEUREN.length)],
      grootte: 5 + Math.random() * 6,
      leven: 1,
    };
  });

  let frame = 0;
  const tick = () => {
    frame++;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    let levend = false;
    for (const p of deeltjes) {
      p.vy += 0.28; // zwaartekracht
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vrot;
      p.leven -= 0.008;
      if (p.leven <= 0 || p.y > window.innerHeight + 40) continue;
      levend = true;
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.leven);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.kleur;
      ctx.fillRect(-p.grootte / 2, -p.grootte / 4, p.grootte, p.grootte / 2);
      ctx.restore();
    }
    if (levend && frame < 260) requestAnimationFrame(tick);
    else canvas.remove();
  };
  requestAnimationFrame(tick);
}

/** Groot slotfeest, bv. bij een behaald diploma. */
export function confettiRegen() {
  if (beperkBeweging()) return;
  confetti({ x: 0.2, y: 0.3, aantal: 70 });
  window.setTimeout(() => confetti({ x: 0.8, y: 0.3, aantal: 70 }), 220);
  window.setTimeout(() => confetti({ x: 0.5, y: 0.25, aantal: 110 }), 460);
}

/** Kort, vrolijk toontje bij een juist antwoord (kinderen). */
export function blijGeluid() {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const noten = [523.25, 659.25, 783.99];
    noten.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + i * 0.09 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.09 + 0.18);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.09);
      osc.stop(ctx.currentTime + i * 0.09 + 0.2);
    });
    window.setTimeout(() => void ctx.close(), 900);
  } catch {
    /* geluid is optioneel */
  }
}
