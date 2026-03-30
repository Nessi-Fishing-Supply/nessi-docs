export interface DomainConfig {
  slug: string;
  label: string;
  description: string;
  order: number;
}

export const DOMAINS: DomainConfig[] = [
  {
    slug: 'auth',
    label: 'Authentication',
    description: 'Signup, login, password management, context switching, route protection',
    order: 0,
  },
  {
    slug: 'shopping',
    label: 'Shopping & Social',
    description: 'Browse, search, discovery, follows, messaging, watchlist',
    order: 1,
  },
  {
    slug: 'cart',
    label: 'Cart & Checkout',
    description: 'Guest cart, authenticated cart, checkout flow',
    order: 2,
  },
  {
    slug: 'account',
    label: 'Members',
    description: 'Profiles, settings, addresses, deletion, onboarding',
    order: 3,
  },
  {
    slug: 'shops',
    label: 'Shops',
    description: 'Create, settings, roles, invites, members, ownership',
    order: 4,
  },
  {
    slug: 'listings',
    label: 'Listings',
    description: 'Lifecycle management, social sharing',
    order: 5,
  },
];

export function getDomainConfig(slug: string): DomainConfig | undefined {
  return DOMAINS.find((d) => d.slug === slug);
}
