'use client';

import { useState } from 'react';

/**
 * Card-based rules walkthrough shown after the cold open, in actual turn
 * order: shuffle -> deal (+ start the Open Pile) -> draw -> play a Position
 * Pair -> play a Trait Triple -> discard (mandatory, hand penalty) -> your
 * squad builds up -> the match ends. Advances manually so nobody feels
 * rushed. Every slide is a fixed-size visual on the left and text on the
 * right — same layout rule as the explainer screen, and the text column
 * never runs taller than the visual box next to it.
 *
 * Cards shown are real card art, plain — no invented badges or bonus scores
 * drawn on top of them. The rule itself lives in the words on the right.
 */

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
  padding: '10px 26px', fontSize: 13, fontWeight: 800, letterSpacing: 1.5,
  textTransform: 'uppercase', color: '#eaf3fc',
  background: 'linear-gradient(135deg, #2f7ec2, #1f3a56)',
  border: '1px solid rgba(159,210,255,.55)', borderRadius: 999, cursor: 'pointer',
  boxShadow: '0 6px 20px rgba(61,155,224,.3)',
};

const VW_ = 220;  // visual column width
const VH_ = 280;  // visual column height — the text column budgets to this too

/** The real card back, framed with the same white card-edge as the print art. Plain — nothing drawn on top. */
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

/** A real player card, plain — white edge, nothing else drawn on it. */
function RealCard({ id, w, style }: { id: number; w: number; style?: React.CSSProperties }) {
  const h = Math.round(w * 1.42);
  return (
    <div style={{
      width: w, height: h, borderRadius: w * 0.13, background: '#eef3f8',
      padding: Math.max(2, w * 0.045), boxShadow: '0 8px 20px rgba(0,0,0,.5)', ...style,
    }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={cardImg(id)} alt="" style={{
        width: '100%', height: '100%', borderRadius: w * 0.1, objectFit: 'cover', display: 'block',
      }} />
    </div>
  );
}

function ShuffleSlide() {
  const cards = [0, 1, 2, 3, 4];
  return (
    <div className="v-center">
      <div style={{ position: 'relative', width: 66, height: 94 }}>
        {cards.map((i) => (
          <CardBackImg key={i} w={66} style={{
            position: 'absolute', top: 0, left: 0,
            animation: `shuffle${i % 3} 1.1s ease-in-out ${i * 70}ms infinite alternate`,
            zIndex: i,
          }} />
        ))}
      </div>
      <style>{`
        @keyframes shuffle0 { from { transform: translateX(-12px) rotate(-9deg); } to { transform: translateX(4px) rotate(3deg); } }
        @keyframes shuffle1 { from { transform: translateX(10px) rotate(7deg); } to { transform: translateX(-8px) rotate(-5deg); } }
        @keyframes shuffle2 { from { transform: translateY(-8px) rotate(-3deg); } to { transform: translateY(6px) rotate(4deg); } }
      `}</style>
    </div>
  );
}

function DealSlide() {
  const stack = (label: string, baseDelay: number) => (
    <div className="dealcol">
      <div className="dealtag">{label}</div>
      <div style={{ position: 'relative', width: 40, height: 60 }}>
        {Array.from({ length: 7 }, (_, i) => (
          <CardBackImg key={i} w={34} style={{
            position: 'absolute', top: i * 6, left: 0,
            animation: `dealIn .4s cubic-bezier(.2,.9,.25,1) ${baseDelay + i * 70}ms both`,
          }} />
        ))}
      </div>
    </div>
  );
  return (
    <div className="v-center">
      <div style={{ display: 'flex', gap: 22 }}>
        {stack('You', 0)}
        {stack('Rival', 550)}
      </div>
      <style>{`
        .dealcol { display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .dealtag { font-size: 10.5px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;
                   color: rgba(190,220,250,.75); }
        @keyframes dealIn { from { transform: translateY(-20px) scale(.5); opacity: 0; }
                             to   { transform: translateY(0) scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}

function DrawBoardSlide() {
  return (
    <div className="v-center" style={{ gap: 10 }}>
      <div style={{ position: 'relative', width: 70, height: 98 }}>
        <RealCard id={17} w={70} style={{ position: 'absolute', left: 6, top: 6 }} />
        <RealCard id={17} w={70} style={{ position: 'absolute', left: 3, top: 3 }} />
        <RealCard id={17} w={70} style={{ position: 'absolute', left: 0, top: 0, animation: 'pulseGlow 1.8s ease-in-out infinite' }} />
      </div>
      <div className="ortag">OR</div>
      <RealCard id={25} w={70} />
      <style>{`
        .ortag { color: #3d9be0; font-size: 11px; font-weight: 900; }
        @keyframes pulseGlow { 0%,100% { filter: drop-shadow(0 6px 12px rgba(0,0,0,.5)); }
                                50%    { filter: drop-shadow(0 0 14px rgba(61,155,224,.8)); } }
      `}</style>
    </div>
  );
}

function PairSlide() {
  return (
    <div className="v-center">
      <div style={{ display: 'flex', gap: 10 }}>
        <RealCard id={15} w={92} style={{ animation: 'inFromLeft .6s cubic-bezier(.2,.9,.25,1) both' }} />
        <RealCard id={16} w={92} style={{ animation: 'inFromRight .6s cubic-bezier(.2,.9,.25,1) both' }} />
      </div>
      <style>{`
        @keyframes inFromLeft  { from { transform: translateX(-40px) rotate(-6deg); opacity: 0; }
                                  to   { transform: translateX(0) rotate(-2deg); opacity: 1; } }
        @keyframes inFromRight { from { transform: translateX(40px) rotate(6deg); opacity: 0; }
                                  to   { transform: translateX(0) rotate(2deg); opacity: 1; } }
      `}</style>
    </div>
  );
}

function TripleSlide() {
  const ids = [3, 20, 36];
  const anims = ['t0in', 't1in', 't2in'];
  return (
    <div className="v-center">
      <div style={{ display: 'flex' }}>
        {ids.map((id, i) => (
          <RealCard key={id} id={id} w={76} style={{ margin: '0 -4px', animation: `${anims[i]} .6s cubic-bezier(.2,.9,.25,1) both` }} />
        ))}
      </div>
      <style>{`
        @keyframes t0in { from { transform: translate(-46px,10px) rotate(-8deg); opacity: 0; }
                           to   { transform: translate(0,6px) rotate(-4deg); opacity: 1; } }
        @keyframes t1in { from { transform: translateY(-30px) scale(.8); opacity: 0; }
                           to   { transform: translateY(-4px) scale(1); opacity: 1; } }
        @keyframes t2in { from { transform: translate(46px,10px) rotate(8deg); opacity: 0; }
                           to   { transform: translate(0,6px) rotate(4deg); opacity: 1; } }
      `}</style>
    </div>
  );
}

function DiscardSlide() {
  return (
    <div className="v-center" style={{ gap: 12 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <RealCard id={9} w={54} />
        <RealCard id={40} w={54} />
      </div>
      <div className="downarrow">↓ discard 1, every round</div>
      <RealCard id={12} w={58} style={{ animation: 'dropIn .6s cubic-bezier(.2,.9,.25,1) .2s both' }} />
      <style>{`
        .downarrow { font-size: 10.5px; color: rgba(190,220,250,.65); font-weight: 700; }
        @keyframes dropIn { from { transform: translateY(-14px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
}

function SquadSlide() {
  const slots = [
    { x: 22, y: 30, id: 1 }, { x: 76, y: 0, id: 16 }, { x: 76, y: 62, id: 30 }, { x: 130, y: 30, id: 36 },
  ];
  return (
    <div className="v-center">
      <div style={{ position: 'relative', width: 172, height: 96, borderRadius: 10,
        border: '1.5px solid rgba(124,188,240,.35)', background: 'rgba(61,155,224,.05)' }}>
        <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'rgba(124,188,240,.3)' }} />
        <div style={{ position: 'absolute', left: '50%', top: '50%', width: 36, height: 36, marginLeft: -18, marginTop: -18,
          borderRadius: '50%', border: '1.5px solid rgba(124,188,240,.3)' }} />
        {slots.map((s, i) => (
          <div key={s.id} style={{
            position: 'absolute', left: s.x, top: s.y,
            animation: `popIn .5s cubic-bezier(.2,.9,.25,1) ${i * 200}ms both`,
          }}>
            <RealCard id={s.id} w={30} />
          </div>
        ))}
      </div>
      <style>{`
        @keyframes popIn { from { transform: scale(.3); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}

function Trophy() {
  return (
    <svg width="104" height="132" viewBox="0 0 72 92" style={{ filter: 'drop-shadow(0 10px 18px rgba(0,0,0,.55))' }}>
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
    <div className="v-center" style={{ animation: 'trophyIn 1s cubic-bezier(.2,.9,.25,1) .1s both' }}>
      <Trophy />
      <style>{`
        @keyframes trophyIn { from { transform: translateY(-10px) scale(.7); opacity: 0; }
                               60%  { transform: translateY(0) scale(1.05); opacity: 1; }
                               to   { transform: translateY(0) scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}

type Slide = { key: string; title: string; body: string; note?: string; render: () => JSX.Element };

const SLIDES: Slide[] = [
  {
    key: 'shuffle', title: 'Shuffle', render: ShuffleSlide,
    body: 'The 58-card deck is shuffled before every match — same deck, different game every time.',
  },
  {
    key: 'deal', title: 'Deal', render: DealSlide,
    body: 'Each player is dealt a starting hand of 5 or 7 cards (house rule).',
    note: 'One more card is flipped face-up to start the Open Pile.',
  },
  {
    key: 'draw', title: 'Draw', render: DrawBoardSlide,
    body: 'On your turn, draw 1 card — from the closed Draw Pile, or take the top card sitting face-up on the Open Pile.',
    note: 'Taking from the Open Pile means taking that card and everything stacked on top of it, not just one from the middle.',
  },
  {
    key: 'pair', title: 'Position Pair', render: PairSlide,
    body: 'Play 2 cards that share the same position number. Trait doesn’t matter here — only position does.',
  },
  {
    key: 'triple', title: 'Trait Triple', render: TripleSlide,
    body: 'Play 3 cards with the same trait, in 3 different positions.',
  },
  {
    key: 'discard', title: 'Discard', render: DiscardSlide,
    body: 'You must discard at least 1 card to end your turn — it becomes the new Open Pile.',
    note: 'Any card left sitting in your hand costs you points, so don’t hoard.',
  },
  {
    key: 'squad', title: 'Build Your Squad', render: SquadSlide,
    body: 'Cards you play stay on your table, building your squad’s formation for the rest of the match.',
  },
  {
    key: 'win', title: 'The Match Ends', render: WinSlide,
    body: 'The moment a team’s total reaches the target score — 300 or 500, house rule — the match ends.',
    note: 'Score is counted on the cards: it’s the sum of every card you’ve played. No bonus points, just what’s printed. Most points wins.',
  },
];

export default function Tutorial({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const slide = SLIDES[i];
  const isLast = i === SLIDES.length - 1;
  const Visual = slide.render;

  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '32px 28px', overflowY: 'auto', ...pitchBg,
    }}>
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); }
                              to   { opacity: 1; transform: translateY(0); } }
        .tut-fiu { animation: fadeInUp .45s cubic-bezier(.2,.9,.25,1) both; }
        .v-center { width: 100%; height: 100%; display: flex; flex-direction: column;
                    align-items: center; justify-content: center; gap: 14px; }
      `}</style>

      <div style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center',
        gap: 36, maxWidth: 700, margin: '0 auto',
      }}>
        {/* visual, fixed box, same footprint every slide */}
        <div key={slide.key} className="tut-fiu" style={{
          flex: '0 0 auto', width: VW_, height: VH_, borderRadius: 16,
          border: '1px solid rgba(124,188,240,.22)', background: 'rgba(61,155,224,.04)',
          boxShadow: '0 18px 40px rgba(0,0,0,.4)',
        }}>
          <Visual />
        </div>

        {/* text — budgeted to the visual's own height, same rule as the explainer */}
        <div key={`t-${slide.key}`} style={{
          flex: '1 1 260px', minWidth: 240, maxWidth: 300, height: VH_,
          display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8, textAlign: 'left',
        }}>
          <div className="tut-fiu" style={{
            fontSize: 10.5, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase',
            color: '#5ea6e0',
          }}>
            Step {i + 1} of {SLIDES.length}
          </div>

          <h3 className="tut-fiu" style={{
            color: '#f4f8fc', fontSize: 22, fontWeight: 800, margin: 0,
            letterSpacing: '-0.3px', animationDelay: '50ms',
          }}>
            {slide.title}
          </h3>

          <p className="tut-fiu" style={{
            color: 'rgba(214,228,245,.86)', fontSize: 13.5, lineHeight: 1.5, margin: 0,
            animationDelay: '100ms',
          }}>
            {slide.body}
          </p>

          {slide.note && (
            <p className="tut-fiu" style={{
              color: 'rgba(190,220,250,.62)', fontSize: 11.5, lineHeight: 1.5, margin: 0,
              fontStyle: 'italic', animationDelay: '140ms',
            }}>
              {slide.note}
            </p>
          )}

          <div style={{ display: 'flex', gap: 6, margin: '6px 0 2px' }}>
            {SLIDES.map((s, idx) => (
              <div key={s.key} style={{
                width: 6, height: 6, borderRadius: '50%',
                background: idx === i ? '#3d9be0' : 'rgba(61,155,224,.25)',
                transition: 'background .3s ease',
              }} />
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {i > 0 && (
              <button onClick={() => setI(i - 1)} style={{
                padding: '9px 20px', fontSize: 12.5, fontWeight: 700, color: '#cfe4fb',
                background: 'transparent', border: '2px solid rgba(61,155,224,.4)',
                borderRadius: 999, cursor: 'pointer',
              }}>
                Back
              </button>
            )}
            {!isLast && (
              <button onClick={() => setI(i + 1)} style={ctaStyle}>Next</button>
            )}
            {isLast && (
              <button onClick={onDone} style={ctaStyle}>Let&apos;s Play</button>
            )}
            {!isLast && (
              <button onClick={onDone} style={{
                padding: '9px 6px', fontSize: 11.5, fontWeight: 600,
                color: 'rgba(190,220,250,.5)', background: 'transparent', border: 'none',
                cursor: 'pointer', textDecoration: 'underline',
              }}>
                Skip
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
