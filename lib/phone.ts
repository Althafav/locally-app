/** Indian mobile numbers: 10 digits starting 6–9. Stored as "91XXXXXXXXXX". */
export const INDIAN_MOBILE = /^[6-9]\d{9}$/;

export function normalizeIndianMobile(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return INDIAN_MOBILE.test(digits) ? `91${digits}` : null;
}

export function formatPhone(stored: string): string {
  const d = stored.replace(/^91/, "");
  return `+91 ${d.slice(0, 5)} ${d.slice(5)}`;
}
