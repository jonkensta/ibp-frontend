import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { searchInmates, getInmate, getInmateByLegacyRequest, recordLookup } from '@/lib/api';
import { ApiError } from '@/lib/api/client';
import { parseLegacyRequestId } from '@/lib/legacyRequest';
import type { InmateSearchResults, Jurisdiction } from '@/types';

/**
 * Search by name or inmate ID. A bare number in the recent legacy range is
 * first tried as a legacy request ID (an old package label) and resolves to
 * that request's inmate; if no request has that ID, it's searched as an
 * inmate ID as usual.
 */
async function searchInmatesOrLegacyRequest(query: string): Promise<InmateSearchResults> {
  const requestId = parseLegacyRequestId(query);
  if (requestId !== null) {
    try {
      const inmate = await getInmateByLegacyRequest(requestId);
      return { inmates: [inmate], errors: [] };
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 404)) throw error;
    }
  }
  return searchInmates(query);
}

export function useSearchInmates(query: string) {
  return useQuery({
    queryKey: ['inmates', 'search', query],
    queryFn: () => searchInmatesOrLegacyRequest(query),
    enabled: query.length > 0,
  });
}

/**
 * Read-only inmate query. Refetching it (after a mutation invalidates it,
 * on retry, etc.) never records a lookup; see `useInmateView`.
 */
export function useInmate(jurisdiction: Jurisdiction, id: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['inmates', jurisdiction, id],
    queryFn: () => getInmate(jurisdiction, id),
    enabled: options?.enabled,
  });
}

interface InmateRef {
  jurisdiction: Jurisdiction;
  id: number;
}

/** Record a lookup of an inmate and seed the inmate query with the result. */
export function useRecordLookup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ jurisdiction, id }: InmateRef) => recordLookup(jurisdiction, id),
    onSuccess: (inmate, { jurisdiction, id }) => {
      queryClient.setQueryData(['inmates', jurisdiction, id], inmate);
    },
  });
}

/**
 * Load an inmate for the inmate page, recording exactly one lookup per view.
 *
 * `viewKey` identifies one deliberate view, e.g. the router location key,
 * which changes on every navigation (including searching for the inmate
 * again) but not on re-renders, remounts or StrictMode's double effects.
 * The lookup POST also loads the inmate; the read-only GET is enabled only
 * after it succeeds, so it serves later refetches without recording more.
 */
export function useInmateView(jurisdiction: Jurisdiction, id: number, viewKey: string) {
  const { mutate, variables, isSuccess, error: lookupError } = useRecordLookup();
  const recordedView = useRef<string | null>(null);
  const view = `${viewKey}|${jurisdiction}|${id}`;

  useEffect(() => {
    if (recordedView.current === view) return;
    recordedView.current = view;
    mutate({ jurisdiction, id });
  }, [view, jurisdiction, id, mutate]);

  const isThisInmate = variables?.jurisdiction === jurisdiction && variables?.id === id;
  const query = useInmate(jurisdiction, id, { enabled: isSuccess && isThisInmate });

  const error = (isThisInmate ? lookupError : null) ?? query.error;
  return {
    data: query.data,
    error,
    isLoading: !query.data && !error,
  };
}
