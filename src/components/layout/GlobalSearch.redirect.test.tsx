import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { createTestQueryClient } from '@/test/utils';
import { searchInmates } from '@/lib/api/inmates';
import { SearchPage } from '@/pages/SearchPage';
import { GlobalSearch } from './GlobalSearch';

// Uses the real router (unlike GlobalSearch.test.tsx, which mocks
// useNavigate): the bug depends on navigate() changing identity after a
// navigation, which re-ran the auto-redirect effect.
vi.mock('@/lib/api/inmates');

const INMATE_ID = '2584921';

// Every distinct history entry (location.key) the inmate page saw. The inmate
// page records one lookup per key, so each extra entry is an extra POST
// /lookups; two at once raced on the backend and one failed with a 500.
let inmateKeys: string[] = [];

function InmatePage() {
  const location = useLocation();
  if (!inmateKeys.includes(location.key)) inmateKeys.push(location.key);
  return <div>inmate {location.pathname}</div>;
}

async function renderApp(initialPath: string) {
  await render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter initialEntries={[initialPath]}>
        <GlobalSearch />
        <Routes>
          <Route path="/inmates/:jurisdiction/:id" element={<InmatePage />} />
          <Route path="/search" element={<SearchPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 800));

describe('single-result auto-redirect', () => {
  beforeEach(() => {
    inmateKeys = [];
    vi.mocked(searchInmates).mockImplementation(async (query: string) => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return {
        inmates: query.endsWith(INMATE_ID)
          ? [{ jurisdiction: 'Texas', id: Number(INMATE_ID) }]
          : [],
        errors: [],
      } as unknown as Awaited<ReturnType<typeof searchInmates>>;
    });
  });

  it('navigates to the inmate once from the header search', async () => {
    await renderApp('/inmates/Texas/1');

    await userEvent.type(page.getByPlaceholder(/search inmates/i), `0${INMATE_ID}`);
    await expect.element(page.getByText(`inmate /inmates/Texas/${INMATE_ID}`)).toBeInTheDocument();
    await settle();

    // The starting inmate's entry plus exactly one for the redirect target.
    expect(inmateKeys).toHaveLength(2);
  });

  it('navigates to the inmate once when Enter beats the debounce', async () => {
    await renderApp('/inmates/Texas/1');

    await userEvent.type(page.getByPlaceholder(/search inmates/i), `0${INMATE_ID}{Enter}`);
    await expect.element(page.getByText(`inmate /inmates/Texas/${INMATE_ID}`)).toBeInTheDocument();
    await settle();

    expect(inmateKeys).toHaveLength(2);
  });
});
