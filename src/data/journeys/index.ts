import type { Journey } from '@/types/journey';

import shopInviteAcceptance from './shop-invite-acceptance.json';
import guestCart from './guest-cart.json';
import signup from './signup.json';

// All journeys — add new imports here
export const journeys: Journey[] = [
  shopInviteAcceptance as Journey,
  guestCart as Journey,
  signup as Journey,
];

export function getJourneyBySlug(slug: string): Journey | undefined {
  return journeys.find((j) => j.slug === slug);
}

export function getJourneysByPersona(persona: string): Journey[] {
  return journeys.filter((j) => j.persona === persona);
}
