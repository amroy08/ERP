/**
 * NotificationService
 * Phase 2.6B — High-level orchestrator for email notifications.
 *
 * Foundation methods:
 * - sendTestEmail
 * - sendGenericNotification
 *
 * Placeholder methods (wired in Phase 2.6C-E):
 * - notifyAdmissionSubmitted
 * - notifyAdmissionApproved
 * - notifyAdmissionRejected
 * - notifyStudentEnrolled
 * - notifyWelcomeUser
 * - notifyNoticePublished
 * - notifyExamScheduled
 * - notifyResultPublished
 * - notifyHomeworkAssigned
 * - notifyFeePaymentReceipt
 * - notifyAttendanceAbsent
 * - notifyPasswordReset
 *
 * Rules:
 * - Every method is fire-and-forget safe.
 * - Never throws errors to calling business logic.
 * - Skips if SEEDING=true.
 */

import { EmailService, SendEmailResult } from './EmailService';
import {
  testEmailTemplate,
  genericNotificationTemplate,
} from '../templates/emailTemplates';
import { isRealEmail } from '../utils/emailHelpers';

// ── Types ──────────────────────────────────────────────────────────

interface NotifyResult extends SendEmailResult {}

const NOT_IMPLEMENTED: NotifyResult = {
  success: true,
  status: 'skipped',
  error: 'Not implemented yet — placeholder for Phase 2.6C-E',
};

// ── Service ────────────────────────────────────────────────────────

export class NotificationService {
  // ── Foundation Methods ─────────────────────────────────────────

  /**
   * Send a test/diagnostic email.
   */
  static async sendTestEmail(params: {
    to: string;
    recipientName?: string;
    schoolName?: string;
    schoolId?: string;
  }): Promise<NotifyResult> {
    try {
      const template = testEmailTemplate({
        recipientName: params.recipientName,
        schoolName: params.schoolName,
        timestamp: new Date().toISOString(),
      });

      return await EmailService.sendEmail({
        to: params.to,
        subject: template.subject,
        html: template.html,
        text: template.text,
        eventType: 'test_email',
        schoolId: params.schoolId,
      });
    } catch (error) {
      console.error('[NotificationService] sendTestEmail error:', error);
      return { success: false, status: 'failed', error: String(error) };
    }
  }

  /**
   * Send a generic notification with a custom title and message.
   */
  static async sendGenericNotification(params: {
    to: string;
    recipientName?: string;
    schoolName?: string;
    schoolId?: string;
    title: string;
    message: string;
    ctaLabel?: string;
    ctaUrl?: string;
    recipientUserId?: string;
    recipientRole?: string;
    metadata?: Record<string, any>;
  }): Promise<NotifyResult> {
    try {
      const template = genericNotificationTemplate({
        recipientName: params.recipientName,
        schoolName: params.schoolName,
        title: params.title,
        message: params.message,
        ctaLabel: params.ctaLabel,
        ctaUrl: params.ctaUrl,
      });

      return await EmailService.sendEmail({
        to: params.to,
        subject: template.subject,
        html: template.html,
        text: template.text,
        eventType: 'generic_notification',
        schoolId: params.schoolId,
        recipientUserId: params.recipientUserId,
        recipientRole: params.recipientRole,
        metadata: params.metadata,
      });
    } catch (error) {
      console.error('[NotificationService] sendGenericNotification error:', error);
      return { success: false, status: 'failed', error: String(error) };
    }
  }

  // ── Placeholder Methods (Phase 2.6C) ──────────────────────────

  /** Admission application submitted — notifies parent */
  static async notifyAdmissionSubmitted(_data: any): Promise<NotifyResult> {
    return NOT_IMPLEMENTED;
  }

  /** Admission approved — notifies parent */
  static async notifyAdmissionApproved(_data: any): Promise<NotifyResult> {
    return NOT_IMPLEMENTED;
  }

  /** Admission rejected — notifies parent */
  static async notifyAdmissionRejected(_data: any): Promise<NotifyResult> {
    return NOT_IMPLEMENTED;
  }

  /** Student enrolled (admission → student conversion) — notifies parent + student */
  static async notifyStudentEnrolled(_data: any): Promise<NotifyResult> {
    return NOT_IMPLEMENTED;
  }

  /** Welcome user (teacher/staff account created) — sends credentials */
  static async notifyWelcomeUser(_data: any): Promise<NotifyResult> {
    return NOT_IMPLEMENTED;
  }

  /** Password reset — notifies affected user */
  static async notifyPasswordReset(_data: any): Promise<NotifyResult> {
    return NOT_IMPLEMENTED;
  }

  // ── Placeholder Methods (Phase 2.6D) ──────────────────────────

  /** Notice published — notifies target audience */
  static async notifyNoticePublished(_data: any): Promise<NotifyResult> {
    return NOT_IMPLEMENTED;
  }

  /** Exam scheduled — notifies students + parents in class */
  static async notifyExamScheduled(_data: any): Promise<NotifyResult> {
    return NOT_IMPLEMENTED;
  }

  /** Result published — notifies individual students + parents */
  static async notifyResultPublished(_data: any): Promise<NotifyResult> {
    return NOT_IMPLEMENTED;
  }

  /** Homework assigned — notifies students + parents in class/section */
  static async notifyHomeworkAssigned(_data: any): Promise<NotifyResult> {
    return NOT_IMPLEMENTED;
  }

  // ── Placeholder Methods (Phase 2.6E) ──────────────────────────

  /** Fee payment receipt — notifies student + parent */
  static async notifyFeePaymentReceipt(_data: any): Promise<NotifyResult> {
    return NOT_IMPLEMENTED;
  }

  /** Attendance absent alert — notifies parent */
  static async notifyAttendanceAbsent(_data: any): Promise<NotifyResult> {
    return NOT_IMPLEMENTED;
  }
}
