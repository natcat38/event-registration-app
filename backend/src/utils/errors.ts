// see docs/adr/0002: 421 = the schema alone rejects it, 400 = it fails against stored or external data.
export class AppError extends Error {
  constructor(
    public readonly status: 421 | 400,
    message: string,
    public readonly errors?: Record<string, string[]>,
  ) {
    super(message);
  }

  /** An error attached to one field; the same text is the top-level message and the field entry. */
  static field(status: 421 | 400, field: string, message: string): AppError {
    return new AppError(status, message, { [field]: [message] });
  }
}

/**
 * OneMap could not answer (network, timeout, 5xx, 429, malformed body). Still a 500, since the spec allows
 * only four codes, but the body carries `code` so the UI can name the cause. see docs/adr/0013
 */
export class AddressLookupError extends Error {
  readonly code = 'address_lookup_failed';

  constructor(cause: unknown) {
    super('Address lookup failed.', { cause });
  }
}
