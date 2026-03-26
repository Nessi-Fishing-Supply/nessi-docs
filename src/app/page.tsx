import { redirect } from 'next/navigation';
import { getJourneySlugs } from '@/data';

export default function Home() {
  const slugs = getJourneySlugs();
  redirect(`/journeys/${slugs[0]}`);
}
