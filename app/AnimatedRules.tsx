'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import styles from './animated-rules.module.css';

const cardImage = (id: number) => `/images/cards/${String(id).padStart(2, '0')}.webp`;

const scenes = [
  {
    id: 'pair', step: '01', kicker: 'LOCK IT DOWN',
    title: 'Two matching numbers. One complete position.',
    copy: 'Play two cards with the same position number. That position opens and completes in your squad immediately.',
    payoff: 'Position secured',
  },
  {
    id: 'triple', step: '02', kicker: 'CHANGE THE TABLE',
    title: 'Three positions open at once — globally.',
    copy: 'Play three cards with the same trait across different positions. Those positions open for every player, not just you.',
    payoff: 'Positions 1 · 3 · 9 are now live',
  },
  {
    id: 'global', step: '03', kicker: 'THE SQUAD22 TWIST',
    title: 'Your opening becomes everyone’s option.',
    copy: 'Once a Trait Triple opens a position, another player may start that position in their own squad with one matching-position card, then add the second later.',
    payoff: 'Open the pitch. Decide who benefits.',
  },
];

export default function AnimatedRules() {
  const [active, setActive] = useState(0);
  const [run, setRun] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    const timer = window.setInterval(() => {
      setActive((value) => (value + 1) % scenes.length);
      setRun((value) => value + 1);
    }, 5200);
    return () => window.clearInterval(timer);
  }, []);

  const scene = scenes[active];
  const choose = (index: number) => { setActive(index); setRun((value) => value + 1); };

  return (
    <div className={styles.shell}>
      <div className={styles.stage} key={`${scene.id}-${run}`}>
        <div className={styles.pitchLines} aria-hidden="true" />

        {scene.id === 'pair' && (
          <div className={styles.pairScene} aria-label="Two position 1 cards complete position 1">
            <Image src={cardImage(1)} alt="Position 1 card" width={180} height={256} className={`${styles.card} ${styles.pairA}`} />
            <Image src={cardImage(2)} alt="Position 1 card" width={180} height={256} className={`${styles.card} ${styles.pairB}`} />
            <div className={styles.slotClosed}><span>POSITION 1</span><strong>COMPLETE</strong></div>
          </div>
        )}

        {scene.id === 'triple' && (
          <div className={styles.tripleScene} aria-label="Three CONTROL cards open positions 1, 3 and 9 globally">
            {[2, 10, 34].map((id, index) => (
              <div className={`${styles.openLane} ${styles[`lane${index + 1}`]}`} key={id}>
                <Image src={cardImage(id)} alt="Squad22 CONTROL card" width={162} height={230} className={styles.card} />
                <span>GLOBAL OPEN</span>
              </div>
            ))}
          </div>
        )}

        {scene.id === 'global' && (
          <div className={styles.counterScene} aria-label="A globally opened position can be started on another player's own squad">
            <div className={styles.exposedSlot}>
              <Image src={cardImage(2)} alt="Trait Triple card that opened position 1" width={160} height={228} className={styles.card} />
              <span>POSITION 1 · GLOBAL</span>
            </div>
            <div className={styles.globalArrow}>→</div>
            <div className={styles.ownStart}>
              <Image src={cardImage(1)} alt="Matching position 1 card starts position 1 on the other squad" width={178} height={253} className={`${styles.card} ${styles.stealCard}`} />
              <span>OTHER SQUAD STARTS 1</span>
            </div>
            <div className={styles.scoreBurst}><small>ONE OPENING</small><strong>BOTH SIDES</strong></div>
          </div>
        )}

        <div className={styles.stageCaption}><span>{scene.payoff}</span></div>
      </div>

      <div className={styles.copyPanel}>
        <div className={styles.copyTopline}><span>{scene.step}</span><span>{scene.kicker}</span></div>
        <h3>{scene.title}</h3>
        <p>{scene.copy}</p>
        <div className={styles.sceneNav} aria-label="Rule animation steps">
          {scenes.map((item, index) => (
            <button key={item.id} type="button" onClick={() => choose(index)} className={index === active ? styles.sceneActive : ''}>
              <span>{item.step}</span>{item.id === 'pair' ? 'Pair' : item.id === 'triple' ? 'Triple' : 'Global open'}
            </button>
          ))}
        </div>
        <div className={styles.ruleActions}>
          <button type="button" onClick={() => setRun((value) => value + 1)} className={styles.replay}>Replay move</button>
          <Link href="/game?mode=ai&player=Player" className={styles.tryCta}>Try the moves yourself <span>→</span></Link>
        </div>
      </div>
    </div>
  );
}
