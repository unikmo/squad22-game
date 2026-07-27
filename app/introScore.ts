/**
 * Cinematic score for the Squad22 cold open, synthesised in Web Audio.
 *
 * Everything is scheduled against the AudioContext clock in one pass, so the
 * music stays locked to the animation regardless of frame rate or main-thread
 * jank. Ships as zero bytes — no audio files to load or licence.
 *
 * Key: D minor moving to a D5 power chord on the logo hit. 120 BPM (beat = 0.5s)
 * so musical beats land on the animation beats in Intro.tsx.
 *
 * If you later licence a produced track, replace playScore() with an <audio>
 * element and keep the same cue times — the animation needs no changes.
 */

const BEAT = 0.5;

// D minor family, in Hz.
const N = {
  D1: 36.71, D2: 73.42, A2: 110.0, F2: 87.31,
  D3: 146.83, F3: 174.61, A3: 220.0, C4: 261.63, D4: 293.66, A4: 440.0,
};

type Ctx = AudioContext;

function noiseBuffer(c: Ctx, dur: number) {
  const b = c.createBuffer(1, Math.max(1, Math.ceil(c.sampleRate * dur)), c.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const s = c.createBufferSource();
  s.buffer = b;
  return s;
}

/** Deep kick: pitch-dropping sine with a transient click. */
function kick(c: Ctx, t: number, gain = 0.9) {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(140, t);
  o.frequency.exponentialRampToValueAtTime(42, t + 0.11);
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
  o.connect(g); g.connect(c.destination);
  o.start(t); o.stop(t + 0.45);

  const n = noiseBuffer(c, 0.02);
  const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1800;
  const ng = c.createGain();
  ng.gain.setValueAtTime(gain * 0.32, t);
  ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.02);
  n.connect(hp); hp.connect(ng); ng.connect(c.destination); n.start(t);
}

/** Snare / clap: band-passed noise. */
function snare(c: Ctx, t: number, gain = 0.34, decay = 0.16) {
  const n = noiseBuffer(c, decay + 0.05);
  const bp = c.createBiquadFilter(); bp.type = 'bandpass';
  bp.frequency.value = 1900; bp.Q.value = 0.8;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
  n.connect(bp); bp.connect(g); g.connect(c.destination); n.start(t);
}

/** Sustained sub for weight under the whole piece. */
function sub(c: Ctx, t: number, freq: number, dur: number, gain = 0.5) {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.05);
  g.gain.setValueAtTime(gain, t + dur - 0.25);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(c.destination);
  o.start(t); o.stop(t + dur + 0.05);
}

/** Brass-style stab: detuned saw stack through a filter envelope. */
function brass(c: Ctx, t: number, freqs: number[], dur: number, gain = 0.16) {
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass'; lp.Q.value = 6;
  lp.frequency.setValueAtTime(320, t);
  lp.frequency.exponentialRampToValueAtTime(3400, t + 0.07);
  lp.frequency.exponentialRampToValueAtTime(900, t + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.035);
  g.gain.setValueAtTime(gain, t + dur * 0.6);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  freqs.forEach((f) => {
    [-6, 0, 6].forEach((cents) => {
      const o = c.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = f * Math.pow(2, cents / 1200);
      o.connect(lp);
      o.start(t); o.stop(t + dur + 0.05);
    });
  });
  lp.connect(g); g.connect(c.destination);
}

/** Slow pad for the sustained final chord. */
function pad(c: Ctx, t: number, freqs: number[], dur: number, gain = 0.1) {
  const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.5);
  g.gain.setValueAtTime(gain, t + dur - 1.2);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  freqs.forEach((f) => [-8, 8].forEach((cents) => {
    const o = c.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = f * Math.pow(2, cents / 1200);
    o.connect(lp); o.start(t); o.stop(t + dur + 0.1);
  }));
  lp.connect(g); g.connect(c.destination);
}

/** Rising noise riser into the detonation. */
function riser(c: Ctx, t: number, dur: number, gain = 0.16) {
  const n = noiseBuffer(c, dur);
  const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.4;
  bp.frequency.setValueAtTime(240, t);
  bp.frequency.exponentialRampToValueAtTime(5200, t + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + dur * 0.85);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  n.connect(bp); bp.connect(g); g.connect(c.destination); n.start(t);

  const o = c.createOscillator();
  const og = c.createGain();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(110, t);
  o.frequency.exponentialRampToValueAtTime(700, t + dur);
  og.gain.setValueAtTime(0.0001, t);
  og.gain.exponentialRampToValueAtTime(gain * 0.5, t + dur * 0.85);
  og.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(og); og.connect(c.destination);
  o.start(t); o.stop(t + dur + 0.05);
}

/** Detonation: sub drop plus wideband blast. */
function boom(c: Ctx, t: number) {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(210, t);
  o.frequency.exponentialRampToValueAtTime(26, t + 0.85);
  g.gain.setValueAtTime(1, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
  o.connect(g); g.connect(c.destination);
  o.start(t); o.stop(t + 1.45);

  const n = noiseBuffer(c, 1.2);
  const lp = c.createBiquadFilter(); lp.type = 'lowpass';
  lp.frequency.setValueAtTime(6000, t);
  lp.frequency.exponentialRampToValueAtTime(260, t + 1.1);
  const ng = c.createGain();
  ng.gain.setValueAtTime(0.75, t);
  ng.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
  n.connect(lp); lp.connect(ng); ng.connect(c.destination); n.start(t);
}

/** Cymbal wash / crowd roar. */
function wash(c: Ctx, t: number, dur: number, gain = 0.14) {
  const n = noiseBuffer(c, dur);
  const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 620;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.35);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  n.connect(hp); hp.connect(g); g.connect(c.destination); n.start(t);
}

/** Stadium crowd bed. */
function crowd(c: Ctx, t: number, dur: number, gain = 0.11) {
  const n = noiseBuffer(c, dur);
  const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 950;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.9);
  g.gain.linearRampToValueAtTime(gain * 0.35, t + dur);
  n.connect(lp); lp.connect(g); g.connect(c.destination); n.start(t);
}

/**
 * Schedules the whole cue. Cue times mirror the animation steps in Intro.tsx.
 * Returns a master gain node so the caller can fade or stop everything.
 */
export function playScore(c: AudioContext) {
  const t0 = c.currentTime + 0.03;

  // 0.00-1.10  pitch draws in: low drone, sparse pulse
  sub(c, t0, N.D1, 1.5, 0.3);
  kick(c, t0 + 0.05, 0.55);
  crowd(c, t0, 6.2, 0.06);

  // 1.10  blue XI arrives — stab, four-on-the-floor begins
  brass(c, t0 + 1.1, [N.D2, N.A2, N.D3], 0.6, 0.18);
  kick(c, t0 + 1.1, 0.85);
  sub(c, t0 + 1.15, N.D2, 1.9, 0.34);
  [1.6, 2.1, 2.6].forEach((t) => kick(c, t0 + t, 0.65));
  snare(c, t0 + 2.1, 0.24);

  // 2.10  red XI answers a fifth up
  brass(c, t0 + 2.1, [N.A2, N.C4, N.A3], 0.6, 0.18);
  [3.1, 3.6, 4.1].forEach((t) => kick(c, t0 + t, 0.7));
  snare(c, t0 + 3.1, 0.26);
  sub(c, t0 + 3.05, N.F2, 1.9, 0.32);

  // 3.10  staff — lighter accent
  brass(c, t0 + 3.1, [N.F2, N.F3], 0.45, 0.12);

  // 4.00-5.20  the two elevens: tension holds, riser starts
  sub(c, t0 + 4.0, N.A2, 2.2, 0.34);
  snare(c, t0 + 4.6, 0.22);
  riser(c, t0 + 4.2, 2.0, 0.16);

  // 5.20-5.82  they converge: accelerating roll into the collision
  let roll = t0 + 5.2;
  let gap = 0.15;
  while (roll < t0 + 5.8) {
    snare(c, roll, 0.14 + (roll - t0 - 5.2) * 0.25, 0.08);
    gap = Math.max(0.045, gap * 0.82);
    roll += gap;
  }

  // 5.82  COLLISION — 11 + 11 = 22. The hit of the piece.
  boom(c, t0 + 5.82);
  kick(c, t0 + 5.82, 1);
  snare(c, t0 + 5.82, 0.42, 0.3);
  brass(c, t0 + 5.82, [N.D2, N.A2, N.D3, N.A3], 1.1, 0.24);
  wash(c, t0 + 5.82, 1.8, 0.18);
  sub(c, t0 + 5.85, N.D2, 1.6, 0.42);

  // 6.40  SHIELD — sustained D5, crowd erupts
  kick(c, t0 + 6.4, 0.95);
  brass(c, t0 + 6.4, [N.D2, N.A2, N.D3, N.A3, N.D4], 1.7, 0.22);
  pad(c, t0 + 6.4, [N.D3, N.A3, N.D4, N.A4], 3.3, 0.13);
  sub(c, t0 + 6.4, N.D2, 3.1, 0.44);
  wash(c, t0 + 6.4, 2.8, 0.18);
  crowd(c, t0 + 6.4, 3.2, 0.15);

  // 7.60  tagline accent, then tail
  brass(c, t0 + 7.6, [N.F3, N.C4], 0.7, 0.12);
  kick(c, t0 + 7.6, 0.6);
  kick(c, t0 + 8.6, 0.45);
}

/**
 * True when the browser will let us start audio without a gesture.
 * Chrome allows it once its Media Engagement Index is high enough; Safari and
 * Firefox allow it via per-site permission. First-time visitors normally can't.
 */
export async function canAutoplay(c: AudioContext): Promise<boolean> {
  if (c.state === 'running') return true;
  try {
    await c.resume();
  } catch {
    return false;
  }
  return c.state === 'running';
}
