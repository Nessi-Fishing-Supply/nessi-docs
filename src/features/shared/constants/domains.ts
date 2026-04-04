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
    description: 'Browse, search, discovery, follows, watchlist',
    order: 1,
  },
  {
    slug: 'messaging',
    label: 'Messaging',
    description: 'Buyer-seller threads, direct messages, offer negotiations, shop inbox',
    order: 2,
  },
  {
    slug: 'cart',
    label: 'Cart & Checkout',
    description: 'Guest cart, authenticated cart, checkout flow',
    order: 3,
  },
  {
    slug: 'account',
    label: 'Members',
    description: 'Profiles, settings, addresses, deletion, onboarding',
    order: 4,
  },
  {
    slug: 'shops',
    label: 'Shops',
    description: 'Create, settings, roles, invites, members, ownership',
    order: 5,
  },
  {
    slug: 'listings',
    label: 'Listings',
    description: 'Lifecycle management, social sharing',
    order: 6,
  },
];

export function getDomainConfig(slug: string): DomainConfig | undefined {
  return DOMAINS.find((d) => d.slug === slug);
}
