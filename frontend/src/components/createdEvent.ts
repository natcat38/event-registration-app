/** What the page needs to confirm a save: the name typed and the address OneMap resolved. see docs/adr/0011 */
export interface CreatedEvent {
  name: string;
  address: string;
}

// see docs/adr/0013: the postal check is named only when the backend says OneMap failed (code address_lookup_failed).
export const ADDRESS_LOOKUP_FAILED_MESSAGE =
  "We couldn't save the event because the postal code check is unavailable right now. Your details are kept; try again in a minute.";
export const SAVE_FAILED_MESSAGE =
  "We couldn't save the event just now. Your details are kept; try again in a minute.";
