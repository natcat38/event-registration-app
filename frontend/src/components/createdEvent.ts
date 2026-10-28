/** What the page needs to confirm a save: the name typed and the address OneMap resolved. see docs/adr/0011 */
export interface CreatedEvent {
  name: string;
  address: string;
}

// A 500 here almost always means the OneMap postal lookup failed (the backend maps every OneMap failure to 500).
export const SAVE_FAILED_MESSAGE =
  "We couldn't save the event just now. The postal code check may be unavailable. Your details are kept; try again in a minute.";
