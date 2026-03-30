'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import type { Feature } from '@/types/feature';
import type { FeatureDomain } from '@/types/dashboard';
import type { ChangelogEntry, ChangeType } from '@/types/changelog';
import { CHANGE_TYPE_CONFIG } from '@/types/changelog';
import { BorderTrace } from '@/components/ui/border-trace';
import styles from './feature-domain-view.module.scss';

/* ── Deep-link href resolution ── */

/** Clear any stale hash before navigating to prevent hash stacking. */
function clearHash() {
  if (window.location.hash) {
    history.replaceState(null, '', window.location.pathname);
  }
}

function resolveHref(
  link: { type: string; label: string; href: string },
  journeyDomainMap: Map<string, string>,
): string {
  switch (link.type) {
    case 'entity':
      return `/data-model#${link.label}`;
    case 'api-group':
      return `/api-map#${link.label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')}`;
    case 'journey': {
      const domain = journeyDomainMap.get(link.label);
      return domain ? `/journeys/${domain}/${link.label}` : link.href;
    }
    case 'lifecycle':
      return `/lifecycles/${link.label}`;
    default:
      return link.href;
  }
}

/* ── Feature Row ── */

function FeatureRow({
  feature,
  staggerIndex,
  isOpen,
  onToggle,
  onOpen,
  journeyDomainMap,
}: {
  feature: Feature;
  staggerIndex: number;
  isOpen: boolean;
  onToggle: () => void;
  onOpen: () => void;
  journeyDomainMap: Map<string, string>;
}) {
  const [isDeepLinkTarget] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.location.hash.split('#').filter(Boolean).includes(feature.slug),
  );
  const rowRef = useRef<HTMLDivElement>(null);
  const [highlight, setHighlight] = useState(false);

  useEffect(() => {
    function checkHash() {
      const hashes = window.location.hash.split('#').filter(Boolean);
      if (hashes.includes(feature.slug)) {
        onOpen();
        setHighlight(true);
        history.replaceState(null, '', window.location.pathname);
        setTimeout(
          () => rowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
          100,
        );
        setTimeout(() => setHighlight(false), 9500);
      }
    }

    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const apiLinks = feature.links?.filter((l) => l.type === 'api-group') ?? [];
  const entityLinks = feature.links?.filter((l) => l.type === 'entity') ?? [];
  const journeyLinks = feature.links?.filter((l) => l.type === 'journey') ?? [];
  const lifecycleLinks = feature.links?.filter((l) => l.type === 'lifecycle') ?? [];

  return (
    <div
      ref={rowRef}
      id={feature.slug}
      className={`${styles.featureRow} ${isOpen ? styles.featureRowOpen : ''}`}
      style={
        { '--stagger': isDeepLinkTarget ? '0ms' : `${staggerIndex * 20}ms` } as React.CSSProperties
      }
    >
      <BorderTrace active={highlight} />
      <button className={styles.featureRowHeader} onClick={onToggle}>
        <span className={styles.featureName}>{feature.name}</span>
        <span className={styles.featureBadges}>
          {feature.componentCount > 0 && (
            <span className={styles.featureBadge}>
              {feature.componentCount} component{feature.componentCount !== 1 ? 's' : ''}
            </span>
          )}
          {feature.endpointCount > 0 && (
            <span className={`${styles.featureBadge} ${styles.featureBadgeOrange}`}>
              {feature.endpointCount} endpoint{feature.endpointCount !== 1 ? 's' : ''}
            </span>
          )}
          {(feature.hookCount ?? 0) > 0 && (
            <span className={styles.featureBadge}>{feature.hookCount} hooks</span>
          )}
          {(feature.serviceCount ?? 0) > 0 && (
            <span className={styles.featureBadge}>{feature.serviceCount} services</span>
          )}
        </span>
        <span className={styles.chevron}>&#9656;</span>
      </button>

      {isOpen && (
        <div className={styles.expansion}>
          {feature.description && (
            <div className={styles.expansionDescription}>{feature.description}</div>
          )}

          {apiLinks.length > 0 && (
            <div className={styles.expansionSection}>
              <div className={styles.sectionLabel}>API Endpoints</div>
              <div className={styles.linkList}>
                {apiLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={resolveHref(link, journeyDomainMap)}
                    onClick={clearHash}
                    className={`${styles.linkItem} ${styles.linkApi}`}
                  >
                    <span>{link.label}</span>
                    <span className={styles.linkArrowSmall}>&rsaquo;</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {entityLinks.length > 0 && (
            <div className={styles.expansionSection}>
              <div className={styles.sectionLabel}>Related Entities</div>
              <div className={styles.linkList}>
                {entityLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={resolveHref(link, journeyDomainMap)}
                    onClick={clearHash}
                    className={`${styles.linkItem} ${styles.linkEntity}`}
                  >
                    <span>{link.label}</span>
                    <span className={styles.linkArrowSmall}>&rsaquo;</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {journeyLinks.length > 0 && (
            <div className={styles.expansionSection}>
              <div className={styles.sectionLabel}>Related Journeys</div>
              <div className={styles.linkList}>
                {journeyLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={resolveHref(link, journeyDomainMap)}
                    onClick={clearHash}
                    className={`${styles.linkItem} ${styles.linkJourney}`}
                  >
                    <span>{link.label}</span>
                    <span className={styles.linkArrowSmall}>&rsaquo;</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {lifecycleLinks.length > 0 && (
            <div className={styles.expansionSection}>
              <div className={styles.sectionLabel}>Related Lifecycles</div>
              <div className={styles.linkList}>
                {lifecycleLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={resolveHref(link, journeyDomainMap)}
                    onClick={clearHash}
                    className={`${styles.linkItem} ${styles.linkLifecycle}`}
                  >
                    <span>{link.label}</span>
                    <span className={styles.linkArrowSmall}>&rsaquo;</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Main Component ── */

interface FeatureDomainViewProps {
  domain: FeatureDomain;
  features: Feature[];
  changelog: ChangelogEntry[];
  journeys: { slug: string; title: string; domain: string }[];
  entities: { name: string; label?: string; fieldCount: number }[];
}

export function FeatureDomainView({
  domain,
  features,
  changelog,
  journeys,
  entities,
}: FeatureDomainViewProps) {
  const journeyDomainMap = new Map(journeys.map((j) => [j.slug, j.domain]));
  const [openFeatures, setOpenFeatures] = useState<Set<string>>(new Set());

  const toggleFeature = (slug: string) => {
    setOpenFeatures((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const openFeature = (slug: string) => {
    setOpenFeatures((prev) => {
      const next = new Set(prev);
      next.add(slug);
      return next;
    });
  };

  return (
    <div className={styles.container}>
      {/* ── Coverage Hero ── */}
      <div className={styles.hero}>
        <div className={styles.heroHeader}>
          <div>
            <h1 className={styles.heroTitle}>{domain.label}</h1>
            <p className={styles.heroDescription}>{domain.description}</p>
          </div>
          <div className={styles.heroBadges}>
            <span className={styles.heroBadge}>{domain.featureCount} features</span>
            <span className={styles.heroBadge}>{domain.endpointCount} endpoints</span>
            <span className={styles.heroBadge}>{domain.journeyCount} journeys</span>
            <span className={styles.heroBadge}>{domain.entityCount} entities</span>
          </div>
        </div>
      </div>

      {/* ── Feature Rows ── */}
      <div className={styles.featureSectionLabel}>Features</div>
      <div className={styles.featureContainer}>
        {features.map((feature, idx) => (
          <FeatureRow
            key={feature.slug}
            feature={feature}
            staggerIndex={idx}
            isOpen={openFeatures.has(feature.slug)}
            onToggle={() => toggleFeature(feature.slug)}
            onOpen={() => openFeature(feature.slug)}
            journeyDomainMap={journeyDomainMap}
          />
        ))}

        {features.length === 0 && (
          <div className={styles.emptyState}>No features in this domain.</div>
        )}
      </div>

      {/* ── Footer ── */}
      {(changelog.length > 0 || journeys.length > 0 || entities.length > 0) && (
        <div className={styles.footer}>
          {changelog.length > 0 && (
            <div className={styles.footerSection}>
              <div className={styles.footerTitleRow}>
                <span className={styles.footerTitle}>Recent Changes</span>
                <Link href={`/changelog?domain=${domain.slug}`} className={styles.footerViewAll}>
                  View all &rarr;
                </Link>
              </div>
              <div className={styles.footerList}>
                {changelog
                  .flatMap((entry) =>
                    (entry.changes ?? []).map((change) => ({ ...change, date: entry.date })),
                  )
                  .slice(0, 6)
                  .map((change, i) => {
                    const config = CHANGE_TYPE_CONFIG[change.type as ChangeType];
                    return (
                      <div key={i} className={styles.changeEntry}>
                        <span
                          className={styles.changeTypeBadge}
                          style={{
                            color: config?.color ?? '#78756f',
                            background: `${config?.color ?? '#78756f'}1a`,
                          }}
                        >
                          {config?.label ?? change.type}
                        </span>
                        <span className={styles.changeDesc}>{change.description}</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {journeys.length > 0 && (
            <div className={styles.footerSection}>
              <div className={styles.footerTitle}>Journeys</div>
              <div className={styles.footerList}>
                {journeys.map((j) => (
                  <Link
                    key={j.slug}
                    href={`/journeys/${j.domain}/${j.slug}`}
                    className={styles.journeyLink}
                  >
                    <span>{j.title}</span>
                    <span className={styles.linkArrow}>&rsaquo;</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {entities.length > 0 && (
            <div className={styles.footerSection}>
              <div className={styles.footerTitle}>Entities</div>
              <div className={styles.footerList}>
                {entities.map((e) => (
                  <Link key={e.name} href={`/data-model#${e.name}`} className={styles.entityLink}>
                    <span>{e.label ?? e.name}</span>
                    <span className={styles.footerLinkMeta}>{e.fieldCount} fields</span>
                    <span className={styles.linkArrow}>&rsaquo;</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
