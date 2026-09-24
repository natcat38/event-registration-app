import { Dialog } from '@mui/material';
import AddEventForm from './AddEventForm';
import { useAddEventForm } from './useAddEventForm';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function AddEventDialog({ open, onClose, onCreated }: Props) {
  // Mounted fresh each time the dialog opens, so form and error state start clean without an effect.
  return open ? <AddEventDialogContent onClose={onClose} onCreated={onCreated} /> : null;
}

function AddEventDialogContent({ onClose, onCreated }: Omit<Props, 'open'>) {
  const formState = useAddEventForm(onClose, onCreated);
  const { submitting } = formState;

  return (
    <Dialog
      open
      // While submitting, Escape and backdrop clicks must not close: a late response could touch a reopened dialog.
      onClose={(_, reason) => {
        if (submitting && (reason === 'escapeKeyDown' || reason === 'backdropClick')) return;
        onClose();
      }}
      disableEscapeKeyDown={submitting}
      fullWidth
      maxWidth="sm"
    >
      <AddEventForm {...formState} onClose={onClose} />
    </Dialog>
  );
}
