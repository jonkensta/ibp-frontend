import { useState, useEffect, useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCreateRequest, useValidateRequest } from '@/hooks';
import type { Jurisdiction, RequestValidationWarnings, Action } from '@/types';

interface RequestFormProps {
  jurisdiction: Jurisdiction;
  inmateId: number;
  onRequestCreated?: (requestIndex: number, action: Action) => void;
}

const POSTMARK_DATE_COOKIE = 'ibp_last_postmark_date';

const requestSchema = z.object({
  date_postmarked: z.date({ message: 'Postmark date is required' }),
});

type RequestFormData = z.infer<typeof requestSchema>;

function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

function setCookie(name: string, value: string, days: number = 365) {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value};${expires};path=/`;
}

export function RequestForm({ jurisdiction, inmateId, onRequestCreated }: RequestFormProps) {
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [warnings, setWarnings] = useState<RequestValidationWarnings | null>(null);
  const [pendingAction, setPendingAction] = useState<Action | null>(null);

  const fillButtonRef = useRef<HTMLButtonElement>(null);
  const changeTossButtonRef = useRef<HTMLButtonElement>(null);
  const hasInitiallyFocused = useRef(false);

  const createRequestMutation = useCreateRequest(jurisdiction, inmateId);
  const validateRequestMutation = useValidateRequest(jurisdiction, inmateId);

  const {
    setValue,
    control,
    formState: { errors },
  } = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      date_postmarked: undefined,
    },
  });

  const datePostmarked = useWatch({ control, name: 'date_postmarked' });

  // Load postmark date from cookie on mount
  useEffect(() => {
    const savedDate = getCookie(POSTMARK_DATE_COOKIE);
    if (savedDate) {
      const date = new Date(savedDate);
      if (!isNaN(date.getTime())) {
        setValue('date_postmarked', date);
      }
    }
  }, [setValue]);

  // Auto-focus Fill button on initial load when date is available
  useEffect(() => {
    if (datePostmarked && !hasInitiallyFocused.current) {
      fillButtonRef.current?.focus();
      hasInitiallyFocused.current = true;
    }
  }, [datePostmarked]);

  // Auto-focus Change to Toss button when warning dialog opens
  useEffect(() => {
    if (showWarningDialog) {
      // Small delay to ensure dialog is fully rendered
      setTimeout(() => {
        changeTossButtonRef.current?.focus();
      }, 100);
    }
  }, [showWarningDialog]);

  const handleSubmit = async (action: Action) => {
    if (!datePostmarked) {
      return;
    }

    // Save postmark date to cookie
    setCookie(POSTMARK_DATE_COOKIE, datePostmarked.toISOString());

    const requestData = {
      date_postmarked: format(datePostmarked, 'yyyy-MM-dd'),
      date_processed: format(new Date(), 'yyyy-MM-dd'),
      action,
    };

    // Skip validation for "Tossed" requests
    if (action === 'Tossed') {
      try {
        const newRequest = await createRequestMutation.mutateAsync(requestData);
        // Don't reset - keep the date_postmarked value
        toast.success('Request tossed');
        onRequestCreated?.(newRequest.index, action);
      } catch (error) {
        console.error('Failed to create request:', error);
        toast.error('Failed to create request. Please try again.');
      }
      return;
    }

    // Validate "Filled" requests
    try {
      const validationWarnings = await validateRequestMutation.mutateAsync(requestData);

      const hasWarnings =
        validationWarnings.entry_age ||
        validationWarnings.release ||
        validationWarnings.postmarkdate;

      if (hasWarnings) {
        setWarnings(validationWarnings);
        setPendingAction(action);
        setShowWarningDialog(true);
      } else {
        const newRequest = await createRequestMutation.mutateAsync(requestData);
        // Don't reset - keep the date_postmarked value
        toast.success('Request filled successfully');
        onRequestCreated?.(newRequest.index, action);
      }
    } catch (error) {
      console.error('Failed to validate request:', error);
      toast.error('Failed to validate request. Please try again.');
    }
  };

  const handleConfirmWithWarnings = async () => {
    if (!datePostmarked || !pendingAction) return;

    const requestData = {
      date_postmarked: format(datePostmarked, 'yyyy-MM-dd'),
      date_processed: format(new Date(), 'yyyy-MM-dd'),
      action: pendingAction,
    };

    try {
      const newRequest = await createRequestMutation.mutateAsync(requestData);
      // Don't reset - keep the date_postmarked value
      setShowWarningDialog(false);
      setWarnings(null);
      setPendingAction(null);
      toast.success('Request filled successfully');
      onRequestCreated?.(newRequest.index, pendingAction);
    } catch (error) {
      console.error('Failed to create request:', error);
      toast.error('Failed to create request. Please try again.');
    }
  };

  const handleChangeTossed = async () => {
    if (!datePostmarked) return;

    const tossAction: Action = 'Tossed';
    const requestData = {
      date_postmarked: format(datePostmarked, 'yyyy-MM-dd'),
      date_processed: format(new Date(), 'yyyy-MM-dd'),
      action: tossAction,
    };

    try {
      const newRequest = await createRequestMutation.mutateAsync(requestData);
      // Don't reset - keep the date_postmarked value
      setShowWarningDialog(false);
      setWarnings(null);
      setPendingAction(null);
      toast.success('Request tossed');
      onRequestCreated?.(newRequest.index, tossAction);
    } catch (error) {
      console.error('Failed to create request:', error);
      toast.error('Failed to create request. Please try again.');
    }
  };

  const warningList = warnings
    ? [warnings.entry_age, warnings.release, warnings.postmarkdate].filter(Boolean)
    : [];

  return (
    <>
      <div className="space-y-3">
        <h3 className="font-semibold text-sm">Add New Request</h3>

        {createRequestMutation.isError && (
          <Alert variant="destructive">
            <AlertDescription>Failed to create request. Please try again.</AlertDescription>
          </Alert>
        )}

        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-1">
            <Label className="text-xs">Date Postmarked</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal h-9"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {datePostmarked ? format(datePostmarked, 'PP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={datePostmarked}
                  onSelect={(date) => date && setValue('date_postmarked', date)}
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button
            ref={fillButtonRef}
            size="sm"
            onClick={() => handleSubmit('Filled')}
            disabled={
              !datePostmarked ||
              createRequestMutation.isPending ||
              validateRequestMutation.isPending
            }
          >
            Fill
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleSubmit('Tossed')}
            disabled={!datePostmarked || createRequestMutation.isPending}
          >
            Toss
          </Button>
        </div>

        {errors.date_postmarked && (
          <p className="text-sm text-red-500">{errors.date_postmarked.message}</p>
        )}
      </div>

      <Dialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Warnings Detected</DialogTitle>
            <DialogDescription>
              The following warnings were detected for this request:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            {warningList.map((warning, index) => (
              <Alert key={index}>
                <AlertDescription>{warning}</AlertDescription>
              </Alert>
            ))}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowWarningDialog(false)}>
              Cancel
            </Button>
            <Button ref={changeTossButtonRef} variant="secondary" onClick={handleChangeTossed}>
              Change to Toss
            </Button>
            <Button onClick={handleConfirmWithWarnings}>Proceed with Fill</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
