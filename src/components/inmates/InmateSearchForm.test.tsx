import { describe, it, expect, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { InmateSearchForm } from './InmateSearchForm';

describe('InmateSearchForm', () => {
  it('should render search input and button', async () => {
    const onSearch = vi.fn();
    render(<InmateSearchForm onSearch={onSearch} isLoading={false} />);

    const input = page.getByRole('textbox');
    await expect.element(input).toBeInTheDocument();

    const button = page.getByRole('button', { name: /search/i });
    await expect.element(button).toBeInTheDocument();
  });

  it('should call onSearch when form is submitted', async () => {
    const onSearch = vi.fn();
    render(<InmateSearchForm onSearch={onSearch} isLoading={false} />);

    const input = page.getByRole('textbox');
    await input.fill('Smith');

    const button = page.getByRole('button', { name: /search/i });
    await button.click();

    expect(onSearch).toHaveBeenCalledWith('Smith');
  });

  it('should display initial query value', async () => {
    const onSearch = vi.fn();
    render(<InmateSearchForm onSearch={onSearch} isLoading={false} initialQuery="Johnson" />);

    const input = page.getByRole('textbox');
    await expect.element(input).toHaveValue('Johnson');
  });

  it('should disable button when loading', async () => {
    const onSearch = vi.fn();
    render(<InmateSearchForm onSearch={onSearch} isLoading={true} />);

    const button = page.getByRole('button', { name: /searching/i });
    await expect.element(button).toBeDisabled();
  });

  it('should update query when typing', async () => {
    const onSearch = vi.fn();
    render(<InmateSearchForm onSearch={onSearch} isLoading={false} />);

    const input = page.getByRole('textbox');
    await input.fill('Test Query');

    await expect.element(input).toHaveValue('Test Query');
  });
});
