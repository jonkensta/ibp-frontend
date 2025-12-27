import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { createWrapper } from '@/test/utils';
import { UnitDirectory } from './UnitDirectory';

const mockFetch = vi.fn();
window.fetch = mockFetch;

// Mock UI Select components to avoid Radix/React conflicts
vi.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, children }: { value: string; onValueChange: (v: string) => void; children: React.ReactNode }) => (
    <div data-select-value={value}>
      <button onClick={() => onValueChange && onValueChange('Texas')}>Change to Texas</button>
      <button onClick={() => onValueChange && onValueChange('Federal')}>Change to Federal</button>
      <button onClick={() => onValueChange && onValueChange('all')}>Change to All</button>
      {children}
    </div>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectValue: ({ placeholder }: { placeholder: string }) => <span>{placeholder}</span>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) => (
    <option value={value}>{children}</option>
  ),
}));

const mockUnits = [
  {
    jurisdiction: 'Texas',
    name: 'Austin Unit',
    street1: '123 Main St',
    street2: null,
    city: 'Austin',
    state: 'TX',
    zipcode: '78701',
    url: null,
    shipping_method: 'Box',
  },
  {
    jurisdiction: 'Federal',
    name: 'Federal Prison',
    street1: '456 Oak Ave',
    street2: null,
    city: 'Houston',
    state: 'TX',
    zipcode: '77001',
    url: null,
    shipping_method: 'Envelope',
  },
  {
    jurisdiction: 'Texas',
    name: 'Dallas Unit',
    street1: '789 Elm St',
    street2: null,
    city: 'Dallas',
    state: 'TX',
    zipcode: '75201',
    url: null,
    shipping_method: null,
  },
];

describe('UnitDirectory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  it('should display loading state while fetching units', async () => {
    // Make the promise never resolve to keep loading state
    mockFetch.mockImplementation(() => new Promise(() => {}));

    const Wrapper = createWrapper();
    render(<UnitDirectory />, { wrapper: Wrapper });

    const loading = page.getByText(/loading units/i);
    await expect.element(loading).toBeInTheDocument();
  });

  it('should display error message when fetch fails', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const Wrapper = createWrapper();
    render(<UnitDirectory />, { wrapper: Wrapper });

    const errorMessage = page.getByText(/failed to load units/i);
    await expect.element(errorMessage).toBeInTheDocument();
  });

  it('should display units in table when loaded successfully', async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify(mockUnits), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const Wrapper = createWrapper();
    render(<UnitDirectory />, { wrapper: Wrapper });

    // Check for unit names
    const austinUnit = page.getByText('Austin Unit');
    await expect.element(austinUnit).toBeInTheDocument();

    const federalPrison = page.getByText('Federal Prison');
    await expect.element(federalPrison).toBeInTheDocument();

    const dallasUnit = page.getByText('Dallas Unit');
    await expect.element(dallasUnit).toBeInTheDocument();
  });

  it('should display unit count in header', async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify(mockUnits), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const Wrapper = createWrapper();
    render(<UnitDirectory />, { wrapper: Wrapper });

    const countText = page.getByText(/unit directory \(3 units\)/i);
    await expect.element(countText).toBeInTheDocument();
  });

  it('should filter units by search query (name)', async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify(mockUnits), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const Wrapper = createWrapper();
    render(<UnitDirectory />, { wrapper: Wrapper });

    // Wait for initial load
    const austinUnit = page.getByText('Austin Unit');
    await expect.element(austinUnit).toBeInTheDocument();

    // Search for "Austin"
    const searchInput = page.getByLabelText(/search/i);
    await searchInput.fill('Austin');

    // Should only show Austin Unit
    await expect.element(austinUnit).toBeInTheDocument();

    // Others should not be visible
    const federalPrison = page.getByText('Federal Prison');
    const federalElement = await federalPrison.query();
    expect(federalElement).toBeNull();
  });

  it('should filter units by search query (city)', async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify(mockUnits), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const Wrapper = createWrapper();
    render(<UnitDirectory />, { wrapper: Wrapper });

    // Wait for initial load
    const austinUnit = page.getByText('Austin Unit');
    await expect.element(austinUnit).toBeInTheDocument();

    // Search for "Houston"
    const searchInput = page.getByLabelText(/search/i);
    await searchInput.fill('Houston');

    // Should only show Federal Prison
    const federalPrison = page.getByText('Federal Prison');
    await expect.element(federalPrison).toBeInTheDocument();

    // Austin Unit should not be visible
    const austinElement = await austinUnit.query();
    expect(austinElement).toBeNull();
  });

  it('should display "No units found" when search has no matches', async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify(mockUnits), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const Wrapper = createWrapper();
    render(<UnitDirectory />, { wrapper: Wrapper });

    // Wait for initial load
    const austinUnit = page.getByText('Austin Unit');
    await expect.element(austinUnit).toBeInTheDocument();

    // Search for something that doesn't exist
    const searchInput = page.getByLabelText(/search/i);
    await searchInput.fill('NonexistentCity');

    const noResults = page.getByText(/no units found/i);
    await expect.element(noResults).toBeInTheDocument();
  });

  it('should sort units by name in ascending order by default', async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify(mockUnits), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const Wrapper = createWrapper();
    render(<UnitDirectory />, { wrapper: Wrapper });

    // Wait for load
    const austinUnit = page.getByText('Austin Unit');
    await expect.element(austinUnit).toBeInTheDocument();

    // Check that ascending indicator is shown
    const nameHeader = page.getByText(/name ↑/i);
    await expect.element(nameHeader).toBeInTheDocument();
  });

  it('should toggle sort direction when clicking same column', async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify(mockUnits), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const Wrapper = createWrapper();
    render(<UnitDirectory />, { wrapper: Wrapper });

    // Wait for load
    const austinUnit = page.getByText('Austin Unit');
    await expect.element(austinUnit).toBeInTheDocument();

    // Initially ascending
    const nameHeader = page.getByText(/name ↑/i);
    await expect.element(nameHeader).toBeInTheDocument();

    // Click name header to toggle
    await nameHeader.click();

    // Should now be descending
    const nameHeaderDesc = page.getByText(/name ↓/i);
    await expect.element(nameHeaderDesc).toBeInTheDocument();
  });

  it('should change sort field when clicking different column', async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify(mockUnits), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const Wrapper = createWrapper();
    render(<UnitDirectory />, { wrapper: Wrapper });

    // Wait for load
    const austinUnit = page.getByText('Austin Unit');
    await expect.element(austinUnit).toBeInTheDocument();

    // Click city header
    const cityHeader = page.getByText('City');
    await cityHeader.click();

    // Should now show city ascending
    const cityHeaderAsc = page.getByText(/city ↑/i);
    await expect.element(cityHeaderAsc).toBeInTheDocument();
  });

  it('should display shipping method or N/A', async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify(mockUnits), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const Wrapper = createWrapper();
    render(<UnitDirectory />, { wrapper: Wrapper });

    // Wait for load
    const austinUnit = page.getByText('Austin Unit');
    await expect.element(austinUnit).toBeInTheDocument();

    // Check for actual shipping methods
    const box = page.getByText('Box');
    await expect.element(box).toBeInTheDocument();

    const envelope = page.getByText('Envelope');
    await expect.element(envelope).toBeInTheDocument();

    // Check for N/A when null
    const na = page.getByText('N/A');
    await expect.element(na).toBeInTheDocument();
  });

  it('should have links to individual unit pages', async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify(mockUnits), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const Wrapper = createWrapper();
    render(<UnitDirectory />, { wrapper: Wrapper });

    // Wait for load
    const austinUnit = page.getByText('Austin Unit');
    await expect.element(austinUnit).toBeInTheDocument();

    const element = await austinUnit.query();
    expect(element?.getAttribute('href')).toBe('/units/Texas/Austin%20Unit');
  });

  it('should display table headers', async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify(mockUnits), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const Wrapper = createWrapper();
    render(<UnitDirectory />, { wrapper: Wrapper });

    // Wait for load
    const austinUnit = page.getByText('Austin Unit');
    await expect.element(austinUnit).toBeInTheDocument();

    // Check for all table headers - check for sort indicators which are unique to headers
    const nameHeader = page.getByText(/name ↑/i);
    await expect.element(nameHeader).toBeInTheDocument();

    // Check for other headers (not sortable ones appear as plain text)
    const shippingHeader = page.getByText('Shipping Method');
    await expect.element(shippingHeader).toBeInTheDocument();
  });

  it('should display all unit information in table rows', async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify(mockUnits), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const Wrapper = createWrapper();
    render(<UnitDirectory />, { wrapper: Wrapper });

    // Wait for load
    const austinUnit = page.getByText('Austin Unit');
    await expect.element(austinUnit).toBeInTheDocument();

    // Check for jurisdiction
    const texas = page.getByText('Texas').first();
    await expect.element(texas).toBeInTheDocument();

    // Check for city - use exact match to avoid "Austin Unit"
    const austin = page.getByRole('cell', { name: 'Austin', exact: true });
    await expect.element(austin).toBeInTheDocument();

    // Check for state
    const tx = page.getByText('TX').first();
    await expect.element(tx).toBeInTheDocument();
  });
});
