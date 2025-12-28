import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchInmates, getInmate } from './inmates';

const mockFetch = vi.fn();
window.fetch = mockFetch;

describe('Inmates API', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('searchInmates', () => {
    it('should search inmates with encoded query', async () => {
      const mockResults = {
        inmates: [
          {
            jurisdiction: 'Texas',
            id: 12345,
            first_name: 'John',
            last_name: 'Doe',
            race: 'White',
            sex: 'M',
            release: '2025-01-01',
            url: null,
          },
        ],
        errors: [],
      };

      mockFetch.mockResolvedValue(
        new Response(JSON.stringify(mockResults), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const result = await searchInmates('John Doe');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/inmates?query=John%20Doe'),
        expect.objectContaining({
          method: 'GET',
        })
      );
      expect(result).toEqual(mockResults);
    });

    it('should handle special characters in query', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({ inmates: [], errors: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      await searchInmates("O'Brien & Smith");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("O'Brien%20%26%20Smith"),
        expect.anything()
      );
    });

    it('should return errors from providers', async () => {
      const mockResults = {
        inmates: [],
        errors: ['Provider A timeout', 'Provider B failed'],
      };

      mockFetch.mockResolvedValue(
        new Response(JSON.stringify(mockResults), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const result = await searchInmates('Smith');

      expect(result.errors).toHaveLength(2);
      expect(result.errors[0]).toBe('Provider A timeout');
    });
  });

  describe('getInmate', () => {
    it('should fetch single inmate by jurisdiction and id', async () => {
      const mockInmate = {
        jurisdiction: 'Texas',
        id: 12345,
        first_name: 'John',
        last_name: 'Doe',
        race: 'White',
        sex: 'M',
        release: '2025-01-01',
        url: 'https://example.com',
        datetime_fetched: '2024-12-20T10:00:00Z',
        unit: {
          jurisdiction: 'Texas',
          name: 'Test Unit',
          street1: '123 Main St',
          street2: null,
          city: 'Austin',
          state: 'TX',
          zipcode: '78701',
          url: null,
          shipping_method: 'Box',
        },
        requests: [],
        comments: [],
        lookups: [],
      };

      mockFetch.mockResolvedValue(
        new Response(JSON.stringify(mockInmate), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const result = await getInmate('Texas', 12345);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/inmates/Texas/12345'),
        expect.objectContaining({
          method: 'GET',
        })
      );
      expect(result).toEqual(mockInmate);
    });

    it('should handle jurisdiction with spaces', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({}), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      await getInmate('Texas', 12345);

      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('Texas'), expect.anything());
    });

    it('should throw error for not found inmate', async () => {
      mockFetch.mockResolvedValue(
        new Response('Not Found', {
          status: 404,
          statusText: 'Not Found',
        })
      );

      await expect(getInmate('Texas', 99999)).rejects.toThrow();
    });
  });
});
