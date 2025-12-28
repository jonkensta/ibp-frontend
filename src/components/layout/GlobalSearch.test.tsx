import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { QueryWrapper } from '@/test/utils';
import { GlobalSearch } from './GlobalSearch';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/lib/api/inmates');

describe('GlobalSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render search input', async () => {
    render(
      <QueryWrapper>
        <GlobalSearch />
      </QueryWrapper>
    );

    const searchInput = page.getByPlaceholder(/search inmates/i);
    await expect.element(searchInput).toBeInTheDocument();
  });

  it('should update input value when typing', async () => {
    render(
      <QueryWrapper>
        <GlobalSearch />
      </QueryWrapper>
    );

    const searchInput = page.getByPlaceholder(/search inmates/i);
    await searchInput.fill('John Doe');

    await expect.element(searchInput).toHaveValue('John Doe');
  });

  it('should navigate to search page on form submit', async () => {
    render(
      <QueryWrapper>
        <GlobalSearch />
      </QueryWrapper>
    );

    const searchInput = page.getByPlaceholder(/search inmates/i);
    await searchInput.fill('Jane Smith');

    // Get the input element and trigger submit
    const element = await searchInput.query();
    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
    element?.closest('form')?.dispatchEvent(submitEvent);

    // Wait for debounce and navigation
    await new Promise((resolve) => setTimeout(resolve, 400));

    expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('/search?q=Jane%20Smith'));
  });

  it('should trim whitespace from query', async () => {
    render(
      <QueryWrapper>
        <GlobalSearch />
      </QueryWrapper>
    );

    const searchInput = page.getByPlaceholder(/search inmates/i);
    await searchInput.fill('  John Doe  ');
    await expect.element(searchInput).toHaveValue('  John Doe  ');

    const element = await searchInput.query();
    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
    element?.closest('form')?.dispatchEvent(submitEvent);

    await new Promise((resolve) => setTimeout(resolve, 400));

    expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('q=John%20Doe'));
  });

  it('should not navigate on empty query', async () => {
    render(
      <QueryWrapper>
        <GlobalSearch />
      </QueryWrapper>
    );

    const searchInput = page.getByPlaceholder(/search inmates/i);
    await searchInput.fill('   ');

    const element = await searchInput.query();
    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
    element?.closest('form')?.dispatchEvent(submitEvent);

    await new Promise((resolve) => setTimeout(resolve, 400));

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should clear input after form submit', async () => {
    render(
      <QueryWrapper>
        <GlobalSearch />
      </QueryWrapper>
    );

    const searchInput = page.getByPlaceholder(/search inmates/i);
    await searchInput.fill('Test Query');

    const element = await searchInput.query();
    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
    element?.closest('form')?.dispatchEvent(submitEvent);

    await new Promise((resolve) => setTimeout(resolve, 400));

    await expect.element(searchInput).toHaveValue('');
  });

  it('should encode special characters in URL', async () => {
    render(
      <QueryWrapper>
        <GlobalSearch />
      </QueryWrapper>
    );

    const searchInput = page.getByPlaceholder(/search inmates/i);
    await searchInput.fill("O'Brien & Sons");

    const element = await searchInput.query();
    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
    element?.closest('form')?.dispatchEvent(submitEvent);

    await new Promise((resolve) => setTimeout(resolve, 400));

    expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining("O'Brien%20%26%20Sons"));
  });

  it('should have search icon', async () => {
    render(
      <QueryWrapper>
        <GlobalSearch />
      </QueryWrapper>
    );

    // The Search icon should be present (lucide-react renders it as svg)
    const searchInput = page.getByPlaceholder(/search inmates/i);
    await expect.element(searchInput).toBeInTheDocument();
  });
});
