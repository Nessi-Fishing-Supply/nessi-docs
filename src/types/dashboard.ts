export interface FeatureDomain {
  slug: string;
  label: string;
  description: string;
  featureCount: number;
  endpointCount: number;
  journeyCount: number;
  entityCount: number;
  builtCount: number;
  inProgressCount: number;
  stubbedCount: number;
  plannedCount: number;
  buildProgress: number;
}

export interface DashboardMetrics {
  totalFeatures: number;
  totalEndpoints: number;
  totalJourneys: number;
  totalEntities: number;
  totalLifecycles: number;
  builtCount: number;
  inProgressCount: number;
  stubbedCount: number;
  plannedCount: number;
}
