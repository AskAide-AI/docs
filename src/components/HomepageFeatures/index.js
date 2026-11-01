import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

const EntryPointList = [
  {
    title: 'Frontend',
    link: '/frontend/overview',
    description: (
      <>
        The React SPA students, teachers, principals, and parents use: shipped
        features and flows, per-feature API references, and development guides
        from setup to SEO.
      </>
    ),
  },
  {
    title: 'Backend',
    link: '/backend/overview',
    description: (
      <>
        The Express + MongoDB API behind every screen: authentication and
        roles, the question generation engine, fees, database schema reference,
        and deployment.
      </>
    ),
  },
  {
    title: 'AI Service',
    link: '/ai-service/overview',
    description: (
      <>
        The FastAPI + Qdrant RAG service: document ingestion, question
        generation, learning insights, evaluation, and troubleshooting.
      </>
    ),
  },
];

function EntryPoint({title, link, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">
          <Link to={link}>{title}</Link>
        </Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {EntryPointList.map((props, idx) => (
            <EntryPoint key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
