import type { Journey } from '@/types/journey';

export const onboarding: Journey = {
  slug: 'onboarding',
  title: 'Onboarding Flow',
  persona: 'onboarding',
  description: 'New user picks display name, selects role (buyer, seller, shop owner), completes setup. proxy.ts enforces onboarding completion before allowing access to any authenticated page. Steps: avatar (optional), name (required), bio, species, technique, state, years fishing. Seller preconditions: onboarding complete, is_seller toggled, Stripe connected (planned).',
  nodes: [
    { id: 'r', type: 'entry', label: 'Redirected to /onboarding', x: 60, y: 220, layer: 'client', status: 'built', codeRef: 'src/proxy.ts', why: 'proxy.ts checks onboarding_completed_at — if null, all authenticated routes redirect here. This gates access to dashboard, listings, shops, and cart.' },
    { id: 'n', type: 'step', label: 'Choose Display Name', x: 280, y: 220, layer: 'client', status: 'built', notes: '3-40 chars, uniqueness via slugs table', why: 'Display names double as URL slugs (/member/[slug]), so uniqueness is enforced globally across members and shops.' },
    { id: 'sc', type: 'step', label: 'Reserve Slug', x: 500, y: 220, layer: 'database', status: 'built', notes: 'Calls reserve_slug() RPC atomically. Ensures no collision between member and shop URLs via global slugs table.', why: 'Display names become URL slugs (/member/[slug]), so global uniqueness is enforced across both members and shops.' },
    { id: 'dt', type: 'decision', label: 'What describes you?', x: 740, y: 220, options: [{ label: 'Buyer only', to: 'bp' }, { label: 'Buyer + Seller', to: 'ss' }, { label: 'Buyer + Shop', to: 'shc' }] },
    { id: 'bp', type: 'step', label: 'Set Fishing Preferences', x: 1020, y: 100, layer: 'client', status: 'built', notes: 'Species, technique, home state', why: 'Fishing preferences power personalized search results and listing recommendations.' },
    { id: 'bd', type: 'step', label: 'Complete → Dashboard', x: 1280, y: 100, layer: 'client', status: 'built', notes: 'Sets onboarding_completed_at timestamp. proxy.ts stops redirecting to /onboarding.' },
    { id: 'ss', type: 'step', label: 'Enable Seller Mode', x: 1020, y: 240, layer: 'server', status: 'built', route: 'POST /api/members/toggle-seller', why: 'Seller mode enables the listing creation wizard and dashboard listings tab. It\'s a soft toggle, not a permanent commitment.' },
    { id: 'sp', type: 'step', label: 'Set Preferences', x: 1280, y: 240, layer: 'client', status: 'built' },
    { id: 'sd', type: 'step', label: 'Complete → Dashboard', x: 1540, y: 240, layer: 'client', status: 'built', notes: 'Sets onboarding_completed_at. Seller mode already enabled.' },
    { id: 'shc', type: 'step', label: 'Create Shop', x: 1020, y: 380, layer: 'server', status: 'built', route: 'POST /api/shops', why: 'Creating a shop during onboarding lets new sellers start selling under a brand immediately, rather than as individuals.' },
    { id: 'shn', type: 'step', label: 'Shop Name + Avatar', x: 1280, y: 380, layer: 'client', status: 'built' },
    { id: 'she', type: 'step', label: 'Enable Seller Mode', x: 1540, y: 380, layer: 'server', status: 'built' },
    { id: 'shd', type: 'step', label: 'Complete → Dashboard', x: 1800, y: 380, layer: 'client', status: 'built', notes: 'Sets onboarding_completed_at. Shop created, seller mode enabled.' },
  ],
  edges: [
    { from: 'r', to: 'n' }, { from: 'n', to: 'sc' }, { from: 'sc', to: 'dt' },
    { from: 'dt', to: 'bp', opt: 'Buyer only' }, { from: 'dt', to: 'ss', opt: 'Buyer + Seller' }, { from: 'dt', to: 'shc', opt: 'Buyer + Shop' },
    { from: 'bp', to: 'bd' }, { from: 'ss', to: 'sp' }, { from: 'sp', to: 'sd' },
    { from: 'shc', to: 'shn' }, { from: 'shn', to: 'she' }, { from: 'she', to: 'shd' },
  ],
};
