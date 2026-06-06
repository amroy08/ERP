/**
 * server/src/utils/validate.ts
 * Lightweight validation helpers shared across all controllers.
 * Returns a 400 error via createError on failure, so callers can do:
 *   const err = requireFields(req.body, ['name', 'classId']);
 *   if (err) return next(err);
 */
import { createError } from '../middleware/errorHandler';

/** Assert that required string fields are non-empty.  Returns an HttpError or null. */
export function requireFields(body: Record<string, any>, fields: string[]): ReturnType<typeof createError> | null {
  for (const field of fields) {
    const val = body[field];
    if (val === undefined || val === null || String(val).trim() === '') {
      const label = field.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
      return createError(`${label} is required.`, 400);
    }
  }
  return null;
}

/** Assert that a value is a positive finite number. */
export function requirePositiveNumber(
  value: any,
  fieldLabel: string
): ReturnType<typeof createError> | null {
  const n = parseFloat(value);
  if (isNaN(n) || !isFinite(n) || n <= 0) {
    return createError(`${fieldLabel} must be a positive number greater than zero.`, 400);
  }
  return null;
}

/** Assert that a value is a valid date string. */
export function requireValidDate(
  value: any,
  fieldLabel: string
): ReturnType<typeof createError> | null {
  if (!value) return null; // Optional dates are fine
  const d = new Date(value);
  if (isNaN(d.getTime())) {
    return createError(`${fieldLabel} must be a valid date.`, 400);
  }
  return null;
}

/** Assert marks are within [0, maxMarks]. */
export function requireValidMarks(
  marksObtained: any,
  maxMarks: any
): ReturnType<typeof createError> | null {
  const obtained = parseFloat(marksObtained);
  const max = parseFloat(maxMarks);
  if (isNaN(obtained) || obtained < 0) {
    return createError('Marks obtained cannot be negative.', 400);
  }
  if (!isNaN(max) && obtained > max) {
    return createError(`Marks obtained (${obtained}) cannot exceed maximum marks (${max}).`, 400);
  }
  return null;
}

/** Allowed attendance status values. */
export const VALID_ATTENDANCE_STATUSES = ['present', 'absent', 'late', 'half_day', 'leave'] as const;

/** Allowed payment modes. */
export const VALID_PAYMENT_MODES = ['cash', 'online', 'cheque', 'bank_transfer', 'upi', 'card'] as const;
