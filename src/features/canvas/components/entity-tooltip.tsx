'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import type { Entity } from '@/types/data-model';
import type { ErdNode } from '@/types/entity-relationship';
import { getEndpointsForTable, getLifecycleForEntity, type EndpointRef } from '@/data';
import { GitHubLink } from '@/components/ui/github-link';
import { ERD_NODE_WIDTH } from '../utils/geometry';
import { TT_BG, TT_BORDER, TT_SHADOW, sectionLabel, monoBlock } from '../constants/tooltip-styles';

const BADGE_COLORS: Record<string, string> = {
  core: '#3d8c75',
  user: '#5b9fd6',
  lifecycle: '#d4923a',
  junction: '#9b7bd4',
  media: '#d46b8a',
  tracking: '#5bbfcf',
  discovery: '#c9b44a',
  config: '#8a8580',
  system: '#7a8591',
};

const linkIcon = (
  <svg
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    style={{ flexShrink: 0, opacity: 0.5 }}
  >
    <path
      d="M4.5 2.5H2.5V9.5H9.5V7.5"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
    />
    <path
      d="M7 2.5H9.5V5"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M9.5 2.5L5.5 6.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
  </svg>
);

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: '#3d8c75',
    POST: '#d4923a',
    PUT: '#5b9fd6',
    PATCH: '#9b7bd4',
    DELETE: '#e05555',
  };
  return (
    <span
      style={{
        fontSize: '8px',
        fontWeight: 700,
        fontFamily: 'var(--font-family-mono)',
        padding: '1px 5px',
        borderRadius: '3px',
        background: `${colors[method] ?? '#6a6860'}1a`,
        color: colors[method] ?? '#6a6860',
      }}
    >
      {method}
    </span>
  );
}

function HoverLink({
  href,
  children,
  color = '#e27739',
}: {
  href: string;
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <Link
      href={href}
      style={{
        ...monoBlock,
        color,
        textDecoration: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        cursor: 'pointer',
        overflow: 'hidden',
        transition: 'background 150ms ease-out',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
      }}
    >
      {children}
    </Link>
  );
}

interface EntityTooltipProps {
  node: ErdNode;
  entity: Entity | undefined;
  children: React.ReactNode;
  suppressTooltip?: boolean;
}

/** Delay before closing tooltip — gives cursor time to bridge from node to tooltip */
const CLOSE_DELAY = 120;

export function EntityTooltip({ node, entity, children, suppressTooltip }: EntityTooltipProps) {
  const [visible, setVisible] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setVisible(true);
  }, []);

  const scheduleClose = useCallback(() => {
    closeTimer.current = setTimeout(() => setVisible(false), CLOSE_DELAY);
  }, []);

  const badgeColor = BADGE_COLORS[entity?.badge ?? ''] ?? '#8a8580';

  // Derived data
  const fields = entity?.fields ?? [];
  const pkFields = fields.filter((f) => f.isPrimaryKey);
  const fkFields = fields.filter((f) => f.references);
  const rlsCount = entity?.rlsPolicies?.length ?? 0;
  const indexCount = entity?.indexes?.length ?? 0;
  const triggerCount = entity?.triggers?.length ?? 0;
  const endpoints: EndpointRef[] = entity ? getEndpointsForTable(entity.name) : [];

  const showTooltip = visible && entity && !suppressTooltip;

  return (
    <g onMouseEnter={show} onMouseLeave={scheduleClose}>
      {children}
      {showTooltip && (
        <foreignObject
          x={node.x}
          y={node.y - 8}
          width={320}
          height={1}
          overflow="visible"
          style={{ pointerEvents: 'auto' }}
          onMouseEnter={show}
          onMouseLeave={scheduleClose}
        >
          <div
            style={{
              position: 'absolute',
              bottom: 4,
              left: ERD_NODE_WIDTH / 2 - 150,
              width: 300,
              animation: 'tooltip-in 120ms ease-out',
            }}
          >
            <div
              style={{
                position: 'relative',
                padding: '12px 14px',
                background: TT_BG,
                border: `1px solid ${TT_BORDER}`,
                borderRadius: '8px',
                backdropFilter: 'blur(12px)',
                boxShadow: TT_SHADOW,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {/* Header: name + badge */}
              <div>
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    fontFamily: 'var(--font-family-mono)',
                    color: badgeColor,
                    lineHeight: '1.4',
                    marginBottom: '5px',
                  }}
                >
                  {entity!.label ?? entity!.name}
                </div>
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                  {entity!.badge && (
                    <span
                      style={{
                        fontSize: '9px',
                        padding: '1px 7px',
                        borderRadius: '10px',
                        background: `${badgeColor}1a`,
                        color: badgeColor,
                      }}
                    >
                      {entity!.badge}
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: '9px',
                      padding: '1px 7px',
                      borderRadius: '10px',
                      background: 'rgba(255,255,255,0.06)',
                      color: '#9a9790',
                    }}
                  >
                    {fields.length} field{fields.length !== 1 ? 's' : ''}
                  </span>
                  {rlsCount > 0 && (
                    <span
                      style={{
                        fontSize: '9px',
                        padding: '1px 7px',
                        borderRadius: '10px',
                        background: 'rgba(61,140,117,0.1)',
                        color: '#3d8c75',
                      }}
                    >
                      {rlsCount} RLS
                    </span>
                  )}
                  {indexCount > 0 && (
                    <span
                      style={{
                        fontSize: '9px',
                        padding: '1px 7px',
                        borderRadius: '10px',
                        background: 'rgba(255,255,255,0.06)',
                        color: '#6a6860',
                      }}
                    >
                      {indexCount} index{indexCount !== 1 ? 'es' : ''}
                    </span>
                  )}
                  {triggerCount > 0 && (
                    <span
                      style={{
                        fontSize: '9px',
                        padding: '1px 7px',
                        borderRadius: '10px',
                        background: 'rgba(212,146,58,0.1)',
                        color: '#d4923a',
                      }}
                    >
                      {triggerCount} trigger{triggerCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* Why */}
              {entity!.why && (
                <div>
                  <div style={sectionLabel}>Purpose</div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: '#9a9790',
                      lineHeight: '1.5',
                      borderLeft: `2px solid ${badgeColor}`,
                      paddingLeft: '8px',
                    }}
                  >
                    {entity!.why.length > 200 ? entity!.why.slice(0, 200) + '...' : entity!.why}
                  </div>
                </div>
              )}

              {/* Primary key */}
              {pkFields.length > 0 && (
                <div>
                  <div style={sectionLabel}>Primary Key</div>
                  <div style={{ ...monoBlock, color: '#9a9790' }}>
                    {pkFields.map((f) => f.name).join(', ')}
                  </div>
                </div>
              )}

              {/* Foreign keys */}
              {fkFields.length > 0 && (
                <div>
                  <div style={sectionLabel}>Foreign Keys</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {fkFields.slice(0, 5).map((f) => (
                      <div
                        key={f.name}
                        style={{
                          fontSize: '10px',
                          fontFamily: 'var(--font-family-mono)',
                          display: 'flex',
                          gap: '6px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: 'rgba(255,255,255,0.03)',
                        }}
                      >
                        <span style={{ color: '#9a9790' }}>{f.name}</span>
                        <span style={{ color: '#4a4840' }}>→</span>
                        <span style={{ color: badgeColor }}>{f.references!.table}</span>
                      </div>
                    ))}
                    {fkFields.length > 5 && (
                      <div style={{ fontSize: '9px', color: '#4a4840', paddingLeft: '8px' }}>
                        +{fkFields.length - 5} more
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Related API endpoints */}
              {endpoints.length > 0 && (
                <div>
                  <div style={sectionLabel}>API Endpoints</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {endpoints.slice(0, 4).map((ep) => (
                      <HoverLink key={ep.anchor} href={`/api-map#${ep.anchor}`}>
                        <MethodBadge method={ep.method} />
                        <span
                          title={ep.path}
                          style={{
                            flex: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {ep.path}
                        </span>
                        {linkIcon}
                      </HoverLink>
                    ))}
                    {endpoints.length > 4 && (
                      <div style={{ fontSize: '9px', color: '#4a4840', paddingLeft: '8px' }}>
                        +{endpoints.length - 4} more endpoints
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Lifecycle */}
              {(() => {
                const lc = entity ? getLifecycleForEntity(entity.name) : null;
                if (!lc) return null;
                return (
                  <div>
                    <div style={sectionLabel}>Lifecycle</div>
                    <HoverLink href={`/lifecycles/${lc.slug}`}>
                      <span style={{ color: '#5f7fbf' }}>↻</span>
                      <span style={{ flex: 1 }}>{lc.name}</span>
                      {linkIcon}
                    </HoverLink>
                  </div>
                );
              })()}

              {/* Source file */}
              {entity!.sourceFile && (
                <div>
                  <div style={sectionLabel}>Source</div>
                  <GitHubLink filePath={entity!.sourceFile} />
                </div>
              )}

              {/* Deep-link to Data Model */}
              <div>
                <HoverLink href={`/data-model#${entity!.name}`} color={badgeColor}>
                  <span style={{ flex: 1 }}>View in Data Model</span>
                  {linkIcon}
                </HoverLink>
              </div>

              {/* Down arrow */}
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
                  fill={TT_BG}
                  stroke={TT_BORDER}
                  strokeWidth="1"
                  strokeLinejoin="round"
                />
                <rect x="0" y="0" width="14" height="1" fill={TT_BG} />
              </svg>
            </div>
          </div>
        </foreignObject>
      )}
    </g>
  );
}
