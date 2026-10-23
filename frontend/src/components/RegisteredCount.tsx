import { Box, LinearProgress, Typography } from '@mui/material';

interface Props {
  count: number;
  capacity: number;
  /** Words after the numbers, e.g. "registered" on a phone card. */
  suffix?: string;
}

/** "18 / 60" with a thin bar under it: how full the event is, readable in one glance. */
export default function RegisteredCount({ count, capacity, suffix }: Props) {
  const percent = capacity > 0 ? Math.min(100, (count / capacity) * 100) : 0;
  return (
    <Box sx={{ minWidth: 88 }}>
      <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
        {count} / {capacity}
        {suffix}
      </Typography>
      <LinearProgress
        aria-hidden
        variant="determinate"
        value={percent}
        sx={{ mt: 0.5, height: 4 }}
      />
    </Box>
  );
}
