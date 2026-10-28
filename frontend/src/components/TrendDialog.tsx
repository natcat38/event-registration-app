import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Suspense, lazy, useEffect, useState } from 'react';
import { getTrend, toApiError, type TrendPoint } from '../api/client';
import { formatDate } from '../utils/dates';
import { summarizeTrend } from '../utils/trendSummary';
import LoadingStatus from './LoadingStatus';
import TrendTable from './TrendTable';

// Loaded on first open: the chart library is the heaviest dependency and most visits never open a trend.
const TrendChart = lazy(() => import('./TrendChart'));

export interface TrendTarget {
  uuid: string;
  name: string;
  capacity: number;
}

interface Props {
  target: TrendTarget | null;
  onClose: () => void;
}

const CHART_HEIGHT = 220;

export default function TrendDialog({ target, onClose }: Props) {
  const theme = useTheme();
  // A phone gets the whole screen: 80+ rows in a small card is a long scroll in a cramped box.
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  return (
    <Dialog
      open={Boolean(target)}
      onClose={onClose}
      fullScreen={fullScreen}
      fullWidth
      maxWidth="sm"
    >
      {/* Remounted with a fresh `key` per event, so the previous event's rows never show for a frame. */}
      {target && <TrendDialogContent key={target.uuid} target={target} onClose={onClose} />}
    </Dialog>
  );
}

function TrendDialogContent({ target, onClose }: { target: TrendTarget; onClose: () => void }) {
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getTrend(target.uuid);
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
  }, [target.uuid]);

  const summary = summarizeTrend(trend, target.capacity);

  return (
    <>
      <DialogTitle>Registration Trend for {target.name}</DialogTitle>
      <DialogContent>
        {loading && <LoadingStatus />}
        {!loading && error && <Alert severity="error">{error}</Alert>}
        {!loading && !error && trend.length === 0 && (
          <Alert severity="info">No trend data available.</Alert>
        )}
        {!loading && !error && trend.length > 0 && (
          <>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>{summary.total}</strong> of {target.capacity} registered
              {summary.peak &&
                `, busiest day ${formatDate(summary.peak.date)} (${summary.peak.count} new)`}
              , {summary.seatsLeft} {summary.seatsLeft === 1 ? 'seat' : 'seats'} left.
            </Typography>
            {/* The chart is a picture of the table below; the table is the accessible version. */}
            <Box
              role="img"
              aria-label={`Line chart of total registrations from ${formatDate(trend[0].date)} to ${formatDate(trend[trend.length - 1].date)}, reaching ${summary.total}. The table below lists every day.`}
              sx={{ minHeight: CHART_HEIGHT, mb: 2 }}
            >
              <Suspense fallback={<LoadingStatus />}>
                <TrendChart trend={trend} />
              </Suspense>
            </Box>
            <TrendTable trend={trend} />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </>
  );
}
