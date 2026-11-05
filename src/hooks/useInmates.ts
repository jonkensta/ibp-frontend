import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { searchInmates, getInmate, getInmateByLegacyRequest, recordLookup } from '@/lib/api';
import { ApiError } from '@/lib/api/client';
import { parseLegacyRequestId } from '@/lib/legacyRequest';
import type { InmateSearchResult, InmateSearchResults, Jurisdiction } from '@/types';

/** The inmate a legacy request ID belongs to, or null if no request has it. */
async function findInmateByLegacyRequest(requestId: number): Promise<InmateSearchResult | null> {
  try {
    const { jurisdiction, id, first_name, last_name, race, sex, release, url } =
      await getInmateByLegacyRequest(requestId);
    return { jurisdiction, id, first_name, last_name, race, sex, release, url };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

const messageOf = (error: unknown) => (error instanceof Error ? error.message : String(error));

/**
 * Search by name or inmate ID. A bare number in the recent legacy range may
 * be either a legacy request ID (an old package label) or an inmate ID, so it
 * is looked up both ways:
 *
 * - If only one hits, or both find the same inmate, and both lookups fully
 *   succeeded, that inmate is the single (auto-redirectable) result.
 * - If they find different inmates, both are returned, the request's inmate
 *   first and marked `via_request`, so the volunteer chooses.
 * - If either lookup failed or the ID search reported a provider error, the
 *   check that could have found a different inmate is incomplete: whatever
 *   was found is returned with the error and `noAutoRedirect`, never as a
 *   redirect to someone who may be the wrong person. Only if both lookups
 *   fail (or the request has no match and the ID search fails) does the
 *   search itself fail.
 */
async function searchInmatesOrLegacyRequest(query: string): Promise<InmateSearchResults> {
  const requestId = parseLegacyRequestId(query);
  if (requestId === null) return searchInmates(query);

  const [request, search] = await Promise.allSettled([
    findInmateByLegacyRequest(requestId),
    searchInmates(query),
  ]);

  if (request.status === 'rejected') {
    if (search.status === 'rejected') throw request.reason;
    return {
      inmates: search.value.inmates,
      errors: [
        `Old label request lookup failed: ${messageOf(request.reason)}`,
        ...search.value.errors,
      ],
      noAutoRedirect: true,
    };
  }

  const requestInmate = request.value;
  if (!requestInmate) {
    if (search.status === 'rejected') throw search.reason;
    return search.value;
  }
  const viaRequest = { ...requestInmate, via_request: requestId };

  if (search.status === 'rejected') {
    return {
      inmates: [viaRequest],
      errors: [`Inmate ID search failed: ${messageOf(search.reason)}`],
      noAutoRedirect: true,
    };
  }

  const { inmates, errors } = search.value;
  const others = inmates.filter(
    (inmate) =>
      !(inmate.jurisdiction === requestInmate.jurisdiction && inmate.id === requestInmate.id)
  );
  // The ID search found the request's inmate too: no need to label it
  const foundById = others.length < inmates.length;
  const first = foundById ? requestInmate : viaRequest;
  if (others.length === 0 && errors.length === 0) return { inmates: [requestInmate], errors };
  return { inmates: [first, ...others], errors, noAutoRedirect: true };
}

/**
 * The inmate a search should take the volunteer straight to: the only
 * result, unless the search marked it as not safe to redirect to.
 */
export function autoRedirectTarget(
  results: InmateSearchResults | undefined
): InmateSearchResult | null {
  if (!results || results.noAutoRedirect || results.inmates.length !== 1) return null;
  return results.inmates[0];
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
