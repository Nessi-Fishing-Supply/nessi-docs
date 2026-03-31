'use client';

import { hexToRgba } from '@/features/canvas/utils/geometry';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface CategoryItem {
  key: string;
  label: string;
  color: string;
}

export interface CategoryControls {
  categories: CategoryItem[];
  visibleCategories: Set<string>;
  onToggleCategory: (key: string) => void;
}

/* ------------------------------------------------------------------ */
/*  CategoryDropup                                                     */
/* ------------------------------------------------------------------ */

export function CategoryDropup({ controls }: { controls: CategoryControls }) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 70,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(15,19,25,0.95)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 8,
        backdropFilter: 'blur(12px)',
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        zIndex: 11,
        minWidth: 200,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span
          style={{
            fontSize: 9,
            color: '#6a6860',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginRight: 4,
          }}
        >
          Category
        </span>
        {controls.categories.map((cat) => {
          const active = controls.visibleCategories.has(cat.key);
          return (
            <button
              key={cat.key}
              onClick={() => controls.onToggleCategory(cat.key)}
              style={{
                padding: '3px 10px',
                borderRadius: 12,
                fontSize: 10,
                border: active ? `1px solid ${cat.color}` : '1px solid transparent',
                background: hexToRgba(cat.color, active ? 0.15 : 0.05),
                color: active ? cat.color : '#9a9790',
                opacity: active ? 1 : 0.5,
                cursor: 'pointer',
              }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
