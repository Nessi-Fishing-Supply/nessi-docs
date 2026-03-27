'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import type { Feature } from '@/types/feature';
import type { FeatureDomain } from '@/types/dashboard';
import type { ChangelogEntry, ChangeType } from '@/types/changelog';
import { STATUS_COLORS } from '@/types/feature';
import { CHANGE_TYPE_CONFIG } from '@/types/changelog';
import { BorderTrace } from '@/components/ui/border-trace';
import styles from './feature-domain-view.module.scss';

/* ── Feature Row ── */

function FeatureRow({
  feature,
  staggerIndex,
  isOpen,
  onToggle,
  onOpen,
}: {
  feature: Feature;
  staggerIndex: number;
  isOpen: boolean;
  onToggle: () => void;
  onOpen: () => void;
}) {
  const [isDeepLinkTarget] = useState(
    () => typeof window !== 'undefined' && window.location.hash === `#${feature.slug}`,
  );
  const rowRef = useRef<HTMLDivElement>(null);
  const [highlight, setHighlight] = useState(false);

  useEffect(() => {
    function checkHash() {
      if (window.location.hash === `#${feature.slug}`) {
        onOpen();
        setHighlight(true);
        setTimeout(
          () => rowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
          100,
        );
        setTimeout(() => history.replaceState(null, '', window.location.pathname), 600);
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
        <span
          className={styles.featureStatusDot}
          style={{ background: STATUS_COLORS[feature.status] }}
        />
        <span className={styles.featureName}>{feature.name}</span>
        <span className={styles.featureMeta}>
          <span className={styles.endpointCount}>
            {feature.endpointCount} endpoint{feature.endpointCount !== 1 ? 's' : ''}
          </span>
          <span className={styles.chevron}>&#9656;</span>
        </span>
      </button>

      {isOpen && (
        <div className={styles.expansion}>
          {feature.description && (
            <div className={styles.expansionDescription}>{feature.description}</div>
          )}

          {apiLinks.length > 0 && (
            <div className={styles.expansionSection}>
              <div className={styles.sectionLabel}>
                API Endpoints <span className={styles.endpointBadge}>{feature.endpointCount}</span>
              </div>
              <div className={styles.linkList}>
                {apiLinks.map((link) => (
                  <Link key={link.href} href={link.href} className={styles.linkItem}>
                    {link.label}
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
                  <Link key={link.href} href={link.href} className={styles.linkItem}>
                    {link.label}
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
                  <Link key={link.href} href={link.href} className={styles.linkItem}>
                    {link.label}
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
                  <Link key={link.href} href={link.href} className={styles.linkItem}>
                    {link.label}
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

        <div className={styles.progressSection}>
          <span className={styles.progressPercent}>{domain.buildProgress}%</span>
          <div className={styles.progressBarTrack}>
            <div className={styles.progressBarFill} style={{ width: `${domain.buildProgress}%` }} />
          </div>
        </div>

        <div className={styles.statusBreakdown}>
          <span className={styles.statusItem}>
            <span className={styles.statusDot} style={{ background: STATUS_COLORS.built }} />
            {domain.builtCount} built
          </span>
          <span className={styles.statusItem}>
            <span
              className={styles.statusDot}
              style={{ background: STATUS_COLORS['in-progress'] }}
            />
            {domain.inProgressCount} in-progress
          </span>
          <span className={styles.statusItem}>
            <span className={styles.statusDot} style={{ background: STATUS_COLORS.stubbed }} />
            {domain.stubbedCount} stubbed
          </span>
          <span className={styles.statusItem}>
            <span className={styles.statusDot} style={{ background: STATUS_COLORS.planned }} />
            {domain.plannedCount} planned
          </span>
        </div>
      </div>

      {/* ── Feature Rows ── */}
      <div className={styles.featureContainer}>
        {features.map((feature, idx) => (
          <FeatureRow
            key={feature.slug}
            feature={feature}
            staggerIndex={idx}
            isOpen={openFeatures.has(feature.slug)}
            onToggle={() => toggleFeature(feature.slug)}
            onOpen={() => openFeature(feature.slug)}
          />
        ))}

        {features.length === 0 && (
          <div className={styles.emptyState}>No features in this domain.</div>
        )}
      </div>

      {/* ── Footer ── */}
      {(changelog.length > 0 || journeys.length > 0 || entities.length > 0) && (
        <div className={styles.footer}>
          <div className={styles.footerSection}>
            <div className={styles.footerTitle}>Recent Changes</div>
            <div className={styles.footerList}>
              {changelog.slice(0, 8).map((entry) =>
                (entry.changes ?? []).map((change, i) => {
                  const config = CHANGE_TYPE_CONFIG[change.type as ChangeType];
                  return (
                    <div key={`${entry.date}-${i}`} className={styles.changeEntry}>
                      <span
                        className={styles.changeTypeBadge}
                        style={{
                          color: config?.color ?? '#78756f',
                          background: `${config?.color ?? '#78756f'}1a`,
                        }}
                      >
                        {config?.label ?? change.type}
                      </span>
                      <span>{change.description}</span>
                    </div>
                  );
                }),
              )}
              {changelog.length === 0 && (
                <span className={styles.changeEntry}>No recent changes</span>
              )}
            </div>
          </div>

          <div className={styles.footerSection}>
            <div className={styles.footerTitle}>Quick Links</div>
            <div className={styles.footerList}>
              {journeys.map((j) => (
                <Link
                  key={j.slug}
                  href={`/journeys/${j.domain}/${j.slug}`}
                  className={styles.footerLink}
                >
                  {j.title}
                </Link>
              ))}
              {entities.map((e) => (
                <Link key={e.name} href={`/data-model#${e.name}`} className={styles.footerLink}>
                  {e.label ?? e.name} ({e.fieldCount} fields)
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
