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
