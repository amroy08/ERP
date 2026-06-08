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
import { EmailService, SendEmailResult } from './EmailService';
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
      }

      return { success: true, status: 'sent' };
    } catch (error) {
      console.error('[NotificationService] notifyResultPublished error:', error);
      return { success: false, status: 'failed', error: String(error) };
    }
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
