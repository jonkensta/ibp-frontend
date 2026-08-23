/**
 * Client for the IBP label print server.
 *
 * The print server (https://github.com/jonkensta/print-server) runs on the
 * machine physically attached to the USB label printer and listens on HTTP
 * (default port 40121). Posting a label PNG to its /print-image endpoint
 * prints it silently, with no browser print dialog.
 *
 * Note on mixed content: browsers allow an HTTPS page to fetch
 * http://localhost / http://127.0.0.1 (loopback is exempt from mixed-content
 * blocking), but block plain-HTTP requests to any other host. So the default
 * URL targets localhost and works when the browser runs on the same machine
 * as the printer; a non-loopback URL only works if the frontend itself is
 * served over plain HTTP.
 */

const STORAGE_KEY = 'ibp-print-server-url';

export const DEFAULT_PRINT_SERVER_URL: string =
  import.meta.env.VITE_PRINT_SERVER_URL || 'http://localhost:40121';

/**
 * How long to wait for the print server before giving up. Kept short so the
 * browser-print fallback appears quickly when the print server is down.
 */
const PRINT_SERVER_TIMEOUT_MS = 3000;

export function getPrintServerUrl(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
  } catch {
    // localStorage unavailable (e.g. blocked); fall through to default
  }
  return DEFAULT_PRINT_SERVER_URL;
}

/**
 * Persist a print server URL override. An empty string (or the default URL)
 * clears the override.
 */
export function setPrintServerUrl(url: string): void {
  const trimmed = url.trim().replace(/\/+$/, '');
  try {
    if (!trimmed || trimmed === DEFAULT_PRINT_SERVER_URL) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, trimmed);
    }
  } catch {
    // localStorage unavailable; the override just won't persist
  }
}

export interface PrintServerHealth {
  status: string;
  service?: string;
  printers?: {
    count: number;
    names: string[];
  };
  error?: string;
}

/**
 * Query the print server's /health endpoint. Throws when the server is
 * unreachable or returns a non-OK status. Defaults to the configured URL;
 * pass an explicit URL to probe a candidate before saving it.
 */
export async function checkPrintServerHealth(
  url: string = getPrintServerUrl()
): Promise<PrintServerHealth> {
  const response = await fetch(`${url.replace(/\/+$/, '')}/health`, {
    method: 'GET',
    signal: AbortSignal.timeout(PRINT_SERVER_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Print server returned status ${response.status}`);
  }

  return (await response.json()) as PrintServerHealth;
}

/**
 * Send a label image to the print server for silent printing.
 *
 * Resolves when the print server has accepted (queued) the job with a label
 * printer attached. Rejects quickly when the server is unreachable, times
 * out, or reports an error, so callers can fall back to browser printing.
 */
export async function printLabelViaPrintServer(label: Blob): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${getPrintServerUrl()}/print-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'image/png',
      },
      body: label,
      signal: AbortSignal.timeout(PRINT_SERVER_TIMEOUT_MS),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      throw new Error('Print server did not respond in time');
    }
    throw new Error('Print server is unreachable');
  }

  if (!response.ok) {
    let message = `Print server returned status ${response.status}`;
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) {
        message = body.error;
      }
    } catch {
      // Non-JSON error body; keep the status-based message
    }
    throw new Error(message);
  }
}
