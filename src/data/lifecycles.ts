import type { Lifecycle } from '@/types/lifecycle';

export const lifecycles: Lifecycle[] = [
  {
    slug: 'listing',
    name: 'Listing',
    badge: '6 states',
    description: 'Listings follow a strict state machine. VALID_TRANSITIONS in the API enforce: draft→active/deleted, active→archived/sold, archived→active. Status changes trigger handle_listing_status_change() which removes cart items when leaving active. "Reserved" exists as a DB enum for future checkout hold but has no API transition today.',
    why: 'The status machine enforces business rules: only active listings appear in search, sold listings are preserved for order history, and deleted listings trigger cart item cleanup via database trigger.',
    states: [
      { id: 'draft', label: 'Draft', color: '#5c5a55', x: 60, y: 120 },
      { id: 'active', label: 'Active', color: '#3d8c75', x: 360, y: 120 },
      { id: 'sold', label: 'Sold', color: '#1e4a40', x: 660, y: 60 },
      { id: 'archived', label: 'Archived', color: '#78756f', x: 660, y: 190 },
      { id: 'deleted', label: 'Deleted', color: '#b84040', x: 180, y: 280 },
      { id: 'reserved', label: 'Reserved (future)', color: '#b86e0a', x: 510, y: 280 },
    ],
    transitions: [
      { from: 'draft', to: 'active', label: 'publish', side: 'r-l' },
      { from: 'draft', to: 'deleted', label: 'delete', side: 'b-t' },
      { from: 'active', to: 'sold', label: 'mark sold', fx: 530, fy: 120, tx: 660, ty: 79 },
      { from: 'active', to: 'archived', label: 'archive', fx: 530, fy: 145, tx: 660, ty: 209 },
      { from: 'archived', to: 'active', label: 'relist', fx: 660, fy: 225, tx: 530, ty: 155 },
    ],
  },
  {
    slug: 'shop-invite',
    name: 'Shop Invite',
    badge: '4 states',
    description: 'Invites are token-based with 7-day expiry. Owners can resend or revoke pending invites.',
    why: 'The invite lifecycle prevents stale invites from accumulating, allows owners to revoke mistaken invites, and ensures the unique pending constraint (one pending per shop+email) stays clean.',
    states: [
      { id: 'pending', label: 'Pending', color: '#b86e0a', x: 60, y: 120 },
      { id: 'accepted', label: 'Accepted', color: '#3d8c75', x: 500, y: 120 },
      { id: 'expired', label: 'Expired', color: '#5c5a55', x: 180, y: 280 },
      { id: 'revoked', label: 'Revoked', color: '#b84040', x: 500, y: 280 },
    ],
    transitions: [
      { from: 'pending', to: 'accepted', label: 'accept', side: 'r-l' },
      { from: 'pending', to: 'expired', label: '7 days pass', side: 'b-t' },
      { from: 'pending', to: 'revoked', label: 'owner revokes', fx: 200, fy: 168, tx: 500, ty: 280 },
    ],
  },
  {
    slug: 'cart-item',
    name: 'Cart Item',
    badge: '4 phases',
    description: 'Items start in localStorage for guests, merge to DB on login, and expire after 30 days or when the listing status changes.',
    why: 'The dual-storage model (localStorage → DB) lets guests shop without accounts while ensuring cart data persists after login. Server-side expiry and status triggers prevent stale and invalid items.',
    states: [
      { id: 'guest', label: 'Guest (localStorage)', color: '#78756f', x: 60, y: 120 },
      { id: 'db', label: 'DB Cart', color: '#3d8c75', x: 400, y: 120 },
      { id: 'purchased', label: 'Purchased', color: '#1e4a40', x: 250, y: 280 },
      { id: 'expired', label: 'Expired', color: '#5c5a55', x: 580, y: 280 },
    ],
    transitions: [
      { from: 'guest', to: 'db', label: 'login + merge', side: 'r-l' },
      { from: 'db', to: 'purchased', label: 'checkout (future)', side: 'b-t' },
      { from: 'db', to: 'expired', label: '30 days / listing sold', side: 'b-t' },
    ],
  },
  {
    slug: 'member',
    name: 'Member',
    badge: '5 phases',
    description: 'Members evolve from unverified registrants to buyers, sellers, and shop participants through progressive capability unlocking.',
    why: 'Progressive capability unlocking means users start simple and add features (seller mode, shops) as needed. This reduces onboarding friction and keeps the platform approachable.',
    states: [
      { id: 'registered', label: 'Registered', color: '#5c5a55', x: 60, y: 120 },
      { id: 'onboarding', label: 'Onboarding', color: '#b86e0a', x: 340, y: 120 },
      { id: 'buyer', label: 'Buyer', color: '#1e4a40', x: 620, y: 120 },
      { id: 'seller', label: 'Buyer + Seller', color: '#e27739', x: 380, y: 280 },
      { id: 'shop', label: 'Shop Member', color: '#b84040', x: 700, y: 280 },
    ],
    transitions: [
      { from: 'registered', to: 'onboarding', label: 'email verified', side: 'r-l' },
      { from: 'onboarding', to: 'buyer', label: 'complete basics', side: 'r-l' },
      { from: 'buyer', to: 'seller', label: 'toggle seller', side: 'b-t' },
      { from: 'seller', to: 'shop', label: 'create / join shop', side: 'r-l' },
      { from: 'buyer', to: 'shop', label: 'accept invite', fx: 740, fy: 168, tx: 785, ty: 280 },
    ],
  },
  {
    slug: 'ownership-transfer',
    name: 'Ownership Transfer',
    badge: '3 states',
    description: 'Token-based shop ownership transfer with pending state and expiry. One pending transfer per shop.',
    why: 'Ownership transfers are high-stakes operations. The token-based flow with explicit acceptance ensures the recipient intentionally agrees, and the one-pending constraint prevents conflicting transfers.',
    states: [
      { id: 'pending', label: 'Pending', color: '#b86e0a', x: 60, y: 120 },
      { id: 'accepted', label: 'Accepted', color: '#3d8c75', x: 500, y: 120 },
      { id: 'cancelled', label: 'Cancelled', color: '#b84040', x: 280, y: 270 },
    ],
    transitions: [
      { from: 'pending', to: 'accepted', label: 'recipient accepts', side: 'r-l' },
      { from: 'pending', to: 'cancelled', label: 'initiator cancels', side: 'b-t' },
    ],
  },
];

export function getLifecycle(slug: string): Lifecycle | undefined {
  return lifecycles.find((l) => l.slug === slug);
}

export function getLifecycleSlugs(): string[] {
  return lifecycles.map((l) => l.slug);
}
