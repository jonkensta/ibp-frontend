import { useForm, useWatch, type Control, type FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUpdateShippingSettings } from '@/hooks';
import { getValidationErrors } from '@/lib/api';
import type { ShippingSettings } from '@/types';

const MAX_LENGTH = 100;

function requiredText(label: string) {
  return z
    .string()
    .trim()
    .min(1, { message: `${label} is required` })
    .max(MAX_LENGTH, { message: `${label} must be at most ${MAX_LENGTH} characters` });
}

const shippingSettingsSchema = z.object({
  return_address: z.object({
    name: requiredText('Name'),
    street1: requiredText('Street address'),
    street2: z
      .string()
      .trim()
      .max(MAX_LENGTH, { message: `Street address 2 must be at most ${MAX_LENGTH} characters` }),
    city: requiredText('City'),
    state: z
      .string()
      .trim()
      .regex(/^[A-Za-z]{2}$/, { message: 'State must be a 2-letter code' }),
    zipcode: z
      .string()
      .trim()
      .regex(/^\d{5}(-\d{4})?$/, { message: 'Zipcode must be 5 digits or ZIP+4 (12345-6789)' }),
  }),
  unit_recipient_name: requiredText('Unit recipient line'),
});

type ShippingSettingsFormData = z.infer<typeof shippingSettingsSchema>;

function toFormData(settings: ShippingSettings): ShippingSettingsFormData {
  return {
    return_address: {
      ...settings.return_address,
      street2: settings.return_address.street2 ?? '',
    },
    unit_recipient_name: settings.unit_recipient_name,
  };
}

function toSettings(data: ShippingSettingsFormData): ShippingSettings {
  return {
    return_address: {
      ...data.return_address,
      street2: data.return_address.street2 || null,
      state: data.return_address.state.toUpperCase(),
    },
    unit_recipient_name: data.unit_recipient_name,
  };
}

const FORM_FIELDS: FieldPath<ShippingSettingsFormData>[] = [
  'return_address.name',
  'return_address.street1',
  'return_address.street2',
  'return_address.city',
  'return_address.state',
  'return_address.zipcode',
  'unit_recipient_name',
];

function isFormField(field: string): field is FieldPath<ShippingSettingsFormData> {
  return (FORM_FIELDS as string[]).includes(field);
}

/** Multi-line preview of the return address as it will read on a shipping label. */
function ReturnAddressPreview({ control }: { control: Control<ShippingSettingsFormData> }) {
  const address = useWatch({ control, name: 'return_address' });

  const cityLine = [
    address.city.trim(),
    [address.state.trim().toUpperCase(), address.zipcode.trim()].filter(Boolean).join(' '),
  ]
    .filter(Boolean)
    .join(', ');

  const lines = [address.name, address.street1, address.street2, cityLine]
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Label preview</p>
      <div
        data-testid="return-address-preview"
        className="w-fit min-w-56 rounded-md border bg-muted/40 px-4 py-3 font-mono text-sm uppercase leading-snug"
      >
        {lines.length > 0 ? (
          lines.map((line, index) => <div key={index}>{line}</div>)
        ) : (
          <div className="text-muted-foreground normal-case">No return address</div>
        )}
      </div>
    </div>
  );
}

interface ShippingSettingsFormProps {
  settings: ShippingSettings;
}

export function ShippingSettingsForm({ settings }: ShippingSettingsFormProps) {
  const updateMutation = useUpdateShippingSettings();

  const {
    register,
    handleSubmit,
    control,
    setError,
    reset,
    formState: { errors, isDirty },
  } = useForm<ShippingSettingsFormData>({
    resolver: zodResolver(shippingSettingsSchema),
    defaultValues: toFormData(settings),
  });

  const onSubmit = async (data: ShippingSettingsFormData) => {
    try {
      const saved = await updateMutation.mutateAsync(toSettings(data));
      reset(toFormData(saved));
      toast.success('Shipping settings saved');
    } catch (error) {
      const fieldErrors = getValidationErrors(error);
      let matched = 0;
      for (const { field, message } of fieldErrors) {
        if (isFormField(field)) {
          setError(field, { type: 'server', message });
          matched += 1;
        }
      }

      if (matched > 0) {
        toast.error('Some fields were rejected by the server. Please review them.');
      } else {
        console.error('Failed to save shipping settings:', error);
        toast.error('Failed to save shipping settings. Please try again.');
      }
    }
  };

  const addressErrors = errors.return_address;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shipping Labels</CardTitle>
        <CardDescription>
          The return address and unit recipient line printed on shipping labels.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
          <div className="grid gap-6 md:grid-cols-[1fr_auto]">
            <fieldset className="space-y-4">
              <legend className="mb-4 font-medium">Return Address</legend>

              <div className="space-y-2">
                <Label htmlFor="return_address.name">Name</Label>
                <Input id="return_address.name" {...register('return_address.name')} />
                {addressErrors?.name && (
                  <p className="text-sm text-red-500">{addressErrors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="return_address.street1">Street Address</Label>
                <Input id="return_address.street1" {...register('return_address.street1')} />
                {addressErrors?.street1 && (
                  <p className="text-sm text-red-500">{addressErrors.street1.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="return_address.street2">Street Address 2 (Optional)</Label>
                <Input id="return_address.street2" {...register('return_address.street2')} />
                {addressErrors?.street2 && (
                  <p className="text-sm text-red-500">{addressErrors.street2.message}</p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="return_address.city">City</Label>
                  <Input id="return_address.city" {...register('return_address.city')} />
                  {addressErrors?.city && (
                    <p className="text-sm text-red-500">{addressErrors.city.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="return_address.state">State</Label>
                  <Input
                    id="return_address.state"
                    className="uppercase"
                    {...register('return_address.state')}
                  />
                  {addressErrors?.state && (
                    <p className="text-sm text-red-500">{addressErrors.state.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="return_address.zipcode">Zipcode</Label>
                  <Input id="return_address.zipcode" {...register('return_address.zipcode')} />
                  {addressErrors?.zipcode && (
                    <p className="text-sm text-red-500">{addressErrors.zipcode.message}</p>
                  )}
                </div>
              </div>
            </fieldset>

            <ReturnAddressPreview control={control} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit_recipient_name">Unit Recipient Line</Label>
            <Input id="unit_recipient_name" {...register('unit_recipient_name')} />
            <p className="text-sm text-muted-foreground">
              Printed above the unit name on labels addressed to a unit, e.g. "ATTN: MAILROOM
              STAFF".
            </p>
            {errors.unit_recipient_name && (
              <p className="text-sm text-red-500">{errors.unit_recipient_name.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={!isDirty || updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
