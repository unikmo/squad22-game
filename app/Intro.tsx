'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { playScore, canAutoplay } from './introScore';
import Tutorial from './Tutorial';

/**
 * Squad22 cold open — art-directed to match the printed card back:
 * deep navy (#162638), pitch rendered as blue line art rather than a green
 * field, diagonal hatching and dot grids, real shield logo.
 *
 * Beat sheet (slower cut, ~14.7s total):
 *   pitch draws in -> 11 blue cards fly in left, 11 red fly in right ->
 *   3 staff rise on each touchline -> a giant "11" over each half ->
 *   the two elevens collide into a big ball -> the ball bursts into "22" ->
 *   SQUAD22 shield -> tagline -> fade.
 *
 * After the cold open, a brief explainer screen ("This is Squad22.") sets up
 * the game over the card back, laid horizontally. Its "Rules" button leads
 * into a card-based Tutorial (see Tutorial.tsx) — shuffle, deal, draw, pair,
 * triple, discard & win — which can be skipped at any point for players who
 * already know the game.
 *
 * Card selection comes from the deck itself. Cards #1-44 are 11 positions x 4
 * trait colours (position = ceil(n/4)), and #45-56 are the special cards, 3 per
 * colour. So the blue set yields exactly one card per position plus 3 staff,
 * and the red set likewise — giving two visually single-coloured squads of
 * 11 + 3 drawn entirely from real artwork.
 */

// ---- geometry: everything centred inside a 1200x700 stage --------------------
const VW = 1200;
const VH = 700;
const P = { x: 160, y: 90, w: 880, h: 520 };
const CX = P.x + P.w / 2;   // 600
const CY = P.y + P.h / 2;   // 350
const CW = 50;
const CH = 70;
const SW = 44;
const SH = 62;

// Default 1-4-4-2, classic numbering.
//   Fixed: 1 GK · 2,4,5 DEF · 6,8 MID · 9,10 STR
//   Flexible: 3 (DEF/MID) · 7, 11 (MID/STR)
const SLOTS = [
  { n: 1, x: 222, y: CY },
  { n: 2, x: 318, y: 170 }, { n: 3, x: 318, y: 290 },
  { n: 4, x: 318, y: 410 }, { n: 5, x: 318, y: 530 },
  { n: 7, x: 424, y: 170 }, { n: 6, x: 424, y: 290 },
  { n: 8, x: 424, y: 410 }, { n: 11, x: 424, y: 530 },
  { n: 9, x: 524, y: 282 }, { n: 10, x: 524, y: 418 },
];

// One card per position, all of a single trait colour (verified from artwork).
const BLUE = [2, 6, 10, 14, 20, 22, 28, 30, 34, 38, 44];
const RED = [3, 7, 11, 15, 17, 23, 25, 31, 35, 39, 41];
const BLUE_STAFF = [46, 51, 55];
const RED_STAFF = [47, 50, 56];

const HOME = SLOTS.map((s) => ({ ...s, card: BLUE[s.n - 1] }));
const AWAY = SLOTS.map((s) => ({ ...s, x: VW - s.x, card: RED[s.n - 1] }));

const TEAM_B = '#3d9be0';
const TEAM_R = '#e35d54';
const LINE = 'rgba(104,168,226,.30)';
const LINE_HI = 'rgba(124,188,240,.55)';

const pad = (n: number) => String(n).padStart(2, '0');

// A flat, stylised football (one centre pentagon + five around it), drawn in
// line art so it matches the rest of the cold open instead of an emoji.
const pentaPts = (cx: number, cy: number, r: number, rotDeg = 0) => {
  const a0 = ((-90 + rotDeg) * Math.PI) / 180;
  return Array.from({ length: 5 }, (_, k) => {
    const a = a0 + (k * 2 * Math.PI) / 5;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(' ');
};
const BALL_R = 132;
const BALL_PANELS = [0, 1, 2, 3, 4].map((i) => {
  const ang = -90 + i * 72;
  const rad = (ang * Math.PI) / 180;
  return { cx: 80 * Math.cos(rad), cy: 80 * Math.sin(rad), rot: ang + 180 };
});

type Phase = 'cinematic' | 'explainer' | 'tutorial';

export default function Intro({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<Phase>('cinematic');
  const [gate, setGate] = useState<'wait' | 'splash' | 'none'>('wait');
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const audio = useRef<AudioContext | null>(null);
  const done = useRef(onDone);
  done.current = onDone;

  const runSequence = useCallback((withSound: boolean) => {
    const list = timers.current;
    const at = (ms: number, fn: () => void) => { list.push(setTimeout(fn, ms)); };
    if (withSound && audio.current) playScore(audio.current);
    setStep(1);                        // pitch draws in
    at(1700, () => setStep(2));        // blue XI
    at(3200, () => setStep(3));        // red XI
    at(4700, () => setStep(4));        // staff
    at(6100, () => setStep(5));        // the two elevens
    at(7700, () => setStep(6));        // collide into the ball
    at(9000, () => setStep(7));        // ball bursts into 22
    at(10600, () => setStep(8));       // shield
    at(12200, () => setStep(9));       // tagline
    at(14000, () => setStep(10));      // fade
    at(14700, () => setPhase('explainer'));
  }, []);

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
    let settled = false;
    const decide = (ok: boolean) => {
      if (cancelled || settled) return;
      settled = true;
      if (ok) { setGate('none'); runSequence(true); } else setGate('splash');
    };

    canAutoplay(c).then(decide).catch(() => decide(false));
    // Safety net: never leave the viewer staring at an empty backdrop if the
    // probe stalls or throws for any reason.
    const guard = setTimeout(() => decide(false), 700);

    const list = timers.current;
    return () => { cancelled = true; clearTimeout(guard); list.forEach(clearTimeout); };
  }, [runSequence]);

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

  const card = (n: number, x: number, y: number, w: number, h: number,
    ring: string, cls: string, delay: number) => (
    <g transform={`translate(${x},${y})`} key={`${cls}${n}`}>
      <g className={cls} style={{ animationDelay: `${delay}ms` }}>
        <rect x={-w / 2 - 2} y={-h / 2 - 2} width={w + 4} height={h + 4} rx="6"
          fill={ring} opacity=".22" />
        <g clipPath={w === CW ? 'url(#clipC)' : 'url(#clipS)'}>
          <image href={`/images/cards/${pad(n)}.webp`} x={-w / 2} y={-h / 2}
            width={w} height={h} preserveAspectRatio="xMidYMid slice" />
        </g>
        <rect x={-w / 2} y={-h / 2} width={w} height={h} rx="5"
          fill="none" stroke={ring} strokeWidth="2" />
      </g>
    </g>
  );

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, background: '#0e1826',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {phase === 'cinematic' && (
        <div style={{
          width: '100%', height: '100%', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          opacity: step >= 10 ? 0 : 1, transition: 'opacity .6s ease',
        }}>
          <style>{`
            @keyframes flyL   { from { transform: translateX(-760px) scale(.4); opacity: 0; }
                                to   { transform: translateX(0) scale(1); opacity: 1; } }
            @keyframes flyR   { from { transform: translateX(760px) scale(.4); opacity: 0; }
                                to   { transform: translateX(0) scale(1); opacity: 1; } }
            @keyframes inL    { from { transform: translateX(-140px); opacity: 0; }
                                to   { transform: translateX(0); opacity: 1; } }
            @keyframes inR    { from { transform: translateX(140px); opacity: 0; }
                                to   { transform: translateX(0); opacity: 1; } }
            @keyframes numIn  { from { transform: scale(2.4); opacity: 0; }
                                to   { transform: scale(1); opacity: 1; } }
            @keyframes mergeL { from { transform: translateX(0); opacity: 1; }
                                80%  { opacity: 1; }
                                to   { transform: translateX(158px); opacity: 0; } }
            @keyframes mergeR { from { transform: translateX(0); opacity: 1; }
                                80%  { opacity: 1; }
                                to   { transform: translateX(-158px); opacity: 0; } }
            @keyframes ballIn  { from { transform: scale(.15) rotate(-140deg); opacity: 0; }
                                 to   { transform: scale(1) rotate(0deg); opacity: 1; } }
            @keyframes ballOut { from { transform: scale(1); opacity: 1; }
                                 to   { transform: scale(.4); opacity: 0; } }
            @keyframes ballSpin{ from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            @keyframes bang   { 0%   { transform: scale(.2); opacity: 0; }
                                40%  { transform: scale(1.18); opacity: 1; }
                                100% { transform: scale(1); opacity: 1; } }
            @keyframes ring   { from { r: 20; opacity: .9; stroke-width: 10; }
                                to   { r: 460; opacity: 0; stroke-width: 1; } }
            @keyframes shield { 0%   { transform: scale(2.6); opacity: 0; }
                                55%  { transform: scale(.95); opacity: 1; }
                                75%  { transform: scale(1.03); }
                                100% { transform: scale(1); opacity: 1; } }
            @keyframes up     { from { transform: translateY(16px); opacity: 0; }
                                to   { transform: translateY(0); opacity: 1; } }
            @keyframes draw   { to { stroke-dashoffset: 0; } }
            @keyframes dim    { to { opacity: .18; } }
            @keyframes breathe{ 0%,100% { transform: scale(1); opacity: .8; }
                                50%     { transform: scale(1.12); opacity: 1; } }
            @keyframes posterIn { from { transform: scale(.86) translateY(18px); opacity: 0; }
                                  to   { transform: scale(1) translateY(0); opacity: 1; } }

            .flyl  { animation: flyL .6s cubic-bezier(.16,.9,.3,1.03) backwards; }
            .flyr  { animation: flyR .6s cubic-bezier(.16,.9,.3,1.03) backwards; }
            .inl   { animation: inL .55s cubic-bezier(.2,.9,.3,1) backwards; }
            .inr   { animation: inR .55s cubic-bezier(.2,.9,.3,1) backwards; }
            .numin { animation: numIn .5s cubic-bezier(.2,.9,.25,1) backwards;
                     transform-box: fill-box; transform-origin: center; }
            .mgl   { animation: mergeL 1.05s cubic-bezier(.6,0,.4,1) forwards;
                     transform-box: fill-box; transform-origin: center; }
            .mgr   { animation: mergeR 1.05s cubic-bezier(.6,0,.4,1) forwards;
                     transform-box: fill-box; transform-origin: center; }
            .ballinwrap  { animation: ballIn .6s cubic-bezier(.2,.9,.25,1) both;
                     transform-box: fill-box; transform-origin: center; }
            .balloutwrap { animation: ballOut .5s ease-in forwards;
                     transform-box: fill-box; transform-origin: center; }
            .ballspin    { animation: ballSpin 2.6s linear infinite;
                     transform-box: fill-box; transform-origin: center; }
            .bang  { animation: bang .55s cubic-bezier(.2,.9,.25,1) .62s backwards;
                     transform-box: fill-box; transform-origin: center; }
            .ringx { animation: ring .8s cubic-bezier(.15,.7,.3,1) .6s backwards; }
            .shield{ animation: shield .95s cubic-bezier(.2,.9,.25,1) both;
                     transform-box: fill-box; transform-origin: center; }
            .up    { animation: up .6s ease-out backwards; }
            .line  { stroke-dasharray: 2600; stroke-dashoffset: 2600;
                     animation: draw 1.15s ease-out forwards; }
            .dimmer{ animation: dim .7s ease forwards; }
          `}</style>

          <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: '96vw', maxWidth: 1320 }}>
            <defs>
              <clipPath id="clipC"><rect x={-CW / 2} y={-CH / 2} width={CW} height={CH} rx="5" /></clipPath>
              <clipPath id="clipS"><rect x={-SW / 2} y={-SH / 2} width={SW} height={SH} rx="5" /></clipPath>
              <pattern id="hatch" width="26" height="26" patternUnits="userSpaceOnUse"
                patternTransform="rotate(-38)">
                <line x1="0" y1="0" x2="0" y2="26" stroke="rgba(104,168,226,.09)" strokeWidth="3" />
              </pattern>
              <pattern id="dots" width="17" height="17" patternUnits="userSpaceOnUse">
                <circle cx="3" cy="3" r="2.1" fill="rgba(104,168,226,.16)" />
              </pattern>
              <radialGradient id="vig" cx="50%" cy="46%">
                <stop offset="0%" stopColor="#1b2f46" />
                <stop offset="62%" stopColor="#162638" />
                <stop offset="100%" stopColor="#0a121c" />
              </radialGradient>
              <linearGradient id="flare" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fff" stopOpacity=".95" />
                <stop offset="100%" stopColor="#7cbcf0" stopOpacity=".7" />
              </linearGradient>
              <radialGradient id="ballGrad" cx="35%" cy="32%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="55%" stopColor="#cfe6fb" />
                <stop offset="100%" stopColor="#7cbcf0" />
              </radialGradient>
            </defs>

            {/* backdrop, matching the card back */}
            <rect width={VW} height={VH} fill="url(#vig)" />
            <rect width={VW} height={VH} fill="url(#hatch)" />
            <rect x="0" y="0" width="210" height={VH} fill="url(#dots)" opacity=".5" />
            <rect x={VW - 210} y="0" width="210" height={VH} fill="url(#dots)" opacity=".5" />

            {/* pitch as line art */}
            {step >= 1 && (
              <g className={step >= 8 ? 'dimmer' : undefined}>
                <rect x={P.x} y={P.y} width={P.w} height={P.h} fill="none"
                  stroke={LINE_HI} strokeWidth="2.5" className="line" />
                <line x1={CX} y1={P.y} x2={CX} y2={P.y + P.h}
                  stroke={LINE_HI} strokeWidth="2.5" className="line" />
                <circle cx={CX} cy={CY} r="86" fill="none" stroke={LINE_HI}
                  strokeWidth="2.5" className="line" />
                <circle cx={CX} cy={CY} r="5" fill={LINE_HI} />
                <rect x={P.x} y={CY - 150} width="132" height="300" fill="none"
                  stroke={LINE} strokeWidth="2.5" />
                <rect x={P.x + P.w - 132} y={CY - 150} width="132" height="300" fill="none"
                  stroke={LINE} strokeWidth="2.5" />
                <rect x={P.x} y={CY - 66} width="56" height="132" fill="none"
                  stroke={LINE} strokeWidth="2" />
                <rect x={P.x + P.w - 56} y={CY - 66} width="56" height="132" fill="none"
                  stroke={LINE} strokeWidth="2" />
                <rect x={P.x - 20} y={CY - 46} width="20" height="92" fill="none"
                  stroke={LINE} strokeWidth="2" />
                <rect x={P.x + P.w} y={CY - 46} width="20" height="92" fill="none"
                  stroke={LINE} strokeWidth="2" />
              </g>
            )}

            <g className={step >= 8 ? 'dimmer' : undefined}>
              {step >= 2 && HOME.map((p, i) => card(p.card, p.x, p.y, CW, CH, TEAM_B, 'flyl', i * 58))}
              {step >= 3 && AWAY.map((p, i) => card(p.card, p.x, p.y, CW, CH, TEAM_R, 'flyr', i * 58))}

              {/* staff — a column on each touchline */}
              {step >= 4 && (
                <>
                  {BLUE_STAFF.map((n, i) => card(n, 78, CY - 100 + i * 100, SW, SH, TEAM_B, 'inl', i * 90))}
                  {RED_STAFF.map((n, i) => card(n, VW - 78, CY - 100 + i * 100, SW, SH, TEAM_R, 'inr', i * 90))}
                  <text x="78" y={CY + 168} textAnchor="middle" fontSize="12" fontWeight="800"
                    fill={TEAM_B} letterSpacing="2.5" className="inl">STAFF</text>
                  <text x={VW - 78} y={CY + 168} textAnchor="middle" fontSize="12" fontWeight="800"
                    fill={TEAM_R} letterSpacing="2.5" className="inr">STAFF</text>
                </>
              )}
            </g>

            {/* 11 + 11 -> ball -> 22 */}
            {step >= 5 && step < 8 && (
              <g>
                <rect width={VW} height={VH} fill="rgba(10,18,28,.62)" className="up" />
                <g className={step >= 6 ? 'mgl' : 'numin'}>
                  <text x={CX - 210} y={CY + 46} textAnchor="middle" fontSize="164"
                    fontWeight="900" fill="url(#flare)" letterSpacing="-4">11</text>
                  <text x={CX - 210} y={CY + 96} textAnchor="middle" fontSize="15"
                    fontWeight="800" fill={TEAM_B} letterSpacing="6">PLAYERS</text>
                </g>
                <g className={step >= 6 ? 'mgr' : 'numin'} style={{ animationDelay: step >= 6 ? '0ms' : '140ms' }}>
                  <text x={CX + 210} y={CY + 46} textAnchor="middle" fontSize="164"
                    fontWeight="900" fill="url(#flare)" letterSpacing="-4">11</text>
                  <text x={CX + 210} y={CY + 96} textAnchor="middle" fontSize="15"
                    fontWeight="800" fill={TEAM_R} letterSpacing="6">PLAYERS</text>
                </g>

                {/* the big ball, born from the collision. Note: no transform="translate(...)"
                    attribute here — an animated CSS `transform` on the same element silently
                    replaces any presentation-attribute transform, which is what sent this to
                    the top-left corner before. Everything below uses absolute CX/CY instead. */}
                {step >= 6 && (
                  <g className={step >= 7 ? 'balloutwrap' : 'ballinwrap'}>
                    <g className="ballspin">
                      <circle cx={CX} cy={CY} r={BALL_R} fill="url(#ballGrad)"
                        stroke="#0e1826" strokeWidth="4" />
                      <polygon points={pentaPts(CX, CY, 38, 0)} fill="#0e1826" opacity=".92" />
                      {BALL_PANELS.map((b, i) => (
                        <polygon key={i} points={pentaPts(CX + b.cx, CY + b.cy, 33, b.rot)}
                          fill="#0e1826" opacity=".88" />
                      ))}
                      {/* squad22 mark, sitting in a white gap between the panels */}
                      <image href="/images/logo-mono.webp"
                        x={CX - 22} y={CY - BALL_R + 6} width="44" height="44"
                        opacity=".95" />
                    </g>
                  </g>
                )}

                {step >= 7 && (
                  <>
                    <circle className="ringx" cx={CX} cy={CY} r="20" fill="none" stroke="#9fd2ff" />
                    <g className="bang">
                      <text x={CX} y={CY + 52} textAnchor="middle" fontSize="212"
                        fontWeight="900" fill="url(#flare)" letterSpacing="-6">22</text>
                      <text x={CX} y={CY + 108} textAnchor="middle" fontSize="16"
                        fontWeight="800" fill="#9fd2ff" letterSpacing="8">ONE SQUAD</text>
                    </g>
                  </>
                )}
              </g>
            )}

            {/* shield */}
            {step >= 8 && (
              <>
                <rect width={VW} height={VH} fill="rgba(9,16,26,.82)" className="up" />
                <g className="shield">
                  <image href="/images/logo.webp" x={CX - 210} y={CY - 232} width="420" height="414"
                    preserveAspectRatio="xMidYMid meet" />
                </g>
                {step >= 9 && (
                  <text x={CX} y={CY + 236} textAnchor="middle" fontSize="17" fontWeight="800"
                    fill="rgba(190,220,250,.85)" letterSpacing="9" className="up">
                    22 PLAYERS · 3 STAFF · ONE SQUAD
                  </text>
                )}
              </>
            )}
          </svg>

          {/* poster, only when the browser refuses audio */}
          {gate === 'splash' && (
            <div onClick={start} style={{
              position: 'absolute', inset: 0, cursor: 'pointer', background: '#0e1826',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 36,
            }}>
              <div style={{
                position: 'absolute', width: 640, height: 640, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(80,160,230,.18) 0%, transparent 68%)',
                animation: 'breathe 3.6s ease-in-out infinite',
              }} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/logo.webp" alt="Squad22" style={{
                width: 'min(46vw, 400px)', position: 'relative',
                filter: 'drop-shadow(0 26px 64px rgba(0,0,0,.8))',
                animation: 'posterIn .9s cubic-bezier(.2,.9,.25,1) both',
              }} />
              <button onClick={start} aria-label="Play" style={{
                position: 'relative', width: 92, height: 92, borderRadius: '50%',
                border: '2px solid rgba(255,255,255,.85)', background: 'rgba(61,155,224,.2)',
                backdropFilter: 'blur(6px)', cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 54px rgba(61,155,224,.55)',
                animation: 'posterIn .9s cubic-bezier(.2,.9,.25,1) .18s both',
              }}>
                <svg width="30" height="34" viewBox="0 0 30 34">
                  <path d="M3 2 L28 17 L3 32 Z" fill="#fff" />
                </svg>
              </button>
            </div>
          )}

          {gate === 'none' && step > 0 && step < 10 && (
            <button onClick={skip} style={{
              position: 'absolute', right: 24, bottom: 24, padding: '9px 20px', fontSize: 13,
              fontWeight: 700, letterSpacing: 1, color: 'rgba(190,220,250,.7)',
              background: 'rgba(104,168,226,.1)', border: '1px solid rgba(104,168,226,.3)',
              borderRadius: 999, cursor: 'pointer',
            }}>
              Skip ›
            </button>
          )}
        </div>
      )}

      {phase === 'explainer' && <Explainer onRules={() => setPhase('tutorial')} />}
      {phase === 'tutorial' && <Tutorial onDone={() => done.current()} />}
    </div>
  );
}

// ---- post cold-open screens ------------------------------------------------

const fadeInUp = `
  @keyframes fadeInUp { from { opacity: 0; transform: translateY(14px); }
                        to   { opacity: 1; transform: translateY(0); } }
  .fiu { animation: fadeInUp .6s cubic-bezier(.2,.9,.25,1) both; }
`;

// Same navy hatch + dot texture as the cold open, as a plain CSS background so
// the football/card-back motif carries through every screen after it too.
const PITCH_BG: React.CSSProperties = {
  backgroundColor: '#0e1826',
  backgroundImage: `
    repeating-linear-gradient(-38deg, rgba(104,168,226,.07) 0 3px, transparent 3px 26px),
    radial-gradient(circle, rgba(104,168,226,.14) 1.4px, transparent 1.6px)
  `,
  backgroundSize: 'auto, 17px 17px',
};

function Explainer({ onRules }: { onRules: () => void }) {
  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '40px 32px', overflowY: 'auto', ...PITCH_BG,
    }}>
      <style>{fadeInUp}</style>

      <div style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center',
        gap: 44, maxWidth: 760, margin: '0 auto',
      }}>
        {/* the printed card back, upright — its own art already reads as a
            landscape pitch with the goal boxes left/right, so no rotation. */}
        <div className="fiu" style={{
          flex: '0 0 auto', width: 216, height: 302, borderRadius: 16,
          padding: 6, background: '#eef3f8',
          boxShadow: '0 22px 50px rgba(0,0,0,.55), 0 0 0 1px rgba(124,188,240,.25)',
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/card-back.webp"
            alt="Squad22 card back — shield crest on a navy pitch"
            style={{ width: '100%', height: '100%', borderRadius: 11, objectFit: 'cover', display: 'block' }}
          />
        </div>

        {/* copy */}
        <div style={{ flex: '1 1 320px', minWidth: 280, textAlign: 'left' }}>
          <div className="fiu" style={{
            fontSize: 12, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase',
            color: '#5ea6e0', marginBottom: 10,
          }}>
            Squad22 · Football Strategy Card Game
          </div>

          <h2 className="fiu" style={{
            color: '#f4f8fc', fontSize: 36, fontWeight: 800, margin: '0 0 16px',
            letterSpacing: '-0.5px', lineHeight: 1.15, animationDelay: '70ms',
            fontFamily: 'Georgia, "Times New Roman", serif',
          }}>
            This is Squad22.
          </h2>

          <div className="fiu" style={{
            color: 'rgba(214,228,245,.86)', fontSize: 15.5, lineHeight: 1.75,
            margin: 0, animationDelay: '140ms', display: 'flex',
            flexDirection: 'column', gap: 12,
          }}>
            <p style={{ margin: 0 }}>
              Every card matters, every decision carries risk, and the perfect
              squad is never guaranteed.
            </p>
            <p style={{ margin: 0 }}>
              Build formations. Combine positions. Watch the Open Pile.
              Outsmart your rivals.
            </p>
            <p style={{ margin: 0 }}>
              Easy to begin. Different every time. Deeper than it first appears.
            </p>
            <p style={{ margin: '4px 0 0', color: '#f4f8fc', fontWeight: 700, fontSize: 16.5 }}>
              Can you build the winning squad?
            </p>
          </div>

          <button onClick={onRules} className="fiu" style={{
            marginTop: 24, padding: '13px 42px', fontSize: 13, fontWeight: 800,
            letterSpacing: 2.5, textTransform: 'uppercase', color: '#f4f8fc',
            background: 'linear-gradient(135deg, #2f7ec2, #1f3a56)',
            border: '1px solid rgba(159,210,255,.55)', borderRadius: 999, cursor: 'pointer',
            boxShadow: '0 8px 26px rgba(61,155,224,.35)', animationDelay: '220ms',
          }}>
            Rules
          </button>
        </div>
      </div>
    </div>
  );
}
