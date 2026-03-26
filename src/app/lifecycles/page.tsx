import { redirect } from 'next/navigation';
import { getLifecycleSlugs } from '@/data';

export default function LifecyclesIndex() {
  redirect(`/lifecycles/${getLifecycleSlugs()[0]}`);
}
