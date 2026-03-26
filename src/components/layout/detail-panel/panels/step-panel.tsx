import Link from 'next/link';
import type { JourneyNode, Journey } from '@/types/journey';
import { LAYER_CONFIG, STATUS_CONFIG } from '@/types/journey';
import { getLinksForRoute } from '@/data';

interface StepPanelProps {
  node: JourneyNode;
  journey: Journey;
}

export function StepPanel({ node, journey }: StepPanelProps) {
  const layer = node.layer ? LAYER_CONFIG[node.layer] : null;
  const status = node.status ? STATUS_CONFIG[node.status] : null;
  const crossLinks = node.route ? getLinksForRoute(node.route) : [];

  return (
    <div>
      <h3 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: '16px', color: 'var(--text-primary)', margin: '0 0 8px' }}>
        {node.label}
      </h3>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
        {layer && (
          <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', background: `${layer.color}1a`, color: layer.color }}>
            {layer.label}
          </span>
        )}
        {status && (
          <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', background: `${status.color}1a`, color: status.color }}>
            {status.label}
          </span>
        )}
      </div>

      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
        {journey.title}
      </div>

      {node.why && (
        <>
          <div style={{ fontSize: '9px', color: 'var(--text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginTop: '12px', marginBottom: '4px' }}>
            Why this exists
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.5', padding: '8px 10px', background: 'rgba(61,140,117,0.05)', borderLeft: '2px solid #3d8c75', borderRadius: '4px' }}>
            {node.why}
          </div>
        </>
      )}

      {node.route && (
        <>
          <div style={{ fontSize: '9px', color: 'var(--text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginTop: '12px', marginBottom: '4px' }}>
            API Route
          </div>
          <Link
            href={`/api-map#${node.route?.split(' ')[1]?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`}
            style={{ fontSize: '11px', color: '#e27739', fontFamily: 'var(--font-family-mono)', background: 'var(--bg-input)', padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--border-subtle)', textDecoration: 'none', display: 'block' }}
          >
            {node.route} →
          </Link>
        </>
      )}

      {node.codeRef && (
        <>
          <div style={{ fontSize: '9px', color: 'var(--text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginTop: '12px', marginBottom: '4px' }}>
            Code Reference
          </div>
          <div style={{ fontSize: '10px', color: '#3d8c75', fontFamily: 'var(--font-family-mono)', background: 'var(--bg-input)', padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
            {node.codeRef}
          </div>
        </>
      )}

      {node.notes && (
        <>
          <div style={{ fontSize: '9px', color: 'var(--text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginTop: '12px', marginBottom: '4px' }}>
            Notes
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
            {node.notes}
          </div>
        </>
      )}

      {node.errorCases && node.errorCases.length > 0 && (
        <>
          <div style={{ fontSize: '9px', color: 'var(--text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginTop: '12px', marginBottom: '4px' }}>
            Errors ({node.errorCases.length})
          </div>
          {node.errorCases.map((err, i) => (
            <div key={i} style={{ fontSize: '11px', padding: '6px 8px', background: 'rgba(184,64,64,0.06)', border: '1px solid rgba(184,64,64,0.12)', borderRadius: '4px', marginBottom: '4px' }}>
              <div style={{ color: '#b84040', fontSize: '10px', fontWeight: 500 }}>{err.condition}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
                {err.result}{err.httpStatus ? ` (${err.httpStatus})` : ''}
              </div>
            </div>
          ))}
        </>
      )}

      {crossLinks.length > 0 && (
        <>
          <div style={{ fontSize: '9px', color: 'var(--text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginTop: '16px', marginBottom: '4px' }}>
            See also
          </div>
          {crossLinks.map((link, i) => (
            <Link key={i} href={link.href} style={{ display: 'block', fontSize: '11px', color: '#3d8c75', textDecoration: 'none', padding: '4px 0' }}>
              View API Spec →
            </Link>
          ))}
        </>
      )}
    </div>
  );
}
