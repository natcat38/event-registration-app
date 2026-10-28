import { useTheme } from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import type { TrendPoint } from '../api/client';
import { formatDate } from '../utils/dates';

const toDate = (date: string) => new Date(`${date}T00:00:00Z`);
const toIso = (d: Date) => d.toISOString().slice(0, 10);

// Axis ticks stay short ("21 Oct"); the tooltip and the table below carry the full date.
const shortDate = (d: Date) =>
  d.toLocaleDateString('en-SG', { timeZone: 'UTC', day: 'numeric', month: 'short' });

/** Running total of sign-ups per day. Loaded on demand so the chart library is not in the first bundle. */
export default function TrendChart({ trend }: { trend: TrendPoint[] }) {
  const theme = useTheme();
  return (
    <LineChart
      height={220}
      hideLegend
      xAxis={[
        {
          scaleType: 'time',
          tickNumber: 5,
          data: trend.map((p) => toDate(p.date)),
          valueFormatter: (d: Date, context) =>
            context.location === 'tooltip' ? formatDate(toIso(d)) : shortDate(d),
        },
      ]}
      yAxis={[{ min: 0, width: 40 }]}
      series={[
        {
          data: trend.map((p) => p.registrationCount),
          label: 'Total registrations',
          area: true,
          showMark: false,
          color: theme.palette.primary.main,
        },
      ]}
      margin={{ left: 0, right: 16, top: 8, bottom: 0 }}
    />
  );
}
