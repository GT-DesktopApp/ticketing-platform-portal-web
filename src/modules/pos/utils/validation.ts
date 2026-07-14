import { isValidPhoneNumber } from "libphonenumber-js";

/**
 * Shared field validators for the customer/booking forms.
 *
 * Phone: validated with libphonenumber-js so we accept any real international
 * number (the PhoneInput stores E.164, e.g. "+919812345678"). GSTIN: the
 * canonical 15-character Indian GST identifier.
 */

/** Canonical Indian GSTIN: 2-digit state + 10-char PAN + entity + Z + checksum. */
export const GSTIN_REGEX =
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

/** True when `value` is a well-formed GSTIN (case-sensitive, upper-case). */
export function isValidGstin(value: string): boolean {
  return GSTIN_REGEX.test(value.trim());
}

/**
 * True when `value` is a valid phone number. Expects E.164 (what PhoneInput
 * produces); libphonenumber-js checks length + national number rules per country.
 */
export function isValidPhone(value: string | undefined | null): boolean {
  if (!value) return false;
  try {
    return isValidPhoneNumber(value);
  } catch {
    return false;
  }
}

/**
 * Collapse a name for storage: trim both ends and squeeze internal runs of
 * whitespace to single spaces. Prevents leading spaces and " " -only names.
 */
export function normalizeName(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}
