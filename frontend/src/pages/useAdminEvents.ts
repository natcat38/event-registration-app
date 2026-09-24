import { useEffect, useState } from 'react';
import { listAdminEvents, toApiError, type AdminEvent } from '../api/client';

export const PAGE_SIZE = 10; // mirrors backend/src/services/adminEvents.ts, see docs/adr/0001
const SEARCH_DEBOUNCE_MS = 300;

/** List state for the admin table: search debounce, paging, and stale-response guarding. */
export function useAdminEvents() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [openOnly, setOpenOnly] = useState(false);
  const [page, setPage] = useState(1);

  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    // Set by the cleanup of a stale run so its late response is dropped, not applied.
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await listAdminEvents({ page, search, open: openOnly });
        if (!cancelled) {
          setEvents(result.events);
          setTotal(result.total);
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
  }, [page, search, openOnly, refreshKey]);

  return {
    searchInput,
    setSearchInput,
    openOnly,
    setOpenOnly: (value: boolean) => {
      setOpenOnly(value);
      setPage(1);
    },
    page,
    setPage,
    events,
    total,
    loading,
    error,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    refresh: () => setRefreshKey((k) => k + 1),
  };
}
