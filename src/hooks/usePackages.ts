import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ApiError,
  getPackage,
  addPackageItem,
  updatePackageItem,
  deletePackageItem,
} from '@/lib/api';
import { bookQueryKey } from './useBooks';
import type { Book, PackageItemCreate, PackageItemUpdate } from '@/types';

export function packageQueryKey(code: string) {
  return ['packages', code] as const;
}

/** True for a 4xx from the API: retrying won't change the answer. */
function isClientError(error: unknown): boolean {
  return error instanceof ApiError && error.status >= 400 && error.status < 500;
}

/**
 * A package by its code as scanned. Always refetched on mount: a packer who
 * rescans a label after QC must see the books as they are now.
 */
export function usePackage(code: string) {
  return useQuery({
    queryKey: packageQueryKey(code),
    queryFn: () => getPackage(code),
    staleTime: 0,
    retry: (failureCount, error) => !isClientError(error) && failureCount < 1,
  });
}

// Item writes refetch the package whether they succeed or fail: a 409 means
// the item changed (or was registered) meanwhile, so the page must catch up.

export function useAddPackageItem(code: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PackageItemCreate) => addPackageItem(code, data),
    onSettled: () => queryClient.invalidateQueries({ queryKey: packageQueryKey(code) }),
  });
}

export function useUpdatePackageItem(code: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, data }: { itemId: number; data: PackageItemUpdate }) =>
      updatePackageItem(code, itemId, data),
    onSuccess: async (item, { data }) => {
      // "Fix this title for all future scans" changed the lookup's answer.
      // A lookup still in flight would land with the old title afterwards,
      // so cancel it (scans retry a cancelled lookup) and cache the fix.
      if (data.update_cache && item.isbn) {
        const queryKey = bookQueryKey(item.isbn);
        await queryClient.cancelQueries({ queryKey, exact: true });
        queryClient.setQueryData<Book>(queryKey, {
          isbn: item.isbn,
          title: item.title,
          author: item.author,
          source: 'manual',
          confidence: null,
        });
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: packageQueryKey(code) }),
  });
}

export function useDeletePackageItem(code: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, confirmRegistered }: { itemId: number; confirmRegistered?: boolean }) =>
      deletePackageItem(code, itemId, { confirmRegistered }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: packageQueryKey(code) }),
  });
}
