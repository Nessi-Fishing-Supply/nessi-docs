import type { Journey } from '@/types/journey';

export const shopCreation: Journey = {
  slug: 'shop-creation',
  title: 'Shop Creation + Setup',
  persona: 'shop-owner',
  description: 'Create shop, set branding, optionally invite members. Slug reservation, 5-shop limit.',
  nodes: [
    { id: 's', type: 'entry', label: 'Click "Create Shop"', x: 60, y: 200, layer: 'client', status: 'built' },
    { id: 'dl', type: 'decision', label: 'Under 5-shop limit?', x: 280, y: 200, options: [{ label: 'Yes', to: 'nm' }, { label: 'No', to: 'le' }] },
    { id: 'le', type: 'step', label: 'Show Limit Error', x: 500, y: 300, layer: 'client', status: 'built', why: '5-shop limit per member prevents a single user from monopolizing shop namespaces and simplifies billing.' },
    { id: 'nm', type: 'step', label: 'Enter Shop Name', x: 500, y: 140, layer: 'client', status: 'built' },
    { id: 'sl', type: 'step', label: 'Check Slug', x: 720, y: 140, layer: 'server', status: 'built', route: 'POST /api/shops/slug' },
    { id: 'cr', type: 'step', label: 'Create Shop', x: 940, y: 140, layer: 'server', status: 'built', route: 'POST /api/shops', why: 'reserve_slug() atomically reserves the slug and creates the shop + owner membership in a single transaction.' },
    { id: 'av', type: 'step', label: 'Upload Avatar', x: 1160, y: 140, layer: 'server', status: 'built', route: 'POST /api/shops/avatar' },
    { id: 'hr', type: 'step', label: 'Upload Hero Banner', x: 1380, y: 140, layer: 'server', status: 'built' },
    { id: 'di', type: 'decision', label: 'Invite members?', x: 1600, y: 140, options: [{ label: 'Yes', to: 'inv' }, { label: 'Skip', to: 'dn' }] },
    { id: 'inv', type: 'step', label: 'Send Invites', x: 1800, y: 80, layer: 'email', status: 'built', route: 'POST /api/shops/[id]/invites' },
    { id: 'dn', type: 'step', label: 'Shop Live!', x: 1800, y: 200, layer: 'client', status: 'built' },
  ],
  edges: [
    { from: 's', to: 'dl' }, { from: 'dl', to: 'nm', opt: 'Yes' }, { from: 'dl', to: 'le', opt: 'No' },
    { from: 'nm', to: 'sl' }, { from: 'sl', to: 'cr' }, { from: 'cr', to: 'av' }, { from: 'av', to: 'hr' }, { from: 'hr', to: 'di' },
    { from: 'di', to: 'inv', opt: 'Yes' }, { from: 'di', to: 'dn', opt: 'Skip' }, { from: 'inv', to: 'dn' },
  ],
};
