// The package page under real routing (the workspace really unmounts when the
// route changes) and the app's production query settings (5-minute staleTime).
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { QueryClientProvider } from '@tanstack/react-query';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
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

async function renderApp(path = '/packages/TEX-1234567-2') {
  await render(
    <QueryClientProvider client={createQueryClient()}>
      <MemoryRouter initialEntries={[path]}>
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

  it('opens a package label scanned here only after pending scans are recorded', async () => {
    const lookup = deferred<Book>();
    vi.mocked(getBook).mockReturnValue(lookup.promise);
    await renderApp();

    await scanIsbn(dune.isbn);
    await scanIsbn('TEX-7654321-0');
    await expect.element(page.getByText('Opening TEX-7654321-0 next')).toBeInTheDocument();
    expect(getPackage).not.toHaveBeenCalledWith('TEX-7654321-0');

    lookup.resolve(dune);

    await vi.waitFor(() => expect(getPackage).toHaveBeenCalledWith('TEX-7654321-0'));
    expect(addPackageItem).toHaveBeenCalledWith(
      'TEX-1234567-2',
      expect.objectContaining({ title: 'Dune' })
    );
    await expect.element(page.getByText('Opening TEX-7654321-0 next')).not.toBeInTheDocument();
    expect(toast.warning).not.toHaveBeenCalled();
  });

  it('can stay on the package instead of opening the scanned label', async () => {
    const lookup = deferred<Book>();
    vi.mocked(getBook).mockReturnValue(lookup.promise);
    await renderApp();

    await scanIsbn(dune.isbn);
    await scanIsbn('TEX-7654321-0');
    await page.getByRole('button', { name: 'Stay on this package' }).click();
    lookup.resolve(dune);

    await vi.waitFor(() => expect(addPackageItem).toHaveBeenCalledTimes(1));
    expect(getPackage).not.toHaveBeenCalledWith('TEX-7654321-0');
  });

  it('warns when leaving loses pending scans, and drops their late results', async () => {
    const lookup = deferred<Book>();
    vi.mocked(getBook).mockReturnValue(lookup.promise);
    await renderApp();

    await scanIsbn('9780000000002');
    await scanIsbn(dune.isbn);
    await page.getByRole('link', { name: 'Leave' }).click();
    await expect.element(page.getByText('Units page')).toBeInTheDocument();
    expect(toast.warning).toHaveBeenCalledWith(
      "2 scanned books weren't recorded. Scan them again."
    );

    lookup.reject(new ApiError(404, 'Book not found.'));
    await new Promise((resolve) => setTimeout(resolve, 50));
    await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
    expect(getBook).toHaveBeenCalledTimes(1);
    expect(addPackageItem).not.toHaveBeenCalled();
  });

  it('looks a book up again after its title was fixed for all future scans', async () => {
    vi.mocked(getBook)
      .mockResolvedValueOnce({ ...dune, title: 'Dune (wrong)' })
      .mockResolvedValueOnce(dune);
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
    await vi.waitFor(() => expect(addPackageItem).toHaveBeenCalledTimes(1));

    await page.getByRole('button', { name: 'Edit Dune (wrong)' }).click();
    await titleInput().fill('Dune');
    await page.getByLabelText('Fix this title for all future scans').click();
    await page.getByRole('button', { name: 'Save' }).click();
    await vi.waitFor(() => expect(updatePackageItem).toHaveBeenCalledTimes(1));
    await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();

    // Without the refresh, this scan would get the cached old title.
    await scanIsbn(dune.isbn);
    await vi.waitFor(() => expect(addPackageItem).toHaveBeenCalledTimes(2));
    expect(getBook).toHaveBeenCalledTimes(2);
    expect(vi.mocked(addPackageItem).mock.calls[1][1]).toMatchObject({ title: 'Dune' });
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
