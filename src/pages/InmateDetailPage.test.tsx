import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { createWrapper } from '@/test/utils';
import { InmateDetailPage } from './InmateDetailPage';
import { GlobalSearchProvider } from '@/contexts/GlobalSearchContext';
import type { ReactNode } from 'react';

const mockFetch = vi.fn();
window.fetch = mockFetch;

let mockJurisdiction = 'Texas';
let mockId = '12345';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ jurisdiction: mockJurisdiction, id: mockId }),
  };
});

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

describe('InmateDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    mockJurisdiction = 'Texas';
    mockId = '12345';
  });

  it('should display loading skeletons while fetching data', async () => {
    // Make the promise never resolve to keep loading state
    mockFetch.mockImplementation(() => new Promise(() => {}));

    const Wrapper = createTestWrapper();
    render(<InmateDetailPage />, { wrapper: Wrapper });

    // Back to search link should be present during loading
    const backLink = page.getByText(/back to search/i);
    await expect.element(backLink).toBeInTheDocument();

    // Check that inmate name header is not yet displayed (still loading)
    await new Promise((resolve) => setTimeout(resolve, 100));
    const heading = page.getByRole('heading', { name: 'Doe, John' });
    const element = await heading.query();
    expect(element).toBeNull();
  });

  it('should display error message when fetch fails', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const Wrapper = createTestWrapper();
    render(<InmateDetailPage />, { wrapper: Wrapper });

    const errorMessage = page.getByText(/network error/i);
    await expect.element(errorMessage).toBeInTheDocument();

    const backLink = page.getByText(/back to search/i);
    await expect.element(backLink).toBeInTheDocument();
  });

  it('should display generic error for non-Error failures', async () => {
    mockFetch.mockResolvedValue(
      new Response('Server Error', {
        status: 500,
        statusText: 'Internal Server Error',
      })
    );

    const Wrapper = createTestWrapper();
    render(<InmateDetailPage />, { wrapper: Wrapper });

    const errorMessage = page.getByText(/server error|internal server error/i);
    await expect.element(errorMessage).toBeInTheDocument();
  });

  it('should display "not found" when inmate does not exist', async () => {
    mockFetch.mockResolvedValue(
      new Response('Not Found', {
        status: 404,
        statusText: 'Not Found',
      })
    );

    const Wrapper = createTestWrapper();
    render(<InmateDetailPage />, { wrapper: Wrapper });

    const notFoundMessage = page.getByText(/inmate not found|not found/i);
    await expect.element(notFoundMessage).toBeInTheDocument();

    const backLink = page.getByText(/back to search/i);
    await expect.element(backLink).toBeInTheDocument();
  });

  it('should display inmate information when loaded successfully', async () => {
    // Mock both the inmate fetch and warnings fetch
    mockFetch
      .mockResolvedValueOnce(
        new Response(JSON.stringify(mockInmate), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(mockWarnings), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

    const Wrapper = createTestWrapper();
    render(<InmateDetailPage />, { wrapper: Wrapper });

    // Check inmate name in header (use first() as it appears in multiple places)
    const inmateName = page.getByText('Doe, John').first();
    await expect.element(inmateName).toBeInTheDocument();

    // Check back link
    const backLink = page.getByText(/back to search/i);
    await expect.element(backLink).toBeInTheDocument();
  });

  it('should display inmate profile section', async () => {
    mockFetch
      .mockResolvedValueOnce(
        new Response(JSON.stringify(mockInmate), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(mockWarnings), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

    const Wrapper = createTestWrapper();
    render(<InmateDetailPage />, { wrapper: Wrapper });

    // Wait for data to load (use first() as name appears in multiple places)
    const inmateName = page.getByText('Doe, John').first();
    await expect.element(inmateName).toBeInTheDocument();

    // Check for unit information
    const unit = page.getByText(/test unit/i);
    await expect.element(unit).toBeInTheDocument();
  });

  it('should display requests section', async () => {
    mockFetch
      .mockResolvedValueOnce(
        new Response(JSON.stringify(mockInmate), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(mockWarnings), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

    const Wrapper = createTestWrapper();
    render(<InmateDetailPage />, { wrapper: Wrapper });

    // Wait for data to load (use first() as name appears in multiple places)
    const inmateName = page.getByText('Doe, John').first();
    await expect.element(inmateName).toBeInTheDocument();

    // Check for request action badge
    const filledBadge = page.getByText('Filled');
    await expect.element(filledBadge).toBeInTheDocument();
  });

  it('should display comments section', async () => {
    mockFetch
      .mockResolvedValueOnce(
        new Response(JSON.stringify(mockInmate), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(mockWarnings), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

    const Wrapper = createTestWrapper();
    render(<InmateDetailPage />, { wrapper: Wrapper });

    // Wait for data to load (use first() as name appears in multiple places)
    const inmateName = page.getByText('Doe, John').first();
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

    mockFetch
      .mockResolvedValueOnce(
        new Response(JSON.stringify(mockFederalInmate), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(mockWarnings), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

    const Wrapper = createTestWrapper();
    render(<InmateDetailPage />, { wrapper: Wrapper });

    // Check that the correct inmate is displayed (use first() as name appears in multiple places)
    const inmateName = page.getByText('Smith, Jane').first();
    await expect.element(inmateName).toBeInTheDocument();

    // Verify API was called with correct params
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/inmates/Federal/67890'),
      expect.anything()
    );
  });

  it('should have back to search link with correct href', async () => {
    mockFetch
      .mockResolvedValueOnce(
        new Response(JSON.stringify(mockInmate), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(mockWarnings), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

    const Wrapper = createTestWrapper();
    render(<InmateDetailPage />, { wrapper: Wrapper });

    const backLink = page.getByText(/back to search/i);
    await expect.element(backLink).toBeInTheDocument();

    const element = await backLink.query();
    expect(element?.getAttribute('href')).toBe('/search');
  });

  it('should render RequestForm and CommentForm', async () => {
    mockFetch
      .mockResolvedValueOnce(
        new Response(JSON.stringify(mockInmate), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(mockWarnings), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

    const Wrapper = createTestWrapper();
    render(<InmateDetailPage />, { wrapper: Wrapper });

    // Wait for data to load (use first() as name appears in multiple places)
    const inmateName = page.getByText('Doe, John').first();
    await expect.element(inmateName).toBeInTheDocument();

    // Check for RequestForm elements
    const requestFormTitle = page.getByText(/add new request/i);
    await expect.element(requestFormTitle).toBeInTheDocument();

    // Check for CommentForm elements
    const commentFormTitle = page.getByText('Add Comment');
    await expect.element(commentFormTitle).toBeInTheDocument();
  });
});
