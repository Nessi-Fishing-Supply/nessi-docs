'use client';

import type { ArchDiagram } from '@/types/architecture';
import { Breadcrumb } from '@/components/ui';
import type { SwitcherItem } from '@/components/ui/breadcrumb';
import { ArchitectureCanvas } from '@/features/architecture/architecture-canvas';

interface ArchitecturePageClientProps {
  diagram: ArchDiagram;
  siblings: { slug: string; title: string; description: string }[];
}

export function ArchitecturePageClient({ diagram, siblings }: ArchitecturePageClientProps) {
  const switcherItems: SwitcherItem[] = siblings.map((s) => ({
    label: s.title,
    description: s.description,
    href: `/architecture/${s.slug}`,
    active: s.slug === diagram.slug,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '12px 16px 0', flexShrink: 0 }}>
        <Breadcrumb
          segments={[{ label: 'Architecture', href: '/architecture' }, { label: diagram.title }]}
          switcher={switcherItems}
        />
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <ArchitectureCanvas diagram={diagram} />
      </div>
    </div>
  );
}
