import type { Journey } from '@/types/journey';

export const createListing: Journey = {
  slug: 'create-listing',
  title: 'Create Listing',
  persona: 'seller',
  description: 'Multi-step wizard: photos, category, details, pricing, shipping. Supports draft saving and shop context.',
  nodes: [
    { id: 's', type: 'entry', label: 'Click "List an Item"', x: 60, y: 200, layer: 'client', status: 'built' },
    { id: 'dc', type: 'decision', label: 'Selling context?', x: 280, y: 200, options: [{ label: 'Personal', to: 'ph' }, { label: 'Shop', to: 'cp' }] },
    { id: 'cp', type: 'step', label: 'Select Shop', x: 500, y: 300, layer: 'client', status: 'built', why: 'X-Nessi-Context header tells the API which shop to attribute the listing to. Personal vs shop affects who can edit it.' },
    { id: 'ph', type: 'step', label: 'Upload Photos', x: 500, y: 140, layer: 'client', status: 'built', codeRef: 'src/features/listings/components/photo-manager/index.tsx', notes: 'Min 1, max 10 photos' },
    { id: 'up', type: 'step', label: 'Upload to Storage', x: 740, y: 140, layer: 'server', status: 'built', route: 'POST /api/listings/upload', why: 'Photos are converted to WebP server-side for consistent quality and smaller file sizes across all listings.' },
    { id: 'cat', type: 'step', label: 'Category + Condition', x: 980, y: 200, layer: 'client', status: 'built', notes: '10 categories, 6 condition tiers' },
    { id: 'det', type: 'step', label: 'Title, Brand, Description', x: 1220, y: 200, layer: 'client', status: 'built' },
    { id: 'pr', type: 'step', label: 'Set Price', x: 1460, y: 200, layer: 'client', status: 'built', notes: 'Price in cents, quantity', why: 'Storing price as integer cents avoids floating-point rounding issues common with currency.' },
    { id: 'sh', type: 'step', label: 'Shipping Options', x: 1700, y: 200, layer: 'client', status: 'built', notes: 'Paid by: seller, buyer, or split' },
    { id: 'da', type: 'decision', label: 'Publish?', x: 1940, y: 200, options: [{ label: 'Publish', to: 'pub' }, { label: 'Save Draft', to: 'dft' }] },
    { id: 'pub', type: 'step', label: 'Create (active)', x: 2180, y: 140, layer: 'server', status: 'built', route: 'POST /api/listings' },
    { id: 'dft', type: 'step', label: 'Save as Draft', x: 2180, y: 280, layer: 'server', status: 'built', why: 'Drafts auto-expire after 30 days to prevent stale listing data from accumulating.' },
    { id: 'live', type: 'step', label: 'Listing Live!', x: 2420, y: 140, layer: 'client', status: 'built' },
  ],
  edges: [
    { from: 's', to: 'dc' }, { from: 'dc', to: 'ph', opt: 'Personal' }, { from: 'dc', to: 'cp', opt: 'Shop' }, { from: 'cp', to: 'ph' },
    { from: 'ph', to: 'up' }, { from: 'up', to: 'cat' }, { from: 'cat', to: 'det' }, { from: 'det', to: 'pr' }, { from: 'pr', to: 'sh' }, { from: 'sh', to: 'da' },
    { from: 'da', to: 'pub', opt: 'Publish' }, { from: 'da', to: 'dft', opt: 'Save Draft' }, { from: 'pub', to: 'live' },
  ],
};
