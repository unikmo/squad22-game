import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import styles from '../legal.module.css';

export const metadata: Metadata = {
  title: 'Terms of Use | Squad22',
  description: 'Terms governing use of the Squad22 website and guided digital demo.',
};

export default function TermsPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <nav className={styles.nav}>
          <Link href="/" className={styles.brand}><Image src="/images/logo.webp" alt="" width={34} height={34} />SQUAD22</Link>
          <Link href="/" className={styles.back}>← Back to Squad22</Link>
        </nav>
      </header>

      <article className={styles.main}>
        <p className={styles.eyebrow}>WEBSITE TERMS</p>
        <h1>Terms of Use</h1>
        <p className={styles.lead}>These terms cover the Squad22 website and the current free online tactical gameplay experience. Payments are not enabled in this version; paid access terms will be added before any customer is charged.</p>

        <section className={styles.section}>
          <h2>1. Provider and scope</h2>
          <p>The website is provided by the party identified in the <Link href="/imprint">Imprint</Link>. By using the website or demo, you agree to use them only in accordance with applicable law and these terms.</p>
        </section>

        <section className={styles.section}>
          <h2>2. Nature of the digital demo</h2>
          <p>The current browser experience is the free tactical entry version of Squad22. It demonstrates real core mechanics through pre-arranged decisions while broader match, account and multiplayer systems continue to be developed.</p>
        </section>

        <section className={styles.section}>
          <h2>3. Game rules</h2>
          <p>The current published Squad22 rules govern the game mechanics. Interactive examples may be updated as the canonical card database and online implementation are refined, but the site should not intentionally present a different rule as official gameplay.</p>
        </section>

        <section className={styles.section}>
          <h2>4. Acceptable use</h2>
          <ul>
            <li>Do not attempt to disrupt, overload, reverse engineer or unlawfully access the website or its infrastructure.</li>
            <li>Do not use the demo to upload, enter or transmit unlawful content or personal information belonging to another person.</li>
            <li>Do not copy or commercially exploit Squad22 assets without the appropriate permission.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>5. Intellectual property</h2>
          <p>All rights in Squad22 branding, game materials, card artwork, copy, visual design and original website content remain with the relevant rights holder. These terms do not grant a licence beyond ordinary personal use of the website and demo.</p>
        </section>

        <section className={styles.section}>
          <h2>6. Availability and changes</h2>
          <p>The demo may be modified, suspended or withdrawn as the product develops. Features labelled as upcoming or unreleased are not commitments to a specific release date.</p>
        </section>

        <section className={styles.section}>
          <h2>7. Liability</h2>
          <p>Mandatory statutory liability remains unaffected. Otherwise, the website and free development-stage demo are provided for informational and gameplay-demonstration purposes without a guarantee of uninterrupted availability or freedom from every defect.</p>
        </section>

        <section className={styles.section}>
          <h2>8. Privacy</h2>
          <p>Information about personal-data processing is available in the <Link href="/privacy">Privacy Policy</Link>.</p>
        </section>

        <section className={styles.section}>
          <h2>9. Changes to these terms</h2>
          <p>These terms may be updated to reflect material changes to the website or digital service. Paid products, ecommerce, accounts or production multiplayer should receive separate or expanded contractual terms before launch.</p>
          <p className={styles.notice}>Last updated: 12 August 2026.</p>
        </section>
      </article>

      <LegalFooter />
    </main>
  );
}

function LegalFooter() {
  return <footer className={styles.footer}><span>© {new Date().getFullYear()} Squad22</span><div className={styles.footerLinks}><Link href="/imprint">Imprint</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div></footer>;
}
