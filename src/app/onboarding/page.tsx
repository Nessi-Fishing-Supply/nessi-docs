import { onboardingSteps, sellerPreconditions } from '@/data/onboarding';
import { OnboardingTracker } from '@/features/onboarding/onboarding-tracker';

export const metadata = { title: 'Onboarding' };

export default function OnboardingPage() {
  return <OnboardingTracker steps={onboardingSteps} sellerPreconditions={sellerPreconditions} />;
}
