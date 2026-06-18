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

import prisma from '../config/prisma';
import { Role, NotificationType, NotificationPriority, DeliveryChannel } from '@prisma/client';
import { EmailService, SendEmailResult } from './EmailService';
import { PushNotificationService } from './PushNotificationService';
import { FeeService } from './FeeService';
import {
  testEmailTemplate,
  genericNotificationTemplate,
  admissionApplicationSubmittedTemplate,
  admissionApprovedTemplate,
  admissionRejectedTemplate,
  studentEnrolledTemplate,
  welcomeUserTemplate,
  passwordResetTemplate,
  noticePublishedTemplate,
  homeworkAssignedTemplate,
  examScheduledTemplate,
  examDateChangedTemplate,
  resultPublishedTemplate,
  feePaymentReceiptTemplate,
  attendanceAbsentAlertTemplate,
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
  // ── Database Notification Foundation Methods ─────────────────────

  /**
   * Create a single in-app notification in DB and safely log delivery states.
   */
  static async createNotification(params: {
    schoolId: string;
    recipientUserId: string;
    recipientRole: Role;
    studentId?: string | null;
    type: NotificationType;
    title: string;
    message: string;
    relatedEntityType?: string | null;
    relatedEntityId?: string | null;
    priority?: NotificationPriority;
    expiresAt?: Date | null;
    channels?: DeliveryChannel[];
  }) {
    try {
      const priority = params.priority || 'NORMAL';
      const notification = await prisma.notification.create({
        data: {
          schoolId: params.schoolId,
          recipientUserId: params.recipientUserId,
          recipientRole: params.recipientRole,
          studentId: params.studentId || null,
          type: params.type,
          title: params.title,
          message: params.message,
          relatedEntityType: params.relatedEntityType || null,
          relatedEntityId: params.relatedEntityId || null,
          priority,
          isRead: false,
          expiresAt: params.expiresAt || null,
        },
      });

      const channels = params.channels || ['IN_APP'];
      await prisma.notificationDeliveryLog.createMany({
        data: channels.map(channel => ({
          notificationId: notification.id,
          channel,
          status: 'SENT',
        })),
      });

      if (channels.includes('PUSH')) {
        PushNotificationService.sendToUser(params.recipientUserId, {
          title: params.title,
          body: params.message,
          data: {
            type: String(params.type),
            relatedEntityType: params.relatedEntityType || '',
            relatedEntityId: params.relatedEntityId || '',
          },
        }).catch(err => {
          console.error('[NotificationService] Async push dispatch failed:', err);
        });
      }

      return notification;
    } catch (error) {
      console.error('[NotificationService] createNotification failed:', error);
      return null;
    }
  }

  /**
   * Create bulk notifications in the DB and delivery logs.
   */
  static async createBulkNotifications(paramsArray: Array<{
    schoolId: string;
    recipientUserId: string;
    recipientRole: Role;
    studentId?: string | null;
    type: NotificationType;
    title: string;
    message: string;
    relatedEntityType?: string | null;
    relatedEntityId?: string | null;
    priority?: NotificationPriority;
    expiresAt?: Date | null;
    channels?: DeliveryChannel[];
  }>) {
    try {
      if (paramsArray.length === 0) return [];

      const createdNotifications = [];
      for (const params of paramsArray) {
        const notif = await this.createNotification(params);
        if (notif) {
          createdNotifications.push(notif);
        }
      }
      return createdNotifications;
    } catch (error) {
      console.error('[NotificationService] createBulkNotifications failed:', error);
      return [];
    }
  }

  /**
   * Fetch paginated notifications for a user.
   */
  static async getUserNotifications(params: {
    userId: string;
    studentId?: string;
    isRead?: boolean;
    limit?: number;
    page?: number;
  }) {
    try {
      const page = params.page || 1;
      const limit = params.limit || 20;
      const skip = (page - 1) * limit;

      const where: any = {
        recipientUserId: params.userId,
      };

      if (params.studentId) {
        where.studentId = params.studentId;
      }

      if (params.isRead !== undefined) {
        where.isRead = params.isRead;
      }

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.notification.count({ where }),
      ]);

      return {
        notifications,
        pagination: {
          page,
          limit,
          total,
        },
      };
    } catch (error) {
      console.error('[NotificationService] getUserNotifications failed:', error);
      throw error;
    }
  }

  /**
   * Get count of unread notifications for a user.
   */
  static async getUnreadCount(userId: string, studentId?: string) {
    try {
      const where: any = {
        recipientUserId: userId,
        isRead: false,
      };

      if (studentId) {
        where.studentId = studentId;
      }

      const unreadCount = await prisma.notification.count({ where });
      return { unreadCount };
    } catch (error) {
      console.error('[NotificationService] getUnreadCount failed:', error);
      throw error;
    }
  }

  /**
   * Mark a specific notification as read.
   */
  static async markAsRead(notificationId: string, userId: string) {
    try {
      const notification = await prisma.notification.findFirst({
        where: {
          id: notificationId,
          recipientUserId: userId,
        },
      });

      if (!notification) {
        return null;
      }

      return await prisma.notification.update({
        where: { id: notificationId },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
    } catch (error) {
      console.error('[NotificationService] markAsRead failed:', error);
      throw error;
    }
  }

  /**
   * Mark all unread notifications as read for a user.
   */
  static async markAllAsRead(userId: string, studentId?: string) {
    try {
      const where: any = {
        recipientUserId: userId,
        isRead: false,
      };

      if (studentId) {
        where.studentId = studentId;
      }

      await prisma.notification.updateMany({
        where,
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return true;
    } catch (error) {
      console.error('[NotificationService] markAllAsRead failed:', error);
      throw error;
    }
  }

  /**
   * Register or update a device token.
   */
  static async registerDeviceToken(params: {
    userId: string;
    token: string;
    deviceType: string;
    platform?: string;
    appVersion?: string;
  }) {
    try {
      return await prisma.deviceToken.upsert({
        where: { token: params.token },
        create: {
          token: params.token,
          userId: params.userId,
          deviceType: params.deviceType,
          platform: params.platform || null,
          appVersion: params.appVersion || null,
          isActive: true,
          lastSeenAt: new Date(),
        },
        update: {
          userId: params.userId,
          deviceType: params.deviceType,
          platform: params.platform || null,
          appVersion: params.appVersion || null,
          isActive: true,
          lastSeenAt: new Date(),
        },
      });
    } catch (error) {
      console.error('[NotificationService] registerDeviceToken failed:', error);
      throw error;
    }
  }

  /**
   * Unregister / Deactivate a device token.
   */
  static async removeDeviceToken(userId: string, token: string) {
    try {
      const deviceToken = await prisma.deviceToken.findFirst({
        where: { token, userId },
      });

      if (!deviceToken) {
        return false;
      }

      await prisma.deviceToken.update({
        where: { token },
        data: {
          isActive: false,
          lastSeenAt: new Date(),
        },
      });

      return true;
    } catch (error) {
      console.error('[NotificationService] removeDeviceToken failed:', error);
      throw error;
    }
  }

  /**
   * Evaluate cooldown rules to see if a notification of a given type is allowed.
   */
  static async shouldSendReminder(params: {
    schoolId: string;
    type: NotificationType;
    recipientUserId: string;
    studentId?: string | null;
    relatedEntityId?: string | null;
  }): Promise<boolean> {
    try {
      const rule = await prisma.notificationRule.findUnique({
        where: {
          schoolId_type: {
            schoolId: params.schoolId,
            type: params.type,
          },
        },
      });

      if (rule && !rule.enabled) {
        return false;
      }

      const cooldownHours = rule?.cooldownHours || 0;
      if (cooldownHours <= 0) {
        return true;
      }

      const lastNotification = await prisma.notification.findFirst({
        where: {
          schoolId: params.schoolId,
          recipientUserId: params.recipientUserId,
          type: params.type,
          studentId: params.studentId || null,
          relatedEntityId: params.relatedEntityId || null,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!lastNotification) {
        return true;
      }

      const diffMs = Date.now() - lastNotification.createdAt.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      return diffHours >= cooldownHours;
    } catch (error) {
      console.error('[NotificationService] shouldSendReminder failed:', error);
      return true;
    }
  }

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

  // ── Real Methods (Phase 2.6C) ──────────────────────────────────

  /** Admission application submitted — notifies parent */
  static async notifyAdmissionSubmitted(admission: any): Promise<NotifyResult> {
    try {
      const parentEmail = admission.parentEmail;
      const cls = admission.classId ? await prisma.class.findUnique({ where: { id: admission.classId } }) : null;
      const school = admission.schoolId ? await prisma.school.findUnique({ where: { id: admission.schoolId } }) : null;

      const template = admissionApplicationSubmittedTemplate({
        parentName: admission.parentName || admission.fatherName,
        studentName: `${admission.firstName} ${admission.lastName}`,
        applicationNo: admission.applicationNo || admission.applicationNo || 'N/A',
        className: cls?.name,
        schoolName: school?.name,
      });

      return await EmailService.sendEmail({
        to: parentEmail,
        subject: template.subject,
        html: template.html,
        text: template.text,
        eventType: 'admission_application_submitted',
        schoolId: admission.schoolId,
        recipientRole: 'parent',
        metadata: { admissionId: admission.id },
      });
    } catch (error) {
      console.error('[NotificationService] notifyAdmissionSubmitted error:', error);
      return { success: false, status: 'failed', error: String(error) };
    }
  }

  /** Admission approved — notifies parent */
  static async notifyAdmissionApproved(admission: any): Promise<NotifyResult> {
    try {
      const parentEmail = admission.parentEmail;
      const cls = admission.classId ? await prisma.class.findUnique({ where: { id: admission.classId } }) : null;
      const school = admission.schoolId ? await prisma.school.findUnique({ where: { id: admission.schoolId } }) : null;

      const template = admissionApprovedTemplate({
        parentName: admission.parentName || admission.fatherName,
        studentName: `${admission.firstName} ${admission.lastName}`,
        className: cls?.name,
        schoolName: school?.name,
      });

      return await EmailService.sendEmail({
        to: parentEmail,
        subject: template.subject,
        html: template.html,
        text: template.text,
        eventType: 'admission_approved',
        schoolId: admission.schoolId,
        recipientRole: 'parent',
        metadata: { admissionId: admission.id },
      });
    } catch (error) {
      console.error('[NotificationService] notifyAdmissionApproved error:', error);
      return { success: false, status: 'failed', error: String(error) };
    }
  }

  /** Admission rejected — notifies parent */
  static async notifyAdmissionRejected(admission: any): Promise<NotifyResult> {
    try {
      const parentEmail = admission.parentEmail;
      const school = admission.schoolId ? await prisma.school.findUnique({ where: { id: admission.schoolId } }) : null;

      const template = admissionRejectedTemplate({
        parentName: admission.parentName || admission.fatherName,
        studentName: `${admission.firstName} ${admission.lastName}`,
        schoolName: school?.name,
        remarks: admission.remarks || undefined,
      });

      return await EmailService.sendEmail({
        to: parentEmail,
        subject: template.subject,
        html: template.html,
        text: template.text,
        eventType: 'admission_rejected',
        schoolId: admission.schoolId,
        recipientRole: 'parent',
        metadata: { admissionId: admission.id },
      });
    } catch (error) {
      console.error('[NotificationService] notifyAdmissionRejected error:', error);
      return { success: false, status: 'failed', error: String(error) };
    }
  }

  /** Student enrolled (admission → student conversion) — notifies parent + student */
  static async notifyStudentEnrolled(student: any, credentials: any): Promise<NotifyResult> {
    try {
      const cls = student.classId ? await prisma.class.findUnique({ where: { id: student.classId } }) : null;
      const sec = student.sectionId ? await prisma.section.findUnique({ where: { id: student.sectionId } }) : null;
      const school = student.schoolId ? await prisma.school.findUnique({ where: { id: student.schoolId } }) : null;
      const parent = student.parentId ? await prisma.parent.findUnique({ where: { id: student.parentId } }) : null;

      const parentEmail = credentials.parent.email;
      const parentTemplate = studentEnrolledTemplate({
        parentName: parent?.fatherName || parent?.motherName || 'Parent',
        studentName: student.fullName || `${student.firstName} ${student.lastName}`,
        admissionNo: student.admissionNumber,
        className: cls?.name,
        sectionName: sec?.name,
        studentEmail: credentials.student.email,
        studentPassword: credentials.student.password,
        parentEmail: credentials.parent.email,
        parentPassword: credentials.parent.password,
        schoolName: school?.name,
      });

      // Send to parent first
      const parentResult = await EmailService.sendEmail({
        to: parentEmail,
        subject: parentTemplate.subject,
        html: parentTemplate.html,
        text: parentTemplate.text,
        eventType: 'student_enrolled',
        schoolId: student.schoolId,
        recipientUserId: parent?.userId || null,
        recipientRole: 'parent',
        metadata: { studentId: student.id, userId: student.userId },
      });

      // Send to student only if it's a real email address
      const studentEmail = credentials.student.email;
      if (isRealEmail(studentEmail)) {
        const studentTemplate = welcomeUserTemplate({
          name: student.fullName || `${student.firstName} ${student.lastName}`,
          role: 'student',
          loginEmail: studentEmail,
          password: credentials.student.password,
          schoolName: school?.name,
        });
        await EmailService.sendEmail({
          to: studentEmail,
          subject: studentTemplate.subject,
          html: studentTemplate.html,
          text: studentTemplate.text,
          eventType: 'welcome_user',
          schoolId: student.schoolId,
          recipientUserId: student.userId,
          recipientRole: 'student',
          metadata: { studentId: student.id, userId: student.userId },
        });
      } else {
        // Log synthetic/missing student email check as skipped
        await EmailService.sendEmail({
          to: studentEmail || '(empty)',
          subject: parentTemplate.subject,
          html: parentTemplate.html,
          eventType: 'student_enrolled',
          schoolId: student.schoolId,
          recipientUserId: student.userId,
          recipientRole: 'student',
          metadata: { studentId: student.id, userId: student.userId },
        });
      }

      return parentResult;
    } catch (error) {
      console.error('[NotificationService] notifyStudentEnrolled error:', error);
      return { success: false, status: 'failed', error: String(error) };
    }
  }

  /** Welcome user (teacher/staff account created) — sends credentials */
  static async notifyWelcomeUser(params: {
    to: string;
    name: string;
    role: string;
    loginEmail: string;
    password?: string;
    schoolId?: string;
    recipientUserId?: string;
  }): Promise<NotifyResult> {
    try {
      const school = params.schoolId ? await prisma.school.findUnique({ where: { id: params.schoolId } }) : null;
      const template = welcomeUserTemplate({
        name: params.name,
        role: params.role,
        loginEmail: params.loginEmail,
        password: params.password,
        schoolName: school?.name,
      });

      return await EmailService.sendEmail({
        to: params.to,
        subject: template.subject,
        html: template.html,
        text: template.text,
        eventType: 'welcome_user',
        schoolId: params.schoolId || null,
        recipientUserId: params.recipientUserId || null,
        recipientRole: params.role,
        metadata: { loginEmail: params.loginEmail },
      });
    } catch (error) {
      console.error('[NotificationService] notifyWelcomeUser error:', error);
      return { success: false, status: 'failed', error: String(error) };
    }
  }

  /** Password reset — notifies affected user */
  static async notifyPasswordReset(params: {
    to: string;
    name: string;
    role: string;
    loginEmail: string;
    password?: string;
    schoolId?: string;
    recipientUserId?: string;
  }): Promise<NotifyResult> {
    try {
      const school = params.schoolId ? await prisma.school.findUnique({ where: { id: params.schoolId } }) : null;
      const template = passwordResetTemplate({
        name: params.name,
        role: params.role,
        loginEmail: params.loginEmail,
        password: params.password,
        schoolName: school?.name,
      });

      return await EmailService.sendEmail({
        to: params.to,
        subject: template.subject,
        html: template.html,
        text: template.text,
        eventType: 'password_reset',
        schoolId: params.schoolId || null,
        recipientUserId: params.recipientUserId || null,
        recipientRole: params.role,
        metadata: { userId: params.recipientUserId || null },
      });
    } catch (error) {
      console.error('[NotificationService] notifyPasswordReset error:', error);
      return { success: false, status: 'failed', error: String(error) };
    }
  }

  // ── Real Methods (Phase 2.6D) ──────────────────────────

  /** Notice published — notifies target audience */
  static async notifyNoticePublished(notice: any): Promise<NotifyResult> {
    try {
      const school = notice.schoolId ? await prisma.school.findUnique({ where: { id: notice.schoolId } }) : null;
      const schoolName = school?.name || 'School ERP';
      
      const roles = notice.targetRoles ? notice.targetRoles.split(',').map((r: string) => r.trim()).filter(Boolean) : [];
      
      const whereClause: any = {
        schoolId: notice.schoolId,
        isActive: true,
      };
      
      if (roles.length > 0 && !roles.includes('all')) {
        whereClause.role = { in: roles };
      }
      
      const users = await prisma.user.findMany({
        where: whereClause,
        select: { id: true, email: true, name: true, role: true }
      });
      
      const template = noticePublishedTemplate({
        title: notice.title,
        content: notice.content,
        priority: notice.priority || 'normal',
        publishDate: notice.publishDate ? new Date(notice.publishDate).toLocaleDateString() : new Date().toLocaleDateString(),
        schoolName,
      });

      const batchSize = 10;
      for (let i = 0; i < users.length; i += batchSize) {
        const batch = users.slice(i, i + batchSize);
        await Promise.all(
          batch.map(user => 
            EmailService.sendEmail({
              to: user.email,
              subject: template.subject,
              html: template.html,
              text: template.text,
              eventType: 'notice_published',
              schoolId: notice.schoolId,
              recipientUserId: user.id,
              recipientRole: user.role,
              metadata: { noticeId: notice.id }
            }).catch(err => console.error('[NotificationService] Notice email fail:', user.email, err))
          )
        );
      }

      // Safe push notification call
      try {
        PushNotificationService.sendToUsers(
          users.map(u => u.id),
          {
            title: `New Notice: ${notice.title}`,
            body: notice.content.substring(0, 100) + (notice.content.length > 100 ? '...' : ''),
            data: {
              type: 'notice',
              entityId: notice.id,
            },
          }
        ).catch(err => console.error('[NotificationService] Notice push notification failed:', err));
      } catch (pushErr) {
        console.error('[NotificationService] Error triggering notice push:', pushErr);
      }
      
      return { success: true, status: 'sent' };
    } catch (error) {
      console.error('[NotificationService] notifyNoticePublished error:', error);
      return { success: false, status: 'failed', error: String(error) };
    }
  }

  /** Homework assigned — notifies students + parents in class/section */
  static async notifyHomeworkAssigned(homework: any): Promise<NotifyResult> {
    try {
      const cls = await prisma.class.findUnique({ where: { id: homework.classId } });
      const sec = homework.sectionId ? await prisma.section.findUnique({ where: { id: homework.sectionId } }) : null;
      const sub = await prisma.subject.findUnique({ where: { id: homework.subjectId } });
      const school = homework.schoolId ? await prisma.school.findUnique({ where: { id: homework.schoolId } }) : null;
      const schoolName = school?.name || 'School ERP';

      const students = await prisma.student.findMany({
        where: {
          schoolId: homework.schoolId,
          classId: homework.classId,
          sectionId: homework.sectionId || undefined,
          status: 'active'
        },
        include: {
          user: { select: { id: true, email: true, name: true, isActive: true } },
          parent: {
            include: {
              user: { select: { id: true, email: true, name: true, isActive: true } }
            }
          }
        }
      });

      const template = homeworkAssignedTemplate({
        title: homework.title,
        subject: sub?.name || 'Homework',
        className: cls?.name || 'N/A',
        sectionName: sec?.name || undefined,
        dueDate: homework.dueDate ? new Date(homework.dueDate).toLocaleDateString() : 'N/A',
        description: homework.description || '',
        schoolName,
      });

      const recipients: { email: string; name: string; userId: string | null; role: string; studentId: string }[] = [];
      const seenEmails = new Set<string>();

      for (const student of students) {
        if (student.parent?.user) {
          const pUser = student.parent.user;
          if (pUser.isActive && pUser.email && !seenEmails.has(pUser.email)) {
            seenEmails.add(pUser.email);
            recipients.push({
              email: pUser.email,
              name: student.parent.fatherName || student.parent.motherName || 'Parent',
              userId: pUser.id,
              role: 'parent',
              studentId: student.id
            });
          }
        }
        if (student.user) {
          const sUser = student.user;
          if (sUser.isActive && sUser.email && !seenEmails.has(sUser.email)) {
            seenEmails.add(sUser.email);
            recipients.push({
              email: sUser.email,
              name: student.fullName || sUser.name,
              userId: sUser.id,
              role: 'student',
              studentId: student.id
            });
          }
        }
      }

      const batchSize = 10;
      for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);
        await Promise.all(
          batch.map(r => 
            EmailService.sendEmail({
              to: r.email,
              subject: template.subject,
              html: template.html,
              text: template.text,
              eventType: 'homework_assigned',
              schoolId: homework.schoolId,
              recipientUserId: r.userId,
              recipientRole: r.role,
              metadata: { homeworkId: homework.id, studentId: r.studentId }
            }).catch(err => console.error('[NotificationService] Homework email fail:', r.email, err))
          )
        );
      }

      // Safe push notification call
      try {
        const parentUserIds = recipients.filter(r => r.role === 'parent').map(r => r.userId).filter(Boolean) as string[];
        const studentUserIds = recipients.filter(r => r.role === 'student').map(r => r.userId).filter(Boolean) as string[];

        if (parentUserIds.length > 0) {
          PushNotificationService.sendToUsers(parentUserIds, {
            title: `New Homework Assigned`,
            body: `New homework has been assigned for your child in ${sub?.name || 'Homework'}.`,
            data: {
              type: 'homework',
              entityId: homework.id,
            },
          }).catch(err => console.error('[NotificationService] Homework parent push notification failed:', err));
        }

        if (studentUserIds.length > 0) {
          PushNotificationService.sendToUsers(studentUserIds, {
            title: `New Homework Assigned`,
            body: `New homework has been assigned for you in ${sub?.name || 'Homework'}.`,
            data: {
              type: 'homework',
              entityId: homework.id,
            },
          }).catch(err => console.error('[NotificationService] Homework student push notification failed:', err));
        }
      } catch (pushErr) {
        console.error('[NotificationService] Error triggering homework push:', pushErr);
      }
      
      return { success: true, status: 'sent' };
    } catch (error) {
      console.error('[NotificationService] notifyHomeworkAssigned error:', error);
      return { success: false, status: 'failed', error: String(error) };
    }
  }

  /** Exam scheduled — notifies students + parents in class */
  static async notifyExamScheduled(exam: any): Promise<NotifyResult> {
    try {
      const cls = await prisma.class.findUnique({ where: { id: exam.classId } });
      const school = exam.schoolId ? await prisma.school.findUnique({ where: { id: exam.schoolId } }) : null;
      const schoolName = school?.name || 'School ERP';

      const students = await prisma.student.findMany({
        where: {
          schoolId: exam.schoolId,
          classId: exam.classId,
          status: 'active'
        },
        include: {
          user: { select: { id: true, email: true, name: true, isActive: true } },
          parent: {
            include: {
              user: { select: { id: true, email: true, name: true, isActive: true } }
            }
          }
        }
      });

      const template = examScheduledTemplate({
        examName: exam.name,
        examType: exam.type,
        className: cls?.name || 'N/A',
        startDate: exam.startDate ? new Date(exam.startDate).toLocaleDateString() : 'N/A',
        endDate: exam.endDate ? new Date(exam.endDate).toLocaleDateString() : 'N/A',
        schoolName,
      });

      const recipients: { email: string; name: string; userId: string | null; role: string; studentId: string }[] = [];
      const seenEmails = new Set<string>();

      for (const student of students) {
        if (student.parent?.user) {
          const pUser = student.parent.user;
          if (pUser.isActive && pUser.email && !seenEmails.has(pUser.email)) {
            seenEmails.add(pUser.email);
            recipients.push({
              email: pUser.email,
              name: student.parent.fatherName || student.parent.motherName || 'Parent',
              userId: pUser.id,
              role: 'parent',
              studentId: student.id
            });
          }
        }
        if (student.user) {
          const sUser = student.user;
          if (sUser.isActive && sUser.email && !seenEmails.has(sUser.email)) {
            seenEmails.add(sUser.email);
            recipients.push({
              email: sUser.email,
              name: student.fullName || sUser.name,
              userId: sUser.id,
              role: 'student',
              studentId: student.id
            });
          }
        }
      }

      const batchSize = 10;
      for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);
        await Promise.all(
          batch.map(r => 
            EmailService.sendEmail({
              to: r.email,
              subject: template.subject,
              html: template.html,
              text: template.text,
              eventType: 'exam_scheduled',
              schoolId: exam.schoolId,
              recipientUserId: r.userId,
              recipientRole: r.role,
              metadata: { examId: exam.id, studentId: r.studentId }
            }).catch(err => console.error('[NotificationService] Exam scheduled email fail:', r.email, err))
          )
        );
      }

      // Safe push notification call
      try {
        const parentUserIds = recipients.filter(r => r.role === 'parent').map(r => r.userId).filter(Boolean) as string[];
        const studentUserIds = recipients.filter(r => r.role === 'student').map(r => r.userId).filter(Boolean) as string[];

        if (parentUserIds.length > 0) {
          PushNotificationService.sendToUsers(parentUserIds, {
            title: `New Exam Scheduled`,
            body: `A new exam "${exam.name}" has been scheduled for Class ${cls?.name || 'N/A'}.`,
            data: {
              type: 'exam',
              entityId: exam.id,
            },
          }).catch(err => console.error('[NotificationService] Exam parent push notification failed:', err));
        }

        if (studentUserIds.length > 0) {
          PushNotificationService.sendToUsers(studentUserIds, {
            title: `New Exam Scheduled`,
            body: `A new exam "${exam.name}" has been scheduled for your class.`,
            data: {
              type: 'exam',
              entityId: exam.id,
            },
          }).catch(err => console.error('[NotificationService] Exam student push notification failed:', err));
        }
      } catch (pushErr) {
        console.error('[NotificationService] Error triggering exam scheduled push:', pushErr);
      }
      
      return { success: true, status: 'sent' };
    } catch (error) {
      console.error('[NotificationService] notifyExamScheduled error:', error);
      return { success: false, status: 'failed', error: String(error) };
    }
  }

  /** Exam date changed — notifies students + parents in class */
  static async notifyExamDateChanged(oldExam: any, updatedExam: any): Promise<NotifyResult> {
    try {
      const exam = updatedExam;
      const cls = await prisma.class.findUnique({ where: { id: exam.classId } });
      const school = exam.schoolId ? await prisma.school.findUnique({ where: { id: exam.schoolId } }) : null;
      const schoolName = school?.name || 'School ERP';

      const students = await prisma.student.findMany({
        where: {
          schoolId: exam.schoolId,
          classId: exam.classId,
          status: 'active'
        },
        include: {
          user: { select: { id: true, email: true, name: true, isActive: true } },
          parent: {
            include: {
              user: { select: { id: true, email: true, name: true, isActive: true } }
            }
          }
        }
      });

      const template = examDateChangedTemplate({
        examName: exam.name,
        oldStartDate: oldExam.startDate ? new Date(oldExam.startDate).toLocaleDateString() : 'N/A',
        oldEndDate: oldExam.endDate ? new Date(oldExam.endDate).toLocaleDateString() : 'N/A',
        newStartDate: exam.startDate ? new Date(exam.startDate).toLocaleDateString() : 'N/A',
        newEndDate: exam.endDate ? new Date(exam.endDate).toLocaleDateString() : 'N/A',
        className: cls?.name || 'N/A',
        schoolName,
      });

      const recipients: { email: string; name: string; userId: string | null; role: string; studentId: string }[] = [];
      const seenEmails = new Set<string>();

      for (const student of students) {
        if (student.parent?.user) {
          const pUser = student.parent.user;
          if (pUser.isActive && pUser.email && !seenEmails.has(pUser.email)) {
            seenEmails.add(pUser.email);
            recipients.push({
              email: pUser.email,
              name: student.parent.fatherName || student.parent.motherName || 'Parent',
              userId: pUser.id,
              role: 'parent',
              studentId: student.id
            });
          }
        }
        if (student.user) {
          const sUser = student.user;
          if (sUser.isActive && sUser.email && !seenEmails.has(sUser.email)) {
            seenEmails.add(sUser.email);
            recipients.push({
              email: sUser.email,
              name: student.fullName || sUser.name,
              userId: sUser.id,
              role: 'student',
              studentId: student.id
            });
          }
        }
      }

      const batchSize = 10;
      for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);
        await Promise.all(
          batch.map(r => 
            EmailService.sendEmail({
              to: r.email,
              subject: template.subject,
              html: template.html,
              text: template.text,
              eventType: 'exam_date_changed',
              schoolId: exam.schoolId,
              recipientUserId: r.userId,
              recipientRole: r.role,
              metadata: { examId: exam.id, studentId: r.studentId }
            }).catch(err => console.error('[NotificationService] Exam date change email fail:', r.email, err))
          )
        );
      }

      return { success: true, status: 'sent' };
    } catch (error) {
      console.error('[NotificationService] notifyExamDateChanged error:', error);
      return { success: false, status: 'failed', error: String(error) };
    }
  }

  /** Result published — notifies individual students + parents */
  static async notifyResultPublished(data: { examId: string; subjectId: string; results: any[]; schoolId?: string }): Promise<NotifyResult> {
    try {
      const exam = await prisma.exam.findUnique({
        where: { id: data.examId },
        include: { school: true }
      });
      const sub = await prisma.subject.findUnique({ where: { id: data.subjectId } });
      if (!exam || !sub) {
        return { success: false, status: 'failed', error: 'Exam or subject not found' };
      }

      const schoolName = exam.school?.name || 'School ERP';
      const schoolId = exam.schoolId;

      for (const resRecord of data.results) {
        const student = await prisma.student.findUnique({
          where: { id: resRecord.studentId },
          include: {
            user: { select: { id: true, email: true, name: true, isActive: true } },
            parent: {
              include: {
                user: { select: { id: true, email: true, name: true, isActive: true } }
              }
            }
          }
        });

        if (!student || student.status !== 'active') continue;
        if (schoolId && student.schoolId !== schoolId) continue;

        const template = resultPublishedTemplate({
          studentName: student.fullName,
          examName: exam.name,
          subject: sub.name,
          marksObtained: resRecord.marksObtained,
          maxMarks: resRecord.maxMarks,
          grade: resRecord.grade || undefined,
          schoolName
        });

        if (student.parent?.user) {
          const pUser = student.parent.user;
          if (pUser.isActive && pUser.email) {
            await EmailService.sendEmail({
              to: pUser.email,
              subject: template.subject,
              html: template.html,
              text: template.text,
              eventType: 'result_published',
              schoolId,
              recipientUserId: pUser.id,
              recipientRole: 'parent',
              metadata: {
                examId: data.examId,
                subjectId: data.subjectId,
                studentId: student.id,
                resultId: resRecord.id
              }
            }).catch(err => console.error('[NotificationService] Result email fail for parent:', pUser.email, err));
          }
        }

        if (student.user) {
          const sUser = student.user;
          if (sUser.isActive && sUser.email) {
            await EmailService.sendEmail({
              to: sUser.email,
              subject: template.subject,
              html: template.html,
              text: template.text,
              eventType: 'result_published',
              schoolId,
              recipientUserId: sUser.id,
              recipientRole: 'student',
              metadata: {
                examId: data.examId,
                subjectId: data.subjectId,
                studentId: student.id,
                resultId: resRecord.id
              }
            }).catch(err => console.error('[NotificationService] Result email fail for student:', sUser.email, err));
          }
        }

        // Safe push notification call
        try {
          if (student.parent?.user?.id) {
            PushNotificationService.sendToUser(student.parent.user.id, {
              title: `Exam Result Published`,
              body: `Result for ${student.fullName} in ${sub.name} is published. Marks: ${resRecord.marksObtained}/${resRecord.maxMarks}`,
              data: {
                type: 'result',
                entityId: exam.id,
                studentId: student.id,
              },
            }).catch(err => console.error('[NotificationService] Result parent push notification failed:', err));
          }

          if (student.user?.id) {
            PushNotificationService.sendToUser(student.user.id, {
              title: `Exam Result Published`,
              body: `Your result in ${sub.name} is published. Marks: ${resRecord.marksObtained}/${resRecord.maxMarks}`,
              data: {
                type: 'result',
                entityId: exam.id,
                studentId: student.id,
              },
            }).catch(err => console.error('[NotificationService] Result student push notification failed:', err));
          }
        } catch (pushErr) {
          console.error('[NotificationService] Error triggering result push:', pushErr);
        }
      }

      return { success: true, status: 'sent' };
    } catch (error) {
      console.error('[NotificationService] notifyResultPublished error:', error);
      return { success: false, status: 'failed', error: String(error) };
    }
  }

  // ── Real Methods (Phase 2.6E) ──────────────────────────

  /** Fee payment receipt — notifies student + parent */
  static async notifyFeePaymentReceipt(payment: any): Promise<NotifyResult> {
    try {
      if (!payment || !payment.id) {
        return { success: false, status: 'failed', error: 'Invalid payment data provided' };
      }

      // Fetch or populate the full payment details
      const fullPayment = await prisma.feePayment.findUnique({
        where: { id: payment.id },
        include: {
          student: {
            include: {
              user: { select: { id: true, email: true, name: true, isActive: true } },
              parent: {
                include: {
                  user: { select: { id: true, email: true, name: true, isActive: true } }
                }
              }
            }
          },
          allocations: true,
          school: { select: { name: true } }
        }
      });

      if (!fullPayment) {
        return { success: false, status: 'failed', error: `Payment with ID ${payment.id} not found` };
      }

      const student = fullPayment.student;
      if (!student) {
        return { success: false, status: 'failed', error: 'Student record not found for payment' };
      }

      // Ensure payment.schoolId matches student.schoolId
      if (fullPayment.schoolId !== student.schoolId) {
        console.warn(`[NotificationService] notifyFeePaymentReceipt skipped: school ID mismatch. Payment schoolId: ${fullPayment.schoolId}, Student schoolId: ${student.schoolId}`);
        return { success: true, status: 'skipped', error: 'School ID mismatch' };
      }

      // Get outstanding balance using existing ledger logic if safe
      let totalOutstanding: number | undefined;
      try {
        const ledger = await FeeService.getStudentLedger(student.id);
        totalOutstanding = ledger?.balanceDue;
      } catch (ledgerError) {
        console.error('[NotificationService] Failed to calculate outstanding balance:', ledgerError);
      }

      const schoolName = fullPayment.school?.name || 'School ERP';

      // Map component allocations
      const componentAllocations = fullPayment.allocations?.map(alloc => ({
        componentName: alloc.componentName,
        amount: alloc.allocatedAmount
      })) || [];

      const template = feePaymentReceiptTemplate({
        studentName: student.fullName,
        receiptNumber: fullPayment.receiptNumber,
        amountPaid: fullPayment.amountPaid,
        paymentMode: fullPayment.paymentMode,
        paymentDate: fullPayment.paymentDate ? new Date(fullPayment.paymentDate).toLocaleDateString() : new Date().toLocaleDateString(),
        schoolName,
        componentAllocations,
        totalOutstanding
      });

      const metadata = {
        paymentId: fullPayment.id,
        receiptNumber: fullPayment.receiptNumber,
        studentId: student.id,
        schoolId: fullPayment.schoolId
      };

      let parentResult: NotifyResult | null = null;

      // 1. Parent email first
      const parentUser = student.parent?.user;
      if (parentUser) {
        parentResult = await EmailService.sendEmail({
          to: parentUser.email,
          subject: template.subject,
          html: template.html,
          text: template.text,
          eventType: 'fee_payment_receipt',
          schoolId: fullPayment.schoolId,
          recipientUserId: parentUser.id,
          recipientRole: 'parent',
          metadata
        });
      } else {
        // Log skipped/missing parent email
        await EmailService.sendEmail({
          to: '(empty)',
          subject: template.subject,
          html: template.html,
          text: template.text,
          eventType: 'fee_payment_receipt',
          schoolId: fullPayment.schoolId,
          recipientUserId: student.parent?.userId || null,
          recipientRole: 'parent',
          metadata
        });
      }

      // 2. Student email only if real
      const studentUser = student.user;
      if (studentUser) {
        if (studentUser.email && isRealEmail(studentUser.email)) {
          await EmailService.sendEmail({
            to: studentUser.email,
            subject: template.subject,
            html: template.html,
            text: template.text,
            eventType: 'fee_payment_receipt',
            schoolId: fullPayment.schoolId,
            recipientUserId: studentUser.id,
            recipientRole: 'student',
            metadata
          });
        } else {
          // Log skipped synthetic student email
          await EmailService.sendEmail({
            to: studentUser.email || '(empty)',
            subject: template.subject,
            html: template.html,
            text: template.text,
            eventType: 'fee_payment_receipt',
            schoolId: fullPayment.schoolId,
            recipientUserId: studentUser.id,
            recipientRole: 'student',
            metadata
          });
        }
      }

      // Safe push notification call
      try {
        if (student.parent?.user?.id) {
          PushNotificationService.sendToUser(student.parent.user.id, {
            title: `Fee Payment Successful`,
            body: `Receipt ${fullPayment.receiptNumber} generated for amount ₹${fullPayment.amountPaid}. Outstanding balance: ₹${totalOutstanding ?? 0}`,
            data: {
              type: 'fee_receipt',
              entityId: fullPayment.id,
              studentId: student.id,
            },
          }).catch(err => console.error('[NotificationService] Fee parent push notification failed:', err));
        }

        if (student.user?.id) {
          PushNotificationService.sendToUser(student.user.id, {
            title: `Fee Payment Successful`,
            body: `Receipt ${fullPayment.receiptNumber} generated for amount ₹${fullPayment.amountPaid}.`,
            data: {
              type: 'fee_receipt',
              entityId: fullPayment.id,
              studentId: student.id,
            },
          }).catch(err => console.error('[NotificationService] Fee student push notification failed:', err));
        }
      } catch (pushErr) {
        console.error('[NotificationService] Error triggering fee push:', pushErr);
      }
      
      return parentResult || { success: true, status: 'sent' };
    } catch (error) {
      console.error('[NotificationService] notifyFeePaymentReceipt error:', error);
      return { success: false, status: 'failed', error: String(error) };
    }
  }

  /** Attendance absent alert — notifies parent */
  static async notifyAttendanceAbsent(absentRecords: any[]): Promise<NotifyResult> {
    try {
      if (!absentRecords) {
        return { success: true, status: 'skipped', error: 'No absent records to process' };
      }

      const records = Array.isArray(absentRecords) ? absentRecords : [absentRecords];
      if (records.length === 0) {
        return { success: true, status: 'skipped', error: 'No absent records to process' };
      }

      for (const record of records) {
        try {
          const student = await prisma.student.findUnique({
            where: { id: record.studentId },
            include: {
              class: { select: { id: true, name: true } },
              section: { select: { id: true, name: true } },
              school: { select: { id: true, name: true } },
              parent: {
                include: {
                  user: { select: { id: true, email: true, name: true, isActive: true } }
                }
              }
            }
          });

          if (!student) {
            console.warn(`[NotificationService] notifyAttendanceAbsent: Student with ID ${record.studentId} not found`);
            continue;
          }

          // Format date normalized as YYYY-MM-DD
          const dateObj = new Date(record.date);
          const attendanceDate = dateObj.toISOString().split('T')[0];

          const parentName = student.parent ? (student.parent.fatherName || student.parent.motherName || 'Parent') : 'Parent';
          const parentUser = student.parent?.user;
          const parentEmail = parentUser?.email;

          const schoolName = student.school?.name || 'School ERP';

          const template = attendanceAbsentAlertTemplate({
            parentName,
            studentName: student.fullName,
            date: new Date(record.date).toLocaleDateString(),
            className: student.class.name,
            sectionName: student.section?.name || undefined,
            schoolName
          });

          const metadata = {
            attendanceId: record.id || null,
            studentId: student.id,
            attendanceDate,
            classId: student.classId,
            sectionId: student.sectionId,
            schoolId: student.schoolId
          };

          // Send to parent only. Skip/log if synthetic or missing.
          if (parentUser && parentEmail && isRealEmail(parentEmail)) {
            await EmailService.sendEmail({
              to: parentEmail,
              subject: template.subject,
              html: template.html,
              text: template.text,
              eventType: 'attendance_absent_alert',
              schoolId: student.schoolId,
              recipientUserId: parentUser.id,
              recipientRole: 'parent',
              metadata
            });
          } else {
            // Log skipped synthetic/missing parent email
            await EmailService.sendEmail({
              to: parentEmail || '(empty)',
              subject: template.subject,
              html: template.html,
              text: template.text,
              eventType: 'attendance_absent_alert',
              schoolId: student.schoolId,
              recipientUserId: student.parent?.userId || null,
              recipientRole: 'parent',
              metadata
            });
          }

          // Safe push notification call
          try {
            if (student.parent?.user?.id) {
              PushNotificationService.sendToUser(student.parent.user.id, {
                title: `Attendance Alert: Absent`,
                body: `${student.fullName} has been marked absent today (${new Date(record.date).toLocaleDateString()}).`,
                data: {
                  type: 'attendance_absent',
                  entityId: record.id || '',
                  studentId: student.id,
                },
              }).catch(err => console.error('[NotificationService] Attendance parent push notification failed:', err));
            }
          } catch (pushErr) {
            console.error('[NotificationService] Error triggering attendance push:', pushErr);
          }
        } catch (singleError) {
          console.error(`[NotificationService] Failed to process absent attendance alert for student ${record.studentId}:`, singleError);
        }
      }

      return { success: true, status: 'sent' };
    } catch (error) {
      console.error('[NotificationService] notifyAttendanceAbsent error:', error);
      return { success: false, status: 'failed', error: String(error) };
    }
  }
}
