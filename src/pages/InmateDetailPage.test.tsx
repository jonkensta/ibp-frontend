import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { createTestQueryClient, createWrapper } from '@/test/utils';
import { InmateDetailPage } from './InmateDetailPage';
import { GlobalSearchProvider } from '@/contexts/GlobalSearchContext';
import { StrictMode, type ReactNode } from 'react';
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

const mockFetch = vi.fn();
window.fetch = mockFetch;

let mockJurisdiction = 'Texas';
let mockId = '12345';
let mockLocationState: unknown = null;
let mockLocationKey = 'test';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ jurisdiction: mockJurisdiction, id: mockId }),
    useLocation: () => ({
      pathname: `/inmates/${mockJurisdiction}/${mockId}`,
      search: '',
      hash: '',
      state: mockLocationState,
      key: mockLocationKey,
    }),
  };
});

// Wrapper sharing a caller-owned QueryClient
function createClientWrapper(queryClient: QueryClient) {
  return function ClientWrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <GlobalSearchProvider>{children}</GlobalSearchProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );
  };
}

// Create wrapper with GlobalSearchProvider
function createTestWrapper() {
  const BaseWrapper = createWrapper();
  return function TestWrapper({ children }: { children: ReactNode }) {
    return (
      <BaseWrapper>
        <GlobalSearchProvider>{children}</GlobalSearchProvider>
      </BaseWrapper>
    );
  };
}

const mockInmate = {
  jurisdiction: 'Texas',
  id: 12345,
  first_name: 'John',
  last_name: 'Doe',
  race: 'White',
  sex: 'M',
  unit: {
    name: 'Test Unit',
    jurisdiction: 'Texas',
    street1: '123 Main St',
    street2: null,
    city: 'Austin',
    state: 'TX',
    zipcode: '78701',
    url: null,
    shipping_method: 'Box',
  },
  datetime_fetched: '2024-12-25T10:00:00Z',
  release: '2025-01-01',
  url: null,
  lookups: [],
  requests: [
    {
      index: 1,
      date_postmarked: '2024-12-20',
      date_processed: '2024-12-21',
      action: 'Filled',
    },
  ],
  comments: [
    {
      index: 1,
      author: 'JD',
      body: 'Test comment',
      datetime_created: '2024-12-25T10:00:00Z',
    },
  ],
};

const mockWarnings = {
  entry_age: null,
  release: null,
  postmarkdate: null,
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Route mocked fetches: lookups POST, warnings GET, read-only inmate GET. */
function mockApi(inmate: unknown) {
  mockFetch.mockImplementation(async (url: string, init?: RequestInit) => {
    const method = init?.method ?? 'GET';
    if (url.endsWith('/warnings')) return jsonResponse(mockWarnings);
    if (method === 'POST' && url.endsWith('/lookups')) return jsonResponse(inmate, 201);
    if (method === 'GET') return jsonResponse(inmate);
    return jsonResponse({ detail: `unexpected ${method} ${url}` }, 500);
  });
}

function fetchCalls(method: string, suffix: RegExp) {
  return mockFetch.mock.calls.filter(
    ([url, init]) => (init?.method ?? 'GET') === method && suffix.test(url)
  );
}

describe('InmateDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    mockJurisdiction = 'Texas';
    mockId = '12345';
    mockLocationState = null;
    mockLocationKey = 'test';
  });

  it('should display loading skeletons while fetching data', async () => {
    // Make the promise never resolve to keep loading state
    mockFetch.mockImplementation(() => new Promise(() => {}));

    const Wrapper = createTestWrapper();
    await render(<InmateDetailPage />, { wrapper: Wrapper });

    // Back to search link should be present during loading
    const backLink = page.getByText(/back to search/i);
    await expect.element(backLink).toBeInTheDocument();

    // Check that inmate name is not yet displayed (still loading)
    await new Promise((resolve) => setTimeout(resolve, 100));
    const heading = page.getByText('John Doe');
    const element = await heading.query();
    expect(element).toBeNull();
  });

  it('should display error message when fetch fails', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const Wrapper = createTestWrapper();
    await render(<InmateDetailPage />, { wrapper: Wrapper });

    const errorMessage = page.getByText(/network error/i);
    await expect.element(errorMessage).toBeInTheDocument();

    const backLink = page.getByText(/back to search/i);
    await expect.element(backLink).toBeInTheDocument();
  });

  it('should display generic error for non-Error failures', async () => {
    mockFetch.mockImplementation(
      async () =>
        new Response('Server Error', {
          status: 500,
          statusText: 'Internal Server Error',
        })
    );

    const Wrapper = createTestWrapper();
    await render(<InmateDetailPage />, { wrapper: Wrapper });

    const errorMessage = page.getByText(/server error|internal server error/i);
    await expect.element(errorMessage).toBeInTheDocument();
  });

  it('should display "not found" when inmate does not exist', async () => {
    mockFetch.mockImplementation(
      async () =>
        new Response('Not Found', {
          status: 404,
          statusText: 'Not Found',
        })
    );

    const Wrapper = createTestWrapper();
    await render(<InmateDetailPage />, { wrapper: Wrapper });

    const notFoundMessage = page.getByText(/inmate not found|not found/i);
    await expect.element(notFoundMessage).toBeInTheDocument();

    const backLink = page.getByText(/back to search/i);
    await expect.element(backLink).toBeInTheDocument();
  });

  it('should display inmate information when loaded successfully', async () => {
    // Mock both the inmate fetch and warnings fetch
    mockApi(mockInmate);

    const Wrapper = createTestWrapper();
    await render(<InmateDetailPage />, { wrapper: Wrapper });

    // Check inmate name in header (use first() as it appears in multiple places)
    const inmateName = page.getByText('John Doe').first();
    await expect.element(inmateName).toBeInTheDocument();

    // Check back link
    const backLink = page.getByText(/back to search/i);
    await expect.element(backLink).toBeInTheDocument();
  });

  it('should display inmate profile section', async () => {
    mockApi(mockInmate);

    const Wrapper = createTestWrapper();
    await render(<InmateDetailPage />, { wrapper: Wrapper });

    // Wait for data to load (use first() as name appears in multiple places)
    const inmateName = page.getByText('John Doe').first();
    await expect.element(inmateName).toBeInTheDocument();

    // Check for unit information
    const unit = page.getByText(/test unit/i);
    await expect.element(unit).toBeInTheDocument();
  });

  it('should display requests section', async () => {
    mockApi(mockInmate);

    const Wrapper = createTestWrapper();
    await render(<InmateDetailPage />, { wrapper: Wrapper });

    // Wait for data to load (use first() as name appears in multiple places)
    const inmateName = page.getByText('John Doe').first();
    await expect.element(inmateName).toBeInTheDocument();

    // Check for request action badge
    const filledBadge = page.getByText('Filled');
    await expect.element(filledBadge).toBeInTheDocument();
  });

  it('should display comments section', async () => {
    mockApi(mockInmate);

    const Wrapper = createTestWrapper();
    await render(<InmateDetailPage />, { wrapper: Wrapper });

    // Wait for data to load (use first() as name appears in multiple places)
    const inmateName = page.getByText('John Doe').first();
    await expect.element(inmateName).toBeInTheDocument();

    // Check for comment
    const comment = page.getByText('Test comment');
    await expect.element(comment).toBeInTheDocument();
  });

  it('should parse id from URL params correctly', async () => {
    mockJurisdiction = 'Federal';
    mockId = '67890';

    const mockFederalInmate = {
      ...mockInmate,
      jurisdiction: 'Federal',
      id: 67890,
      first_name: 'Jane',
      last_name: 'Smith',
      unit: {
        ...mockInmate.unit,
        jurisdiction: 'Federal',
        name: 'Federal Unit',
      },
    };

    mockApi(mockFederalInmate);

    const Wrapper = createTestWrapper();
    await render(<InmateDetailPage />, { wrapper: Wrapper });

    // Check that the correct inmate is displayed (use first() as name appears in multiple places)
    const inmateName = page.getByText('Jane Smith').first();
    await expect.element(inmateName).toBeInTheDocument();

    // Verify API was called with correct params
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/inmates/Federal/67890'),
      expect.anything()
    );
  });

  it('should have back to search link with correct href', async () => {
    mockApi(mockInmate);

    const Wrapper = createTestWrapper();
    await render(<InmateDetailPage />, { wrapper: Wrapper });

    const backLink = page.getByText(/back to search/i);
    await expect.element(backLink).toBeInTheDocument();

    const element = await backLink.query();
    expect(element?.getAttribute('href')).toBe('/search');
  });

  it('should preserve the originating search query in the back link', async () => {
    mockLocationState = { searchQuery: 'John Smith' };

    mockApi(mockInmate);

    const Wrapper = createTestWrapper();
    await render(<InmateDetailPage />, { wrapper: Wrapper });

    const backLink = page.getByText(/back to search/i);
    await expect.element(backLink).toBeInTheDocument();

    const element = await backLink.query();
    expect(element?.getAttribute('href')).toBe('/search?q=John%20Smith');
  });

  it('should render RequestForm and CommentForm', async () => {
    mockApi(mockInmate);

    const Wrapper = createTestWrapper();
    await render(<InmateDetailPage />, { wrapper: Wrapper });

    // Wait for data to load (use first() as name appears in multiple places)
    const inmateName = page.getByText('John Doe').first();
    await expect.element(inmateName).toBeInTheDocument();

    // Check for RequestForm elements
    const requestFormTitle = page.getByText(/usps postmark date/i);
    await expect.element(requestFormTitle).toBeInTheDocument();

    // Check for CommentForm elements
    const commentFormTitle = page.getByRole('button', { name: 'Add Comment' });
    await expect.element(commentFormTitle).toBeInTheDocument();
  });

  describe('lookups', () => {
    const LOOKUPS = /\/inmates\/Texas\/12345\/lookups$/;
    const INMATE = /\/inmates\/Texas\/12345$/;

    it('records exactly one lookup when the page opens, even in StrictMode', async () => {
      mockApi(mockInmate);

      // StrictMode (at the root, as in main.tsx) runs mount effects twice
      // in development; nested under a render `wrapper` it does not.
      const Wrapper = createClientWrapper(createTestQueryClient());
      await render(
        <StrictMode>
          <Wrapper>
            <InmateDetailPage />
          </Wrapper>
        </StrictMode>
      );

      await expect.element(page.getByText('John Doe').first()).toBeInTheDocument();
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(fetchCalls('POST', LOOKUPS)).toHaveLength(1);
    });

    it('refetches read-only, without a new lookup, after a mutation invalidates', async () => {
      mockApi(mockInmate);
      const queryClient = createTestQueryClient();

      const Wrapper = createClientWrapper(queryClient);
      await render(<InmateDetailPage />, { wrapper: Wrapper });
      await expect.element(page.getByText('John Doe').first()).toBeInTheDocument();
      const getsBefore = fetchCalls('GET', INMATE).length;

      // What useCreateRequest / useCreateComment etc. do on success.
      await queryClient.invalidateQueries({ queryKey: ['inmates', 'Texas', 12345] });
      await queryClient.refetchQueries({ queryKey: ['inmates', 'Texas', 12345] });

      expect(fetchCalls('GET', INMATE).length).toBeGreaterThan(getsBefore);
      expect(fetchCalls('POST', LOOKUPS)).toHaveLength(1);
    });

    it('records a new lookup on a new navigation to the inmate', async () => {
      mockApi(mockInmate);
      const queryClient = createTestQueryClient();

      const Wrapper = createClientWrapper(queryClient);
      const screen = await render(<InmateDetailPage />, { wrapper: Wrapper });
      await expect.element(page.getByText('John Doe').first()).toBeInTheDocument();

      await screen.rerender(<InmateDetailPage />);
      expect(fetchCalls('POST', LOOKUPS)).toHaveLength(1);

      mockLocationKey = 'second-visit';
      await screen.rerender(<InmateDetailPage />);
      await expect.poll(() => fetchCalls('POST', LOOKUPS).length).toBe(2);
    });

    it('shows the lookup error and does not fall back to the read-only GET', async () => {
      mockFetch.mockImplementation(async (url: string, init?: RequestInit) =>
        init?.method === 'POST' && url.endsWith('/lookups')
          ? jsonResponse({ detail: 'Inmate not found.' }, 404)
          : jsonResponse(mockWarnings)
      );

      const Wrapper = createTestWrapper();
      await render(<InmateDetailPage />, { wrapper: Wrapper });

      await expect.element(page.getByText('Inmate not found.')).toBeInTheDocument();
      expect(fetchCalls('GET', INMATE)).toHaveLength(0);
    });
  });
});
