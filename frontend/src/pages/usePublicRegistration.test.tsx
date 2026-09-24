// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ApiError, PublicEvent } from '../api/client';
import { usePublicRegistration } from './usePublicRegistration';

vi.mock('../api/client', () => ({
  listPublicEvents: vi.fn(),
  register: vi.fn(),
  toApiError: (err: unknown) => err as ApiError,
}));

import { listPublicEvents, register } from '../api/client';

const mockedListPublicEvents = listPublicEvents as ReturnType<typeof vi.fn>;
const mockedRegister = register as ReturnType<typeof vi.fn>;

const event: PublicEvent = {
  uuid: 'e1',
  name: 'Event One',
  dateTime: '2026-02-01T10:00:00.000Z',
  address: 'Some Street',
  deadline: '2026-01-31',
};

async function selectAndFillEmail(result: { current: ReturnType<typeof usePublicRegistration> }) {
  await waitFor(() => expect(result.current.loading).toBe(false));
  act(() => result.current.selectEvent('e1'));
  act(() => result.current.changeEmail('person@example.com'));
}

describe('usePublicRegistration', () => {
  beforeEach(() => {
    mockedListPublicEvents.mockReset();
    mockedRegister.mockReset();
  });

  it('loads events on mount', async () => {
    mockedListPublicEvents.mockResolvedValue([event]);
    const { result } = renderHook(() => usePublicRegistration());
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.events).toEqual([event]);
  });

  it('sets a field error and does not refetch on a duplicate-email 400', async () => {
    mockedListPublicEvents.mockResolvedValue([event]);
    const apiError: ApiError = {
      message: 'This email address is already registered for this event.',
      errors: { emailAddress: ['This email address is already registered for this event.'] },
    };
    mockedRegister.mockRejectedValue(apiError);

    const { result } = renderHook(() => usePublicRegistration());
    await selectAndFillEmail(result);

    await act(async () => {
      await result.current.submitRegistration();
    });

    expect(result.current.submitError?.errors?.emailAddress).toBeDefined();
    expect(mockedListPublicEvents).toHaveBeenCalledTimes(1);
  });

  it('keeps the error and refetches quietly on a full-event 400 without touching loading', async () => {
    mockedListPublicEvents.mockResolvedValueOnce([event]).mockResolvedValueOnce([event]);
    mockedRegister.mockRejectedValue({ message: 'This event is full.' } as ApiError);

    const { result } = renderHook(() => usePublicRegistration());
    await selectAndFillEmail(result);

    await act(async () => {
      await result.current.submitRegistration();
    });

    expect(result.current.submitError?.message).toBe('This event is full.');
    expect(result.current.loading).toBe(false);
    await waitFor(() => expect(mockedListPublicEvents).toHaveBeenCalledTimes(2));
  });

  it('returns the event name and registration number on success', async () => {
    mockedListPublicEvents.mockResolvedValue([event]);
    mockedRegister.mockResolvedValue({ registrationNo: '00001' });

    const { result } = renderHook(() => usePublicRegistration());
    await selectAndFillEmail(result);

    let outcome: { eventName: string; registrationNo: string } | null = null;
    await act(async () => {
      outcome = await result.current.submitRegistration();
    });

    expect(outcome).toEqual({ eventName: 'Event One', registrationNo: '00001' });
  });
});
