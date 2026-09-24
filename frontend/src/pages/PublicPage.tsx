import {
  Alert,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
  type SelectChangeEvent,
} from '@mui/material';
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingStatus from '../components/LoadingStatus';
import { useDocumentTitle } from '../utils/useDocumentTitle';
import SelectedEventDetails from './SelectedEventDetails';
import { usePublicRegistration } from './usePublicRegistration';

export default function PublicPage() {
  useDocumentTitle('Register');
  const navigate = useNavigate();
  const {
    events,
    loading,
    loadError,
    selectedUuid,
    email,
    submitting,
    submitError,
    selectEvent,
    changeEmail,
    submitRegistration,
  } = usePublicRegistration();

  const selectedEvent = events.find((e) => e.uuid === selectedUuid) ?? null;
  const emailFieldError = submitError?.errors?.emailAddress?.join(' ');
  const emailRef = useRef<HTMLInputElement>(null);

  // Move focus to the email field whenever it fails validation.
  useEffect(() => {
    if (emailFieldError) emailRef.current?.focus();
  }, [emailFieldError]);

  async function handleRegister() {
    const result = await submitRegistration();
    if (result) navigate('/thank-you', { state: result });
  }

  if (loading) return <LoadingStatus label="Loading events…" />;

  if (loadError) return <Alert severity="error">{loadError}</Alert>;

  return (
    <Paper sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h5" component="h1" gutterBottom>
        Register for an Event
      </Typography>

      {/* Above the list branch: a refetch after a closed or full error can empty the list. */}
      {submitError && !emailFieldError && <Alert severity="error">{submitError.message}</Alert>}

      {events.length === 0 ? (
        <Alert severity="info">No events are open for registration right now.</Alert>
      ) : (
        <Stack
          component="form"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void handleRegister();
          }}
          spacing={3}
        >
          <FormControl fullWidth disabled={submitting}>
            <InputLabel id="event-select-label">Event</InputLabel>
            <Select
              labelId="event-select-label"
              label="Event"
              value={selectedUuid}
              onChange={(e: SelectChangeEvent) => selectEvent(e.target.value)}
            >
              {events.map((event) => (
                <MenuItem key={event.uuid} value={event.uuid}>
                  {event.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedEvent && <SelectedEventDetails event={selectedEvent} />}

          {selectedEvent && (
            <>
              <TextField
                id="field-email"
                label="Email address"
                type="email"
                autoComplete="email"
                inputRef={emailRef}
                value={email}
                onChange={(e) => changeEmail(e.target.value)}
                fullWidth
                required
                disabled={submitting}
                error={Boolean(emailFieldError)}
                helperText={emailFieldError}
              />

              <Button type="submit" variant="contained" disabled={submitting}>
                {submitting ? 'Registering…' : 'Register'}
              </Button>
            </>
          )}
        </Stack>
      )}
    </Paper>
  );
}
