'use client';

import Link from 'next/link';
import type { Lifecycle } from '@/types/lifecycle';
import { Breadcrumb } from '@/components/ui';
import type { SwitcherItem } from '@/components/ui/breadcrumb';
import { getEntitiesForLifecycle } from '@/data';
import { LifecycleCanvas } from '@/features/lifecycles/lifecycle-canvas';

interface LifecyclePageClientProps {
  lifecycle: Lifecycle;
  siblings: { slug: string; name: string; description: string }[];
}

export function LifecyclePageClient({ lifecycle, siblings }: LifecyclePageClientProps) {
  const switcherItems: SwitcherItem[] = siblings.map((s) => ({
    label: s.name,
    description: s.description,
    href: `/lifecycles/${s.slug}`,
    active: s.slug === lifecycle.slug,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '12px 16px 0', flexShrink: 0 }}>
        <Breadcrumb
          segments={[{ label: 'Lifecycles', href: '/lifecycles' }, { label: lifecycle.name }]}
          switcher={switcherItems}
        />
        {(() => {
          const entityNames = getEntitiesForLifecycle(lifecycle.slug);
          if (entityNames.length === 0) return null;
          return (
            <div style={{ padding: '4px 0 0', fontSize: '11px' }}>
              <span style={{ color: 'var(--text-dim)' }}>Governs: </span>
              <Link
                href={`/data-model#${entityNames[0]}`}
                style={{
                  color: 'var(--text-muted)',
                  textDecoration: 'none',
                  fontFamily: 'var(--font-family-mono)',
                  fontSize: '11px',
                }}
              >
                {entityNames[0]} →
              </Link>
            </div>
          );
        })()}
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <LifecycleCanvas lifecycle={lifecycle} />
      </div>
    </div>
  );
}
