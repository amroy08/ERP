import { format } from 'date-fns';

/**
 * Global date formatting constants
 */
export const DATE_FORMATS = {
  DISPLAY: 'dd MMM yyyy',
  TIME: 'hh:mm a',
  FULL: 'dd MMMM yyyy, hh:mm a',
  DATABASE: 'yyyy-MM-dd'
};

/**
 * Format a date string or object into a human-readable display string
 */
export const formatDate = (date: Date | string | number, pattern = DATE_FORMATS.DISPLAY): string => {
  return format(new Date(date), pattern);
};

/**
 * Format currency amounts into localized string (INR by default)
 */
export const formatCurrency = (amount: number, currency = 'INR'): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Generate a random numeric string of fixed length
 */
export const generateNumericOTP = (length = 6): string => {
  let result = '';
  const characters = '0123456789';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

/**
 * Slugify a string (useful for creating URL-friendly names)
 */
export const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
};
