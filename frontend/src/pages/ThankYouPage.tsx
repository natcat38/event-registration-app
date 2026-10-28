import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { formatDateTime } from '../utils/dates';
import { useDocumentTitle } from '../utils/useDocumentTitle';
import type { RegistrationResult } from './usePublicRegistration';

function isThankYouState(state: unknown): state is RegistrationResult {
  return (
    typeof state === 'object' &&
    state !== null &&
    typeof (state as RegistrationResult).eventName === 'string' &&
    typeof (state as RegistrationResult).registrationNo === 'string'
  );
}

type CopyState = 'idle' | 'copied' | 'failed';

export default function ThankYouPage() {
  useDocumentTitle('Thank you');
  const location = useLocation();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [copyState, setCopyState] = useState<CopyState>('idle');

  // Route changes leave focus on <body>; move it to the confirmation so a screen reader announces it.
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  // A direct visit or reload has no router state: the registration number only exists in the register response.
  if (!isThankYouState(location.state)) {
    return <Navigate to="/" replace />;
  }

  const { eventName, registrationNo, dateTime, address } = location.state;

  async function copyNumber() {
    try {
      await navigator.clipboard.writeText(registrationNo);
      setCopyState('copied');
    } catch {
      // No clipboard access (an insecure page, or permission denied): say so instead of failing silently.
      setCopyState('failed');
    }
  }

  return (
    <Paper sx={{ p: 4, maxWidth: 480, mx: 'auto' }}>
      <Stack spacing={2} alignItems="center" textAlign="center">
        <Typography aria-hidden variant="h3" color="success.main" lineHeight={1}>
          &#10003;
        </Typography>
        <Typography
          variant="h4"
          component="h1"
          tabIndex={-1}
          ref={headingRef}
          sx={{ outline: 'none' }}
        >
          Thank You!
        </Typography>
        <Typography>Your registration has been confirmed.</Typography>
        <Box sx={{ bgcolor: 'grey.100', borderRadius: 1, p: 3, width: '100%' }}>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {eventName}
          </Typography>
          {dateTime && <Typography variant="body2">{formatDateTime(dateTime)}</Typography>}
          {address && <Typography variant="body2">{address}</Typography>}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Registration number
          </Typography>
          <Typography variant="h5" color="primary" fontWeight="bold">
            {registrationNo}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Keep this number. Leaving this page will not show it again.
        </Typography>
        <Stack
          direction="row"
          spacing={1}
          className="no-print"
          flexWrap="wrap"
          justifyContent="center"
        >
          <Button variant="outlined" onClick={() => void copyNumber()}>
            Copy number
          </Button>
          <Button variant="outlined" onClick={() => window.print()}>
            Print
          </Button>
        </Stack>
        <Typography role="status" variant="body2" className="no-print" sx={{ minHeight: '1.5em' }}>
          {copyState === 'copied' && 'Copied.'}
          {copyState === 'failed' && "Couldn't copy. Select the number and copy it by hand."}
        </Typography>
        <Button variant="contained" component={Link} to="/" className="no-print">
          Back to Events
        </Button>
      </Stack>
    </Paper>
  );
}
