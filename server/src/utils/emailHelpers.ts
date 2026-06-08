/**
 * Email Helper Utilities
 * Phase 2.6B — Synthetic email detection, deduplication, sanitization.
 */

/**
 * Check whether an email address is a real, deliverable address.
 * Returns false for:
 * - empty/null values
 * - synthetic @school.local addresses
 * - placeholder strings
 * - malformed addresses
 */
export const isRealEmail = (email?: string | null): boolean => {
  if (!email || typeof email !== 'string') return false;

  const trimmed = email.trim().toLowerCase();
  if (trimmed.length === 0) return false;

  // Skip synthetic school.local addresses
  if (trimmed.endsWith('@school.local')) return false;

  // Skip common placeholder patterns
  if (trimmed.includes('placeholder')) return false;
  if (trimmed.includes('noreply')) return false;
  if (trimmed === 'test@test.com') return false;

  // Basic email format check (not exhaustive — just a safety net)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmed);
};

/**
 * Sanitize and normalize an email address.
 */
export const sanitizeEmail = (email: string): string => {
  return email.trim().toLowerCase();
};

/**
 * Remove duplicate email addresses from a list.
 * Preserves the first occurrence.
 */
export const deduplicateEmails = (
  recipients: Array<{ email: string; [key: string]: any }>
): Array<{ email: string; [key: string]: any }> => {
  const seen = new Set<string>();
  return recipients.filter((r) => {
    const normalized = sanitizeEmail(r.email);
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
};

/**
 * Mask an email address for safe logging.
 * "john.doe@example.com" → "jo***@example.com"
 */
export const maskEmail = (email: string): string => {
  if (!email) return '(empty)';
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  const visibleChars = Math.min(2, local.length);
  return `${local.substring(0, visibleChars)}***@${domain}`;
};
