import Link from 'next/link';
import { Badge } from '@/components/indicators';
import { SectionLabel } from '@/components/layout';
import { KeyValueRow } from '@/components/data-display';
import type { DiffItemSelection } from '@/types/docs-context';
import type { DiffStatus } from '@/types/diff';
import type { ApiEndpoint } from '@/types/api-contract';
import type { Entity } from '@/types/data-model';
import type { Journey } from '@/types/journey';
import type { Lifecycle } from '@/types/lifecycle';
import type { ArchDiagram } from '@/types/architecture';
import type { Feature } from '@/types/feature';
import type { ConfigEnum } from '@/types/config-ref';
import styles from './panel-content.module.scss';
import diffStyles from './diff-panel.module.scss';

interface DiffPanelProps {
  item: DiffItemSelection;
}

function statusMessage(status: DiffStatus, domain: string): string {
  switch (status) {
    case 'added':
      return `New ${domain.toLowerCase()} item in staging.`;
    case 'removed':
      return `This ${domain.toLowerCase()} item is removed in staging.`;
    case 'modified':
      return `This ${domain.toLowerCase()} item has been modified in staging.`;
    default:
      return '';
  }
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'string') return value || '(empty)';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return `[${value.length} items]`;
  if (typeof value === 'object') return JSON.stringify(value, null, 0).slice(0, 80);
  return String(value);
}

/** For array items, try to extract a display label. */
function itemLabel(item: unknown): string {
  if (typeof item === 'string') return item;
  if (typeof item === 'number') return String(item);
  if (item && typeof item === 'object') {
    const obj = item as Record<string, unknown>;
    return (
      (obj.label as string) ??
      (obj.name as string) ??
      (obj.id as string) ??
      (obj.slug as string) ??
      (obj.value as string) ??
      JSON.stringify(obj).slice(0, 50)
    );
  }
  return String(item);
}

/** Compute added/removed/modified items between two arrays using a stable key. */
function arrayDelta(
  base: unknown[],
  head: unknown[],
): { added: string[]; removed: string[]; modified: string[] } {
  const baseMap = new Map<string, string>();
  for (const item of base) {
    const key = itemLabel(item);
    baseMap.set(key, JSON.stringify(item));
  }
  const headMap = new Map<string, string>();
  for (const item of head) {
    const key = itemLabel(item);
    headMap.set(key, JSON.stringify(item));
  }
  const added: string[] = [];
  const modified: string[] = [];
  const removed: string[] = [];
  for (const [key, json] of headMap) {
    const baseJson = baseMap.get(key);
    if (!baseJson) added.push(key);
    else if (baseJson !== json) modified.push(key);
  }
  for (const key of baseMap.keys()) {
    if (!headMap.has(key)) removed.push(key);
  }
  return { added, removed, modified };
}

const MAX_INLINE_ITEMS = 3;

function FieldChangeDetail({
  field,
  baseValue,
  headValue,
}: {
  field: string;
  baseValue: unknown;
  headValue: unknown;
}) {
  const isArrayDiff = Array.isArray(baseValue) && Array.isArray(headValue);

  if (isArrayDiff) {
    const { added, removed, modified } = arrayDelta(baseValue, headValue);
    const totalDelta = added.length + removed.length + modified.length;

    if (totalDelta === 0 && baseValue.length === headValue.length) {
      return (
        <div className={diffStyles.changeRow}>
          <span className={diffStyles.fieldName}>{field}</span>
          <div className={diffStyles.values}>
            <span className={diffStyles.oldValue}>{baseValue.length} items</span>
            <span className={diffStyles.arrow}>→</span>
            <span className={diffStyles.newValue}>{headValue.length} items</span>
          </div>
        </div>
      );
    }

    return (
      <div className={diffStyles.changeRow}>
        <span className={diffStyles.fieldName}>
          {field}{' '}
          <span className={diffStyles.fieldMeta}>
            ({baseValue.length} → {headValue.length})
          </span>
        </span>
        {removed.length > 0 && (
          <div className={diffStyles.arrayDelta}>
            {removed.slice(0, MAX_INLINE_ITEMS).map((label) => (
              <span key={label} className={diffStyles.deltaRemoved}>
                − {label}
              </span>
            ))}
            {removed.length > MAX_INLINE_ITEMS && (
              <span className={diffStyles.deltaMore}>
                +{removed.length - MAX_INLINE_ITEMS} more removed
              </span>
            )}
          </div>
        )}
        {modified.length > 0 && (
          <div className={diffStyles.arrayDelta}>
            {modified.slice(0, MAX_INLINE_ITEMS).map((label) => (
              <span key={label} className={diffStyles.deltaModified}>
                ∆ {label}
              </span>
            ))}
            {modified.length > MAX_INLINE_ITEMS && (
              <span className={diffStyles.deltaMore}>
                +{modified.length - MAX_INLINE_ITEMS} more modified
              </span>
            )}
          </div>
        )}
        {added.length > 0 && (
          <div className={diffStyles.arrayDelta}>
            {added.slice(0, MAX_INLINE_ITEMS).map((label) => (
              <span key={label} className={diffStyles.deltaAdded}>
                + {label}
              </span>
            ))}
            {added.length > MAX_INLINE_ITEMS && (
              <span className={diffStyles.deltaMore}>
                +{added.length - MAX_INLINE_ITEMS} more added
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={diffStyles.changeRow}>
      <span className={diffStyles.fieldName}>{field}</span>
      <div className={diffStyles.values}>
        <span className={diffStyles.oldValue}>{formatValue(baseValue)}</span>
        <span className={diffStyles.arrow}>→</span>
        <span className={diffStyles.newValue}>{formatValue(headValue)}</span>
      </div>
    </div>
  );
}

function ApiDetail({ ep }: { ep: ApiEndpoint }) {
  return (
    <>
      {ep.description && (
        <>
          <SectionLabel>Description</SectionLabel>
          <p className={styles.description}>{ep.description}</p>
        </>
      )}
      {ep.why && (
        <>
          <SectionLabel>Why</SectionLabel>
          <p className={styles.descriptionMuted}>{ep.why}</p>
        </>
      )}
      <div className={styles.badgeRow}>
        <Badge variant="subtle">{ep.method}</Badge>
        {ep.auth && <Badge variant="subtle">{ep.auth}</Badge>}
        {ep.access?.map((a) => (
          <Badge key={a} variant="subtle">
            {a}
          </Badge>
        ))}
      </div>
      {ep.requestFields && ep.requestFields.length > 0 && (
        <>
          <SectionLabel>Request Fields ({ep.requestFields.length})</SectionLabel>
          <div className={styles.fieldTable}>
            {ep.requestFields.map((f) => (
              <KeyValueRow
                key={f.name}
                bordered
                label={<span className={styles.fieldName}>{f.name}</span>}
                value={
                  <span style={{ display: 'flex', gap: '6px' }}>
                    <span className={styles.fieldType}>{f.type}</span>
                    {f.required && <span style={{ color: 'var(--diff-removed)' }}>required</span>}
                  </span>
                }
              />
            ))}
          </div>
        </>
      )}
      {ep.errorCodes && ep.errorCodes.length > 0 && (
        <>
          <SectionLabel>Error Codes</SectionLabel>
          <div className={styles.badgeRow}>
            {ep.errorCodes.map((code) => (
              <Badge key={code} variant="subtle">
                {code}
              </Badge>
            ))}
          </div>
        </>
      )}
      {ep.sourceFile && <span className={styles.sourceCode}>{ep.sourceFile}</span>}
    </>
  );
}

function EntityDetail({ entity }: { entity: Entity }) {
  return (
    <>
      <div className={styles.badgeRow}>
        <Badge variant="subtle">{entity.badge}</Badge>
      </div>
      {entity.why && (
        <>
          <SectionLabel>Purpose</SectionLabel>
          <p className={styles.descriptionMuted}>{entity.why}</p>
        </>
      )}
      <div className={styles.statRow}>
        <span>{entity.fields.length} fields</span>
        {entity.rlsPolicies && <span>{entity.rlsPolicies.length} RLS</span>}
        {entity.triggers && <span>{entity.triggers.length} triggers</span>}
        {entity.indexes && <span>{entity.indexes.length} indexes</span>}
      </div>
      {entity.fields.length > 0 && (
        <>
          <SectionLabel>Fields ({entity.fields.length})</SectionLabel>
          <div className={styles.fieldTable}>
            {entity.fields.slice(0, 10).map((f) => (
              <KeyValueRow
                key={f.name}
                bordered
                label={<span className={styles.fieldName}>{f.name}</span>}
                value={<span className={styles.fieldType}>{f.type}</span>}
              />
            ))}
            {entity.fields.length > 10 && (
              <p className={styles.descriptionMuted}>+{entity.fields.length - 10} more fields</p>
            )}
          </div>
        </>
      )}
    </>
  );
}

function JourneyDetail({ journey }: { journey: Journey }) {
  return (
    <>
      {journey.description && (
        <>
          <SectionLabel>Description</SectionLabel>
          <p className={styles.description}>{journey.description}</p>
        </>
      )}
      <div className={styles.statRow}>
        <span>{journey.nodes?.length ?? 0} nodes</span>
        <span>{journey.edges?.length ?? 0} edges</span>
      </div>
      {journey.domain && (
        <div className={styles.badgeRow}>
          <Badge variant="subtle">{journey.domain}</Badge>
        </div>
      )}
    </>
  );
}

function LifecycleDetail({ lifecycle }: { lifecycle: Lifecycle }) {
  return (
    <>
      {lifecycle.description && (
        <>
          <SectionLabel>Description</SectionLabel>
          <p className={styles.description}>{lifecycle.description}</p>
        </>
      )}
      <div className={styles.statRow}>
        <span>{lifecycle.states.length} states</span>
        <span>{lifecycle.transitions.length} transitions</span>
      </div>
      {lifecycle.source && (
        <div className={styles.badgeRow}>
          <Badge variant="subtle">{lifecycle.source}</Badge>
        </div>
      )}
    </>
  );
}

function ArchDetail({ diagram }: { diagram: ArchDiagram }) {
  return (
    <>
      {diagram.description && (
        <>
          <SectionLabel>Description</SectionLabel>
          <p className={styles.description}>{diagram.description}</p>
        </>
      )}
      <div className={styles.badgeRow}>
        <Badge variant="subtle">{diagram.category}</Badge>
      </div>
      <div className={styles.statRow}>
        <span>{diagram.layers.length} layers</span>
        <span>{diagram.layers.reduce((sum, l) => sum + l.nodes.length, 0)} nodes</span>
        <span>{diagram.connections.length} connections</span>
      </div>
    </>
  );
}

function FeatureDetail({ feature }: { feature: Feature }) {
  return (
    <>
      {feature.description && (
        <>
          <SectionLabel>Description</SectionLabel>
          <p className={styles.description}>{feature.description}</p>
        </>
      )}
      <div className={styles.statRow}>
        <span>{feature.componentCount} components</span>
        <span>{feature.endpointCount} endpoints</span>
        {feature.hookCount != null && <span>{feature.hookCount} hooks</span>}
        {feature.serviceCount != null && <span>{feature.serviceCount} services</span>}
      </div>
    </>
  );
}

function ConfigDetail({ config }: { config: ConfigEnum }) {
  return (
    <>
      {config.description && (
        <>
          <SectionLabel>Description</SectionLabel>
          <p className={styles.description}>{config.description}</p>
        </>
      )}
      <div className={styles.badgeRow}>
        <Badge variant="subtle">{config.source}</Badge>
      </div>
      {config.values.length > 0 && (
        <>
          <SectionLabel>Values ({config.values.length})</SectionLabel>
          <div className={styles.fieldTable}>
            {config.values.map((v) => (
              <KeyValueRow
                key={v.value}
                bordered
                label={<span className={styles.fieldName}>{v.value}</span>}
                value={<span className={styles.fieldDesc}>{v.label}</span>}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}

const DOMAIN_DETAIL: Record<string, (data: unknown) => React.ReactNode> = {
  'API Map': (d) => <ApiDetail ep={d as ApiEndpoint} />,
  'Data Model': (d) => <EntityDetail entity={d as Entity} />,
  Journeys: (d) => <JourneyDetail journey={d as Journey} />,
  Lifecycles: (d) => <LifecycleDetail lifecycle={d as Lifecycle} />,
  Architecture: (d) => <ArchDetail diagram={d as ArchDiagram} />,
  Features: (d) => <FeatureDetail feature={d as Feature} />,
  Config: (d) => <ConfigDetail config={d as ConfigEnum} />,
};

export function DiffPanel({ item }: DiffPanelProps) {
  const domainRenderer = item.data ? DOMAIN_DETAIL[item.domain] : undefined;
  const domainDetail = domainRenderer && item.data ? domainRenderer(item.data) : null;

  return (
    <div>
      <div className={diffStyles.header}>
        <Badge variant="diff" status={item.status as Exclude<DiffStatus, 'unchanged'>} />
        <span className={diffStyles.domain}>{item.domain}</span>
      </div>
      <h3 className={styles.panelTitleMono}>{item.label}</h3>
      <p className={styles.descriptionMuted}>{statusMessage(item.status, item.domain)}</p>

      {item.changedFields && item.changedFields.length > 0 && (
        <>
          <SectionLabel>
            Changes ({item.changedFields.length}{' '}
            {item.changedFields.length === 1 ? 'field' : 'fields'})
          </SectionLabel>
          <div className={diffStyles.changeList}>
            {item.changedFields.map((change) => (
              <FieldChangeDetail
                key={change.field}
                field={change.field}
                baseValue={change.baseValue}
                headValue={change.headValue}
              />
            ))}
          </div>
        </>
      )}

      {domainDetail}

      {item.href && (
        <>
          <SectionLabel>Navigate</SectionLabel>
          <Link href={item.href} className={diffStyles.viewLink}>
            View in {item.domain} →
          </Link>
        </>
      )}
    </div>
  );
}
