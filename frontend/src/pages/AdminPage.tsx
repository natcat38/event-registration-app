import {
  Alert,
  Button,
  Checkbox,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import AddEventDialog from '../components/AddEventDialog';
import AdminEventsTable from '../components/AdminEventsTable';
import LoadingStatus from '../components/LoadingStatus';
import TrendDialog from '../components/TrendDialog';
import { useDocumentTitle } from '../utils/useDocumentTitle';
import { useAdminEvents } from './useAdminEvents';

export default function AdminPage() {
  useDocumentTitle('Admin: Events');
  const {
    searchInput,
    setSearchInput,
    openOnly,
    setOpenOnly,
    page,
    setPage,
    events,
    loading,
    error,
    pageCount,
    refresh,
  } = useAdminEvents();

  const [addOpen, setAddOpen] = useState(false);
  const [trendEvent, setTrendEvent] = useState<{ uuid: string; name: string } | null>(null);

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5" component="h1">
          Admin: Events
        </Typography>
        <Button variant="contained" onClick={() => setAddOpen(true)}>
          Add Event
        </Button>
      </Stack>

      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
        <TextField
          label="Search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Name, address, or handler…"
          size="small"
        />
        <FormControlLabel
          control={<Checkbox checked={openOnly} onChange={(e) => setOpenOnly(e.target.checked)} />}
          label="Open Events Only"
        />
      </Stack>

      {loading && <LoadingStatus label="Loading events…" />}

      {!loading && error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && events.length === 0 && <Alert severity="info">No events match.</Alert>}

      {!loading && !error && events.length > 0 && (
        <AdminEventsTable
          events={events}
          page={page}
          pageCount={pageCount}
          onPageChange={setPage}
          onViewTrend={setTrendEvent}
        />
      )}

      <AddEventDialog open={addOpen} onClose={() => setAddOpen(false)} onCreated={refresh} />

      <TrendDialog
        eventUuid={trendEvent?.uuid ?? null}
        eventName={trendEvent?.name ?? null}
        onClose={() => setTrendEvent(null)}
      />
    </Stack>
  );
}
