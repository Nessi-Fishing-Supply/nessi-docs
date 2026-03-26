import { redirect } from 'next/navigation';
import { getJourneySlugs } from '@/data';

export default function JourneysIndex() {
  redirect(`/journeys/${getJourneySlugs()[0]}`);
}
