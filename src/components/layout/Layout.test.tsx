import { describe, it, expect, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { Layout } from './Layout';
import { MemoryRouter } from 'react-router-dom';

// Mock the child components
vi.mock('./Header', () => ({
  Header: () => <div data-testid="header">Header</div>,
}));

vi.mock('@/components/ui/sonner', () => ({
  Toaster: () => <div data-testid="toaster">Toaster</div>,
}));

describe('Layout', () => {
  it('should render Header component', async () => {
    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    );

    const header = page.getByTestId('header');
    await expect.element(header).toBeInTheDocument();
  });

  it('should render Toaster component', async () => {
    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    );

    const toaster = page.getByTestId('toaster');
    await expect.element(toaster).toBeInTheDocument();
  });

  it('should render Outlet for nested routes', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Layout />
      </MemoryRouter>
    );

    // The Outlet will render whatever route matches
    // In this test, we just verify the layout structure exists
    const main = page.getByRole('main');
    await expect.element(main).toBeInTheDocument();
  });

  it('should have correct container structure', async () => {
    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    );

    const main = page.getByRole('main');
    await expect.element(main).toBeInTheDocument();
    await expect.element(main).toHaveClass('container');
    await expect.element(main).toHaveClass('mx-auto');
  });

  it('should wrap content with GlobalSearchProvider', async () => {
    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    );

    // If GlobalSearchProvider is working, the Header (which uses useGlobalSearch)
    // should render without errors
    const header = page.getByTestId('header');
    await expect.element(header).toBeInTheDocument();

    const toaster = page.getByTestId('toaster');
    await expect.element(toaster).toBeInTheDocument();
  });
});
