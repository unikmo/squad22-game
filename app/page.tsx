'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import AnimatedRules from './AnimatedRules';
import IntroCinematic from './IntroCinematic';
import styles from './home.module.css';

const cardImage = (id: number) => `/images/cards/${String(id).padStart(2, '0')}.webp`;

const faqs = [
  {
    question: 'What is Squad22?',
    answer: 'Squad22 is an online football strategy card game about building a formation, controlling the shared Open Pile and deciding when to open positions for the whole table.',
  },
  {
    question: 'How does a position open?',
    answer: 'A Position Pair opens and completes one position in your squad. A Trait Triple opens three different positions globally, so every player can start those positions with one matching-position card.',
  },
  {
    question: 'Why does a Trait Triple change the game?',
    answer: 'Because the three positions become available to everyone. Your triple accelerates your own squad, but it can also give an opponent a one-card route into those same positions on their side.',
  },
  {
    question: 'What is available now?',
    answer: 'The cinematic, animated rules, tactical demo and full-match solo beta are available now. Payments remain disabled while the full game is tested.',
  },
];

export default function Home() {
  const [squadName, setSquadName] = useState('');
  const playerName = useMemo(() => squadName.trim() || 'Player', [squadName]);
  const demoHref = `/game?mode=ai&player=${encodeURIComponent(playerName)}`;
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };

  const replayIntro = () => window.dispatchEvent(new Event('squad22:replay-intro'));

  return (
    <main className={styles.page}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <IntroCinematic />

      <header className={styles.navShell}>
        <nav className={styles.nav} aria-label="Primary navigation">
          <a href="#top" className={styles.brand} aria-label="Squad22 home">
            <Image src="/images/logo.webp" alt="Squad22" width={44} height={44} priority />
            <span>SQUAD22</span>
          </a>
          <div className={styles.navLinks}>
            <a href="#rules">How it plays</a>
            <a href="#modes">Game modes</a>
            <a href="#pricing">Pricing</a>
            <a href="#physical">Physical</a>
          </div>
          <div className={styles.navActions}>
            <button type="button" onClick={replayIntro}>Watch intro</button>
            <Link href={demoHref}>Play free</Link>
          </div>
        </nav>
      </header>

      <section id="top" className={styles.hero}>
        <div className={styles.pitchWorld} aria-hidden="true">
          <span className={styles.halfway} />
          <span className={styles.centreCircle} />
          <span className={styles.penaltyLeft} />
          <span className={styles.penaltyRight} />
        </div>
        <div className={styles.floodlightLeft} aria-hidden="true" />
        <div className={styles.floodlightRight} aria-hidden="true" />
        <div className={styles.big22} aria-hidden="true">22</div>

        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>THE FOOTBALL CARD BATTLE</p>
            <h1>Build the XI.<br /><span>Own the open.</span></h1>
            <p className={styles.heroLead}>
              Build your formation, control the Open Pile and decide when to change the whole table. A Trait Triple can accelerate your squad — and unlock the same positions for everyone else.
            </p>
            <div className={styles.heroActions}>
              <Link href={demoHref} className={styles.primaryCta}>Play free demo <span>→</span></Link>
              <a href="#rules" className={styles.secondaryCta}>See the 3 moves</a>
            </div>
            <div className={styles.heroProof}>
              <div><strong>58</strong><span>cards</span></div>
              <div><strong>22 + 3</strong><span>full squad</span></div>
              <div><strong>2</strong><span>players</span></div>
              <div><strong>30 sec</strong><span>to understand</span></div>
            </div>
          </div>

          <div className={styles.heroVisual} aria-label="Squad22 cards on a football pitch">
            <div className={styles.cardShadow} />
            <div className={`${styles.heroCard} ${styles.cardBack}`}><Image src="/images/card-back.webp" alt="Squad22 card back" width={260} height={364} priority /></div>
            <div className={`${styles.heroCard} ${styles.cardLeft}`}><Image src={cardImage(2)} alt="Squad22 player card" width={260} height={369} priority /></div>
            <div className={`${styles.heroCard} ${styles.cardRight}`}><Image src={cardImage(10)} alt="Squad22 player card" width={260} height={369} priority /></div>
            <div className={styles.matchBug}>
              <span>LIVE TACTICAL MOMENT</span>
              <div><strong>GLOBAL OPEN</strong><b>1 · 3 · 9</b></div>
              <div><strong>NEXT MOVE</strong><b>YOURS</b></div>
            </div>
          </div>
        </div>

        <div className={styles.heroTicker} aria-hidden="true">
          <span>PAIR = COMPLETE</span><i>•</i><span>TRIPLE = GLOBAL</span><i>•</i><span>OPEN PILE = PRESSURE</span><i>•</i><span>READ THE TABLE</span>
        </div>
      </section>

      <section id="rules" className={styles.rulesWrap}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>ONE MINUTE FROM “WHAT?” TO “ONE MORE TURN.”</p>
            <h2>See the move.<br />Feel the consequence.</h2>
          </div>
          <p>Squad22 should not need a lecture. These three moments explain the core tension: complete one position, open three globally, then decide who benefits from that new space first.</p>
        </div>
        <AnimatedRules />
      </section>

      <section id="modes" className={styles.modesSection}>
        <div className={styles.modesTop}>
          <p className={styles.eyebrow}>PLAY SQUAD22</p>
          <h2>Start with the decision.<br />Grow into the match.</h2>
        </div>
        <div className={styles.modeGrid}>
          <article className={`${styles.modeCard} ${styles.modeLive}`}>
            <span className={styles.modeStatus}>PLAYABLE NOW</span>
            <div className={styles.modeNumber}>01</div>
            <h3>Tactical Demo</h3>
            <p>Three real decisions. No registration. Learn the risk/reward system by actually choosing cards.</p>
            <Link href={demoHref}>Play free <span>→</span></Link>
          </article>
          <article className={styles.modeCard}>
            <span className={styles.modeStatus}>FULL-MATCH BETA LIVE</span>
            <div className={styles.modeNumber}>02</div>
            <h3>Full Online Match</h3>
            <p>Complete deck, stacked Open Pile, multi-round scoring, global Trait Triple openings and The Gaffer AI. Test the paid core before checkout goes live.</p>
            <Link href="/play">Play full match <span>→</span></Link>
          </article>
          <article className={styles.modeCard}>
            <span className={styles.modeStatus}>AFTER SOLO VALIDATION</span>
            <div className={styles.modeNumber}>03</div>
            <h3>Head-to-Head</h3>
            <p>Play another person with the same full ruleset once the solo match proves retention and demand.</p>
            <span className={styles.modePending}>Multiplayer later</span>
          </article>
        </div>
      </section>

      <section id="pricing" className={styles.pricingSection}>
        <div className={styles.pricingIntro}>
          <p className={styles.eyebrow}>SIMPLE FROM DAY ONE</p>
          <h2>No packs. No subscription treadmill.</h2>
          <p>The launch model is deliberately simple: learn free, then unlock the complete online game once. Payments stay disabled until the full match is finished and tested.</p>
        </div>
        <div className={styles.priceGrid}>
          <article>
            <span>TACTICAL DEMO</span>
            <strong>FREE</strong>
            <p>Cinematic, animated rules and playable tactical decisions.</p>
            <Link href={demoHref}>Play now</Link>
          </article>
          <article className={styles.priceFeatured}>
            <span>FULL ONLINE GAME</span>
            <strong>$14.99 <small>one-time launch price</small></strong>
            <p>Launch price. Pay once, play forever. Full match versus AI first; multiplayer can follow after validation.</p>
            <Link href="/play">Play full-match beta</Link>
          </article>
          <article>
            <span>PHYSICAL EDITION</span>
            <strong>$24.99<small> + shipping</small></strong>
            <p>Planned print-on-demand edition. No inventory commitment before demand is proven.</p>
            <button type="button" disabled>Physical drop later</button>
          </article>
        </div>
      </section>

      <section id="physical" className={styles.physicalSection}>
        <div className={styles.physicalVisual}>
          <div className={`${styles.physicalCard} ${styles.physicalOne}`}><Image src={cardImage(1)} alt="Squad22 physical card" width={220} height={312} /></div>
          <div className={`${styles.physicalCard} ${styles.physicalTwo}`}><Image src={cardImage(34)} alt="Squad22 physical card" width={220} height={312} /></div>
          <div className={`${styles.physicalCard} ${styles.physicalThree}`}><Image src="/images/card-back.webp" alt="Squad22 physical card back" width={220} height={308} /></div>
        </div>
        <div className={styles.physicalCopy}>
          <p className={styles.eyebrow}>WHEN DIGITAL DEMAND EARNS IT</p>
          <h2>The same tension.<br />On the table.</h2>
          <p>The physical deck comes after the online game proves demand. The intended fulfillment model is print-on-demand, so there is no need to finance boxes of inventory before players ask for them.</p>
          <div className={styles.physicalFacts}><span>No inventory</span><span>Print on demand</span><span>Same 58-card system</span></div>
        </div>
      </section>

      <section className={styles.playSection}>
        <div className={styles.playPanel}>
          <div>
            <p className={styles.eyebrow}>YOUR FIRST KICK</p>
            <h2>Stop reading.<br />Make the move.</h2>
          </div>
          <div className={styles.playForm}>
            <label htmlFor="squad-name">Squad name <span>optional</span></label>
            <input id="squad-name" type="text" value={squadName} onChange={(event) => setSquadName(event.target.value)} placeholder="Northside FC" maxLength={32} autoComplete="off" />
            <Link href={demoHref}>Enter the pitch <span>→</span></Link>
            <small>No account. No payment. Immediate play.</small>
          </div>
        </div>
      </section>

      <section className={styles.faqSection}>
        <div className={styles.faqTitle}><p className={styles.eyebrow}>QUICK ANSWERS</p><h2>Before kickoff.</h2></div>
        <div className={styles.faqGrid}>{faqs.map((item) => <article key={item.question}><h3>{item.question}</h3><p>{item.answer}</p></article>)}</div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerBrand}><Image src="/images/logo.webp" alt="" width={42} height={42} /><span>SQUAD22</span></div>
        <p>Football strategy. Card-table nerve.</p>
        <div className={styles.footerLinks}><Link href="/imprint">Imprint</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div>
        <span>© {new Date().getFullYear()} Squad22</span>
      </footer>
    </main>
  );
}
