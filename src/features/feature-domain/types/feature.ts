export interface FeatureLink {
  type: 'journey' | 'api-group' | 'entity' | 'lifecycle';
  label: string;
  href: string;
}

export interface Feature {
  slug: string;
  name: string;
  description: string;
  componentCount: number;
  endpointCount: number;
  hookCount?: number;
  serviceCount?: number;
  journeyCoverage?: boolean;
  links?: FeatureLink[];
}
