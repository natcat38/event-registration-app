type FormFields = {
  name: string;
  dateTime: string;
  postalCode: string;
  deadline: string;
  capacity: string;
  handlerUuid: string;
};

// Order matches the spec's field order; also drives which field gets focus first.
export const fieldOrder = [
  'name',
  'dateTime',
  'postalCode',
  'deadline',
  'capacity',
  'handlerUuid',
] as const;

const fieldLabels: Record<(typeof fieldOrder)[number], string> = {
  name: 'Name',
  dateTime: 'Event Date Time',
  postalCode: 'Postal Code',
  deadline: 'Registration Deadline',
  capacity: 'Capacity',
  handlerUuid: 'Handler',
};

// Copy matches the backend's validation messages.
export function validate(form: FormFields): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  if (form.name.trim() === '') errors.name = [`${fieldLabels.name} is required.`];
  if (form.dateTime === '') errors.dateTime = [`${fieldLabels.dateTime} is required.`];
  if (form.postalCode === '') {
    errors.postalCode = [`${fieldLabels.postalCode} is required.`];
  } else if (!/^\d{6}$/.test(form.postalCode)) {
    errors.postalCode = ['Postal code must be 6 digits.'];
  }
  if (form.deadline === '') errors.deadline = [`${fieldLabels.deadline} is required.`];
  if (form.capacity === '') {
    errors.capacity = [`${fieldLabels.capacity} is required.`];
  } else {
    const n = Number(form.capacity);
    if (!Number.isInteger(n) || n < 1 || n > 99999) {
      errors.capacity = ['Capacity must be a whole number between 1 and 99999.'];
    }
  }
  if (form.handlerUuid === '') errors.handlerUuid = [`${fieldLabels.handlerUuid} is required.`];
  return errors;
}
