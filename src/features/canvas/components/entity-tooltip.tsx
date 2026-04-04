'use client';

import Link from 'next/link';
import type { Entity } from '@/features/data-model';
import type { ErdNode } from '@/features/data-model';
import { getEndpointsForTable, getLifecycleForEntity, type EndpointRef } from '@/data';
import { useBranchHref } from '@/hooks/use-branch-href';
import { GitHubLink } from '@/components/data-display/github-link';
import { ERD_NODE_WIDTH } from '../utils/geometry';
import { monoBlock } from '../constants/tooltip-styles';
import { CANVAS_COLORS } from '../constants/canvas-colors';
import { useTooltipHover } from '../hooks/use-tooltip-hover';
import { TooltipWrapper } from './tooltip-wrapper';
import { TooltipSection } from './tooltip-parts';

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
        background: `${colors[method] ?? CANVAS_COLORS.textMuted}1a`,
        color: colors[method] ?? CANVAS_COLORS.textMuted,
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
        e.currentTarget.style.background = CANVAS_COLORS.bgSubtle;
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

export function EntityTooltip({ node, entity, children, suppressTooltip }: EntityTooltipProps) {
  const branchHref = useBranchHref();
  const { visible, show, scheduleClose } = useTooltipHover();

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
      <TooltipWrapper
        nodeX={node.x}
        nodeY={node.y}
        nodeWidth={ERD_NODE_WIDTH}
        tooltipWidth={300}
        visible={!!showTooltip}
        onMouseEnter={show}
        onMouseLeave={scheduleClose}
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
                background: CANVAS_COLORS.bgSubtle,
                color: CANVAS_COLORS.textSecondary,
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
                  background: CANVAS_COLORS.bgSubtle,
                  color: CANVAS_COLORS.textMuted,
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
          <TooltipSection label="Purpose">
            <div
              style={{
                fontSize: '11px',
                color: CANVAS_COLORS.textSecondary,
                lineHeight: '1.5',
                borderLeft: `2px solid ${badgeColor}`,
                paddingLeft: '8px',
              }}
            >
              {entity!.why.length > 200 ? entity!.why.slice(0, 200) + '...' : entity!.why}
            </div>
          </TooltipSection>
        )}

        {/* Primary key */}
        {pkFields.length > 0 && (
          <TooltipSection label="Primary Key">
            <div style={{ ...monoBlock, color: CANVAS_COLORS.textSecondary }}>
              {pkFields.map((f) => f.name).join(', ')}
            </div>
          </TooltipSection>
        )}

        {/* Foreign keys */}
        {fkFields.length > 0 && (
          <TooltipSection label="Foreign Keys">
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
                  <span style={{ color: CANVAS_COLORS.textSecondary }}>{f.name}</span>
                  <span style={{ color: CANVAS_COLORS.textDim }}>→</span>
                  <span style={{ color: badgeColor }}>{f.references!.table}</span>
                </div>
              ))}
              {fkFields.length > 5 && (
                <div
                  style={{
                    fontSize: '9px',
                    color: CANVAS_COLORS.textDim,
                    paddingLeft: '8px',
                  }}
                >
                  +{fkFields.length - 5} more
                </div>
              )}
            </div>
          </TooltipSection>
        )}

        {/* Related API endpoints */}
        {endpoints.length > 0 && (
          <TooltipSection label="API Endpoints">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {endpoints.slice(0, 4).map((ep) => (
                <HoverLink key={ep.anchor} href={branchHref(`/api-map#${ep.anchor}`)}>
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
                <div
                  style={{
                    fontSize: '9px',
                    color: CANVAS_COLORS.textDim,
                    paddingLeft: '8px',
                  }}
                >
                  +{endpoints.length - 4} more endpoints
                </div>
              )}
            </div>
          </TooltipSection>
        )}

        {/* Lifecycle */}
        {(() => {
          const lc = entity ? getLifecycleForEntity(entity.name) : null;
          if (!lc) return null;
          return (
            <TooltipSection label="Lifecycle">
              <HoverLink href={branchHref(`/lifecycles/${lc.slug}`)}>
                <span style={{ color: '#5f7fbf' }}>↻</span>
                <span style={{ flex: 1 }}>{lc.name}</span>
                {linkIcon}
              </HoverLink>
            </TooltipSection>
          );
        })()}

        {/* Source file */}
        {entity!.sourceFile && (
          <TooltipSection label="Source">
            <GitHubLink filePath={entity!.sourceFile} />
          </TooltipSection>
        )}

        {/* Deep-link to Data Model */}
        <div>
          <HoverLink href={branchHref(`/data-model#${entity!.name}`)} color={badgeColor}>
            <span style={{ flex: 1 }}>View in Data Model</span>
            {linkIcon}
          </HoverLink>
        </div>
      </TooltipWrapper>
    </g>
  );
}
