export type ChangeType = 'added' | 'changed' | 'fixed' | 'removed';

export interface ChangelogEntry {
  date: string;
  changes: {
    type: ChangeType;
    description: string;
    area?: string;
  }[];
}

export const CHANGE_TYPE_CONFIG: Record<ChangeType, { label: string; color: string }> = {
  added: { label: 'Added', color: '#3d8c75' },
  changed: { label: 'Changed', color: '#b86e0a' },
  fixed: { label: 'Fixed', color: '#e27739' },
  removed: { label: 'Removed', color: '#b84040' },
};

export const changelog: ChangelogEntry[] = [
  {
    date: '2026-03-25',
    changes: [
      {
        type: 'added',
        description: 'Feature readiness tracker with status indicators and component/endpoint counts.',
        area: 'Feature Readiness',
      },
      {
        type: 'added',
        description: 'Permissions matrix showing role-based access control across all actions.',
        area: 'Permissions',
      },
      {
        type: 'added',
        description: 'Entity relationship diagram (ERD) visualizing table relationships and foreign keys.',
        area: 'ERD',
      },
      {
        type: 'added',
        description: 'Error catalog listing known error cases grouped by feature and layer.',
        area: 'Error Catalog',
      },
      {
        type: 'added',
        description: 'Config reference documenting environment variables, feature flags, and constants.',
        area: 'Config Reference',
      },
      {
        type: 'added',
        description: 'Onboarding tracker showing step completion status across the member onboarding flow.',
        area: 'Onboarding Tracker',
      },
      {
        type: 'added',
        description: 'Changelog page listing all doc updates grouped by release date.',
        area: 'Changelog',
      },
      {
        type: 'changed',
        description: 'Global search enhanced with support for permissions, ERD entities, and error cases.',
        area: 'Search',
      },
      {
        type: 'changed',
        description: 'Sidebar updated with new sections for all added pages.',
        area: 'Sidebar',
      },
    ],
  },
  {
    date: '2026-03-24',
    changes: [
      {
        type: 'added',
        description: 'Canvas journey visualizations rendering flow nodes, branches, and error cases.',
        area: 'Journeys',
      },
      {
        type: 'added',
        description: 'API map listing all endpoints grouped by feature area with method and path.',
        area: 'API Map',
      },
      {
        type: 'added',
        description: 'Data model view with table definitions, column types, and constraints.',
        area: 'Data Model',
      },
      {
        type: 'added',
        description: 'Lifecycle diagrams illustrating state transitions for key entities.',
        area: 'Lifecycles',
      },
      {
        type: 'added',
        description: 'Coverage dashboard showing build and test status across all journeys.',
        area: 'Coverage',
      },
      {
        type: 'added',
        description: 'Global search with keyboard navigation across journeys, APIs, and data model.',
        area: 'Search',
      },
      {
        type: 'added',
        description: 'Cross-linking between related journeys, endpoints, and lifecycle states.',
        area: 'Cross-links',
      },
    ],
  },
];
