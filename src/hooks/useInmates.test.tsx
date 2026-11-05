import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { createWrapper } from '@/test/utils';
import { useSearchInmates, useInmate } from './useInmates';
import * as api from '@/lib/api';
import { ApiError } from '@/lib/api/client';
import type { Jurisdiction } from '@/types';

// Mock the API module
vi.mock('@/lib/api', () => ({
  searchInmates: vi.fn(),
  getInmate: vi.fn(),
  getInmateByLegacyRequest: vi.fn(),
  recordLookup: vi.fn(),
}));

// Test component that uses useSearchInmates
function SearchInmatesTest({ query }: { query: string }) {
  const { data, isLoading, isError, error, fetchStatus } = useSearchInmates(query);

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error: {(error as Error).message}</div>;
  if (data) return <div>Results: {JSON.stringify(data)}</div>;
  if (fetchStatus === 'idle') return <div>Query Disabled</div>;
  return null;
}

// Test component that uses useInmate
function InmateTest({ jurisdiction, id }: { jurisdiction: Jurisdiction; id: number }) {
  const { data, isLoading, isError, error } = useInmate(jurisdiction, id);

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error: {(error as Error).message}</div>;
  if (data)
    return (
      <div>
        Inmate: {data.first_name} {data.last_name}
      </div>
    );
  return null;
}

describe('useInmates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useSearchInmates', () => {
    it('should fetch search results when query is provided', async () => {
      const mockResults = {
        inmates: [
          {
            jurisdiction: 'Texas' as const,
            id: 12345,
            first_name: 'John',
            last_name: 'Doe',
            race: null,
            sex: null,
            release: null,
            unit: 'Test Unit',
            url: null,
          },
        ],
        errors: [],
      };

      vi.mocked(api.searchInmates).mockResolvedValue(mockResults);

      const Wrapper = createWrapper();
      await render(<SearchInmatesTest query="John Doe" />, { wrapper: Wrapper });

      // Wait a bit for React Query to execute
      await new Promise((resolve) => setTimeout(resolve, 100));

      const results = page.getByText(/Results:/);
      await expect.element(results).toBeInTheDocument();

      expect(api.searchInmates).toHaveBeenCalledWith('John Doe');
    });

    it('should be disabled when query is empty', async () => {
      const Wrapper = createWrapper();
      await render(<SearchInmatesTest query="" />, { wrapper: Wrapper });

      const disabled = page.getByText('Query Disabled');
      await expect.element(disabled).toBeInTheDocument();

      expect(api.searchInmates).not.toHaveBeenCalled();
    });

    it('should handle search errors', async () => {
      vi.mocked(api.searchInmates).mockRejectedValue(new Error('Search failed'));

      const Wrapper = createWrapper();
      await render(<SearchInmatesTest query="error query" />, { wrapper: Wrapper });

      // Wait for React Query to execute and handle the error
      await new Promise((resolve) => setTimeout(resolve, 100));

      const error = page.getByText('Error: Search failed');
      await expect.element(error).toBeInTheDocument();
    });

    it('should show loading state initially', async () => {
      vi.mocked(api.searchInmates).mockImplementation(() => new Promise(() => {}));

      const Wrapper = createWrapper();
      await render(<SearchInmatesTest query="test" />, { wrapper: Wrapper });

      const loading = page.getByText('Loading...');
      await expect.element(loading).toBeInTheDocument();
    });
  });

  describe('useSearchInmates with a legacy request ID', () => {
    const legacyInmate = {
      jurisdiction: 'Texas' as const,
      id: 2584921,
      first_name: 'John',
      last_name: 'Doe',
      race: null,
      sex: null,
      release: null,
      url: null,
      datetime_fetched: null,
      unit: null,
      requests: [],
      comments: [],
      lookups: [],
    };

    it("resolves a recent legacy request ID to the request's inmate", async () => {
      vi.mocked(api.getInmateByLegacyRequest).mockResolvedValue(legacyInmate);

      await render(<SearchInmatesTest query="268213" />, { wrapper: createWrapper() });

      await expect.element(page.getByText(/"id":2584921/)).toBeInTheDocument();
      expect(api.getInmateByLegacyRequest).toHaveBeenCalledWith(268213);
      expect(api.searchInmates).not.toHaveBeenCalled();
    });

    it('falls back to an inmate ID search when no request has that ID', async () => {
      vi.mocked(api.getInmateByLegacyRequest).mockRejectedValue(new ApiError(404, 'Not found'));
      vi.mocked(api.searchInmates).mockResolvedValue({ inmates: [], errors: [] });

      await render(<SearchInmatesTest query="268213" />, { wrapper: createWrapper() });

      await expect.element(page.getByText(/Results:/)).toBeInTheDocument();
      expect(api.searchInmates).toHaveBeenCalledWith('268213');
    });

    it('surfaces other legacy lookup errors', async () => {
      vi.mocked(api.getInmateByLegacyRequest).mockRejectedValue(new ApiError(500, 'Server down'));

      await render(<SearchInmatesTest query="268213" />, { wrapper: createWrapper() });

      await expect.element(page.getByText('Error: Server down')).toBeInTheDocument();
      expect(api.searchInmates).not.toHaveBeenCalled();
    });

    it('searches inmate IDs outside the legacy range or with leading zeros directly', async () => {
      vi.mocked(api.searchInmates).mockResolvedValue({ inmates: [], errors: [] });

      await render(<SearchInmatesTest query="00268213" />, { wrapper: createWrapper() });
      await expect.element(page.getByText(/Results:/)).toBeInTheDocument();

      await render(<SearchInmatesTest query="12345" />, { wrapper: createWrapper() });
      await expect.element(page.getByText(/Results:/).last()).toBeInTheDocument();

      expect(api.getInmateByLegacyRequest).not.toHaveBeenCalled();
      expect(api.searchInmates).toHaveBeenCalledWith('00268213');
      expect(api.searchInmates).toHaveBeenCalledWith('12345');
    });
  });

  describe('useInmate', () => {
    it('should fetch inmate data', async () => {
      const mockInmate = {
        jurisdiction: 'Texas' as const,
        id: 12345,
        first_name: 'John',
        last_name: 'Doe',
        race: 'White',
        sex: 'M',
        unit: {
          name: 'Test Unit',
          jurisdiction: 'Texas' as const,
          street1: '123 Main St',
          street2: null,
          city: 'Austin',
          state: 'TX',
          zipcode: '78701',
          url: null,
          shipping_method: 'Box' as const,
        },
        datetime_fetched: '2024-12-25T10:00:00Z',
        release: '2025-01-01',
        url: null,
        lookups: [],
        requests: [],
        comments: [],
      };

      vi.mocked(api.getInmate).mockResolvedValue(mockInmate);

      const Wrapper = createWrapper();
      await render(<InmateTest jurisdiction="Texas" id={12345} />, { wrapper: Wrapper });

      const inmate = page.getByText('Inmate: John Doe');
      await expect.element(inmate).toBeInTheDocument();

      expect(api.getInmate).toHaveBeenCalledWith('Texas', 12345);
    });

    it('should handle different jurisdictions', async () => {
      const mockInmate = {
        jurisdiction: 'Federal' as const,
        id: 67890,
        first_name: 'Jane',
        last_name: 'Smith',
        race: 'Black',
        sex: 'F',
        unit: {
          name: 'Federal Unit',
          jurisdiction: 'Federal' as const,
          street1: '456 Oak Ave',
          street2: null,
          city: 'Houston',
          state: 'TX',
          zipcode: '77001',
          url: null,
          shipping_method: 'Individual' as const,
        },
        datetime_fetched: '2024-12-25T10:00:00Z',
        release: null,
        url: null,
        lookups: [],
        requests: [],
        comments: [],
      };

      vi.mocked(api.getInmate).mockResolvedValue(mockInmate);

      const Wrapper = createWrapper();
      await render(<InmateTest jurisdiction="Federal" id={67890} />, { wrapper: Wrapper });

      const inmate = page.getByText('Inmate: Jane Smith');
      await expect.element(inmate).toBeInTheDocument();

      expect(api.getInmate).toHaveBeenCalledWith('Federal', 67890);
    });

    it('should handle fetch errors', async () => {
      vi.mocked(api.getInmate).mockRejectedValue(new Error('Inmate not found'));

      const Wrapper = createWrapper();
      await render(<InmateTest jurisdiction="Texas" id={99999} />, { wrapper: Wrapper });

      const error = page.getByText('Error: Inmate not found');
      await expect.element(error).toBeInTheDocument();
    });

    it('should show loading state initially', async () => {
      vi.mocked(api.getInmate).mockImplementation(() => new Promise(() => {}));

      const Wrapper = createWrapper();
      await render(<InmateTest jurisdiction="Texas" id={12345} />, { wrapper: Wrapper });

      const loading = page.getByText('Loading...');
      await expect.element(loading).toBeInTheDocument();
    });
  });
});
