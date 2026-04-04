import type { Entity } from '@/features/data-model';
import type { RawEntity } from '../raw-types';

export const ENTITY_CATEGORY_MAP: Record<string, string> = {
  // Core marketplace entities
  members: 'core',
  shops: 'core',
  listings: 'core',
  cart_items: 'core',
  // Shop management (invites, transfers, roles, membership)
  shop_members: 'shops',
  shop_roles: 'shops',
  shop_invites: 'shops',
  shop_ownership_transfers: 'shops',
  // Commerce (offers, watchers, price tracking)
  offers: 'commerce',
  watchers: 'commerce',
  price_drop_notifications: 'commerce',
  // Social (follows, blocks, flags)
  follows: 'social',
  member_blocks: 'social',
  flags: 'social',
  // Messaging
  message_threads: 'messaging',
  message_thread_participants: 'messaging',
  messages: 'messaging',
  // Content & discovery
  listing_photos: 'content',
  recently_viewed: 'content',
  search_suggestions: 'content',
  // User data
  addresses: 'user',
  slugs: 'user',
};

export function transformEntities(raw: RawEntity[]): Entity[] {
  return raw.map((e) => ({
    ...e,
    badge: ENTITY_CATEGORY_MAP[e.name] ?? 'system',
  }));
}
