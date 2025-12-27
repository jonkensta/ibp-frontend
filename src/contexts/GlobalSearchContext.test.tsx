import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { GlobalSearchProvider, useGlobalSearch } from './GlobalSearchContext';

// Test component that uses the hook
function TestComponent() {
  const { globalSearchRef } = useGlobalSearch();
  return (
    <div>
      <div data-testid="ref-exists">
        {globalSearchRef ? 'Ref Object Exists' : 'No Ref Object'}
      </div>
      <div data-testid="ref-type">
        {typeof globalSearchRef}
      </div>
    </div>
  );
}

// Test component that uses hook outside provider (for error testing)
function ComponentOutsideProvider() {
  try {
    useGlobalSearch();
    return <div>Should not render</div>;
  } catch (error) {
    return <div data-testid="error">{(error as Error).message}</div>;
  }
}

describe('GlobalSearchContext', () => {
  describe('GlobalSearchProvider', () => {
    it('should render children', async () => {
      render(
        <GlobalSearchProvider>
          <div data-testid="child">Test Child</div>
        </GlobalSearchProvider>
      );

      const child = page.getByTestId('child');
      await expect.element(child).toBeInTheDocument();
      await expect.element(child).toHaveTextContent('Test Child');
    });

    it('should provide globalSearchRef to children', async () => {
      render(
        <GlobalSearchProvider>
          <TestComponent />
        </GlobalSearchProvider>
      );

      const refExists = page.getByTestId('ref-exists');
      await expect.element(refExists).toBeInTheDocument();
      await expect.element(refExists).toHaveTextContent('Ref Object Exists');
    });

    it('should provide a ref object', async () => {
      render(
        <GlobalSearchProvider>
          <TestComponent />
        </GlobalSearchProvider>
      );

      const refType = page.getByTestId('ref-type');
      await expect.element(refType).toBeInTheDocument();
      await expect.element(refType).toHaveTextContent('object');
    });
  });

  describe('useGlobalSearch', () => {
    it('should throw error when used outside provider', async () => {
      render(<ComponentOutsideProvider />);

      const error = page.getByTestId('error');
      await expect.element(error).toBeInTheDocument();
      await expect.element(error).toHaveTextContent(
        'useGlobalSearch must be used within GlobalSearchProvider'
      );
    });

    it('should return context value when used inside provider', async () => {
      render(
        <GlobalSearchProvider>
          <TestComponent />
        </GlobalSearchProvider>
      );

      const refExists = page.getByTestId('ref-exists');
      await expect.element(refExists).toBeInTheDocument();
      await expect.element(refExists).toHaveTextContent('Ref Object Exists');
    });
  });
});
