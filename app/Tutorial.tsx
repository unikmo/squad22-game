'use client';

import { useState } from 'react';

/**
 * Card-based rules walkthrough shown after the cold open, following the
 * official rule card almost slide-for-slide: your squad -> shuffle -> deal
 * (+ start the Open Pile) -> draw -> position pair -> trait triple -> flex
 * (the "joker") -> discard -> how your squad sits at the table -> round end
 * -> the match ends. Advances manually so nobody feels rushed.
 *
 * Every slide is a fixed-height visual on the left and text budgeted to that
 * same height on the right, same rule as the explainer screen. Cards are
 * real card art; a small position-number badge is added only where the
 * rule text itself is "the number", i.e. the Open Pile and the squad
 * lineup — everywhere else the cards are shown plain.
 */

const cardImg = (id: number) => `/images/cards/${String(id).padStart(2, '0')}.webp`;

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

const VH_ = 280; // every visual box (and its matching text column) targets this height

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

/** A real player card. `n` adds a small position-number badge, used only for
    the Open Pile and the squad lineup, where the number is the whole point. */
function RealCard({ id, w, n, style }: { id: number; w: number; n?: number; style?: React.CSSProperties }) {
  const h = Math.round(w * 1.42);
  return (
    <div style={{
      width: w, height: h, borderRadius: w * 0.13, background: '#eef3f8',
      padding: Math.max(2, w * 0.045), boxShadow: '0 8px 20px rgba(0,0,0,.5)',
      position: 'relative', ...style,
    }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={cardImg(id)} alt="" style={{
        width: '100%', height: '100%', borderRadius: w * 0.1, objectFit: 'cover', display: 'block',
      }} />
      {n != null && (
        <div style={{
          position: 'absolute', top: w * 0.08, left: w * 0.08,
          width: Math.max(14, w * 0.26), height: Math.max(14, w * 0.26), borderRadius: '50%',
          background: '#162638', color: '#fff', fontSize: Math.max(9, w * 0.15), fontWeight: 900,
          display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #fff',
        }}>
          {n}
        </div>
      )}
    </div>
  );
}

function YourSquadSlide() {
  const formations = ['4-4-2', '4-3-3', '3-5-2', '5-3-2'];
  return (
    <div className="v-center" style={{ gap: 16 }}>
      <div className="squadstat">
        <div className="num">22<span>+3</span></div>
        <div className="lbl">Players + Staff<br />= a Full Squad</div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', maxWidth: 170 }}>
        {formations.map((f, i) => (
          <div key={f} className="chip" style={{ animation: `chipIn .4s ease ${i * 90}ms both` }}>{f}</div>
        ))}
      </div>
      <style>{`
        .squadstat { display: flex; flex-direction: column; align-items: center; gap: 4px; }
        .num { font-size: 40px; font-weight: 900; color: #f4f8fc; line-height: 1; }
        .num span { font-size: 22px; color: #5ea6e0; }
        .lbl { font-size: 10.5px; color: rgba(190,220,250,.7); text-align: center; font-weight: 700; line-height: 1.4; }
        .chip { padding: 5px 12px; border-radius: 999px; font-size: 11px; font-weight: 800;
                color: #cfe4fb; border: 1px solid rgba(61,155,224,.45); background: rgba(61,155,224,.1); }
        @keyframes chipIn { from { opacity: 0; transform: scale(.7); } to { opacity: 1; transform: scale(1); } }
      `}</style>
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
      <div style={{ position: 'relative', width: 54, height: 76 }}>
        {Array.from({ length: 7 }, (_, i) => (
          <CardBackImg key={i} w={46} style={{
            position: 'absolute', top: i * 7, left: 0,
            animation: `dealIn .4s cubic-bezier(.2,.9,.25,1) ${baseDelay + i * 65}ms both`,
          }} />
        ))}
      </div>
    </div>
  );
  return (
    <div className="v-center" style={{ gap: 14 }}>
      <div style={{ display: 'flex', gap: 24 }}>
        {stack('You', 0)}
        {stack('Opponent', 500)}
      </div>
      <div className="dealcol">
        <div className="dealtag">Open Pile starts</div>
        <RealCard id={17} w={46} style={{ animation: 'flipIn .5s cubic-bezier(.2,.9,.25,1) 1050ms both' }} />
      </div>
      <style>{`
        .dealcol { display: flex; flex-direction: column; align-items: center; gap: 6px; }
        .dealtag { font-size: 10px; font-weight: 800; letter-spacing: .8px; text-transform: uppercase;
                   color: rgba(190,220,250,.75); }
        @keyframes dealIn { from { transform: translateY(-18px) scale(.5); opacity: 0; }
                             to   { transform: translateY(0) scale(1); opacity: 1; } }
        @keyframes flipIn { from { transform: scale(.5) rotateY(90deg); opacity: 0; }
                             to   { transform: scale(1) rotateY(0deg); opacity: 1; } }
      `}</style>
    </div>
  );
}

function DrawBoardSlide() {
  const openIds = [6, 9, 17, 25, 32];
  const openPos = [3, 4, 6, 8, 9];
  return (
    <div className="v-center" style={{ gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 22 }}>
        <div className="pilecol">
          <div style={{ position: 'relative', width: 52, height: 74 }}>
            <CardBackImg w={46} style={{ position: 'absolute', left: 5, top: 5 }} />
            <CardBackImg w={46} style={{ position: 'absolute', left: 2, top: 2 }} />
            <CardBackImg w={46} style={{ position: 'absolute', left: 0, top: 0, animation: 'pulseGlow 1.8s ease-in-out infinite' }} />
          </div>
          <div className="pt">Draw Pile</div>
        </div>
        <div className="ortag">OR</div>
        <div className="pilecol">
          <div style={{ position: 'relative', width: 74, height: 60 }}>
            {openIds.map((id, i) => (
              <RealCard key={id} id={id} n={openPos[i]} w={38} style={{
                position: 'absolute', left: i * 9, top: 0, zIndex: i,
              }} />
            ))}
          </div>
          <div className="pt">Open Pile</div>
        </div>
      </div>
      <style>{`
        .pilecol { display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .pt { font-size: 10px; font-weight: 800; color: rgba(190,220,250,.75); letter-spacing: .5px; }
        .ortag { color: #3d9be0; font-size: 11px; font-weight: 900; margin-bottom: 30px; }
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

function FlexSlide() {
  return (
    <div className="v-center">
      <RealCard id={19} w={104} style={{ animation: 'flexPulse 2.2s ease-in-out infinite' }} />
      <style>{`
        @keyframes flexPulse { 0%,100% { transform: scale(1) rotate(0deg); }
                                50%    { transform: scale(1.04) rotate(-2deg); } }
      `}</style>
    </div>
  );
}

function DiscardSlide() {
  return (
    <div className="v-center" style={{ gap: 12 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <RealCard id={9} w={58} />
        <RealCard id={40} w={58} />
      </div>
      <div className="downarrow">↓ discard 1 (unless hand is empty)</div>
      <RealCard id={12} w={60} style={{ animation: 'dropIn .6s cubic-bezier(.2,.9,.25,1) .2s both' }} />
      <style>{`
        .downarrow { font-size: 10px; color: rgba(190,220,250,.65); font-weight: 700; text-align: center; max-width: 190px; }
        @keyframes dropIn { from { transform: translateY(-14px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
}

function LineupSlide() {
  // A representative slice of one side's lineup (not all 11 — kept legible),
  // showing the starter+substitute pattern, plus the two shared piles.
  const positions = [
    { label: 'GK · 1', ids: [1], n: [1] },
    { label: 'DEF · 3', ids: [6, 8], n: [3, 3] },
    { label: 'MID · 6', ids: [17], n: [6] },
    { label: 'STR · 10', ids: [36, 40], n: [10, 10] },
  ];
  return (
    <div className="v-center" style={{ gap: 8 }}>
      <div className="lineup">
        {positions.map((p) => (
          <div key={p.label} className="posrow">
            <div className="poslabel">{p.label}</div>
            <div className="poscards">
              {p.ids.map((id, i) => (
                <RealCard key={id} id={id} n={p.n[i]} w={26} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="pilesrow">
        <CardBackImg w={30} />
        <RealCard id={25} n={8} w={30} />
      </div>
      <div className="pilesnote">the only 2 piles, shared at the centre</div>
      <style>{`
        .lineup { display: flex; flex-direction: column; gap: 5px; width: 190px; }
        .posrow { display: flex; align-items: center; justify-content: space-between;
                  background: rgba(61,155,224,.06); border: 1px solid rgba(124,188,240,.2);
                  border-radius: 8px; padding: 4px 8px; }
        .poslabel { font-size: 9.5px; font-weight: 800; color: rgba(190,220,250,.7); letter-spacing: .3px; }
        .poscards { display: flex; gap: 4px; }
        .pilesrow { display: flex; gap: 8px; margin-top: 4px; }
        .pilesnote { font-size: 9.5px; color: rgba(190,220,250,.55); font-style: italic; }
      `}</style>
    </div>
  );
}

function RoundEndSlide() {
  const items = [
    { icon: '🖐️', label: 'Hand is empty' },
    { icon: '🂠', label: 'Draw Pile runs out' },
    { icon: '🛡️', label: 'Full Squad completed (+50)' },
  ];
  return (
    <div className="v-center" style={{ gap: 10 }}>
      {items.map((it, i) => (
        <div key={it.label} className="enditem" style={{ animation: `fadeInOnly .4s ease ${i * 140}ms both` }}>
          <span className="ic">{it.icon}</span>
          <span className="tx">{it.label}</span>
        </div>
      ))}
      <style>{`
        .enditem { display: flex; align-items: center; gap: 10px; width: 176px;
                   background: rgba(61,155,224,.07); border: 1px solid rgba(124,188,240,.22);
                   border-radius: 10px; padding: 8px 12px; }
        .ic { font-size: 18px; }
        .tx { font-size: 11px; font-weight: 700; color: #cfe4fb; }
        @keyframes fadeInOnly { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

function Trophy() {
  // Bigger, round-eared cup — closer to a continental-final trophy silhouette.
  return (
    <svg width="112" height="140" viewBox="0 0 100 130" style={{ filter: 'drop-shadow(0 12px 20px rgba(0,0,0,.55))' }}>
      <defs>
        <linearGradient id="gold2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff8de" />
          <stop offset="42%" stopColor="#f3c74e" />
          <stop offset="100%" stopColor="#a86e14" />
        </linearGradient>
      </defs>
      {/* big round handles */}
      <circle cx="20" cy="34" r="15" fill="none" stroke="url(#gold2)" strokeWidth="7" />
      <circle cx="80" cy="34" r="15" fill="none" stroke="url(#gold2)" strokeWidth="7" />
      {/* cup body */}
      <path d="M28 12 H72 V38 C72 62 58 74 50 74 C42 74 28 62 28 38 Z"
        fill="url(#gold2)" stroke="#8a5a10" strokeWidth="1.6" />
      <rect x="25" y="8" width="50" height="9" rx="3" fill="url(#gold2)" stroke="#8a5a10" strokeWidth="1.4" />
      {/* stem */}
      <path d="M44 74 L40 96 H60 L56 74 Z" fill="url(#gold2)" stroke="#8a5a10" strokeWidth="1.4" />
      {/* base */}
      <rect x="30" y="96" width="40" height="10" rx="3" fill="url(#gold2)" stroke="#8a5a10" strokeWidth="1.4" />
      <rect x="20" y="106" width="60" height="12" rx="4" fill="url(#gold2)" stroke="#8a5a10" strokeWidth="1.4" />
      {/* shine */}
      <path d="M34 16 Q30 40 42 60" fill="none" stroke="#fffbe8" strokeWidth="2.4" opacity=".6" strokeLinecap="round" />
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
    key: 'squad', title: 'Your Squad', render: YourSquadSlide,
    body: 'A Full Squad is 22 Player cards + 3 Staff. Pick a formation first — 4-4-2, 4-3-3, 3-5-2 or 5-3-2 — it decides your lineup.',
    note: 'Each position can hold at most 2 cards: one starter, one substitute.',
  },
  {
    key: 'shuffle', title: 'Shuffle', render: ShuffleSlide,
    body: 'All 58 cards are shuffled before every match. Agree on a target score first — 300, 500 or 600.',
  },
  {
    key: 'deal', title: 'Deal', render: DealSlide,
    body: 'Each player is dealt a hand of 5 or 7 cards. One more card is flipped face-up to start the Open Pile — the rest sit face-down as the Draw Pile.',
  },
  {
    key: 'draw', title: 'Draw', render: DrawBoardSlide,
    body: 'On your turn, draw from one pile only — never both. Draw Pile: take 1 card blind. Open Pile: take the top card, and everything stacked above it, but only if you can play it immediately.',
  },
  {
    key: 'pair', title: 'Position Pair', render: PairSlide,
    body: 'Play 2 cards that share the same position number — say, two number 7s.',
  },
  {
    key: 'triple', title: 'Trait Triple', render: TripleSlide,
    body: 'Play 3 cards with the same trait (colour), in 3 different positions — say, positions 3, 5 and 6.',
    note: 'You can later add a second card to a position you opened with a Trait Triple.',
  },
  {
    key: 'flex', title: 'Flex Cards', render: FlexSlide,
    body: 'Flex is your joker — it plays in any position, worth nothing extra on the table.',
    note: 'But it’s the riskiest card to hold: −15 if it’s still in your hand when the round ends.',
  },
  {
    key: 'discard', title: 'Discard', render: DiscardSlide,
    body: 'End your turn by discarding 1 card face-up onto the Open Pile — unless your hand is already empty.',
    note: 'Drew a card you can’t use, and nothing in hand plays either? That exact card must be the one you discard.',
  },
  {
    key: 'lineup', title: 'At the Table', render: LineupSlide,
    body: 'Every card you play stays on your own side, lined up by position from goalkeeper onward — up to 2 per slot.',
    note: 'The centre only ever holds 2 things: the closed Draw Pile and the face-up Open Pile.',
  },
  {
    key: 'roundend', title: 'Round End', render: RoundEndSlide,
    body: 'The round ends the instant any of these happen. Completing a Full Squad also scores a 50-point bonus.',
  },
  {
    key: 'win', title: 'The Match Ends', render: WinSlide,
    body: 'The match ends once a team’s total reaches the agreed target (300, 500 or 600).',
    note: 'Scoring: cards on your table count + their points (10, 5, or 10 for Staff); any card still in your hand at round end counts against you (−10, −5, or −15 for Flex).',
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
        <div key={slide.key} className="tut-fiu" style={{
          flex: '0 0 auto', width: 220, height: VH_, borderRadius: 16,
          border: '1px solid rgba(124,188,240,.22)', background: 'rgba(61,155,224,.04)',
          boxShadow: '0 18px 40px rgba(0,0,0,.4)',
        }}>
          <Visual />
        </div>

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
            color: '#f4f8fc', fontSize: 21, fontWeight: 800, margin: 0,
            letterSpacing: '-0.3px', animationDelay: '50ms',
          }}>
            {slide.title}
          </h3>

          <p className="tut-fiu" style={{
            color: 'rgba(214,228,245,.86)', fontSize: 12.5, lineHeight: 1.45, margin: 0,
            animationDelay: '100ms',
          }}>
            {slide.body}
          </p>

          {slide.note && (
            <p className="tut-fiu" style={{
              color: 'rgba(190,220,250,.62)', fontSize: 10.8, lineHeight: 1.45, margin: 0,
              fontStyle: 'italic', animationDelay: '140ms',
            }}>
              {slide.note}
            </p>
          )}

          <div style={{ display: 'flex', gap: 5, margin: '4px 0 2px', flexWrap: 'wrap' }}>
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
