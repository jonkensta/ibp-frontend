import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { createWrapper } from '@/test/utils';
import { UnitDetailPage } from './UnitDetailPage';

const mockFetch = vi.fn();
window.fetch = mockFetch;

const { mockUseParams } = vi.hoisted(() => {
  return { mockUseParams: vi.fn() };
});

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: mockUseParams,
  };
});

// Mock UnitForm to avoid testing its internal logic here, focus on the page loading/error states
vi.mock('@/components/units', async () => {
  const actual = await vi.importActual('@/components/units');
  return {
    ...actual,
    UnitForm: ({ unit }: any) => <div data-testid="unit-form">UnitForm: {unit.name}</div>,
    UnitFormSkeleton: () => <div data-testid="unit-form-skeleton">Loading...</div>,
  };
});

const mockUnit = {
  jurisdiction: 'Texas',
  name: 'Test Unit',
  street1: '123 Main St',
  street2: null,
  city: 'Austin',
  state: 'TX',
  zipcode: '78701',
  url: null,
  shipping_method: 'Box',
};

describe('UnitDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    mockUseParams.mockReturnValue({ jurisdiction: 'Texas', name: 'Test Unit' });
  });

  it('should display loading skeleton while fetching data', async () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));

    const Wrapper = createWrapper();
    render(<UnitDetailPage />, { wrapper: Wrapper });

    const title = page.getByText(/unit details/i);
    await expect.element(title).toBeInTheDocument();

    const skeleton = page.getByTestId('unit-form-skeleton');
    await expect.element(skeleton).toBeInTheDocument();
  });

  it('should display error message when fetch fails', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const Wrapper = createWrapper();
    render(<UnitDetailPage />, { wrapper: Wrapper });

    const alert = page.getByText(/failed to load unit/i);
    await expect.element(alert).toBeInTheDocument();
  });

  it('should display unit information when loaded successfully', async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify(mockUnit), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const Wrapper = createWrapper();
    render(<UnitDetailPage />, { wrapper: Wrapper });

    // Header should contain unit name
    const heading = page.getByRole('heading', { name: 'Test Unit' });
    await expect.element(heading).toBeInTheDocument();

    // Jurisdiction should be displayed
    const jurisdiction = page.getByText(/texas jurisdiction/i);
    await expect.element(jurisdiction).toBeInTheDocument();

    // Mocked UnitForm should be rendered
    const unitForm = page.getByTestId('unit-form');
    await expect.element(unitForm).toBeInTheDocument();
    await expect.element(unitForm).toHaveTextContent('UnitForm: Test Unit');
  });

  it('should fetch data with correct URL parameters', async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify(mockUnit), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const Wrapper = createWrapper();
    render(<UnitDetailPage />, { wrapper: Wrapper });

    // Wait for render
    await expect.element(page.getByTestId('unit-form')).toBeInTheDocument();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/units/Texas/Test%20Unit'),
      expect.anything()
    );
  });
});
