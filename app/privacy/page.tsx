import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import styles from '../legal.module.css';

export const metadata: Metadata = {
  title: 'Privacy Policy | Squad22',
  description: 'Privacy information for the Squad22 website and digital tactical demo.',
};

export default function PrivacyPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <nav className={styles.nav}>
          <Link href="/" className={styles.brand}><Image src="/images/logo.webp" alt="" width={34} height={34} />SQUAD22</Link>
          <Link href="/" className={styles.back}>← Back to Squad22</Link>
        </nav>
      </header>

      <article className={styles.main}>
        <p className={styles.eyebrow}>DATA PROTECTION</p>
        <h1>Privacy Policy</h1>
        <p className={styles.lead}>This notice describes the current public Squad22 website and free online tactical gameplay experience. It will be expanded before analytics, accounts, payments, newsletters or production multiplayer are introduced.</p>

        <section className={styles.section}>
          <h2>1. Controller</h2>
          <p>The data controller is the provider identified in the <Link href="/imprint">Imprint</Link>. Full current provider and contact details are maintained in the central Konfydence imprint referenced there.</p>
        </section>

        <section className={styles.section}>
          <h2>2. Accessing the website</h2>
          <p>When the website is requested, technical connection data such as IP address, request time, requested resource, browser information and similar server-log information may be processed by the hosting infrastructure to deliver the site, maintain security and diagnose technical problems.</p>
          <p>The legal basis is the legitimate interest in providing a stable and secure website, where applicable under Art. 6(1)(f) GDPR.</p>
        </section>

        <section className={styles.section}>
          <h2>3. Current online game experience</h2>
          <p>The current tactical game experience does not require an account. A squad name may be entered voluntarily and is passed to the demo in the page URL. Do not enter your real name, email address or other personal information as a squad name.</p>
          <p>This version does not include advertising, newsletter registration or marketing-tracking code.</p>
        </section>

        <section className={styles.section}>
          <h2>4. Intro preference</h2>
          <p>To avoid replaying the cinematic on every page visit in the same browser session, Squad22 stores a small session-only browser value indicating that the intro has already been shown. It is used only for this interface preference and not for advertising or cross-site tracking.</p>
        </section>

        <section className={styles.section}>
          <h2>5. Hosting and backend services</h2>
          <p>Technical data may be processed by service providers needed to host, secure and deliver the website and game infrastructure. The current architecture uses Vercel for the web application and Supabase for the Squad22 backend foundation.</p>
        </section>

        <section className={styles.section}>
          <h2>6. Retention</h2>
          <p>Technical logs should be retained only for as long as necessary for delivery, security, troubleshooting and applicable legal obligations. The intro preference stored in session storage normally expires when the browser session ends.</p>
        </section>

        <section className={styles.section}>
          <h2>7. Your rights</h2>
          <p>Subject to the conditions of the GDPR, you may have rights of access, rectification, erasure, restriction, data portability and objection. Where processing is based on consent, consent may be withdrawn for the future. You also have the right to lodge a complaint with a competent data-protection supervisory authority.</p>
        </section>

        <section className={styles.section}>
          <h2>8. Changes to this notice</h2>
          <p>This privacy policy will be updated when the website starts processing additional data, for example through accounts, analytics, payments, email marketing or multiplayer services.</p>
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
