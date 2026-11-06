import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ApiError,
  getPackage,
  addPackageItem,
  updatePackageItem,
  deletePackageItem,
} from '@/lib/api';
import { bookQueryKey } from './useBooks';
import type { PackageItemCreate, PackageItemUpdate } from '@/types';

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
    onSuccess: (item, { data }) => {
      // "Fix this title for all future scans" changed the lookup's answer.
      if (data.update_cache && item.isbn) {
        return queryClient.invalidateQueries({ queryKey: bookQueryKey(item.isbn), exact: true });
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
