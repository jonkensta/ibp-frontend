import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { createWrapper } from '@/test/utils';
import { useUnits, useUnit, useUpdateUnit } from './useUnits';
import * as api from '@/lib/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { Jurisdiction, UnitUpdate } from '@/types';

// Mock the API module
vi.mock('@/lib/api', () => ({
  getAllUnits: vi.fn(),
  createUnit: vi.fn(),
  getUnit: vi.fn(),
  updateUnit: vi.fn(),
}));

// Test components
function UnitsTest() {
  const { data, isLoading, isError, error } = useUnits();
  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error: {(error as Error).message}</div>;
  if (data) return <div data-testid="result">{JSON.stringify(data)}</div>;
  return null;
}

function UnitTest({ jurisdiction, name }: { jurisdiction: Jurisdiction; name: string }) {
  const { data, isLoading, isError, error } = useUnit(jurisdiction, name);
  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error: {(error as Error).message}</div>;
  if (data) return <div data-testid="result">{JSON.stringify(data)}</div>;
  return null;
}

function UpdateUnitTest({
  jurisdiction,
  name,
  data,
}: {
  jurisdiction: Jurisdiction;
  name: string;
  data: UnitUpdate;
}) {
  const mutation = useUpdateUnit(jurisdiction, name);
  return (
    <div>
      <button onClick={() => mutation.mutate(data)}>Mutate</button>
      {mutation.isPending && <div>Pending</div>}
      {mutation.isSuccess && <div>Success</div>}
      {mutation.isError && <div>Error: {(mutation.error as Error).message}</div>}
      {mutation.data && <div data-testid="result">{JSON.stringify(mutation.data)}</div>}
    </div>
  );
}

const mockUnit = {
  jurisdiction: 'Texas' as const,
  name: 'Test Unit',
  street1: '123 Main St',
  street2: null,
  city: 'Austin',
  state: 'TX',
  zipcode: '78701',
  url: null,
  shipping_method: 'Box' as const,
};

describe('useUnits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useUnits', () => {
    it('should fetch all units', async () => {
      const mockUnits = [
        mockUnit,
        {
          ...mockUnit,
          name: 'Another Unit',
          city: 'Dallas',
        },
      ];

      vi.mocked(api.getAllUnits).mockResolvedValue(mockUnits);

      const Wrapper = createWrapper();
      render(<UnitsTest />, { wrapper: Wrapper });

      const result = page.getByTestId('result');
      await expect.element(result).toHaveTextContent(JSON.stringify(mockUnits));

      expect(api.getAllUnits).toHaveBeenCalled();
    });

    it('should handle fetch errors', async () => {
      vi.mocked(api.getAllUnits).mockRejectedValue(new Error('Failed to fetch units'));

      const Wrapper = createWrapper();
      render(<UnitsTest />, { wrapper: Wrapper });

      const error = page.getByText('Error: Failed to fetch units');
      await expect.element(error).toBeInTheDocument();
    });
  });

  describe('useUnit', () => {
    it('should fetch single unit', async () => {
      vi.mocked(api.getUnit).mockResolvedValue(mockUnit);

      const Wrapper = createWrapper();
      render(<UnitTest jurisdiction="Texas" name="Test Unit" />, { wrapper: Wrapper });

      const result = page.getByTestId('result');
      await expect.element(result).toHaveTextContent(JSON.stringify(mockUnit));

      expect(api.getUnit).toHaveBeenCalledWith('Texas', 'Test Unit');
    });

    it('should use correct query key with jurisdiction and name', async () => {
      vi.mocked(api.getUnit).mockResolvedValue(mockUnit);

      const Wrapper = createWrapper();
      render(<UnitTest jurisdiction="Federal" name="Federal Prison" />, { wrapper: Wrapper });

      const result = page.getByTestId('result');
      await expect.element(result).toBeInTheDocument();

      expect(api.getUnit).toHaveBeenCalledWith('Federal', 'Federal Prison');
    });

    it('should handle fetch errors', async () => {
      vi.mocked(api.getUnit).mockRejectedValue(new Error('Unit not found'));

      const Wrapper = createWrapper();
      render(<UnitTest jurisdiction="Texas" name="Nonexistent" />, { wrapper: Wrapper });

      const error = page.getByText('Error: Unit not found');
      await expect.element(error).toBeInTheDocument();
    });
  });

  describe('useUpdateUnit', () => {
    it('should update unit successfully', async () => {
      const updateData = {
        street1: '456 New St',
        street2: null,
        city: 'Houston',
        state: 'TX',
        zipcode: '77001',
        url: null,
        shipping_method: 'Individual' as const,
      };

      const updatedUnit = {
        ...mockUnit,
        ...updateData,
      };

      vi.mocked(api.updateUnit).mockResolvedValue(updatedUnit);

      const Wrapper = createWrapper();
      render(<UpdateUnitTest jurisdiction="Texas" name="Test Unit" data={updateData} />, {
        wrapper: Wrapper,
      });

      const button = page.getByRole('button', { name: 'Mutate' });
      await button.click();

      const success = page.getByText('Success');
      await expect.element(success).toBeInTheDocument();

      expect(api.updateUnit).toHaveBeenCalledWith('Texas', 'Test Unit', updateData);

      const result = page.getByTestId('result');
      await expect.element(result).toHaveTextContent(JSON.stringify(updatedUnit));
    });

    it('should invalidate queries on success', async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });

      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const Wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const updatedUnit = { ...mockUnit, city: 'Dallas' };
      vi.mocked(api.updateUnit).mockResolvedValue(updatedUnit);

      render(<UpdateUnitTest jurisdiction="Texas" name="Test Unit" data={{ city: 'Dallas' }} />, {
        wrapper: Wrapper,
      });

      const button = page.getByRole('button', { name: 'Mutate' });
      await button.click();

      const success = page.getByText('Success');
      await expect.element(success).toBeInTheDocument();

      // Should invalidate both the units list and the specific unit
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['units'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['units', 'Texas', 'Test Unit'] });
    });

    it('should handle update errors', async () => {
      vi.mocked(api.updateUnit).mockRejectedValue(new Error('Update failed'));

      const Wrapper = createWrapper();
      render(<UpdateUnitTest jurisdiction="Texas" name="Test Unit" data={{ city: 'Dallas' }} />, {
        wrapper: Wrapper,
      });

      const button = page.getByRole('button', { name: 'Mutate' });
      await button.click();

      const error = page.getByText('Error: Update failed');
      await expect.element(error).toBeInTheDocument();
    });

    it('should show loading state during mutation', async () => {
      vi.mocked(api.updateUnit).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const Wrapper = createWrapper();
      render(<UpdateUnitTest jurisdiction="Texas" name="Test Unit" data={{ city: 'Dallas' }} />, {
        wrapper: Wrapper,
      });

      const button = page.getByRole('button', { name: 'Mutate' });
      await button.click();

      const pending = page.getByText('Pending');
      await expect.element(pending).toBeInTheDocument();
    });
  });
});
