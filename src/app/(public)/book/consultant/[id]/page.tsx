'use client';

import { useParams } from 'next/navigation';
import { BookingWizard } from '@/components/wizard/BookingWizard';

// Direct booking — no package, priced at the consultant's consultation_price
export default function BookConsultantPage() {
  const { id } = useParams<{ id: string }>();
  return <BookingWizard consultantId={id} />;
}
