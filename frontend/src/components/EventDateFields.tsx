import { TextField } from '@mui/material';

interface Props {
  dateTime: string;
  onDateTimeChange: (value: string) => void;
  dateTimeError?: string;
  deadline: string;
  onDeadlineChange: (value: string) => void;
  deadlineError?: string;
  disabled: boolean;
}

// The two date fields of the Add Event form, split out to keep AddEventForm.tsx short.
export default function EventDateFields({
  dateTime,
  onDateTimeChange,
  dateTimeError,
  deadline,
  onDeadlineChange,
  deadlineError,
  disabled,
}: Props) {
  return (
    <>
      <TextField
        id="field-dateTime"
        label="Event Date Time"
        type="datetime-local"
        value={dateTime}
        onChange={(e) => onDateTimeChange(e.target.value)}
        error={Boolean(dateTimeError)}
        helperText={dateTimeError}
        disabled={disabled}
        slotProps={{ inputLabel: { shrink: true } }}
        fullWidth
        required
      />

      <TextField
        id="field-deadline"
        label="Registration Deadline"
        type="date"
        value={deadline}
        onChange={(e) => onDeadlineChange(e.target.value)}
        error={Boolean(deadlineError)}
        helperText={deadlineError}
        disabled={disabled}
        slotProps={{ inputLabel: { shrink: true } }}
        fullWidth
        required
      />
    </>
  );
}
