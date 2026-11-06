import { useRef, useState } from 'react';
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
import type { Book, Package, PackageItem, PackageItemCreate } from '@/types';

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

type FormState =
  | {
      mode: 'add';
      defaults: ItemFormValues;
      note?: string;
      initialErrors?: ItemFormDialogProps['initialErrors'];
      validateOnOpen?: boolean;
      /** The lookup the form was prefilled from, if any. */
      lookup?: Book;
    }
  | { mode: 'edit'; item: PackageItem };

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
  const [previouslySent, setPreviouslySent] = useState<{
    title: string;
    codes: string[];
  } | null>(null);

  // Scans wait in a queue and are looked up one at a time, so a book scanned
  // while another is being looked up isn't lost. The queue pauses while the
  // form is open (a lookup that failed) and resumes when it closes.
  const queue = useRef<string[]>([]);
  const draining = useRef(false);
  const formOpen = useRef(false);
  const [lookingUp, setLookingUp] = useState<{ isbn: string; waiting: number } | null>(null);

  const focusIsbnInput = () => isbnInputRef.current?.focus();

  const returnFocus = (event: Event) => {
    event.preventDefault();
    focusIsbnInput();
  };

  const openForm = (state: FormState) => {
    formOpen.current = true;
    setForm(state);
  };

  const closeForm = () => {
    formOpen.current = false;
    setForm(null);
    void drain();
  };

  const recordAdded = (title: string, codes: string[]) => {
    toast.success(`Added “${title}”`);
    setPreviouslySent(codes.length > 0 ? { title, codes } : null);
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
      recordAdded(created.title, created.previously_sent);
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) {
        // The backend's checks disagreed with ours: let the packer fix it.
        openForm({
          mode: 'add',
          defaults: { ...EMPTY_FORM, isbn: book.isbn, title: data.title, author: data.author },
          note: `The book couldn't be added as looked up: ${error.message}`,
          lookup: book,
          validateOnOpen: true,
        });
      } else {
        toast.error(`Couldn't add “${data.title}”: ${errorMessage(error)}`);
      }
    }
  };

  const processScan = async (isbn: string) => {
    let book: Book;
    try {
      book = await lookupBook(isbn);
    } catch (error) {
      const status = error instanceof ApiError ? error.status : null;
      openForm({
        mode: 'add',
        defaults: { ...EMPTY_FORM, isbn },
        note:
          status === 422
            ? "That isn't a valid ISBN. Check the number, or clear it and type the title and author."
            : status === 404
              ? 'No book was found for this ISBN. Type the title and author.'
              : `The lookup failed (${errorMessage(error)}). Type the title and author.`,
        initialErrors: status === 422 ? { isbn: 'Not a valid ISBN.' } : undefined,
      });
      return;
    }

    if (isPortalLength(book.title) && isPortalLength(book.author)) {
      await addFromLookup(book);
      return;
    }
    openForm({
      mode: 'add',
      defaults: { ...EMPTY_FORM, isbn: book.isbn, title: book.title, author: book.author ?? '' },
      note: !book.author?.trim()
        ? 'The lookup found no author. Type one (or "Unknown" if the book has none).'
        : 'Check the title and author: the portal needs each to be 3 to 100 characters.',
      validateOnOpen: true,
      lookup: book,
    });
  };

  const drain = async () => {
    if (draining.current) return;
    draining.current = true;
    try {
      while (queue.current.length > 0 && !formOpen.current) {
        const isbn = queue.current.shift()!;
        setLookingUp({ isbn, waiting: queue.current.length });
        await processScan(isbn);
      }
    } finally {
      draining.current = false;
      setLookingUp(null);
    }
  };

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    const text = isbnValue.trim();
    setIsbnValue('');
    if (!text) return;
    if (looksLikePackageCode(text)) {
      // The next package's label, scanned without pressing Done.
      navigate(`/packages/${encodeURIComponent(text)}`);
      return;
    }
    queue.current.push(text);
    void drain();
  };

  // Keep the focus for the scanner unless it moved somewhere on purpose.
  const handleIsbnBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.relatedTarget === null && !formOpen.current && deleting === null) {
      setTimeout(() => {
        if (!formOpen.current) focusIsbnInput();
      }, 0);
    }
  };

  const handleFormSubmit = async (values: ItemFormValues) => {
    if (!form) return;
    const isbn = values.isbn || null;

    if (form.mode === 'add') {
      try {
        const created = await addItem.mutateAsync({
          isbn,
          title: values.title,
          author: values.author,
          source: itemSource(values, form.lookup),
        });
        recordAdded(created.title, created.previously_sent);
        closeForm();
      } catch (error) {
        if (!isConflict(error)) throw error;
        toast.error(error.message);
        closeForm();
      }
      return;
    }

    try {
      await updateItem.mutateAsync({
        itemId: form.item.id,
        data: {
          isbn,
          title: values.title,
          author: values.author,
          revision: form.item.revision,
          update_cache: !!isbn && values.updateCache,
        },
      });
      toast.success(`Saved “${values.title}”`);
      closeForm();
    } catch (error) {
      if (!isConflict(error)) throw error;
      // Edited elsewhere or registered meanwhile; the list is being reloaded.
      toast.error(`${error.message} The list has been reloaded.`);
      closeForm();
    }
  };

  const handleConfirmDelete = async (item: PackageItem) => {
    try {
      await deleteItem.mutateAsync({ itemId: item.id, confirmRegistered: !!item.registered_at });
      toast.success(`Removed “${item.title}”`);
    } catch (error) {
      if (isConflict(error)) {
        toast.error(`${error.message} The list has been reloaded.`);
      } else {
        toast.error(`Couldn't remove “${item.title}”: ${errorMessage(error)}`);
      }
    } finally {
      setDeleting(null);
    }
  };

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
            onBlur={handleIsbnBlur}
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
          {lookingUp &&
            `Looking up ${lookingUp.isbn}...${lookingUp.waiting > 0 ? ` (${lookingUp.waiting} more waiting)` : ''}`}
        </p>
      </form>

      {previouslySent && (
        <Alert className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/30">
          <AlertTriangle className="text-yellow-600" />
          <AlertTitle>Already sent to this inmate</AlertTitle>
          <AlertDescription className="text-foreground">
            “{previouslySent.title}” was also in {previouslySent.codes.join(', ')}. Check whether
            they should get it again.
          </AlertDescription>
        </Alert>
      )}

      <PackageItemList
        items={pkg.items}
        jurisdiction={pkg.inmate.jurisdiction}
        onEdit={(item) => openForm({ mode: 'edit', item })}
        onDelete={setDeleting}
      />

      <div className="flex justify-end">
        <Button size="lg" onClick={() => navigate('/packages')}>
          Done
        </Button>
      </div>

      {formProps && (
        <ItemFormDialog
          {...formProps}
          open
          onOpenChange={(open) => !open && closeForm()}
          onSubmit={handleFormSubmit}
          onCloseAutoFocus={returnFocus}
        />
      )}

      <DeleteItemDialog
        item={deleting}
        onCancel={() => setDeleting(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteItem.isPending}
        onCloseAutoFocus={returnFocus}
      />
    </div>
  );
}
