// Test setup file for Vitest
import { afterEach } from 'vitest';
import { cleanup } from 'vitest-browser-react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});
