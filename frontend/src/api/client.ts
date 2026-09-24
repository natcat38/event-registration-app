import axios, { AxiosError } from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 15000,
});

/** Matches every backend error body: `{ message, errors? }` (see ADR 0002). */
export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

/** Turns any thrown value from an `api` call into a display-ready error. */
export function toApiError(err: unknown): ApiError {
  if (err instanceof AxiosError) {
    if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
      return { message: 'The request timed out. Please try again.' };
    }
    const data = err.response?.data as
      { message?: string; errors?: Record<string, string[]> } | undefined;
    if (data && typeof data.message === 'string') {
      return { message: data.message, errors: data.errors };
    }
  }
  return { message: 'Something went wrong. Please try again.' };
}

export interface PublicEvent {
  uuid: string;
  name: string;
  dateTime: string;
  address: string;
  deadline: string;
}

export interface AdminEvent {
  uuid: string;
  createdAt: string;
  name: string;
  dateTime: string;
  address: string;
  deadline: string;
  capacity: number;
  registrationCount: number;
  handler: { uuid: string; name: string };
}

export interface AdminEventsResult {
  total: number;
  events: AdminEvent[];
}

export interface Handler {
  uuid: string;
  name: string;
}

export interface TrendPoint {
  date: string;
  registrationCount: number;
  newRegistrationCount: number;
}

export interface CreateEventInput {
  name: string;
  dateTime: string;
  postalCode: string;
  deadline: string;
  capacity: number;
  handlerUuid: string;
}

export interface RegisterResponse {
  registrationNo: string;
}

export interface ListAdminEventsParams {
  page: number;
  search?: string;
  open?: boolean;
}

export async function listAdminEvents(params: ListAdminEventsParams): Promise<AdminEventsResult> {
  const res = await api.get<AdminEventsResult>('/api/admin/events', {
    params: {
      page: params.page,
      search: params.search || undefined,
      open: params.open ? 'true' : undefined,
    },
  });
  return res.data;
}

export async function createEvent(input: CreateEventInput): Promise<void> {
  await api.post('/api/admin/events', input);
}

export async function listHandlers(): Promise<Handler[]> {
  const res = await api.get<Handler[]>('/api/admin/handlers');
  return res.data;
}

export async function listPublicEvents(): Promise<PublicEvent[]> {
  const res = await api.get<PublicEvent[]>('/api/public/events');
  return res.data;
}

export async function register(eventUuid: string, emailAddress: string): Promise<RegisterResponse> {
  const res = await api.post<RegisterResponse>('/api/public/register', { eventUuid, emailAddress });
  return res.data;
}

export async function getTrend(eventUuid: string): Promise<TrendPoint[]> {
  const res = await api.post<TrendPoint[]>(`/api/admin/events/${eventUuid}/trend`);
  return res.data;
}
