import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { BrowserRouter } from 'react-router-dom';
import { InmateSearchResults } from './InmateSearchResults';
import type { InmateSearchResult } from '@/types';

function renderWithRouter(ui: React.ReactElement) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

const mockInmates: InmateSearchResult[] = [
  {
    jurisdiction: 'Texas',
    id: 12345,
    first_name: 'John',
    last_name: 'Doe',
    race: 'White',
    sex: 'M',
    release: '2025-01-01',
    url: null,
  },
  {
    jurisdiction: 'Federal',
    id: 67890,
    first_name: 'Jane',
    last_name: 'Smith',
    race: 'Black',
    sex: 'F',
    release: null,
    url: null,
  },
];

describe('InmateSearchResults', () => {
  it('should display "No inmates found" when list is empty', async () => {
    renderWithRouter(<InmateSearchResults inmates={[]} errors={[]} />);

    const noResults = page.getByText(/no inmates found/i);
    await expect.element(noResults).toBeInTheDocument();
  });

  it('should display inmate results with correct formatting', async () => {
    renderWithRouter(<InmateSearchResults inmates={mockInmates} errors={[]} />);

    // Check first inmate
    const inmate1Name = page.getByText(/doe, john/i);
    await expect.element(inmate1Name).toBeInTheDocument();

    const inmate1Id = page.getByText(/texas #00012345/i);
    await expect.element(inmate1Id).toBeInTheDocument();

    const inmate1Race = page.getByText('White');
    await expect.element(inmate1Race).toBeInTheDocument();

    // Check second inmate
    const inmate2Name = page.getByText(/smith, jane/i);
    await expect.element(inmate2Name).toBeInTheDocument();

    const inmate2Id = page.getByText(/federal #00067890/i);
    await expect.element(inmate2Id).toBeInTheDocument();
  });

  it('should display single provider error', async () => {
    const errors = ['Provider A failed to respond'];
    renderWithRouter(<InmateSearchResults inmates={[]} errors={errors} />);

    const errorTitle = page.getByText(/provider error$/i);
    await expect.element(errorTitle).toBeInTheDocument();

    const errorMessage = page.getByText(/some providers encountered errors/i);
    await expect.element(errorMessage).toBeInTheDocument();

    const errorDetail = page.getByText(/provider a failed to respond/i);
    await expect.element(errorDetail).toBeInTheDocument();
  });

  it('should display multiple provider errors with count', async () => {
    const errors = ['Provider A failed', 'Provider B timeout', 'Provider C error'];
    renderWithRouter(<InmateSearchResults inmates={mockInmates} errors={errors} />);

    const errorTitle = page.getByText(/3 provider errors/i);
    await expect.element(errorTitle).toBeInTheDocument();

    const error1 = page.getByText(/provider a failed/i);
    await expect.element(error1).toBeInTheDocument();

    const error2 = page.getByText(/provider b timeout/i);
    await expect.element(error2).toBeInTheDocument();

    const error3 = page.getByText(/provider c error/i);
    await expect.element(error3).toBeInTheDocument();
  });

  it('should create links to inmate detail pages', async () => {
    renderWithRouter(<InmateSearchResults inmates={[mockInmates[0]]} errors={[]} />);

    const link = page.getByRole('link', { name: /doe, john/i });
    const element = await link.query();
    expect(element?.getAttribute('href')).toBe('/inmates/Texas/12345');
  });

  it('should display both inmates and errors together', async () => {
    const errors = ['Provider timeout'];
    renderWithRouter(<InmateSearchResults inmates={mockInmates} errors={errors} />);

    // Should show error
    const errorTitle = page.getByText(/provider error$/i);
    await expect.element(errorTitle).toBeInTheDocument();

    // Should still show inmates
    const inmate1 = page.getByText(/doe, john/i);
    await expect.element(inmate1).toBeInTheDocument();

    const inmate2 = page.getByText(/smith, jane/i);
    await expect.element(inmate2).toBeInTheDocument();
  });
});
