import { loadBranch } from '@/data/branch-loader';
import { DOMAINS, getDomainConfig } from '@/constants/domains';
import type { Journey } from '../types/journey';
import type { DomainConfig } from '@/constants/domains';
import type { DomainWithStats } from '@/data';

export interface DomainPageData {
  config: DomainConfig;
  journeys: Journey[];
  stats: { stepCount: number };
  siblingDomains: { slug: string; label: string }[];
}

export interface JourneyPageData {
  journey: Journey;
  siblings: { slug: string; title: string; description: string }[];
}

export function getJourneyDomains(branch: string): DomainWithStats[] {
  const data = loadBranch(branch);
  if (!data) return [];

  return DOMAINS.map((d) => {
    const dJourneys = data.journeys.filter((j) => j.domain === d.slug);
    const allNodes = dJourneys.flatMap((j) => j.nodes);
    return {
      ...d,
      journeyCount: dJourneys.length,
      stepCount: allNodes.filter((n) => n.type === 'step').length,
      decisionCount: allNodes.filter((n) => n.type === 'decision').length,
    };
  }).filter((d) => d.journeyCount > 0);
}

export function getDomainJourneys(branch: string, domain: string): DomainPageData | null {
  const data = loadBranch(branch);
  if (!data) return null;

  const config = getDomainConfig(domain);
  if (!config) return null;

  const journeys = data.journeys.filter((j) => j.domain === domain);
  const allSteps = journeys.flatMap((j) => j.nodes.filter((n) => n.type === 'step'));

  const siblingDomains = DOMAINS.filter((d) => data.journeys.some((j) => j.domain === d.slug)).map(
    (d) => ({ slug: d.slug, label: d.label }),
  );

  return {
    config,
    journeys,
    stats: { stepCount: allSteps.length },
    siblingDomains,
  };
}

export function getJourney(branch: string, domain: string, slug: string): JourneyPageData | null {
  const data = loadBranch(branch);
  if (!data) return null;

  const journey = data.journeys.find((j) => j.domain === domain && j.slug === slug);
  if (!journey) return null;

  const siblings = data.journeys
    .filter((j) => j.domain === domain)
    .map((j) => ({
      slug: j.slug,
      title: j.title,
      description: j.description,
    }));

  return { journey, siblings };
}
