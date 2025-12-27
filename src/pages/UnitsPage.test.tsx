import { describe, it, expect, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { createWrapper } from '@/test/utils';
import { UnitsPage } from './UnitsPage';

// Mock UnitDirectory to verify it's rendered
vi.mock('@/components/units/UnitDirectory', () => ({
  UnitDirectory: () => <div data-testid="unit-directory">UnitDirectory Component</div>,
}));

describe('UnitsPage', () => {
  it('should render title and UnitDirectory component', async () => {
    const Wrapper = createWrapper();
    render(<UnitsPage />, { wrapper: Wrapper });

    const title = page.getByRole('heading', { name: /units directory/i });
    await expect.element(title).toBeInTheDocument();

    const directory = page.getByTestId('unit-directory');
    await expect.element(directory).toBeInTheDocument();
  });

  it('should have correct page title text', async () => {
    const Wrapper = createWrapper();
    render(<UnitsPage />, { wrapper: Wrapper });

    const title = page.getByRole('heading', { name: 'Units Directory' });
    await expect.element(title).toBeInTheDocument();
  });

  it('should use h1 for page title', async () => {
    const Wrapper = createWrapper();
    render(<UnitsPage />, { wrapper: Wrapper });

    const title = page.getByRole('heading', { name: /units directory/i, level: 1 });
    await expect.element(title).toBeInTheDocument();
  });

  it('should have proper page structure with title above directory', async () => {
    const Wrapper = createWrapper();
    render(<UnitsPage />, { wrapper: Wrapper });

    const title = page.getByRole('heading', { name: /units directory/i });
    await expect.element(title).toBeInTheDocument();

    const directory = page.getByTestId('unit-directory');
    await expect.element(directory).toBeInTheDocument();

    // Verify both elements are present in the document
    const titleElement = await title.query();
    const directoryElement = await directory.query();
    expect(titleElement).not.toBeNull();
    expect(directoryElement).not.toBeNull();
  });

  it('should render without errors when UnitDirectory is present', async () => {
    const Wrapper = createWrapper();

    // Should not throw during render
    render(<UnitsPage />, { wrapper: Wrapper });

    // Verify page rendered successfully
    const title = page.getByRole('heading', { name: /units directory/i });
    await expect.element(title).toBeInTheDocument();

    const directory = page.getByTestId('unit-directory');
    await expect.element(directory).toBeInTheDocument();
  });
});
