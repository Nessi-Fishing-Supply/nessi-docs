'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { Feature } from '@/types/feature';
import type { FeatureDomain } from '@/types/dashboard';
import type { ChangelogEntry, ChangeType } from '@/types/changelog';
import type { DiffStatus, FieldChange } from '@/types/diff';
import { CHANGE_TYPE_CONFIG } from '@/types/changelog';
import { useAppStore } from '@/stores/app-store';
import { useBranchHref } from '@/hooks/use-branch-href';
import { useDiffResult } from '@/hooks/use-diff-result';
import { Badge } from '@/components/indicators/badge';
import { CollapsibleRow } from '@/components/layout/collapsible-row';
import {
  DiffFilterBar,
  type DiffStatusFilter,
} from '@/components/layout/filter-bar/diff-filter-bar';
import styles from './feature-domain-view.module.scss';

/* ── Deep-link href resolution ── */

function resolveHref(
  link: { type: string; label: string; href: string },
  journeyDomainMap: Map<string, string>,
  prefix: (path: string) => string,
): string {
  switch (link.type) {
    case 'entity':
      return prefix(`/data-model#${link.label}`);
    case 'api-group':
      return prefix(
        `/api-map#${link.label
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')}`,
      );
    case 'journey': {
      const domain = journeyDomainMap.get(link.label);
      return domain ? prefix(`/journeys/${domain}/${link.label}`) : prefix(link.href);
    }
    case 'lifecycle':
      return prefix(`/lifecycles/${link.label}`);
    default:
      return prefix(link.href);
  }
}

/* ── Feature Row Header ── */

function FeatureRowHeader({
  feature,
  diffStatus,
  isOpen,
}: {
  feature: Feature;
  diffStatus?: DiffStatus | null;
  isOpen: boolean;
}) {
  return (
    <>
      <span className={styles.featureRowTitle}>
        <span className={styles.featureName}>{feature.name}</span>
        {diffStatus && diffStatus !== 'unchanged' && <Badge variant="diff" status={diffStatus} />}
      </span>
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
      <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}>&#9656;</span>
    </>
  );
}

/* ── Feature Expansion ── */

function FeatureExpansion({
  feature,
  journeyDomainMap,
  crossDiffStatuses,
}: {
  feature: Feature;
  journeyDomainMap: Map<string, string>;
  crossDiffStatuses?: Map<string, DiffStatus>;
}) {
  const branchHref = useBranchHref();

  const apiLinks = feature.links?.filter((l) => l.type === 'api-group') ?? [];
  const entityLinks = feature.links?.filter((l) => l.type === 'entity') ?? [];
  const journeyLinks = feature.links?.filter((l) => l.type === 'journey') ?? [];
  const lifecycleLinks = feature.links?.filter((l) => l.type === 'lifecycle') ?? [];

  return (
    <div className={styles.expansion}>
      {feature.description && (
        <div className={styles.expansionDescription}>{feature.description}</div>
      )}

      {apiLinks.length > 0 && (
        <div className={styles.expansionSection}>
          <div className={styles.sectionLabel}>API Endpoints</div>
          <div className={styles.linkList}>
            {apiLinks.map((link) => {
              const ls = crossDiffStatuses?.get(link.label);
              return (
                <Link
                  key={link.label}
                  href={resolveHref(link, journeyDomainMap, branchHref)}
                  className={`${styles.linkItem} ${styles.linkApi} ${ls ? styles[`linkDiff_${ls}`] : ''}`}
                >
                  <span>{link.label}</span>
                  {ls && ls !== 'unchanged' && <Badge variant="diff" status={ls} />}
                  <span className={styles.linkArrowSmall}>&rsaquo;</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {entityLinks.length > 0 && (
        <div className={styles.expansionSection}>
          <div className={styles.sectionLabel}>Related Entities</div>
          <div className={styles.linkList}>
            {entityLinks.map((link) => {
              const ls = crossDiffStatuses?.get(link.label);
              return (
                <Link
                  key={link.label}
                  href={resolveHref(link, journeyDomainMap, branchHref)}
                  className={`${styles.linkItem} ${styles.linkEntity} ${ls ? styles[`linkDiff_${ls}`] : ''}`}
                >
                  <span>{link.label}</span>
                  {ls && ls !== 'unchanged' && <Badge variant="diff" status={ls} />}
                  <span className={styles.linkArrowSmall}>&rsaquo;</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {journeyLinks.length > 0 && (
        <div className={styles.expansionSection}>
          <div className={styles.sectionLabel}>Related Journeys</div>
          <div className={styles.linkList}>
            {journeyLinks.map((link) => {
              const ls = crossDiffStatuses?.get(link.label);
              return (
                <Link
                  key={link.label}
                  href={resolveHref(link, journeyDomainMap, branchHref)}
                  className={`${styles.linkItem} ${styles.linkJourney} ${ls ? styles[`linkDiff_${ls}`] : ''}`}
                >
                  <span>{link.label}</span>
                  {ls && ls !== 'unchanged' && <Badge variant="diff" status={ls} />}
                  <span className={styles.linkArrowSmall}>&rsaquo;</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {lifecycleLinks.length > 0 && (
        <div className={styles.expansionSection}>
          <div className={styles.sectionLabel}>Related Lifecycles</div>
          <div className={styles.linkList}>
            {lifecycleLinks.map((link) => {
              const ls = crossDiffStatuses?.get(link.label);
              return (
                <Link
                  key={link.label}
                  href={resolveHref(link, journeyDomainMap, branchHref)}
                  className={`${styles.linkItem} ${styles.linkLifecycle} ${ls ? styles[`linkDiff_${ls}`] : ''}`}
                >
                  <span>{link.label}</span>
                  {ls && ls !== 'unchanged' && <Badge variant="diff" status={ls} />}
                  <span className={styles.linkArrowSmall}>&rsaquo;</span>
                </Link>
              );
            })}
          </div>
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
  const branchHref = useBranchHref();
  const setSelectedItem = useAppStore.getState().selectItem;
  const { isActive: isDiffMode, diffResult } = useDiffResult();
  const featureStatusMap = isDiffMode ? diffResult?.features.statusMap : undefined;
  const [diffFilter, setDiffFilter] = useState<DiffStatusFilter>('all');

  const journeyDomainMap = new Map(journeys.map((j) => [j.slug, j.domain]));
  const [openFeatures, setOpenFeatures] = useState<Set<string>>(new Set());

  const diffCounts = useMemo(() => {
    if (!diffResult) return { added: 0, modified: 0, removed: 0 };
    // Only count features that belong to this domain
    const domainSlugs = new Set(features.map((f) => f.slug));
    const addedInDomain = diffResult.features.added.filter((f) => domainSlugs.has(f.slug));
    const modifiedInDomain = diffResult.features.modified.filter((m) =>
      domainSlugs.has(m.head.slug),
    );
    const removedInDomain = diffResult.features.removed.filter((f) => domainSlugs.has(f.slug));
    return {
      added: addedInDomain.length,
      modified: modifiedInDomain.length,
      removed: removedInDomain.length,
    };
  }, [diffResult, features]);

  const changedFieldsMap = useMemo(() => {
    const map = new Map<string, FieldChange[]>();
    if (!diffResult) return map;
    for (const mod of diffResult.features.modified) {
      map.set(mod.head.slug, mod.changes);
    }
    return map;
  }, [diffResult]);

  // Build cross-domain diff status map for linked items (entities, journeys, lifecycles, api groups)
  const crossDiffStatuses = useMemo(() => {
    const map = new Map<string, DiffStatus>();
    if (!isDiffMode || !diffResult) return map;
    // Entities — keyed by name
    for (const [key, status] of diffResult.entities.statusMap) {
      if (status !== 'unchanged') map.set(key, status);
    }
    // Journeys — keyed by slug
    for (const [key, status] of diffResult.journeys.statusMap) {
      if (status !== 'unchanged') map.set(key, status);
    }
    // Lifecycles — keyed by slug
    for (const [key, status] of diffResult.lifecycles.statusMap) {
      if (status !== 'unchanged') map.set(key, status);
    }
    // API groups — keyed by name
    for (const [key, status] of diffResult.apiGroups.statusMap) {
      if (status !== 'unchanged') map.set(key, status);
    }
    return map;
  }, [isDiffMode, diffResult]);

  const addedFeatures = useMemo(() => {
    if (!isDiffMode || !diffResult) return [];
    const domainSlugs = new Set(features.map((f) => f.slug));
    return diffResult.features.added.filter((f) => domainSlugs.has(f.slug));
  }, [isDiffMode, diffResult, features]);

  const filteredFeatures = useMemo(() => {
    if (!isDiffMode || !featureStatusMap) return features;
    if (diffFilter === 'all') {
      return features.filter((f) => {
        const s = featureStatusMap.get(f.slug);
        return s === 'added' || s === 'modified' || s === 'removed';
      });
    }
    return features.filter((f) => featureStatusMap.get(f.slug) === diffFilter);
  }, [features, isDiffMode, featureStatusMap, diffFilter]);

  const toggleFeature = (slug: string) => {
    if (isDiffMode && featureStatusMap?.get(slug) === 'unchanged') return;
    setOpenFeatures((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const handleExpand = (slug: string) => {
    if (!isDiffMode) return;
    const feat =
      features.find((f) => f.slug === slug) ?? addedFeatures.find((f) => f.slug === slug);
    if (!feat) return;
    const status = featureStatusMap?.get(slug);
    if (status && status !== 'unchanged') {
      setSelectedItem({
        type: 'diff-item',
        item: {
          key: slug,
          label: feat.name,
          status,
          domain: 'Features',
          href: branchHref(`/features/${domain.slug}#${slug}`),
          changedFields: changedFieldsMap.get(slug),
          data: feat,
        },
      });
    }
  };

  let staggerIndex = 0;

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

      {/* ── Diff Filter Bar ── */}
      {isDiffMode && (
        <div className={styles.diffFilterRow}>
          <DiffFilterBar active={diffFilter} onChange={setDiffFilter} counts={diffCounts} />
        </div>
      )}

      {/* ── Feature Rows ── */}
      <div className={styles.featureSectionLabel}>Features</div>
      <div className={styles.featureContainer}>
        {filteredFeatures.map((feature) => {
          const idx = staggerIndex++;
          const diffStatus = featureStatusMap?.get(feature.slug);
          return (
            <CollapsibleRow
              key={feature.slug}
              id={feature.slug}
              staggerIndex={idx}
              isOpen={openFeatures.has(feature.slug)}
              onToggle={() => toggleFeature(feature.slug)}
              diffStatus={diffStatus}
              onExpand={() => handleExpand(feature.slug)}
              header={
                <FeatureRowHeader
                  feature={feature}
                  diffStatus={diffStatus}
                  isOpen={openFeatures.has(feature.slug)}
                />
              }
            >
              <FeatureExpansion
                feature={feature}
                journeyDomainMap={journeyDomainMap}
                crossDiffStatuses={isDiffMode ? crossDiffStatuses : undefined}
              />
            </CollapsibleRow>
          );
        })}

        {/* Added features (diff mode only) */}
        {isDiffMode &&
          (diffFilter === 'all' || diffFilter === 'added') &&
          addedFeatures.map((feature) => {
            const idx = staggerIndex++;
            return (
              <CollapsibleRow
                key={`added-${feature.slug}`}
                id={feature.slug}
                staggerIndex={idx}
                isOpen={openFeatures.has(feature.slug)}
                onToggle={() => toggleFeature(feature.slug)}
                diffStatus="added"
                onExpand={() => handleExpand(feature.slug)}
                header={
                  <FeatureRowHeader
                    feature={feature}
                    diffStatus="added"
                    isOpen={openFeatures.has(feature.slug)}
                  />
                }
              >
                <FeatureExpansion
                  feature={feature}
                  journeyDomainMap={journeyDomainMap}
                  crossDiffStatuses={crossDiffStatuses}
                />
              </CollapsibleRow>
            );
          })}

        {filteredFeatures.length === 0 && addedFeatures.length === 0 && (
          <div className={styles.emptyState}>
            {isDiffMode ? 'No feature changes in this domain.' : 'No features in this domain.'}
          </div>
        )}
      </div>

      {/* ── Footer — hidden in diff mode ── */}
      {!isDiffMode && (changelog.length > 0 || journeys.length > 0 || entities.length > 0) && (
        <div className={styles.footer}>
          {changelog.length > 0 && (
            <div className={styles.footerSection}>
              <div className={styles.footerTitleRow}>
                <span className={styles.footerTitle}>Recent Changes</span>
                <Link
                  href={branchHref(`/changelog?domain=${domain.slug}`)}
                  className={styles.footerViewAll}
                >
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
                    href={branchHref(`/journeys/${j.domain}/${j.slug}`)}
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
                  <Link
                    key={e.name}
                    href={branchHref(`/data-model#${e.name}`)}
                    className={styles.entityLink}
                  >
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
