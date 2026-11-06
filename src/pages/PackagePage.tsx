import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { AlertTriangle, PackageX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DeleteItemDialog,
  ItemFormDialog,
  PackageHeader,
  PackageItemList,
  type ItemFormDialogProps,
  type ItemFormValues,
} from '@/components/packages';
import {
  useAddPackageItem,
  useDeletePackageItem,
  useLookupBook,
  usePackage,
  useUpdatePackageItem,
} from '@/hooks';
import { ApiError } from '@/lib/api';
import { normalizeIsbn } from '@/lib/isbn';
import { looksLikePackageCode } from '@/lib/packageScan';
import { cleanPortalText, isPortalLength } from '@/lib/portalText';
import type { Book, Package, PackageItem, PackageItemCreate, PackageItemCreated } from '@/types';

/** `/packages/:code`: record the books in one package. */
export function PackagePage() {
  const { code = '' } = useParams<{ code: string }>();
  const { data: pkg, isLoading, error } = usePackage(code);

  if (isLoading) {
    return <div className="py-12 text-center text-muted-foreground">Loading package...</div>;
  }

  if (error || !pkg) {
    return <PackageError code={code} error={error} />;
  }

  // Keyed by code: scanning another label from here starts afresh.
  return <PackageWorkspace key={code} code={code} pkg={pkg} />;
}

function PackageError({ code, error }: { code: string; error: Error | null }) {
  const status = error instanceof ApiError ? error.status : null;
  const [title, message] =
    status === 404
      ? [
          'Package not found',
          `No package has the label “${code}”. Check the label and scan it again.`,
        ]
      : status === 409
        ? [
            'This request was tossed',
            `Request “${code}” was tossed, so it has no package and no books to record.`,
          ]
        : ['Could not load the package', error?.message ?? 'Please try again.'];

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2">
            <PackageX className="h-6 w-6" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">{message}</p>
          <Button asChild>
            <Link to="/packages">Scan another package</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

const EMPTY_FORM: ItemFormValues = { isbn: '', title: '', author: '', updateCache: false };

type FormRequest =
  | {
      mode: 'add';
      defaults: ItemFormValues;
      note?: string;
      initialErrors?: ItemFormDialogProps['initialErrors'];
      validateOnOpen?: boolean;
      /** The lookup the form was prefilled from, if any. */
      lookup?: Book;
      /** Opened for a scanned book, which stays pending until the form closes. */
      fromScan?: boolean;
    }
  | { mode: 'edit'; item: PackageItem };

/** An open form; `id` is new for every opening (the form's identity). */
type FormState = FormRequest & { id: number };

interface ScanState {
  /** The ISBN being looked up (or added), if any. */
  current: string | null;
  /** Scans queued behind it. */
  waiting: number;
  /** A lookup result needing the form, held until the open dialog closes. */
  held: boolean;
  /** The open form is for a scanned book (its lookup failed). */
  scanForm: boolean;
}

const IDLE: ScanState = { current: null, waiting: 0, held: false, scanForm: false };

/**
 * A looked-up book whose add failed for a reason other than validation (a
 * network error, a 5xx). The add may still have been saved (only the response
 * lost), so it stays on screen until the packer checks the list: it's there,
 * or add it again.
 */
interface FailedAdd {
  id: number;
  book: Book;
  title: string;
  error: string;
}

/**
 * Scanned books not yet resolved: queued, being looked up or added, held for
 * the form, or in the open form (typing in, or saving).
 */
function pendingScans({ current, waiting, held, scanForm }: ScanState): number {
  return waiting + (current ? 1 : 0) + (held ? 1 : 0) + (scanForm ? 1 : 0);
}

function booksText(count: number): string {
  return count === 1 ? '1 scanned book' : `${count} scanned books`;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isConflict(error: unknown): error is ApiError {
  return error instanceof ApiError && error.status === 409;
}

/**
 * `source: 'isbn'` when the title (and the author, if the lookup had one)
 * are the lookup's, so the packer only typed a missing author; otherwise the
 * book was typed in.
 */
function itemSource(values: ItemFormValues, lookup?: Book): PackageItemCreate['source'] {
  if (!lookup || !values.isbn || normalizeIsbn(values.isbn) !== lookup.isbn) return 'manual';
  if (values.title !== cleanPortalText(lookup.title)) return 'manual';
  if (lookup.author?.trim() && values.author !== cleanPortalText(lookup.author)) return 'manual';
  return 'isbn';
}

function ScanStatus({ current, waiting, held }: ScanState) {
  if (current) {
    return (
      <>
        Looking up {current}...{waiting > 0 && ` (${waiting} more waiting)`}
      </>
    );
  }
  if (held) return <>A scanned book needs typing in once this dialog is closed.</>;
  if (waiting > 0) return <>{booksText(waiting)} waiting to be looked up</>;
  return null;
}

function PackageWorkspace({ code, pkg }: { code: string; pkg: Package }) {
  const navigate = useNavigate();
  const lookupBook = useLookupBook();
  const addItem = useAddPackageItem(code);
  const updateItem = useUpdatePackageItem(code);
  const deleteItem = useDeletePackageItem(code);

  const isbnInputRef = useRef<HTMLInputElement>(null);
  const [isbnValue, setIsbnValue] = useState('');
  const [form, setForm] = useState<FormState | null>(null);
  const [deleting, setDeleting] = useState<PackageItem | null>(null);
  // Books added here that the inmate was already sent, by item id: each row
  // keeps its marker until the book is removed; the alert lists them all
  // until dismissed.
  // Each warning is about the ISBN the book was added with (ISBN-13, as the
  // backend returns it): it applies only while the item still has that ISBN.
  const [sentBefore, setSentBefore] = useState<
    Record<number, { isbn: string | null; codes: string[] }>
  >({});
  const [alertIds, setAlertIds] = useState<number[]>([]);
  const [scans, setScans] = useState<ScanState>(IDLE);
  const [labelHint, setLabelHint] = useState(false);
  const [failedAdds, setFailedAdds] = useState<FailedAdd[]>([]);
  const failedCount = useRef(0);
  const nextFailedId = useRef(0);

  // Scans wait in a queue and are looked up one at a time, so a book scanned
  // while another is being looked up isn't lost. A lookup result that needs
  // the form never replaces an open dialog (an edit, a delete, another add):
  // it's held, and the queue pauses until the dialog closes.
  const queue = useRef<string[]>([]);
  const draining = useRef(false);
  const held = useRef<FormRequest | null>(null);
  const currentFormId = useRef<number | null>(null);
  const nextFormId = useRef(0);
  const deleteOpen = useRef(false);
  const alive = useRef(true);
  const current = useRef<string | null>(null);
  const scanFormOpen = useRef(false);

  const dialogOpen = () => currentFormId.current !== null || deleteOpen.current;

  const syncScans = () => {
    if (!alive.current) return;
    setScans({
      current: current.current,
      waiting: queue.current.length,
      held: held.current !== null,
      scanForm: scanFormOpen.current,
    });
  };

  // Leaving with scans pending (a header link, Back): their results are
  // dropped, but an add already sent may still land, so point the packer at
  // the package's list (refetched when it opens) rather than say to rescan.
  useEffect(() => {
    alive.current = true;
    // The queue array is only ever mutated in place, never replaced.
    const scanQueue = queue.current;
    return () => {
      alive.current = false;
      const unresolved =
        scanQueue.length +
        (held.current ? 1 : 0) +
        (current.current ? 1 : 0) +
        (scanFormOpen.current ? 1 : 0) +
        failedCount.current;
      if (unresolved > 0) {
        toast.warning(
          `${booksText(unresolved)} may not have been recorded. Check this package's list.`,
          {
            description: (
              <Link to={`/packages/${encodeURIComponent(code)}`} className="underline">
                Open {code}
              </Link>
            ),
            duration: Infinity,
            closeButton: true,
          }
        );
      }
    };
  }, [code]);

  const pending = pendingScans(scans) + failedAdds.length;

  const updateFailedAdds = (update: (current: FailedAdd[]) => FailedAdd[]) => {
    setFailedAdds((current) => {
      const next = update(current);
      failedCount.current = next.length;
      return next;
    });
  };

  const focusIsbnInput = () => isbnInputRef.current?.focus();

  // Keep the focus for the scanner: whenever no dialog is open and the focus
  // is lost to the page (its element removed, a background click, a toast
  // closed), give it back to the ISBN input. Focus moved somewhere on purpose
  // (a button, a link) stays. Checked a tick after each focusout, and before
  // each keystroke, since a removed element doesn't always fire focusout.
  useEffect(() => {
    const refocusIfLost = () => {
      const noDialog = currentFormId.current === null && !deleteOpen.current;
      const lost = document.activeElement === null || document.activeElement === document.body;
      if (noDialog && lost) isbnInputRef.current?.focus();
    };
    const onFocusOut = () => setTimeout(refocusIfLost, 0);
    document.addEventListener('focusout', onFocusOut);
    document.addEventListener('keydown', refocusIfLost, true);
    return () => {
      document.removeEventListener('focusout', onFocusOut);
      document.removeEventListener('keydown', refocusIfLost, true);
    };
  }, []);

  const returnFocus = (event: Event) => {
    event.preventDefault();
    focusIsbnInput();
  };

  const openForm = (request: FormRequest) => {
    const id = ++nextFormId.current;
    currentFormId.current = id;
    scanFormOpen.current = request.mode === 'add' && !!request.fromScan;
    setForm({ ...request, id });
    syncScans();
  };

  /** Open the form for a lookup result, or hold it while a dialog is open. */
  const openOrHold = (request: FormRequest) => {
    if (!alive.current) return;
    if (dialogOpen()) {
      held.current = request;
      syncScans();
    } else {
      openForm(request);
    }
  };

  /** Continue with held or queued scans once no dialog is open. */
  const resume = () => {
    if (!alive.current || dialogOpen()) return;
    if (held.current) {
      const request = held.current;
      held.current = null;
      openForm(request);
      syncScans();
      return;
    }
    void drain();
  };

  /** Close the form with `id`; a no-op if another form has replaced it. */
  const closeForm = (id: number) => {
    if (currentFormId.current !== id) return;
    currentFormId.current = null;
    scanFormOpen.current = false;
    setForm(null);
    syncScans();
    resume();
  };

  const openDelete = (item: PackageItem) => {
    deleteOpen.current = true;
    setDeleting(item);
  };

  const closeDelete = () => {
    deleteOpen.current = false;
    setDeleting(null);
    resume();
  };

  const recordAdded = (item: PackageItemCreated) => {
    if (!alive.current) return;
    toast.success(`Added “${item.title}”`);
    if (item.previously_sent.length > 0) {
      setSentBefore((current) => ({
        ...current,
        [item.id]: { isbn: item.isbn, codes: item.previously_sent },
      }));
      setAlertIds((current) => [...current, item.id]);
    }
  };

  const forgetSentBefore = (itemId: number) => {
    setSentBefore((current) => {
      const rest = { ...current };
      delete rest[itemId];
      return rest;
    });
    setAlertIds((current) => current.filter((id) => id !== itemId));
  };

  const addFromLookup = async (book: Book) => {
    const data: PackageItemCreate = {
      isbn: book.isbn,
      title: cleanPortalText(book.title),
      author: cleanPortalText(book.author ?? ''),
      source: 'isbn',
    };
    try {
      const created = await addItem.mutateAsync(data);
      recordAdded(created);
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) {
        // The backend's checks disagreed with ours: let the packer fix it.
        openOrHold({
          mode: 'add',
          defaults: { ...EMPTY_FORM, isbn: book.isbn, title: data.title, author: data.author },
          note: `The book couldn't be added as looked up: ${error.message}`,
          lookup: book,
          validateOnOpen: true,
          fromScan: true,
        });
      } else if (alive.current) {
        const failed = { id: ++nextFailedId.current, book, title: data.title };
        updateFailedAdds((current) => [...current, { ...failed, error: errorMessage(error) }]);
      }
    }
  };

  const dismissFailedAdd = (id: number) => {
    updateFailedAdds((current) => current.filter((failed) => failed.id !== id));
    focusIsbnInput();
  };

  /** Add it again as a fresh scan of its ISBN (the lookup is cached). */
  const retryFailedAdd = (failed: FailedAdd) => {
    updateFailedAdds((current) => current.filter((entry) => entry.id !== failed.id));
    queue.current.push(failed.book.isbn);
    syncScans();
    focusIsbnInput();
    void drain();
  };

  const processScan = async (isbn: string) => {
    let book: Book;
    try {
      book = await lookupBook(isbn);
    } catch (error) {
      const status = error instanceof ApiError ? error.status : null;
      openOrHold({
        mode: 'add',
        defaults: { ...EMPTY_FORM, isbn },
        note:
          status === 422
            ? "That isn't a valid ISBN. Check the number, or clear it and type the title and author."
            : status === 404
              ? 'No book was found for this ISBN. Type the title and author.'
              : `The lookup failed (${errorMessage(error)}). Type the title and author.`,
        initialErrors: status === 422 ? { isbn: 'Not a valid ISBN.' } : undefined,
        fromScan: true,
      });
      return;
    }
    if (!alive.current) return;

    if (isPortalLength(book.title) && isPortalLength(book.author)) {
      await addFromLookup(book);
      return;
    }
    openOrHold({
      mode: 'add',
      defaults: { ...EMPTY_FORM, isbn: book.isbn, title: book.title, author: book.author ?? '' },
      note: !book.author?.trim()
        ? 'The lookup found no author. Type one (or "Unknown" if the book has none).'
        : 'Check the title and author: the portal needs each to be 3 to 100 characters.',
      validateOnOpen: true,
      lookup: book,
      fromScan: true,
    });
  };

  const drain = async () => {
    if (draining.current) return;
    draining.current = true;
    try {
      while (alive.current && queue.current.length > 0 && !held.current && !dialogOpen()) {
        current.current = queue.current.shift()!;
        syncScans();
        await processScan(current.current);
        current.current = null;
      }
    } finally {
      draining.current = false;
      current.current = null;
      syncScans();
    }
  };

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    const text = isbnValue.trim();
    setIsbnValue('');
    if (!text) return;
    // Packages are opened from the station page only: a label scanned here
    // is dropped, so nothing scanned next can land in the wrong package.
    const isLabel = looksLikePackageCode(text);
    setLabelHint(isLabel);
    if (isLabel) return;
    queue.current.push(text);
    syncScans();
    void drain();
  };

  const handleFormSubmit = async (open: FormState, values: ItemFormValues) => {
    const isbn = values.isbn || null;

    if (open.mode === 'add') {
      try {
        const created = await addItem.mutateAsync({
          isbn,
          title: values.title,
          author: values.author,
          source: itemSource(values, open.lookup),
        });
        recordAdded(created);
        closeForm(open.id);
      } catch (error) {
        if (!isConflict(error)) throw error;
        toast.error(error.message);
        closeForm(open.id);
      }
      return;
    }

    try {
      await updateItem.mutateAsync({
        itemId: open.item.id,
        data: {
          isbn,
          title: values.title,
          author: values.author,
          revision: open.item.revision,
          update_cache: !!isbn && values.updateCache,
        },
      });
      toast.success(`Saved “${values.title}”`);
      closeForm(open.id);
    } catch (error) {
      if (!isConflict(error)) throw error;
      // Edited elsewhere or registered meanwhile; the list is being reloaded.
      toast.error(`${error.message} The list has been reloaded.`);
      closeForm(open.id);
    }
  };

  const handleConfirmDelete = async (item: PackageItem) => {
    try {
      await deleteItem.mutateAsync({ itemId: item.id, confirmRegistered: !!item.registered_at });
      toast.success(`Removed “${item.title}”`);
      if (alive.current) forgetSentBefore(item.id);
    } catch (error) {
      if (isConflict(error)) {
        toast.error(`${error.message} The list has been reloaded.`);
      } else {
        toast.error(`Couldn't remove “${item.title}”: ${errorMessage(error)}`);
      }
    } finally {
      if (alive.current) closeDelete();
    }
  };

  // Books still in the package (one removed elsewhere drops out).
  // Warnings for books still in the package with the ISBN they were flagged
  // for: changing a book's ISBN makes it a different book, so its warning goes.
  const sentBeforeNow: Record<number, string[]> = {};
  for (const item of pkg.items) {
    const warning = sentBefore[item.id];
    if (warning && warning.isbn === item.isbn) sentBeforeNow[item.id] = warning.codes;
  }
  const flagged = pkg.items.filter((item) => alertIds.includes(item.id) && sentBeforeNow[item.id]);

  const formProps: Omit<ItemFormDialogProps, 'open' | 'onOpenChange' | 'onSubmit'> | null =
    form === null
      ? null
      : form.mode === 'add'
        ? {
            mode: 'add',
            defaultValues: form.defaults,
            note: form.note,
            initialErrors: form.initialErrors,
            validateOnOpen: form.validateOnOpen,
          }
        : {
            mode: 'edit',
            defaultValues: {
              isbn: form.item.isbn ?? '',
              title: form.item.title,
              author: form.item.author,
              updateCache: false,
            },
          };

  return (
    <div className="space-y-6">
      <PackageHeader pkg={pkg} />

      <form onSubmit={handleScan} className="space-y-2">
        <label htmlFor="isbn-scan" className="text-sm font-medium">
          Scan a book's ISBN
        </label>
        <div className="flex gap-2">
          <Input
            id="isbn-scan"
            ref={isbnInputRef}
            autoFocus
            autoComplete="off"
            spellCheck={false}
            placeholder="Scan the barcode on the back of the book"
            value={isbnValue}
            onChange={(e) => setIsbnValue(e.target.value)}
            className="h-14 text-xl md:text-xl"
          />
          <Button
            type="button"
            variant="outline"
            className="h-14"
            onClick={() => openForm({ mode: 'add', defaults: EMPTY_FORM })}
          >
            Add without ISBN
          </Button>
        </div>
        <p className="h-5 text-sm text-muted-foreground" aria-live="polite">
          <ScanStatus {...scans} />
        </p>
      </form>

      {labelHint && (
        <Alert>
          <AlertDescription className="text-foreground">
            That's a package label. Press Done to finish this package first.
          </AlertDescription>
        </Alert>
      )}

      {failedAdds.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>
            {failedAdds.length === 1
              ? 'A book may not have been added'
              : `${failedAdds.length} books may not have been added`}
          </AlertTitle>
          <AlertDescription className="text-foreground">
            <p>
              Adding failed, but it may have been saved anyway. Check the list below: if the book is
              there, press “It's in the list”; if not, press “Add again”.
            </p>
            <ul className="w-full space-y-2">
              {failedAdds.map((failed) => (
                <li key={failed.id} className="flex flex-wrap items-center gap-2">
                  <span className="mr-auto">
                    “{failed.title}” <span className="text-muted-foreground">({failed.error})</span>
                  </span>
                  <Button size="sm" variant="outline" onClick={() => dismissFailedAdd(failed.id)}>
                    It's in the list
                  </Button>
                  <Button size="sm" onClick={() => retryFailedAdd(failed)}>
                    Add again
                  </Button>
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {flagged.length > 0 && (
        <Alert className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/30">
          <AlertTriangle className="text-yellow-600" />
          <AlertTitle>Already sent to this inmate</AlertTitle>
          <AlertDescription className="text-foreground">
            <ul className="list-disc pl-4">
              {flagged.map((item) => (
                <li key={item.id}>
                  “{item.title}” was also in {sentBeforeNow[item.id].join(', ')}.
                </li>
              ))}
            </ul>
            <span>Check whether they should get these again.</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setAlertIds([]);
                focusIsbnInput();
              }}
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <PackageItemList
        items={pkg.items}
        jurisdiction={pkg.inmate.jurisdiction}
        onEdit={(item) => openForm({ mode: 'edit', item })}
        onDelete={openDelete}
        sentBefore={sentBeforeNow}
      />

      <div className="flex items-center justify-end gap-3">
        {pending > 0 && (
          <span className="text-sm text-muted-foreground">
            Waiting for {booksText(pending)} to be recorded...
          </span>
        )}
        <Button size="lg" disabled={pending > 0} onClick={() => navigate('/packages')}>
          Done
        </Button>
      </div>

      {form && formProps && (
        <ItemFormDialog
          // A new form (another book, or add instead of edit) starts afresh.
          key={form.id}
          {...formProps}
          open
          onOpenChange={(open) => !open && closeForm(form.id)}
          onSubmit={(values) => handleFormSubmit(form, values)}
          onCloseAutoFocus={returnFocus}
        />
      )}

      <DeleteItemDialog
        item={deleting}
        onCancel={closeDelete}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteItem.isPending}
        onCloseAutoFocus={returnFocus}
      />
    </div>
  );
}
