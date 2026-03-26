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

export interface LayerConfig {
  label: string;
  color: string;
  icon: string;
}

export interface StatusConfig {
  label: string;
  color: string;
}

export interface PersonaConfig {
  label: string;
  description: string;
  color: string;
}

export const LAYER_CONFIG: Record<StepLayer, LayerConfig> = {
  client: { label: 'Client', color: '#3d8c75', icon: 'HiOutlineDesktopComputer' },
  server: { label: 'Server', color: '#e27739', icon: 'HiOutlineServer' },
  database: { label: 'Database', color: '#8b5cf6', icon: 'HiOutlineDatabase' },
  background: { label: 'Background', color: '#6b7280', icon: 'HiOutlineLightningBolt' },
  email: { label: 'Email', color: '#ec4899', icon: 'HiOutlineMail' },
  external: { label: 'External', color: '#f59e0b', icon: 'HiOutlineGlobe' },
};

export const STATUS_CONFIG: Record<StepStatus, StatusConfig> = {
  planned: { label: 'Planned', color: '#5c5a55' },
  built: { label: 'Built', color: '#3d8c75' },
  tested: { label: 'Tested', color: '#1a6b43' },
};

export const PERSONA_CONFIG: Record<Persona, PersonaConfig> = {
  guest: { label: 'Guest', description: 'Unauthenticated visitor', color: '#78756f' },
  auth: { label: 'Auth', description: 'Authentication flows', color: '#3d8c75' },
  onboarding: { label: 'Onboarding', description: 'New user setup', color: '#b86e0a' },
  buyer: { label: 'Buyer', description: 'Authenticated buyer', color: '#1e4a40' },
  seller: { label: 'Seller', description: 'Listing creator', color: '#e27739' },
  'shop-owner': { label: 'Shop Owner', description: 'Shop administrator', color: '#e89048' },
  'shop-member': { label: 'Shop Member', description: 'Shop participant', color: '#b84040' },
  account: { label: 'Account', description: 'Profile management', color: '#681a19' },
  context: { label: 'Context', description: 'Identity switching', color: '#5c5a55' },
};

export interface UxBehavior {
  toast?: string;
  redirect?: string;
  modal?: string;
  email?: string;
  notification?: string;
  stateChange?: string;
}

export interface ErrorCase {
  condition: string;
  result: string;
  httpStatus?: number;
}

export interface DecisionOption {
  label: string;
  to: string;
}

export interface JourneyNode {
  id: string;
  type: 'entry' | 'step' | 'decision';
  label: string;
  x: number;
  y: number;
  layer?: StepLayer;
  status?: StepStatus;
  route?: string;
  codeRef?: string;
  notes?: string;
  why?: string;
  errorCases?: ErrorCase[];
  ux?: UxBehavior;
  options?: DecisionOption[];
}

export interface JourneyEdge {
  from: string;
  to: string;
  opt?: string;
}

export type JourneyDomain = 'auth' | 'shopping' | 'cart' | 'account' | 'shops' | 'listings' | 'identity';

export interface Journey {
  slug: string;
  domain: JourneyDomain;
  title: string;
  persona: Persona;
  description: string;
  relatedIssues?: number[];
  nodes: JourneyNode[];
  edges: JourneyEdge[];
}
