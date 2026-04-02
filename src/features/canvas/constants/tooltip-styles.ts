import type React from 'react';
import { CANVAS_COLORS } from './canvas-colors';

export const TT_BG = CANVAS_COLORS.bgPanel;
export const TT_BORDER = CANVAS_COLORS.borderSubtle;
export const TT_SHADOW = CANVAS_COLORS.tooltipShadow;

export const sectionLabel: React.CSSProperties = {
  fontSize: '9px',
  color: CANVAS_COLORS.textDim,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: '3px',
};

export const monoBlock: React.CSSProperties = {
  fontSize: '10px',
  fontFamily: 'var(--font-family-mono)',
  background: CANVAS_COLORS.bgSubtle,
  padding: '4px 8px',
  borderRadius: '4px',
};
