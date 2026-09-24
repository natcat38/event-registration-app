// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AdminEvent, AdminEventsResult } from '../api/client';
import { useAdminEvents } from './useAdminEvents';

vi.mock('../api/client', () => ({
  listAdminEvents: vi.fn(),
  toApiError: () => ({ message: 'Something went wrong. Please try again.' }),
}));

import { listAdminEvents } from '../api/client';

const mockedList = listAdminEvents as ReturnType<typeof vi.fn>;

function makeEvent(uuid: string): AdminEvent {
  return {
    uuid,
    createdAt: '2026-01-01T00:00:00.000Z',
    name: uuid,
    dateTime: '2026-02-01T00:00:00.000Z',
    address: 'Some Street',
    deadline: '2026-01-31',
    capacity: 10,
    registrationCount: 0,
    handler: { uuid: 'h-1', name: 'Handler One' },
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe('useAdminEvents', () => {
  beforeEach(() => {
    mockedList.mockReset();
  });

  it('debounces search input by 300 ms before querying', async () => {
    mockedList.mockResolvedValue({ events: [], total: 0 } as AdminEventsResult);
    vi.useFakeTimers();
    const { result } = renderHook(() => useAdminEvents());
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(mockedList).toHaveBeenCalledTimes(1);

    act(() => result.current.setSearchInput('abc'));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(299);
    });
    expect(mockedList).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(mockedList).toHaveBeenCalledTimes(2);
    expect(mockedList).toHaveBeenLastCalledWith({ page: 1, search: 'abc', open: false });
    vi.useRealTimers();
  });

  it('ignores a stale response when a newer request was sent', async () => {
    const first = deferred<AdminEventsResult>();
    const second = deferred<AdminEventsResult>();
    mockedList.mockImplementationOnce(() => first.promise);
    mockedList.mockImplementationOnce(() => second.promise);

    const { result } = renderHook(() => useAdminEvents());
    act(() => result.current.setPage(2));
    expect(mockedList).toHaveBeenCalledTimes(2);

    await act(async () => {
      second.resolve({ events: [makeEvent('fresh')], total: 1 });
      await Promise.resolve();
    });
    expect(result.current.events).toEqual([makeEvent('fresh')]);

    await act(async () => {
      first.resolve({ events: [makeEvent('stale')], total: 1 });
      await Promise.resolve();
    });
    expect(result.current.events).toEqual([makeEvent('fresh')]);
  });
});
