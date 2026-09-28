import { QueryClient } from '@tanstack/react-query';
import { isApiError } from './errors';

// §5.4 — TanStack Query conventions
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (count, err) => (isApiError(err) ? count < 1 && err.status >= 500 : count < 1),
        staleTime: 30_000,
        refetchOnWindowFocus: false,
      },
    },
  });
}
