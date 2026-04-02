'use client';

import { useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  HiOutlineMap,
  HiOutlineServer,
  HiOutlineDatabase,
  HiOutlineLink,
  HiOutlineRefresh,
  HiOutlineChip,
  HiOutlineLightningBolt,
  HiOutlineCog,
} from 'react-icons/hi';
import { useBranchData, useBranchHref } from '@/providers/branch-provider';
import { useDocsContext } from '@/providers/docs-provider';
import { useDiffMode } from '@/hooks/use-diff-mode';
import { PageHeader } from '@/components/ui/page-header';
import { DiffEmptyState } from '@/features/diff-overview/diff-empty-state';
import { DiffDomainGroup, type ChangeItem } from '@/features/diff-overview/diff-domain-group';
import type { DiffResult, DiffSet, ApiGroupDiff } from '@/types/diff';
import type { Entity } from '@/types/data-model';
import type { Journey } from '@/types/journey';
import type { Lifecycle } from '@/types/lifecycle';
import type { ArchDiagram } from '@/types/architecture';
import type { Feature } from '@/types/feature';
import type { ErdNode } from '@/types/entity-relationship';
import type { ConfigEnum } from '@/types/config-ref';
import type { ApiEndpoint } from '@/types/api-contract';
import styles from './diff-overview-view.module.scss';

type StatusFilter = 'all' | 'added' | 'modified' | 'removed';

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'added', label: 'New' },
  { value: 'modified', label: 'Modified' },
  { value: 'removed', label: 'Removed' },
];

function itemsFromDiffSet<T>(
  diffSet: DiffSet<T>,
  getKey: (item: T) => string,
  getLabel: (item: T) => string,
  getHref: (item: T) => string,
): ChangeItem[] {
  const items: ChangeItem[] = [];
  for (const item of diffSet.added) {
    items.push({
      key: getKey(item),
      label: getLabel(item),
      status: 'added',
      href: getHref(item),
      data: item,
    });
  }
  for (const mod of diffSet.modified) {
    items.push({
      key: getKey(mod.head),
      label: getLabel(mod.head),
      status: 'modified',
      href: getHref(mod.head),
      changedFields: mod.changes,
      data: mod.head,
    });
  }
  for (const item of diffSet.removed) {
    items.push({
      key: getKey(item),
      label: getLabel(item),
      status: 'removed',
      href: null,
      data: item,
    });
  }
  return items;
}

function epSlug(ep: ApiEndpoint): string {
  return `${ep.method.toLowerCase()}-${ep.path.replace(/[^a-z0-9]+/gi, '-').replace(/(^-|-$)/g, '')}`;
}

function apiItems(
  apiGroupDiffs: ApiGroupDiff[],
  branchHref: (path: string) => string,
): ChangeItem[] {
  const items: ChangeItem[] = [];
  for (const gd of apiGroupDiffs) {
    if (gd.status === 'added') {
      for (const ep of gd.group.endpoints) {
        items.push({
          key: `${gd.group.name}:${ep.method}:${ep.path}`,
          label: `${ep.method} ${ep.path}`,
          status: 'added',
          href: branchHref(`/api-map#${epSlug(ep)}`),
          data: ep,
        });
      }
    } else if (gd.status === 'removed') {
      for (const ep of gd.group.endpoints) {
        items.push({
          key: `${gd.group.name}:${ep.method}:${ep.path}`,
          label: `${ep.method} ${ep.path}`,
          status: 'removed',
          href: null,
          data: ep,
        });
      }
    } else {
      for (const ep of gd.endpointDiffs.added) {
        items.push({
          key: `${gd.group.name}:${ep.method}:${ep.path}`,
          label: `${ep.method} ${ep.path}`,
          status: 'added',
          href: branchHref(`/api-map#${epSlug(ep)}`),
          data: ep,
        });
      }
      for (const mod of gd.endpointDiffs.modified) {
        items.push({
          key: `${gd.group.name}:${mod.head.method}:${mod.head.path}`,
          label: `${mod.head.method} ${mod.head.path}`,
          status: 'modified',
          href: branchHref(`/api-map#${epSlug(mod.head)}`),
          changedFields: mod.changes,
          data: mod.head,
        });
      }
      for (const ep of gd.endpointDiffs.removed) {
        items.push({
          key: `${gd.group.name}:${ep.method}:${ep.path}`,
          label: `${ep.method} ${ep.path}`,
          status: 'removed',
          href: null,
          data: ep,
        });
      }
    }
  }
  return items;
}

interface DomainConfig {
  key: string;
  label: string;
  icon: React.ReactNode;
  getItems: (diff: DiffResult, branchHref: (path: string) => string) => ChangeItem[];
}

const DOMAINS: DomainConfig[] = [
  {
    key: 'journeys',
    label: 'Journeys',
    icon: <HiOutlineMap />,
    getItems: (diff, bh) =>
      itemsFromDiffSet(
        diff.journeys,
        (j: Journey) => j.slug,
        (j: Journey) => j.title,
        (j: Journey) => bh(`/journeys/${j.domain}/${j.slug}`),
      ),
  },
  {
    key: 'apiGroups',
    label: 'API Map',
    icon: <HiOutlineServer />,
    getItems: (diff, bh) => apiItems(diff.apiGroupDiffs, bh),
  },
  {
    key: 'entities',
    label: 'Data Model',
    icon: <HiOutlineDatabase />,
    getItems: (diff, bh) =>
      itemsFromDiffSet(
        diff.entities,
        (e: Entity) => e.name,
        (e: Entity) => e.name,
        (e: Entity) => bh(`/data-model#${e.name}`),
      ),
  },
  {
    key: 'erdNodes',
    label: 'Relationships',
    icon: <HiOutlineLink />,
    getItems: (diff, bh) =>
      itemsFromDiffSet(
        diff.erdNodes,
        (n: ErdNode) => n.id,
        (n: ErdNode) => n.label,
        () => bh('/entity-relationships'),
      ),
  },
  {
    key: 'lifecycles',
    label: 'Lifecycles',
    icon: <HiOutlineRefresh />,
    getItems: (diff, bh) =>
      itemsFromDiffSet(
        diff.lifecycles,
        (l: Lifecycle) => l.slug,
        (l: Lifecycle) => l.name,
        (l: Lifecycle) => bh(`/lifecycles/${l.slug}`),
      ),
  },
  {
    key: 'archDiagrams',
    label: 'Architecture',
    icon: <HiOutlineChip />,
    getItems: (diff, bh) =>
      itemsFromDiffSet(
        diff.archDiagrams,
        (d: ArchDiagram) => d.slug,
        (d: ArchDiagram) => d.title,
        (d: ArchDiagram) => bh(`/architecture/${d.slug}`),
      ),
  },
  {
    key: 'features',
    label: 'Features',
    icon: <HiOutlineLightningBolt />,
    getItems: (diff, bh) =>
      itemsFromDiffSet(
        diff.features,
        (f: Feature) => f.slug,
        (f: Feature) => f.name,
        () => bh('/features'),
      ),
  },
  {
    key: 'configEnums',
    label: 'Config',
    icon: <HiOutlineCog />,
    getItems: (diff, bh) =>
      itemsFromDiffSet(
        diff.configEnums,
        (c: ConfigEnum) => c.slug,
        (c: ConfigEnum) => c.name,
        (c: ConfigEnum) => bh(`/config#${c.slug}`),
      ),
  },
];

export function DiffOverviewView() {
  const { activeBranch, branches } = useBranchData();
  const branchHref = useBranchHref();
  const { selectedItem, setSelectedItem } = useDocsContext();
  const { isActive, compareBranch, diffResult } = useDiffMode();
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status') as StatusFilter | null;
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    initialStatus && ['added', 'modified', 'removed'].includes(initialStatus)
      ? initialStatus
      : 'all',
  );

  const activeLabel = branches.find((b) => b.name === activeBranch)?.label ?? activeBranch;
  const comparisonLabel = branches.find((b) => b.name === compareBranch)?.label ?? compareBranch;

  const domainGroups = useMemo(() => {
    if (!diffResult) return [];
    return DOMAINS.map((config) => {
      const allItems = config.getItems(diffResult, branchHref);
      const filtered =
        statusFilter === 'all' ? allItems : allItems.filter((item) => item.status === statusFilter);
      return { ...config, items: filtered };
    }).filter((g) => g.items.length > 0);
  }, [diffResult, branchHref, statusFilter]);

  const selectedKey = selectedItem?.type === 'diff-item' ? selectedItem.item.key : null;

  const handleSelect = useCallback(
    (item: ChangeItem, domain: string) => {
      if (selectedItem?.type === 'diff-item' && selectedItem.item.key === item.key) {
        setSelectedItem(null);
      } else {
        setSelectedItem({
          type: 'diff-item',
          item: {
            key: item.key,
            label: item.label,
            status: item.status,
            domain,
            href: item.href,
            changedFields: item.changedFields,
            data: item.data,
          },
        });
      }
    },
    [selectedItem, setSelectedItem],
  );

  if (!isActive || !diffResult) {
    return <DiffEmptyState />;
  }

  const { added, modified, removed } = diffResult.summary;

  return (
    <div className={styles.container}>
      <PageHeader
        title="Compare Overview"
        subtitle={`${activeLabel} vs ${comparisonLabel}`}
        metrics={[
          { value: added, label: 'new' },
          { value: modified, label: 'modified' },
          { value: removed, label: 'removed' },
        ]}
      />

      <div className={styles.filterBar}>
        {FILTERS.map((f) => (
          <button
            key={f.value}
            className={`${styles.filterChip} ${statusFilter === f.value ? styles.filterChipActive : ''} ${f.value !== 'all' ? styles[`filter_${f.value}`] : ''}`}
            onClick={() => setStatusFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className={styles.groups}>
        {domainGroups.map((group) => (
          <DiffDomainGroup
            key={group.key}
            domain={group.label}
            icon={group.icon}
            items={group.items}
            selectedKey={selectedKey}
            onSelect={(item) => handleSelect(item, group.label)}
          />
        ))}

        {domainGroups.length === 0 && (
          <div className={styles.emptyFilter}>No {statusFilter} changes found.</div>
        )}
      </div>
    </div>
  );
}
