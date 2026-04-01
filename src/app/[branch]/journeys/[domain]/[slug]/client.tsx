'use client';

import { useState, useCallback } from 'react';
import type { Journey, StepLayer, StepStatus } from '@/types/journey';
import { getDomainConfig } from '@/constants/domains';
import { useBranchHref } from '@/providers/branch-provider';
import { Breadcrumb } from '@/components/ui';
import type { SwitcherItem } from '@/components/ui/breadcrumb';
import { JourneyCanvas } from '@/features/journeys/journey-canvas';

const ALL_LAYERS: StepLayer[] = ['client', 'server', 'database', 'background', 'email', 'external'];
const ALL_STATUSES: StepStatus[] = ['planned', 'built', 'tested'];

interface JourneyPageClientProps {
  journey: Journey;
  domain: string;
  siblings: { slug: string; title: string; description: string }[];
}

export function JourneyPageClient({ journey, domain, siblings }: JourneyPageClientProps) {
  const branchHref = useBranchHref();
  const [visibleLayers, setVisibleLayers] = useState<Set<string>>(new Set(ALL_LAYERS));
  const [visibleStatuses, setVisibleStatuses] = useState<Set<string>>(new Set(ALL_STATUSES));
  const domainConfig = getDomainConfig(domain);

  const toggleLayer = useCallback((layer: StepLayer) => {
    setVisibleLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layer)) next.delete(layer);
      else next.add(layer);
      return next;
    });
  }, []);

  const toggleStatus = useCallback((status: StepStatus) => {
    setVisibleStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  }, []);

  const switcherItems: SwitcherItem[] = siblings.map((s) => ({
    label: s.title,
    description: s.description,
    href: branchHref(`/journeys/${domain}/${s.slug}`),
    active: s.slug === journey.slug,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '12px 16px 0', flexShrink: 0 }}>
        <Breadcrumb
          segments={[
            { label: 'Journeys', href: branchHref('/journeys') },
            { label: domainConfig?.label ?? domain, href: branchHref(`/journeys/${domain}`) },
            { label: journey.title },
          ]}
          switcher={switcherItems}
        />
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <JourneyCanvas
          journey={journey}
          visibleLayers={visibleLayers}
          visibleStatuses={visibleStatuses}
          onToggleLayer={toggleLayer}
          onToggleStatus={toggleStatus}
          onResetFilters={() => {
            setVisibleLayers(new Set(ALL_LAYERS));
            setVisibleStatuses(new Set(ALL_STATUSES));
          }}
          filtersAreDirty={
            visibleLayers.size !== ALL_LAYERS.length || visibleStatuses.size !== ALL_STATUSES.length
          }
        />
      </div>
    </div>
  );
}
