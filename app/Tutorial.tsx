'use client';

import { useState } from 'react';

/**
 * Card-based rules walkthrough shown after the cold open, in actual turn
 * order: shuffle -> deal (+ start the Open Pile) -> draw -> play a Position
 * Pair -> play a Trait Triple -> discard (mandatory, hand penalty) -> your
 * squad builds up -> the match ends. Advances manually so nobody feels
 * rushed; each slide replays its animation on arrival.
 *
 * Position Pair / Trait Triple use real card art (not abstract mockups) with
 * a position badge + trait dot overlaid, and show the actual points printed
 * on each card rather than an invented combo bonus — score is the sum of
 * what's on the cards you play, exactly as lib/gameLogic.ts computes it.
 */

const TRAIT_COLORS: Record<string, string> = {
  Red: '#ff6b6b', Blue: '#4ecdc4', Yellow: '#ffd93d', Green: '#6bcf7f',
};

const cardImg = (id: number) => `/images/cards/${String(id).padStart(2, '0')}.webp`;

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

/** The real card back, framed with the same white card-edge as the print art. */
function CardBackImg({ w, style }: { w: number; style?: React.CSSProperties }) {
  const h = Math.round(w * 1.4);
  return (
    <div style={{
      width: w, height: h, borderRadius: w * 0.14, background: '#eef3f8',
      padding: Math.max(2, w * 0.05), boxShadow: '0 6px 16px rgba(0,0,0,.5)', ...style,
    }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/card-back.webp" alt="" style={{
        width: '100%', height: '100%', borderRadius: w * 0.1, objectFit: 'cover', display: 'block',
      }} />
    </div>
  );
}

/** A real player card face, with a position badge, a trait dot, and its printed points. */
function RealCard({ id, name, position, trait, points, w = 76 }: {
  id: number; name: string; position: number; trait: string; points: number; w?: number;
}) {
  const h = Math.round(w * 1.42);
  return (
    <div style={{
      width: w, height: h, borderRadius: 10, position: 'relative', overflow: 'hidden',
      border: '3px solid #fff', boxShadow: '0 10px 24px rgba(0,0,0,.5)', background: '#233',
    }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={cardImg(id)} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{
        position: 'absolute', top: 5, left: 5, width: 19, height: 19, borderRadius: '50%',
        background: '#162638', color: '#fff', fontSize: 10, fontWeight: 900,
        display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #fff',
      }}>
        {position}
      </div>
      <div style={{
        position: 'absolute', top: 6, right: 6, width: 12, height: 12, borderRadius: '50%',
        background: TRAIT_COLORS[trait] || '#888', border: '1.5px solid #fff',
      }} />
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        background: 'linear-gradient(transparent, rgba(0,0,0,.8) 55%)',
        padding: '14px 6px 5px', display: 'flex', flexDirection: 'column', gap: 1,
      }}>
        <span style={{ fontSize: 9, fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>{name}</span>
        <span style={{ fontSize: 9, fontWeight: 700, color: '#ffd93d' }}>{points} pts</span>
      </div>
    </div>
  );
}

function ShuffleSlide() {
  const cards = [0, 1, 2, 3, 4];
  return (
    <div className="stage">
      <div className="shuffledeck">
        {cards.map((i) => (
          <CardBackImg key={i} w={58} style={{
            position: 'absolute', top: 0, left: 0,
            animation: `shuffle${i % 3} 1.1s ease-in-out ${i * 70}ms infinite alternate`,
            zIndex: i,
          }} />
        ))}
      </div>
      <style>{`
        .stage { display: flex; align-items: center; justify-content: center; height: 150px; }
        .shuffledeck { position: relative; width: 58px; height: 82px; }
        @keyframes shuffle0 { from { transform: translateX(-11px) rotate(-9deg); } to { transform: translateX(3px) rotate(3deg); } }
        @keyframes shuffle1 { from { transform: translateX(9px) rotate(7deg); } to { transform: translateX(-7px) rotate(-5deg); } }
        @keyframes shuffle2 { from { transform: translateY(-7px) rotate(-3deg); } to { transform: translateY(5px) rotate(4deg); } }
      `}</style>
    </div>
  );
}

function DealSlide() {
  const n = 7;
  const row = (label: string, delayBase: number) => (
    <div className="row">
      <div className="label">{label}</div>
      <div className="hand">
        {Array.from({ length: n }, (_, i) => (
          <CardBackImg key={i} w={26} style={{
            position: 'relative', marginLeft: i ? -12 : 0,
            animation: `dealIn .5s cubic-bezier(.2,.9,.25,1) ${delayBase + i * 90}ms both`,
          }} />
        ))}
      </div>
    </div>
  );
  return (
    <div className="stage">
      {row('You', 0)}
      {row('Rival', n * 90 + 150)}
      <div className="openstart" style={{ animationDelay: `${2 * (n * 90) + 500}ms` }}>
        <CardBackImg w={26} style={{ position: 'relative', opacity: 0 }} />
        <span className="flip">🂠 → 1 card flips up to start the Open Pile</span>
      </div>
      <style>{`
        .stage { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 176px; gap: 10px; }
        .row { display: flex; flex-direction: column; align-items: center; gap: 5px; }
        .hand { display: flex; }
        .label { font-size: 11px; color: rgba(190,220,250,.7); font-weight: 800; letter-spacing: .5px; text-transform: uppercase; }
        .openstart { display: flex; align-items: center; gap: 8px; font-size: 11px; color: #9fd2ff;
                     font-weight: 700; animation: fadeInOnly .5s ease both; }
        .flip { max-width: 220px; text-align: left; }
        @keyframes dealIn { from { transform: translateY(-24px) scale(.5); opacity: 0; }
                             to   { transform: translateY(0) scale(1); opacity: 1; } }
        @keyframes fadeInOnly { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}

function DrawBoardSlide() {
  return (
    <div className="stage">
      <div className="board">
        <div className="pile">
          <div className="stackwrap">
            <CardBackImg w={58} style={{ position: 'absolute', left: 5, top: 5 }} />
            <CardBackImg w={58} style={{ position: 'absolute', left: 2, top: 2 }} />
            <CardBackImg w={58} style={{ position: 'absolute', left: 0, top: 0, animation: 'pulseGlow 1.8s ease-in-out infinite' }} />
          </div>
          <div className="tag">Draw Pile (closed)</div>
        </div>
        <div className="arrowmid">OR</div>
        <div className="pile">
          <RealCard id={25} name="Choupo" position={8} trait="Blue" points={10} w={58} />
          <div className="tag">Open Pile (face-up)</div>
        </div>
      </div>
      <div className="note">*Taking from the Open Pile means taking that card and everything stacked on top of it — not just one from the middle.</div>
      <style>{`
        .stage { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 176px; gap: 10px; }
        .board { display: flex; align-items: flex-end; gap: 26px; padding: 14px 20px;
                 border-radius: 14px; border: 1px solid rgba(104,168,226,.3);
                 background: rgba(61,155,224,.06); }
        .pile { display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .stackwrap { position: relative; width: 58px; height: 82px; }
        .tag { font-size: 9.5px; font-weight: 800; letter-spacing: .3px; color: rgba(190,220,250,.75); text-align: center; max-width: 100px; }
        .arrowmid { color: #3d9be0; font-size: 12px; font-weight: 900; align-self: center; margin-bottom: 26px; }
        .note { font-size: 10.5px; color: rgba(190,220,250,.6); max-width: 340px; text-align: center; line-height: 1.5; }
        @keyframes pulseGlow { 0%,100% { box-shadow: 0 6px 16px rgba(0,0,0,.5); }
                                50%    { box-shadow: 0 0 18px rgba(61,155,224,.7); } }
      `}</style>
    </div>
  );
}

function SumLine({ parts, total, delay }: { parts: number[]; total: number; delay: number }) {
  return (
    <div className="sumline" style={{ animationDelay: `${delay}ms` }}>
      {parts.join(' + ')} = <strong>{total} pts</strong>
      <style>{`
        .sumline { font-size: 13px; font-weight: 800; color: #cfe4fb;
                   animation: fadeInOnly .5s ease both; }
        @keyframes fadeInOnly { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}

function PairSlide() {
  return (
    <div className="stage">
      <div className="pairwrap">
        <div className="left"><RealCard id={15} name="Teche" position={6} trait="Green" points={10} /></div>
        <div className="right"><RealCard id={16} name="Enjeck" position={6} trait="Red" points={10} /></div>
      </div>
      <SumLine parts={[10, 10]} total={20} delay={550} />
      <style>{`
        .stage { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 176px; gap: 12px; }
        .pairwrap { display: flex; gap: 6px; }
        .left  { animation: inFromLeft .6s cubic-bezier(.2,.9,.25,1) both; }
        .right { animation: inFromRight .6s cubic-bezier(.2,.9,.25,1) both; }
        @keyframes inFromLeft  { from { transform: translateX(-60px) rotate(-6deg); opacity: 0; }
                                  to   { transform: translateX(0) rotate(-2deg); opacity: 1; } }
        @keyframes inFromRight { from { transform: translateX(60px) rotate(6deg); opacity: 0; }
                                  to   { transform: translateX(0) rotate(2deg); opacity: 1; } }
      `}</style>
    </div>
  );
}

function TripleSlide() {
  const cards = [
    { id: 3, name: 'Carifive', position: 2 },
    { id: 20, name: 'Ebongue', position: 7 },
    { id: 36, name: 'Song', position: 10 },
  ];
  return (
    <div className="stage">
      <div className="triplewrap">
        {cards.map((c, i) => (
          <div key={c.id} className={`t${i}`}>
            <RealCard id={c.id} name={c.name} position={c.position} trait="Red" points={10} w={66} />
          </div>
        ))}
      </div>
      <SumLine parts={[10, 10, 10]} total={30} delay={600} />
      <style>{`
        .stage { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 176px; gap: 12px; }
        .triplewrap { display: flex; }
        .t0, .t1, .t2 { margin: 0 -3px; }
        .t0 { animation: t0in .6s cubic-bezier(.2,.9,.25,1) both; }
        .t1 { animation: t1in .6s cubic-bezier(.2,.9,.25,1) both; }
        .t2 { animation: t2in .6s cubic-bezier(.2,.9,.25,1) both; }
        @keyframes t0in { from { transform: translate(-55px,12px) rotate(-9deg); opacity: 0; }
                           to   { transform: translate(0,8px) rotate(-5deg); opacity: 1; } }
        @keyframes t1in { from { transform: translateY(-36px) scale(.75); opacity: 0; }
                           to   { transform: translateY(-4px) scale(1); opacity: 1; } }
        @keyframes t2in { from { transform: translate(55px,12px) rotate(9deg); opacity: 0; }
                           to   { transform: translate(0,8px) rotate(5deg); opacity: 1; } }
      `}</style>
    </div>
  );
}

function DiscardSlide() {
  return (
    <div className="stage">
      <div className="handrow">
        <CardBackImg w={40} style={{ position: 'relative' }} />
        <CardBackImg w={40} style={{ position: 'relative' }} />
        <div className="leaving">
          <CardBackImg w={40} style={{ position: 'relative', animation: 'leave 1.1s ease-in .3s both' }} />
          <span className="penalty">−pts if kept</span>
        </div>
      </div>
      <div className="downarrow">↓ mandatory, every round</div>
      <div className="openresult">
        <RealCard id={9} name="Fri" position={4} trait="Yellow" points={10} w={44} />
        <span className="tag2">becomes the new Open Pile</span>
      </div>
      <style>{`
        .stage { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 176px; gap: 8px; }
        .handrow { display: flex; gap: 10px; align-items: flex-start; }
        .leaving { position: relative; display: flex; flex-direction: column; align-items: center; gap: 4px; }
        .penalty { font-size: 9px; font-weight: 800; color: #ff8a7a; }
        @keyframes leave { 0% { transform: translateY(0) rotate(0); opacity: 1; }
                            60% { transform: translateY(30px) rotate(8deg); opacity: 1; }
                            100% { transform: translateY(30px) rotate(8deg); opacity: 1; } }
        .downarrow { font-size: 11px; color: rgba(190,220,250,.6); font-weight: 700; }
        .openresult { display: flex; align-items: center; gap: 10px; }
        .tag2 { font-size: 10.5px; color: rgba(190,220,250,.8); font-weight: 700; max-width: 150px; }
      `}</style>
    </div>
  );
}

function SquadSlide() {
  // Real ids, each shown with its actual position + trait from lib/cards.ts.
  const slots = [
    { x: 20, y: 34, id: 1, position: 1, trait: 'Red' },   // Bertrand, GK
    { x: 78, y: 0, id: 16, position: 6, trait: 'Red' },   // Enjeck, MID
    { x: 78, y: 68, id: 30, position: 9, trait: 'Yellow' }, // Kouakou, MID
    { x: 136, y: 34, id: 36, position: 10, trait: 'Red' },  // Song, STR
  ];
  return (
    <div className="stage">
      <div className="pitch">
        <div className="pitchline" />
        <div className="pitchcircle" />
        {slots.map((s, i) => (
          <div key={s.id} className="slot" style={{
            left: s.x, top: s.y, animation: `popIn .5s cubic-bezier(.2,.9,.25,1) ${i * 220}ms both`,
          }}>
            <RealCard id={s.id} name="" position={s.position} trait={s.trait} points={10} w={34} />
          </div>
        ))}
      </div>
      <style>{`
        .stage { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 176px; gap: 8px; }
        .pitch { position: relative; width: 200px; height: 108px; border-radius: 10px;
                 border: 1.5px solid rgba(124,188,240,.35); background: rgba(61,155,224,.05); }
        .pitchline { position: absolute; left: 50%; top: 0; bottom: 0; width: 1px; background: rgba(124,188,240,.3); }
        .pitchcircle { position: absolute; left: 50%; top: 50%; width: 40px; height: 40px; margin: -20px 0 0 -20px;
                       border-radius: 50%; border: 1.5px solid rgba(124,188,240,.3); }
        .slot { position: absolute; }
        @keyframes popIn { from { transform: scale(.3); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
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

function WinSlide() {
  return (
    <div className="stage">
      <div className="trophy"><Trophy /></div>
      <div className="bar"><div className="fill" /></div>
      <div className="score">First to 300 or 500 pts wins the match</div>
      <style>{`
        .stage { display: flex; flex-direction: column; align-items: center; justify-content: center;
                 gap: 10px; height: 176px; }
        .trophy { animation: trophyIn 1s cubic-bezier(.2,.9,.25,1) .15s both; }
        @keyframes trophyIn { from { transform: translateY(-10px) scale(.6); opacity: 0; }
                               60%  { transform: translateY(0) scale(1.06); opacity: 1; }
                               to   { transform: translateY(0) scale(1); opacity: 1; } }
        .bar { width: 220px; height: 12px; border-radius: 999px; background: rgba(61,155,224,.15);
               border: 1px solid rgba(61,155,224,.4); overflow: hidden; }
        .fill { height: 100%; width: 0%; border-radius: 999px;
                background: linear-gradient(90deg, #3d9be0, #7cbcf0);
                animation: fillBar 1.2s cubic-bezier(.2,.9,.25,1) .5s forwards; }
        @keyframes fillBar { to { width: 100%; } }
        .score { color: #cfe4fb; font-weight: 800; letter-spacing: .5px; font-size: 12.5px;
                 animation: fiuScore .5s ease 1.5s both; }
        @keyframes fiuScore { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}

type Slide = { key: string; title: string; body: string; render: () => JSX.Element };

const SLIDES: Slide[] = [
  {
    key: 'shuffle', title: 'Shuffle', render: ShuffleSlide,
    body: 'The 58-card deck is shuffled before every match — same deck, different game every time.',
  },
  {
    key: 'deal', title: 'Deal', render: DealSlide,
    body: 'Each player is dealt a starting hand of 5 or 7 cards (house rule). One more card is flipped face-up to start the Open Pile.',
  },
  {
    key: 'draw', title: 'Draw', render: DrawBoardSlide,
    body: 'On your turn, draw 1 card — from the closed Draw Pile, or take the top card sitting face-up on the Open Pile.*',
  },
  {
    key: 'pair', title: 'Position Pair', render: PairSlide,
    body: 'Play 2 cards that share the same position number. Trait doesn’t matter here, only position. Your score is simply the points printed on the cards.',
  },
  {
    key: 'triple', title: 'Trait Triple', render: TripleSlide,
    body: 'Play 3 cards with the same trait, in 3 different positions. Again — score is counted on the cards, added up.',
  },
  {
    key: 'discard', title: 'Discard', render: DiscardSlide,
    body: 'You must discard at least 1 card to end your turn — it becomes the new Open Pile. Any card left sitting in your hand costs you points, so don’t hoard.',
  },
  {
    key: 'squad', title: 'Build Your Squad', render: SquadSlide,
    body: 'Cards you play stay on your table, building your squad’s formation for the rest of the match.',
  },
  {
    key: 'win', title: 'The Match Ends', render: WinSlide,
    body: 'The moment a team reaches the target score — 300 or 500, house rule — the match ends. Most points wins.',
  },
];

export default function Tutorial({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const slide = SLIDES[i];
  const isLast = i === SLIDES.length - 1;
  const Visual = slide.render;

  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '28px 24px', gap: 14,
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
        <h3 style={{ color: '#eaf3fc', fontSize: 22, fontWeight: 900, margin: '0 0 6px' }}>
          {slide.title}
        </h3>
        <p style={{ color: 'rgba(210,228,248,.85)', fontSize: 13.5, lineHeight: 1.55, margin: 0 }}>
          {slide.body}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
        {SLIDES.map((s, idx) => (
          <div key={s.key} style={{
            width: 7, height: 7, borderRadius: '50%',
            background: idx === i ? '#3d9be0' : 'rgba(61,155,224,.25)',
            transition: 'background .3s ease',
          }} />
        ))}
      </div>

      <div style={{ display: 'flex', gap: 14, marginTop: 4, alignItems: 'center' }}>
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
