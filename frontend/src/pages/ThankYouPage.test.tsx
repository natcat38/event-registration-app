// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ThankYouPage from './ThankYouPage';
import type { RegistrationResult } from './usePublicRegistration';

const result: RegistrationResult = {
  eventName: 'Career Fair',
  dateTime: '2027-02-05T02:00:00.000Z',
  address: '1 RAFFLES PLACE SINGAPORE 048616',
  registrationNo: '00013',
};

function renderPage(state: unknown) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/thank-you', state }]}>
      <Routes>
        <Route path="/thank-you" element={<ThankYouPage />} />
        <Route path="/" element={<p>home</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('ThankYouPage', () => {
  it('labels the registration number and repeats the event date and address', () => {
    renderPage(result);
    expect(screen.getByText('Registration number')).toBeTruthy();
    expect(screen.getByText('00013')).toBeTruthy();
    expect(screen.getByText('5 Feb 2027, 10:00 am')).toBeTruthy();
    expect(screen.getByText('1 RAFFLES PLACE SINGAPORE 048616')).toBeTruthy();
  });

  it('moves focus to the confirmation heading on arrival', () => {
    renderPage(result);
    expect(document.activeElement).toBe(screen.getByRole('heading', { level: 1 }));
  });

  it('does not claim an email was sent', () => {
    renderPage(result);
    expect(document.body.textContent).not.toMatch(/email/i);
  });

  it('copies the number and says so', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    renderPage(result);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copy number' }));
    });
    expect(writeText).toHaveBeenCalledWith('00013');
    expect(screen.getByRole('status').textContent).toBe('Copied.');
  });

  it('tells the user when copying is not possible', async () => {
    vi.stubGlobal('navigator', {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error('no')) },
    });
    renderPage(result);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copy number' }));
    });
    expect(screen.getByRole('status').textContent).toMatch(/couldn't copy/i);
  });

  it('sends a visit with no state back home', () => {
    renderPage(undefined);
    expect(screen.getByText('home')).toBeTruthy();
  });
});
