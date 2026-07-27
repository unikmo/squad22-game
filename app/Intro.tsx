'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { playScore, canAutoplay } from './introScore';

/**
 * Squad22 cold open — art-directed to match the printed card back:
 * deep navy (#162638), pitch rendered as blue line art rather than a green
 * field, diagonal hatching and dot grids, real shield logo.
 *
 * Beat sheet:
 *   pitch draws in -> 11 blue cards fly in left, 11 red fly in right ->
 *   3 staff rise on each touchline -> a giant "11" over each half ->
 *   the two elevens collide into "22" -> SQUAD22 shield.
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

export default function Intro({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [gate, setGate] = useState<'wait' | 'splash' | 'none'>('wait');
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const audio = useRef<AudioContext | null>(null);
  const done = useRef(onDone);
  done.current = onDone;

  const runSequence = useCallback((withSound: boolean) => {
    const list = timers.current;
    const at = (ms: number, fn: () => void) => { list.push(setTimeout(fn, ms)); };
    if (withSound && audio.current) playScore(audio.current);
    setStep(1);                       // pitch draws in
    at(1100, () => setStep(2));       // blue XI
    at(2100, () => setStep(3));       // red XI
    at(3100, () => setStep(4));       // staff
    at(4000, () => setStep(5));       // the two elevens
    at(5200, () => setStep(6));       // collide
    at(6400, () => setStep(7));       // shield
    at(7600, () => setStep(8));       // tagline
    at(9200, () => setStep(9));       // fade
    at(9800, () => done.current());
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
      opacity: step >= 9 ? 0 : 1, transition: 'opacity .6s ease',
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
        .mgl   { animation: mergeL .75s cubic-bezier(.6,0,.4,1) forwards;
                 transform-box: fill-box; transform-origin: center; }
        .mgr   { animation: mergeR .75s cubic-bezier(.6,0,.4,1) forwards;
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
        </defs>

        {/* backdrop, matching the card back */}
        <rect width={VW} height={VH} fill="url(#vig)" />
        <rect width={VW} height={VH} fill="url(#hatch)" />
        <rect x="0" y="0" width="210" height={VH} fill="url(#dots)" opacity=".5" />
        <rect x={VW - 210} y="0" width="210" height={VH} fill="url(#dots)" opacity=".5" />

        {/* pitch as line art */}
        {step >= 1 && (
          <g className={step >= 7 ? 'dimmer' : undefined}>
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

        <g className={step >= 7 ? 'dimmer' : undefined}>
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

        {/* 11 + 11 */}
        {step >= 5 && step < 7 && (
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
            {step >= 6 && (
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
        {step >= 7 && (
          <>
            <rect width={VW} height={VH} fill="rgba(9,16,26,.82)" className="up" />
            <g className="shield">
              <image href="/images/logo.webp" x={CX - 210} y={CY - 232} width="420" height="414"
                preserveAspectRatio="xMidYMid meet" />
            </g>
            {step >= 8 && (
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

      {gate === 'none' && step > 0 && step < 9 && (
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
  );
}
