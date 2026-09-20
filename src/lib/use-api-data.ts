"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Fetches a list (or object) through a service call. While the backend API is
 * not wired yet, it falls back to the provided demo data so the UI renders
 * exactly like the original static pages. Once the API responds successfully,
 * the live data replaces the fallback transparently.
 */
export function useApiData<T>(
  fetcher: (() => Promise<T>) | null,
  fallback: T
): {
  data: T;
  setData: React.Dispatch<React.SetStateAction<T>>;
  isLoading: boolean;
  fromApi: boolean;
  refetch: () => void;
} {
  const [data, setData] = useState<T>(fallback);
  const [isLoading, setIsLoading] = useState(true);
  const [fromApi, setFromApi] = useState(false);
  const fallbackRef = useRef(fallback);
  fallbackRef.current = fallback;

  const load = useCallback(() => {
    if (!fetcher) {
      setData(fallbackRef.current);
      setIsLoading(false);
      setFromApi(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    fetcher()
      .then((res) => {
        if (cancelled) return;
        setData(res);
        setFromApi(true);
      })
      .catch(() => {
        if (cancelled) return;
        setData(fallbackRef.current);
        setFromApi(false);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher]);

  useEffect(() => {
    const cleanup = load();
    return cleanup;
  }, [load]);

  const refetch = useCallback(() => {
    load();
  }, [load]);

  return { data, setData, isLoading, fromApi, refetch };
}
