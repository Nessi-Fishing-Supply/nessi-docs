import type { Role } from '@/types/permission';

export const roles: Role[] = [
  {
    slug: 'owner',
    name: 'Owner',
    description: 'Full control over all shop features. Can transfer ownership. One owner per shop.',
    color: '#e27739',
    permissions: { listings: 'full', pricing: 'full', orders: 'full', messaging: 'full', shop_settings: 'full', members: 'full' },
  },
  {
    slug: 'manager',
    name: 'Manager',
    description: 'Operational access to listings, pricing, orders, and messaging. Can view but not change shop settings. Cannot manage members.',
    color: '#b86e0a',
    permissions: { listings: 'full', pricing: 'full', orders: 'full', messaging: 'full', shop_settings: 'view', members: 'none' },
  },
  {
    slug: 'contributor',
    name: 'Contributor',
    description: 'Can create and edit listings only. No access to pricing, orders, messaging, settings, or member management.',
    color: '#78756f',
    permissions: { listings: 'full', pricing: 'none', orders: 'none', messaging: 'none', shop_settings: 'none', members: 'none' },
  },
];
