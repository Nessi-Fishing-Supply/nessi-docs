import Link from 'next/link';
import type { ApiEndpoint } from '@/types/api-contract';
import { getLinksForEndpoint } from '@/data/cross-links';

const METHOD_COLORS: Record<string, string> = {
  GET: '#3d8c75',
  POST: '#e27739',
  PUT: '#b86e0a',
  PATCH: '#e89048',
  DELETE: '#b84040',
};

interface ApiPanelProps {
  endpoint: ApiEndpoint;
  group: string;
}

export function ApiPanel({ endpoint, group }: ApiPanelProps) {
  const crossLinks = getLinksForEndpoint(endpoint.method, endpoint.path);
  const methodColor = METHOD_COLORS[endpoint.method] ?? '#78756f';

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: `${methodColor}22`, color: methodColor }}>
          {endpoint.method}
        </span>
        <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{group}</span>
      </div>

      <div style={{ fontSize: '12px', color: '#e27739', fontFamily: 'var(--font-family-mono)', background: 'var(--bg-input)', padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--border-subtle)', marginBottom: '12px', wordBreak: 'break-all' as const }}>
        {endpoint.path}
      </div>

      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '12px' }}>
        {endpoint.description}
      </div>

      {endpoint.why && (
        <>
          <div style={{ fontSize: '9px', color: 'var(--text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: '4px' }}>
            Why this exists
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.5', padding: '8px 10px', background: 'rgba(61,140,117,0.05)', borderLeft: '2px solid #3d8c75', borderRadius: '4px' }}>
            {endpoint.why}
          </div>
        </>
      )}

      {crossLinks.length > 0 && (
        <>
          <div style={{ fontSize: '9px', color: 'var(--text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginTop: '16px', marginBottom: '4px' }}>
            Used in Journeys
          </div>
          {crossLinks.map((link, i) => (
            <Link key={i} href={link.href} style={{ display: 'block', fontSize: '11px', color: '#3d8c75', textDecoration: 'none', padding: '4px 0' }}>
              {link.label} →
            </Link>
          ))}
        </>
      )}
    </div>
  );
}
