import { Stack, Typography } from '@mui/material';
import { formatDate, formatDateTime } from '../utils/dates';
import type { PublicEvent } from '../api/client';

export default function SelectedEventDetails({ event }: { event: PublicEvent }) {
  return (
    <Stack spacing={0.5}>
      {/* The closed Select truncates long names; this shows the whole name so the registrant can confirm it. */}
      <Typography variant="h6" component="h2" sx={{ overflowWrap: 'anywhere', mb: 0.5 }}>
        {event.name}
      </Typography>
      <Typography variant="body2">
        <strong>Date &amp; time:</strong> {formatDateTime(event.dateTime)}
      </Typography>
      <Typography variant="body2">
        <strong>Address:</strong> {event.address}
      </Typography>
      <Typography variant="body2">
        <strong>Registration deadline:</strong> {formatDate(event.deadline)}
      </Typography>
    </Stack>
  );
}
