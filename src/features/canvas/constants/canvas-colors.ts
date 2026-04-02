/**
 * Centralized color constants for canvas SVG inline styles.
 * SVG foreignObject can't use CSS custom properties — these mirror the theme tokens.
 * When Archway adds theming, only this file needs to change.
 */
export const CANVAS_COLORS = {
  textPrimary: '#e8e6e1',
  textSecondary: '#9a9790',
  textMuted: '#6a6860',
  textDim: '#4a4840',
  bgPanel: 'rgba(15,19,25,0.97)',
  bgSubtle: 'rgba(255,255,255,0.04)',
  bgFrost: 'rgba(20,25,32,0.15)',
  borderSubtle: 'rgba(255,255,255,0.12)',
  borderMedium: 'rgba(255,255,255,0.2)',
  tooltipShadow: '0 4px 20px rgba(0,0,0,0.6), 0 8px 40px rgba(0,0,0,0.3)',
  category: {
    core: '#3d8c75',
    shops: '#d4923a',
    commerce: '#e27739',
    social: '#9b7bd4',
    messaging: '#5b9fd6',
    content: '#5bbfcf',
    user: '#8a8580',
  } as Record<string, string>,
  categoryDefault: '#8a8580',
} as const;
