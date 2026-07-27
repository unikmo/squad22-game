'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { playScore, canAutoplay } from './introScore';

/**
 * Squad22 cold open — runs automatically on load, ~10s.
 *
 * ball falls slowly and detonates -> pitch and goalposts emerge from the blast
 * -> 11 real cards fly into each half in a 1-4-4-2 -> staff rise on each
 * touchline -> formation callout -> SQUAD22 lands.
 *
 * Deck mapping (read off the artwork): cards #1-44 are 11 positions x 4 trait
 * colours, so position = ceil(n / 4). Home XI takes the 1st of each group,
 * away XI the 3rd, guaranteeing different trait colours per side.
 *
 * Audio is a synthesised score (see introScore.ts) — no files ship.
 *
 * Two start paths. We probe whether the browser will let audio play without a
 * gesture: Chrome permits it once its Media Engagement Index is high enough,
 * Safari and Firefox via per-site permission. If permitted the film rolls
 * immediately with music. If refused — the normal first-visit case — we show
 * the badge poster with a play control instead of running it silently.
 */

const PITCH = { x: 40, y: 40, w: 920, h: 480 };
const CY = PITCH.y + PITCH.h / 2; // 280
const CW = 46;
const CH = 64;

// Default 1-4-4-2, classic numbering.
//   Fixed:    1 GK · 2,4,5 DEF · 6,8 central MID · 9,10 STR
//   Flexible: 3 (DEF/MID) · 7, 11 (MID/STR) — role depends on the formation
const SLOTS: { n: number; x: number; y: number }[] = [
  { n: 1, x: 78, y: CY },
  { n: 2, x: 210, y: 108 }, { n: 3, x: 210, y: 222 },
  { n: 4, x: 210, y: 338 }, { n: 5, x: 210, y: 452 },
  { n: 7, x: 342, y: 108 }, { n: 6, x: 342, y: 222 },
  { n: 8, x: 342, y: 338 }, { n: 11, x: 342, y: 452 },
  { n: 9, x: 452, y: 210 }, { n: 10, x: 452, y: 350 },
];
const HOME = SLOTS.map((s) => ({ ...s, card: 4 * s.n - 3 }));
const AWAY = SLOTS.map((s) => ({ ...s, x: 1000 - s.x, card: 4 * s.n - 1 }));
const STAFF = ['COACH', 'MANAGER', 'PHYSIO'];

// Deterministic shrapnel directions.
const SHARDS = Array.from({ length: 28 }, (_, i) => {
  const a = (i / 28) * Math.PI * 2 + (i % 3) * 0.12;
  const d = 190 + ((i * 37) % 150);
  return { dx: Math.cos(a) * d, dy: Math.sin(a) * d * 0.62, r: 3 + (i % 4), rot: (i % 2 ? 1 : -1) * 320 };
});

const pad = (n: number) => String(n).padStart(2, '0');

export default function Intro({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [gate, setGate] = useState<'wait' | 'splash' | 'none'>('wait');
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const audio = useRef<AudioContext | null>(null);
  const done = useRef(onDone);
  done.current = onDone;

  /** Runs the visual timeline; music is scheduled separately but from t=0. */
  const runSequence = useCallback((withSound: boolean) => {
    const list = timers.current;
    const at = (ms: number, fn: () => void) => { list.push(setTimeout(fn, ms)); };

    if (withSound && audio.current) playScore(audio.current);
    setStep(1);                                  // slow fall begins
    at(1550, () => setStep(2));                  // detonation
    at(2050, () => setStep(3));                  // pitch emerges
    at(2750, () => setStep(4));                  // goalposts
    at(3250, () => setStep(5));                  // home XI
    at(4300, () => setStep(6));                  // away XI
    at(5350, () => setStep(7));                  // staff
    at(6150, () => setStep(8));                  // formation callout
    at(7100, () => setStep(9));                  // logo
    at(8300, () => setStep(10));                 // tagline
    at(9900, () => setStep(11));                 // fade
    at(10500, () => done.current());
  }, []);

  // ---- start: autoplay if the browser permits, otherwise show the splash ----
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      done.current(); return;
    }
    let cancelled = false;
    const AC = window.AudioContext
      || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AC) { setGate('none'); runSequence(false); return; }

    const c = new AC();
    audio.current = c;
    canAutoplay(c).then((ok) => {
      if (cancelled) return;
      if (ok) { setGate('none'); runSequence(true); }
      else { setGate('splash'); }      // browser refused audio — offer the poster
    });

    const list = timers.current;
    return () => { cancelled = true; list.forEach(clearTimeout); };
  }, [runSequence]);

  /** Splash click: a real gesture, so audio is now unlocked. */
  const start = () => {
    const c = audio.current;
    setGate('none');
    if (c) c.resume().then(() => runSequence(true)).catch(() => runSequence(false));
    else runSequence(false);
  };

  const skip = () => {
    timers.current.forEach(clearTimeout);
    audio.current?.close().catch(() => {});
    done.current();
  };

  const team = (
    list: typeof HOME, ring: string, dir: 'l' | 'r',
  ) => list.map((p, i) => (
    <g key={`${dir}${p.n}`} transform={`translate(${p.x},${p.y})`}>
      <g className={dir === 'l' ? 'fly-l' : 'fly-r'} style={{ animationDelay: `${i * 62}ms` }}>
        <ellipse cy={CH / 2 + 5} rx={CW * 0.42} ry="4" fill="rgba(0,0,0,.42)" />
        <g clipPath="url(#cardClip)">
          <image href={`/images/cards/${pad(p.card)}.webp`}
            x={-CW / 2} y={-CH / 2} width={CW} height={CH} />
        </g>
        <rect x={-CW / 2} y={-CH / 2} width={CW} height={CH} rx="4"
          fill="none" stroke={ring} strokeWidth="2.5" />
      </g>
    </g>
  ));

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'radial-gradient(circle at 50% 42%, #114023 0%, #071a12 58%, #030c08 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: step >= 11 ? 0 : 1, transition: 'opacity .6s ease',
      }}
    >
      <style>{`
        @keyframes fallSlow {
          from { transform: translateY(-560px) rotate(0deg); }
          to   { transform: translateY(0) rotate(300deg); }
        }
        @keyframes flash   { 0% { opacity: 0; transform: scale(.2); }
                             18% { opacity: 1; transform: scale(1); }
                             100% { opacity: 0; transform: scale(2.4); } }
        @keyframes shock   { from { r: 10; opacity: .95; stroke-width: 14; }
                             to   { r: 560; opacity: 0; stroke-width: 1; } }
        @keyframes burst   { from { transform: translate(0,0) scale(1) rotate(0deg); opacity: 1; }
                             to   { transform: translate(var(--tx), var(--ty)) scale(.2)
                                    rotate(var(--rot)); opacity: 0; } }
        @keyframes flyL    { from { transform: translateX(-950px) scale(.25) rotate(-24deg); opacity: 0; }
                             to   { transform: translateX(0) scale(1) rotate(0); opacity: 1; } }
        @keyframes flyR    { from { transform: translateX(950px) scale(.25) rotate(24deg); opacity: 0; }
                             to   { transform: translateX(0) scale(1) rotate(0); opacity: 1; } }
        @keyframes riseUp  { from { transform: translateY(48px); opacity: 0; }
                             to   { transform: translateY(0); opacity: 1; } }
        @keyframes slam    { 0% { transform: scale(3.2); opacity: 0; }
                             58% { transform: scale(.94); opacity: 1; }
                             76% { transform: scale(1.04); } 100% { transform: scale(1); opacity: 1; } }
        @keyframes fadeUp  { from { transform: translateY(14px); opacity: 0; }
                             to   { transform: translateY(0); opacity: 1; } }
        @keyframes draw    { to { stroke-dashoffset: 0; } }
        @keyframes pop     { from { transform: scale(0); opacity: 0; }
                             to   { transform: scale(1); opacity: 1; } }
        @keyframes pitchIn { from { transform: scale(.82); opacity: 0; }
                             to   { transform: scale(1); opacity: 1; } }
        @keyframes posterIn { from { transform: scale(.86) translateY(18px); opacity: 0; }
                              to   { transform: scale(1) translateY(0); opacity: 1; } }
        @keyframes breathe  { 0%,100% { transform: scale(1); opacity: .8; }
                              50%     { transform: scale(1.12); opacity: 1; } }

        .fall    { animation: fallSlow 1.55s cubic-bezier(.55,.02,.85,.42) forwards;
                   transform-box: fill-box; transform-origin: center; }
        .flash   { animation: flash .7s ease-out forwards;
                   transform-box: fill-box; transform-origin: center; }
        .shock   { animation: shock .9s cubic-bezier(.15,.7,.3,1) forwards; }
        .shard   { animation: burst .95s cubic-bezier(.2,.7,.35,1) forwards;
                   transform-box: fill-box; transform-origin: center; }
        .pitchin { animation: pitchIn .75s cubic-bezier(.2,.9,.3,1) backwards;
                   transform-box: fill-box; transform-origin: center; }
        .fly-l   { animation: flyL .62s cubic-bezier(.16,.9,.3,1.05) backwards; }
        .fly-r   { animation: flyR .62s cubic-bezier(.16,.9,.3,1.05) backwards; }
        .rise    { animation: riseUp .55s ease-out backwards; }
        .logo    { animation: slam .95s cubic-bezier(.2,.9,.25,1) forwards;
                   transform-box: fill-box; transform-origin: center; }
        .tag     { animation: fadeUp .6s ease-out backwards; }
        .goal    { animation: pop .45s cubic-bezier(.2,1.3,.4,1) backwards;
                   transform-box: fill-box; transform-origin: center; }
        .line    { stroke-dasharray: 3200; stroke-dashoffset: 3200;
                   animation: draw 1.1s ease-out forwards; }
      `}</style>

      <svg viewBox="0 0 1000 640" style={{ width: '94vw', maxWidth: 1180 }}>
        <defs>
          <clipPath id="cardClip">
            <rect x={-CW / 2} y={-CH / 2} width={CW} height={CH} rx="4" />
          </clipPath>
          <clipPath id="ballClip"><circle r="30" /></clipPath>
          <radialGradient id="ballShade" cx="36%" cy="30%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="62%" stopColor="#f2f2f0" />
            <stop offset="100%" stopColor="#bfc2c4" />
          </radialGradient>
          <radialGradient id="flashG">
            <stop offset="0%" stopColor="#fff" stopOpacity="1" />
            <stop offset="45%" stopColor="#ffe89a" stopOpacity=".85" />
            <stop offset="100%" stopColor="#ff8a3d" stopOpacity="0" />
          </radialGradient>
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
        {step >= 3 && (
          <g className="pitchin">
            <rect x={PITCH.x} y={PITCH.y} width={PITCH.w} height={PITCH.h} fill="#15542f" />
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <rect key={i} x={PITCH.x + (PITCH.w / 8) * i} y={PITCH.y}
                width={PITCH.w / 8} height={PITCH.h}
                fill={i % 2 ? 'rgba(255,255,255,.04)' : 'transparent'} />
            ))}
            <rect x={PITCH.x} y={PITCH.y} width={PITCH.w} height={PITCH.h} fill="none"
              stroke="rgba(255,255,255,.8)" strokeWidth="3" className="line" />
            <line x1="500" y1={PITCH.y} x2="500" y2={PITCH.y + PITCH.h}
              stroke="rgba(255,255,255,.8)" strokeWidth="3" className="line" />
            <circle cx="500" cy={CY} r="64" fill="none"
              stroke="rgba(255,255,255,.8)" strokeWidth="3" className="line" />
            <circle cx="500" cy={CY} r="4" fill="rgba(255,255,255,.9)" />
            <rect x={PITCH.x} y={CY - 142} width="122" height="284" fill="none"
              stroke="rgba(255,255,255,.72)" strokeWidth="3" />
            <rect x={PITCH.x + PITCH.w - 122} y={CY - 142} width="122" height="284" fill="none"
              stroke="rgba(255,255,255,.72)" strokeWidth="3" />
            <rect x={PITCH.x} y={CY - 62} width="52" height="124" fill="none"
              stroke="rgba(255,255,255,.55)" strokeWidth="2" />
            <rect x={PITCH.x + PITCH.w - 52} y={CY - 62} width="52" height="124" fill="none"
              stroke="rgba(255,255,255,.55)" strokeWidth="2" />
          </g>
        )}

        {step >= 4 && (
          <g className="goal">
            <rect x={PITCH.x - 26} y={CY - 50} width="26" height="100"
              fill="rgba(255,255,255,.15)" stroke="#fff" strokeWidth="3.5" />
            <rect x={PITCH.x + PITCH.w} y={CY - 50} width="26" height="100"
              fill="rgba(255,255,255,.15)" stroke="#fff" strokeWidth="3.5" />
          </g>
        )}

        {/* falling ball — branded, spinning, motion-blurred */}
        {step === 1 && (
          <g transform={`translate(500,${CY})`}>
            <g className="fall">
              <circle r="30" fill="url(#ballShade)" />
              <g clipPath="url(#ballClip)">
                <g fill="#15171a">
                  <path d="M0 -15 l15 10.9 -5.7 17.6 -18.6 0 -5.7-17.6 z" />
                  <path d="M0 -43 l12.6 9.2 -4.8 14.9 -15.6 0 -4.8-14.9 z" />
                  <path d="M38 -12 l12.6 9.2 -4.8 14.9 -15.6 0 -4.8-14.9 z" />
                  <path d="M-38 -12 l12.6 9.2 -4.8 14.9 -15.6 0 -4.8-14.9 z" />
                  <path d="M24 29 l12.6 9.2 -4.8 14.9 -15.6 0 -4.8-14.9 z" />
                  <path d="M-24 29 l12.6 9.2 -4.8 14.9 -15.6 0 -4.8-14.9 z" />
                </g>
                {/* wordmark curved across the ball */}
                <g className="spin-txt">
                  <path id="ballArc" d="M-21 2 A 21 21 0 0 0 21 2" fill="none" />
                  <text fontSize="11.5" fontWeight="900" fill="#fff" letterSpacing=".6">
                    <textPath href="#ballArc" startOffset="50%" textAnchor="middle">SQUAD</textPath>
                  </text>
                  <text x="-5.5" y="-4" fontSize="12" fontWeight="900" fill="#e63946">2</text>
                  <text x="1.5" y="-4" fontSize="12" fontWeight="900" fill="#ffd93d">2</text>
                </g>
              </g>
              <circle r="30" fill="none" stroke="rgba(0,0,0,.3)" strokeWidth="1.6" />
              <ellipse cx="-10" cy="-12" rx="8.5" ry="5.5" fill="rgba(255,255,255,.5)" />
            </g>
          </g>
        )}

        {/* detonation */}
        {step === 2 && (
          <g transform={`translate(500,${CY})`}>
            <circle className="shock" cx="0" cy="0" r="10" fill="none" stroke="#fff5cc" opacity=".9" />
            <circle className="flash" r="150" fill="url(#flashG)" />
            {SHARDS.map((s, i) => (
              <g key={i} className="shard"
                style={{
                  animationDelay: `${(i % 5) * 22}ms`,
                  ['--tx' as string]: `${s.dx}px`,
                  ['--ty' as string]: `${s.dy}px`,
                  ['--rot' as string]: `${s.rot}deg`,
                } as React.CSSProperties}>
                <rect x={-s.r} y={-s.r} width={s.r * 2} height={s.r * 2}
                  fill={i % 3 === 0 ? '#141414' : '#fdfdfd'} rx="1" />
              </g>
            ))}
          </g>
        )}

        {step >= 5 && team(HOME, '#5ac8fa', 'l')}
        {step >= 6 && team(AWAY, '#ff6b6b', 'r')}

        {/* staff */}
        {step >= 7 && (
          <g>
            {STAFF.map((role, i) => (
              <g key={`h${role}`} transform={`translate(${180 + i * 108},614)`}
                className="rise" style={{ animationDelay: `${i * 80}ms` }}>
                <use href="#plr" fill="#5ac8fa" transform="scale(.6)" />
                <text y="13" textAnchor="middle" fontSize="10.5" fontWeight="700"
                  fill="rgba(255,255,255,.8)" letterSpacing="1.2">{role}</text>
              </g>
            ))}
            {STAFF.map((role, i) => (
              <g key={`a${role}`} transform={`translate(${606 + i * 108},614)`}
                className="rise" style={{ animationDelay: `${240 + i * 80}ms` }}>
                <use href="#plr" fill="#ff6b6b" transform="scale(.6)" />
                <text y="13" textAnchor="middle" fontSize="10.5" fontWeight="700"
                  fill="rgba(255,255,255,.8)" letterSpacing="1.2">{role}</text>
              </g>
            ))}
          </g>
        )}

        {/* formation callout */}
        {step >= 8 && step < 9 && (
          <g className="tag">
            <text x="500" y="27" textAnchor="middle" fontSize="21" fontWeight="900"
              fill="#00e676" letterSpacing="7">1 · 4 · 4 · 2</text>
          </g>
        )}

        {/* logo */}
        {step >= 9 && (
          <>
            <rect x="0" y="0" width="1000" height="640" fill="rgba(3,12,8,.74)" className="tag" />
            <g className="logo">
              <rect x="196" y="180" width="608" height="216" rx="20"
                fill="rgba(3,12,8,.92)" stroke="rgba(255,255,255,.18)" strokeWidth="2" />
              <text x="500" y="292" textAnchor="middle" fontSize="112" fontWeight="900"
                fill="#fff" letterSpacing="7">SQUAD</text>
              <text x="470" y="362" textAnchor="middle" fontSize="58" fontWeight="900" fill="#e63946">2</text>
              <text x="530" y="362" textAnchor="middle" fontSize="58" fontWeight="900" fill="#ffd93d">2</text>
            </g>
            {step >= 10 && (
              <text x="500" y="438" textAnchor="middle" fontSize="15" fontWeight="700"
                fill="rgba(255,255,255,.72)" letterSpacing="6" className="tag">
                22 PLAYERS · 3 STAFF · ONE SQUAD
              </text>
            )}
          </>
        )}
      </svg>

      {/* Poster shown only when the browser refuses audio autoplay.
          No copy explaining the mechanics — just the badge and a play control. */}
      {gate === 'splash' && (
        <div
          onClick={start}
          style={{
            position: 'absolute', inset: 0, cursor: 'pointer',
            background: 'radial-gradient(circle at 50% 44%, #14532a 0%, #061711 58%, #020806 100%)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 34,
          }}
        >
          <div style={{
            position: 'absolute', width: 620, height: 620, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,230,118,.16) 0%, transparent 68%)',
            animation: 'breathe 3.6s ease-in-out infinite',
          }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.webp" alt="Squad22"
            style={{
              width: 'min(46vw, 380px)', position: 'relative',
              filter: 'drop-shadow(0 24px 60px rgba(0,0,0,.75))',
              animation: 'posterIn .9s cubic-bezier(.2,.9,.25,1) both',
            }} />
          <button
            onClick={start}
            aria-label="Play intro"
            style={{
              position: 'relative', width: 92, height: 92, borderRadius: '50%',
              border: '2px solid rgba(255,255,255,.85)', background: 'rgba(0,230,118,.16)',
              backdropFilter: 'blur(6px)', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 50px rgba(0,230,118,.5)',
              animation: 'posterIn .9s cubic-bezier(.2,.9,.25,1) .18s both',
            }}
          >
            <svg width="30" height="34" viewBox="0 0 30 34">
              <path d="M3 2 L28 17 L3 32 Z" fill="#fff" />
            </svg>
          </button>
        </div>
      )}

      {gate === 'none' && step > 0 && step < 11 && (
        <button onClick={skip}
          style={{
            position: 'absolute', right: 24, bottom: 24, padding: '9px 20px', fontSize: 13,
            fontWeight: 700, letterSpacing: 1, color: 'rgba(255,255,255,.7)',
            background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.22)',
            borderRadius: 999, cursor: 'pointer',
          }}>
          Skip ›
        </button>
      )}
    </div>
  );
}
