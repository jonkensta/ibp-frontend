import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { createWrapper } from '@/test/utils';
import { PackageStationPage } from './PackageStationPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

async function scan(text: string) {
  const input = page.getByLabelText('Package label');
  await input.fill(text);
  await userEvent.keyboard('{Enter}');
}

describe('PackageStationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('focuses the scan box', async () => {
    await render(<PackageStationPage />, { wrapper: createWrapper() });
    await expect.element(page.getByLabelText('Package label')).toHaveFocus();
  });

  it('opens a scanned package label as typed', async () => {
    await render(<PackageStationPage />, { wrapper: createWrapper() });
    await scan('tex-1234567-2');
    expect(mockNavigate).toHaveBeenCalledWith('/packages/tex-1234567-2');
    await expect.element(page.getByLabelText('Package label')).toHaveValue('');
    await expect.element(page.getByLabelText('Package label')).toHaveFocus();
  });

  it('hints instead of opening an inmate number', async () => {
    await render(<PackageStationPage />, { wrapper: createWrapper() });
    await scan('01234567');
    await expect.element(page.getByText(/inmate number/i)).toBeInTheDocument();
    await expect.element(page.getByText(/starts with TEX- or FED-/)).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('hints instead of opening an old label number', async () => {
    await render(<PackageStationPage />, { wrapper: createWrapper() });
    await scan('268213');
    await expect.element(page.getByText(/old label/i)).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('hints instead of opening an ISBN', async () => {
    await render(<PackageStationPage />, { wrapper: createWrapper() });
    await scan('9780140449136');
    await expect.element(page.getByText(/book's ISBN/i)).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('clears the hint when a label is scanned next', async () => {
    await render(<PackageStationPage />, { wrapper: createWrapper() });
    await scan('9780140449136');
    await expect.element(page.getByText(/book's ISBN/i)).toBeInTheDocument();
    await scan('FED-12345678-0');
    expect(mockNavigate).toHaveBeenCalledWith('/packages/FED-12345678-0');
    await expect.element(page.getByText(/book's ISBN/i)).not.toBeInTheDocument();
  });

  it('ignores an empty scan', async () => {
    await render(<PackageStationPage />, { wrapper: createWrapper() });
    await scan('   ');
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
