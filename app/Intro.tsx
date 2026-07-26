'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Squad22 cold open — runs automatically on load, ~9.5s.
 *
 * ball drops & bounces -> pitch and goalposts draw in -> 11 players fly into
 * each half in a 1-4-4-2 -> staff rise on each touchline -> formation label ->
 * SQUAD22 lands.
 *
 * Audio is synthesised with the Web Audio API (no files to ship). Browsers
 * block audio until a user gesture, so the sequence starts silent and a
 * speaker toggle unlocks it — the visuals never wait for a click.
 */

const PITCH = { x: 40, y: 40, w: 920, h: 480 };
const CY = PITCH.y + PITCH.h / 2; // 280

// Default 1-4-4-2, classic numbering.
// 1 GK · 2,3,4,5 DEF · 6,8 central MID · 7,11 wide (flexible) · 9,10 STR
const HOME: { n: number; x: number; y: number }[] = [
  { n: 1, x: 72, y: CY },
  { n: 2, x: 205, y: 110 }, { n: 3, x: 205, y: 222 },
  { n: 4, x: 205, y: 338 }, { n: 5, x: 205, y: 450 },
  { n: 7, x: 338, y: 110 }, { n: 6, x: 338, y: 222 },
  { n: 8, x: 338, y: 338 }, { n: 11, x: 338, y: 450 },
  { n: 9, x: 450, y: 212 }, { n: 10, x: 450, y: 348 },
];
const AWAY = HOME.map((p) => ({ ...p, x: 1000 - p.x }));
const STAFF = ['COACH', 'MANAGER', 'PHYSIO'];

export default function Intro({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [audioOn, setAudioOn] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const audio = useRef<AudioContext | null>(null);
  const done = useRef(onDone);
  done.current = onDone;

  // ---- audio ---------------------------------------------------------------
  const ctx = useCallback((): AudioContext | null => {
    if (!audio.current) {
      const AC = window.AudioContext
        || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      audio.current = new AC();
    }
    return audio.current.state === 'running' ? audio.current : null;
  }, []);

  const noise = (c: AudioContext, dur: number) => {
    const buf = c.createBuffer(1, Math.max(1, Math.ceil(c.sampleRate * dur)), c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buf;
    return src;
  };

  const whistle = useCallback(() => {
    const c = ctx(); if (!c) return;
    const pip = (at: number, len: number) => {
      const t = c.currentTime + at;
      const o = c.createOscillator();
      const w = c.createOscillator();
      const wg = c.createGain();
      const g = c.createGain();
      o.type = 'sine'; o.frequency.value = 2350;
      w.frequency.value = 34; wg.gain.value = 130;
      w.connect(wg); wg.connect(o.frequency);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.15, t + 0.02);
      g.gain.setValueAtTime(0.15, t + len - 0.05);
      g.gain.linearRampToValueAtTime(0, t + len);
      const air = noise(c, len);
      const bp = c.createBiquadFilter();
      bp.type = 'bandpass'; bp.frequency.value = 2400; bp.Q.value = 6;
      const ag = c.createGain(); ag.gain.value = 0.05;
      air.connect(bp); bp.connect(ag); ag.connect(g);
      o.connect(g); g.connect(c.destination);
      o.start(t); o.stop(t + len); w.start(t); w.stop(t + len); air.start(t);
    };
    pip(0, 0.12); pip(0.18, 0.12); pip(0.38, 0.5);
  }, [ctx]);

  const thump = useCallback((vol = 0.55) => {
    const c = ctx(); if (!c) return;
    const t = c.currentTime;
    const o = c.createOscillator(); const g = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(190, t);
    o.frequency.exponentialRampToValueAtTime(46, t + 0.19);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + 0.32);
    const s = noise(c, 0.07);
    const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 900;
    const sg = c.createGain();
    sg.gain.setValueAtTime(vol * 0.5, t);
    sg.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
    s.connect(hp); hp.connect(sg); sg.connect(c.destination); s.start(t);
  }, [ctx]);

  const whoosh = useCallback(() => {
    const c = ctx(); if (!c) return;
    const t = c.currentTime;
    const s = noise(c, 0.6);
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass'; bp.Q.value = 1.1;
    bp.frequency.setValueAtTime(320, t);
    bp.frequency.exponentialRampToValueAtTime(2600, t + 0.42);
    const g = c.createGain();
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(0.2, t + 0.17);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    s.connect(bp); bp.connect(g); g.connect(c.destination); s.start(t);
  }, [ctx]);

  const crowd = useCallback(() => {
    const c = ctx(); if (!c) return;
    const t = c.currentTime;
    const s = noise(c, 4);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1100;
    const g = c.createGain();
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(0.16, t + 0.8);
    g.gain.linearRampToValueAtTime(0.05, t + 4);
    s.connect(lp); lp.connect(g); g.connect(c.destination); s.start(t);
  }, [ctx]);

  const impact = useCallback(() => {
    const c = ctx(); if (!c) return;
    const t = c.currentTime;
    const o = c.createOscillator(); const g = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(112, t);
    o.frequency.exponentialRampToValueAtTime(36, t + 0.55);
    g.gain.setValueAtTime(0.62, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 1);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + 1.05);
  }, [ctx]);

  // ---- timeline ------------------------------------------------------------
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      done.current();
      return;
    }
    const list = timers.current;
    const at = (ms: number, fn: () => void) => { list.push(setTimeout(fn, ms)); };

    whistle();
    at(120, () => setStep(1));                        // ball drops
    at(1080, () => { thump(); setStep(2); });         // impact -> pitch draws
    at(1900, () => { thump(0.25); setStep(3); });     // goals pop
    at(2500, () => { whoosh(); setStep(4); });        // home XI
    at(3500, () => { whoosh(); setStep(5); });        // away XI
    at(4500, () => setStep(6));                       // staff
    at(5300, () => setStep(7));                       // formation label
    at(6300, () => { impact(); crowd(); setStep(8); });// logo
    at(7600, () => setStep(9));                       // tagline
    at(9000, () => setStep(10));                      // fade
    at(9600, () => done.current());
    return () => { list.forEach(clearTimeout); };
  }, [whistle, thump, whoosh, crowd, impact]);

  const enableSound = () => {
    const a = audio.current
      ?? new (window.AudioContext
        || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    audio.current = a;
    a.resume().then(() => setAudioOn(true)).catch(() => {});
  };

  const skip = () => {
    timers.current.forEach(clearTimeout);
    audio.current?.close().catch(() => {});
    done.current();
  };

  const team = (list: typeof HOME, colour: string, dir: 'l' | 'r') =>
    list.map((p, i) => (
      <g key={`${dir}${p.n}`} transform={`translate(${p.x},${p.y})`}>
        <g className={dir === 'l' ? 'fly-l' : 'fly-r'} style={{ animationDelay: `${i * 60}ms` }}>
          <ellipse cy="3" rx="11" ry="3.5" fill="rgba(0,0,0,.35)" />
          <use href="#plr" fill={colour} />
          <circle cy="14" r="9.5" fill="rgba(0,0,0,.6)" />
          <text y="18" textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff">{p.n}</text>
        </g>
      </g>
    ));

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'radial-gradient(circle at 50% 42%, #114023 0%, #071a12 58%, #030c08 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: step >= 10 ? 0 : 1, transition: 'opacity .6s ease',
      }}
    >
      <style>{`
        @keyframes drop {
          0%   { transform: translateY(-520px) rotate(0deg); }
          55%  { transform: translateY(0) rotate(520deg); }
          66%  { transform: translateY(-96px) rotate(650deg); }
          78%  { transform: translateY(0) rotate(760deg); }
          87%  { transform: translateY(-34px) rotate(820deg); }
          95%  { transform: translateY(0) rotate(860deg); }
          100% { transform: translateY(0) rotate(864deg); }
        }
        @keyframes shadowPulse {
          0%   { transform: scaleX(.3); opacity: .12; }
          55%  { transform: scaleX(1); opacity: .5; }
          66%  { transform: scaleX(.55); opacity: .22; }
          78%  { transform: scaleX(1); opacity: .5; }
          87%  { transform: scaleX(.78); opacity: .34; }
          100% { transform: scaleX(1); opacity: .5; }
        }
        @keyframes ballOut { to { transform: scale(0); opacity: 0; } }
        @keyframes flyL { from { transform: translateX(-900px) scale(.3); opacity: 0; }
                          to   { transform: translateX(0) scale(1); opacity: 1; } }
        @keyframes flyR { from { transform: translateX(900px) scale(.3); opacity: 0; }
                          to   { transform: translateX(0) scale(1); opacity: 1; } }
        @keyframes riseUp { from { transform: translateY(48px); opacity: 0; }
                            to   { transform: translateY(0); opacity: 1; } }
        @keyframes slam {
          0%   { transform: scale(3.2); opacity: 0; }
          58%  { transform: scale(.94); opacity: 1; }
          76%  { transform: scale(1.04); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeUp { from { transform: translateY(14px); opacity: 0; }
                            to   { transform: translateY(0); opacity: 1; } }
        @keyframes draw { to { stroke-dashoffset: 0; } }
        @keyframes pop { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }

        .ball    { animation: drop 1.6s cubic-bezier(.45,0,.55,1) forwards;
                   transform-box: fill-box; transform-origin: center; }
        .bshadow { animation: shadowPulse 1.6s cubic-bezier(.45,0,.55,1) forwards;
                   transform-box: fill-box; transform-origin: center; }
        .ballout { animation: ballOut .4s ease-in forwards;
                   transform-box: fill-box; transform-origin: center; }
        .fly-l   { animation: flyL .6s cubic-bezier(.16,.9,.3,1.05) backwards; }
        .fly-r   { animation: flyR .6s cubic-bezier(.16,.9,.3,1.05) backwards; }
        .rise    { animation: riseUp .55s ease-out backwards; }
        .logo    { animation: slam .95s cubic-bezier(.2,.9,.25,1) forwards;
                   transform-box: fill-box; transform-origin: center; }
        .tag     { animation: fadeUp .6s ease-out backwards; }
        .goal    { animation: pop .45s cubic-bezier(.2,1.3,.4,1) backwards;
                   transform-box: fill-box; transform-origin: center; }
        .line    { stroke-dasharray: 3200; stroke-dashoffset: 3200;
                   animation: draw 1.2s ease-out forwards; }
      `}</style>

      <svg viewBox="0 0 1000 640" style={{ width: '94vw', maxWidth: 1180 }}>
        <defs>
          <g id="plr">
            <circle cx="0" cy="-34" r="5.4" />
            <path d="M-8 -27 q8 -2.6 16 0 l1.6 14.5 q-9.6 2.6 -19.2 0 z" />
            <path d="M-8 -27 l-3.6 13 2.7 .9 4.3 -11.2 z" />
            <path d="M8 -27 l3.6 13 -2.7 .9 -4.3 -11.2 z" />
            <path d="M-6.4 -13 l-1.1 13.5 4.2 0 1.7 -12.6 z" />
            <path d="M6.4 -13 l1.1 13.5 -4.2 0 -1.7 -12.6 z" />
          </g>
          <clipPath id="ballClip"><circle r="21" /></clipPath>
        </defs>

        {/* pitch */}
        {step >= 2 && (
          <g>
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

        {/* goalposts */}
        {step >= 3 && (
          <g className="goal">
            <rect x={PITCH.x - 26} y={CY - 50} width="26" height="100"
              fill="rgba(255,255,255,.15)" stroke="#fff" strokeWidth="3.5" />
            <rect x={PITCH.x + PITCH.w} y={CY - 50} width="26" height="100"
              fill="rgba(255,255,255,.15)" stroke="#fff" strokeWidth="3.5" />
          </g>
        )}

        {/* football */}
        {step >= 1 && step < 8 && (
          <g transform={`translate(500,${CY})`} className={step >= 7 ? 'ballout' : undefined}>
            <ellipse className="bshadow" cy="26" rx="20" ry="5" fill="#000" />
            <g className="ball">
              <circle r="21" fill="#fdfdfd" />
              <g clipPath="url(#ballClip)" fill="#141414">
                <path d="M0 -11 l10.5 7.6 -4 12.3 -13 0 -4-12.3 z" />
                <path d="M0 -30 l9 6.5 -3.4 10.6 -11.2 0 -3.4-10.6 z" />
                <path d="M27 -8 l9 6.5 -3.4 10.6 -11.2 0 -3.4-10.6 z" />
                <path d="M-27 -8 l9 6.5 -3.4 10.6 -11.2 0 -3.4-10.6 z" />
                <path d="M17 20 l9 6.5 -3.4 10.6 -11.2 0 -3.4-10.6 z" />
                <path d="M-17 20 l9 6.5 -3.4 10.6 -11.2 0 -3.4-10.6 z" />
              </g>
              <circle r="21" fill="none" stroke="rgba(0,0,0,.22)" strokeWidth="1.5" />
              <ellipse cx="-7" cy="-8" rx="6" ry="4" fill="rgba(255,255,255,.5)" />
            </g>
          </g>
        )}

        {step >= 4 && team(HOME, '#5ac8fa', 'l')}
        {step >= 5 && team(AWAY, '#ff6b6b', 'r')}

        {/* staff */}
        {step >= 6 && (
          <g>
            {STAFF.map((role, i) => (
              <g key={`h${role}`} transform={`translate(${175 + i * 108},612)`}
                className="rise" style={{ animationDelay: `${i * 80}ms` }}>
                <use href="#plr" fill="#2f8fbf" transform="scale(.6)" />
                <text y="13" textAnchor="middle" fontSize="10.5" fontWeight="700"
                  fill="rgba(255,255,255,.8)" letterSpacing="1.2">{role}</text>
              </g>
            ))}
            {STAFF.map((role, i) => (
              <g key={`a${role}`} transform={`translate(${610 + i * 108},612)`}
                className="rise" style={{ animationDelay: `${240 + i * 80}ms` }}>
                <use href="#plr" fill="#c0504e" transform="scale(.6)" />
                <text y="13" textAnchor="middle" fontSize="10.5" fontWeight="700"
                  fill="rgba(255,255,255,.8)" letterSpacing="1.2">{role}</text>
              </g>
            ))}
          </g>
        )}

        {/* formation callout */}
        {step >= 7 && step < 8 && (
          <g className="tag">
            <text x="500" y="26" textAnchor="middle" fontSize="21" fontWeight="900"
              fill="#00e676" letterSpacing="7">1 · 4 · 4 · 2</text>
          </g>
        )}

        {/* logo */}
        {step >= 8 && (
          <>
            <rect x="0" y="0" width="1000" height="640" fill="rgba(3,12,8,.72)" className="tag" />
            <g className="logo">
              <rect x="196" y="180" width="608" height="216" rx="20"
                fill="rgba(3,12,8,.9)" stroke="rgba(255,255,255,.18)" strokeWidth="2" />
              <text x="500" y="292" textAnchor="middle" fontSize="112" fontWeight="900"
                fill="#fff" letterSpacing="7">SQUAD</text>
              <text x="470" y="362" textAnchor="middle" fontSize="58" fontWeight="900" fill="#e63946">2</text>
              <text x="530" y="362" textAnchor="middle" fontSize="58" fontWeight="900" fill="#ffd93d">2</text>
            </g>
            {step >= 9 && (
              <text x="500" y="438" textAnchor="middle" fontSize="15" fontWeight="700"
                fill="rgba(255,255,255,.72)" letterSpacing="6" className="tag">
                22 PLAYERS · 3 STAFF · ONE SQUAD
              </text>
            )}
          </>
        )}
      </svg>

      {!audioOn && step < 10 && (
        <button onClick={enableSound} title="Enable sound"
          style={{
            position: 'absolute', right: 24, top: 24, padding: '9px 18px', fontSize: 13,
            fontWeight: 700, letterSpacing: 1, color: 'rgba(255,255,255,.8)',
            background: 'rgba(255,255,255,.09)', border: '1px solid rgba(255,255,255,.24)',
            borderRadius: 999, cursor: 'pointer',
          }}>
          🔊 Sound
        </button>
      )}

      {step < 10 && (
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
