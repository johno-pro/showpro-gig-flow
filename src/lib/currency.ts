/**
 * Format a number as UK currency (£1,234.56)
 */
export function formatGBP(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) {
    return '';
  }
  
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Parse UK currency string to number
 * Handles: £1,234.56 -> 1234.56
 */
export function parseGBP(formatted: string): number {
  if (!formatted) return 0;
  
  // Remove £ symbol, spaces, and commas
  const cleaned = formatted.replace(/[£,\s]/g, '');
  const num = parseFloat(cleaned);
  
  return isNaN(num) ? 0 : num;
}
