import { useCallback } from 'react';
import { isCancelledError, useQueryClient } from '@tanstack/react-query';
import { getBook } from '@/lib/api';
import type { Book } from '@/types';
import { normalizeIsbn } from '@/lib/isbn';

/**
 * The query key of a book lookup: by ISBN-13 when the ISBN is valid, so the
 * ISBN-10 and ISBN-13 scans of a book share one answer (and one invalidation).
 */
export function bookQueryKey(isbn: string) {
  return ['books', normalizeIsbn(isbn) ?? isbn.trim()] as const;
}

/**
 * A function looking up a book by ISBN, for the packing station's scans.
 * Answers are cached for the session's usual stale time, so rescanning the
 * same book doesn't ask the backend again; failures aren't retried (a 404 or
 * 422 won't change, and the packer can type the book in). A cancelled lookup
 * is asked again rather than failing.
 */
export function useLookupBook() {
  const queryClient = useQueryClient();

  return useCallback(
    async (isbn: string): Promise<Book> => {
      for (;;) {
        try {
          return await queryClient.fetchQuery({
            queryKey: bookQueryKey(isbn),
            queryFn: () => getBook(isbn),
            retry: false,
          });
        } catch (error) {
          // Cancelled because the answer changed (a title fixed for future
          // scans, which caches the fix): ask again, getting the fix.
          if (!isCancelledError(error)) throw error;
        }
      }
    },
    [queryClient]
  );
}
