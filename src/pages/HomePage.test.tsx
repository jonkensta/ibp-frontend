import { describe, it, expect, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { BrowserRouter } from 'react-router-dom';
import { HomePage } from './HomePage';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('HomePage', () => {
  it('should render page title and description', async () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    const title = page.getByText(/inside books project/i);
    await expect.element(title).toBeInTheDocument();

    const description = page.getByText(/search for inmates to view their information/i);
    await expect.element(description).toBeInTheDocument();
  });

  it('should render search form', async () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    const searchInput = page.getByRole('textbox');
    await expect.element(searchInput).toBeInTheDocument();

    const searchButton = page.getByRole('button', { name: /search/i });
    await expect.element(searchButton).toBeInTheDocument();
  });

  it('should navigate to search page when search is submitted', async () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    const searchInput = page.getByRole('textbox');
    await searchInput.fill('John Doe');

    const searchButton = page.getByRole('button', { name: /search/i });
    await searchButton.click();

    expect(mockNavigate).toHaveBeenCalledWith('/search?q=John%20Doe');
  });

  it('should encode special characters in search query', async () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    const searchInput = page.getByRole('textbox');
    await searchInput.fill("O'Brien & Smith");

    const searchButton = page.getByRole('button', { name: /search/i });
    await searchButton.click();

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.stringContaining("O'Brien%20%26%20Smith")
    );
  });

  it('should have proper page structure with max-width constraint', async () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    // The search form should be in a max-width container
    const title = page.getByText(/inside books project/i);
    await expect.element(title).toBeInTheDocument();

    const description = page.getByText(/search for inmates/i);
    await expect.element(description).toBeInTheDocument();
  });
});
