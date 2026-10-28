import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { listAdminEvents, toApiError, type AdminEvent } from '../api/client';

export const PAGE_SIZE = 10; // mirrors backend/src/services/adminEvents.ts, see docs/adr/0001
const SEARCH_DEBOUNCE_MS = 300;

function parsePage(raw: string | null): number {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}

/**
 * List state for the admin table: search debounce, paging, and stale-response guarding.
 * Search, the open filter and the page live in the URL (`?q=&open=true&page=`), so reload, Back and a shared link keep the view.
 */
export function useAdminEvents() {
  const [params, setParams] = useSearchParams();
  const search = params.get('q') ?? '';
  const openOnly = params.get('open') === 'true';
  const page = parsePage(params.get('page'));

  // What the text box shows; the URL (and so the query) follows it after the debounce.
  const [searchInput, setSearchInput] = useState(search);

  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  /** Sets or clears query keys; `replace` keeps typing out of the Back history. */
  function updateParams(changes: Record<string, string | null>, replace = false) {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(changes)) {
          if (value === null) next.delete(key);
          else next.set(key, value);
        }
        return next;
      },
      { replace },
    );
  }

  useEffect(() => {
    if (searchInput === search) return;
    const timer = setTimeout(() => {
      updateParams({ q: searchInput || null, page: null }, true);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput, search]);

  // Back or Forward changed `q`: show it in the text box (adjusted during render, not in an effect).
  const [seenSearch, setSeenSearch] = useState(search);
  if (seenSearch !== search) {
    setSeenSearch(search);
    setSearchInput(search);
  }

  useEffect(() => {
    // Set by the cleanup of a stale run so its late response is dropped, not applied.
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await listAdminEvents({ page, search, open: openOnly });
        if (cancelled) return;
        setEvents(result.events);
        setTotal(result.total);
        // A shared link can point past the last page; land on the last one instead of an empty list.
        if (result.events.length === 0 && result.total > 0 && page > 1) {
          updateParams({ page: String(Math.ceil(result.total / PAGE_SIZE)) }, true);
        }
      } catch (err) {
        if (!cancelled) setError(toApiError(err).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, openOnly, refreshKey]);

  return {
    searchInput,
    setSearchInput,
    openOnly,
    setOpenOnly: (value: boolean) => updateParams({ open: value ? 'true' : null, page: null }),
    page,
    setPage: (value: number) => updateParams({ page: value > 1 ? String(value) : null }),
    events,
    total,
    loading,
    error,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    refresh: () => setRefreshKey((k) => k + 1),
    /** After an event is added: drop search, filter and page so the newest event (sorted first) is on screen. */
    showNewest: () => {
      setSearchInput('');
      updateParams({ q: null, open: null, page: null });
      setRefreshKey((k) => k + 1);
    },
  };
}
