import { Alert, Button } from '@mui/material';

interface Props {
  message: string;
  onRetry: () => void;
}

/** A failed load with a way forward: the page no longer has to be reloaded by hand. */
export default function RetryAlert({ message, onRetry }: Props) {
  return (
    <Alert
      severity="error"
      action={
        <Button color="inherit" size="small" onClick={onRetry}>
          Retry
        </Button>
      }
    >
      {message}
    </Alert>
  );
}
