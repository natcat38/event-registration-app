// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ApiError, Handler } from '../api/client';
import { useAddEventForm } from './useAddEventForm';

vi.mock('../api/client', () => ({
  createEvent: vi.fn(),
  listHandlers: vi.fn(),
  toApiError: (err: unknown) => err as ApiError,
}));

import { createEvent, listHandlers } from '../api/client';

const mockedCreateEvent = createEvent as ReturnType<typeof vi.fn>;
const mockedListHandlers = listHandlers as ReturnType<typeof vi.fn>;

const handler: Handler = { uuid: 'h-1', name: 'Handler One' };
const ADDRESS = '1 RAFFLES PLACE SINGAPORE 048616';

const validFields = {
  name: 'Party',
  dateTime: '2026-05-01T10:00',
  postalCode: '123456',
  deadline: '2026-04-30',
  capacity: '10',
  handlerUuid: 'h-1',
} as const;

function fillValidForm(result: { current: ReturnType<typeof useAddEventForm> }) {
  act(() => {
    for (const [key, value] of Object.entries(validFields)) {
      result.current.setField(key as keyof typeof validFields, value);
    }
  });
}

describe('useAddEventForm', () => {
  beforeEach(() => {
    mockedCreateEvent.mockReset();
    mockedListHandlers.mockReset();
    mockedListHandlers.mockResolvedValue([handler]);
  });

  it('loads handlers on mount', async () => {
    const { result } = renderHook(() => useAddEventForm(vi.fn(), vi.fn()));
    await waitFor(() => expect(result.current.handlers).toEqual([handler]));
  });

  it('clears a field error when that field is corrected, keeping the rest', async () => {
    const { result } = renderHook(() => useAddEventForm(vi.fn(), vi.fn()));
    await act(async () => {
      await result.current.submit();
    });
    expect(result.current.fieldError('name')).toBe('Name is required.');
    expect(result.current.fieldError('postalCode')).toBe('Postal Code is required.');

    act(() => result.current.setField('name', 'Party'));

    expect(result.current.fieldError('name')).toBeUndefined();
    expect(result.current.fieldError('postalCode')).toBe('Postal Code is required.');
  });

  it('maps a server field error onto fieldError', async () => {
    mockedCreateEvent.mockRejectedValue({
      message: 'Bad input.',
      errors: { name: ['An event with this name already exists.'] },
    } as ApiError);
    const { result } = renderHook(() => useAddEventForm(vi.fn(), vi.fn()));
    fillValidForm(result);

    await act(async () => {
      await result.current.submit();
    });

    expect(result.current.fieldError('name')).toBe('An event with this name already exists.');
  });

  it('ignores a late create response after the dialog has closed', async () => {
    let resolveCreate!: (value: { address: string }) => void;
    mockedCreateEvent.mockImplementation(
      () => new Promise<{ address: string }>((resolve) => (resolveCreate = resolve)),
    );
    const onClose = vi.fn();
    const onCreated = vi.fn();
    const { result, unmount } = renderHook(() => useAddEventForm(onClose, onCreated));
    fillValidForm(result);

    act(() => {
      void result.current.submit();
    });
    unmount();

    await act(async () => {
      resolveCreate({ address: ADDRESS });
      await Promise.resolve();
    });

    expect(onCreated).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onCreated then onClose on success', async () => {
    mockedCreateEvent.mockResolvedValue({ address: ADDRESS });
    const calls: string[] = [];
    const onClose = vi.fn(() => calls.push('close'));
    const onCreated = vi.fn(() => calls.push('created'));
    const { result } = renderHook(() => useAddEventForm(onClose, onCreated));
    fillValidForm(result);

    await act(async () => {
      await result.current.submit();
    });

    expect(calls).toEqual(['created', 'close']);
  });

  it('passes the trimmed name and the resolved address to onCreated', async () => {
    mockedCreateEvent.mockResolvedValue({ address: ADDRESS });
    const onCreated = vi.fn();
    const { result } = renderHook(() => useAddEventForm(vi.fn(), onCreated));
    fillValidForm(result);
    act(() => result.current.setField('name', '  Party  '));

    await act(async () => {
      await result.current.submit();
    });

    expect(onCreated).toHaveBeenCalledWith({ name: 'Party', address: ADDRESS });
  });

  it('explains a server failure (500) in plain words and keeps what was typed', async () => {
    mockedCreateEvent.mockRejectedValue({ message: 'The server ran into a problem.', status: 500 });
    const onClose = vi.fn();
    const { result } = renderHook(() => useAddEventForm(onClose, vi.fn()));
    fillValidForm(result);

    await act(async () => {
      await result.current.submit();
    });

    expect(result.current.error?.message).toMatch(/couldn't save the event/i);
    expect(result.current.error?.message).toMatch(/details are kept/i);
    expect(result.current.form.name).toBe('Party');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('keeps a 400 message as the server wrote it', async () => {
    mockedCreateEvent.mockRejectedValue({ message: 'Postal code not found.', status: 400 });
    const { result } = renderHook(() => useAddEventForm(vi.fn(), vi.fn()));
    fillValidForm(result);

    await act(async () => {
      await result.current.submit();
    });

    expect(result.current.error?.message).toBe('Postal code not found.');
  });

  it('is dirty once any field has text, and clean on a fresh form', () => {
    const { result } = renderHook(() => useAddEventForm(vi.fn(), vi.fn()));
    expect(result.current.dirty).toBe(false);

    act(() => result.current.setField('postalCode', '1'));

    expect(result.current.dirty).toBe(true);
  });

  it('leaves error null once the last invalid field is corrected', async () => {
    const { result } = renderHook(() => useAddEventForm(vi.fn(), vi.fn()));
    fillValidForm(result);
    act(() => result.current.setField('name', ''));

    await act(async () => {
      await result.current.submit();
    });
    expect(result.current.error).not.toBeNull();

    act(() => result.current.setField('name', 'Party'));

    expect(result.current.error).toBeNull();
  });

  it('does not change submitCount when setField is called', async () => {
    const { result } = renderHook(() => useAddEventForm(vi.fn(), vi.fn()));
    await act(async () => {
      await result.current.submit();
    });
    const countAfterSubmit = result.current.submitCount;

    act(() => result.current.setField('name', 'Party'));

    expect(result.current.submitCount).toBe(countAfterSubmit);
  });
});
