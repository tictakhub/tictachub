/* Tiny WebAudio synth — no assets, just oscillators. */

let ctx: AudioContext | null = null;
let muted = false;

export function setSoundMuted(value: boolean) {
  muted = value;
}

export function isSoundMuted() {
  return muted;
}

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

interface ToneOpts {
  freq: number;
  dur?: number;
  type?: OscillatorType;
  vol?: number;
  at?: number;
  slideTo?: number;
}

function tone({ freq, dur = 0.12, type = "sine", vol = 0.07, at = 0, slideTo }: ToneOpts) {
  if (muted) return;
  const c = getCtx();
  if (!c) return;
  try {
    const t0 = c.currentTime + at;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  } catch {
    /* audio unavailable — stay silent */
  }
}

export const sfx = {
  move(player: "X" | "O") {
    if (player === "X") tone({ freq: 620, slideTo: 890, dur: 0.1});

    else tone({ freq: 460, slideTo: 640, dur: 0.11 });
  },
  win() {
    // little arpeggio, timed with the strike-through line
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
      tone({ freq: f, dur: 0.17, at: 0.42 + i * 0.09, type: "triangle", vol: 0.1 })
    );
  },
  draw() {
    tone({ freq: 330, dur: 0.16, at: 0.12, type: "triangle", vol: 0.07 });
    tone({ freq: 262, dur: 0.3, at: 0.26, type: "triangle", vol: 0.06 });
  },
  ui() {
    tone({ freq: 760, dur: 0.06, vol: 0.045 });
  },
};
