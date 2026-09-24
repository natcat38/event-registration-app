import {
  Alert,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material';
import { useEffect } from 'react';
import EventDateFields from './EventDateFields';
import HandlerSelect from './HandlerSelect';
import { fieldOrder, type AddEventFormState } from './useAddEventForm';

interface Props extends AddEventFormState {
  onClose: () => void;
}

// Presentational: all state and submit logic live in `useAddEventForm`,
// owned by the dialog wrapper so it can also guard closing while submitting.
export default function AddEventForm({
  form,
  setField,
  handlers,
  handlersError,
  submitting,
  error,
  fieldError,
  otherErrors,
  submit,
  submitCount,
  onClose,
}: Props) {
  // Move focus to the first invalid field only on a failed submit, never on a field edit.
  useEffect(() => {
    if (submitCount === 0) return;
    const firstInvalid = fieldOrder.find((field) => error?.errors?.[field]);
    if (firstInvalid) document.getElementById(`field-${firstInvalid}`)?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitCount]);

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <DialogTitle>Add Event</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && (otherErrors.length > 0 || Object.keys(error.errors ?? {}).length === 0) && (
            <Alert severity="error">
              {[error.message, ...otherErrors].filter(Boolean).join(' ')}
            </Alert>
          )}
          <TextField
            id="field-name"
            label="Name"
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            error={Boolean(fieldError('name'))}
            helperText={fieldError('name')}
            disabled={submitting}
            fullWidth
            required
          />
          <EventDateFields
            dateTime={form.dateTime}
            onDateTimeChange={(value) => setField('dateTime', value)}
            dateTimeError={fieldError('dateTime')}
            deadline={form.deadline}
            onDeadlineChange={(value) => setField('deadline', value)}
            deadlineError={fieldError('deadline')}
            disabled={submitting}
          >
            <TextField
              id="field-postalCode"
              label="Postal Code"
              value={form.postalCode}
              onChange={(e) => setField('postalCode', e.target.value)}
              error={Boolean(fieldError('postalCode'))}
              helperText={fieldError('postalCode') ?? '6 digits'}
              disabled={submitting}
              fullWidth
              required
            />
          </EventDateFields>
          <TextField
            id="field-capacity"
            label="Capacity"
            type="number"
            value={form.capacity}
            onChange={(e) => setField('capacity', e.target.value)}
            error={Boolean(fieldError('capacity'))}
            helperText={fieldError('capacity') ?? 'Whole number, 1 to 99999'}
            disabled={submitting}
            fullWidth
            required
          />
          <HandlerSelect
            handlers={handlers}
            value={form.handlerUuid}
            onChange={(value) => setField('handlerUuid', value)}
            error={fieldError('handlerUuid')}
            disabled={submitting}
          />

          {handlersError && <Alert severity="error">{handlersError}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={submitting}>
          {submitting ? 'Adding…' : 'Add Event'}
        </Button>
      </DialogActions>
    </form>
  );
}
