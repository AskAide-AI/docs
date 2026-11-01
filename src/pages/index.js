import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';

import Heading from '@theme/Heading';
import styles from './index.module.css';

function HomepageHeader() {
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          AskAide AI Documentation
        </Heading>
        <p className="hero__subtitle">
          Everything you need to understand, run, and build on AskAide AI — the
          learning platform for schools, from daily practice and fees to
          AI-powered question generation.
        </p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/intro">
            Explore the docs
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home() {
  return (
    <Layout
      title="AskAide AI Documentation"
      description="Guides, API references, and architecture notes for AskAide AI — the learning platform for schools: practice sessions, fees, referrals, and AI-powered question generation.">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
