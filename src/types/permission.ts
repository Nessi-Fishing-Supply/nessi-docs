export type PermissionLevel = 'full' | 'view' | 'none';
export type PermissionFeature = 'listings' | 'pricing' | 'orders' | 'messaging' | 'shop_settings' | 'members';

export interface Role {
  slug: string;
  name: string;
  description: string;
  color: string;
  permissions: Record<PermissionFeature, PermissionLevel>;
}

export const PERMISSION_FEATURES: { key: PermissionFeature; label: string; description: string }[] = [
  { key: 'listings', label: 'Listings', description: 'Create, edit, and manage product listings' },
  { key: 'pricing', label: 'Pricing', description: 'Set and modify listing prices' },
  { key: 'orders', label: 'Orders', description: 'View and manage orders' },
  { key: 'messaging', label: 'Messaging', description: 'Send and receive messages' },
  { key: 'shop_settings', label: 'Shop Settings', description: 'Edit shop name, avatar, banner, slug' },
  { key: 'members', label: 'Members', description: 'Invite, remove, and change member roles' },
];

export const LEVEL_CONFIG: Record<PermissionLevel, { label: string; color: string }> = {
  full: { label: 'Full', color: '#3d8c75' },
  view: { label: 'View', color: '#b86e0a' },
  none: { label: 'None', color: '#5c5a55' },
};
