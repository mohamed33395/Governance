import { redirect } from 'next/navigation';

// legacy mock portal → new client area
export default function LegacyClientIndex() {
  redirect('/dashboard');
}
