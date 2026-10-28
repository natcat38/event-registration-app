import { Dialog, useMediaQuery, useTheme } from '@mui/material';
import { useState } from 'react';
import AddEventForm from './AddEventForm';
import DiscardConfirm from './DiscardConfirm';
import { useAddEventForm, type CreatedEvent } from './useAddEventForm';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (created: CreatedEvent) => void;
}

export default function AddEventDialog({ open, onClose, onCreated }: Props) {
  // Mounted fresh each time the dialog opens, so form and error state start clean without an effect.
  return open ? <AddEventDialogContent onClose={onClose} onCreated={onCreated} /> : null;
}

function AddEventDialogContent({ onClose, onCreated }: Omit<Props, 'open'>) {
  const formState = useAddEventForm(onClose, onCreated);
  const { submitting, dirty } = formState;
  const theme = useTheme();
  // A phone gets the whole screen: a floating 326 px card leaves the form cramped.
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Cancel, Escape and a backdrop click all land here: a half-filled form asks before it is thrown away.
  function requestClose() {
    if (dirty) setConfirmOpen(true);
    else onClose();
  }

  return (
    <>
      <Dialog
        open
        // While submitting, Escape and backdrop clicks must not close: a late response could touch a reopened dialog.
        onClose={(_, reason) => {
          if (submitting && (reason === 'escapeKeyDown' || reason === 'backdropClick')) return;
          requestClose();
        }}
        disableEscapeKeyDown={submitting}
        fullScreen={fullScreen}
        fullWidth
        maxWidth="sm"
      >
        <AddEventForm {...formState} onClose={requestClose} />
      </Dialog>
      <DiscardConfirm
        open={confirmOpen}
        onKeepEditing={() => setConfirmOpen(false)}
        onDiscard={onClose}
      />
    </>
  );
}
