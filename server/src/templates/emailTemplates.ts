/**
 * Email Templates
 * Phase 2.6B — Foundation templates only.
 *
 * Each template function returns { subject, html, text }.
 * Event-specific templates will be added in Phases 2.6C-E.
 */

export interface EmailTemplateResult {
  subject: string;
  html: string;
  text: string;
}

// ── Base Template Wrapper ──────────────────────────────────────────
// Provides consistent header/footer branding for all emails.
const wrapHtml = (body: string, schoolName?: string): string => {
  const brand = schoolName || 'School ERP';
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${brand}</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f4f6f9; color: #333; }
    .email-container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .email-header { background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); color: #ffffff; padding: 24px 32px; text-align: center; }
    .email-header h1 { margin: 0; font-size: 20px; font-weight: 600; letter-spacing: 0.3px; }
    .email-body { padding: 32px; line-height: 1.7; font-size: 15px; }
    .email-body h2 { color: #1e3a5f; font-size: 18px; margin-top: 0; }
    .email-footer { background: #f8f9fa; padding: 16px 32px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee; }
    .email-footer a { color: #2563eb; text-decoration: none; }
    .btn { display: inline-block; padding: 10px 24px; background: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 8px 0; }
    .info-box { background: #f0f7ff; border-left: 4px solid #2563eb; padding: 12px 16px; margin: 16px 0; border-radius: 0 4px 4px 0; }
    .credential-box { background: #f8f9fa; border: 1px solid #e2e8f0; padding: 16px; border-radius: 6px; margin: 16px 0; font-family: monospace; }
    table.data-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    table.data-table th { background: #f1f5f9; text-align: left; padding: 8px 12px; font-size: 13px; font-weight: 600; color: #475569; }
    table.data-table td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1>${brand}</h1>
    </div>
    <div class="email-body">
      ${body}
    </div>
    <div class="email-footer">
      <p>This is an automated email from ${brand}. Please do not reply to this message.</p>
    </div>
  </div>
</body>
</html>`.trim();
};

/**
 * Strip HTML tags for plain-text fallback.
 */
const stripHtml = (html: string): string => {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

// ── Foundation Templates ───────────────────────────────────────────

/**
 * Test email — used by the test-email script and admin diagnostics.
 */
export const testEmailTemplate = (vars: {
  recipientName?: string;
  schoolName?: string;
  timestamp?: string;
}): EmailTemplateResult => {
  const name = vars.recipientName || 'User';
  const school = vars.schoolName || 'School ERP';
  const ts = vars.timestamp || new Date().toISOString();

  const body = `
    <h2>✅ Email System Test</h2>
    <p>Hello ${name},</p>
    <p>This is a test email from <strong>${school}</strong> to confirm that the email notification system is working correctly.</p>
    <div class="info-box">
      <strong>Test Details:</strong><br/>
      Sent at: ${ts}<br/>
      School: ${school}
    </div>
    <p>If you received this email, the SMTP configuration is working properly.</p>
    <p>— ${school} Team</p>
  `;

  const html = wrapHtml(body, school);
  return {
    subject: `[Test] Email System Verification — ${school}`,
    html,
    text: stripHtml(html),
  };
};

/**
 * Generic notification — catch-all template for simple messages.
 */
export const genericNotificationTemplate = (vars: {
  recipientName?: string;
  schoolName?: string;
  title: string;
  message: string;
  ctaLabel?: string;
  ctaUrl?: string;
}): EmailTemplateResult => {
  const name = vars.recipientName || 'User';
  const school = vars.schoolName || 'School ERP';

  const ctaHtml = vars.ctaLabel && vars.ctaUrl
    ? `<p><a href="${vars.ctaUrl}" class="btn">${vars.ctaLabel}</a></p>`
    : '';

  const body = `
    <h2>${vars.title}</h2>
    <p>Hello ${name},</p>
    <p>${vars.message}</p>
    ${ctaHtml}
    <p>— ${school} Team</p>
  `;

  const html = wrapHtml(body, school);
  return {
    subject: `${vars.title} — ${school}`,
    html,
    text: stripHtml(html),
  };
};
