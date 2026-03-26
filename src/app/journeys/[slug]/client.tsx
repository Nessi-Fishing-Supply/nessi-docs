'use client';

import { useState, useCallback } from 'react';
import type { Journey, StepLayer, StepStatus } from '@/types/journey';
import { JourneyCanvas } from '@/features/journeys/journey-canvas';
import { JourneyFilters } from '@/features/journeys/journey-filters';

const ALL_LAYERS: StepLayer[] = ['client', 'server', 'database', 'background', 'email', 'external'];
const ALL_STATUSES: StepStatus[] = ['planned', 'built', 'tested'];

interface JourneyPageClientProps {
  journey: Journey;
}

export function JourneyPageClient({ journey }: JourneyPageClientProps) {
  const [visibleLayers, setVisibleLayers] = useState<Set<string>>(new Set(ALL_LAYERS));
  const [visibleStatuses, setVisibleStatuses] = useState<Set<string>>(new Set(ALL_STATUSES));
  const [filterOpen, setFilterOpen] = useState(false);

  const toggleLayer = useCallback((layer: StepLayer) => {
    setVisibleLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layer)) next.delete(layer); else next.add(layer);
      return next;
    });
  }, []);

  const toggleStatus = useCallback((status: StepStatus) => {
    setVisibleStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status); else next.add(status);
      return next;
    });
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <JourneyFilters
        visibleLayers={visibleLayers}
        visibleStatuses={visibleStatuses}
        onToggleLayer={toggleLayer}
        onToggleStatus={toggleStatus}
        isOpen={filterOpen}
        onToggleOpen={() => setFilterOpen((p) => !p)}
      />
      <JourneyCanvas
        journey={journey}
        visibleLayers={visibleLayers}
        visibleStatuses={visibleStatuses}
      />
    </div>
  );
}
