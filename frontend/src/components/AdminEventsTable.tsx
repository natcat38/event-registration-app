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
import { formatDate, formatDateTime, formatInstantDate } from '../utils/dates';
import type { AdminEvent } from '../api/client';
import AdminEventCards from './AdminEventCards';
import RegisteredCount from './RegisteredCount';
import StatusBadge from './StatusBadge';

interface Props {
  events: AdminEvent[];
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  onViewTrend: (event: { uuid: string; name: string }) => void;
}

const nowrap = { whiteSpace: 'nowrap' } as const;
// Long text stays within two lines; the full text is in the cell's title.
const twoLines = {
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  overflowWrap: 'anywhere',
} as const;

// Table from `sm` up, cards below it (see AdminEventCards). Both are in the DOM; CSS shows one.
export default function AdminEventsTable({
  events,
  page,
  pageCount,
  onPageChange,
  onViewTrend,
}: Props) {
  return (
    <>
      <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
        <AdminEventCards events={events} onViewTrend={onViewTrend} />
      </Box>

      <TableContainer
        component={Paper}
        sx={{ display: { xs: 'none', sm: 'block' }, overflowX: 'auto' }}
      >
        <Table size="small" sx={{ '& th, & td': { px: 1.5 } }}>
          <TableHead sx={{ '& th': nowrap }}>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Created On</TableCell>
              <TableCell>Event Date Time</TableCell>
              <TableCell>Address</TableCell>
              <TableCell>Deadline</TableCell>
              <TableCell>Handler</TableCell>
              <TableCell>Registered</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.uuid}>
                <TableCell sx={{ minWidth: 200 }} title={event.name}>
                  <Box sx={twoLines}>{event.name}</Box>
                </TableCell>
                <TableCell sx={nowrap} title={formatDateTime(event.createdAt)}>
                  {formatInstantDate(event.createdAt)}
                </TableCell>
                <TableCell sx={nowrap}>{formatDateTime(event.dateTime)}</TableCell>
                <TableCell sx={{ minWidth: 200 }} title={event.address}>
                  <Box sx={twoLines}>{event.address}</Box>
                </TableCell>
                <TableCell sx={nowrap}>{formatDate(event.deadline)}</TableCell>
                <TableCell sx={nowrap}>{event.handler.name}</TableCell>
                <TableCell>
                  <RegisteredCount count={event.registrationCount} capacity={event.capacity} />
                </TableCell>
                <TableCell>
                  <StatusBadge event={event} />
                </TableCell>
                <TableCell>
                  <Button
                    sx={nowrap}
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

      <Box display="flex" justifyContent="center" sx={{ mt: 3 }}>
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
