import { Chip } from '@mui/material';
import { isOpen, type OpenCheckEvent } from '../utils/dates';

export default function StatusBadge({ event }: { event: OpenCheckEvent }) {
  const open = isOpen(event);
  return (
    <Chip label={open ? 'Open' : 'Closed'} color={open ? 'success' : 'default'} size="small" />
  );
}
