'use client';

import { CANVAS_COLORS } from '../constants/canvas-colors';
import { sectionLabel as sectionLabelStyle } from '../constants/tooltip-styles';

/** Labeled section with consistent spacing */
export function TooltipSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={sectionLabelStyle}>{label}</div>
      {children}
    </div>
  );
}

/** Small inline badge (colored dot or background tint + text) */
export function TooltipBadge({ label, color }: { label: string; color?: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: '9px',
        fontWeight: 600,
        padding: '1px 6px',
        borderRadius: '3px',
        color: color ?? CANVAS_COLORS.textSecondary,
        background: color ? `${color}1a` : CANVAS_COLORS.bgSubtle,
      }}
    >
      {label}
    </span>
  );
}

/** Hover-highlighted link row */
export function TooltipLink({
  label,
  href,
  color,
  onClick,
}: {
  label: string;
  href?: string;
  color?: string;
  onClick?: () => void;
}) {
  const Tag = href ? 'a' : 'span';
  return (
    <Tag
      href={href}
      onClick={onClick}
      style={{
        display: 'block',
        fontSize: '10px',
        fontFamily: 'var(--font-family-mono)',
        color: color ?? CANVAS_COLORS.textSecondary,
        cursor: href || onClick ? 'pointer' : 'default',
        padding: '2px 0',
        textDecoration: 'none',
      }}
    >
      {label}
    </Tag>
  );
}
