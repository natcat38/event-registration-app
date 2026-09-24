import { Box, CircularProgress, Typography } from '@mui/material';

interface Props {
  label?: string;
}

// Announces loading state to screen readers (WCAG 4.1.3 Status Messages).
export default function LoadingStatus({ label }: Props) {
  return (
    <Box
      role="status"
      aria-live="polite"
      display="flex"
      flexDirection="column"
      alignItems="center"
      py={label ? 6 : 4}
      gap={2}
    >
      <CircularProgress />
      {label && <Typography>{label}</Typography>}
    </Box>
  );
}
