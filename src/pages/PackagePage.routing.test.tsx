// The package page under real routing (the workspace really unmounts when the
// route changes) and the app's production query settings (5-minute staleTime).
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { Link, MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { createQueryClient } from '@/lib/queryClient';
import { ApiError } from '@/lib/api/client';
import { getPackage } from '@/lib/api/packages';
import { addPackageItem, updatePackageItem } from '@/lib/api/items';
import { getBook } from '@/lib/api/books';
import type { Book, Package, PackageItem, PackageItemCreated } from '@/types';
import { PackagePage } from './PackagePage';

vi.mock('@/lib/api/packages');
vi.mock('@/lib/api/items');
vi.mock('@/lib/api/books');
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

function makeItem(overrides: Partial<PackageItem> = {}): PackageItem {
  return {
    id: 1,
    isbn: '9780140449136',
    title: 'The Odyssey',
    author: 'Homer',
    source: 'isbn',
    revision: 0,
    registered_at: null,
    created_at: '2026-11-05T10:00:00Z',
    updated_at: '2026-11-05T10:00:00Z',
    ...overrides,
  };
}

function makePackage(code: string, items: PackageItem[] = [makeItem()]): Package {
  return {
    request: {
      index: 2,
      code,
      date_processed: '2026-11-03',
      date_postmarked: '2026-10-28',
      action: 'Filled',
      contents_revision: 1,
    },
    inmate: {
      jurisdiction: 'Texas',
      id: 1234567,
      first_name: 'John',
      last_name: 'Doe',
      race: null,
      sex: null,
      release: null,
      url: null,
      unit: null,
    },
    items,
    warnings: {},
  };
}

function created(data: {
  isbn?: string | null;
  title: string;
  author: string;
}): PackageItemCreated {
  return {
    ...makeItem({ id: 9, isbn: data.isbn ?? null, title: data.title, author: data.author }),
    previously_sent: [],
  };
}

const dune: Book = {
  isbn: '9780441172719',
  title: 'Dune',
  author: 'Frank Herbert',
  source: 'isbndb',
  confidence: 'high',
};

/** A promise and the functions settling it. */
function deferred<T>() {
  let resolve: (value: T) => void = () => {};
  let reject: (error: unknown) => void = () => {};
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** Browser Back, captured from the router. */
const back = { go: () => {} };
function BackHandle() {
  const navigate = useNavigate();
  useEffect(() => {
    back.go = () => navigate(-1);
  }, [navigate]);
  return null;
}

async function renderApp(path = '/packages/TEX-1234567-2') {
  await render(
    <QueryClientProvider client={createQueryClient()}>
      <MemoryRouter initialEntries={['/units', path]} initialIndex={1}>
        <BackHandle />
        <Link to="/units">Leave</Link>
        <Routes>
          <Route path="/packages" element={<p>Station page</p>} />
          <Route path="/packages/:code" element={<PackagePage />} />
          <Route path="/units" element={<p>Units page</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
  await expect.element(page.getByRole('heading', { name: 'John Doe' })).toBeInTheDocument();
}

const isbnInput = () => page.getByLabelText("Scan a book's ISBN");
const titleInput = () => page.getByLabelText('Title', { exact: true });

async function scanIsbn(text: string) {
  await isbnInput().fill(text);
  await userEvent.keyboard('{Enter}');
}

describe('PackagePage with real routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getPackage).mockReset();
    vi.mocked(getBook).mockReset();
    vi.mocked(addPackageItem).mockReset();
    vi.mocked(updatePackageItem).mockReset();
    vi.mocked(getPackage).mockImplementation(async (code) => makePackage(code));
    vi.mocked(addPackageItem).mockImplementation(async (_code, data) => created(data));
  });

  it('holds a failed lookup until an Edit opened meanwhile is closed', async () => {
    const lookup = deferred<Book>();
    vi.mocked(getBook).mockReturnValue(lookup.promise);
    await renderApp();

    await scanIsbn('9780000000002');
    await page.getByRole('button', { name: 'Edit The Odyssey' }).click();
    await expect.element(titleInput()).toHaveValue('The Odyssey');

    lookup.reject(new ApiError(404, 'Book not found.'));

    // The edit stays as it was.
    await expect.element(page.getByText(/needs typing in once this dialog/)).toBeInTheDocument();
    await expect.element(page.getByRole('heading', { name: 'Edit book' })).toBeInTheDocument();
    await expect.element(titleInput()).toHaveValue('The Odyssey');

    await page.getByRole('button', { name: 'Cancel' }).click();

    // Then the scanned book's form opens, empty but for its ISBN.
    await expect.element(page.getByRole('heading', { name: 'Add a book' })).toBeInTheDocument();
    await expect.element(page.getByLabelText('ISBN (optional)')).toHaveValue('9780000000002');
    await expect.element(titleInput()).toHaveValue('');
    await expect.element(page.getByLabelText('Author')).toHaveValue('');

    await titleInput().fill('A Found Book');
    await page.getByLabelText('Author').fill('Some Author');
    await page.getByRole('button', { name: 'Add book' }).click();

    await vi.waitFor(() => expect(addPackageItem).toHaveBeenCalledTimes(1));
    expect(addPackageItem).toHaveBeenCalledWith('TEX-1234567-2', {
      isbn: '9780000000002',
      title: 'A Found Book',
      author: 'Some Author',
      source: 'manual',
    });
    expect(updatePackageItem).not.toHaveBeenCalled();
  });

  it('keeps Done disabled until pending scans are recorded', async () => {
    const lookup = deferred<Book>();
    vi.mocked(getBook).mockReturnValue(lookup.promise);
    await renderApp();

    await scanIsbn(dune.isbn);
    const done = page.getByRole('button', { name: 'Done' });
    await expect.element(done).toBeDisabled();
    await expect
      .element(page.getByText('Waiting for 1 scanned book to be recorded...'))
      .toBeVisible();

    lookup.resolve(dune);
    await vi.waitFor(() => expect(addPackageItem).toHaveBeenCalledTimes(1));
    await expect.element(done).toBeEnabled();
    await done.click();
    await expect.element(page.getByText('Station page')).toBeInTheDocument();
  });

  it('drops a package label scanned in the ISBN box and keeps scanning into this package', async () => {
    const lookup = deferred<Book>();
    vi.mocked(getBook)
      .mockReturnValueOnce(lookup.promise)
      .mockResolvedValueOnce({ ...dune, isbn: '9780140449136', title: 'The Iliad' });
    await renderApp();

    await scanIsbn(dune.isbn);
    await scanIsbn('TEX-7654321-0');
    await expect
      .element(page.getByText("That's a package label. Press Done to finish this package first."))
      .toBeInTheDocument();
    await scanIsbn('9780140449136');
    await expect
      .element(page.getByText("That's a package label. Press Done to finish this package first."))
      .not.toBeInTheDocument();

    lookup.resolve(dune);

    await vi.waitFor(() => expect(addPackageItem).toHaveBeenCalledTimes(2));
    expect(vi.mocked(addPackageItem).mock.calls.map(([code, data]) => [code, data.title])).toEqual([
      ['TEX-1234567-2', 'Dune'],
      ['TEX-1234567-2', 'The Iliad'],
    ]);
    expect(getPackage).not.toHaveBeenCalledWith('TEX-7654321-0');
    await expect.element(page.getByRole('heading', { name: 'John Doe' })).toBeInTheDocument();
  });

  it('warns when leaving with scans pending, and drops their late results', async () => {
    const lookup = deferred<Book>();
    vi.mocked(getBook).mockReturnValue(lookup.promise);
    await renderApp();

    await scanIsbn('9780000000002');
    await scanIsbn(dune.isbn);
    await page.getByRole('link', { name: 'Leave' }).click();
    await expect.element(page.getByText('Units page')).toBeInTheDocument();
    expect(toast.warning).toHaveBeenCalledWith(
      "2 scanned books may not have been recorded. Check this package's list.",
      expect.objectContaining({ description: expect.anything() })
    );

    lookup.reject(new ApiError(404, 'Book not found.'));
    await new Promise((resolve) => setTimeout(resolve, 50));
    await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
    expect(getBook).toHaveBeenCalledTimes(1);
    expect(addPackageItem).not.toHaveBeenCalled();
  });

  it('counts an add in flight as pending, and when leaving points back to the list', async () => {
    const post = deferred<PackageItemCreated>();
    vi.mocked(getBook).mockResolvedValue(dune);
    vi.mocked(addPackageItem).mockReturnValue(post.promise);
    await renderApp();

    await scanIsbn(dune.isbn);
    await vi.waitFor(() => expect(addPackageItem).toHaveBeenCalledTimes(1));
    await expect.element(page.getByRole('button', { name: 'Done' })).toBeDisabled();

    await page.getByRole('link', { name: 'Leave' }).click();
    await expect.element(page.getByText('Units page')).toBeInTheDocument();
    expect(toast.warning).toHaveBeenCalledTimes(1);
    const [message, options] = vi.mocked(toast.warning).mock.calls[0];
    expect(message).toBe("1 scanned book may not have been recorded. Check this package's list.");
    const link = (options as { description: React.ReactElement<{ to: string }> }).description;
    expect(link.props.to).toBe('/packages/TEX-1234567-2');

    // The add still completes server-side; the package's list (refetched when
    // it's reopened) shows it.
    post.resolve(created({ isbn: dune.isbn, title: 'Dune', author: 'Frank Herbert' }));
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('counts a form opened for a scanned book as pending, and warns on leaving it', async () => {
    vi.mocked(getBook).mockRejectedValue(new ApiError(404, 'Book not found.'));
    await renderApp();

    await scanIsbn('9780000000002');
    await expect.element(page.getByRole('heading', { name: 'Add a book' })).toBeInTheDocument();
    await expect
      .element(page.getByRole('button', { name: 'Done', includeHidden: true }))
      .toBeDisabled();

    // Back while the form is open.
    back.go();
    await expect.element(page.getByText('Units page')).toBeInTheDocument();
    expect(toast.warning).toHaveBeenCalledWith(
      "1 scanned book may not have been recorded. Check this package's list.",
      expect.anything()
    );
  });

  it('does not count an add without ISBN as a pending scan', async () => {
    await renderApp();
    await page.getByRole('button', { name: 'Add without ISBN' }).click();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect.element(page.getByRole('button', { name: 'Done' })).toBeEnabled();
  });

  it('frees Done once the form for a scanned book is closed', async () => {
    vi.mocked(getBook).mockRejectedValue(new ApiError(404, 'Book not found.'));
    await renderApp();

    await scanIsbn('9780000000002');
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
    await expect.element(page.getByRole('button', { name: 'Done' })).toBeEnabled();
  });

  it('serves the fixed title to scans after a title is fixed for all future scans', async () => {
    vi.mocked(getBook).mockResolvedValue({ ...dune, title: 'Dune (wrong)' });
    vi.mocked(getPackage).mockImplementation(async (code) =>
      makePackage(code, [
        makeItem({ isbn: dune.isbn, title: 'Dune (wrong)', author: 'Frank Herbert' }),
      ])
    );
    vi.mocked(updatePackageItem).mockResolvedValue(
      makeItem({ isbn: dune.isbn, title: 'Dune', author: 'Frank Herbert', revision: 1 })
    );
    await renderApp();

    // Caches the wrong title for 5 minutes.
    await scanIsbn(dune.isbn);
    await vi.waitFor(() => expect(addPackageItem).toHaveBeenCalledTimes(1));

    await page.getByRole('button', { name: 'Edit Dune (wrong)' }).click();
    await titleInput().fill('Dune');
    await page.getByLabelText('Fix this title for all future scans').click();
    await page.getByRole('button', { name: 'Save' }).click();
    await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();

    await scanIsbn('0441172717');
    await vi.waitFor(() => expect(addPackageItem).toHaveBeenCalledTimes(2));
    expect(vi.mocked(addPackageItem).mock.calls[1][1]).toMatchObject({ title: 'Dune' });
  });

  it('retries a lookup in flight when its title is fixed meanwhile, getting the fix', async () => {
    const lookup = deferred<Book>();
    // After the fix the backend's cache answers with it (a retry may ask).
    vi.mocked(getBook).mockReturnValueOnce(lookup.promise).mockResolvedValue(dune);
    vi.mocked(getPackage).mockImplementation(async (code) =>
      makePackage(code, [
        makeItem({ isbn: dune.isbn, title: 'Dune (wrong)', author: 'Frank Herbert' }),
      ])
    );
    vi.mocked(updatePackageItem).mockResolvedValue(
      makeItem({ isbn: dune.isbn, title: 'Dune', author: 'Frank Herbert', revision: 1 })
    );
    await renderApp();

    await scanIsbn(dune.isbn);
    await page.getByRole('button', { name: 'Edit Dune (wrong)' }).click();
    await titleInput().fill('Dune');
    await page.getByLabelText('Fix this title for all future scans').click();
    await page.getByRole('button', { name: 'Save' }).click();
    await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();

    // The old answer lands late: it was cancelled, and doesn't count.
    lookup.resolve({ ...dune, title: 'Dune (wrong)' });

    await vi.waitFor(() => expect(addPackageItem).toHaveBeenCalledTimes(1));
    expect(vi.mocked(addPackageItem).mock.calls[0][1]).toMatchObject({ title: 'Dune' });
    await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();

    // Later scans get the fix too, from the cache.
    const lookups = vi.mocked(getBook).mock.calls.length;
    await scanIsbn(dune.isbn);
    await vi.waitFor(() => expect(addPackageItem).toHaveBeenCalledTimes(2));
    expect(vi.mocked(addPackageItem).mock.calls[1][1]).toMatchObject({ title: 'Dune' });
    expect(getBook).toHaveBeenCalledTimes(lookups);
  });

  it('shares one cached lookup between the ISBN-10 and ISBN-13 scans', async () => {
    vi.mocked(getBook).mockResolvedValue(dune);
    await renderApp();

    await scanIsbn(dune.isbn);
    await vi.waitFor(() => expect(addPackageItem).toHaveBeenCalledTimes(1));
    await scanIsbn('0-441-17271-7');
    await vi.waitFor(() => expect(addPackageItem).toHaveBeenCalledTimes(2));
    expect(getBook).toHaveBeenCalledTimes(1);
  });

  it("can't be dismissed while saving, and closes when the save completes", async () => {
    const save = deferred<PackageItem>();
    vi.mocked(updatePackageItem).mockReturnValue(save.promise);
    await renderApp();

    await page.getByRole('button', { name: 'Edit The Odyssey' }).click();
    await page.getByLabelText('Author').fill('Homer (trans. Fagles)');
    await page.getByRole('button', { name: 'Save' }).click();

    await expect.element(page.getByRole('button', { name: 'Saving...' })).toBeDisabled();
    await expect.element(page.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    await expect.element(page.getByRole('button', { name: 'Close' })).not.toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await expect.element(page.getByRole('heading', { name: 'Edit book' })).toBeInTheDocument();

    save.resolve(makeItem({ author: 'Homer (trans. Fagles)', revision: 1 }));
    await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
    await expect.element(isbnInput()).toHaveFocus();
  });
});
