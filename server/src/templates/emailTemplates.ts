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

// ── Phase 2.6C Event Templates ─────────────────────────────────────

/**
 * Admission application submitted template
 */
export const admissionApplicationSubmittedTemplate = (vars: {
  parentName?: string;
  studentName: string;
  applicationNo?: string;
  className?: string;
  schoolName?: string;
}): EmailTemplateResult => {
  const parent = vars.parentName || 'Parent';
  const school = vars.schoolName || 'School ERP';
  const appNo = vars.applicationNo || 'N/A';
  const cls = vars.className || 'N/A';

  const body = `
    <h2>📝 Application Received Successfully</h2>
    <p>Dear ${parent},</p>
    <p>Thank you for submitting an admission application to <strong>${school}</strong>. We have received your application and will process it shortly.</p>
    <div class="info-box">
      <strong>Application Details:</strong><br/>
      Student Name: ${vars.studentName}<br/>
      Application No: ${appNo}<br/>
      Applied Class: ${cls}
    </div>
    <p>You will receive further email notifications as the status of your application updates.</p>
    <p>— ${school} Admissions Team</p>
  `;

  const html = wrapHtml(body, school);
  return {
    subject: `Application Received — ${vars.studentName}`,
    html,
    text: stripHtml(html),
  };
};

/**
 * Admission approved template
 */
export const admissionApprovedTemplate = (vars: {
  parentName?: string;
  studentName: string;
  className?: string;
  schoolName?: string;
}): EmailTemplateResult => {
  const parent = vars.parentName || 'Parent';
  const school = vars.schoolName || 'School ERP';
  const cls = vars.className || 'N/A';

  const body = `
    <h2>🎉 Admission Approved!</h2>
    <p>Dear ${parent},</p>
    <p>We are pleased to inform you that the admission application for <strong>${vars.studentName}</strong> has been <strong>approved</strong> at ${school}.</p>
    <div class="info-box">
      <strong>Details:</strong><br/>
      Student Name: ${vars.studentName}<br/>
      Approved Class: ${cls}
    </div>
    <p><strong>Next Steps:</strong> Please visit the school office to complete the remaining documentation and secure enrollment credentials.</p>
    <p>Congratulations, and welcome to our school family!</p>
    <p>— ${school} Admissions Team</p>
  `;

  const html = wrapHtml(body, school);
  return {
    subject: `Admission Approved — ${vars.studentName}`,
    html,
    text: stripHtml(html),
  };
};

/**
 * Admission rejected template
 */
export const admissionRejectedTemplate = (vars: {
  parentName?: string;
  studentName: string;
  schoolName?: string;
  remarks?: string;
}): EmailTemplateResult => {
  const parent = vars.parentName || 'Parent';
  const school = vars.schoolName || 'School ERP';
  const reasons = vars.remarks ? `<p><strong>Remarks / Feedback:</strong> ${vars.remarks}</p>` : '';

  const body = `
    <h2>Admission Status Update</h2>
    <p>Dear ${parent},</p>
    <p>We would like to thank you for your interest in <strong>${school}</strong>.</p>
    <p>After reviewing the application for <strong>${vars.studentName}</strong>, we regret to inform you that we are unable to approve the admission at this time.</p>
    ${reasons}
    <p>If you have any questions or would like to request clarification, please reach out to our admissions office.</p>
    <p>— ${school} Admissions Team</p>
  `;

  const html = wrapHtml(body, school);
  return {
    subject: `Admission Update — ${vars.studentName}`,
    html,
    text: stripHtml(html),
  };
};

/**
 * Student enrolled welcome template
 */
export const studentEnrolledTemplate = (vars: {
  parentName?: string;
  studentName: string;
  admissionNo: string;
  className?: string;
  sectionName?: string;
  studentEmail?: string;
  studentPassword?: string;
  parentEmail?: string;
  parentPassword?: string;
  schoolName?: string;
}): EmailTemplateResult => {
  const parent = vars.parentName || 'Parent';
  const school = vars.schoolName || 'School ERP';
  const cls = vars.className || 'N/A';
  const sec = vars.sectionName || 'N/A';

  let credentialsHtml = '';
  if (vars.studentEmail && vars.studentPassword) {
    credentialsHtml += `
      <strong>Student Portal Login:</strong><br/>
      Email: ${vars.studentEmail}<br/>
      Temp Password: ${vars.studentPassword}<br/><br/>
    `;
  }
  if (vars.parentEmail && vars.parentPassword) {
    credentialsHtml += `
      <strong>Parent Portal Login:</strong><br/>
      Email: ${vars.parentEmail}<br/>
      Password: ${vars.parentPassword}<br/>
    `;
  }

  const body = `
    <h2>🎓 Enrollment Welcome & Credentials</h2>
    <p>Dear ${parent},</p>
    <p>We are thrilled to welcome <strong>${vars.studentName}</strong> as an officially enrolled student at <strong>${school}</strong>!</p>
    <div class="info-box">
      <strong>Enrollment Details:</strong><br/>
      Student Name: ${vars.studentName}<br/>
      Admission No: ${vars.admissionNo}<br/>
      Class: ${cls} | Section: ${sec}
    </div>
    <p>Below are your initial portal login credentials. Please log in and change your password at your earliest convenience.</p>
    <div class="credential-box">
      ${credentialsHtml}
    </div>
    <p>If you have any issues logging in, please contact school administration.</p>
    <p>— ${school} Administration Team</p>
  `;

  const html = wrapHtml(body, school);
  return {
    subject: `Welcome! ${vars.studentName} is now enrolled`,
    html,
    text: stripHtml(html),
  };
};

/**
 * Welcome user template (Teacher / Staff)
 */
export const welcomeUserTemplate = (vars: {
  name: string;
  role: string;
  loginEmail: string;
  password?: string;
  schoolName?: string;
}): EmailTemplateResult => {
  const school = vars.schoolName || 'School ERP';
  const roleDisplay = vars.role.charAt(0).toUpperCase() + vars.role.slice(1);
  const tempPass = vars.password ? `<br/>Temporary Password: ${vars.password}` : '';

  const body = `
    <h2>🏫 Welcome to the Team!</h2>
    <p>Hello ${vars.name},</p>
    <p>Your account as a <strong>${roleDisplay}</strong> at <strong>${school}</strong> is ready for use.</p>
    <p>Please log in using the credentials below:</p>
    <div class="credential-box">
      Login Email: ${vars.loginEmail}${tempPass}
    </div>
    <p>For security reasons, please update your password after your first login.</p>
    <p>— ${school} Administration Team</p>
  `;

  const html = wrapHtml(body, school);
  return {
    subject: `Welcome to ${school} — Your Account is Ready`,
    html,
    text: stripHtml(html),
  };
};

/**
 * Password reset template
 */
export const passwordResetTemplate = (vars: {
  name: string;
  role: string;
  loginEmail: string;
  password?: string;
  schoolName?: string;
}): EmailTemplateResult => {
  const school = vars.schoolName || 'School ERP';
  const roleDisplay = vars.role.charAt(0).toUpperCase() + vars.role.slice(1);
  const tempPass = vars.password ? `<br/>New Temporary Password: ${vars.password}` : '';

  const body = `
    <h2>🔒 Password Reset Notification</h2>
    <p>Hello ${vars.name},</p>
    <p>The password for your <strong>${roleDisplay}</strong> account at <strong>${school}</strong> has been reset by school administration.</p>
    <p>Your new login credentials are below:</p>
    <div class="credential-box">
      Login Email: ${vars.loginEmail}${tempPass}
    </div>
    <p>Please log in and update your password immediately to secure your account.</p>
    <p>— ${school} IT Support</p>
  `;

  const html = wrapHtml(body, school);
  return {
    subject: `Password Reset — ${school}`,
    html,
    text: stripHtml(html),
  };
};

// ── Phase 2.6D Academic Templates ──────────────────────────────────

/**
 * Notice published template
 */
export const noticePublishedTemplate = (vars: {
  title: string;
  content: string;
  priority?: string;
  publishDate: string;
  schoolName?: string;
}): EmailTemplateResult => {
  const school = vars.schoolName || 'School ERP';
  const priorityLabel = vars.priority ? vars.priority.charAt(0).toUpperCase() + vars.priority.slice(1) : 'Normal';

  const body = `
    <h2>📢 New Notice Published</h2>
    <p>Dear recipient,</p>
    <p>A new notice has been published by school administration.</p>
    <div class="info-box">
      <strong>Notice Details:</strong><br/>
      <strong>Title:</strong> ${vars.title}<br/>
      <strong>Priority:</strong> ${priorityLabel}<br/>
      <strong>Publish Date:</strong> ${vars.publishDate}
    </div>
    <div class="credential-box" style="white-space: pre-wrap; font-family: inherit;">
      ${vars.content}
    </div>
    <p>— ${school} Administration Team</p>
  `;

  const html = wrapHtml(body, school);
  return {
    subject: `New Notice: ${vars.title} — ${school}`,
    html,
    text: stripHtml(html),
  };
};

/**
 * Homework assigned template
 */
export const homeworkAssignedTemplate = (vars: {
  title: string;
  subject: string;
  className: string;
  sectionName?: string;
  dueDate: string;
  description: string;
  schoolName?: string;
}): EmailTemplateResult => {
  const school = vars.schoolName || 'School ERP';
  const sec = vars.sectionName ? ` - ${vars.sectionName}` : '';

  const body = `
    <h2>📝 New Homework Assigned</h2>
    <p>Dear student/parent,</p>
    <p>A new homework assignment has been posted for your class.</p>
    <div class="info-box">
      <strong>Homework Details:</strong><br/>
      <strong>Subject:</strong> ${vars.subject}<br/>
      <strong>Class:</strong> ${vars.className}${sec}<br/>
      <strong>Title:</strong> ${vars.title}<br/>
      <strong>Due Date:</strong> ${vars.dueDate}
    </div>
    <p><strong>Description:</strong></p>
    <div class="credential-box" style="white-space: pre-wrap; font-family: inherit;">
      ${vars.description}
    </div>
    <p>Please log in to the student/parent portal to submit or track completion.</p>
    <p>— ${school} Academic Team</p>
  `;

  const html = wrapHtml(body, school);
  return {
    subject: `Homework Assigned: ${vars.subject} — ${school}`,
    html,
    text: stripHtml(html),
  };
};

/**
 * Exam scheduled template
 */
export const examScheduledTemplate = (vars: {
  examName: string;
  examType: string;
  className: string;
  subjectName?: string;
  startDate: string;
  endDate: string;
  schoolName?: string;
}): EmailTemplateResult => {
  const school = vars.schoolName || 'School ERP';
  const sub = vars.subjectName ? `<br/><strong>Subject:</strong> ${vars.subjectName}` : '';

  const body = `
    <h2>📅 Exam Scheduled</h2>
    <p>Dear student/parent,</p>
    <p>An exam has been scheduled for your class.</p>
    <div class="info-box">
      <strong>Exam Details:</strong><br/>
      <strong>Exam Name:</strong> ${vars.examName}<br/>
      <strong>Type:</strong> ${vars.examType}<br/>
      <strong>Class:</strong> ${vars.className}${sub}<br/>
      <strong>Start Date:</strong> ${vars.startDate}<br/>
      <strong>End Date:</strong> ${vars.endDate}
    </div>
    <p>Please review the exam timetable in the portal and prepare accordingly.</p>
    <p>— ${school} Examination Desk</p>
  `;

  const html = wrapHtml(body, school);
  return {
    subject: `Exam Scheduled: ${vars.examName} — ${school}`,
    html,
    text: stripHtml(html),
  };
};

/**
 * Exam date changed template
 */
export const examDateChangedTemplate = (vars: {
  examName: string;
  oldStartDate: string;
  oldEndDate: string;
  newStartDate: string;
  newEndDate: string;
  className: string;
  schoolName?: string;
}): EmailTemplateResult => {
  const school = vars.schoolName || 'School ERP';

  const body = `
    <h2>⚠️ Exam Schedule Changed</h2>
    <p>Dear student/parent,</p>
    <p>Please note that the schedule for the exam <strong>${vars.examName}</strong> (Class: ${vars.className}) has been updated.</p>
    <table class="data-table">
      <thead>
        <tr>
          <th>Schedule</th>
          <th>Old Dates</th>
          <th>New Dates</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Start Date</strong></td>
          <td><span style="color: #c53030; text-decoration: line-through;">${vars.oldStartDate}</span></td>
          <td><span style="color: #2f855a; font-weight: bold;">${vars.newStartDate}</span></td>
        </tr>
        <tr>
          <td><strong>End Date</strong></td>
          <td><span style="color: #c53030; text-decoration: line-through;">${vars.oldEndDate}</span></td>
          <td><span style="color: #2f855a; font-weight: bold;">${vars.newEndDate}</span></td>
        </tr>
      </tbody>
    </table>
    <p>Please refer to the updated exam schedule in your portal dashboard.</p>
    <p>— ${school} Examination Desk</p>
  `;

  const html = wrapHtml(body, school);
  return {
    subject: `Exam Schedule Updated: ${vars.examName} — ${school}`,
    html,
    text: stripHtml(html),
  };
};

/**
 * Result published template
 */
export const resultPublishedTemplate = (vars: {
  studentName: string;
  examName: string;
  subject: string;
  marksObtained: number;
  maxMarks: number;
  grade?: string;
  schoolName?: string;
}): EmailTemplateResult => {
  const school = vars.schoolName || 'School ERP';
  const gradeRow = vars.grade ? `<tr><td><strong>Grade</strong></td><td>${vars.grade}</td></tr>` : '';
  const percentage = vars.maxMarks > 0 ? Math.round((vars.marksObtained / vars.maxMarks) * 100) : 0;

  const body = `
    <h2>📊 Exam Result Published</h2>
    <p>Dear student/parent,</p>
    <p>The marks/result for <strong>${vars.studentName}</strong> have been published.</p>
    <div class="info-box">
      <strong>Exam & Subject:</strong> ${vars.examName} - ${vars.subject}
    </div>
    <table class="data-table" style="max-width: 400px; margin: 16px 0;">
      <thead>
        <tr>
          <th>Metric</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Marks Obtained</strong></td>
          <td><strong>${vars.marksObtained}</strong> / ${vars.maxMarks}</td>
        </tr>
        <tr>
          <td><strong>Percentage</strong></td>
          <td><strong>${percentage}%</strong></td>
        </tr>
        ${gradeRow}
      </tbody>
    </table>
    <p>For detail scorecard and class analysis, please log in to the portal.</p>
    <p>— ${school} Examination Desk</p>
  `;

  const html = wrapHtml(body, school);
  return {
    subject: `Marks Released: ${vars.subject} — ${school}`,
    html,
    text: stripHtml(html),
  };
};

