// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, useLocation } from 'react-router-dom';
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

/** Renders the hook inside a router at `url`; `location()` reads the current URL back. */
function setup(url = '/admin') {
  let currentLocation = '';
  function Probe() {
    const loc = useLocation();
    currentLocation = loc.pathname + loc.search;
    return null;
  }
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[url]}>
      <Probe />
      {children}
    </MemoryRouter>
  );
  const hook = renderHook(() => useAdminEvents(), { wrapper });
  return { ...hook, location: () => currentLocation };
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
    const { result } = setup();
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

    const { result } = setup();
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

  it('showNewest clears search, filter and page, and reloads even when the URL did not change', async () => {
    mockedList.mockResolvedValue({ events: [makeEvent('a')], total: 30 } as AdminEventsResult);
    const { result, location } = setup('/admin?q=hall&open=true&page=2');
    await act(async () => {});
    expect(mockedList).toHaveBeenCalledTimes(1);

    act(() => result.current.showNewest());
    await act(async () => {});

    expect(location()).toBe('/admin');
    expect(result.current.searchInput).toBe('');
    expect(mockedList).toHaveBeenLastCalledWith({ page: 1, search: '', open: false });

    mockedList.mockClear();
    act(() => result.current.showNewest());
    await act(async () => {});
    expect(mockedList).toHaveBeenCalledTimes(1);
  });

  it('reads search, open filter and page from the URL on load', async () => {
    mockedList.mockResolvedValue({ events: [], total: 0 } as AdminEventsResult);
    const { result } = setup('/admin?q=hall&open=true&page=3');
    await act(async () => {});
    expect(mockedList).toHaveBeenCalledWith({ page: 3, search: 'hall', open: true });
    expect(result.current.searchInput).toBe('hall');
  });

  it('keeps the page from the URL instead of resetting it to 1 on load', async () => {
    vi.useFakeTimers();
    mockedList.mockResolvedValue({ events: [makeEvent('a')], total: 30 } as AdminEventsResult);
    const { location } = setup('/admin?q=hall&page=2');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(location()).toBe('/admin?q=hall&page=2');
    expect(mockedList).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('writes search, filter and page to the URL, and a new search or filter returns to page 1', async () => {
    vi.useFakeTimers();
    mockedList.mockResolvedValue({ events: [], total: 0 } as AdminEventsResult);
    const { result, location } = setup('/admin?page=4');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    act(() => result.current.setSearchInput('abc'));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(location()).toBe('/admin?q=abc');

    act(() => result.current.setPage(2));
    expect(location()).toBe('/admin?q=abc&page=2');

    act(() => result.current.setOpenOnly(true));
    expect(location()).toBe('/admin?q=abc&open=true');
    vi.useRealTimers();
  });

  it('moves to the last page when the URL points past the end', async () => {
    mockedList.mockResolvedValueOnce({ events: [], total: 25 } as AdminEventsResult);
    mockedList.mockResolvedValue({ events: [makeEvent('last')], total: 25 } as AdminEventsResult);
    const { result, location } = setup('/admin?page=9');
    await act(async () => {});
    expect(location()).toBe('/admin?page=3');
    expect(result.current.page).toBe(3);
  });

  it('keeps showing the previous rows while the next page loads', async () => {
    const next = deferred<AdminEventsResult>();
    mockedList.mockResolvedValueOnce({
      events: [makeEvent('first')],
      total: 20,
    } as AdminEventsResult);
    mockedList.mockImplementationOnce(() => next.promise);
    const { result } = setup();
    await act(async () => {});
    expect(result.current.events).toEqual([makeEvent('first')]);

    act(() => result.current.setPage(2));
    expect(result.current.loading).toBe(true);
    expect(result.current.events).toEqual([makeEvent('first')]);
  });
});
