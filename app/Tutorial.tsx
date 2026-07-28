'use client';

import { useState } from 'react';

/**
 * Short, card-based walkthrough shown after the cold open when the player
 * asks to see how Squad22 works. Advances manually (Next/Prev) so nobody
 * feels rushed — each slide replays its little animation on arrival.
 *
 * Card numbers are real ids from lib/cards.ts, chosen so the on-screen art
 * actually demonstrates the rule being explained:
 *   - Position Pair: #6 (Ajeck, pos 3) + #8 (Ashley, pos 3) — same position.
 *   - Trait Triple:  #3, #20, #48 — all Red, positions 2 / 7 / 11.
 */

const img = (id: number) => `/images/cards/${String(id).padStart(2, '0')}.webp`;

type Slide = {
  key: string;
  title: string;
  body: string;
  render: () => JSX.Element;
};

function DrawSlide() {
  return (
    <div className="stage">
      <div className="deck">
        <div className="deckcard d3" />
        <div className="deckcard d2" />
        <div className="deckcard d1" />
      </div>
      <div className="arrow">→</div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img(15)} alt="" className="flycard" />
      <style>{`
        .stage { position: relative; display: flex; align-items: center; justify-content: center;
                 gap: 22px; height: 190px; }
        .deck { position: relative; width: 64px; height: 90px; }
        .deckcard { position: absolute; inset: 0; border-radius: 8px;
                    background: linear-gradient(135deg, #1f3a56, #162638);
                    border: 2px solid rgba(61,155,224,.5); }
        .d1 { transform: translate(0,0); }
        .d2 { transform: translate(3px,-3px); opacity: .8; }
        .d3 { transform: translate(6px,-6px); opacity: .6; }
        .arrow { color: #3d9be0; font-size: 26px; font-weight: 900;
                 animation: pulseArrow 1.2s ease-in-out infinite; }
        @keyframes pulseArrow { 0%,100% { opacity: .5; transform: translateX(0); }
                                 50% { opacity: 1; transform: translateX(6px); } }
        .flycard { width: 64px; height: 90px; object-fit: cover; border-radius: 8px;
                   border: 2px solid #3d9be0; box-shadow: 0 0 24px rgba(61,155,224,.5);
                   animation: drawIn 1s cubic-bezier(.2,.9,.25,1) both; }
        @keyframes drawIn { from { transform: translateX(-40px) scale(.7); opacity: 0; }
                             to   { transform: translateX(0) scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}

function PairSlide() {
  return (
    <div className="stage">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img(6)} alt="" className="pcard left" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img(8)} alt="" className="pcard right" />
      <div className="badge">+10</div>
      <style>{`
        .stage { position: relative; display: flex; align-items: center; justify-content: center;
                 height: 190px; }
        .pcard { position: absolute; width: 78px; height: 110px; object-fit: cover;
                 border-radius: 9px; border: 2px solid #3d9be0;
                 box-shadow: 0 6px 20px rgba(0,0,0,.45); }
        .left  { animation: inFromLeft .7s cubic-bezier(.2,.9,.25,1) both; }
        .right { animation: inFromRight .7s cubic-bezier(.2,.9,.25,1) both; }
        @keyframes inFromLeft  { from { transform: translateX(-90px) rotate(-8deg); opacity: 0; }
                                  to   { transform: translateX(-24px) rotate(-4deg); opacity: 1; } }
        @keyframes inFromRight { from { transform: translateX(90px) rotate(8deg); opacity: 0; }
                                  to   { transform: translateX(24px) rotate(4deg); opacity: 1; } }
        .badge { position: relative; color: #000; background: #3d9be0; font-weight: 900;
                 font-size: 22px; padding: 8px 18px; border-radius: 999px;
                 box-shadow: 0 0 26px rgba(61,155,224,.6);
                 animation: badgeIn .5s cubic-bezier(.2,.9,.25,1) .55s both; }
        @keyframes badgeIn { from { transform: scale(.3); opacity: 0; }
                              to   { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}

function TripleSlide() {
  const ids = [3, 20, 48];
  return (
    <div className="stage">
      {ids.map((id, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={id} src={img(id)} alt="" className={`tcard t${i}`} />
      ))}
      <div className="badge">+5</div>
      <style>{`
        .stage { position: relative; display: flex; align-items: center; justify-content: center;
                 height: 190px; }
        .tcard { position: absolute; width: 70px; height: 98px; object-fit: cover;
                 border-radius: 9px; border: 2px solid #ff8a7a;
                 box-shadow: 0 6px 20px rgba(0,0,0,.45); }
        .t0 { animation: t0in .7s cubic-bezier(.2,.9,.25,1) both; }
        .t1 { animation: t1in .7s cubic-bezier(.2,.9,.25,1) both; }
        .t2 { animation: t2in .7s cubic-bezier(.2,.9,.25,1) both; }
        @keyframes t0in { from { transform: translate(-110px,10px) rotate(-10deg); opacity: 0; }
                           to   { transform: translate(-46px,10px) rotate(-6deg); opacity: 1; } }
        @keyframes t1in { from { transform: translateY(-60px) scale(.7); opacity: 0; }
                           to   { transform: translateY(-14px) scale(1); opacity: 1; } }
        @keyframes t2in { from { transform: translate(110px,10px) rotate(10deg); opacity: 0; }
                           to   { transform: translate(46px,10px) rotate(6deg); opacity: 1; } }
        .badge { position: relative; color: #000; background: #ff8a7a; font-weight: 900;
                 font-size: 22px; padding: 8px 18px; border-radius: 999px;
                 box-shadow: 0 0 26px rgba(255,138,122,.55);
                 animation: badgeIn .5s cubic-bezier(.2,.9,.25,1) .6s both; }
        @keyframes badgeIn { from { transform: scale(.3); opacity: 0; }
                              to   { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}

function WinSlide() {
  return (
    <div className="stage">
      <div className="trophy">🏆</div>
      <div className="bar">
        <div className="fill" />
      </div>
      <div className="score">300 pts</div>
      <style>{`
        .stage { display: flex; flex-direction: column; align-items: center; justify-content: center;
                 gap: 16px; height: 190px; }
        .trophy { font-size: 44px; animation: bounceTrophy 1.4s ease-in-out .3s both; }
        @keyframes bounceTrophy { 0% { transform: translateY(-14px) scale(.6); opacity: 0; }
                                   60% { transform: translateY(0) scale(1.08); opacity: 1; }
                                   100% { transform: translateY(0) scale(1); opacity: 1; } }
        .bar { width: 260px; height: 14px; border-radius: 999px; background: rgba(61,155,224,.15);
               border: 1px solid rgba(61,155,224,.4); overflow: hidden; }
        .fill { height: 100%; width: 0%; border-radius: 999px;
                background: linear-gradient(90deg, #3d9be0, #7cbcf0);
                animation: fillBar 1.4s cubic-bezier(.2,.9,.25,1) .5s forwards; }
        @keyframes fillBar { to { width: 100%; } }
        .score { color: #cfe4fb; font-weight: 800; letter-spacing: 1px; font-size: 14px;
                 animation: fiuScore .5s ease 1.7s both; }
        @keyframes fiuScore { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}

const SLIDES: Slide[] = [
  { key: 'draw', title: 'Draw', body: 'Each turn, draw 1 card from the deck or the open pile.', render: DrawSlide },
  { key: 'pair', title: 'Position Pair', body: 'Play 2 cards that share the same position number for +10 points.', render: PairSlide },
  { key: 'triple', title: 'Trait Triple', body: 'Play 3 cards with the same trait in 3 different positions for +5 points.', render: TripleSlide },
  { key: 'win', title: 'Discard & Win', body: 'Discard 1 card to end your turn. First team to reach 300 points wins the match.', render: WinSlide },
];

export default function Tutorial({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const slide = SLIDES[i];
  const isLast = i === SLIDES.length - 1;
  const Visual = slide.render;

  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '32px 24px', gap: 18,
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
        <h3 style={{ color: '#eaf3fc', fontSize: 24, fontWeight: 900, margin: '0 0 8px' }}>
          {slide.title}
        </h3>
        <p style={{ color: 'rgba(210,228,248,.85)', fontSize: 15, lineHeight: 1.6, margin: 0 }}>
          {slide.body}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        {SLIDES.map((s, idx) => (
          <div key={s.key} style={{
            width: 8, height: 8, borderRadius: '50%',
            background: idx === i ? '#3d9be0' : 'rgba(61,155,224,.25)',
            transition: 'background .3s ease',
          }} />
        ))}
      </div>

      <div style={{ display: 'flex', gap: 14, marginTop: 8, alignItems: 'center' }}>
        {i > 0 && (
          <button onClick={() => setI(i - 1)} style={{
            padding: '12px 26px', fontSize: 14, fontWeight: 700, color: '#cfe4fb',
            background: 'transparent', border: '2px solid rgba(61,155,224,.4)',
            borderRadius: 999, cursor: 'pointer',
          }}>
            Back
          </button>
        )}
        {!isLast && (
          <button onClick={() => setI(i + 1)} style={{
            padding: '12px 30px', fontSize: 14, fontWeight: 800, letterSpacing: 1,
            textTransform: 'uppercase', color: '#000', background: '#3d9be0',
            border: 'none', borderRadius: 999, cursor: 'pointer',
            boxShadow: '0 0 26px rgba(61,155,224,.45)',
          }}>
            Next
          </button>
        )}
        {isLast && (
          <button onClick={onDone} style={{
            padding: '12px 34px', fontSize: 14, fontWeight: 800, letterSpacing: 1,
            textTransform: 'uppercase', color: '#000', background: '#3d9be0',
            border: 'none', borderRadius: 999, cursor: 'pointer',
            boxShadow: '0 0 26px rgba(61,155,224,.45)',
          }}>
            Let&apos;s Play
          </button>
        )}
      </div>

      {!isLast && (
        <button onClick={onDone} style={{
          marginTop: 4, padding: '6px 10px', fontSize: 12, fontWeight: 600,
          color: 'rgba(190,220,250,.55)', background: 'transparent', border: 'none',
          cursor: 'pointer', textDecoration: 'underline',
        }}>
          Skip tutorial
        </button>
      )}
    </div>
  );
}
