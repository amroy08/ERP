/**
 * EmailService
 * Phase 2.6B — Low-level SMTP transport layer.
 *
 * Responsibilities:
 * - Wraps Nodemailer for SMTP sending.
 * - Creates EmailNotificationLog records for every attempt.
 * - NEVER throws errors to calling business logic.
 * - Supports disabled, test, and live send modes.
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import prisma from '../config/prisma';
import {
  emailConfig,
  isEmailEnabled,
  isEmailTestMode,
  isSmtpConfigured,
} from '../config/email';
import { isRealEmail, maskEmail } from '../utils/emailHelpers';

// ── Types ──────────────────────────────────────────────────────────

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  /** Event type for the log record (e.g. "test_email", "admission_approved") */
  eventType: string;
  /** Optional school scope */
  schoolId?: string | null;
  /** Optional user ID of the recipient */
  recipientUserId?: string | null;
  /** Optional role of the recipient */
  recipientRole?: string | null;
  /** Optional metadata JSON for the log record */
  metadata?: Record<string, any> | null;
}

export interface SendEmailResult {
  success: boolean;
  status: 'sent' | 'failed' | 'skipped' | 'test';
  logId?: string;
  error?: string;
}

// ── Singleton transporter ──────────────────────────────────────────

let transporter: Transporter | null = null;

const getTransporter = (): Transporter | null => {
  if (transporter) return transporter;

  if (!isSmtpConfigured()) return null;

  transporter = nodemailer.createTransport({
    host: emailConfig.smtp.host,
    port: emailConfig.smtp.port,
    secure: emailConfig.smtp.secure,
    auth:
      emailConfig.smtp.user && emailConfig.smtp.pass
        ? {
            user: emailConfig.smtp.user,
            pass: emailConfig.smtp.pass,
          }
        : undefined,
    // Reasonable timeouts to prevent hanging
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });

  return transporter;
};

// ── Core send function ─────────────────────────────────────────────

export class EmailService {
  /**
   * Send a single email. Handles all modes (disabled, test, live).
   * NEVER throws — always returns a result object.
   */
  static async sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
    const {
      to,
      subject,
      html,
      text,
      eventType,
      schoolId,
      recipientUserId,
      recipientRole,
      metadata,
    } = params;

    try {
      // ── Guard: seeding mode ────────────────────────────────────
      if (process.env.SEEDING === 'true') {
        return { success: true, status: 'skipped', error: 'Seeding mode' };
      }

      // ── Guard: email disabled ──────────────────────────────────
      if (!isEmailEnabled()) {
        const log = await this.createLog({
          recipientEmail: to,
          subject,
          eventType,
          status: 'skipped',
          errorMessage: 'Email sending is disabled (EMAIL_ENABLED=false)',
          schoolId,
          recipientUserId,
          recipientRole,
          metadata,
        });
        return { success: true, status: 'skipped', logId: log?.id, error: 'Email disabled' };
      }

      // ── Guard: synthetic / missing recipient ───────────────────
      if (!isRealEmail(to)) {
        const log = await this.createLog({
          recipientEmail: to || '(empty)',
          subject,
          eventType,
          status: 'skipped',
          errorMessage: `Synthetic or missing email address: ${maskEmail(to)}`,
          schoolId,
          recipientUserId,
          recipientRole,
          metadata,
        });
        return {
          success: true,
          status: 'skipped',
          logId: log?.id,
          error: 'Synthetic or missing email',
        };
      }

      // ── Duplicate Prevention check ──────────────────────────────
      if (eventType !== 'password_reset') {
        const duplicateWindowSeconds = 30; // 30 seconds window
        const checkTime = new Date(Date.now() - duplicateWindowSeconds * 1000);
        
        const potentialDuplicates = await (prisma as any).emailNotificationLog.findMany({
          where: {
            eventType,
            recipientEmail: to,
            createdAt: { gte: checkTime },
            schoolId: schoolId || null,
          },
        });

        const isDuplicate = potentialDuplicates.some((log: any) => {
          if (!metadata || !log.metadata) return true; // If no metadata supplied, treat as duplicate
          
          const currentMeta = metadata as Record<string, any>;
          const loggedMeta = log.metadata as Record<string, any>;

          if (eventType === 'notice_published') {
            return !!(currentMeta.noticeId && loggedMeta.noticeId && currentMeta.noticeId === loggedMeta.noticeId);
          }

          if (eventType === 'homework_assigned') {
            return !!(currentMeta.homeworkId && loggedMeta.homeworkId && currentMeta.homeworkId === loggedMeta.homeworkId);
          }

          if (eventType === 'exam_scheduled' || eventType === 'exam_date_changed') {
            return !!(currentMeta.examId && loggedMeta.examId && currentMeta.examId === loggedMeta.examId);
          }

          if (eventType === 'result_published') {
            return !!(
              currentMeta.examId && loggedMeta.examId && currentMeta.examId === loggedMeta.examId &&
              currentMeta.subjectId && loggedMeta.subjectId && currentMeta.subjectId === loggedMeta.subjectId &&
              currentMeta.studentId && loggedMeta.studentId && currentMeta.studentId === loggedMeta.studentId
            );
          }
          
          const entityKeys = ['admissionId', 'studentId', 'userId', 'staffId', 'teacherId'];
          for (const key of entityKeys) {
            if (currentMeta[key] && loggedMeta[key] && currentMeta[key] === loggedMeta[key]) {
              return true;
            }
          }
          return false;
        });

        if (isDuplicate && potentialDuplicates.length > 0) {
          console.warn(`[EmailService] Duplicate send prevented for ${maskEmail(to)} with eventType "${eventType}"`);
          return {
            success: true,
            status: 'skipped',
            logId: potentialDuplicates[0].id,
            error: 'Duplicate request suppressed',
          };
        }
      }

      // ── Test mode: log without sending ─────────────────────────
      if (isEmailTestMode()) {
        const log = await this.createLog({
          recipientEmail: to,
          subject,
          eventType,
          status: 'test',
          errorMessage: 'Test mode — email not actually sent',
          schoolId,
          recipientUserId,
          recipientRole,
          metadata,
          sentAt: new Date(),
        });
        console.log(`[EmailService] TEST MODE — Would send to ${maskEmail(to)}: "${subject}"`);
        return { success: true, status: 'test', logId: log?.id };
      }

      // ── Guard: SMTP not configured ─────────────────────────────
      if (!isSmtpConfigured()) {
        const log = await this.createLog({
          recipientEmail: to,
          subject,
          eventType,
          status: 'failed',
          errorMessage: 'SMTP host is not configured',
          schoolId,
          recipientUserId,
          recipientRole,
          metadata,
        });
        console.error('[EmailService] SMTP not configured — cannot send email');
        return { success: false, status: 'failed', logId: log?.id, error: 'SMTP not configured' };
      }

      // ── Send via SMTP ──────────────────────────────────────────
      const transport = getTransporter();
      if (!transport) {
        const log = await this.createLog({
          recipientEmail: to,
          subject,
          eventType,
          status: 'failed',
          errorMessage: 'Failed to create SMTP transport',
          schoolId,
          recipientUserId,
          recipientRole,
          metadata,
        });
        return { success: false, status: 'failed', logId: log?.id, error: 'Transport creation failed' };
      }

      await transport.sendMail({
        from: `"${emailConfig.from.name}" <${emailConfig.from.email}>`,
        to,
        subject,
        html,
        text: text || undefined,
      });

      const log = await this.createLog({
        recipientEmail: to,
        subject,
        eventType,
        status: 'sent',
        schoolId,
        recipientUserId,
        recipientRole,
        metadata,
        sentAt: new Date(),
      });

      console.log(`[EmailService] Email sent to ${maskEmail(to)}: "${subject}"`);
      return { success: true, status: 'sent', logId: log?.id };
    } catch (error: any) {
      // ── SMTP or unexpected error — log and swallow ─────────────
      const errorMessage =
        error?.message || error?.code || 'Unknown email sending error';

      console.error(`[EmailService] Failed to send email to ${maskEmail(to)}: ${errorMessage}`);

      const log = await this.createLog({
        recipientEmail: to,
        subject,
        eventType,
        status: 'failed',
        errorMessage: errorMessage.substring(0, 2000), // Truncate for DB
        schoolId,
        recipientUserId,
        recipientRole,
        metadata,
      });

      return { success: false, status: 'failed', logId: log?.id, error: errorMessage };
    }
  }

  // ── Log helper ─────────────────────────────────────────────────

  private static async createLog(data: {
    recipientEmail: string;
    subject: string;
    eventType: string;
    status: string;
    errorMessage?: string | null;
    sentAt?: Date | null;
    schoolId?: string | null;
    recipientUserId?: string | null;
    recipientRole?: string | null;
    metadata?: Record<string, any> | null;
  }) {
    try {
      return await (prisma as any).emailNotificationLog.create({
        data: {
          recipientEmail: data.recipientEmail,
          subject: data.subject,
          eventType: data.eventType,
          status: data.status,
          errorMessage: data.errorMessage || null,
          sentAt: data.sentAt || null,
          schoolId: data.schoolId || null,
          recipientUserId: data.recipientUserId || null,
          recipientRole: data.recipientRole || null,
          metadata: data.metadata || undefined,
        },
      });
    } catch (logError) {
      // Even logging failed — just console it. Never crash the app.
      console.error('[EmailService] Failed to write email log:', logError);
      return null;
    }
  }
}
