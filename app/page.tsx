import Image from 'next/image';
import Link from 'next/link';
import styles from './home.module.css';

const cardImage = (id: number) => `/images/cards/${String(id).padStart(2, '0')}.webp`;

const formation = [
  { n: 9, role: 'ST', x: 50, y: 13 },
  { n: 7, role: 'LW', x: 22, y: 24 },
  { n: 11, role: 'RW', x: 78, y: 24 },
  { n: 10, role: 'CAM', x: 50, y: 39 },
  { n: 6, role: 'CM', x: 30, y: 50 },
  { n: 8, role: 'CM', x: 70, y: 50 },
  { n: 2, role: 'LB', x: 16, y: 68 },
  { n: 4, role: 'CB', x: 38, y: 72 },
  { n: 3, role: 'CB', x: 62, y: 72 },
  { n: 5, role: 'RB', x: 84, y: 68 },
  { n: 1, role: 'GK', x: 50, y: 89 },
];

export default function Home() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          <Image src="/images/logo-mono.webp" alt="Squad22" width={38} height={38} priority />
          <span>SQUAD22</span>
        </Link>
        <nav>
          <a href="#how">How it plays</a>
          <a href="#game">Full match</a>
          <a href="#price">Pricing</a>
        </nav>
        <Link href="/play" className={styles.navCta}>PLAY MATCH</Link>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>ONLINE FOOTBALL STRATEGY CARD GAME</p>
          <h1>BUILD THE XI.<br /><span>WIN THE PITCH.</span></h1>
          <p className={styles.lead}>
            Pick your shape. Complete football positions. Create trait combinations. Control the Open Pile. Squad22 turns formation and timing into a head-to-head football card battle.
          </p>
          <div className={styles.heroActions}>
            <Link href="/play" className={styles.primary}>PLAY FULL MATCH <span>→</span></Link>
            <Link href="/game" className={styles.secondary}>TRY 3-MOVE DEMO</Link>
          </div>
          <div className={styles.heroFoot}>
            <span className={styles.liveDot} />
            <strong>FULL-MATCH BETA LIVE</strong>
            <span>58 cards · 4 formations · solo vs The Gaffer</span>
          </div>
        </div>

        <div className={styles.footballWorld} aria-label="4-3-3 Squad22 football formation">
          <div className={styles.stadiumLights} aria-hidden="true"><i/><i/><i/><i/><i/><i/></div>
          <div className={styles.scorebar}><span>YOUR XI</span><b>4–3–3</b><span>ROUND 1</span></div>
          <div className={styles.pitch}>
            <span className={styles.halfway}/>
            <span className={styles.centreCircle}/>
            <span className={styles.centreSpot}/>
            <span className={styles.boxTop}/>
            <span className={styles.boxBottom}/>
            <span className={styles.goalTop}/>
            <span className={styles.goalBottom}/>
            {formation.map((p) => (
              <div key={p.n} className={styles.player} style={{ left: `${p.x}%`, top: `${p.y}%` }}>
                <b>{p.n}</b><span>{p.role}</span>
              </div>
            ))}
          </div>
          <div className={styles.touchlineCards}>
            <span>YOUR HAND</span>
            <Image src={cardImage(2)} alt="Squad22 player card" width={96} height={136} priority />
            <Image src={cardImage(10)} alt="Squad22 player card" width={96} height={136} priority />
            <Image src={cardImage(34)} alt="Squad22 player card" width={96} height={136} priority />
          </div>
        </div>
      </section>

      <section id="how" className={styles.how}>
        <div className={styles.sectionLabel}>HOW SQUAD22 PLAYS</div>
        <h2>FOOTBALL FIRST.<br />CARDS MAKE THE DECISIONS.</h2>
        <div className={styles.threeMoves}>
          <article><b>01</b><h3>CHOOSE YOUR SHAPE</h3><p>Set up in 4-4-2, 4-3-3, 3-5-2 or 5-3-2. Your board is a football XI, not a generic card grid.</p></article>
          <article><b>02</b><h3>BUILD POSITIONS</h3><p>Pair two cards from the same numbered position to lock that place in your squad.</p></article>
          <article><b>03</b><h3>OPEN THE PITCH</h3><p>A Trait Triple opens three positions globally. Your attack can create space for the other side too.</p></article>
        </div>
      </section>

      <section id="game" className={styles.gameSection}>
        <div className={styles.gameVisual}>
          <div className={styles.miniPitch}>
            <span className={styles.miniHalf}/><span className={styles.miniCircle}/>
            <div className={styles.cardOnPitchA}><Image src={cardImage(1)} alt="" width={128} height={182}/></div>
            <div className={styles.cardOnPitchB}><Image src={cardImage(2)} alt="" width={128} height={182}/></div>
            <div className={styles.cardOnPitchC}><Image src={cardImage(10)} alt="" width={128} height={182}/></div>
            <div className={styles.tacticFlag}>GLOBAL OPEN · 1 / 3 / 9</div>
          </div>
        </div>
        <div className={styles.gameCopy}>
          <p className={styles.kicker}>FULL MATCH · SOLO VS AI</p>
          <h2>PLAY A MATCH.<br />NOT A TUTORIAL.</h2>
          <p>Draw from the deck or attack the stacked Open Pile. Build all 11 positions, add staff, manage global openings and carry your score across rounds until somebody reaches 300, 500 or 600.</p>
          <ul>
            <li>5 or 7 card starting hand</li>
            <li>4 football formations</li>
            <li>Multi-round scoring</li>
            <li>Save and resume</li>
          </ul>
          <Link href="/play" className={styles.primary}>START FULL MATCH <span>→</span></Link>
        </div>
      </section>

      <section id="price" className={styles.priceSection}>
        <div>
          <p className={styles.kicker}>LAUNCH MODEL</p>
          <h2>ONE GAME.<br />ONE PRICE.</h2>
          <p>No packs. No season pass. No subscription.</p>
        </div>
        <div className={styles.priceBlock}>
          <span>FULL ONLINE GAME</span>
          <strong>$14.99</strong>
          <b>ONE-TIME LAUNCH PRICE</b>
          <small>Pay once. Play forever. Payments remain off during beta.</small>
          <Link href="/play">PLAY FREE BETA →</Link>
        </div>
        <div className={styles.physicalNote}>
          <Image src="/images/card-back.webp" alt="Squad22 physical card" width={88} height={124}/>
          <div><span>PHYSICAL EDITION · PLANNED</span><strong>$24.99 + SHIPPING</strong><small>Print-on-demand after online demand is proven.</small></div>
        </div>
      </section>

      <section className={styles.finalCta}>
        <p>THE FORMATION IS YOURS.</p>
        <h2>BUILD THE XI.</h2>
        <Link href="/play">KICK OFF <span>→</span></Link>
      </section>

      <footer className={styles.footer}>
        <div className={styles.brand}><Image src="/images/logo-mono.webp" alt="" width={32} height={32}/><span>SQUAD22</span></div>
        <span>Football strategy. Card-table nerve.</span>
        <div><Link href="/imprint">Imprint</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div>
      </footer>
    </main>
  );
}
