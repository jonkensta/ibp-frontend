import { describe, it, expect, vi } from 'vitest';
import { render, screen } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { InmateSearchForm } from './InmateSearchForm';

describe('InmateSearchForm', () => {
  it('should render search input and button', async () => {
    const onSearch = vi.fn();
    render(<InmateSearchForm onSearch={onSearch} isLoading={false} />);

    const input = screen.getByPlaceholder(/search by name or ID/i);
    expect(input).toBeDefined();

    const button = screen.getByRole('button', { name: /search/i });
    expect(button).toBeDefined();
  });

  it('should call onSearch when form is submitted', async () => {
    const onSearch = vi.fn();
    render(<InmateSearchForm onSearch={onSearch} isLoading={false} />);

    const input = screen.getByPlaceholder(/search by name or ID/i);
    await input.fill('Smith');

    const button = screen.getByRole('button', { name: /search/i });
    await button.click();

    expect(onSearch).toHaveBeenCalledWith('Smith');
  });

  it('should display initial query value', () => {
    const onSearch = vi.fn();
    render(
      <InmateSearchForm
        onSearch={onSearch}
        isLoading={false}
        initialQuery="Johnson"
      />
    );

    const input = screen.getByPlaceholder(/search by name or ID/i);
    expect(input.element().value).toBe('Johnson');
  });

  it('should disable button when loading', () => {
    const onSearch = vi.fn();
    render(<InmateSearchForm onSearch={onSearch} isLoading={true} />);

    const button = screen.getByRole('button', { name: /searching/i });
    expect(button.element().disabled).toBe(true);
  });

  it('should update query when typing', async () => {
    const onSearch = vi.fn();
    render(<InmateSearchForm onSearch={onSearch} isLoading={false} />);

    const input = screen.getByPlaceholder(/search by name or ID/i);
    await input.fill('Test Query');

    expect(input.element().value).toBe('Test Query');
  });
});
