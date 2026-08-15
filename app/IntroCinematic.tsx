'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './intro-cinematic.module.css';

const cardImage = (id: number) => `/images/cards/${String(id).padStart(2, '0')}.webp`;
const INTRO_MS = 7900;

export default function IntroCinematic() {
  const [visible, setVisible] = useState(false);
  const [run, setRun] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const close = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setVisible(false);
  }, []);

  const enterRules = useCallback(() => {
    close();
    window.setTimeout(() => document.getElementById('rules')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 40);
  }, [close]);

  const play = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setRun((value) => value + 1);
    setVisible(true);
    timer.current = setTimeout(close, INTRO_MS);
  }, [close]);

  useEffect(() => {
    const replay = () => play();
    window.addEventListener('squad22:replay-intro', replay);
    return () => {
      window.removeEventListener('squad22:replay-intro', replay);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [play]);

  if (!visible) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-label="Squad22 cinematic introduction" key={run}>
      <button className={styles.skip} onClick={close} type="button">Skip intro</button>
      <div className={styles.grain} aria-hidden="true" />
      <div className={styles.pitch} aria-hidden="true">
        <span className={styles.halfway} /><span className={styles.centreCircle} />
        <span className={`${styles.box} ${styles.boxLeft}`} /><span className={`${styles.box} ${styles.boxRight}`} />
      </div>

      <div className={styles.sequence}>
        <div className={`${styles.beat} ${styles.beatPair}`}>
          <p className={styles.beatLabel}>One position. Locked.</p>
          <div className={styles.pairStage}>
            <Image className={`${styles.introCard} ${styles.pairLeft}`} src={cardImage(1)} alt="" width={190} height={270} priority />
            <Image className={`${styles.introCard} ${styles.pairRight}`} src={cardImage(2)} alt="" width={190} height={270} priority />
            <div className={styles.snapLine} /><strong className={styles.result}>POSITION COMPLETE</strong>
          </div>
        </div>

        <div className={`${styles.beat} ${styles.beatTriple}`}>
          <p className={styles.beatLabel}>One trait. Three positions. The whole table changes.</p>
          <div className={styles.tripleStage}>
            <Image className={`${styles.introCard} ${styles.tripleOne}`} src={cardImage(2)} alt="" width={170} height={242} priority />
            <Image className={`${styles.introCard} ${styles.tripleTwo}`} src={cardImage(10)} alt="" width={170} height={242} priority />
            <Image className={`${styles.introCard} ${styles.tripleThree}`} src={cardImage(34)} alt="" width={170} height={242} priority />
            <span className={`${styles.exposure} ${styles.exposureOne}`}>1 OPEN</span>
            <span className={`${styles.exposure} ${styles.exposureTwo}`}>3 OPEN</span>
            <span className={`${styles.exposure} ${styles.exposureThree}`}>9 OPEN</span>
          </div>
        </div>

        <div className={`${styles.beat} ${styles.beatCounter}`}>
          <p className={styles.beatLabel}>The opening is global.</p>
          <div className={styles.counterStage}>
            <div className={styles.openSlot}>
              <Image className={styles.slotCard} src={cardImage(2)} alt="" width={158} height={224} priority />
              <span>POSITION 1 · OPEN FOR ALL</span>
            </div>
            <div className={styles.counterArrow}>→</div>
            <Image className={styles.counterCard} src={cardImage(1)} alt="" width={180} height={256} priority />
            <div className={styles.opponentScore}>OTHER SQUAD STARTS 1</div>
          </div>
        </div>

        <div className={`${styles.beat} ${styles.beatBrand}`}>
          <div className={styles.brandHalo} />
          <Image src="/images/logo.webp" alt="Squad22" width={300} height={300} className={styles.logo} priority />
          <p className={styles.finalLine}>BUILD THE XI. OWN THE OPEN.</p>
          <button type="button" className={styles.enter} onClick={enterRules}>SHOW ME THE 3 MOVES</button>
        </div>
      </div>
      <div className={styles.progress} aria-hidden="true"><span /></div>
    </div>
  );
}
