import { notFound } from 'next/navigation';
import Link from 'next/link';
import { journeys, getJourneyBySlug } from '@/data/journeys';
import { PERSONA_CONFIG } from '@/types/journey';
import type { Persona, StepLayer } from '@/types/journey';
import FlowVisualizer from '@/features/journeys/components/flow-visualizer';
import LayerBadge from '@/features/journeys/components/layer-badge';
import styles from './page.module.scss';

export async function generateStaticParams() {
  return journeys.map((j) => ({ slug: j.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const journey = getJourneyBySlug(slug);
  if (!journey) return { title: 'Not Found' };
  return {
    title: journey.title,
    description: journey.description,
  };
}

export default async function JourneyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const journey = getJourneyBySlug(slug);

  if (!journey) notFound();

  const personaConfig = PERSONA_CONFIG[journey.persona as Persona];
  const allSteps = journey.flows.flatMap((f) => f.steps);
  const totalSteps = allSteps.length;
  const builtCount = allSteps.filter((s) => s.status === 'built').length;
  const testedCount = allSteps.filter((s) => s.status === 'tested').length;
  const plannedCount = allSteps.filter((s) => s.status === 'planned').length;
  const layers = [...new Set(allSteps.map((s) => s.layer))] as StepLayer[];
  const errorCount = allSteps.reduce((sum, s) => sum + (s.errorCases?.length ?? 0), 0);

  return (
    <main className={styles.page}>
      <nav className={styles.breadcrumb}>
        <Link href="/" className={styles.breadcrumbLink}>
          Nessi Docs
        </Link>
        <span className={styles.breadcrumbSep}>/</span>
        <span className={styles.breadcrumbCurrent}>{journey.title}</span>
      </nav>

      <header className={styles.header}>
        <div className={styles.personaBadge}>{personaConfig?.label ?? journey.persona}</div>
        <h1 className={styles.title}>{journey.title}</h1>
        <p className={styles.description}>{journey.description}</p>

        {journey.relatedIssues && journey.relatedIssues.length > 0 && (
          <div className={styles.issues}>
            {journey.relatedIssues.map((num) => (
              <span key={num} className={styles.issueBadge}>
                #{num}
              </span>
            ))}
          </div>
        )}
      </header>

      <section className={styles.summary}>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryValue}>{journey.flows.length}</span>
            <span className={styles.summaryLabel}>Flows</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryValue}>{totalSteps}</span>
            <span className={styles.summaryLabel}>Steps</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryValue}>{errorCount}</span>
            <span className={styles.summaryLabel}>Error Cases</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryValue}>
              {totalSteps > 0 ? Math.round(((builtCount + testedCount) / totalSteps) * 100) : 0}%
            </span>
            <span className={styles.summaryLabel}>Built</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryValue}>
              {totalSteps > 0 ? Math.round((testedCount / totalSteps) * 100) : 0}%
            </span>
            <span className={styles.summaryLabel}>Tested</span>
          </div>
        </div>

        <div className={styles.layerLegend}>
          <span className={styles.legendTitle}>Layers in this journey:</span>
          <div className={styles.legendBadges}>
            {layers.map((layer) => (
              <LayerBadge key={layer} layer={layer} />
            ))}
          </div>
        </div>

        {plannedCount > 0 && (
          <div className={styles.plannedNotice}>
            {plannedCount} step{plannedCount !== 1 ? 's' : ''} not yet built
          </div>
        )}
      </section>

      <section className={styles.flows}>
        {journey.flows.map((flow, i) => (
          <FlowVisualizer key={flow.id} flow={flow} flowIndex={i} />
        ))}
      </section>

      <footer className={styles.footer}>
        <Link href="/" className={styles.backLink}>
          &larr; All Journeys
        </Link>
      </footer>
    </main>
  );
}
