/**
 * Tiny synthesised sound kit (WebAudio) — no audio files to download.
 * Sound is OFF by default; the speaker toggle turns it on. Browsers only allow
 * audio after a user gesture, which the toggle click provides.
 */

export type Cue = "snip" | "pop" | "paper" | "thud" | "knock" | "click" | "chime" | "swoosh" | "slurp" | "walk" | "door";

const STORAGE_KEY = "anu-sound";

let ctx: AudioContext | null = null;
let enabled = false;
const listeners = new Set<() => void>();

function audio() {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export const isSoundEnabled = () => enabled;

export function subscribeSound(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function setSoundEnabled(on: boolean) {
  enabled = on;
  try {
    localStorage.setItem(STORAGE_KEY, on ? "1" : "0");
  } catch {
    /* storage blocked — fine, it just won't be remembered */
  }
  if (on) audio();
  listeners.forEach((fn) => fn());
}

/** Restore the visitor's last choice (call once on the client). */
export function loadSoundPreference() {
  try {
    if (localStorage.getItem(STORAGE_KEY) === "1") {
      enabled = true;
      listeners.forEach((fn) => fn());
    }
  } catch {
    /* ignore */
  }
}

// ── building blocks ─────────────────────────────────────────────────────────

function noiseBuffer(ac: AudioContext, seconds: number) {
  const buf = ac.createBuffer(1, Math.ceil(ac.sampleRate * seconds), ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

function noise(
  ac: AudioContext,
  { at = 0, dur, type, freq, q = 1, gain, sweepTo }: {
    at?: number; dur: number; type: BiquadFilterType; freq: number; q?: number; gain: number; sweepTo?: number;
  },
) {
  const t = ac.currentTime + at;
  const src = ac.createBufferSource();
  src.buffer = noiseBuffer(ac, dur);
  const f = ac.createBiquadFilter();
  f.type = type;
  f.frequency.setValueAtTime(freq, t);
  if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
  f.Q.value = q;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + Math.min(0.01, dur / 4));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(ac.destination);
  src.start(t);
  src.stop(t + dur + 0.02);
}

function tone(
  ac: AudioContext,
  { at = 0, dur, freq, type = "sine", gain, slideTo }: {
    at?: number; dur: number; freq: number; type?: OscillatorType; gain: number; slideTo?: number;
  },
) {
  const t = ac.currentTime + at;
  const o = ac.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ac.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

// ── cues ────────────────────────────────────────────────────────────────────

const CUES: Record<Cue, (ac: AudioContext) => void> = {
  snip: (ac) => {
    noise(ac, { dur: 0.05, type: "highpass", freq: 3500, gain: 0.35 });
    noise(ac, { at: 0.18, dur: 0.05, type: "highpass", freq: 3800, gain: 0.3 });
  },
  pop: (ac) => tone(ac, { dur: 0.12, freq: 520, slideTo: 980, gain: 0.25 }),
  paper: (ac) => noise(ac, { dur: 0.28, type: "bandpass", freq: 1800, sweepTo: 600, q: 0.7, gain: 0.22 }),
  thud: (ac) => {
    tone(ac, { dur: 0.25, freq: 120, slideTo: 55, gain: 0.5 });
    noise(ac, { dur: 0.08, type: "lowpass", freq: 600, gain: 0.25 });
  },
  knock: (ac) => {
    tone(ac, { dur: 0.09, freq: 300, type: "triangle", gain: 0.35 });
    tone(ac, { at: 0.12, dur: 0.09, freq: 260, type: "triangle", gain: 0.3 });
  },
  click: (ac) => noise(ac, { dur: 0.03, type: "bandpass", freq: 2500, q: 3, gain: 0.4 }),
  chime: (ac) => {
    [880, 1318.5, 1760].forEach((f, i) => tone(ac, { at: i * 0.09, dur: 0.9, freq: f, gain: 0.12 }));
  },
  swoosh: (ac) => noise(ac, { dur: 0.45, type: "bandpass", freq: 400, sweepTo: 2400, q: 1.2, gain: 0.18 }),
  slurp: (ac) => slurp(ac),
  walk: (ac) => walk(ac),
  door: (ac) => {
    // Wooden door: latch click, a soft creak, then a little shop bell.
    noise(ac, { dur: 0.04, type: "bandpass", freq: 1800, q: 4, gain: 0.35 });
    tone(ac, { at: 0.06, dur: 0.5, freq: 180, slideTo: 260, type: "sawtooth", gain: 0.035 });
    [1568, 2093].forEach((f, i) => tone(ac, { at: 0.3 + i * 0.12, dur: 0.8, freq: f, gain: 0.08 }));
  },
};

/**
 * Footsteps for the ~2 s walk to the store: heel thump + a gritty scuff,
 * alternating left/right, slightly uneven like a real stroll.
 */
function walk(ac: AudioContext) {
  const STEPS = 7;
  for (let i = 0; i < STEPS; i++) {
    const at = 0.12 + i * 0.27 + (Math.random() - 0.5) * 0.03;
    const t = ac.currentTime + at;
    // Fade in from afar, out as we arrive.
    const level = Math.sin(((i + 0.5) / STEPS) * Math.PI) * 0.8 + 0.2;
    const pan = ac.createStereoPanner();
    pan.pan.value = i % 2 ? 0.25 : -0.25;
    pan.connect(ac.destination);

    // Heel: a short low thump.
    const o = ac.createOscillator();
    o.frequency.setValueAtTime(95, t);
    o.frequency.exponentialRampToValueAtTime(50, t + 0.09);
    const og = ac.createGain();
    og.gain.setValueAtTime(0.0001, t);
    og.gain.exponentialRampToValueAtTime(0.5 * level, t + 0.006);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
    o.connect(og).connect(pan);
    o.start(t);
    o.stop(t + 0.12);

    // Sole scuffing grit on the pavement.
    const src = ac.createBufferSource();
    src.buffer = noiseBuffer(ac, 0.12);
    const f = ac.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 900 + Math.random() * 500;
    f.Q.value = 0.9;
    const ng = ac.createGain();
    ng.gain.setValueAtTime(0.0001, t + 0.01);
    ng.gain.exponentialRampToValueAtTime(0.22 * level, t + 0.025);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    src.connect(f).connect(ng).connect(pan);
    src.start(t + 0.01);
    src.stop(t + 0.14);
  }
}

/**
 * A slurp is air sucked across a liquid surface: turbulent noise that flutters
 * irregularly (bubbles), with a resonance that rises as the sip draws in, a
 * low "liquid" body, then a swallow.
 */
function slurp(ac: AudioContext) {
  const t0 = ac.currentTime;
  const DUR = 0.72;
  const sr = ac.sampleRate;
  const buf = ac.createBuffer(1, Math.ceil(sr * DUR), sr);
  const data = buf.getChannelData(0);

  // Bubbling: amplitude jumps to a new random level ~35 times a second, smoothed.
  let level = 0.5;
  let target = 0.5;
  let nextJump = 0;
  for (let i = 0; i < data.length; i++) {
    const t = i / sr;
    if (t >= nextJump) {
      target = 0.15 + Math.random() * 0.85;
      nextJump = t + 0.015 + Math.random() * 0.03;
    }
    level += (target - level) * 0.004;
    // Overall shape: quick start, swelling draw, abrupt stop (lips close).
    const shape = t < 0.06 ? t / 0.06 : t < 0.6 ? 0.6 + 0.4 * ((t - 0.06) / 0.54) : Math.max(0, 1 - (t - 0.6) / 0.05);
    data[i] = (Math.random() * 2 - 1) * level * shape;
  }

  const src = ac.createBufferSource();
  src.buffer = buf;

  const hp = ac.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 280;

  // Airy suction band — its pitch rises through the sip.
  const air = ac.createBiquadFilter();
  air.type = "bandpass";
  air.Q.value = 2.2;
  air.frequency.setValueAtTime(900, t0);
  air.frequency.exponentialRampToValueAtTime(2600, t0 + 0.62);
  const airGain = ac.createGain();
  airGain.gain.value = 0.9;

  // Liquid body — a lower, resonant gurgle.
  const body = ac.createBiquadFilter();
  body.type = "bandpass";
  body.Q.value = 6;
  body.frequency.setValueAtTime(320, t0);
  body.frequency.exponentialRampToValueAtTime(520, t0 + 0.62);
  const bodyGain = ac.createGain();
  bodyGain.gain.value = 1.4;

  const out = ac.createGain();
  out.gain.value = 0.55;

  src.connect(hp);
  hp.connect(air).connect(airGain).connect(out);
  hp.connect(body).connect(bodyGain).connect(out);
  out.connect(ac.destination);
  src.start(t0);
  src.stop(t0 + DUR + 0.02);

  // Swallow: a soft low "gulp" just after the sip.
  tone(ac, { at: 0.82, dur: 0.13, freq: 240, slideTo: 75, gain: 0.45 });
  noise(ac, { at: 0.82, dur: 0.06, type: "lowpass", freq: 500, gain: 0.2 });
}

/** Play a cue if sound is on. Safe to call anywhere on the client. */
export function play(cue: Cue) {
  if (!enabled || typeof window === "undefined") return;
  try {
    CUES[cue](audio());
  } catch {
    /* audio unavailable — stay silent */
  }
}
