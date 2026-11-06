import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { PackageItem } from '@/types';

interface DeleteItemDialogProps {
  /** The item to delete; the dialog is open while it's set. */
  item: PackageItem | null;
  onCancel: () => void;
  onConfirm: (item: PackageItem) => void;
  isDeleting: boolean;
  onCloseAutoFocus?: (event: Event) => void;
}

/** Confirms removing a book; for a registered one, says the portal entry stays. */
export function DeleteItemDialog({
  item,
  onCancel,
  onConfirm,
  isDeleting,
  onCloseAutoFocus,
}: DeleteItemDialogProps) {
  return (
    <Dialog open={item !== null} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent onCloseAutoFocus={onCloseAutoFocus}>
        <DialogHeader>
          <DialogTitle>Remove book</DialogTitle>
          <DialogDescription>
            {item?.registered_at
              ? `“${item.title}” is registered on the portal; it stays registered there. Remove it from this package anyway?`
              : `Remove “${item?.title}” from this package?`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => item && onConfirm(item)}
            disabled={isDeleting}
          >
            {isDeleting ? 'Removing...' : 'Remove'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
