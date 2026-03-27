/**
 * Centralized color constants for domain concepts.
 * Maps to CSS custom properties defined in src/styles/variables/colors.scss.
 */

export const METHOD_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  GET: {
    color: '#3d8c75',
    bg: 'rgba(61,140,117,0.1)',
    border: 'rgba(61,140,117,0.25)',
  },
  POST: {
    color: '#e27739',
    bg: 'rgba(226,119,57,0.1)',
    border: 'rgba(226,119,57,0.25)',
  },
  PUT: {
    color: '#b86e0a',
    bg: 'rgba(184,110,10,0.1)',
    border: 'rgba(184,110,10,0.25)',
  },
  PATCH: {
    color: '#e89048',
    bg: 'rgba(232,144,72,0.1)',
    border: 'rgba(232,144,72,0.25)',
  },
  DELETE: {
    color: '#b84040',
    bg: 'rgba(184,64,64,0.1)',
    border: 'rgba(184,64,64,0.25)',
  },
};

const DEFAULT_METHOD = {
  color: '#78756f',
  bg: 'rgba(120,117,111,0.1)',
  border: 'rgba(120,117,111,0.25)',
};

export function getMethodColors(method: string) {
  return METHOD_COLORS[method] ?? DEFAULT_METHOD;
}

/** Generate a 10% opacity background from a hex color */
export function colorBg(hex: string): string {
  return `${hex}1a`;
}

/** Generate a tinted background at a specific opacity (0-1) for error/status cards */
export function colorTint(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${opacity})`;
}
