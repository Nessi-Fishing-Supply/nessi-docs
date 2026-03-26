export interface ErdNode {
  id: string;
  label: string;
  badge: string;
  fieldCount: number;
  x: number;
  y: number;
}

export interface ErdEdge {
  from: string;
  to: string;
  label: string;
  cardinality: '1:1' | '1:N' | 'N:M';
  fk: string;
}

export const erdNodes: ErdNode[] = [
  { id: 'members', label: 'members', badge: 'core', fieldCount: 20, x: 400, y: 60 },
  { id: 'shops', label: 'shops', badge: 'core', fieldCount: 16, x: 400, y: 300 },
  { id: 'listings', label: 'listings', badge: 'core', fieldCount: 25, x: 60, y: 180 },
  { id: 'shop_members', label: 'shop_members', badge: 'junction', fieldCount: 5, x: 400, y: 180 },
  { id: 'shop_roles', label: 'shop_roles', badge: 'config', fieldCount: 7, x: 650, y: 180 },
  { id: 'shop_invites', label: 'shop_invites', badge: 'lifecycle', fieldCount: 8, x: 650, y: 300 },
  { id: 'shop_ownership_transfers', label: 'shop_ownership_transfers', badge: 'lifecycle', fieldCount: 8, x: 650, y: 420 },
  { id: 'listing_photos', label: 'listing_photos', badge: 'media', fieldCount: 5, x: 60, y: 340 },
  { id: 'cart_items', label: 'cart_items', badge: 'lifecycle', fieldCount: 7, x: 200, y: 420 },
  { id: 'recently_viewed', label: 'recently_viewed', badge: 'tracking', fieldCount: 4, x: 60, y: 60 },
  { id: 'addresses', label: 'addresses', badge: 'user', fieldCount: 10, x: 200, y: 60 },
  { id: 'search_suggestions', label: 'search_suggestions', badge: 'discovery', fieldCount: 4, x: 60, y: 480 },
  { id: 'slugs', label: 'slugs', badge: 'system', fieldCount: 4, x: 400, y: 420 },
];

export const erdEdges: ErdEdge[] = [
  { from: 'listings', to: 'members', label: 'seller_id', cardinality: '1:N', fk: 'seller_id' },
  { from: 'listings', to: 'shops', label: 'shop_id', cardinality: '1:N', fk: 'shop_id' },
  { from: 'listing_photos', to: 'listings', label: 'listing_id', cardinality: '1:N', fk: 'listing_id' },
  { from: 'shop_members', to: 'shops', label: 'shop_id', cardinality: '1:N', fk: 'shop_id' },
  { from: 'shop_members', to: 'members', label: 'member_id', cardinality: '1:N', fk: 'member_id' },
  { from: 'shop_members', to: 'shop_roles', label: 'role_id', cardinality: '1:N', fk: 'role_id' },
  { from: 'shops', to: 'members', label: 'owner_id', cardinality: '1:N', fk: 'owner_id' },
  { from: 'shop_invites', to: 'shops', label: 'shop_id', cardinality: '1:N', fk: 'shop_id' },
  { from: 'shop_invites', to: 'shop_roles', label: 'role_id', cardinality: '1:N', fk: 'role_id' },
  { from: 'shop_invites', to: 'members', label: 'invited_by', cardinality: '1:N', fk: 'invited_by' },
  { from: 'shop_ownership_transfers', to: 'shops', label: 'shop_id', cardinality: '1:N', fk: 'shop_id' },
  { from: 'shop_ownership_transfers', to: 'members', label: 'from_member_id', cardinality: '1:N', fk: 'from_member_id' },
  { from: 'cart_items', to: 'members', label: 'user_id', cardinality: '1:N', fk: 'user_id' },
  { from: 'cart_items', to: 'listings', label: 'listing_id', cardinality: '1:N', fk: 'listing_id' },
  { from: 'recently_viewed', to: 'members', label: 'user_id', cardinality: '1:N', fk: 'user_id' },
  { from: 'recently_viewed', to: 'listings', label: 'listing_id', cardinality: '1:N', fk: 'listing_id' },
  { from: 'addresses', to: 'members', label: 'user_id', cardinality: '1:N', fk: 'user_id' },
];
