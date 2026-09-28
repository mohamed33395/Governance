import { useQuery } from '@tanstack/react-query';
import { api } from './api';
import type { PublicMeta } from '@/types/api';

// §10.3 — PUB-08 app boot meta. Called once, cached forever (per session).
export function usePublicMeta() {
  return useQuery({
    queryKey: ['public', 'meta'],
    queryFn: () => api.get('/public/meta').then((r) => r.data.data as PublicMeta),
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
