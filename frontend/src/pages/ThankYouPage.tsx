import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useDocumentTitle } from '../utils/useDocumentTitle';

interface ThankYouState {
  eventName: string;
  registrationNo: string;
}

function isThankYouState(state: unknown): state is ThankYouState {
  return (
    typeof state === 'object' &&
    state !== null &&
    typeof (state as ThankYouState).eventName === 'string' &&
    typeof (state as ThankYouState).registrationNo === 'string'
  );
}

export default function ThankYouPage() {
  useDocumentTitle('Thank you');
  const location = useLocation();

  // A direct visit (bookmark, reload) has no router state and nothing to
  // show: the registration number only exists in the register response.
  if (!isThankYouState(location.state)) {
    return <Navigate to="/" replace />;
  }

  const { eventName, registrationNo } = location.state;

  return (
    <Paper sx={{ p: 4, maxWidth: 480, mx: 'auto' }}>
      <Stack spacing={2} alignItems="center" textAlign="center">
        <Typography variant="h4" component="h1">
          Thank You!
        </Typography>
        <Typography>Your registration has been confirmed.</Typography>
        <Box sx={{ bgcolor: 'grey.100', borderRadius: 1, p: 3, width: '100%' }}>
          <Typography variant="body1">{eventName}</Typography>
          <Typography variant="h5" color="primary" fontWeight="bold">
            {registrationNo}
          </Typography>
        </Box>
        <Button variant="contained" component={Link} to="/">
          Back to Events
        </Button>
      </Stack>
    </Paper>
  );
}
