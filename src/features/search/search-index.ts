import { getAllJourneys, apiGroups, entities, lifecycles, features, configEnums } from '@/data';

export interface SearchResult {
  type: 'step' | 'journey' | 'endpoint' | 'entity' | 'lifecycle' | 'state' | 'feature' | 'config';
  title: string;
  subtitle: string;
  href: string;
  color: string;
  icon: string;
}

function buildIndex(): SearchResult[] {
  const results: SearchResult[] = [];

  // Journeys + their steps
  for (const j of getAllJourneys()) {
    results.push({
      type: 'journey',
      title: j.title,
      subtitle: `Journey · ${j.nodes.length} nodes`,
      href: `/journeys/${j.slug}`,
      color: '#3d8c75',
      icon: '⬡',
    });

    for (const node of j.nodes) {
      if (node.type !== 'step') continue;
      results.push({
        type: 'step',
        title: node.label,
        subtitle: `${j.title} · ${node.route ?? node.layer ?? ''}`,
        href: `/journeys/${j.slug}`,
        color: '#3d8c75',
        icon: '◆',
      });
    }
  }

  // API endpoints
  for (const group of apiGroups) {
    for (const ep of group.endpoints) {
      results.push({
        type: 'endpoint',
        title: `${ep.method} ${ep.path}`,
        subtitle: ep.description ?? ep.label ?? '',
        href: '/api-map',
        color: ep.method === 'GET' ? '#3d8c75' : ep.method === 'DELETE' ? '#b84040' : '#e27739',
        icon: '▲',
      });
    }
  }

  // Entities
  for (const e of entities) {
    results.push({
      type: 'entity',
      title: e.name,
      subtitle: `${e.badge} · ${e.fields.length} fields`,
      href: '/data-model',
      color: '#3d8c75',
      icon: '▦',
    });
  }

  // Lifecycles + states
  for (const lc of lifecycles) {
    results.push({
      type: 'lifecycle',
      title: lc.name,
      subtitle: `Lifecycle · ${lc.badge}`,
      href: `/lifecycles/${lc.slug}`,
      color: '#78756f',
      icon: '↻',
    });

    for (const state of lc.states) {
      results.push({
        type: 'state',
        title: state.label,
        subtitle: `${lc.name} lifecycle`,
        href: `/lifecycles/${lc.slug}`,
        color: state.color ?? '#78756f',
        icon: '○',
      });
    }
  }

  // Features
  for (const f of features) {
    results.push({
      type: 'feature',
      title: f.name,
      subtitle: `Feature · ${f.status} · ${f.componentCount} components`,
      href: '/features',
      color: '#3d8c75',
      icon: '⬢',
    });
  }

  // Config enums + values
  for (const e of configEnums) {
    results.push({
      type: 'config',
      title: e.name,
      subtitle: `Config · ${e.values.length} values`,
      href: '/config',
      color: '#78756f',
      icon: '⚙',
    });
    for (const v of e.values) {
      results.push({
        type: 'config',
        title: v.label,
        subtitle: `${e.name} · ${v.value}`,
        href: '/config',
        color: '#78756f',
        icon: '·',
      });
    }
  }

  return results;
}

let _index: SearchResult[] | null = null;

export function getSearchIndex(): SearchResult[] {
  if (!_index) _index = buildIndex();
  return _index;
}

export function search(query: string, limit = 20): SearchResult[] {
  if (!query.trim()) return [];
  const index = getSearchIndex();
  const q = query.toLowerCase();
  const tokens = q.split(/\s+/).filter(Boolean);

  const scored: { result: SearchResult; score: number }[] = [];

  for (const result of index) {
    const titleLower = result.title.toLowerCase();
    const subtitleLower = result.subtitle.toLowerCase();
    const combined = titleLower + ' ' + subtitleLower;

    let score = 0;

    // Exact title match
    if (titleLower === q) {
      score += 100;
    }
    // Title starts with query
    else if (titleLower.startsWith(q)) {
      score += 60;
    }
    // Title contains query
    else if (titleLower.includes(q)) {
      score += 40;
    }

    // All tokens present
    const allTokensMatch = tokens.every((t) => combined.includes(t));
    if (allTokensMatch) {
      score += 30;
    }

    // Individual token matches
    for (const t of tokens) {
      if (titleLower.includes(t)) score += 10;
      if (subtitleLower.includes(t)) score += 5;
    }

    if (score > 0) {
      scored.push({ result, score });
    }
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.result);
}
