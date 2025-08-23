import { parsePhoneNumberFromString } from 'libphonenumber-js';

export function formatPhoneNumber(code, number) {
  if (!code || !number) return '';

  const full = `+${code}${number}`;
  const phone = parsePhoneNumberFromString(full);

  return phone ? phone.formatInternational() : full;
}