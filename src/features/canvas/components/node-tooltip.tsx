'use client';

import { useState } from 'react';
import type { JourneyNode } from '@/types/journey';
import Link from 'next/link';
import { LAYER_CONFIG, STATUS_CONFIG } from '@/types/journey';
import { GitHubLink } from '@/components/data-display/github-link';
import { getLifecyclesForRoute } from '@/data';
import { useBranchHref } from '@/hooks/use-branch-href';
import { NODE_WIDTH } from '../utils/geometry';
import { monoBlock } from '../constants/tooltip-styles';
import { CANVAS_COLORS } from '../constants/canvas-colors';
import { TooltipWrapper } from './tooltip-wrapper';
import { TooltipSection } from './tooltip-parts';

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

function HoverLink({
  href,
  children,
  color = '#e27739',
  external,
  style,
}: {
  href: string;
  children: React.ReactNode;
  color?: string;
  external?: boolean;
  style?: React.CSSProperties;
}) {
  const baseStyle: React.CSSProperties = {
    ...monoBlock,
    color,
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
    overflow: 'hidden',
    transition: 'background 150ms ease-out',
    ...style,
  };

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={baseStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = CANVAS_COLORS.bgSubtle;
        }}
      >
        {children}
      </a>
    );
  }

  return (
    <Link
      href={href}
      style={baseStyle}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = CANVAS_COLORS.bgSubtle;
      }}
    >
      {children}
    </Link>
  );
}

interface NodeTooltipProps {
  node: JourneyNode;
  children: React.ReactNode;
  suppressTooltip?: boolean;
  isSelected?: boolean;
}

export function NodeTooltip({ node, children, suppressTooltip, isSelected }: NodeTooltipProps) {
  const branchHref = useBranchHref();
  const [hovered, setHovered] = useState(false);

  if (node.type !== 'step' || suppressTooltip) {
    return <g onMouseEnter={() => setHovered(false)}>{children}</g>;
  }

  const showTooltip = hovered || isSelected;

  const layer = node.layer ? LAYER_CONFIG[node.layer] : null;
  const status = node.status ? STATUS_CONFIG[node.status] : null;
  const errorCount = node.errorCases?.length ?? 0;
  const ux = node.ux;
  const hasUx = ux && Object.values(ux).some(Boolean);

  return (
    <g onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      {children}
      <TooltipWrapper
        nodeX={node.x}
        nodeY={node.y}
        nodeWidth={NODE_WIDTH}
        tooltipWidth={300}
        visible={!!showTooltip}
        interactive={!!isSelected}
      >
        {/* Planned/roadmap banner */}
        {node.status === 'planned' && (
          <div
            style={{
              fontSize: '9px',
              fontFamily: 'var(--font-family-mono)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: CANVAS_COLORS.textMuted,
              padding: '4px 8px',
              background: CANVAS_COLORS.bgSubtle,
              borderRadius: '4px',
              border: '1px dashed rgba(255,255,255,0.08)',
            }}
          >
            Roadmap — not yet built
          </div>
        )}

        {/* Header: title + badges */}
        <div>
          <div
            style={{
              fontSize: '12px',
              fontWeight: 500,
              color:
                node.status === 'planned' ? CANVAS_COLORS.textMuted : CANVAS_COLORS.textPrimary,
              lineHeight: '1.4',
              marginBottom: '5px',
            }}
          >
            {node.label || node.route || 'Step'}
          </div>
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            {layer && (
              <span
                style={{
                  fontSize: '9px',
                  padding: '1px 7px',
                  borderRadius: '10px',
                  background: `${layer.color}1a`,
                  color: layer.color,
                }}
              >
                {layer.label}
              </span>
            )}
            {status && (
              <span
                style={{
                  fontSize: '9px',
                  padding: '1px 7px',
                  borderRadius: '10px',
                  background: `${status.color}1a`,
                  color: status.color,
                }}
              >
                {status.label}
              </span>
            )}
            {errorCount > 0 && (
              <span
                style={{
                  fontSize: '9px',
                  padding: '1px 7px',
                  borderRadius: '10px',
                  background: 'rgba(220,60,60,0.15)',
                  color: '#e05555',
                }}
              >
                {errorCount} error{errorCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Route / Endpoint */}
        {node.route && (
          <TooltipSection label={node.layer === 'server' ? 'Endpoint' : 'Page'}>
            {node.layer === 'server' ? (
              <HoverLink
                href={branchHref(
                  `/api-map#${node.route
                    .replace(/^(GET|POST|PUT|PATCH|DELETE)\s+/, '')
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/(^-|-$)/g, '')}`,
                )}
              >
                <span
                  style={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {node.route}
                </span>
                {linkIcon}
              </HoverLink>
            ) : (
              <HoverLink href={`https://nessifishingsupply.com${node.route}`} external>
                <span
                  style={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {node.route}
                </span>
                {linkIcon}
              </HoverLink>
            )}
          </TooltipSection>
        )}

        {/* Lifecycle impact */}
        {node.route &&
          (() => {
            const lcRefs = getLifecyclesForRoute(node.route);
            if (lcRefs.length === 0) return null;
            return (
              <TooltipSection label="Affects Lifecycle">
                {lcRefs.map((lc) => (
                  <HoverLink
                    key={lc.slug}
                    href={branchHref(`/lifecycles/${lc.slug}`)}
                    color="#5f7fbf"
                    style={{ marginTop: '2px' }}
                  >
                    <span>↻</span>
                    <span style={{ flex: 1 }}>{lc.name}</span>
                  </HoverLink>
                ))}
              </TooltipSection>
            );
          })()}

        {/* What it does / Why */}
        {node.why && (
          <TooltipSection label="What it does">
            <div
              style={{
                fontSize: '11px',
                color: CANVAS_COLORS.textSecondary,
                lineHeight: '1.5',
                borderLeft: `2px solid ${layer?.color ?? '#3d8c75'}`,
                paddingLeft: '8px',
              }}
            >
              {node.why.length > 250 ? node.why.slice(0, 250) + '...' : node.why}
            </div>
          </TooltipSection>
        )}

        {/* UX Behavior */}
        {hasUx && (
          <TooltipSection label="UX Behavior">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {ux!.toast && (
                <div
                  style={{
                    fontSize: '10px',
                    color: CANVAS_COLORS.textSecondary,
                    display: 'flex',
                    gap: '6px',
                  }}
                >
                  <span style={{ color: '#6b7280', flexShrink: 0 }}>Toast</span>
                  <span>{ux!.toast}</span>
                </div>
              )}
              {ux!.redirect && (
                <div
                  style={{
                    fontSize: '10px',
                    color: CANVAS_COLORS.textSecondary,
                    display: 'flex',
                    gap: '6px',
                  }}
                >
                  <span style={{ color: '#6b7280', flexShrink: 0 }}>Redirect</span>
                  <span style={{ fontFamily: 'var(--font-family-mono)' }}>{ux!.redirect}</span>
                </div>
              )}
              {ux!.modal && (
                <div
                  style={{
                    fontSize: '10px',
                    color: CANVAS_COLORS.textSecondary,
                    display: 'flex',
                    gap: '6px',
                  }}
                >
                  <span style={{ color: '#6b7280', flexShrink: 0 }}>Modal</span>
                  <span>{ux!.modal}</span>
                </div>
              )}
              {ux!.email && (
                <div
                  style={{
                    fontSize: '10px',
                    color: CANVAS_COLORS.textSecondary,
                    display: 'flex',
                    gap: '6px',
                  }}
                >
                  <span style={{ color: '#6b7280', flexShrink: 0 }}>Email</span>
                  <span>{ux!.email}</span>
                </div>
              )}
              {ux!.notification && (
                <div
                  style={{
                    fontSize: '10px',
                    color: CANVAS_COLORS.textSecondary,
                    display: 'flex',
                    gap: '6px',
                  }}
                >
                  <span style={{ color: '#6b7280', flexShrink: 0 }}>Notification</span>
                  <span>{ux!.notification}</span>
                </div>
              )}
              {ux!.stateChange && (
                <div
                  style={{
                    fontSize: '10px',
                    color: CANVAS_COLORS.textSecondary,
                    display: 'flex',
                    gap: '6px',
                  }}
                >
                  <span style={{ color: '#6b7280', flexShrink: 0 }}>State</span>
                  <span>{ux!.stateChange}</span>
                </div>
              )}
            </div>
          </TooltipSection>
        )}

        {/* Source file */}
        {node.codeRef && (
          <TooltipSection label="Source">
            <GitHubLink filePath={node.codeRef} />
          </TooltipSection>
        )}

        {/* Implementation notes */}
        {node.notes && (
          <TooltipSection label="Notes">
            <div style={{ fontSize: '10px', color: CANVAS_COLORS.textMuted, lineHeight: '1.4' }}>
              {node.notes.length > 200 ? node.notes.slice(0, 200) + '...' : node.notes}
            </div>
          </TooltipSection>
        )}

        {/* Error cases */}
        {errorCount > 0 && (
          <TooltipSection label="Error Cases">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {node.errorCases!.slice(0, 4).map((err, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: '10px',
                    padding: '4px 8px',
                    background: 'rgba(220,60,60,0.06)',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: '#e05555' }}>
                      {err.condition}
                      {err.httpStatus ? (
                        <span style={{ color: CANVAS_COLORS.textMuted, marginLeft: '4px' }}>
                          ({err.httpStatus})
                        </span>
                      ) : (
                        ''
                      )}
                    </span>
                  </span>
                </div>
              ))}
              {errorCount > 4 && (
                <div style={{ fontSize: '9px', color: CANVAS_COLORS.textDim, paddingLeft: '8px' }}>
                  +{errorCount - 4} more
                </div>
              )}
            </div>
          </TooltipSection>
        )}
      </TooltipWrapper>
    </g>
  );
}
