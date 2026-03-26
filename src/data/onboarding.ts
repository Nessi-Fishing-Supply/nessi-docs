export interface OnboardingStep {
  id: string;
  label: string;
  description: string;
  required: boolean;
  field: string;
  gates?: string;
  relatedJourney?: { label: string; href: string };
  relatedApi?: { label: string; href: string };
}

export interface SellerPrecondition {
  id: string;
  label: string;
  description: string;
  field: string;
}

export const onboardingSteps: OnboardingStep[] = [
  {
    id: 'avatar',
    label: 'Upload Avatar',
    description: 'Member uploads a profile photo. Stored as WebP via POST /api/members/avatar. Displayed across listings, shops, and the dashboard.',
    required: false,
    field: 'avatar_url',
    relatedApi: { label: 'POST /api/members/avatar', href: '/api-map#members' },
  },
  {
    id: 'name',
    label: 'Set Display Name',
    description: 'First and last name pulled from auth metadata at signup. Member can update via profile settings.',
    required: true,
    field: 'first_name, last_name',
    relatedApi: { label: 'Members API', href: '/api-map#members' },
  },
  {
    id: 'bio',
    label: 'Write a Bio',
    description: 'Short personal bio shown on the member profile. Maximum 280 characters.',
    required: false,
    field: 'bio',
  },
  {
    id: 'species',
    label: 'Select Target Species',
    description: 'Array of primary fish species the member targets. Used for recommendations and profile personalization.',
    required: false,
    field: 'primary_species[]',
  },
  {
    id: 'technique',
    label: 'Select Fishing Techniques',
    description: 'Array of primary fishing techniques the member uses. Helps surface relevant listings and shops.',
    required: false,
    field: 'primary_technique[]',
  },
  {
    id: 'state',
    label: 'Set Home State',
    description: 'Two-character US state code representing the member\'s home fishing region.',
    required: false,
    field: 'home_state',
  },
  {
    id: 'years',
    label: 'Years Fishing',
    description: 'Integer representing years of fishing experience. Optional but improves profile completeness.',
    required: false,
    field: 'years_fishing',
  },
  {
    id: 'complete',
    label: 'Complete Onboarding',
    description: 'Final step that sets onboarding_completed_at. Unlocks access to the dashboard, listings, shops, and cart. Member is redirected to the dashboard.',
    required: true,
    field: 'onboarding_completed_at',
    gates: 'Dashboard, Listings, Shops, Cart — all gated until this step is complete.',
    relatedJourney: { label: 'Onboarding Journey', href: '/journeys/onboarding' },
  },
];

export const sellerPreconditions: SellerPrecondition[] = [
  {
    id: 'onboarding',
    label: 'Onboarding Complete',
    description: 'Member must have completed the onboarding flow before seller mode can be enabled. Checked via onboarding_completed_at.',
    field: 'onboarding_completed_at',
  },
  {
    id: 'seller-mode',
    label: 'Seller Mode Enabled',
    description: 'Member must toggle on seller mode in profile settings. Controls whether seller-specific UI and routes are accessible.',
    field: 'is_seller',
  },
  {
    id: 'stripe',
    label: 'Stripe Connected',
    description: 'Planned. Member must connect a Stripe account to receive payouts. Required before publishing listings.',
    field: 'stripe_account_id',
  },
];
