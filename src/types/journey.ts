export type StepLayer = 'client' | 'server' | 'database' | 'background' | 'email' | 'external';
export type StepStatus = 'planned' | 'built' | 'tested';

export type Persona =
  | 'guest'
  | 'auth'
  | 'onboarding'
  | 'buyer'
  | 'seller'
  | 'shop-owner'
  | 'shop-member'
  | 'account'
  | 'context';

export type ErrorCase = {
  condition: string;
  result: string;
  httpStatus?: number;
};

export type Step = {
  id: string;
  label: string;
  layer: StepLayer;
  status: StepStatus;
  route?: string;
  codeRef?: string;
  notes?: string;
  errorCases?: ErrorCase[];
};

export type BranchPath = {
  label: string;
  goTo: string;
};

export type Branch = {
  afterStep: string;
  condition: string;
  paths: BranchPath[];
};

export type Connection = {
  from: string;
  to: string;
  label?: string;
};

export type Flow = {
  id: string;
  title: string;
  trigger?: string;
  steps: Step[];
  branches?: Branch[];
  connections?: Connection[];
};

export type Journey = {
  slug: string;
  title: string;
  persona: Persona;
  description: string;
  relatedIssues?: number[];
  flows: Flow[];
};

// Layer metadata for rendering
export const LAYER_CONFIG: Record<StepLayer, { label: string; color: string; icon: string }> = {
  client: { label: 'Client', color: 'var(--color-primary-400)', icon: 'HiOutlineDesktopComputer' },
  server: { label: 'Server', color: 'var(--color-accent-500)', icon: 'HiOutlineServer' },
  database: { label: 'Database', color: 'var(--color-info-500)', icon: 'HiOutlineDatabase' },
  background: {
    label: 'Background',
    color: 'var(--color-warning-500)',
    icon: 'HiOutlineLightningBolt',
  },
  email: { label: 'Email', color: 'var(--color-destructive-400)', icon: 'HiOutlineMail' },
  external: { label: 'External', color: 'var(--color-neutral-600)', icon: 'HiOutlineGlobe' },
};

export const STATUS_CONFIG: Record<StepStatus, { label: string; color: string }> = {
  planned: { label: 'Planned', color: 'var(--color-neutral-400)' },
  built: { label: 'Built', color: 'var(--color-primary-400)' },
  tested: { label: 'Tested', color: 'var(--color-success-500)' },
};

export const PERSONA_CONFIG: Record<Persona, { label: string; description: string }> = {
  guest: { label: 'Guest', description: 'Unauthenticated browsing, search, guest cart' },
  auth: { label: 'Auth', description: 'Signup, login, OTP, password reset, email change' },
  onboarding: { label: 'Onboarding', description: 'Post-signup wizard, buyer vs seller path' },
  buyer: { label: 'Buyer', description: 'Search, filter, cart, recently viewed, checkout' },
  seller: { label: 'Seller', description: 'Listing lifecycle, pricing, shipping, sharing' },
  'shop-owner': { label: 'Shop Owner', description: 'Create, settings, members, roles, deletion' },
  'shop-member': {
    label: 'Shop Member',
    description: 'Invite acceptance, permissions, leave shop',
  },
  account: { label: 'Account', description: 'Profile, addresses, email change, delete account' },
  context: { label: 'Context', description: 'Member/shop identity switching, revocation' },
};
