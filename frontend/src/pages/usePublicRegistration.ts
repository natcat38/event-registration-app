import { useCallback, useEffect, useRef, useState } from 'react';
import {
  listPublicEvents,
  register,
  toApiError,
  type ApiError,
  type PublicEvent,
} from '../api/client';

/** Data and submit logic for the public registration page (kept out of the component to stay under ~120 lines). */
export function usePublicRegistration() {
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedUuid, setSelectedUuid] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<ApiError | null>(null);

  // Set on unmount so a late response cannot update a gone component; reset on mount for StrictMode's double-run.
  const cancelledRef = useRef(false);

  // `quiet` skips the page-level loading/error state and leaves any just-shown register error alone.
  const loadEvents = useCallback(
    async (options: { quiet?: boolean } = {}): Promise<PublicEvent[]> => {
      const quiet = options.quiet ?? false;
      if (!quiet) {
        setLoading(true);
        setLoadError(null);
      }
      try {
        const data = await listPublicEvents();
        if (cancelledRef.current) return data;
        setEvents(data);
        setSelectedUuid((current) => (data.some((e) => e.uuid === current) ? current : ''));
        return data;
      } catch (err) {
        if (cancelledRef.current) return [];
        if (!quiet) setLoadError(toApiError(err).message);
        return [];
      } finally {
        if (!cancelledRef.current && !quiet) setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    cancelledRef.current = false;
    async function run() {
      await loadEvents();
    }
    void run();
    return () => {
      cancelledRef.current = true;
    };
  }, [loadEvents]);

  function selectEvent(uuid: string) {
    setSelectedUuid(uuid);
    setSubmitError(null);
  }

  function changeEmail(value: string) {
    setEmail(value);
    setSubmitError(null);
  }

  // The dropdown and email field are disabled while submitting, so the selection cannot change mid-request.
  async function submitRegistration(): Promise<{
    eventName: string;
    registrationNo: string;
  } | null> {
    if (email.trim() === '') {
      setSubmitError({ message: '', errors: { emailAddress: ['Email address is required.'] } });
      return null;
    }
    const eventAtSubmit = selectedUuid;
    const emailAtSubmit = email;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const { registrationNo } = await register(eventAtSubmit, emailAtSubmit);
      const eventName = events.find((e) => e.uuid === eventAtSubmit)?.name ?? '';
      return { eventName, registrationNo };
    } catch (err) {
      const apiError = toApiError(err);
      setSubmitError(apiError);
      // Anything but a duplicate email means the open list may be stale; refresh it quietly.
      if (!apiError.errors?.emailAddress) void loadEvents({ quiet: true });
      return null;
    } finally {
      setSubmitting(false);
    }
  }

  return {
    events,
    loading,
    loadError,
    selectedUuid,
    email,
    submitting,
    submitError,
    selectEvent,
    changeEmail,
    submitRegistration,
  };
}
