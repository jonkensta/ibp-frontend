import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateUnit } from '@/hooks';
import type { Jurisdiction, ShippingMethod } from '@/types';

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

const unitCreateSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  jurisdiction: z.enum(['Texas', 'Federal']),
  street1: z.string().min(1, { message: 'Street address is required' }),
  street2: z.string().optional(),
  city: z.string().min(1, { message: 'City is required' }),
  state: z.string().length(2, { message: 'State must be a 2-letter code' }),
  zipcode: z
    .string()
    .min(5, { message: 'Zipcode must be at least 5 characters' })
    .max(12, { message: 'Zipcode must be at most 12 characters' }),
  url: z.string().url({ message: 'Must be a valid URL' }).optional().or(z.literal('')),
  shipping_method: z.enum(['Box', 'Individual']).nullable().optional(),
});

type UnitCreateFormData = z.infer<typeof unitCreateSchema>;

export function UnitCreateForm() {
  const navigate = useNavigate();
  const createUnitMutation = useCreateUnit();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<UnitCreateFormData>({
    resolver: zodResolver(unitCreateSchema),
    defaultValues: {
      name: '',
      jurisdiction: 'Texas',
      street1: '',
      street2: '',
      city: '',
      state: 'TX',
      zipcode: '',
      url: '',
      shipping_method: null,
    },
  });

  const jurisdiction = useWatch({ control, name: 'jurisdiction' });
  const shippingMethod = useWatch({ control, name: 'shipping_method' });
  const state = useWatch({ control, name: 'state' });

  const onSubmit = async (data: UnitCreateFormData) => {
    const createData = {
      ...data,
      street2: data.street2 || null,
      url: data.url || null,
      shipping_method: data.shipping_method || null,
    };

    try {
      const newUnit = await createUnitMutation.mutateAsync(createData);
      // Navigate to the newly created unit's detail page
      navigate(`/units/${encodeURIComponent(newUnit.jurisdiction)}/${encodeURIComponent(newUnit.name)}`);
    } catch (error) {
      console.error('Failed to create unit:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Unit</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {createUnitMutation.isError && (
            <Alert variant="destructive">
              <AlertDescription>Failed to create unit. Please try again.</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="jurisdiction">Jurisdiction</Label>
              <Select value={jurisdiction} onValueChange={(value: string) => setValue('jurisdiction', value as Jurisdiction, { shouldDirty: true })}>
                <SelectTrigger id="jurisdiction">
                  <SelectValue placeholder="Select jurisdiction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Texas">Texas</SelectItem>
                  <SelectItem value="Federal">Federal</SelectItem>
                </SelectContent>
              </Select>
              {errors.jurisdiction && <p className="text-sm text-red-500">{errors.jurisdiction.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="street1">Street Address</Label>
            <Input id="street1" {...register('street1')} />
            {errors.street1 && <p className="text-sm text-red-500">{errors.street1.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="street2">Street Address 2 (Optional)</Label>
            <Input id="street2" {...register('street2')} />
            {errors.street2 && <p className="text-sm text-red-500">{errors.street2.message}</p>}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" {...register('city')} />
              {errors.city && <p className="text-sm text-red-500">{errors.city.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Select value={state} onValueChange={(value: string) => setValue('state', value, { shouldDirty: true })}>
                <SelectTrigger id="state">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.state && <p className="text-sm text-red-500">{errors.state.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="zipcode">Zipcode</Label>
              <Input id="zipcode" {...register('zipcode')} />
              {errors.zipcode && <p className="text-sm text-red-500">{errors.zipcode.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">URL (Optional)</Label>
            <Input id="url" type="url" placeholder="https://..." {...register('url')} />
            {errors.url && <p className="text-sm text-red-500">{errors.url.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="shipping_method">Shipping Method (Optional)</Label>
            <Select
              value={shippingMethod || 'none'}
              onValueChange={(value: string) => setValue('shipping_method', value === 'none' ? null : (value as ShippingMethod), { shouldDirty: true })}
            >
              <SelectTrigger id="shipping_method">
                <SelectValue placeholder="Select shipping method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="Box">Box</SelectItem>
                <SelectItem value="Individual">Individual</SelectItem>
              </SelectContent>
            </Select>
            {errors.shipping_method && <p className="text-sm text-red-500">{errors.shipping_method.message}</p>}
          </div>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => navigate('/units')}
              disabled={createUnitMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={createUnitMutation.isPending}>
              {createUnitMutation.isPending ? 'Creating...' : 'Create Unit'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
