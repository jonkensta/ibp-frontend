import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ApiError, getValidationErrors } from '@/lib/api';
import { normalizeIsbn } from '@/lib/isbn';
import {
  cleanPortalText,
  isPortalLength,
  PORTAL_LENGTH_MESSAGE,
  PORTAL_MAX_LENGTH,
} from '@/lib/portalText';

const itemSchema = z.object({
  isbn: z.string().refine((value) => !value.trim() || normalizeIsbn(value) !== null, {
    message: 'Not a valid ISBN.',
  }),
  title: z.string().refine(isPortalLength, { message: PORTAL_LENGTH_MESSAGE }),
  author: z.string().refine(isPortalLength, { message: PORTAL_LENGTH_MESSAGE }),
  updateCache: z.boolean(),
});

export type ItemFormValues = z.infer<typeof itemSchema>;

type ItemField = 'isbn' | 'title' | 'author';
const ITEM_FIELDS: ItemField[] = ['isbn', 'title', 'author'];

export interface ItemFormDialogProps {
  open: boolean;
  /** Called with false when the volunteer cancels or closes the dialog. */
  onOpenChange: (open: boolean) => void;
  mode: 'add' | 'edit';
  defaultValues: ItemFormValues;
  /** Why the form opened, e.g. "No book found for this ISBN." */
  note?: string;
  /** Errors to show from the start (e.g. the lookup's "Not a valid ISBN."). */
  initialErrors?: Partial<Record<ItemField, string>>;
  /** Show the prefilled title and author's errors from the start. */
  validateOnOpen?: boolean;
  /**
   * Save the item, given cleaned values (title and author trimmed, the ISBN
   * trimmed). A thrown 422 is shown on its fields; any other error is shown
   * above the buttons. The caller closes the dialog.
   */
  onSubmit: (values: ItemFormValues) => Promise<void>;
  /** Where the focus goes when the dialog closes. */
  onCloseAutoFocus?: (event: Event) => void;
}

/** The dialog to type in a book (manual add) or edit one. */
export function ItemFormDialog({
  open,
  onOpenChange,
  onCloseAutoFocus,
  ...props
}: ItemFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        // The form focuses the field that needs typing.
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={onCloseAutoFocus}
      >
        <DialogHeader>
          <DialogTitle>{props.mode === 'add' ? 'Add a book' : 'Edit book'}</DialogTitle>
          <DialogDescription>
            {props.note ??
              (props.mode === 'add'
                ? 'Type the title and author as they appear on the book.'
                : 'Correct the title, author or ISBN.')}
          </DialogDescription>
        </DialogHeader>
        {/* Mounted only while open, so each opening starts from its defaults. */}
        <ItemForm {...props} onCancel={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function ItemForm({
  mode,
  defaultValues,
  initialErrors,
  validateOnOpen,
  onSubmit,
  onCancel,
}: Omit<ItemFormDialogProps, 'open' | 'onOpenChange' | 'onCloseAutoFocus' | 'note'> & {
  onCancel: () => void;
}) {
  const {
    register,
    handleSubmit,
    control,
    setError,
    setFocus,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues,
    mode: 'onTouched',
  });

  // On opening: show the errors already known and focus the first field the
  // packer has to fix or fill (the ISBN only when it's what's wrong).
  useEffect(() => {
    for (const field of ITEM_FIELDS) {
      const message = initialErrors?.[field];
      if (message) setError(field, { message });
    }
    if (validateOnOpen) {
      const prefilled = ITEM_FIELDS.filter((field) => field !== 'isbn' && defaultValues[field]);
      if (prefilled.length > 0) void trigger(prefilled);
    }
    const first: ItemField = initialErrors?.isbn
      ? 'isbn'
      : !isPortalLength(defaultValues.title)
        ? 'title'
        : !isPortalLength(defaultValues.author)
          ? 'author'
          : 'title';
    setFocus(first);
    // Only when the form opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [isbn, title, author] = useWatch({ control, name: ['isbn', 'title', 'author'] });

  const submit = async (values: ItemFormValues) => {
    try {
      await onSubmit({
        ...values,
        isbn: values.isbn.trim(),
        title: cleanPortalText(values.title),
        author: cleanPortalText(values.author),
      });
    } catch (error) {
      const fieldErrors = getValidationErrors(error);
      const unplaced: string[] = [];
      for (const { field, message } of fieldErrors) {
        if ((ITEM_FIELDS as string[]).includes(field)) {
          setError(field as ItemField, { message });
        } else {
          unplaced.push(message);
        }
      }
      if (fieldErrors.length === 0) {
        unplaced.push(
          error instanceof ApiError || error instanceof Error ? error.message : String(error)
        );
      }
      if (unplaced.length > 0) setError('root.server', { message: unplaced.join(' ') });
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
      <div className="space-y-1">
        <Label htmlFor="item-isbn">ISBN (optional)</Label>
        <Input
          id="item-isbn"
          autoComplete="off"
          aria-invalid={!!errors.isbn}
          {...register('isbn')}
        />
        {errors.isbn && <p className="text-sm text-destructive">{errors.isbn.message}</p>}
      </div>

      <TextField
        id="item-title"
        label="Title"
        length={cleanPortalText(title ?? '').length}
        error={errors.title?.message}
        inputProps={register('title')}
      />
      <TextField
        id="item-author"
        label="Author"
        length={cleanPortalText(author ?? '').length}
        error={errors.author?.message}
        inputProps={register('author')}
        help='No author on the book? Type "Unknown".'
      />

      {mode === 'edit' && isbn?.trim() && (
        <div className="flex items-center gap-2">
          <input
            id="item-update-cache"
            type="checkbox"
            className="h-4 w-4"
            {...register('updateCache')}
          />
          <Label htmlFor="item-update-cache">Fix this title for all future scans</Label>
        </div>
      )}

      {errors.root?.server && (
        <Alert variant="destructive">
          <AlertDescription>{errors.root.server.message}</AlertDescription>
        </Alert>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : mode === 'add' ? 'Add book' : 'Save'}
        </Button>
      </DialogFooter>
    </form>
  );
}

function TextField({
  id,
  label,
  length,
  error,
  inputProps,
  help,
}: {
  id: string;
  label: string;
  length: number;
  error?: string;
  inputProps: React.ComponentProps<'input'>;
  help?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        <span
          className={`text-xs ${length > PORTAL_MAX_LENGTH ? 'text-destructive' : 'text-muted-foreground'}`}
        >
          {length}/{PORTAL_MAX_LENGTH}
        </span>
      </div>
      <Input id={id} autoComplete="off" aria-invalid={!!error} {...inputProps} />
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        help && <p className="text-xs text-muted-foreground">{help}</p>
      )}
    </div>
  );
}
