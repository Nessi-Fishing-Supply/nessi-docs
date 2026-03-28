'use client';

import type { Lifecycle } from '@/types/lifecycle';
import { Breadcrumb } from '@/components/ui';
import type { SwitcherItem } from '@/components/ui/breadcrumb';
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
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <LifecycleCanvas lifecycle={lifecycle} />
      </div>
    </div>
  );
}
