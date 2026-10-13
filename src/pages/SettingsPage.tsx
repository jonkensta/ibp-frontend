import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShippingSettingsForm, ShippingSettingsFormSkeleton } from '@/components/settings';
import { useShippingSettings } from '@/hooks';

export function SettingsPage() {
  const { data: settings, isLoading, isError } = useShippingSettings();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      {isLoading ? (
        <ShippingSettingsFormSkeleton />
      ) : isError || !settings ? (
        <Alert variant="destructive">
          <AlertDescription>Failed to load shipping settings. Please try again.</AlertDescription>
        </Alert>
      ) : (
        <ShippingSettingsForm settings={settings} />
      )}
    </div>
  );
}
