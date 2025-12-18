import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import type { Jurisdiction, RequestValidationWarnings } from '@/types';

interface RequestFormProps {
  jurisdiction: Jurisdiction;
  inmateId: number;
}

const requestSchema = z.object({
  date_postmarked: z.date({ message: 'Postmark date is required' }),
  date_processed: z.date({ message: 'Processed date is required' }),
  action: z.enum(['Filled', 'Tossed'], { message: 'Action is required' }),
});

type RequestFormData = z.infer<typeof requestSchema>;

export function RequestForm({ jurisdiction, inmateId }: RequestFormProps) {
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [warnings, setWarnings] = useState<RequestValidationWarnings | null>(null);
  const [pendingData, setPendingData] = useState<RequestFormData | null>(null);

  const createRequestMutation = useCreateRequest(jurisdiction, inmateId);
  const validateRequestMutation = useValidateRequest(jurisdiction, inmateId);

  const {
    setValue,
    watch,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
  });

  const datePostmarked = watch('date_postmarked');
  const dateProcessed = watch('date_processed');
  const action = watch('action');

  const onSubmit = async (data: RequestFormData) => {
    const requestData = {
      date_postmarked: format(data.date_postmarked, 'yyyy-MM-dd'),
      date_processed: format(data.date_processed, 'yyyy-MM-dd'),
      action: data.action,
    };

    try {
      const validationWarnings = await validateRequestMutation.mutateAsync(requestData);

      const hasWarnings =
        validationWarnings.entry_age ||
        validationWarnings.release ||
        validationWarnings.postmarkdate;

      if (hasWarnings) {
        setWarnings(validationWarnings);
        setPendingData(data);
        setShowWarningDialog(true);
      } else {
        await createRequestMutation.mutateAsync(requestData);
        reset();
      }
    } catch (error) {
      console.error('Failed to validate request:', error);
    }
  };

  const handleConfirmWithWarnings = async () => {
    if (!pendingData) return;

    const requestData = {
      date_postmarked: format(pendingData.date_postmarked, 'yyyy-MM-dd'),
      date_processed: format(pendingData.date_processed, 'yyyy-MM-dd'),
      action: pendingData.action,
    };

    try {
      await createRequestMutation.mutateAsync(requestData);
      reset();
      setShowWarningDialog(false);
      setWarnings(null);
      setPendingData(null);
    } catch (error) {
      console.error('Failed to create request:', error);
    }
  };

  const handleChangeTossed = () => {
    if (pendingData) {
      setValue('action', 'Tossed');
      handleConfirmWithWarnings();
    }
  };

  const warningList = warnings
    ? [warnings.entry_age, warnings.release, warnings.postmarkdate].filter(Boolean)
    : [];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Add New Request</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {createRequestMutation.isError && (
              <Alert variant="destructive">
                <AlertDescription>Failed to create request. Please try again.</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label>Date Postmarked</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
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
              {errors.date_postmarked && (
                <p className="text-sm text-red-500">{errors.date_postmarked.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Date Processed</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateProcessed ? format(dateProcessed, 'PP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateProcessed}
                    onSelect={(date) => date && setValue('date_processed', date)}
                  />
                </PopoverContent>
              </Popover>
              {errors.date_processed && (
                <p className="text-sm text-red-500">{errors.date_processed.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Action</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={action === 'Filled' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setValue('action', 'Filled')}
                >
                  Filled
                </Button>
                <Button
                  type="button"
                  variant={action === 'Tossed' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setValue('action', 'Tossed')}
                >
                  Tossed
                </Button>
              </div>
              {errors.action && <p className="text-sm text-red-500">{errors.action.message}</p>}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={createRequestMutation.isPending || validateRequestMutation.isPending}
            >
              {validateRequestMutation.isPending ? 'Validating...' : 'Add Request'}
            </Button>
          </form>
        </CardContent>
      </Card>

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
            <Button variant="secondary" onClick={handleChangeTossed}>
              Change to Tossed
            </Button>
            <Button onClick={handleConfirmWithWarnings}>Proceed Anyway</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
