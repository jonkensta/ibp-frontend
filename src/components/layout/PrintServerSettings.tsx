import { useState } from 'react';
import { toast } from 'sonner';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DEFAULT_PRINT_SERVER_URL,
  checkPrintServerHealth,
  getPrintServerUrl,
  setPrintServerUrl,
} from '@/lib/printServer';

/**
 * Header affordance for configuring the label print server URL.
 *
 * Labels print silently through the print server when it is reachable;
 * otherwise the app falls back to the browser print dialog. This dialog lets
 * volunteers point the app at the right print server and test the connection.
 */
export function PrintServerSettings() {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [testing, setTesting] = useState(false);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setUrl(getPrintServerUrl());
    }
    setOpen(nextOpen);
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const health = await checkPrintServerHealth(url || DEFAULT_PRINT_SERVER_URL);
      const count = health.printers?.count ?? 0;
      if (health.status === 'ok' && count > 0) {
        toast.success(
          `Print server connected (${count} printer${count === 1 ? '' : 's'}: ${health.printers?.names.join(', ')})`
        );
      } else if (health.status === 'ok') {
        toast.warning('Print server is running but no label printer is connected');
      } else {
        toast.warning(`Print server reported status: ${health.status}`);
      }
    } catch (error) {
      console.error('Print server health check failed:', error);
      toast.error('Could not reach the print server. Labels will use the browser print dialog.');
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    setPrintServerUrl(url);
    setOpen(false);
    toast.success('Print server settings saved');
  };

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        className="ml-2"
        onClick={() => handleOpenChange(true)}
        aria-label="Print server settings"
      >
        <Printer className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Print Server Settings</DialogTitle>
            <DialogDescription>
              Labels print silently through the print server when it is reachable. If it is not,
              the browser print dialog is used instead.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="print-server-url">Print server URL</Label>
            <Input
              id="print-server-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={DEFAULT_PRINT_SERVER_URL}
            />
            <p className="text-xs text-muted-foreground">
              Default: {DEFAULT_PRINT_SERVER_URL}. Leave empty to reset. Note: when this page is
              served over HTTPS, browsers only allow plain-HTTP print servers on localhost.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleTest} disabled={testing}>
              {testing ? 'Testing...' : 'Test connection'}
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
