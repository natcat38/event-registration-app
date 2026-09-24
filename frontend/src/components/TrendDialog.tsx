import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { getTrend, toApiError, type TrendPoint } from '../api/client';
import LoadingStatus from './LoadingStatus';

interface Props {
  eventUuid: string | null;
  eventName: string | null;
  onClose: () => void;
}

export default function TrendDialog({ eventUuid, eventName, onClose }: Props) {
  return (
    <Dialog open={Boolean(eventUuid)} onClose={onClose} fullWidth maxWidth="sm">
      {/* Remounted with a fresh `key` per event, so state starts clean
          instead of showing the previous event's rows for one frame. */}
      {eventUuid && (
        <TrendDialogContent
          key={eventUuid}
          eventUuid={eventUuid}
          eventName={eventName}
          onClose={onClose}
        />
      )}
    </Dialog>
  );
}

function TrendDialogContent({ eventUuid, eventName, onClose }: Props & { eventUuid: string }) {
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getTrend(eventUuid);
        if (!cancelled) setTrend(data);
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
  }, [eventUuid]);

  return (
    <>
      <DialogTitle>Registration Trend{eventName ? ` for ${eventName}` : ''}</DialogTitle>
      <DialogContent>
        {loading && <LoadingStatus />}
        {!loading && error && <Alert severity="error">{error}</Alert>}
        {!loading && !error && trend.length === 0 && (
          <Alert severity="info">No trend data available.</Alert>
        )}
        {!loading && !error && trend.length > 0 && (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell align="right">New Registration</TableCell>
                <TableCell align="right">Total Registration</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {trend.map((point) => (
                <TableRow key={point.date}>
                  <TableCell>{point.date}</TableCell>
                  <TableCell align="right">{point.newRegistrationCount}</TableCell>
                  <TableCell align="right">{point.registrationCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </>
  );
}
