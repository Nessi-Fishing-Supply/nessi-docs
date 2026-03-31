'use client';

import { useState } from 'react';

/* ------------------------------------------------------------------ */
/*  Shared button style constants                                      */
/* ------------------------------------------------------------------ */

export const BTN_STYLE: React.CSSProperties = {
  width: 32,
  height: 32,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'none',
  border: 'none',
  borderRadius: 6,
  color: '#9a9790',
  cursor: 'pointer',
  padding: 0,
  flexShrink: 0,
};

export const BTN_HOVER_BG = 'rgba(255,255,255,0.06)';
export const BTN_ACTIVE_BG = 'rgba(61,140,117,0.15)';

/* ------------------------------------------------------------------ */
/*  ToolbarBtn                                                         */
/* ------------------------------------------------------------------ */

interface ToolbarBtnProps {
  label: string;
  isActive?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function ToolbarBtn({
  label,
  isActive,
  onClick,
  children,
  style: extraStyle,
}: ToolbarBtnProps) {
  const [hovered, setHovered] = useState(false);

  const bg = isActive ? BTN_ACTIVE_BG : hovered ? BTN_HOVER_BG : 'none';

  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        aria-label={label}
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ ...BTN_STYLE, background: bg, ...extraStyle }}
      >
        {children}
      </button>
      {hovered && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: 8,
            pointerEvents: 'none',
            animation: 'tooltip-in 120ms ease-out',
          }}
        >
          <div
            style={{
              position: 'relative',
              whiteSpace: 'nowrap',
              padding: '4px 10px',
              background: 'rgba(15,19,25,0.97)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 6,
              fontSize: 10,
              color: '#b0ada8',
              boxShadow: '0 4px 20px rgba(0,0,0,0.6), 0 8px 40px rgba(0,0,0,0.3)',
            }}
          >
            {label}
            <svg
              width="14"
              height="7"
              viewBox="0 0 14 7"
              style={{
                position: 'absolute',
                bottom: -7,
                left: '50%',
                marginLeft: -7,
                display: 'block',
              }}
            >
              <path
                d="M0,0 L6,6 Q7,7 8,6 L14,0"
                fill="rgba(15,19,25,0.97)"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="1"
                strokeLinejoin="round"
              />
              <rect x="0" y="0" width="14" height="1" fill="rgba(15,19,25,0.97)" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
