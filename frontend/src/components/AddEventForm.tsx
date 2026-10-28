import {
  Alert,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material';
import { useEffect, useRef } from 'react';
import EventDateFields from './EventDateFields';
import HandlerSelect from './HandlerSelect';
import { fieldOrder, type AddEventFormState } from './useAddEventForm';

interface Props extends AddEventFormState {
  onClose: () => void;
}

// Presentational: state and submit logic live in `useAddEventForm`, owned by the dialog so it can guard closing.
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
  const alertRef = useRef<HTMLDivElement>(null);

  // Move focus to the first invalid field only on a failed submit, never on a field edit.
  useEffect(() => {
    if (submitCount === 0) return;
    const firstInvalid = fieldOrder.find((field) => error?.errors?.[field]);
    if (firstInvalid) document.getElementById(`field-${firstInvalid}`)?.focus();
    // A form-level error (a failed save) sits above the fields; on a phone the user may have scrolled past it.
    alertRef.current?.scrollIntoView({ block: 'nearest' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitCount]);

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      // Flex column so only the fields scroll and the title and buttons stay on screen (full-screen on phones).
      style={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto', minHeight: 0 }}
    >
      <DialogTitle>Add Event</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && (otherErrors.length > 0 || Object.keys(error.errors ?? {}).length === 0) && (
            <Alert severity="error" ref={alertRef}>
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
              // A phone shows the number pad, and the browser can offer a saved postal code.
              slotProps={{
                htmlInput: { inputMode: 'numeric', maxLength: 6, autoComplete: 'postal-code' },
              }}
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
