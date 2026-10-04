'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// legacy route — ticket creation now happens in a dialog on the list page
export default function CreateSupportTicketPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/support-tickets');
  }, [router]);
  return (
    <div className="page-loader">
      <span className="spinner" />
    </div>
  );
}
