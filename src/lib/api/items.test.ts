import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addPackageItem, deletePackageItem, getPackageItems, updatePackageItem } from './items';
import { getPackage } from './packages';
import { getBook } from './books';
import { ApiError } from './client';

const mockFetch = vi.fn();
window.fetch = mockFetch;

function jsonResponse(body: unknown, status = 200) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('Package, item and book API', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('gets a package by its code as scanned, encoded', async () => {
    mockFetch.mockImplementation(async () => jsonResponse({ items: [] }));
    await getPackage('tex-1234567-2');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/requests\/tex-1234567-2$/),
      expect.objectContaining({ method: 'GET' })
    );

    await getPackage('a/b c');
    expect(mockFetch.mock.calls[1][0]).toMatch(/\/requests\/a%2Fb%20c$/);
  });

  it('turns a 409 for a tossed request into an ApiError', async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({ detail: 'Request was tossed, so it has no package.' }, 409)
    );
    const error = await getPackage('TEX-1-0').catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(409);
    expect(error.message).toBe('Request was tossed, so it has no package.');
  });

  it('lists items', async () => {
    mockFetch.mockResolvedValue(jsonResponse([]));
    expect(await getPackageItems('TEX-1-0')).toEqual([]);
    expect(mockFetch.mock.calls[0][0]).toMatch(/\/requests\/TEX-1-0\/items$/);
  });

  it('posts a new item', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ id: 1, previously_sent: [] }, 201));
    const data = {
      isbn: '9780140449136',
      title: 'The Odyssey',
      author: 'Homer',
      source: 'isbn' as const,
    };
    await addPackageItem('TEX-1-0', data);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/requests\/TEX-1-0\/items$/),
      expect.objectContaining({ method: 'POST', body: JSON.stringify(data) })
    );
  });

  it('puts an item edit', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ id: 7 }));
    const data = {
      isbn: null,
      title: 'Dune',
      author: 'Frank Herbert',
      revision: 2,
      update_cache: false,
    };
    await updatePackageItem('TEX-1-0', 7, data);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/requests\/TEX-1-0\/items\/7$/),
      expect.objectContaining({ method: 'PUT', body: JSON.stringify(data) })
    );
  });

  it('deletes an item, confirming a registered one only when asked', async () => {
    mockFetch.mockImplementation(async () => new Response(null, { status: 204 }));
    await deletePackageItem('TEX-1-0', 7);
    await deletePackageItem('TEX-1-0', 8, { confirmRegistered: true });
    expect(mockFetch.mock.calls[0][0]).toMatch(/\/requests\/TEX-1-0\/items\/7$/);
    expect(mockFetch.mock.calls[0][1].method).toBe('DELETE');
    expect(mockFetch.mock.calls[1][0]).toMatch(/\/items\/8\?confirm_registered=true$/);
  });

  it('looks up a book', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ detail: 'Book not found.' }, 404));
    const error = await getBook('978 0140449136').catch((e) => e);
    expect(mockFetch.mock.calls[0][0]).toMatch(/\/books\/978%200140449136$/);
    expect(error.status).toBe(404);
    expect(error.message).toBe('Book not found.');
  });
});
