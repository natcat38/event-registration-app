import { Alert, Snackbar } from '@mui/material';
import { useState } from 'react';
import type { CreatedEvent } from './createdEvent';

/** Acknowledges a saved event with its name and the address OneMap resolved, so a wrong postal code shows at once. */
export default function AddedToast({ added }: { added: CreatedEvent | null }) {
  // Each save is a new object, so remembering which one was dismissed reopens the toast for the next save
  // while `added` stays set during the fade-out (the text does not vanish mid-fade).
  const [dismissed, setDismissed] = useState<CreatedEvent | null>(null);
  const close = () => setDismissed(added);
  return (
    <Snackbar
      open={added !== null && dismissed !== added}
      autoHideDuration={8000}
      onClose={(_, reason) => {
        if (reason !== 'clickaway') close();
      }}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert severity="success" variant="filled" onClose={close}>
        {added && `Event "${added.name}" added at ${added.address}.`}
      </Alert>
    </Snackbar>
  );
}
