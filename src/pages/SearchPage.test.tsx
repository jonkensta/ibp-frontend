import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { createWrapper } from '@/test/utils';
import { SearchPage } from './SearchPage';

const mockFetch = vi.fn();
window.fetch = mockFetch;

const mockNavigate = vi.fn();
const mockSetSearchParams = vi.fn();
let mockSearchParams = new URLSearchParams('q=John');

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [mockSearchParams, mockSetSearchParams],
  };
});

describe('SearchPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    mockSearchParams = new URLSearchParams('q=John');
  });

  it('should render page title and description', async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ inmates: [], errors: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const Wrapper = createWrapper();
    render(<SearchPage />, { wrapper: Wrapper });

    const title = page.getByText(/search inmates/i);
    await expect.element(title).toBeInTheDocument();

    const description = page.getByText(/search by inmate name or id number/i);
    await expect.element(description).toBeInTheDocument();
  });

  it('should initialize with query from URL params', async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ inmates: [], errors: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const Wrapper = createWrapper();
    render(<SearchPage />, { wrapper: Wrapper });

    // Search form should be rendered with the initial query
    const searchForm = page.getByRole('textbox');
    await expect.element(searchForm).toHaveValue('John');
  });

  it('should display search results', async () => {
    const mockInmates = [
      {
        jurisdiction: 'Texas',
        id: 12345,
        first_name: 'John',
        last_name: 'Doe',
        unit: 'Test Unit',
        url: null,
      },
      {
        jurisdiction: 'Federal',
        id: 67890,
        first_name: 'Jane',
        last_name: 'Smith',
        unit: 'Another Unit',
        url: null,
      },
    ];

    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ inmates: mockInmates, errors: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const Wrapper = createWrapper();
    render(<SearchPage />, { wrapper: Wrapper });

    // Wait for results to load
    const resultsText = page.getByText(/found 2 results/i);
    await expect.element(resultsText).toBeInTheDocument();

    // Inmates are displayed as "Last, First"
    const johnDoe = page.getByText('Doe, John');
    await expect.element(johnDoe).toBeInTheDocument();

    const janeSmith = page.getByText('Smith, Jane');
    await expect.element(janeSmith).toBeInTheDocument();
  });

  it('should show singular "result" for one inmate', async () => {
    const mockInmates = [
      {
        jurisdiction: 'Texas',
        id: 12345,
        first_name: 'John',
        last_name: 'Doe',
        unit: 'Test Unit',
        url: null,
      },
    ];

    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ inmates: mockInmates, errors: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const Wrapper = createWrapper();
    render(<SearchPage />, { wrapper: Wrapper });

    // Wait a bit for the redirect check
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Should navigate to inmate detail page automatically
    expect(mockNavigate).toHaveBeenCalledWith('/inmates/Texas/12345', { replace: true });
  });

  it('should display provider errors message', async () => {
    const mockInmates = [
      {
        jurisdiction: 'Texas',
        id: 12345,
        first_name: 'John',
        last_name: 'Doe',
        unit: 'Test Unit',
        url: null,
      },
    ];

    mockFetch.mockResolvedValue(
      new Response(
        JSON.stringify({ inmates: mockInmates, errors: ['Federal BOP: Connection timeout'] }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    );

    const Wrapper = createWrapper();
    render(<SearchPage />, { wrapper: Wrapper });

    const partialResultsText = page.getByText(/partial results due to provider errors/i);
    await expect.element(partialResultsText).toBeInTheDocument();
  });

  it('should display error message on search failure', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const Wrapper = createWrapper();
    render(<SearchPage />, { wrapper: Wrapper });

    const errorMessage = page.getByText(/network error/i);
    await expect.element(errorMessage).toBeInTheDocument();
  });

  it('should display error message from failed response', async () => {
    mockFetch.mockResolvedValue(
      new Response('Bad Request', {
        status: 400,
        statusText: 'Bad Request',
      })
    );

    const Wrapper = createWrapper();
    render(<SearchPage />, { wrapper: Wrapper });

    // The error message comes from the response statusText
    const errorMessage = page.getByText(/bad request/i);
    await expect.element(errorMessage).toBeInTheDocument();
  });

  it('should show empty results message', async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ inmates: [], errors: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const Wrapper = createWrapper();
    render(<SearchPage />, { wrapper: Wrapper });

    const resultsText = page.getByText(/found 0 results/i);
    await expect.element(resultsText).toBeInTheDocument();
  });

  it('should update URL params when search is performed', async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ inmates: [], errors: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const Wrapper = createWrapper();
    render(<SearchPage />, { wrapper: Wrapper });

    const searchInput = page.getByRole('textbox');
    await searchInput.fill('Jane Smith');

    const searchButton = page.getByRole('button', { name: /search/i });
    await searchButton.click();

    expect(mockSetSearchParams).toHaveBeenCalledWith({ q: 'Jane Smith' });
  });

  it('should show loading skeleton while searching', async () => {
    // Make the promise never resolve to keep loading state
    mockFetch.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const Wrapper = createWrapper();
    render(<SearchPage />, { wrapper: Wrapper });

    // The search input should be disabled while loading
    const searchInput = page.getByRole('textbox');
    await expect.element(searchInput).toBeDisabled();
  });
});
