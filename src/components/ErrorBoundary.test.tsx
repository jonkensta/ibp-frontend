import { describe, it, expect, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { ErrorBoundary } from './ErrorBoundary';

// Component that throws an error
function Bomb() {
  throw new Error('Boom!');
  return null;
}

describe('ErrorBoundary', () => {
  it('should catch errors and display fallback UI', async () => {
    // Prevent console.error from cluttering output
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    );

    const title = page.getByText(/something went wrong/i);
    await expect.element(title).toBeInTheDocument();

    const tryAgainButton = page.getByRole('button', { name: /try again/i });
    await expect.element(tryAgainButton).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('should render children when no error occurs', async () => {
    render(
      <ErrorBoundary>
        <div>Safe Content</div>
      </ErrorBoundary>
    );

    const content = page.getByText('Safe Content');
    await expect.element(content).toBeInTheDocument();
  });
});
