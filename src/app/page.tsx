import Link from 'next/link';
import { journeys } from '@/data/journeys';
import { PERSONA_CONFIG } from '@/types/journey';
import type { Persona } from '@/types/journey';
import styles from './page.module.scss';

export default function HomePage() {
  // Group journeys by persona
  const grouped = journeys.reduce<Record<string, typeof journeys>>((acc, journey) => {
    if (!acc[journey.persona]) acc[journey.persona] = [];
    acc[journey.persona].push(journey);
    return acc;
  }, {});

  // Count stats
  const totalFlows = journeys.reduce((sum, j) => sum + j.flows.length, 0);
  const totalSteps = journeys.reduce(
    (sum, j) => sum + j.flows.reduce((fSum, f) => fSum + f.steps.length, 0),
    0,
  );
  const testedSteps = journeys.reduce(
    (sum, j) =>
      sum + j.flows.reduce((fSum, f) => fSum + f.steps.filter((s) => s.status === 'tested').length, 0),
    0,
  );
  const builtSteps = journeys.reduce(
    (sum, j) =>
      sum + j.flows.reduce((fSum, f) => fSum + f.steps.filter((s) => s.status === 'built').length, 0),
    0,
  );

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Nessi Docs</h1>
        <p className={styles.subtitle}>
          User journeys, flows, and testing coverage for the Nessi fishing marketplace.
        </p>
      </header>

      <section className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{journeys.length}</span>
          <span className={styles.statLabel}>Journeys</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{totalFlows}</span>
          <span className={styles.statLabel}>Flows</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{totalSteps}</span>
          <span className={styles.statLabel}>Steps</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{builtSteps}</span>
          <span className={styles.statLabel}>Built</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{testedSteps}</span>
          <span className={styles.statLabel}>Tested</span>
        </div>
      </section>

      <section className={styles.journeys}>
        <h2 className={styles.sectionTitle}>Journeys by Persona</h2>

        {Object.entries(grouped).map(([persona, personaJourneys]) => {
          const config = PERSONA_CONFIG[persona as Persona];
          return (
            <div key={persona} className={styles.personaGroup}>
              <div className={styles.personaHeader}>
                <h3 className={styles.personaName}>{config?.label ?? persona}</h3>
                <span className={styles.personaDescription}>{config?.description}</span>
              </div>

              <div className={styles.journeyGrid}>
                {personaJourneys.map((journey) => {
                  const stepCount = journey.flows.reduce((s, f) => s + f.steps.length, 0);
                  const layers = [
                    ...new Set(journey.flows.flatMap((f) => f.steps.map((s) => s.layer))),
                  ];
                  const hasBackground = layers.includes('background');
                  const hasEmail = layers.includes('email');

                  return (
                    <Link
                      key={journey.slug}
                      href={`/journeys/${journey.slug}`}
                      className={styles.journeyCard}
                    >
                      <h4 className={styles.journeyTitle}>{journey.title}</h4>
                      <p className={styles.journeyDescription}>{journey.description}</p>
                      <div className={styles.journeyMeta}>
                        <span className={styles.flowCount}>
                          {journey.flows.length} flow{journey.flows.length !== 1 ? 's' : ''}
                        </span>
                        <span className={styles.stepCount}>{stepCount} steps</span>
                        {hasBackground && <span className={styles.layerBadge} data-layer="background">Background</span>}
                        {hasEmail && <span className={styles.layerBadge} data-layer="email">Email</span>}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>
    </main>
  );
}
