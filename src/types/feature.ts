export type FeatureStatus = 'built' | 'in-progress' | 'stubbed' | 'planned';

export interface FeatureLink {
  type: 'journey' | 'api-group' | 'entity' | 'lifecycle';
  label: string;
  href: string;
}

export interface Feature {
  slug: string;
  name: string;
  status: FeatureStatus;
  description: string;
  componentCount: number;
  endpointCount: number;
  hookCount?: number;
  serviceCount?: number;
  journeyCoverage?: boolean;
  links?: FeatureLink[];
}

export const STATUS_COLORS: Record<FeatureStatus, string> = {
  built: '#3d8c75',
  'in-progress': '#b86e0a',
  stubbed: '#78756f',
  planned: '#5c5a55',
};
