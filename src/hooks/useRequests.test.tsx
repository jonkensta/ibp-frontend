import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { createWrapper } from '@/test/utils';
import {
  useInmateWarnings,
  useCreateRequest,
  useDeleteRequest,
  useValidateRequest,
  downloadRequestLabel,
} from './useRequests';
import * as api from '@/lib/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { Jurisdiction, RequestCreate } from '@/types';

// Mock the API module
vi.mock('@/lib/api', () => ({
  getInmateWarnings: vi.fn(),
  createRequest: vi.fn(),
  deleteRequest: vi.fn(),
  validateRequest: vi.fn(),
  getRequestLabel: vi.fn(),
}));

// Test components
function InmateWarningsTest({ jurisdiction, id }: { jurisdiction: Jurisdiction; id: number }) {
  const { data, isLoading, isError, error } = useInmateWarnings(jurisdiction, id);
  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error: {(error as Error).message}</div>;
  if (data) return <div data-testid="result">{JSON.stringify(data)}</div>;
  return null;
}

function CreateRequestTest({ jurisdiction, id, data }: { jurisdiction: Jurisdiction; id: number; data: RequestCreate }) {
  const mutation = useCreateRequest(jurisdiction, id);
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

function DeleteRequestTest({ jurisdiction, id, requestIndex = 1 }: { jurisdiction: Jurisdiction; id: number; requestIndex?: number }) {
  const mutation = useDeleteRequest(jurisdiction, id);
  return (
    <div>
      <button data-testid="delete-btn" onClick={() => mutation.mutate(requestIndex)}>Delete</button>
      {mutation.isPending && <div>Pending</div>}
      {mutation.isSuccess && <div>Success</div>}
      {mutation.isError && <div>Error: {(mutation.error as Error).message}</div>}
    </div>
  );
}

function ValidateRequestTest({ jurisdiction, id, data }: { jurisdiction: Jurisdiction; id: number; data: RequestCreate }) {
  const mutation = useValidateRequest(jurisdiction, id);
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

describe('useRequests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useInmateWarnings', () => {
    it('should fetch inmate warnings', async () => {
      const mockWarnings = {
        entry_age: undefined,
        release: 'Release date is in the past',
      };

      vi.mocked(api.getInmateWarnings).mockResolvedValue(mockWarnings);

      const Wrapper = createWrapper();
      render(<InmateWarningsTest jurisdiction="Texas" id={12345} />, { wrapper: Wrapper });

      const result = page.getByTestId('result');
      await expect.element(result).toHaveTextContent(JSON.stringify(mockWarnings));

      expect(api.getInmateWarnings).toHaveBeenCalledWith('Texas', 12345);
    });

    it('should use correct query key', async () => {
      const mockWarnings = {
        entry_age: undefined,
        release: undefined,
      };

      vi.mocked(api.getInmateWarnings).mockResolvedValue(mockWarnings);

      const Wrapper = createWrapper();
      render(<InmateWarningsTest jurisdiction="Federal" id={67890} />, { wrapper: Wrapper });

      const result = page.getByTestId('result');
      await expect.element(result).toBeInTheDocument();

      expect(api.getInmateWarnings).toHaveBeenCalledWith('Federal', 67890);
    });

    it('should handle fetch errors', async () => {
      vi.mocked(api.getInmateWarnings).mockRejectedValue(new Error('Failed to fetch warnings'));

      const Wrapper = createWrapper();
      render(<InmateWarningsTest jurisdiction="Texas" id={12345} />, { wrapper: Wrapper });

      const error = page.getByText('Error: Failed to fetch warnings');
      await expect.element(error).toBeInTheDocument();
    });
  });

  describe('useCreateRequest', () => {
    it('should create request successfully', async () => {
      const requestData = {
        date_postmarked: '2024-12-20',
        date_processed: '2024-12-21',
        action: 'Filled' as const,
      };

      const createdRequest = {
        index: 1,
        ...requestData,
      };

      vi.mocked(api.createRequest).mockResolvedValue(createdRequest);

      const Wrapper = createWrapper();
      render(<CreateRequestTest jurisdiction="Texas" id={12345} data={requestData} />, { wrapper: Wrapper });

      const button = page.getByRole('button', { name: 'Mutate' });
      await button.click();

      const success = page.getByText('Success');
      await expect.element(success).toBeInTheDocument();

      expect(api.createRequest).toHaveBeenCalledWith('Texas', 12345, requestData);
      
      const result = page.getByTestId('result');
      await expect.element(result).toHaveTextContent(JSON.stringify(createdRequest));
    });

    it('should invalidate inmate query on success', async () => {
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

      const createdRequest = {
        index: 1,
        date_postmarked: '2024-12-20',
        date_processed: '2024-12-21',
        action: 'Filled' as const,
      };

      vi.mocked(api.createRequest).mockResolvedValue(createdRequest);

      render(<CreateRequestTest jurisdiction="Texas" id={12345} data={{
        date_postmarked: '2024-12-20',
        date_processed: '2024-12-21',
        action: 'Filled',
      }} />, { wrapper: Wrapper });

      const button = page.getByRole('button', { name: 'Mutate' });
      await button.click();

      const success = page.getByText('Success');
      await expect.element(success).toBeInTheDocument();

      // Should invalidate the inmate query to refresh requests list
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['inmates', 'Texas', 12345] });
    });

    it('should handle creation errors', async () => {
      vi.mocked(api.createRequest).mockRejectedValue(new Error('Failed to create request'));

      const Wrapper = createWrapper();
      render(<CreateRequestTest jurisdiction="Texas" id={12345} data={{
        date_postmarked: '2024-12-20',
        date_processed: '2024-12-21',
        action: 'Filled',
      }} />, { wrapper: Wrapper });

      const button = page.getByRole('button', { name: 'Mutate' });
      await button.click();

      const error = page.getByText('Error: Failed to create request');
      await expect.element(error).toBeInTheDocument();
    });
  });

  describe('useDeleteRequest', () => {
    it('should delete request successfully', async () => {
      vi.mocked(api.deleteRequest).mockResolvedValue(undefined);

      const Wrapper = createWrapper();
      render(<DeleteRequestTest jurisdiction="Texas" id={12345} requestIndex={1} />, { wrapper: Wrapper });

      const button = page.getByTestId('delete-btn');
      await button.click();

      const success = page.getByText('Success');
      await expect.element(success).toBeInTheDocument();

      expect(api.deleteRequest).toHaveBeenCalledWith('Texas', 12345, 1);
    });

    it('should invalidate inmate query on success', async () => {
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

      vi.mocked(api.deleteRequest).mockResolvedValue(undefined);

      render(<DeleteRequestTest jurisdiction="Federal" id={67890} requestIndex={2} />, { wrapper: Wrapper });

      const button = page.getByTestId('delete-btn');
      await button.click();

      const success = page.getByText('Success');
      await expect.element(success).toBeInTheDocument();

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['inmates', 'Federal', 67890] });
    });

    it('should handle deletion errors', async () => {
      vi.mocked(api.deleteRequest).mockRejectedValue(new Error('Failed to delete request'));

      const Wrapper = createWrapper();
      render(<DeleteRequestTest jurisdiction="Texas" id={12345} requestIndex={1} />, { wrapper: Wrapper });

      const button = page.getByTestId('delete-btn');
      await button.click();

      const error = page.getByText('Error: Failed to delete request');
      await expect.element(error).toBeInTheDocument();
    });
  });

  describe('useValidateRequest', () => {
    it('should validate request successfully', async () => {
      const requestData = {
        date_postmarked: '2024-12-20',
        date_processed: '2024-12-21',
        action: 'Filled' as const,
      };

      const validationResult = { entry_age: undefined, release: undefined, postmarkdate: undefined };

      vi.mocked(api.validateRequest).mockResolvedValue(validationResult);

      const Wrapper = createWrapper();
      render(<ValidateRequestTest jurisdiction="Texas" id={12345} data={requestData} />, { wrapper: Wrapper });

      const button = page.getByRole('button', { name: 'Mutate' });
      await button.click();

      const success = page.getByText('Success');
      await expect.element(success).toBeInTheDocument();

      expect(api.validateRequest).toHaveBeenCalledWith('Texas', 12345, requestData);
      
      const result = page.getByTestId('result');
      await expect.element(result).toHaveTextContent(JSON.stringify(validationResult));
    });

    it('should handle validation errors', async () => {
      vi.mocked(api.validateRequest).mockRejectedValue(new Error('Validation failed'));

      const Wrapper = createWrapper();
      render(<ValidateRequestTest jurisdiction="Texas" id={12345} data={{
        date_postmarked: '2024-12-20',
        date_processed: '2024-12-21',
        action: 'Filled',
      }} />, { wrapper: Wrapper });

      const button = page.getByRole('button', { name: 'Mutate' });
      await button.click();

      const error = page.getByText('Error: Validation failed');
      await expect.element(error).toBeInTheDocument();
    });

    it('should not invalidate queries on success (validation only)', async () => {
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

      vi.mocked(api.validateRequest).mockResolvedValue({ entry_age: undefined, release: undefined, postmarkdate: undefined });

      render(<ValidateRequestTest jurisdiction="Texas" id={12345} data={{
        date_postmarked: '2024-12-20',
        date_processed: '2024-12-21',
        action: 'Filled',
      }} />, { wrapper: Wrapper });

      const button = page.getByRole('button', { name: 'Mutate' });
      await button.click();

      const success = page.getByText('Success');
      await expect.element(success).toBeInTheDocument();

      // Validation should NOT invalidate queries
      expect(invalidateSpy).not.toHaveBeenCalled();
    });
  });

  describe('downloadRequestLabel', () => {
    let createElementSpy: MockInstance;
    let appendChildSpy: MockInstance;
    let removeChildSpy: MockInstance;
    let createObjectURLSpy: MockInstance;
    let revokeObjectURLSpy: MockInstance;

    beforeEach(() => {
      // Mock DOM APIs
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      };

      createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLAnchorElement);
      appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as unknown as Node);
      removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as unknown as Node);

      // window.URL is available in browser mode
      createObjectURLSpy = vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:mock-url');
      revokeObjectURLSpy = vi.spyOn(window.URL, 'revokeObjectURL').mockImplementation(() => {});
    });

    afterEach(() => {
      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
      createObjectURLSpy.mockRestore();
      revokeObjectURLSpy.mockRestore();
    });

    it('should download label file', async () => {
      const mockBlob = new Blob(['fake image data'], { type: 'image/png' });
      vi.mocked(api.getRequestLabel).mockResolvedValue(mockBlob);

      await downloadRequestLabel('Texas', 12345, 1);

      expect(api.getRequestLabel).toHaveBeenCalledWith('Texas', 12345, 1);
      expect(createObjectURLSpy).toHaveBeenCalledWith(mockBlob);
      expect(createElementSpy).toHaveBeenCalledWith('a');
    });

    it('should set correct filename', async () => {
      const mockBlob = new Blob(['fake image data'], { type: 'image/png' });
      vi.mocked(api.getRequestLabel).mockResolvedValue(mockBlob);

      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      createElementSpy.mockReturnValue(mockLink);

      await downloadRequestLabel('Federal', 67890, 5);

      expect(mockLink.download).toBe('label-Federal-67890-5.png');
    });

    it('should trigger download and cleanup', async () => {
      const mockBlob = new Blob(['fake image data'], { type: 'image/png' });
      vi.mocked(api.getRequestLabel).mockResolvedValue(mockBlob);

      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      createElementSpy.mockReturnValue(mockLink);

      await downloadRequestLabel('Texas', 12345, 1);

      expect(mockLink.click).toHaveBeenCalled();
      expect(appendChildSpy).toHaveBeenCalledWith(mockLink);
      expect(removeChildSpy).toHaveBeenCalledWith(mockLink);
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');
    });

    it('should handle download errors', async () => {
      vi.mocked(api.getRequestLabel).mockRejectedValue(new Error('Failed to get label'));

      await expect(downloadRequestLabel('Texas', 12345, 1)).rejects.toThrow('Failed to get label');
    });
  });
});