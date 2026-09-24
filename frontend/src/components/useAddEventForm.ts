import { useEffect, useRef, useState } from 'react';
import { createEvent, listHandlers, toApiError, type ApiError, type Handler } from '../api/client';
import { fieldOrder, validate } from './addEventValidation';

const emptyForm = {
  name: '',
  dateTime: '',
  postalCode: '',
  deadline: '',
  capacity: '',
  handlerUuid: '',
};

type FormState = typeof emptyForm;

export { fieldOrder };

/** Field-level state and submit logic for the Add Event form, mounted fresh each time the dialog opens. */
export function useAddEventForm(onClose: () => void, onCreated: () => void) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [handlers, setHandlers] = useState<Handler[]>([]);
  const [handlersError, setHandlersError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  // Bumped only on a failed submit, so the focus effect never fires from field edits.
  const [submitCount, setSubmitCount] = useState(0);

  // Set on unmount so a late response cannot reopen a closed dialog; reset on mount for StrictMode's double-run.
  const closedRef = useRef(false);
  useEffect(() => {
    closedRef.current = false;
    return () => {
      closedRef.current = true;
    };
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const data = await listHandlers();
        if (!closedRef.current) setHandlers(data);
      } catch (err) {
        if (!closedRef.current) setHandlersError(toApiError(err).message);
      }
    }
    void load();
  }, []);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Clear this field's error on edit so a correction stops showing a stale message.
    setError((prev) => {
      if (!prev?.errors?.[key]) return prev;
      const rest = Object.fromEntries(Object.entries(prev.errors).filter(([k]) => k !== key));
      // A cleared last field error with no server message means there is nothing left to show.
      if (Object.keys(rest).length === 0 && prev.message === '') return null;
      return { ...prev, errors: rest };
    });
  }

  function fieldError(field: string): string | undefined {
    return error?.errors?.[field]?.join(' ');
  }

  const knownFields = new Set<string>(fieldOrder);
  const otherErrors = Object.entries(error?.errors ?? {})
    .filter(([field]) => !knownFields.has(field))
    .flatMap(([, messages]) => messages);

  const capacityNumber = Number(form.capacity);

  async function submit() {
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setError({ message: '', errors: validationErrors });
      setSubmitCount((n) => n + 1);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createEvent({
        name: form.name.trim(),
        // datetime-local has no offset; Singapore is sent explicitly. see docs/adr/0003
        dateTime: `${form.dateTime}:00+08:00`,
        postalCode: form.postalCode,
        deadline: form.deadline,
        capacity: capacityNumber,
        handlerUuid: form.handlerUuid,
      });
      if (closedRef.current) return;
      onCreated();
      onClose();
    } catch (err) {
      if (closedRef.current) return;
      setError(toApiError(err));
      setSubmitCount((n) => n + 1);
    } finally {
      if (!closedRef.current) setSubmitting(false);
    }
  }

  return {
    form,
    setField,
    handlers,
    handlersError,
    submitting,
    error,
    fieldError,
    otherErrors,
    submit,
    submitCount,
  };
}

export type AddEventFormState = ReturnType<typeof useAddEventForm>;
