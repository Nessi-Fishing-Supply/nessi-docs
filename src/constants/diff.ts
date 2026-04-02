import type { DiffStatus } from '@/types/diff';

/** Diff colors for canvas/SVG components that can't use CSS variables directly. */
export const DIFF_COLORS: Record<DiffStatus, string> = {
  added: '#3d8c75',
  modified: '#7b8fcd',
  removed: '#b84040',
  unchanged: '#6a6860',
};

/** Complete diff status config for labels, colors, and backgrounds. */
export const DIFF_STATUS_CONFIG: Record<
  Exclude<DiffStatus, 'unchanged'>,
  { label: string; color: string; bg: string; border: string }
> = {
  added: {
    label: 'New',
    color: DIFF_COLORS.added,
    bg: 'rgba(61,140,117,0.12)',
    border: 'rgba(61,140,117,0.22)',
  },
  modified: {
    label: 'Modified',
    color: DIFF_COLORS.modified,
    bg: 'rgba(123,143,205,0.12)',
    border: 'rgba(123,143,205,0.22)',
  },
  removed: {
    label: 'Removed',
    color: DIFF_COLORS.removed,
    bg: 'rgba(184,64,64,0.12)',
    border: 'rgba(184,64,64,0.22)',
  },
};
