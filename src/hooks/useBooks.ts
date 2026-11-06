import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getBook } from '@/lib/api';

/**
 * A function looking up a book by ISBN, for the packing station's scans.
 * Answers are cached for the session's usual stale time, so rescanning the
 * same book doesn't ask the backend again; failures aren't retried (a 404 or
 * 422 won't change, and the packer can type the book in).
 */
export function useLookupBook() {
  const queryClient = useQueryClient();

  return useCallback(
    (isbn: string) =>
      queryClient.fetchQuery({
        queryKey: ['books', isbn],
        queryFn: () => getBook(isbn),
        retry: false,
      }),
    [queryClient]
  );
}
