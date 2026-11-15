'use client';

import { useParams } from 'next/navigation';
import { BookingWizard } from '@/components/wizard/BookingWizard';

export default function BookPackagePage() {
  const { packageSlug } = useParams<{ packageSlug: string }>();
  return <BookingWizard packageSlug={packageSlug} />;
}
