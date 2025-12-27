import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { createWrapper } from '@/test/utils';
import { Header } from './Header';
import { GlobalSearchProvider } from '@/contexts/GlobalSearchContext';
import type { ReactNode } from 'react';

const mockNavigate = vi.fn();
let mockPathname = '/';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: mockPathname }),
  };
});

// Mock GlobalSearch to simplify testing
vi.mock('./GlobalSearch', () => ({
  GlobalSearch: () => <input placeholder="Search inmates..." />,
}));

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

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname = '/';
  });

  it('should render site title/logo link', async () => {
    const Wrapper = createTestWrapper();
    render(<Header />, { wrapper: Wrapper });

    const logo = page.getByText('Inside Books Project');
    await expect.element(logo).toBeInTheDocument();

    const element = await logo.query();
    expect(element?.getAttribute('href')).toBe('/');
  });

  it('should render all navigation links', async () => {
    const Wrapper = createTestWrapper();
    render(<Header />, { wrapper: Wrapper });

    const homeLink = page.getByRole('link', { name: 'Home' });
    await expect.element(homeLink).toBeInTheDocument();

    const searchLink = page.getByRole('link', { name: 'Search' });
    await expect.element(searchLink).toBeInTheDocument();

    const unitsLink = page.getByRole('link', { name: 'Units' });
    await expect.element(unitsLink).toBeInTheDocument();
  });

  it('should have correct href attributes for navigation links', async () => {
    const Wrapper = createTestWrapper();
    render(<Header />, { wrapper: Wrapper });

    const homeLink = page.getByRole('link', { name: 'Home' });
    const homeElement = await homeLink.query();
    expect(homeElement?.getAttribute('href')).toBe('/');

    const searchLink = page.getByRole('link', { name: 'Search' });
    const searchElement = await searchLink.query();
    expect(searchElement?.getAttribute('href')).toBe('/search');

    const unitsLink = page.getByRole('link', { name: 'Units' });
    const unitsElement = await unitsLink.query();
    expect(unitsElement?.getAttribute('href')).toBe('/units');
  });

  it('should highlight active navigation link on home page', async () => {
    mockPathname = '/';

    const Wrapper = createTestWrapper();
    render(<Header />, { wrapper: Wrapper });

    const homeLink = page.getByRole('link', { name: 'Home' });
    const homeElement = await homeLink.query();
    expect(homeElement?.className).toContain('text-foreground');
    expect(homeElement?.className).not.toContain('text-muted-foreground');
  });

  it('should highlight active navigation link on search page', async () => {
    mockPathname = '/search';

    const Wrapper = createTestWrapper();
    render(<Header />, { wrapper: Wrapper });

    const searchLink = page.getByRole('link', { name: 'Search' });
    const searchElement = await searchLink.query();
    expect(searchElement?.className).toContain('text-foreground');
    expect(searchElement?.className).not.toContain('text-muted-foreground');
  });

  it('should highlight active navigation link on units page', async () => {
    mockPathname = '/units';

    const Wrapper = createTestWrapper();
    render(<Header />, { wrapper: Wrapper });

    const unitsLink = page.getByRole('link', { name: 'Units' });
    const unitsElement = await unitsLink.query();
    expect(unitsElement?.className).toContain('text-foreground');
    expect(unitsElement?.className).not.toContain('text-muted-foreground');
  });

  it('should render inactive navigation links with muted styling', async () => {
    mockPathname = '/';

    const Wrapper = createTestWrapper();
    render(<Header />, { wrapper: Wrapper });

    // Search and Units should be muted when Home is active
    const searchLink = page.getByRole('link', { name: 'Search' });
    const searchElement = await searchLink.query();
    expect(searchElement?.className).toContain('text-muted-foreground');

    const unitsLink = page.getByRole('link', { name: 'Units' });
    const unitsElement = await unitsLink.query();
    expect(unitsElement?.className).toContain('text-muted-foreground');
  });

  it('should render GlobalSearch component', async () => {
    const Wrapper = createTestWrapper();
    render(<Header />, { wrapper: Wrapper });

    // GlobalSearch is mocked to render a search input
    const searchInput = page.getByPlaceholder('Search inmates...');
    await expect.element(searchInput).toBeInTheDocument();
  });

  it('should have correct header structure and styling', async () => {
    const Wrapper = createTestWrapper();
    render(<Header />, { wrapper: Wrapper });

    // Check that header element exists
    const header = page.getByRole('banner');
    await expect.element(header).toBeInTheDocument();

    // Check that logo is present
    const logo = page.getByText('Inside Books Project');
    await expect.element(logo).toBeInTheDocument();
  });
});
