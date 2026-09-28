'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { isApiError } from '@/lib/errors';
import { useI18n } from '@/lib/i18n/i18n-context';
import {
  AvailabilityEditor,
  daysFromApi,
  mapServerErrors,
  toAvailabilityPayload,
  validateAvailability,
  type EditorDay,
} from './AvailabilityEditor';
import { Alert, Button, ErrorState, useToast } from '@/components/ui';
import type { AvailabilityDay } from '@/types/api';

// §13.5 tab 2 / §13.6 — availability editor against any base path
// ("/admin/consultants/{id}" or "/admin/my"). Save replaces the whole week.
export function AvailabilityTab({ basePath }: { basePath: string }) {
  const { t } = useI18n();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [days, setDays] = useState<EditorDay[] | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [conflicts, setConflicts] = useState(0);

  const query = useQuery({
    queryKey: ['admin', 'availability', basePath],
    queryFn: () =>
      api.get(`${basePath}/availability`).then((r) => r.data.data as { days: AvailabilityDay[] }),
  });

  useEffect(() => {
    if (query.data) setDays(daysFromApi(query.data.days));
  }, [query.data]);

  const save = useMutation({
    mutationFn: (payload: ReturnType<typeof toAvailabilityPayload>) =>
      api
        .put(`${basePath}/availability`, payload)
        .then((r) => r.data.data as { days: AvailabilityDay[]; warnings?: { conflicting_bookings_count: number } }),
    onSuccess: (data) => {
      toast.success(t('profile.saved'));
      setConflicts(data.warnings?.conflicting_bookings_count ?? 0);
      queryClient.invalidateQueries({ queryKey: ['admin', 'availability', basePath] });
    },
    onError: (e) => {
      if (isApiError(e) && e.code === 'AVAILABILITY_OVERLAP') {
        // errors keyed days.0.ranges.1 — highlight the range row
        const sentEditorDays = (days ?? []).filter((d) => d.is_working && d.ranges.length > 0);
        setErrors(mapServerErrors(e.errors, sentEditorDays, days ?? []));
        toast.error(e.message);
      } else if (isApiError(e)) {
        toast.error(e.message);
      }
    },
  });

  if (query.isLoading || !days) {
    return (
      <div className="page-loader">
        <span className="spinner" />
      </div>
    );
  }
  if (query.isError) return <ErrorState onRetry={() => query.refetch()} />;

  const submit = () => {
    const vErrors = validateAvailability(days);
    setErrors(vErrors);
    if (Object.keys(vErrors).length > 0) return;
    setConflicts(0);
    save.mutate(toAvailabilityPayload(days));
  };

  return (
    <div>
      {conflicts > 0 && (
        <Alert
          color="warning"
          body={t('availability.conflicts').replace('{count}', String(conflicts))}
          className="mb-4"
        />
      )}
      <AvailabilityEditor value={days} onChange={setDays} errors={errors} />
      <Button className="mt-5" onClick={submit} loading={save.isPending}>
        {t('common.save')}
      </Button>
    </div>
  );
}
