import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createRequest,
  deleteRequest,
  getRequestLabel,
  getRequestLabelPdfUrl,
  getInmateWarnings,
  validateRequest,
} from '@/lib/api';
import { printLabelViaPrintServer } from '@/lib/printServer';
import type { Jurisdiction, RequestCreate } from '@/types';

export function useInmateWarnings(jurisdiction: Jurisdiction, inmateId: number) {
  return useQuery({
    queryKey: ['inmates', jurisdiction, inmateId, 'warnings'],
    queryFn: () => getInmateWarnings(jurisdiction, inmateId),
  });
}

export function useCreateRequest(jurisdiction: Jurisdiction, inmateId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RequestCreate) => createRequest(jurisdiction, inmateId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inmates', jurisdiction, inmateId] });
    },
  });
}

export function useDeleteRequest(jurisdiction: Jurisdiction, inmateId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestIndex: number) => deleteRequest(jurisdiction, inmateId, requestIndex),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inmates', jurisdiction, inmateId] });
    },
  });
}

export function useValidateRequest(jurisdiction: Jurisdiction, inmateId: number) {
  return useMutation({
    mutationFn: (data: RequestCreate) => validateRequest(jurisdiction, inmateId, data),
  });
}

export type PrintLabelResult =
  | { method: 'print-server' }
  | { method: 'browser'; printServerError: string };

/**
 * Print a request label.
 *
 * First tries the print server for silent one-click printing; if it is
 * unreachable or errors, falls back to opening the label as a PDF in a new
 * tab. The PDF page is exactly the label size, so the browser's PDF viewer
 * prints it without the scaling and margin problems of printing an HTML page
 * (notably in Firefox). The returned result says which path was used so
 * callers can surface appropriate feedback.
 */
export async function printRequestLabel(
  jurisdiction: Jurisdiction,
  inmateId: number,
  requestIndex: number
): Promise<PrintLabelResult> {
  const blob = await getRequestLabel(jurisdiction, inmateId, requestIndex);

  let printServerError: string;
  try {
    await printLabelViaPrintServer(blob);
    return { method: 'print-server' };
  } catch (error) {
    printServerError = error instanceof Error ? error.message : String(error);
    console.warn('Print server unavailable, falling back to browser printing:', error);
  }

  openLabelPdf(getRequestLabelPdfUrl(jurisdiction, inmateId, requestIndex));
  return { method: 'browser', printServerError };
}

/** Open the label PDF in a new tab for printing from the browser's PDF viewer. */
function openLabelPdf(url: string): void {
  const pdfWindow = window.open(url, '_blank');
  if (!pdfWindow) {
    throw new Error('Failed to open the label PDF. Please allow popups for this site.');
  }
}
