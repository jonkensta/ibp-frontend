import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { BrowserRouter } from 'react-router-dom';
import { NotFoundPage } from './NotFoundPage';

describe('NotFoundPage', () => {
  it('should render 404 message', async () => {
    render(
      <BrowserRouter>
        <NotFoundPage />
      </BrowserRouter>
    );

    const title = page.getByText(/page not found/i);
    await expect.element(title).toBeInTheDocument();

    const code = page.getByText('404');
    await expect.element(code).toBeInTheDocument();
  });

  it('should have navigation links', async () => {
    render(
      <BrowserRouter>
        <NotFoundPage />
      </BrowserRouter>
    );

    const homeLink = page.getByRole('link', { name: /go to home/i });
    await expect.element(homeLink).toBeInTheDocument();

    // Check href attribute (browser mode specific)
    const homeElement = await homeLink.query();
    expect(homeElement?.getAttribute('href')).toBe('/');

    const searchLink = page.getByRole('link', { name: /search inmates/i });
    await expect.element(searchLink).toBeInTheDocument();

    const searchElement = await searchLink.query();
    expect(searchElement?.getAttribute('href')).toBe('/search');
  });
});
