import { Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import type { TrendPoint } from '../api/client';
import { formatDate } from '../utils/dates';

// No TableContainer: its overflow would stop the sticky header following the dialog's own scroll.
export default function TrendTable({ trend }: { trend: TrendPoint[] }) {
  return (
    <Table size="small" stickyHeader>
      <TableHead>
        <TableRow>
          <TableCell>Date</TableCell>
          <TableCell align="right">New Registration</TableCell>
          <TableCell align="right">Total Registration</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {trend.map((point) => (
          <TableRow key={point.date}>
            <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(point.date)}</TableCell>
            <TableCell align="right">{point.newRegistrationCount}</TableCell>
            <TableCell align="right">{point.registrationCount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
