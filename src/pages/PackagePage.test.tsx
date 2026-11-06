import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { toast } from 'sonner';
import { createWrapper } from '@/test/utils';
import { ApiError } from '@/lib/api/client';
import { getPackage } from '@/lib/api/packages';
import { addPackageItem, deletePackageItem, updatePackageItem } from '@/lib/api/items';
import { getBook } from '@/lib/api/books';
import type { Book, Package, PackageItem, PackageItemCreated } from '@/types';
import { PackagePage } from './PackagePage';

vi.mock('@/lib/api/packages');
vi.mock('@/lib/api/items');
vi.mock('@/lib/api/books');
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

const mockNavigate = vi.fn();
let mockCode = 'TEX-1234567-2';
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ code: mockCode }),
  };
});

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

function makePackage(overrides: Partial<Package> = {}): Package {
  return {
    request: {
      index: 2,
      code: 'TEX-1234567-2',
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
      unit: {
        name: 'Huntsville',
        street1: '815 12th St',
        street2: null,
        city: 'Huntsville',
        zipcode: '77348',
        state: 'TX',
        url: null,
        jurisdiction: 'Texas',
        shipping_method: 'Individual',
      },
    },
    items: [makeItem()],
    warnings: {},
    ...overrides,
  };
}

function created(item: Partial<PackageItem>, previouslySent: string[] = []): PackageItemCreated {
  return { ...makeItem(item), previously_sent: previouslySent };
}

const book: Book = {
  isbn: '9780441172719',
  title: 'Dune',
  author: 'Frank Herbert',
  source: 'isbndb',
  confidence: 'high',
};

async function renderPage() {
  await render(<PackagePage />, { wrapper: createWrapper() });
  await expect.element(page.getByRole('heading', { name: 'John Doe' })).toBeInTheDocument();
}

const isbnInput = () => page.getByLabelText("Scan a book's ISBN");

async function scanIsbn(text: string) {
  await isbnInput().fill(text);
  await userEvent.keyboard('{Enter}');
}

describe('PackagePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getPackage).mockReset();
    vi.mocked(getBook).mockReset();
    vi.mocked(addPackageItem).mockReset();
    vi.mocked(updatePackageItem).mockReset();
    vi.mocked(deletePackageItem).mockReset();
    mockCode = 'TEX-1234567-2';
    vi.mocked(getPackage).mockResolvedValue(makePackage());
  });

  describe('rendering', () => {
    it('shows the inmate, postmark date, warnings and the books', async () => {
      vi.mocked(getPackage).mockResolvedValue(
        makePackage({ warnings: { release: 'Inmate is being released soon.' } })
      );
      await renderPage();

      expect(getPackage).toHaveBeenCalledWith('TEX-1234567-2');
      await expect.element(page.getByText('Texas #01234567')).toBeInTheDocument();
      await expect.element(page.getByText('Huntsville')).toBeInTheDocument();
      await expect.element(page.getByTestId('postmark-date')).toHaveTextContent('Oct 28, 2026');
      await expect.element(page.getByText('Inmate is being released soon.')).toBeInTheDocument();
      await expect.element(page.getByText('The Odyssey')).toBeInTheDocument();
      await expect.element(page.getByText('Homer')).toBeInTheDocument();
      await expect.element(page.getByText('9780140449136')).toBeInTheDocument();
      await expect.element(page.getByText('Not registered yet')).toBeInTheDocument();
    });

    it('fetches the code as scanned', async () => {
      mockCode = 'tex-01234567-2';
      await renderPage();
      expect(getPackage).toHaveBeenCalledWith('tex-01234567-2');
    });

    it('shows Registered and no Edit button for a registered book', async () => {
      vi.mocked(getPackage).mockResolvedValue(
        makePackage({ items: [makeItem({ registered_at: '2026-11-05T20:00:00Z' })] })
      );
      await renderPage();

      await expect.element(page.getByText('Registered', { exact: true })).toBeInTheDocument();
      await expect
        .element(page.getByRole('button', { name: 'Edit The Odyssey' }))
        .not.toBeInTheDocument();
      await expect
        .element(page.getByRole('button', { name: 'Delete The Odyssey' }))
        .toBeInTheDocument();
    });

    it('shows no registration status for a Federal package', async () => {
      const pkg = makePackage();
      vi.mocked(getPackage).mockResolvedValue({
        ...pkg,
        request: { ...pkg.request, code: 'FED-12345678-0' },
        inmate: { ...pkg.inmate, jurisdiction: 'Federal', id: 12345678 },
      });
      await renderPage();

      await expect.element(page.getByText('The Odyssey')).toBeInTheDocument();
      await expect.element(page.getByText('Not registered yet')).not.toBeInTheDocument();
      await expect.element(page.getByText('Status')).not.toBeInTheDocument();
    });

    it('says when no books are recorded yet', async () => {
      vi.mocked(getPackage).mockResolvedValue(makePackage({ items: [] }));
      await renderPage();
      await expect.element(page.getByText(/no books recorded yet/i)).toBeInTheDocument();
    });

    it('focuses the ISBN input', async () => {
      await renderPage();
      await expect.element(isbnInput()).toHaveFocus();
    });

    it('goes back to the station on Done', async () => {
      await renderPage();
      await page.getByRole('button', { name: 'Done' }).click();
      expect(mockNavigate).toHaveBeenCalledWith('/packages');
    });
  });

  describe('errors', () => {
    it('shows Package not found for a 404, with a link back', async () => {
      vi.mocked(getPackage).mockRejectedValue(new ApiError(404, 'Request not found.'));
      await render(<PackagePage />, { wrapper: createWrapper() });

      await expect.element(page.getByText('Package not found')).toBeInTheDocument();
      await expect
        .element(page.getByRole('link', { name: 'Scan another package' }))
        .toHaveAttribute('href', '/packages');
      expect(getPackage).toHaveBeenCalledTimes(1);
    });

    it('explains a tossed request for a 409', async () => {
      vi.mocked(getPackage).mockRejectedValue(
        new ApiError(409, 'Request was tossed, so it has no package.')
      );
      await render(<PackagePage />, { wrapper: createWrapper() });

      await expect.element(page.getByText('This request was tossed')).toBeInTheDocument();
      await expect.element(page.getByText(/has no package/)).toBeInTheDocument();
      await expect
        .element(page.getByRole('link', { name: 'Scan another package' }))
        .toBeInTheDocument();
    });
  });

  describe('scanning an ISBN', () => {
    it('adds a found book straight away and keeps the focus', async () => {
      vi.mocked(getBook).mockResolvedValue(book);
      vi.mocked(addPackageItem).mockResolvedValue(
        created({ id: 2, isbn: book.isbn, title: 'Dune', author: 'Frank Herbert' })
      );
      await renderPage();

      await scanIsbn('0441172717');

      await vi.waitFor(() =>
        expect(addPackageItem).toHaveBeenCalledWith('TEX-1234567-2', {
          isbn: '9780441172719',
          title: 'Dune',
          author: 'Frank Herbert',
          source: 'isbn',
        })
      );
      expect(getBook).toHaveBeenCalledWith('0441172717');
      expect(toast.success).toHaveBeenCalledWith('Added “Dune”');
      await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
      await expect.element(isbnInput()).toHaveValue('');
      await expect.element(isbnInput()).toHaveFocus();
      // The package is refetched to show the new book.
      await vi.waitFor(() => expect(getPackage).toHaveBeenCalledTimes(2));
    });

    it('warns when the inmate was already sent the book', async () => {
      vi.mocked(getBook).mockResolvedValue(book);
      vi.mocked(addPackageItem).mockResolvedValue(
        created({ id: 2, isbn: book.isbn, title: 'Dune', author: 'Frank Herbert' }, [
          'TEX-1234567-0',
        ])
      );
      await renderPage();
      // The refetch after the add includes the new book.
      vi.mocked(getPackage).mockResolvedValue(
        makePackage({
          items: [
            makeItem(),
            makeItem({ id: 2, isbn: book.isbn, title: 'Dune', author: 'Frank Herbert' }),
          ],
        })
      );

      await scanIsbn(book.isbn);

      await expect.element(page.getByText('Already sent to this inmate')).toBeInTheDocument();
      await expect.element(page.getByText(/“Dune” was also in TEX-1234567-0/)).toBeInTheDocument();
      await expect.element(page.getByText('Already sent in TEX-1234567-0')).toBeInTheDocument();
    });

    it('opens the form with the ISBN kept when the book is not found', async () => {
      vi.mocked(getBook).mockRejectedValue(new ApiError(404, 'Book not found.'));
      vi.mocked(addPackageItem).mockResolvedValue(
        created({ id: 2, isbn: '9780140449136', title: 'Some Book', author: 'Some One' })
      );
      await renderPage();

      await scanIsbn('9780140449136');

      const dialog = page.getByRole('dialog');
      await expect.element(dialog.getByText(/no book was found/i)).toBeInTheDocument();
      await expect.element(page.getByLabelText('ISBN (optional)')).toHaveValue('9780140449136');
      await expect.element(page.getByLabelText('Title', { exact: true })).toHaveFocus();

      await page.getByLabelText('Title', { exact: true }).fill('  Some   Book ');
      await page.getByLabelText('Author').fill('Some One');
      await page.getByRole('button', { name: 'Add book' }).click();

      await vi.waitFor(() =>
        expect(addPackageItem).toHaveBeenCalledWith('TEX-1234567-2', {
          isbn: '9780140449136',
          title: 'Some Book',
          author: 'Some One',
          source: 'manual',
        })
      );
      await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
      await expect.element(isbnInput()).toHaveFocus();
    });

    it('marks an invalid ISBN in the form', async () => {
      vi.mocked(getBook).mockRejectedValue(new ApiError(422, 'Not a valid ISBN.'));
      await renderPage();

      await scanIsbn('9780140449137');

      await expect.element(page.getByRole('dialog')).toBeInTheDocument();
      await expect.element(page.getByLabelText('ISBN (optional)')).toHaveValue('9780140449137');
      await expect.element(page.getByText('Not a valid ISBN.')).toBeInTheDocument();
    });

    it('asks for the author when the lookup has none, keeping source isbn', async () => {
      vi.mocked(getBook).mockResolvedValue({ ...book, author: null });
      vi.mocked(addPackageItem).mockResolvedValue(
        created({ id: 2, isbn: book.isbn, title: 'Dune', author: 'Unknown' })
      );
      await renderPage();

      await scanIsbn(book.isbn);

      await expect.element(page.getByText(/found no author/i)).toBeInTheDocument();
      await expect.element(page.getByLabelText('Title', { exact: true })).toHaveValue('Dune');
      await expect.element(page.getByLabelText('Author')).toHaveFocus();
      expect(addPackageItem).not.toHaveBeenCalled();

      await page.getByLabelText('Author').fill('Unknown');
      await page.getByRole('button', { name: 'Add book' }).click();

      await vi.waitFor(() =>
        expect(addPackageItem).toHaveBeenCalledWith('TEX-1234567-2', {
          isbn: book.isbn,
          title: 'Dune',
          author: 'Unknown',
          source: 'isbn',
        })
      );
    });

    it('opens the form for a looked-up title too short for the portal', async () => {
      vi.mocked(getBook).mockResolvedValue({ ...book, title: 'It' });
      await renderPage();

      await scanIsbn(book.isbn);

      await expect.element(page.getByText(/needs each to be 3 to 100/)).toBeInTheDocument();
      await expect.element(page.getByText('Must be 3 to 100 characters.')).toBeInTheDocument();
      expect(addPackageItem).not.toHaveBeenCalled();
    });

    it('queues a book scanned while another is being looked up', async () => {
      let resolveFirst: (value: Book) => void = () => {};
      vi.mocked(getBook)
        .mockImplementationOnce(() => new Promise((resolve) => (resolveFirst = resolve)))
        .mockResolvedValueOnce({ ...book, isbn: '9780140449136', title: 'The Iliad' });
      vi.mocked(addPackageItem).mockImplementation(async (_code, data) =>
        created({ id: 9, isbn: data.isbn ?? null, title: data.title, author: data.author })
      );
      await renderPage();

      await scanIsbn(book.isbn);
      await scanIsbn('9780140449136');
      await expect.element(page.getByText(/1 more waiting/)).toBeInTheDocument();
      expect(getBook).toHaveBeenCalledTimes(1);

      resolveFirst(book);

      await vi.waitFor(() => expect(addPackageItem).toHaveBeenCalledTimes(2));
      expect(vi.mocked(addPackageItem).mock.calls.map(([, data]) => data.title)).toEqual([
        'Dune',
        'The Iliad',
      ]);
    });

    it('drops a package label scanned here, with a hint', async () => {
      await renderPage();
      await scanIsbn('TEX-7654321-0');
      await expect
        .element(page.getByText("That's a package label. Press Done to finish this package first."))
        .toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(getBook).not.toHaveBeenCalled();
    });
  });

  describe('an add that fails', () => {
    it('keeps the book on screen and Done disabled until it is checked', async () => {
      vi.mocked(getBook).mockResolvedValue(book);
      vi.mocked(addPackageItem).mockRejectedValue(new TypeError('Failed to fetch'));
      await renderPage();

      await scanIsbn('0441172717');

      await expect.element(page.getByText('A book may not have been added')).toBeInTheDocument();
      await expect.element(page.getByText('“Dune” by Frank Herbert')).toBeInTheDocument();
      await expect
        .element(page.getByText('(ISBN 9780441172719; Failed to fetch)'))
        .toBeInTheDocument();
      await expect.element(page.getByRole('button', { name: 'Done' })).toBeDisabled();
      await expect
        .element(page.getByText('Waiting for 1 scanned book to be recorded...'))
        .toBeInTheDocument();
      expect(toast.error).not.toHaveBeenCalled();

      await page.getByRole('button', { name: "It's in the list" }).click();

      await expect
        .element(page.getByText('A book may not have been added'))
        .not.toBeInTheDocument();
      await expect.element(page.getByRole('button', { name: 'Done' })).toBeEnabled();
      await expect.element(isbnInput()).toHaveFocus();
    });

    it('adds the book again on Add again', async () => {
      vi.mocked(getBook).mockResolvedValue(book);
      vi.mocked(addPackageItem)
        .mockRejectedValueOnce(new ApiError(502, 'Bad Gateway'))
        .mockResolvedValueOnce(
          created({ id: 2, isbn: book.isbn, title: 'Dune', author: 'Frank Herbert' })
        );
      await renderPage();

      await scanIsbn('0441172717');
      await page.getByRole('button', { name: 'Add again' }).click();

      await vi.waitFor(() => expect(addPackageItem).toHaveBeenCalledTimes(2));
      expect(toast.success).toHaveBeenCalledWith('Added “Dune”');
      await expect
        .element(page.getByText('A book may not have been added'))
        .not.toBeInTheDocument();
      await expect.element(page.getByRole('button', { name: 'Done' })).toBeEnabled();
    });

    it('keeps the page and its failed books when the list reload fails too', async () => {
      vi.mocked(getBook).mockResolvedValue(book);
      vi.mocked(addPackageItem).mockRejectedValue(new TypeError('Failed to fetch'));
      await renderPage();
      vi.mocked(getPackage).mockRejectedValue(new TypeError('Failed to fetch'));

      await scanIsbn('0441172717');

      await expect
        .element(page.getByText("The book list couldn't be reloaded"))
        .toBeInTheDocument();
      await expect.element(page.getByText('A book may not have been added')).toBeInTheDocument();
      await expect.element(page.getByRole('button', { name: "It's in the list" })).toBeDisabled();
      await expect.element(page.getByRole('button', { name: 'Add again' })).toBeDisabled();
      await expect.element(page.getByRole('button', { name: 'Done' })).toBeDisabled();

      vi.mocked(getPackage).mockResolvedValue(makePackage());
      await page.getByRole('button', { name: 'Reload the list' }).click();

      await expect
        .element(page.getByText("The book list couldn't be reloaded"))
        .not.toBeInTheDocument();
      await expect.element(page.getByRole('button', { name: "It's in the list" })).toBeEnabled();
    });

    it('waits for a list reloaded after the failure before offering the checks', async () => {
      vi.mocked(getBook).mockResolvedValue(book);
      vi.mocked(addPackageItem).mockRejectedValue(new TypeError('Failed to fetch'));
      await renderPage();
      let finishReload: (pkg: Package) => void = () => {};
      vi.mocked(getPackage).mockReturnValue(
        new Promise<Package>((resolve) => {
          finishReload = resolve;
        })
      );

      await scanIsbn('0441172717');

      await expect
        .element(page.getByText('The list must reload before it can be checked.', { exact: false }))
        .toBeInTheDocument();
      await expect.element(page.getByRole('button', { name: "It's in the list" })).toBeDisabled();
      await expect.element(page.getByRole('button', { name: 'Add again' })).toBeDisabled();

      finishReload(makePackage());

      await expect.element(page.getByRole('button', { name: "It's in the list" })).toBeEnabled();
      await expect.element(page.getByRole('button', { name: 'Add again' })).toBeEnabled();
    });

    it('keeps a checked failure blocked while a later reload fails', async () => {
      vi.mocked(getBook).mockResolvedValue(book);
      vi.mocked(addPackageItem).mockRejectedValue(new TypeError('Failed to fetch'));
      await renderPage();

      await scanIsbn('0441172717');
      await expect.element(page.getByRole('button', { name: "It's in the list" })).toBeEnabled();

      // Another book fails and its reload fails too: the first, checked row
      // must not be actionable against the now-stale list.
      vi.mocked(getPackage).mockRejectedValue(new TypeError('Failed to fetch'));
      await scanIsbn('0441172717');
      await expect.element(page.getByText('2 books may not have been added')).toBeInTheDocument();

      await expect
        .element(page.getByText("The book list couldn't be reloaded"))
        .toBeInTheDocument();
      const checkedRow = page.getByRole('button', { name: "It's in the list" }).first();
      await expect.element(checkedRow).toBeDisabled();
      await expect.element(page.getByRole('button', { name: 'Add again' }).first()).toBeDisabled();
    });

    it('offers a reload while a failure is unchecked, even after the list error clears', async () => {
      vi.mocked(getBook).mockResolvedValue(book);
      vi.mocked(addPackageItem).mockRejectedValue(new TypeError('Failed to fetch'));
      await renderPage();
      vi.mocked(getPackage).mockRejectedValue(new TypeError('Failed to fetch'));

      await scanIsbn('0441172717');
      await expect
        .element(page.getByText("The book list couldn't be reloaded"))
        .toBeInTheDocument();

      // Another book's add succeeds and its reload clears the error, but the
      // failure was never checked against a list loaded after it.
      vi.mocked(getPackage).mockResolvedValue(makePackage());
      vi.mocked(addPackageItem).mockResolvedValueOnce(
        created({ id: 3, isbn: book.isbn, title: 'Dune', author: 'Frank Herbert' })
      );
      await scanIsbn('0441172717');
      await expect
        .element(page.getByText("The book list couldn't be reloaded"))
        .not.toBeInTheDocument();
      await expect.element(page.getByRole('button', { name: "It's in the list" })).toBeDisabled();

      await page.getByRole('button', { name: 'Reload the list' }).click();
      await expect.element(page.getByRole('button', { name: "It's in the list" })).toBeEnabled();
    });

    it('counts each failed book', async () => {
      vi.mocked(getBook).mockResolvedValue(book);
      vi.mocked(addPackageItem).mockRejectedValue(new TypeError('Failed to fetch'));
      await renderPage();

      await scanIsbn('0441172717');
      await expect.element(page.getByText('A book may not have been added')).toBeInTheDocument();
      await scanIsbn('0441172717');

      await expect.element(page.getByText('2 books may not have been added')).toBeInTheDocument();
      await expect.element(page.getByRole('button', { name: 'Done' })).toBeDisabled();
    });
  });

  describe('the item form', () => {
    it('checks title and author lengths before submitting', async () => {
      await renderPage();
      await page.getByRole('button', { name: 'Add without ISBN' }).click();

      await page.getByLabelText('Title', { exact: true }).fill('Ab');
      await page.getByLabelText('Author').fill('x'.repeat(99) + '\u{1F600}');
      await page.getByRole('button', { name: 'Add book' }).click();

      await expect.element(page.getByText('Must be 3 to 100 characters.').first()).toBeVisible();
      expect(await page.getByText('Must be 3 to 100 characters.').all()).toHaveLength(2);
      expect(addPackageItem).not.toHaveBeenCalled();
    });

    it('shows the server 422 message on its field', async () => {
      vi.mocked(addPackageItem).mockRejectedValue(
        new ApiError(
          422,
          JSON.stringify([
            { loc: ['body', 'title'], msg: 'Must be 3 to 100 characters.', type: 'x' },
          ])
        )
      );
      await renderPage();
      await page.getByRole('button', { name: 'Add without ISBN' }).click();
      await page.getByLabelText('Title', { exact: true }).fill('Dune');
      await page.getByLabelText('Author').fill('Frank Herbert');
      await page.getByRole('button', { name: 'Add book' }).click();

      await expect.element(page.getByText('Must be 3 to 100 characters.')).toBeInTheDocument();
      await expect.element(page.getByRole('dialog')).toBeInTheDocument();
    });

    it('adds a book without an ISBN as manual', async () => {
      vi.mocked(addPackageItem).mockResolvedValue(
        created({ id: 2, isbn: null, title: 'Dune', author: 'Frank Herbert', source: 'manual' })
      );
      await renderPage();
      await page.getByRole('button', { name: 'Add without ISBN' }).click();
      await page.getByLabelText('Title', { exact: true }).fill('Dune');
      await page.getByLabelText('Author').fill('Frank Herbert');
      await page.getByRole('button', { name: 'Add book' }).click();

      await vi.waitFor(() =>
        expect(addPackageItem).toHaveBeenCalledWith('TEX-1234567-2', {
          isbn: null,
          title: 'Dune',
          author: 'Frank Herbert',
          source: 'manual',
        })
      );
    });

    it('returns the focus to the ISBN input on Cancel', async () => {
      await renderPage();
      await page.getByRole('button', { name: 'Add without ISBN' }).click();
      await expect.element(page.getByLabelText('Title', { exact: true })).toHaveFocus();
      await page.getByRole('button', { name: 'Cancel' }).click();
      await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
      await expect.element(isbnInput()).toHaveFocus();
    });
  });

  describe('editing', () => {
    it('saves an edit with the revision and the cache choice', async () => {
      vi.mocked(getPackage).mockResolvedValue(makePackage({ items: [makeItem({ revision: 3 })] }));
      vi.mocked(updatePackageItem).mockResolvedValue(makeItem({ title: 'The Odyssey (Fagles)' }));
      await renderPage();

      await page.getByRole('button', { name: 'Edit The Odyssey' }).click();
      await expect
        .element(page.getByLabelText('Title', { exact: true }))
        .toHaveValue('The Odyssey');
      await page.getByLabelText('Title', { exact: true }).fill('The Odyssey (Fagles)');
      await page.getByLabelText('Fix this title for all future scans').click();
      await page.getByRole('button', { name: 'Save' }).click();

      await vi.waitFor(() =>
        expect(updatePackageItem).toHaveBeenCalledWith('TEX-1234567-2', 1, {
          isbn: '9780140449136',
          title: 'The Odyssey (Fagles)',
          author: 'Homer',
          revision: 3,
          update_cache: true,
        })
      );
      await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
      await expect.element(isbnInput()).toHaveFocus();
    });

    it('offers no cache fix for a book without an ISBN', async () => {
      vi.mocked(getPackage).mockResolvedValue(makePackage({ items: [makeItem({ isbn: null })] }));
      await renderPage();
      await page.getByRole('button', { name: 'Edit The Odyssey' }).click();
      await expect.element(page.getByLabelText('Title', { exact: true })).toBeInTheDocument();
      await expect
        .element(page.getByLabelText('Fix this title for all future scans'))
        .not.toBeInTheDocument();
    });

    it('toasts and reloads on a stale revision', async () => {
      vi.mocked(updatePackageItem).mockRejectedValue(
        new ApiError(409, 'The book was changed by someone else; reload it.')
      );
      await renderPage();

      await page.getByRole('button', { name: 'Edit The Odyssey' }).click();
      await page.getByLabelText('Author').fill('Homer (trans. Fagles)');
      await page.getByRole('button', { name: 'Save' }).click();

      await vi.waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith(
          'The book was changed by someone else; reload it. The list has been reloaded.'
        )
      );
      await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
      await vi.waitFor(() => expect(getPackage).toHaveBeenCalledTimes(2));
    });
  });

  describe('deleting', () => {
    it('removes an unregistered book after confirming', async () => {
      vi.mocked(deletePackageItem).mockResolvedValue(undefined);
      await renderPage();

      await page.getByRole('button', { name: 'Delete The Odyssey' }).click();
      await expect
        .element(page.getByText('Remove “The Odyssey” from this package?'))
        .toBeInTheDocument();
      await page.getByRole('button', { name: 'Remove' }).click();

      await vi.waitFor(() =>
        expect(deletePackageItem).toHaveBeenCalledWith('TEX-1234567-2', 1, {
          confirmRegistered: false,
        })
      );
      expect(toast.success).toHaveBeenCalledWith('Removed “The Odyssey”');
      await expect.element(isbnInput()).toHaveFocus();
    });

    it('says a registered book stays on the portal and confirms the delete', async () => {
      vi.mocked(getPackage).mockResolvedValue(
        makePackage({ items: [makeItem({ registered_at: '2026-11-05T20:00:00Z' })] })
      );
      vi.mocked(deletePackageItem).mockResolvedValue(undefined);
      await renderPage();

      await page.getByRole('button', { name: 'Delete The Odyssey' }).click();
      await expect
        .element(page.getByText(/registered on the portal; it stays registered there/))
        .toBeInTheDocument();
      await page.getByRole('button', { name: 'Remove' }).click();

      await vi.waitFor(() =>
        expect(deletePackageItem).toHaveBeenCalledWith('TEX-1234567-2', 1, {
          confirmRegistered: true,
        })
      );
    });

    it('does nothing on Cancel', async () => {
      await renderPage();
      await page.getByRole('button', { name: 'Delete The Odyssey' }).click();
      await page.getByRole('button', { name: 'Cancel' }).click();
      await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
      expect(deletePackageItem).not.toHaveBeenCalled();
      await expect.element(isbnInput()).toHaveFocus();
    });

    it('toasts and reloads when the book was registered meanwhile', async () => {
      vi.mocked(deletePackageItem).mockRejectedValue(
        new ApiError(409, 'The book is registered on the portal; confirm to delete it.')
      );
      await renderPage();

      await page.getByRole('button', { name: 'Delete The Odyssey' }).click();
      await page.getByRole('button', { name: 'Remove' }).click();

      await vi.waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith(
          'The book is registered on the portal; confirm to delete it. The list has been reloaded.'
        )
      );
      await vi.waitFor(() => expect(getPackage).toHaveBeenCalledTimes(2));
    });
  });
});
