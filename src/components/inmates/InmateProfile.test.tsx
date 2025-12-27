import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { BrowserRouter } from 'react-router-dom';
import { InmateProfile } from './InmateProfile';
import type { Inmate } from '@/types';

function renderWithRouter(ui: React.ReactElement) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

const mockInmate: Inmate = {
  jurisdiction: 'Texas',
  id: 12345,
  first_name: 'John',
  last_name: 'Doe',
  race: 'White',
  sex: 'M',
  release: '2025-12-24',
  url: 'https://example.com/inmate/12345',
  datetime_fetched: '2024-12-20T10:00:00Z',
  unit: {
    jurisdiction: 'Texas',
    name: 'Test Unit',
    street1: '123 Main St',
    street2: null,
    city: 'Austin',
    state: 'TX',
    zipcode: '78701',
    url: null,
    shipping_method: 'Box',
  },
  requests: [],
  comments: [],
  lookups: [
    { datetime_created: '2024-12-20T09:00:00Z' },
    { datetime_created: '2024-12-19T14:30:00Z' },
  ],
};

describe('InmateProfile', () => {
  it('should display basic inmate information', async () => {
    renderWithRouter(<InmateProfile inmate={mockInmate} />);

    const name = page.getByText(/doe, john/i);
    await expect.element(name).toBeInTheDocument();

    const id = page.getByText(/texas #00012345/i);
    await expect.element(id).toBeInTheDocument();

    const unit = page.getByText(/test unit/i);
    await expect.element(unit).toBeInTheDocument();

    const race = page.getByText('White');
    await expect.element(race).toBeInTheDocument();

    const sex = page.getByText('M', { exact: true });
    await expect.element(sex).toBeInTheDocument();
  });

  it('should display release date when valid', async () => {
    renderWithRouter(<InmateProfile inmate={mockInmate} />);

    // Matches Dec 23 or 24 depending on timezone
    const releaseDate = page.getByText(/december 2\d, 2025/i);
    await expect.element(releaseDate).toBeInTheDocument();
  });

  it('should display raw release value when not a valid date', async () => {
    const inmateWithInvalidDate = {
      ...mockInmate,
      release: 'LIFE',
    };

    renderWithRouter(<InmateProfile inmate={inmateWithInvalidDate} />);

    const release = page.getByText('LIFE');
    await expect.element(release).toBeInTheDocument();
  });

  it('should display data last updated', async () => {
    renderWithRouter(<InmateProfile inmate={mockInmate} />);

    const lastUpdated = page.getByText(/data last updated/i);
    await expect.element(lastUpdated).toBeInTheDocument();

    // Should show "X days ago" or similar
    const timeAgo = page.getByText(/ago$/);
    await expect.element(timeAgo).toBeInTheDocument();
  });

  it('should display recent lookups', async () => {
    renderWithRouter(<InmateProfile inmate={mockInmate} />);

    const lookupHeader = page.getByText(/recent lookups/i);
    await expect.element(lookupHeader).toBeInTheDocument();

    // Should show formatted dates
    const lookup1 = page.getByText(/dec 20, 2024/i);
    await expect.element(lookup1).toBeInTheDocument();

    const lookup2 = page.getByText(/dec 19, 2024/i);
    await expect.element(lookup2).toBeInTheDocument();
  });

  it('should link inmate name to official record when url is provided', async () => {
    renderWithRouter(<InmateProfile inmate={mockInmate} />);

    const nameLink = page.getByRole('link', { name: /doe, john/i });
    const element = await nameLink.query();
    expect(element?.getAttribute('href')).toBe('https://example.com/inmate/12345');
    expect(element?.getAttribute('target')).toBe('_blank');
    expect(element?.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('should display name as text when url is not provided', async () => {
    const inmateWithoutUrl = {
      ...mockInmate,
      url: null,
    };

    renderWithRouter(<InmateProfile inmate={inmateWithoutUrl} />);

    const name = page.getByText(/doe, john/i);
    await expect.element(name).toBeInTheDocument();

    const nameLink = page.getByRole('link', { name: /doe, john/i });
    expect(await nameLink.query()).toBeNull();
  });

  it('should link unit name to unit detail page', async () => {
    renderWithRouter(<InmateProfile inmate={mockInmate} />);

    const unitLink = page.getByRole('link', { name: /test unit/i });
    const element = await unitLink.query();
    expect(element?.getAttribute('href')).toBe('/units/Texas/Test%20Unit');
  });

  it('should not display optional fields when they are null', async () => {
    const inmateWithoutOptionals = {
      ...mockInmate,
      race: null,
      sex: null,
      release: null,
    };

    renderWithRouter(<InmateProfile inmate={inmateWithoutOptionals} />);

    const raceLabel = page.getByText(/^race$/i);
    expect(await raceLabel.query()).toBeNull();

    const sexLabel = page.getByText(/^sex$/i);
    expect(await sexLabel.query()).toBeNull();

    const releaseLabel = page.getByText(/release date/i);
    expect(await releaseLabel.query()).toBeNull();
  });

});
