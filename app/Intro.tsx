'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Squad22 cold open.
 *
 * Sequence: whistle -> ball drops and bounces -> pitch and goalposts draw in ->
 * 11 players fly into each half in a 4-4-2 -> staff take the touchline ->
 * SQUAD22 lands. All audio is synthesised with the Web Audio API so there are
 * no sound files to ship, and it is unlocked by the KICK OFF click (browsers
 * block audio until a user gesture).
 */

const PITCH = { x: 40, y: 40, w: 920, h: 480 };
const CY = PITCH.y + PITCH.h / 2; // 280

// Default 1-4-4-2 using classic numbering:
//   1 GK · 2-5 DEF · 6,7,8,11 MID (7 and 11 are the wide men) · 9,10 STR
const HOME: { n: number; x: number; y: number }[] = [
  { n: 1, x: 70, y: CY },
  { n: 2, x: 200, y: 110 }, { n: 3, x: 200, y: 220 },
  { n: 4, x: 200, y: 340 }, { n: 5, x: 200, y: 450 },
  { n: 7, x: 330, y: 110 }, { n: 6, x: 330, y: 220 },
  { n: 8, x: 330, y: 340 }, { n: 11, x: 330, y: 450 },
  { n: 9, x: 440, y: 210 }, { n: 10, x: 440, y: 350 },
];
const AWAY = HOME.map((p) => ({ ...p, x: 1000 - p.x }));

const STAFF = ['COACH', 'MANAGER', 'PHYSIO'];

type Phase = 'idle' | 'playing';

export default function Intro({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [step, setStep] = useState(0); // drives which layers are visible
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const audio = useRef<AudioContext | null>(null);

  // Respect reduced-motion: skip straight to the site.
  useEffect(() => {
    if (typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      onDone();
    }
    return () => { timers.current.forEach(clearTimeout); };
  }, [onDone]);

  // ---- audio synthesis -----------------------------------------------------
  function ctx(): AudioContext | null {
    if (!audio.current) {
      const AC = window.AudioContext
        || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      audio.current = new AC();
    }
    return audio.current;
  }

  function noise(dur: number) {
    const c = ctx()!;
    const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buf;
    return src;
  }

  /** Referee whistle: two pips and a long blast, with the classic warble. */
  function whistle() {
    const c = ctx(); if (!c) return;
    const blast = (at: number, len: number) => {
      const o = c.createOscillator();
      const w = c.createOscillator(); // warble
      const wg = c.createGain();
      const g = c.createGain();
      o.type = 'sine';
      o.frequency.value = 2350;
      w.frequency.value = 32; wg.gain.value = 120;
      w.connect(wg); wg.connect(o.frequency);
      g.gain.setValueAtTime(0, c.currentTime + at);
      g.gain.linearRampToValueAtTime(0.16, c.currentTime + at + 0.02);
      g.gain.setValueAtTime(0.16, c.currentTime + at + len - 0.05);
      g.gain.linearRampToValueAtTime(0, c.currentTime + at + len);
      const air = noise(len);
      const bp = c.createBiquadFilter();
      bp.type = 'bandpass'; bp.frequency.value = 2400; bp.Q.value = 6;
      const ag = c.createGain(); ag.gain.value = 0.05;
      air.connect(bp); bp.connect(ag); ag.connect(g);
      o.connect(g); g.connect(c.destination);
      o.start(c.currentTime + at); o.stop(c.currentTime + at + len);
      w.start(c.currentTime + at); w.stop(c.currentTime + at + len);
      air.start(c.currentTime + at);
    };
    blast(0, 0.12); blast(0.18, 0.12); blast(0.38, 0.55);
  }

  /** Ball hitting turf: pitched-down thump plus a leathery slap. */
  function thump() {
    const c = ctx(); if (!c) return;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(190, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(46, c.currentTime + 0.19);
    g.gain.setValueAtTime(0.55, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.3);
    o.connect(g); g.connect(c.destination);
    o.start(); o.stop(c.currentTime + 0.32);

    const s = noise(0.07);
    const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 900;
    const sg = c.createGain();
    sg.gain.setValueAtTime(0.28, c.currentTime);
    sg.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.07);
    s.connect(hp); hp.connect(sg); sg.connect(c.destination);
    s.start();
  }

  /** Filtered noise sweep for players rushing on. */
  function whoosh() {
    const c = ctx(); if (!c) return;
    const s = noise(0.55);
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass'; bp.Q.value = 1.1;
    bp.frequency.setValueAtTime(320, c.currentTime);
    bp.frequency.exponentialRampToValueAtTime(2600, c.currentTime + 0.4);
    const g = c.createGain();
    g.gain.setValueAtTime(0.001, c.currentTime);
    g.gain.linearRampToValueAtTime(0.2, c.currentTime + 0.16);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.55);
    s.connect(bp); bp.connect(g); g.connect(c.destination);
    s.start();
  }

  /** Crowd swell under the logo reveal. */
  function crowd() {
    const c = ctx(); if (!c) return;
    const s = noise(2.6);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1100;
    const g = c.createGain();
    g.gain.setValueAtTime(0.001, c.currentTime);
    g.gain.linearRampToValueAtTime(0.15, c.currentTime + 0.7);
    g.gain.linearRampToValueAtTime(0.06, c.currentTime + 2.6);
    s.connect(lp); lp.connect(g); g.connect(c.destination);
    s.start();
  }

  /** Bass hit as the logo slams in. */
  function impact() {
    const c = ctx(); if (!c) return;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(110, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(38, c.currentTime + 0.5);
    g.gain.setValueAtTime(0.6, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.9);
    o.connect(g); g.connect(c.destination);
    o.start(); o.stop(c.currentTime + 0.95);
  }

  // ---- timeline ------------------------------------------------------------
  function kickOff() {
    setPhase('playing');
    ctx()?.resume();
    whistle();
    const at = (ms: number, fn: () => void) => {
      timers.current.push(setTimeout(fn, ms));
    };
    at(250, () => setStep(1));                    // ball drops
    at(880, () => { thump(); setStep(2); });      // impact -> pitch draws
    at(1550, () => { whoosh(); setStep(3); });    // home XI
    at(2150, () => { whoosh(); setStep(4); });    // away XI
    at(2850, () => setStep(5));                   // staff
    at(3350, () => { impact(); crowd(); setStep(6); }); // logo
    at(5100, () => setStep(7));                   // fade
    at(5700, onDone);
  }

  function skip() {
    timers.current.forEach(clearTimeout);
    audio.current?.close().catch(() => {});
    onDone();
  }

  const team = (list: typeof HOME, colour: string, dir: 'l' | 'r', on: boolean) =>
    list.map((p, i) => (
      <g key={`${dir}${p.n}`} transform={`translate(${p.x},${p.y})`}>
        <g
          className={on ? (dir === 'l' ? 'fly-l' : 'fly-r') : 'hid'}
          style={{ animationDelay: `${i * 55}ms` }}
        >
          <use href="#plr" fill={colour} />
          <circle cy="12" r="9" fill="rgba(0,0,0,.55)" />
          <text y="16" textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff">
            {p.n}
          </text>
        </g>
      </g>
    ));

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'radial-gradient(circle at 50% 45%, #10331f 0%, #071a12 60%, #04100b 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: step === 7 ? 0 : 1,
        transition: 'opacity .6s ease',
      }}
    >
      <style>{`
        @keyframes drop {
          0%   { transform: translateY(-460px) scale(.75); }
          62%  { transform: translateY(0) scale(1); }
          73%  { transform: translateY(-72px) scale(1); }
          84%  { transform: translateY(0) scale(1.06,.94); }
          92%  { transform: translateY(-22px) scale(1); }
          100% { transform: translateY(0) scale(1); }
        }
        @keyframes flyL {
          from { transform: translateX(-880px) scale(.35); opacity: 0; }
          to   { transform: translateX(0) scale(1); opacity: 1; }
        }
        @keyframes flyR {
          from { transform: translateX(880px) scale(.35); opacity: 0; }
          to   { transform: translateX(0) scale(1); opacity: 1; }
        }
        @keyframes riseUp {
          from { transform: translateY(46px); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
        @keyframes slam {
          0%   { transform: scale(3.4); opacity: 0; filter: blur(14px); }
          55%  { transform: scale(.92); opacity: 1; filter: blur(0); }
          72%  { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes draw { to { stroke-dashoffset: 0; } }
        .ball  { animation: drop 1.05s cubic-bezier(.4,0,.5,1) forwards; }
        .fly-l { animation: flyL .55s cubic-bezier(.16,.9,.3,1.05) backwards; }
        .fly-r { animation: flyR .55s cubic-bezier(.16,.9,.3,1.05) backwards; }
        .rise  { animation: riseUp .5s ease-out backwards; }
        .slam  { animation: slam .85s cubic-bezier(.2,.9,.25,1) forwards; }
        .hid   { opacity: 0; }
        .line  { stroke-dasharray: 3000; stroke-dashoffset: 3000; animation: draw 1.1s ease-out forwards; }
      `}</style>

      <svg viewBox="0 0 1000 620" style={{ width: '92vw', maxWidth: 1100 }}>
        <defs>
          {/* Silhouette in the style of the card artwork. */}
          <g id="plr">
            <circle cx="0" cy="-34" r="5.4" />
            <path d="M-8 -27 q8 -2.6 16 0 l1.6 14.5 q-9.6 2.6 -19.2 0 z" />
            <path d="M-8 -27 l-3.6 13 2.7 .9 4.3 -11.2 z" />
            <path d="M8 -27 l3.6 13 -2.7 .9 -4.3 -11.2 z" />
            <path d="M-6.4 -13 l-1.1 13.5 4.2 0 1.7 -12.6 z" />
            <path d="M6.4 -13 l1.1 13.5 -4.2 0 -1.7 -12.6 z" />
          </g>
        </defs>

        {/* pitch */}
        {step >= 2 && (
          <g opacity={0.95}>
            <rect x={PITCH.x} y={PITCH.y} width={PITCH.w} height={PITCH.h}
              fill="#14512f" stroke="rgba(255,255,255,.75)" strokeWidth="3" className="line" />
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <rect key={i} x={PITCH.x + (PITCH.w / 8) * i} y={PITCH.y}
                width={PITCH.w / 8} height={PITCH.h}
                fill={i % 2 ? 'rgba(255,255,255,.035)' : 'transparent'} />
            ))}
            <line x1="500" y1={PITCH.y} x2="500" y2={PITCH.y + PITCH.h}
              stroke="rgba(255,255,255,.75)" strokeWidth="3" className="line" />
            <circle cx="500" cy={CY} r="62" fill="none"
              stroke="rgba(255,255,255,.75)" strokeWidth="3" className="line" />
            <circle cx="500" cy={CY} r="4" fill="rgba(255,255,255,.85)" />
            {/* penalty areas */}
            <rect x={PITCH.x} y={CY - 140} width="120" height="280" fill="none"
              stroke="rgba(255,255,255,.7)" strokeWidth="3" />
            <rect x={PITCH.x + PITCH.w - 120} y={CY - 140} width="120" height="280" fill="none"
              stroke="rgba(255,255,255,.7)" strokeWidth="3" />
            {/* goals */}
            <rect x={PITCH.x - 22} y={CY - 46} width="22" height="92" fill="rgba(255,255,255,.22)"
              stroke="#fff" strokeWidth="3" />
            <rect x={PITCH.x + PITCH.w} y={CY - 46} width="22" height="92" fill="rgba(255,255,255,.22)"
              stroke="#fff" strokeWidth="3" />
          </g>
        )}

        {/* ball */}
        {step >= 1 && step < 6 && (
          <g className="ball" transform="translate(500,280)">
            <circle r="17" fill="#fff" />
            <circle r="17" fill="none" stroke="rgba(0,0,0,.25)" strokeWidth="1.5" />
            <path d="M0 -9 l8.6 6.2 -3.3 10.1 -10.6 0 -3.3 -10.1 z" fill="#111" />
          </g>
        )}

        {step >= 3 && team(HOME, '#5ac8fa', 'l', true)}
        {step >= 4 && team(AWAY, '#ff6b6b', 'r', true)}

        {/* staff on each touchline */}
        {step >= 5 && (
          <g>
            {STAFF.map((role, i) => (
              <g key={`h${role}`} transform={`translate(${170 + i * 105},595)`}
                className="rise" style={{ animationDelay: `${i * 70}ms` }}>
                <use href="#plr" fill="#2f8fbf" transform="scale(.62)" />
                <text y="12" textAnchor="middle" fontSize="11" fontWeight="700"
                  fill="rgba(255,255,255,.75)" letterSpacing="1">{role}</text>
              </g>
            ))}
            {STAFF.map((role, i) => (
              <g key={`a${role}`} transform={`translate(${620 + i * 105},595)`}
                className="rise" style={{ animationDelay: `${200 + i * 70}ms` }}>
                <use href="#plr" fill="#c0504e" transform="scale(.62)" />
                <text y="12" textAnchor="middle" fontSize="11" fontWeight="700"
                  fill="rgba(255,255,255,.75)" letterSpacing="1">{role}</text>
              </g>
            ))}
          </g>
        )}

        {/* logo reveal */}
        {step >= 6 && (
          <g className="slam" style={{ transformOrigin: '500px 280px' }}>
            <rect x="150" y="185" width="700" height="190" rx="18"
              fill="rgba(4,16,11,.82)" stroke="rgba(255,255,255,.16)" strokeWidth="2" />
            <text x="500" y="290" textAnchor="middle" fontSize="104" fontWeight="900"
              fill="#fff" letterSpacing="6">SQUAD</text>
            <text x="474" y="352" textAnchor="middle" fontSize="54" fontWeight="900"
              fill="#e63946">2</text>
            <text x="526" y="352" textAnchor="middle" fontSize="54" fontWeight="900"
              fill="#ffd93d">2</text>
            <text x="500" y="378" textAnchor="middle" fontSize="13" fontWeight="700"
              fill="rgba(255,255,255,.55)" letterSpacing="5">22 PLAYERS · 3 STAFF · ONE SQUAD</text>
          </g>
        )}
      </svg>

      {/* KICK OFF */}
      {phase === 'idle' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex',
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 26 }}>
          <div style={{ fontSize: 78, animation: 'drop 1.4s ease-in-out infinite alternate' }}>⚽</div>
          <button
            onClick={kickOff}
            style={{
              padding: '18px 54px', fontSize: 22, fontWeight: 900, letterSpacing: 3,
              color: '#04100b', background: '#00e676', border: 'none', borderRadius: 999,
              cursor: 'pointer', textTransform: 'uppercase',
              boxShadow: '0 0 44px rgba(0,230,118,.55)',
            }}
          >
            Kick Off
          </button>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', letterSpacing: 1 }}>
            sound on · 5 seconds
          </div>
        </div>
      )}

      {phase === 'playing' && step < 7 && (
        <button
          onClick={skip}
          style={{
            position: 'absolute', right: 24, bottom: 24, padding: '9px 20px',
            fontSize: 13, fontWeight: 700, letterSpacing: 1, color: 'rgba(255,255,255,.7)',
            background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.22)',
            borderRadius: 999, cursor: 'pointer',
          }}
        >
          Skip ›
        </button>
      )}
    </div>
  );
}
