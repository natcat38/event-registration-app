import { useRef } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';

interface Props {
  open: boolean;
  onKeepEditing: () => void;
  onDiscard: () => void;
}

// An in-page dialog, not window.confirm: it is styled, keyboard-reachable, and testable.
export default function DiscardConfirm({ open, onKeepEditing, onDiscard }: Props) {
  const keepRef = useRef<HTMLButtonElement>(null);
  return (
    <Dialog
      open={open}
      onClose={onKeepEditing}
      maxWidth="xs"
      fullWidth
      // The safe choice takes focus once the dialog is in place; MUI otherwise leaves it on the dialog box.
      slotProps={{ transition: { onEntered: () => keepRef.current?.focus() } }}
    >
      <DialogTitle>Discard this event?</DialogTitle>
      <DialogContent>
        <DialogContentText>The details you entered will be lost.</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button ref={keepRef} onClick={onKeepEditing}>
          Keep editing
        </Button>
        <Button onClick={onDiscard} color="error">
          Discard
        </Button>
      </DialogActions>
    </Dialog>
  );
}
