import { Stack, Typography } from '@mui/material';
import { formatDateTime } from '../utils/dates';
import type { PublicEvent } from '../api/client';

export default function SelectedEventDetails({ event }: { event: PublicEvent }) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="body2">
        <strong>Date &amp; time:</strong> {formatDateTime(event.dateTime)}
      </Typography>
      <Typography variant="body2">
        <strong>Address:</strong> {event.address}
      </Typography>
      <Typography variant="body2">
        <strong>Registration deadline:</strong> {event.deadline}
      </Typography>
    </Stack>
  );
}
