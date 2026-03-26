'use client';

import { useState } from 'react';
import { LAYER_CONFIG, type JourneyNode } from '@/types/journey';
import { NODE_WIDTH, NODE_HEIGHT, hexToRgba } from '../utils/geometry';

// Max chars for label and sublabel
const LABEL_MAX = 20;
const SUBLABEL_MAX = 22;

const METHOD_VERBS: Record<string, string> = {
  GET: 'Fetch',
  POST: 'Create',
  PUT: 'Replace',
  PATCH: 'Update',
  DELETE: 'Delete',
};

const HTTP_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);

/** Split camelCase or PascalCase into words: "AddressFormModal" → "Address Form Modal" */
function splitCamelCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
}

/** Extract HTTP method from a route string: "GET /api/addresses" → "GET" */
function extractMethod(route: string): string | null {
  const m = route.match(/^(GET|POST|PUT|PATCH|DELETE)\s/);
  return m ? m[1] : null;
}

/** Extract a friendly noun from a route path: "/api/addresses/[id]/default" → "Address" */
function nounFromPath(path: string): string {
  const segments = path.split('/').filter((s) => s && !s.startsWith('[') && s !== 'api');
  // Take the first meaningful segment (most descriptive)
  const noun = segments[0] ?? 'resource';
  // Singularize simple plural: "addresses" → "address", "items" → "item"
  const singular = noun.endsWith('es') && noun.length > 4
    ? noun.slice(0, -2)
    : noun.endsWith('s') && noun.length > 3
      ? noun.slice(0, -1)
      : noun;
  return singular.charAt(0).toUpperCase() + singular.slice(1).replace(/-/g, ' ');
}

/** Clean up a label for display — handles all the messy patterns */
function cleanLabel(label: string | undefined, route?: string): string {
  if (!label) return route ? cleanLabel(route, undefined) : 'Untitled Step';
  let text = label;

  // 1. If label exactly matches route, generate friendly name
  if (route && text.trim() === route.trim()) {
    const method = extractMethod(route);
    if (method) {
      const path = route.slice(method.length + 1);
      const verb = METHOD_VERBS[method] ?? method;
      return `${verb} ${nounFromPath(path)}`;
    }
  }

  // 2. Strip "Action → METHOD /api/..." patterns (keep the action part)
  const arrowMethodMatch = text.match(/^(.+?)\s*→\s*(GET|POST|PUT|PATCH|DELETE)\s/);
  if (arrowMethodMatch) {
    text = arrowMethodMatch[1].trim();
  }

  // 3. Strip "Action — METHOD /api/..." patterns
  const dashMethodMatch = text.match(/^(.+?)\s*—\s*(GET|POST|PUT|PATCH|DELETE)\s/);
  if (dashMethodMatch) {
    text = dashMethodMatch[1].trim();
  }

  // 4. Strip trailing "→ Something" technical details
  if (text.includes(' → ')) {
    const parts = text.split(' → ');
    // Keep first part if it's meaningful, otherwise keep the descriptive part
    text = parts[0].trim();
  }

  // 5. Strip "— technical detail" suffixes
  if (text.includes(' — ')) {
    text = text.split(' — ')[0].trim();
  }

  // 6. Strip function calls: "auth.admin.deleteUser()" → "Delete User"
  if (text.includes('()')) {
    // Extract function name, split camelCase
    const funcMatch = text.match(/(?:.*\.)?(\w+)\(\)/);
    if (funcMatch) {
      text = splitCamelCase(funcMatch[1]);
    }
  }

  // 7. If text starts with camelCase/PascalCase (no spaces in first word, has mixed case)
  if (!text.includes(' ') && /[a-z][A-Z]/.test(text)) {
    text = splitCamelCase(text);
  }

  // 8. Strip leading "CASCADE: " or similar prefixes
  if (text.startsWith('CASCADE:')) {
    text = text.slice(8).trim();
  }

  // 9. Colon content — take before colon if it's short enough, or if after is very long
  if (text.includes(': ') && text.indexOf(': ') < 30) {
    const before = text.split(': ')[0];
    if (before.length <= LABEL_MAX) {
      text = before;
    }
  }

  // 10. Strip duplicate HTTP method words if they snuck through
  for (const m of HTTP_METHODS) {
    if (text.endsWith(` ${m}`) || text.endsWith(` ${m}...`)) {
      text = text.replace(new RegExp(`\\s+${m}\\.{0,3}$`), '');
    }
  }

  // 11. Strip parenthetical details: "(pre-populated)" "(200ms debounce)"
  text = text.replace(/\s*\([^)]*\)\s*/g, ' ').trim();

  return text;
}

/** Truncate at a word boundary when possible */
function smartTruncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const truncated = text.slice(0, max);
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > max * 0.5) {
    return truncated.slice(0, lastSpace) + '...';
  }
  return truncated + '...';
}

interface StepNodeProps {
  node: JourneyNode;
  isSelected?: boolean;
  isDimmed?: boolean;
  onClick?: () => void;
}

export function StepNode({ node, isSelected, isDimmed, onClick }: StepNodeProps) {
  const [hovered, setHovered] = useState(false);
  const layer = node.layer ?? 'client';
  const layerCfg = LAYER_CONFIG[layer];
  const opacity = isDimmed ? 0.15 : 1;
  const errorCount = node.errorCases?.length ?? 0;
  const showGlow = hovered && !isSelected;

  const displayLabel = cleanLabel(node.label, node.route);

  // Extract HTTP method for pill display
  const httpMethod = node.route ? extractMethod(node.route) : null;

  // Sublabel: show route for nodes with routes (minus method prefix), nothing for client
  let sublabel = '';
  if (node.route) {
    // Show just the path portion: "GET /api/addresses" → "/api/addresses"
    const path = node.route.replace(/^(GET|POST|PUT|PATCH|DELETE)\s+/, '');
    sublabel = path;
  } else if (layer !== 'client') {
    sublabel = layerCfg.label;
  }

  // Method pill dimensions
  const methodPillW = httpMethod ? httpMethod.length * 5.5 + 8 : 0;

  return (
    <g
      transform={`translate(${node.x},${node.y})`}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: 'pointer', opacity, transition: 'opacity 400ms ease-out' }}
    >
      {/* Hover glow */}
      {showGlow && (
        <>
          <defs>
            <radialGradient id={`hover-${node.id}`}>
              <stop offset="0%" stopColor={layerCfg.color} stopOpacity={0.08} />
              <stop offset="100%" stopColor={layerCfg.color} stopOpacity={0} />
            </radialGradient>
          </defs>
          <circle cx={NODE_WIDTH / 2} cy={NODE_HEIGHT / 2} r={NODE_WIDTH * 0.55} fill={`url(#hover-${node.id})`} />
        </>
      )}
      {/* Selection glow */}
      {isSelected && (
        <>
          <defs>
            <radialGradient id={`glow-${node.id}`}>
              <stop offset="0%" stopColor={layerCfg.color} stopOpacity={0.15} />
              <stop offset="100%" stopColor={layerCfg.color} stopOpacity={0} />
            </radialGradient>
          </defs>
          <circle cx={NODE_WIDTH / 2} cy={NODE_HEIGHT / 2} r={NODE_WIDTH * 0.6} fill={`url(#glow-${node.id})`} style={{ animation: 'glow-pulse 3s ease-in-out infinite' }} />
        </>
      )}
      {/* Background */}
      <rect
        width={NODE_WIDTH}
        height={NODE_HEIGHT}
        rx={6}
        fill={hexToRgba(layerCfg.color, 0.08)}
        stroke={isSelected ? layerCfg.color : hovered ? hexToRgba(layerCfg.color, 0.4) : hexToRgba(layerCfg.color, 0.2)}
        strokeWidth={isSelected ? 1.5 : 1}
      />
      {/* Left accent */}
      <rect x={0} y={6} width={2.5} height={NODE_HEIGHT - 12} rx={1} fill={layerCfg.color} />

      {/* Top-right: method pill OR layer dot */}
      {httpMethod ? (
        <g transform={`translate(${NODE_WIDTH - methodPillW - 6}, 5)`}>
          <rect
            width={methodPillW}
            height={14}
            rx={3}
            fill={hexToRgba(layerCfg.color, 0.2)}
          />
          <text
            x={methodPillW / 2}
            y={10}
            fill={layerCfg.color}
            fontSize={8}
            fontWeight={700}
            textAnchor="middle"
            fontFamily="var(--font-family-mono)"
          >
            {httpMethod}
          </text>
        </g>
      ) : (
        <circle cx={NODE_WIDTH - 10} cy={10} r={3} fill={layerCfg.color} opacity={0.6} />
      )}

      {/* Label */}
      <text x={12} y={sublabel ? 18 : NODE_HEIGHT / 2 + 1} fill="#e8e6e1" fontSize={11} fontWeight={500} dominantBaseline={sublabel ? undefined : 'central'}>
        {smartTruncate(displayLabel, LABEL_MAX)}
      </text>
      {/* Sublabel */}
      {sublabel && (
        <text x={12} y={32} fill="#6a6860" fontSize={9} fontFamily="var(--font-family-mono)">
          {smartTruncate(sublabel, SUBLABEL_MAX)}
        </text>
      )}
      {/* Error badge — high contrast, pinned to bottom-right with equal padding */}
      {errorCount > 0 && (
        <g transform={`translate(${NODE_WIDTH - 24}, ${NODE_HEIGHT - 18})`}>
          <rect
            width={18}
            height={12}
            rx={6}
            fill="rgba(220,60,60,0.25)"
            stroke="rgba(220,60,60,0.4)"
            strokeWidth={0.5}
          />
          <text x={9} y={9} fill="#e05555" fontSize={8} fontWeight={600} textAnchor="middle">
            {errorCount}
          </text>
        </g>
      )}
    </g>
  );
}
