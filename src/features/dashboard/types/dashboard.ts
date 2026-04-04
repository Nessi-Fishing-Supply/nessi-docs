export interface FeatureDomain {
  slug: string;
  label: string;
  description: string;
  featureCount: number;
  endpointCount: number;
  journeyCount: number;
  entityCount: number;
}

export interface DashboardMetrics {
  totalFeatures: number;
  totalEndpoints: number;
  totalJourneys: number;
  totalEntities: number;
  totalLifecycles: number;
}
