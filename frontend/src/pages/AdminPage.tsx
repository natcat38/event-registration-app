import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import AddEventDialog from '../components/AddEventDialog';
import AddedToast from '../components/AddedToast';
import AdminEventsTable from '../components/AdminEventsTable';
import LoadingStatus from '../components/LoadingStatus';
import RetryAlert from '../components/RetryAlert';
import TrendDialog, { type TrendTarget } from '../components/TrendDialog';
import type { CreatedEvent } from '../components/createdEvent';
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
    showNewest,
  } = useAdminEvents();

  const [addOpen, setAddOpen] = useState(false);
  const [trendEvent, setTrendEvent] = useState<TrendTarget | null>(null);
  const [added, setAdded] = useState<CreatedEvent | null>(null);

  function handleCreated(created: CreatedEvent) {
    showNewest();
    setAdded(created);
  }

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

      <Box>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <TextField
            label="Search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Name, address, or handler…"
            size="small"
          />
          <FormControlLabel
            control={
              <Checkbox checked={openOnly} onChange={(e) => setOpenOnly(e.target.checked)} />
            }
            label="Open Events Only"
          />
        </Stack>
        {/* Reserved height: the bar appearing must not push the table down. */}
        <Box sx={{ height: 4, mt: 1 }}>
          {loading && events.length > 0 && <LinearProgress aria-label="Updating events" />}
        </Box>
      </Box>

      {loading && events.length === 0 && <LoadingStatus label="Loading events…" />}

      {!loading && error && <RetryAlert message={error} onRetry={refresh} />}

      {!loading && !error && events.length === 0 && <Alert severity="info">No events match.</Alert>}

      {/* Rows stay mounted and dimmed while a filter or page change reloads, so the page keeps its height. */}
      {!error && events.length > 0 && (
        <Box aria-busy={loading} sx={{ opacity: loading ? 0.5 : 1 }}>
          <AdminEventsTable
            events={events}
            page={page}
            pageCount={pageCount}
            onPageChange={setPage}
            onViewTrend={setTrendEvent}
          />
        </Box>
      )}

      <AddEventDialog open={addOpen} onClose={() => setAddOpen(false)} onCreated={handleCreated} />

      <TrendDialog target={trendEvent} onClose={() => setTrendEvent(null)} />

      <AddedToast added={added} />
    </Stack>
  );
}
