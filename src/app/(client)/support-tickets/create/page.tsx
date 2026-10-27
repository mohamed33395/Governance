'use client';


import { LogoLoader } from '@/components/ui';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// legacy route — ticket creation now happens in a dialog on the list page
export default function CreateSupportTicketPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/support-tickets');
  }, [router]);
  return (
    <LogoLoader />
  );
}
