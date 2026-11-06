import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScanLine } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { classifyPackageScan } from '@/lib/packageScan';

/**
 * The packing station's start page: one large box that keeps the focus, so a
 * barcode scanner (which types the label's code and Enter) opens the package.
 */
export function PackageStationPage() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState('');
  const [hint, setHint] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const scan = classifyPackageScan(value);
    setValue('');
    if (scan.kind === 'empty') return;
    if (scan.kind === 'hint') {
      setHint(scan.message);
      return;
    }
    setHint(null);
    navigate(`/packages/${encodeURIComponent(scan.code)}`);
  };

  // Keep the focus for the scanner, unless the volunteer moved it somewhere
  // on purpose (a link or another field); clicking the page background
  // doesn't count.
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.relatedTarget === null) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 pt-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <ScanLine className="h-6 w-6" />
          Packing station
        </h1>
        <p className="mt-2 text-muted-foreground">
          Scan the package label (TEX-… or FED-…) to record the books in the package.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <label htmlFor="package-scan" className="sr-only">
          Package label
        </label>
        <Input
          id="package-scan"
          ref={inputRef}
          autoFocus
          autoComplete="off"
          spellCheck={false}
          placeholder="Scan the package label"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleBlur}
          className="h-16 text-2xl md:text-2xl"
        />
      </form>

      {hint && (
        <Alert>
          <AlertDescription className="text-base text-foreground">{hint}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
