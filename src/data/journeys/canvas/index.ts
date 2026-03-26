import type { Journey } from '@/types/journey';
import { signup } from './signup';
import { guestCart } from './guest-cart';
import { shopInvite } from './shop-invite';
import { onboarding } from './onboarding';
import { createListing } from './create-listing';
import { shopCreation } from './shop-creation';

export const journeys: Journey[] = [
  signup, guestCart, shopInvite, onboarding, createListing, shopCreation,
];

export function getAllJourneys(): Journey[] {
  return journeys;
}

export function getJourney(slug: string): Journey | undefined {
  return journeys.find((j) => j.slug === slug);
}

export function getJourneySlugs(): string[] {
  return journeys.map((j) => j.slug);
}
