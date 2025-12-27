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
});
