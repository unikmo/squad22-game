'use client';

import { useState } from 'react';

/**
 * Short, card-based walkthrough shown after the cold open when the player
 * asks to see the rules. Advances manually (Next/Back) so nobody feels
 * rushed — each slide replays its little animation on arrival. Order follows
 * an actual turn: shuffle -> deal -> draw -> play (pair / triple) -> discard
 * & win, matching lib/gameLogic.ts (7-card starting hand, 300/500 target).
 *
 * Position Pair and Trait Triple are illustrated with small replica cards
 * (name / position / trait pill) rather than the cinematic photo art, using
 * the exact trait colours the live game uses (see app/game/page.tsx
 * traitColors) so "same trait" reads unambiguously — three cards, one
 * identical coloured pill, three different position numbers.
 */

const TRAIT_COLORS: Record<string, string> = {
  Red: '#ff6b6b', Blue: '#4ecdc4', Yellow: '#ffd93d', Green: '#6bcf7f',
};

// Same texture as the cold open / explainer, so the pitch motif never disappears.
const pitchBg: React.CSSProperties = {
  backgroundColor: '#0e1826',
  backgroundImage: `
    repeating-linear-gradient(-38deg, rgba(104,168,226,.06) 0 3px, transparent 3px 26px),
    radial-gradient(circle, rgba(104,168,226,.12) 1.4px, transparent 1.6px)
  `,
  backgroundSize: 'auto, 17px 17px',
};

const ctaStyle: React.CSSProperties = {
  padding: '12px 30px', fontSize: 14, fontWeight: 800, letterSpacing: 1.5,
  textTransform: 'uppercase', color: '#eaf3fc',
  background: 'linear-gradient(135deg, #2f7ec2, #1f3a56)',
  border: '1px solid rgba(159,210,255,.55)', borderRadius: 999, cursor: 'pointer',
  boxShadow: '0 6px 20px rgba(61,155,224,.3)',
};

function MiniCard({ name, position, trait }: { name: string; position: number; trait: string }) {
  const swatch = TRAIT_COLORS[trait] || '#888';
  return (
    <div style={{
      width: 94, background: '#f7fafc', borderRadius: 11, padding: '10px 6px 9px',
      textAlign: 'center', boxShadow: '0 8px 22px rgba(0,0,0,.45)',
      border: '2px solid rgba(255,255,255,.7)',
    }}>
      <div style={{ fontWeight: 800, fontSize: 12.5, color: '#162638', marginBottom: 3 }}>{name}</div>
      <div style={{ fontSize: 10, color: '#667', marginBottom: 7 }}>Position {position}</div>
      <div style={{
        display: 'inline-block', padding: '3px 11px', borderRadius: 999, fontSize: 10,
        fontWeight: 800, letterSpacing: .5,
        color: trait === 'Yellow' ? '#3a2e00' : '#fff', background: swatch,
      }}>
        {trait}
      </div>
    </div>
  );
}

function CardBack({ style }: { style?: React.CSSProperties }) {
  return (
    <div style={{
      width: 58, height: 82, borderRadius: 7, position: 'absolute',
      background: 'linear-gradient(135deg, #1f3a56, #0e1826)',
      border: '2px solid rgba(61,155,224,.55)',
      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.05)',
      ...style,
    }} />
  );
}

function Trophy() {
  return (
    <svg width="72" height="92" viewBox="0 0 72 92" style={{ filter: 'drop-shadow(0 8px 14px rgba(0,0,0,.5))' }}>
      <defs>
        <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff6d8" />
          <stop offset="45%" stopColor="#f0c14b" />
          <stop offset="100%" stopColor="#b9791a" />
        </linearGradient>
      </defs>
      <path d="M18 6 H54 V27 C54 43 45 51 36 51 C27 51 18 43 18 27 Z"
        fill="url(#gold)" stroke="#8a5a10" strokeWidth="1.4" />
      <path d="M18 13 C5 13 5 36 20 36" fill="none" stroke="url(#gold)"
        strokeWidth="5" strokeLinecap="round" />
      <path d="M54 13 C67 13 67 36 52 36" fill="none" stroke="url(#gold)"
        strokeWidth="5" strokeLinecap="round" />
      <rect x="32" y="51" width="8" height="15" fill="url(#gold)" />
      <rect x="21" y="66" width="30" height="8" rx="2" fill="url(#gold)" stroke="#8a5a10" strokeWidth="1" />
      <rect x="14" y="75" width="44" height="9" rx="2.5" fill="url(#gold)" stroke="#8a5a10" strokeWidth="1" />
      <path d="M23 9 Q20 26 29 37" fill="none" stroke="#fff8e0" strokeWidth="2" opacity=".55" strokeLinecap="round" />
    </svg>
  );
}

function ShuffleSlide() {
  const cards = [0, 1, 2, 3, 4];
  return (
    <div className="stage">
      <div className="shuffledeck">
        {cards.map((i) => (
          <CardBack key={i} style={{
            animation: `shuffle${i % 3} 1.1s ease-in-out ${i * 70}ms infinite alternate`,
            zIndex: i,
          }} />
        ))}
      </div>
      <style>{`
        .stage { display: flex; align-items: center; justify-content: center; height: 190px; }
        .shuffledeck { position: relative; width: 58px; height: 82px; }
        @keyframes shuffle0 { from { transform: translateX(-10px) rotate(-9deg); } to { transform: translateX(3px) rotate(3deg); } }
        @keyframes shuffle1 { from { transform: translateX(8px) rotate(7deg); } to { transform: translateX(-6px) rotate(-5deg); } }
        @keyframes shuffle2 { from { transform: translateY(-6px) rotate(-3deg); } to { transform: translateY(4px) rotate(4deg); } }
      `}</style>
    </div>
  );
}

function DealSlide() {
  const n = 7;
  return (
    <div className="stage">
      <div className="row">
        <div className="hand">
          {Array.from({ length: n }, (_, i) => (
            <CardBack key={i} style={{
              position: 'relative', width: 30, height: 44, marginLeft: i ? -14 : 0,
              animation: `dealIn .5s cubic-bezier(.2,.9,.25,1) ${i * 110}ms both`,
            }} />
          ))}
        </div>
        <div className="label">You · 7 cards</div>
      </div>
      <div className="row" style={{ marginTop: 14 }}>
        <div className="hand">
          {Array.from({ length: n }, (_, i) => (
            <CardBack key={i} style={{
              position: 'relative', width: 30, height: 44, marginLeft: i ? -14 : 0,
              animation: `dealIn .5s cubic-bezier(.2,.9,.25,1) ${300 + i * 110}ms both`,
            }} />
          ))}
        </div>
        <div className="label">Rival · 7 cards</div>
      </div>
      <style>{`
        .stage { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 190px; gap: 4px; }
        .row { display: flex; flex-direction: column; align-items: center; gap: 6px; }
        .hand { display: flex; }
        .label { font-size: 11px; color: rgba(190,220,250,.6); font-weight: 700; letter-spacing: .5px; }
        @keyframes dealIn { from { transform: translateY(-30px) scale(.5); opacity: 0; }
                             to   { transform: translateY(0) scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}

function DrawBoardSlide() {
  return (
    <div className="stage">
      <div className="board">
        <div className="pile">
          <CardBack style={{ position: 'relative', left: 4, top: 4 }} />
          <CardBack style={{ position: 'relative', left: 2, top: 2, marginTop: -82 }} />
          <CardBack style={{ position: 'relative', marginTop: -82, animation: 'pulseGlow 1.8s ease-in-out infinite' }} />
          <div className="tag">Draw Pile</div>
        </div>
        <div className="arrowmid">OR</div>
        <div className="pile">
          <div className="openface" />
          <div className="tag">Open Pile</div>
        </div>
      </div>
      <style>{`
        .stage { display: flex; align-items: center; justify-content: center; height: 190px; }
        .board { display: flex; align-items: flex-end; gap: 26px; padding: 16px 22px;
                 border-radius: 14px; border: 1px solid rgba(104,168,226,.3);
                 background: rgba(61,155,224,.06); }
        .pile { display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .tag { font-size: 10px; font-weight: 800; letter-spacing: .5px; color: rgba(190,220,250,.75); }
        .arrowmid { color: #3d9be0; font-size: 12px; font-weight: 800; align-self: center;
                    margin-bottom: 22px; }
        .openface { width: 58px; height: 82px; border-radius: 7px;
                    background: linear-gradient(135deg, #2f7ec2, #1f3a56);
                    border: 2px solid rgba(159,210,255,.6); display: flex;
                    align-items: center; justify-content: center; color: #eaf3fc;
                    font-weight: 900; font-size: 22px; }
        @keyframes pulseGlow { 0%,100% { box-shadow: 0 0 0 rgba(61,155,224,0); }
                                50%    { box-shadow: 0 0 18px rgba(61,155,224,.6); } }
      `}</style>
    </div>
  );
}

function PairSlide() {
  return (
    <div className="stage">
      <div className="pairwrap">
        <div className="pcard left"><MiniCard name="Ajeck" position={3} trait="Red" /></div>
        <div className="pcard right"><MiniCard name="Ashley" position={3} trait="Blue" /></div>
      </div>
      <div className="badge">+10</div>
      <style>{`
        .stage { position: relative; display: flex; flex-direction: column; align-items: center;
                 justify-content: center; height: 190px; gap: 14px; }
        .pairwrap { display: flex; gap: 4px; }
        .pcard { animation-fill-mode: both; }
        .left  { animation: inFromLeft .6s cubic-bezier(.2,.9,.25,1) both; }
        .right { animation: inFromRight .6s cubic-bezier(.2,.9,.25,1) both; }
        @keyframes inFromLeft  { from { transform: translateX(-60px) rotate(-6deg); opacity: 0; }
                                  to   { transform: translateX(6px) rotate(-2deg); opacity: 1; } }
        @keyframes inFromRight { from { transform: translateX(60px) rotate(6deg); opacity: 0; }
                                  to   { transform: translateX(-6px) rotate(2deg); opacity: 1; } }
        .badge { color: #000; background: #3d9be0; font-weight: 900;
                 font-size: 18px; padding: 6px 16px; border-radius: 999px;
                 box-shadow: 0 0 22px rgba(61,155,224,.55);
                 animation: badgeIn .5s cubic-bezier(.2,.9,.25,1) .5s both; }
        @keyframes badgeIn { from { transform: scale(.3); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}

function TripleSlide() {
  const cards: Array<{ name: string; position: number }> = [
    { name: 'Carifive', position: 2 },
    { name: 'Ebongue', position: 7 },
    { name: 'Kuma', position: 11 },
  ];
  return (
    <div className="stage">
      <div className="triplewrap">
        {cards.map((c, i) => (
          <div key={c.name} className={`tcard t${i}`}>
            <MiniCard name={c.name} position={c.position} trait="Red" />
          </div>
        ))}
      </div>
      <div className="badge">+5</div>
      <style>{`
        .stage { position: relative; display: flex; flex-direction: column; align-items: center;
                 justify-content: center; height: 190px; gap: 14px; }
        .triplewrap { display: flex; }
        .tcard { margin: 0 -4px; }
        .t0 { animation: t0in .6s cubic-bezier(.2,.9,.25,1) both; }
        .t1 { animation: t1in .6s cubic-bezier(.2,.9,.25,1) both; }
        .t2 { animation: t2in .6s cubic-bezier(.2,.9,.25,1) both; }
        @keyframes t0in { from { transform: translate(-60px,14px) rotate(-9deg); opacity: 0; }
                           to   { transform: translate(4px,10px) rotate(-5deg); opacity: 1; } }
        @keyframes t1in { from { transform: translateY(-40px) scale(.75); opacity: 0; }
                           to   { transform: translateY(-6px) scale(1); opacity: 1; } }
        @keyframes t2in { from { transform: translate(60px,14px) rotate(9deg); opacity: 0; }
                           to   { transform: translate(-4px,10px) rotate(5deg); opacity: 1; } }
        .badge { color: #000; background: #ff6b6b; font-weight: 900;
                 font-size: 18px; padding: 6px 16px; border-radius: 999px;
                 box-shadow: 0 0 22px rgba(255,107,107,.5);
                 animation: badgeIn .5s cubic-bezier(.2,.9,.25,1) .55s both; }
        @keyframes badgeIn { from { transform: scale(.3); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}

function WinSlide() {
  return (
    <div className="stage">
      <div className="discardrow">
        <CardBack style={{ position: 'relative', animation: 'toOpen .8s cubic-bezier(.2,.9,.25,1) both' }} />
        <div className="dtag">Discard 1 → ends your turn</div>
      </div>
      <div className="trophy"><Trophy /></div>
      <div className="bar"><div className="fill" /></div>
      <div className="score">First to 300 or 500 pts wins</div>
      <style>{`
        .stage { display: flex; flex-direction: column; align-items: center; justify-content: center;
                 gap: 10px; height: 190px; }
        .discardrow { display: flex; flex-direction: column; align-items: center; gap: 6px; }
        .dtag { font-size: 10.5px; color: rgba(190,220,250,.65); font-weight: 700; }
        @keyframes toOpen { from { transform: translateY(-16px); opacity: 0; }
                             to   { transform: translateY(0); opacity: 1; } }
        .trophy { animation: trophyIn 1s cubic-bezier(.2,.9,.25,1) .25s both; }
        @keyframes trophyIn { from { transform: translateY(-10px) scale(.6); opacity: 0; }
                               60%  { transform: translateY(0) scale(1.06); opacity: 1; }
                               to   { transform: translateY(0) scale(1); opacity: 1; } }
        .bar { width: 220px; height: 12px; border-radius: 999px; background: rgba(61,155,224,.15);
               border: 1px solid rgba(61,155,224,.4); overflow: hidden; }
        .fill { height: 100%; width: 0%; border-radius: 999px;
                background: linear-gradient(90deg, #3d9be0, #7cbcf0);
                animation: fillBar 1.2s cubic-bezier(.2,.9,.25,1) .6s forwards; }
        @keyframes fillBar { to { width: 100%; } }
        .score { color: #cfe4fb; font-weight: 800; letter-spacing: .5px; font-size: 12.5px;
                 animation: fiuScore .5s ease 1.6s both; }
        @keyframes fiuScore { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}

type Slide = { key: string; title: string; body: string; render: () => JSX.Element };

const SLIDES: Slide[] = [
  { key: 'shuffle', title: 'Shuffle', body: 'The 58-card deck is shuffled before every match — same deck, different game.', render: ShuffleSlide },
  { key: 'deal', title: 'Deal', body: 'Each player is dealt a starting hand of 7 cards.', render: DealSlide },
  { key: 'draw', title: 'Draw', body: 'On your turn, draw 1 card — from the closed Draw Pile, or take the top card sitting face-up on the Open Pile.', render: DrawBoardSlide },
  { key: 'pair', title: 'Position Pair', body: 'Play 2 cards that share the same position number for +10 points. Trait doesn’t matter here — position does.', render: PairSlide },
  { key: 'triple', title: 'Trait Triple', body: 'Play 3 cards with the same trait, in 3 different positions, for +5 points.', render: TripleSlide },
  { key: 'win', title: 'Discard & Win', body: 'Discard 1 card to end your turn — it becomes the new Open Pile. First team to reach the target score (300 or 500) wins the match.', render: WinSlide },
];

export default function Tutorial({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const slide = SLIDES[i];
  const isLast = i === SLIDES.length - 1;
  const Visual = slide.render;

  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '32px 24px', gap: 16,
      ...pitchBg,
    }}>
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(14px); }
                              to   { opacity: 1; transform: translateY(0); } }
        .tut-fiu { animation: fadeInUp .5s cubic-bezier(.2,.9,.25,1) both; }
      `}</style>

      <div style={{ color: 'rgba(190,220,250,.65)', fontSize: 12, fontWeight: 800,
        letterSpacing: 2, textTransform: 'uppercase' }}>
        How to Play · {i + 1} / {SLIDES.length}
      </div>

      <div key={slide.key} style={{ width: '100%', maxWidth: 460 }}>
        <Visual />
      </div>

      <div key={`t-${slide.key}`} className="tut-fiu" style={{ textAlign: 'center', maxWidth: 460 }}>
        <h3 style={{ color: '#eaf3fc', fontSize: 23, fontWeight: 900, margin: '0 0 8px' }}>
          {slide.title}
        </h3>
        <p style={{ color: 'rgba(210,228,248,.85)', fontSize: 14.5, lineHeight: 1.6, margin: 0 }}>
          {slide.body}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
        {SLIDES.map((s, idx) => (
          <div key={s.key} style={{
            width: 8, height: 8, borderRadius: '50%',
            background: idx === i ? '#3d9be0' : 'rgba(61,155,224,.25)',
            transition: 'background .3s ease',
          }} />
        ))}
      </div>

      <div style={{ display: 'flex', gap: 14, marginTop: 6, alignItems: 'center' }}>
        {i > 0 && (
          <button onClick={() => setI(i - 1)} style={{
            padding: '11px 24px', fontSize: 13, fontWeight: 700, color: '#cfe4fb',
            background: 'transparent', border: '2px solid rgba(61,155,224,.4)',
            borderRadius: 999, cursor: 'pointer',
          }}>
            Back
          </button>
        )}
        {!isLast && (
          <button onClick={() => setI(i + 1)} style={ctaStyle}>
            Next
          </button>
        )}
        {isLast && (
          <button onClick={onDone} style={ctaStyle}>
            Let&apos;s Play
          </button>
        )}
      </div>

      {!isLast && (
        <button onClick={onDone} style={{
          marginTop: 2, padding: '6px 10px', fontSize: 12, fontWeight: 600,
          color: 'rgba(190,220,250,.55)', background: 'transparent', border: 'none',
          cursor: 'pointer', textDecoration: 'underline',
        }}>
          Skip tutorial
        </button>
      )}
    </div>
  );
}
