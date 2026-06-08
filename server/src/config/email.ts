/**
 * Email Configuration
 * Phase 2.6B — Reads email env vars and exposes typed helpers.
 *
 * Rules:
 * - Email is DISABLED by default.
 * - Missing SMTP config does NOT crash the server.
 * - SMTP password is never logged.
 */

export interface EmailConfig {
  enabled: boolean;
  provider: string;
  testMode: boolean;
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
  };
  from: {
    email: string;
    name: string;
  };
}

const parseBool = (val: string | undefined, fallback: boolean): boolean => {
  if (!val) return fallback;
  return val.toLowerCase() === 'true' || val === '1';
};

const parseInt10 = (val: string | undefined, fallback: number): number => {
  if (!val) return fallback;
  const n = parseInt(val, 10);
  return isNaN(n) ? fallback : n;
};

export const emailConfig: EmailConfig = {
  enabled: parseBool(process.env.EMAIL_ENABLED, false),
  provider: process.env.EMAIL_PROVIDER || 'smtp',
  testMode: parseBool(process.env.EMAIL_TEST_MODE, false),
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt10(process.env.SMTP_PORT, 587),
    secure: parseBool(process.env.SMTP_SECURE, false),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
  from: {
    email: process.env.SMTP_FROM_EMAIL || 'noreply@school.local',
    name: process.env.SMTP_FROM_NAME || 'School ERP',
  },
};

/** Master switch — is email sending enabled? */
export const isEmailEnabled = (): boolean => emailConfig.enabled;

/** Test mode — log email attempts without actually sending */
export const isEmailTestMode = (): boolean => emailConfig.testMode;

/** Check whether SMTP host and credentials are minimally configured */
export const isSmtpConfigured = (): boolean => {
  return !!(emailConfig.smtp.host && emailConfig.smtp.host.length > 0);
};

/** Safe summary for startup logging — never exposes password */
export const getEmailConfigSummary = (): string => {
  return [
    `Email enabled: ${emailConfig.enabled}`,
    `Provider: ${emailConfig.provider}`,
    `Test mode: ${emailConfig.testMode}`,
    `SMTP host: ${emailConfig.smtp.host || '(not set)'}`,
    `SMTP port: ${emailConfig.smtp.port}`,
    `From: ${emailConfig.from.name} <${emailConfig.from.email}>`,
  ].join(' | ');
};
