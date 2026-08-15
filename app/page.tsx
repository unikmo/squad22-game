'use client';

import Image from 'next/image';
import Link from 'next/link';
import AnimatedRules from './AnimatedRules';
import IntroCinematic from './IntroCinematic';
import styles from './home.module.css';

const cardImage = (id: number) => `/images/cards/${String(id).padStart(2, '0')}.webp`;

const faqs = [
  {
    question: 'What is Squad22?',
    answer: 'A football strategy card game built around formation, timing and a shared Open Pile. Build your own XI while every Trait Triple can change what is possible for the whole table.',
  },
  {
    question: 'What is playable now?',
    answer: 'The tactical demo and the complete solo full-match beta against The Gaffer are live now. Payments remain disabled while launch QA is completed.',
  },
  {
    question: 'How will the online game be priced?',
    answer: '$14.99 as a one-time launch price. No subscription. Pay once, play forever.',
  },
  {
    question: 'Is there a physical deck?',
    answer: 'A $24.99 + shipping physical edition is planned after online demand is proven. The intended launch model is print-on-demand rather than inventory-heavy retail.',
  },
];

export default function Home() {
  const replayIntro = () => window.dispatchEvent(new Event('squad22:replay-intro'));
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };

  return (
    <main className={styles.page}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <IntroCinematic />

      <header className={styles.navShell}>
        <nav className={styles.nav} aria-label="Primary navigation">
          <a href="#top" className={styles.brand} aria-label="Squad22 home">
            <Image src="/images/logo.webp" alt="Squad22" width={40} height={40} priority />
            <span>SQUAD22</span>
          </a>

          <div className={styles.navLinks}>
            <a href="#rules">How it plays</a>
            <a href="#full-match">Full match</a>
            <a href="#pricing">Pricing</a>
          </div>

          <div className={styles.navActions}>
            <button type="button" onClick={replayIntro}>Watch intro</button>
            <Link href="/play">Play full match</Link>
          </div>
        </nav>
      </header>

      <section id="top" className={styles.hero}>
        <div className={styles.heroNoise} aria-hidden="true" />
        <div className={styles.stadiumGlow} aria-hidden="true" />
        <div className={styles.heroPitch} aria-hidden="true">
          <span className={styles.pitchHalfway} />
          <span className={styles.pitchCircle} />
          <span className={styles.pitchBoxLeft} />
          <span className={styles.pitchBoxRight} />
        </div>

        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <div className={styles.heroStatus}><span /> FULL MATCH BETA LIVE</div>
            <p className={styles.eyebrow}>THE FOOTBALL STRATEGY CARD GAME</p>
            <h1>
              Build your XI.
              <span>Change the whole table.</span>
            </h1>
            <p className={styles.heroLead}>
              Complete positions. Build trait combinations. Control the Open Pile. Every aggressive move can accelerate your squad — or create an opening everyone can use.
            </p>

            <div className={styles.heroActions}>
              <Link href="/play" className={styles.primaryCta}>Play the full match <span>→</span></Link>
              <Link href="/game" className={styles.secondaryCta}>Try the 3-move demo</Link>
            </div>

            <div className={styles.heroMeta}>
              <div><strong>58</strong><span>cards</span></div>
              <div><strong>11</strong><span>positions</span></div>
              <div><strong>4</strong><span>traits</span></div>
              <div><strong>1</strong><span>shared table</span></div>
            </div>
          </div>

          <div className={styles.heroVisual} aria-label="Squad22 trait triple on a football pitch">
            <div className={styles.visualLabel}><span>TACTICAL MOMENT</span><b>CONTROL TRIPLE</b></div>
            <div className={styles.cardArc}>
              <div className={`${styles.heroCard} ${styles.heroCardOne}`}><Image src={cardImage(2)} alt="Squad22 card" width={250} height={355} priority /></div>
              <div className={`${styles.heroCard} ${styles.heroCardTwo}`}><Image src={cardImage(10)} alt="Squad22 card" width={250} height={355} priority /></div>
              <div className={`${styles.heroCard} ${styles.heroCardThree}`}><Image src={cardImage(34)} alt="Squad22 card" width={250} height={355} priority /></div>
            </div>
            <div className={styles.openPositions}>
              <span>GLOBAL OPEN</span>
              <div><b>1</b><b>3</b><b>9</b></div>
              <small>Three positions. Both squads can use them.</small>
            </div>
            <div className={styles.nextCard}>
              <Image src={cardImage(1)} alt="Squad22 card ready to use an open position" width={132} height={188} priority />
              <span>YOUR NEXT DECISION</span>
            </div>
          </div>
        </div>

        <div className={styles.heroRail}>
          <span>PAIR — COMPLETE</span>
          <i />
          <span>TRIPLE — OPEN GLOBALLY</span>
          <i />
          <span>OPEN PILE — CONTROL THE TEMPO</span>
        </div>
      </section>

      <section className={styles.statementSection}>
        <div className={styles.statementIndex}>01</div>
        <p>Football instincts. Card-table nerve.</p>
        <h2>The move that helps you can help everyone.</h2>
      </section>

      <section id="rules" className={styles.rulesSection}>
        <div className={styles.sectionIntro}>
          <div>
            <p className={styles.eyebrow}>THE WHOLE IDEA IN THREE MOVES</p>
            <h2>Learn it by seeing it.</h2>
          </div>
          <p>
            Squad22 does not need a wall of instructions. Secure a position with a Pair. Open three positions globally with a Trait Triple. Then decide who gets value from that new space first.
          </p>
        </div>
        <AnimatedRules />
      </section>

      <section id="full-match" className={styles.matchSection}>
        <div className={styles.matchCopy}>
          <p className={styles.eyebrow}>FULL MATCH · SOLO VS AI</p>
          <h2>Not a demo.<br />A complete match.</h2>
          <p>
            Draw from the closed deck or attack the stacked Open Pile. Build all 11 positions, add staff, manage global openings and carry your score across rounds until somebody reaches the target.
          </p>
          <div className={styles.matchFacts}>
            <span>5 or 7 card hand</span>
            <span>300 / 500 / 600 target</span>
            <span>Save & resume</span>
            <span>The Gaffer AI</span>
          </div>
          <Link href="/play" className={styles.matchCta}>Enter the full match <span>→</span></Link>
        </div>

        <div className={styles.matchBoard} aria-label="Squad22 match preview">
          <div className={styles.scoreStrip}><span>YOU</span><b>170</b><em>ROUND 3</em><b>145</b><span>GAFFER</span></div>
          <div className={styles.boardPitch}>
            <span className={styles.boardHalfway} />
            <span className={styles.boardCircle} />
            <div className={styles.boardCardA}><Image src={cardImage(1)} alt="" width={96} height={136} /></div>
            <div className={styles.boardCardB}><Image src={cardImage(2)} alt="" width={96} height={136} /></div>
            <div className={styles.boardCardC}><Image src={cardImage(10)} alt="" width={96} height={136} /></div>
            <div className={styles.boardCardD}><Image src={cardImage(34)} alt="" width={96} height={136} /></div>
            <div className={styles.globalFlag}>GLOBAL OPEN · 3 / 9</div>
          </div>
          <div className={styles.boardFooter}><span>DRAW</span><strong>OPEN PILE</strong><span>PLAY</span></div>
        </div>
      </section>

      <section id="pricing" className={styles.pricingSection}>
        <div className={styles.pricingHeader}>
          <p className={styles.eyebrow}>PRICING WITHOUT THE NONSENSE</p>
          <h2>One game. One price.</h2>
          <p>No card packs. No season pass. No subscription treadmill.</p>
        </div>

        <div className={styles.priceRows}>
          <div className={styles.priceRow}>
            <div><span>01</span><strong>Full Online Game</strong><small>Launch edition · payments not active yet</small></div>
            <div className={styles.priceAmount}><b>$14.99</b><span>one time</span></div>
            <Link href="/play">Play beta now →</Link>
          </div>
          <div className={styles.priceRow}>
            <div><span>02</span><strong>Physical Edition</strong><small>Planned print-on-demand release</small></div>
            <div className={styles.priceAmount}><b>$24.99</b><span>+ shipping</span></div>
            <span className={styles.comingSoon}>Planned</span>
          </div>
        </div>
      </section>

      <section id="physical" className={styles.physicalSection}>
        <div className={styles.physicalCards} aria-hidden="true">
          <div className={`${styles.physicalCard} ${styles.physicalBack}`}><Image src="/images/card-back.webp" alt="" width={230} height={322} /></div>
          <div className={`${styles.physicalCard} ${styles.physicalLeft}`}><Image src={cardImage(1)} alt="" width={230} height={327} /></div>
          <div className={`${styles.physicalCard} ${styles.physicalRight}`}><Image src={cardImage(34)} alt="" width={230} height={327} /></div>
        </div>
        <div className={styles.physicalCopy}>
          <p className={styles.eyebrow}>THE DECK COMES AFTER THE DEMAND</p>
          <h2>Digital first.<br />Physical when earned.</h2>
          <p>
            The online game proves whether people actually want to play Squad22. Once demand is real, the same 58-card system moves to a print-on-demand physical edition — without financing piles of inventory first.
          </p>
          <div className={styles.physicalLine}><span>58-card system</span><span>Print on demand</span><span>$24.99 + shipping planned</span></div>
        </div>
      </section>

      <section className={styles.finalCta}>
        <div>
          <p className={styles.eyebrow}>THE TABLE IS OPEN</p>
          <h2>Build the XI.<br />Own the decision.</h2>
        </div>
        <div className={styles.finalActions}>
          <Link href="/play">Play full match <span>→</span></Link>
          <button type="button" onClick={replayIntro}>Watch the 8-second intro</button>
          <small>Free during beta · no payment required</small>
        </div>
      </section>

      <section className={styles.faqSection}>
        <div className={styles.faqHeading}><p className={styles.eyebrow}>QUICK ANSWERS</p><h2>Before kickoff.</h2></div>
        <div className={styles.faqList}>
          {faqs.map((item, index) => (
            <article key={item.question}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerBrand}><Image src="/images/logo.webp" alt="" width={38} height={38} /><span>SQUAD22</span></div>
        <p>Football strategy. Card-table nerve.</p>
        <div className={styles.footerLinks}><Link href="/imprint">Imprint</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div>
        <span>© {new Date().getFullYear()} Squad22</span>
      </footer>
    </main>
  );
}
