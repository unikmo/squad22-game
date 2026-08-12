'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  classifyDemoMove,
  DEMO_DECISION_HAND,
  DEMO_GLOBAL_HAND,
  DEMO_OPENING_HAND,
  type DemoMove,
} from '@/lib/tacticalDemo';
import styles from './game.module.css';

const cardImage = (id: number) => `/images/cards/${String(id).padStart(2, '0')}.webp`;

type Owner = 'you' | 'opponent';
type Slot = { position: number; cards: number[]; owner: Owner; started: boolean };
type StepId = 'opening' | 'global' | 'decision';

type Step = {
  id: StepId;
  number: string;
  kicker: string;
  title: string;
  body: string;
  mission: string;
  hand: readonly number[];
  globallyOpenPositions: number[];
  hint: string;
  action: string;
};

const steps: Step[] = [
  {
    id: 'opening', number: '01', kicker: 'MAKE THE FIRST CALL',
    title: 'Your hand has two legal ways to change the pitch.',
    body: 'A Position Pair completes one position immediately. A Trait Triple opens three positions globally — faster for you, but useful to everyone.',
    mission: 'Find either legal opening in your hand.', hand: DEMO_OPENING_HAND,
    globallyOpenPositions: [],
    hint: 'Look for either two matching position numbers, or three CONTROL cards across different positions.',
    action: 'Play selected cards',
  },
  {
    id: 'global', number: '02', kicker: 'USE THE GLOBAL OPEN',
    title: 'The opponent played a Trait Triple. The table changed for you too.',
    body: 'Positions 1, 3 and 9 are now globally open. You may start one of those positions in your own squad with a single matching-position card.',
    mission: 'Start one globally-open position in your own squad.', hand: DEMO_GLOBAL_HAND,
    globallyOpenPositions: [1, 3, 9],
    hint: 'Cards 1 and 9 match positions that are globally open. Either is legal.',
    action: 'Use the opening',
  },
  {
    id: 'decision', number: '03', kicker: 'NOW THINK LIKE A MANAGER',
    title: 'One hand. Three different strategic ideas.',
    body: 'You can close a position with a Pair, open three positions globally with a Trait Triple, or use an already-open position to start with one card. There is no single scripted answer.',
    mission: 'Choose the line you would actually play.', hand: DEMO_DECISION_HAND,
    globallyOpenPositions: [3],
    hint: 'You have a Position Pair, a CONTROL Trait Triple, and single position-3 cards that can use the global opening.',
    action: 'Commit to this move',
  },
];

function GameShell() {
  const searchParams = useSearchParams();
  const rawPlayer = searchParams.get('player')?.trim();
  const playerName = rawPlayer?.slice(0, 32) || 'Player';
  const [stepIndex, setStepIndex] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [resolvedMove, setResolvedMove] = useState<DemoMove | null>(null);
  const [feedback, setFeedback] = useState('');
  const [hintVisible, setHintVisible] = useState(false);
  const [finished, setFinished] = useState(false);
  const [history, setHistory] = useState<DemoMove[]>([]);

  const step = steps[stepIndex];
  const hand = resolvedMove ? step.hand.filter((id) => !resolvedMove.cards.includes(id)) : [...step.hand];

  const slots = useMemo<Slot[]>(() => {
    if (step.id === 'opening') {
      if (!resolvedMove) return [];
      if (resolvedMove.type === 'pair') return [{ position: resolvedMove.position ?? 1, cards: resolvedMove.cards, owner: 'you', started: false }];
      if (resolvedMove.type === 'triple') return [
        { position: 1, cards: [2], owner: 'you', started: true },
        { position: 3, cards: [10], owner: 'you', started: true },
        { position: 9, cards: [34], owner: 'you', started: true },
      ];
      return [];
    }

    if (step.id === 'global') {
      const base: Slot[] = [
        { position: 1, cards: [2], owner: 'opponent', started: true },
        { position: 3, cards: [10], owner: 'opponent', started: true },
        { position: 9, cards: [34], owner: 'opponent', started: true },
      ];
      if (resolvedMove?.type === 'global-start' && resolvedMove.position) {
        base.push({ position: resolvedMove.position, cards: resolvedMove.cards, owner: 'you', started: true });
      }
      return base;
    }

    const base: Slot[] = [{ position: 3, cards: [10], owner: 'opponent', started: true }];
    if (!resolvedMove) return base;
    if (resolvedMove.type === 'pair') base.push({ position: resolvedMove.position ?? 1, cards: resolvedMove.cards, owner: 'you', started: false });
    if (resolvedMove.type === 'triple') base.push(
      { position: 1, cards: [2], owner: 'you', started: true },
      { position: 3, cards: [10], owner: 'you', started: true },
      { position: 9, cards: [34], owner: 'you', started: true },
    );
    if (resolvedMove.type === 'global-start' && resolvedMove.position) base.push({ position: resolvedMove.position, cards: resolvedMove.cards, owner: 'you', started: true });
    return base;
  }, [step.id, resolvedMove]);

  const youSlots = slots.filter((slot) => slot.owner === 'you');
  const opponentSlots = slots.filter((slot) => slot.owner === 'opponent');

  const toggleCard = (id: number) => {
    if (resolvedMove || finished) return;
    setFeedback('');
    setSelected((current) => current.includes(id) ? current.filter((card) => card !== id) : current.length >= 3 ? [...current.slice(1), id] : [...current, id]);
  };

  const resolveSelection = () => {
    if (!selected.length || resolvedMove) return;
    const move = classifyDemoMove(selected, step.globallyOpenPositions);
    if (!move) {
      setFeedback(step.id === 'global'
        ? 'That selection does not use one of the globally-open positions. Read the position numbers again.'
        : 'That selection is not legal here. Look again for a Pair, a Trait Triple, or a globally-open single-card start.');
      return;
    }
    if (step.id === 'opening' && move.type === 'global-start') {
      setFeedback('No position is globally open yet. Create an opening first.'); return;
    }
    if (step.id === 'global' && move.type !== 'global-start') {
      setFeedback('This moment is about the global-opening rule. Start one of positions 1, 3 or 9 with a single matching card.'); return;
    }
    setResolvedMove(move); setHistory((current) => [...current, move]); setFeedback('');
  };

  const next = () => {
    if (!resolvedMove) return;
    if (stepIndex === steps.length - 1) { setFinished(true); return; }
    setStepIndex((value) => value + 1); setSelected([]); setResolvedMove(null); setFeedback(''); setHintVisible(false);
  };

  const restart = () => { setStepIndex(0); setSelected([]); setResolvedMove(null); setFeedback(''); setHintVisible(false); setFinished(false); setHistory([]); };

  if (finished) {
    const finalChoice = history[history.length - 1];
    return (
      <main className={styles.gamePage}>
        <Topbar stepIndex={steps.length - 1} />
        <section className={styles.finishWrap}>
          <div className={styles.finishPanel}>
            <p className={styles.kicker}>TACTICAL DEMO COMPLETE</p>
            <h1>Now you know what makes Squad22 different.</h1>
            <p>A Pair secures your own squad. A Trait Triple changes the opportunity set for the entire table. A global opening can be used by whoever reads it first.</p>
            {finalChoice && <div className={`${styles.finalChoice} ${styles[`tone_${finalChoice.tone}`]}`}><span>YOUR FINAL LINE</span><strong>{finalChoice.label}</strong><p>{finalChoice.detail}</p></div>}
            <div className={styles.finishGrid}>
              <div><strong>SAFE</strong><span>Position Pair</span><small>Open and complete one position in your own squad.</small></div>
              <div><strong>FAST</strong><span>Trait Triple</span><small>Start three positions and open those same positions for everyone.</small></div>
              <div><strong>SMART</strong><span>Global Start</span><small>Use a globally-open position to enter your own squad with one matching card.</small></div>
            </div>
            <div className={styles.finishActions}><button type="button" onClick={restart} className={styles.primaryAction}>Try a different line</button><Link href="/#rules" className={styles.secondaryAction}>Replay animated rules</Link></div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.gamePage}>
      <Topbar stepIndex={stepIndex} />
      <div className={styles.workspace}>
        <aside className={styles.coachPanel}>
          <div className={styles.stepTopline}><span>{step.number}</span><span>{step.kicker}</span></div>
          <h1>{step.title}</h1><p className={styles.coachBody}>{step.body}</p>
          <div className={styles.instructionCard}><span>YOUR MOVE</span><strong>{resolvedMove ? resolvedMove.headline : step.mission}</strong><small>{resolvedMove ? resolvedMove.detail : 'Select cards directly from your hand. The game validates the move.'}</small></div>
          {!resolvedMove && <button type="button" className={styles.hintButton} onClick={() => setHintVisible((value) => !value)}>{hintVisible ? 'Hide hint' : 'Need a hint?'}</button>}
          {hintVisible && !resolvedMove && <p className={styles.hintText}>{step.hint}</p>}
          <div className={styles.playerLine}><span>Playing as</span><strong>{playerName}</strong></div>
        </aside>

        <section className={styles.tableArea} aria-label="Squad22 tactical table">
          <div className={styles.pitchTexture} aria-hidden="true" />
          <div className={styles.sideHeader}><div><span className={styles.sideLabel}>OPPONENT</span><strong>Rival XI</strong></div><span className={styles.sideStatus}>{opponentSlots.length ? `${opponentSlots.length} started` : 'Waiting'}</span></div>
          <div className={styles.slotRow}>{opponentSlots.length ? opponentSlots.map((slot) => <PositionSlot key={`opp-${slot.position}`} slot={slot} />) : <div className={styles.emptyFormation}>Opponent formation waiting</div>}</div>

          <div className={styles.centreLine}><div className={styles.centreMark}>22</div><div className={styles.centreRule} /><span>{step.globallyOpenPositions.length ? `GLOBAL OPEN · ${step.globallyOpenPositions.join(' · ')}` : 'NO GLOBAL OPENING YET'}</span><div className={styles.centreRule} /></div>

          <div className={styles.slotRow}>{youSlots.length ? youSlots.map((slot) => <PositionSlot key={`you-${slot.position}-${slot.cards.join('-')}`} slot={slot} />) : <div className={styles.emptyFormation}>Your formation is waiting for a legal move</div>}</div>
          <div className={styles.sideHeader}><div><span className={styles.sideLabel}>YOU</span><strong>{playerName}</strong></div><span className={styles.sideStatus}>{resolvedMove ? 'Move resolved' : 'Your turn'}</span></div>
        </section>
      </div>

      <section className={styles.handDock} aria-label="Your hand">
        <div className={styles.handMeta}><div><span>YOUR HAND</span><strong>{hand.length} cards</strong></div>{!resolvedMove ? <p>{selected.length} selected</p> : <p className={styles.successText}>{resolvedMove.label}</p>}</div>
        <div className={styles.handScroller}>{hand.map((id) => { const active=selected.includes(id); return <button type="button" key={id} onClick={() => toggleCard(id)} className={`${styles.handCard} ${active ? styles.handCardSelected : ''}`} aria-pressed={active} aria-label={`Select Squad22 card ${id}`}><Image src={cardImage(id)} alt={`Squad22 card ${id}`} width={126} height={179} /><span className={styles.cardHint}>{active ? 'SELECTED' : 'CARD'}</span></button>; })}</div>
        <div className={styles.actionStack}>{feedback && <p className={styles.feedback}>{feedback}</p>}<div className={styles.actionBar}>{!resolvedMove ? <><button type="button" onClick={() => { setSelected([]); setFeedback(''); }} className={styles.clearAction} disabled={!selected.length}>Clear</button><button type="button" onClick={resolveSelection} className={styles.primaryAction} disabled={!selected.length}>{step.action}</button></> : <button type="button" onClick={next} className={styles.primaryAction}>{stepIndex === steps.length - 1 ? 'See what your choice means' : 'Next decision'}<span aria-hidden="true">→</span></button>}</div></div>
      </section>
    </main>
  );
}

function Topbar({ stepIndex }: { stepIndex: number }) {
  return <header className={styles.topbar}><Link href="/" className={styles.brand} aria-label="Squad22 home"><Image src="/images/logo.webp" alt="" width={42} height={42} priority /><span>SQUAD22</span></Link><div className={styles.progress} aria-label={`Decision ${stepIndex + 1} of ${steps.length}`}>{steps.map((item,index)=><span key={item.id} className={`${styles.progressDot} ${index <= stepIndex ? styles.progressDotActive : ''}`} />)}<strong>{stepIndex + 1}/{steps.length}</strong></div><span className={styles.demoBadge}>TACTICAL DEMO</span></header>;
}

function PositionSlot({ slot }: { slot: Slot }) {
  const complete = slot.cards.length >= 2;
  return <div className={`${styles.positionSlot} ${complete ? styles.positionSlotClosed : styles.positionSlotExposed}`}><div className={styles.positionTopline}><span>POSITION {slot.position}</span><strong>{complete ? 'COMPLETE' : 'STARTED'}</strong></div><div className={styles.slotCards}>{slot.cards.map((id,index)=><Image key={`${slot.owner}-${slot.position}-${id}`} src={cardImage(id)} alt={`Position ${slot.position} card`} width={88} height={125} className={index > 0 ? styles.slotCardSecond : undefined} />)}{!complete && <div className={styles.openCardSlot}>+</div>}</div></div>;
}

export default function GamePage() { return <Suspense fallback={<DemoLoading />}><GameShell /></Suspense>; }
function DemoLoading() { return <main className={styles.gamePage}><div className={styles.loading}><Image src="/images/logo.webp" alt="Squad22" width={76} height={76} priority /><span>Preparing your hand…</span></div></main>; }
