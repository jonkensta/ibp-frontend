import type {
  PackageItem,
  PackageItemCreate,
  PackageItemCreated,
  PackageItemUpdate,
} from '@/types';
import { apiGet, apiPost, apiPut, apiDelete } from './client';

function itemsPath(code: string): string {
  return `/requests/${encodeURIComponent(code)}/items`;
}

export async function getPackageItems(code: string): Promise<PackageItem[]> {
  return apiGet<PackageItem[]>(itemsPath(code));
}

/** Record a book in a package. 409 if the request isn't filled. */
export async function addPackageItem(
  code: string,
  data: PackageItemCreate
): Promise<PackageItemCreated> {
  return apiPost<PackageItemCreated>(itemsPath(code), data);
}

/** Edit an item. 409 if it changed since `data.revision` or is registered. */
export async function updatePackageItem(
  code: string,
  itemId: number,
  data: PackageItemUpdate
): Promise<PackageItem> {
  return apiPut<PackageItem>(`${itemsPath(code)}/${itemId}`, data);
}

/**
 * Delete an item. A registered item needs `confirmRegistered` (409 otherwise);
 * it stays registered on the portal.
 */
export async function deletePackageItem(
  code: string,
  itemId: number,
  { confirmRegistered = false }: { confirmRegistered?: boolean } = {}
): Promise<void> {
  const query = confirmRegistered ? '?confirm_registered=true' : '';
  return apiDelete<void>(`${itemsPath(code)}/${itemId}${query}`);
}
