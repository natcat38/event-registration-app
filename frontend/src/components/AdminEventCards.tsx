import { Button, Card, CardContent, Stack, Typography } from '@mui/material';
import type { AdminEvent } from '../api/client';
import { formatDateTime } from '../utils/dates';
import RegisteredCount from './RegisteredCount';
import StatusBadge from './StatusBadge';

interface Props {
  events: AdminEvent[];
  onViewTrend: (event: { uuid: string; name: string }) => void;
}

// Phone layout: the 10-column table would need 3 screens of sideways swipe. Same data, one card per event.
export default function AdminEventCards({ events, onViewTrend }: Props) {
  return (
    <Stack component="ul" spacing={1.5} sx={{ listStyle: 'none', m: 0, p: 0 }}>
      {events.map((event) => (
        <Card key={event.uuid} component="li" variant="outlined">
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1 } }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
              <Typography variant="subtitle1" component="h2" sx={{ overflowWrap: 'anywhere' }}>
                {event.name}
              </Typography>
              <StatusBadge event={event} />
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {formatDateTime(event.dateTime)}
            </Typography>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mt: 0.5 }}
            >
              <RegisteredCount
                count={event.registrationCount}
                capacity={event.capacity}
                suffix=" registered"
              />
              <Button
                sx={{ minHeight: 44 }}
                onClick={() => onViewTrend({ uuid: event.uuid, name: event.name })}
              >
                View Trend
              </Button>
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}
