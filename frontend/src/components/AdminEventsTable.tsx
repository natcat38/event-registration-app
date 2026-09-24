import {
  Box,
  Button,
  Pagination,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { formatDateTime } from '../utils/dates';
import type { AdminEvent } from '../api/client';
import StatusBadge from './StatusBadge';

interface Props {
  events: AdminEvent[];
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  onViewTrend: (event: { uuid: string; name: string }) => void;
}

// TableContainer scrolls horizontally at phone width instead of squashing columns.
export default function AdminEventsTable({
  events,
  page,
  pageCount,
  onPageChange,
  onViewTrend,
}: Props) {
  return (
    <>
      <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>Name</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>Created On</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>Event Date Time</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>Address</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>Registration Deadline</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>Handler</TableCell>
              <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                Capacity
              </TableCell>
              <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                No. of Registration
              </TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>Status</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.uuid}>
                <TableCell sx={{ overflowWrap: 'anywhere' }}>{event.name}</TableCell>
                <TableCell>{formatDateTime(event.createdAt)}</TableCell>
                <TableCell>{formatDateTime(event.dateTime)}</TableCell>
                <TableCell sx={{ overflowWrap: 'anywhere' }}>{event.address}</TableCell>
                <TableCell>{event.deadline}</TableCell>
                <TableCell>{event.handler.name}</TableCell>
                <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                  {event.capacity}
                </TableCell>
                <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                  {event.registrationCount}
                </TableCell>
                <TableCell>
                  <StatusBadge event={event} />
                </TableCell>
                <TableCell>
                  <Button
                    size="medium"
                    onClick={() => onViewTrend({ uuid: event.uuid, name: event.name })}
                  >
                    View Trend
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box display="flex" justifyContent="center">
        <Pagination
          count={pageCount}
          page={page}
          onChange={(_, value) => onPageChange(value)}
          sx={{ '& .MuiPaginationItem-root': { minHeight: 44, minWidth: 44 } }}
        />
      </Box>
    </>
  );
}
