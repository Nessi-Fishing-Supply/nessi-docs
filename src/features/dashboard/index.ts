// Services
export {
  getDashboardData,
  getDashboardMetricsForBranch,
  getFeatureDomainsForBranch,
} from './services/dashboard';
export type { DashboardData } from './services/dashboard';

// Hooks
export { useDashboardData, useDashboardMetrics, useFeatureDomains } from './hooks/use-dashboard';

// Components
export { DashboardView } from './components/dashboard-view';
