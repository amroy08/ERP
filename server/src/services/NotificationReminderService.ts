import prisma from '../config/prisma';
import { NotificationService } from './NotificationService';
import { NotificationType } from '@prisma/client';

export class NotificationReminderService {
  /**
   * Scan pending, partial, and overdue fees and create reminders if allowed by rules.
   */
  static async runFeeReminderScan() {
    let scanned = 0;
    let eligible = 0;
    let created = 0;
    let skippedPaid = 0;
    let skippedCooldown = 0;
    let skippedNoParent = 0;
    let errors = 0;

    try {
      const pendingFees = await prisma.studentFee.findMany({
        where: {
          status: {
            in: ['pending', 'partial', 'overdue'],
          },
        },
        include: {
          student: {
            include: {
              parent: {
                include: {
                  user: {
                    select: {
                      id: true,
                      email: true,
                      name: true,
                      isActive: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      for (const fee of pendingFees) {
        scanned++;

        if (fee.status === 'paid' || fee.status === 'completed') {
          skippedPaid++;
          continue;
        }

        const parentUser = fee.student.parent?.user;
        if (!parentUser || !parentUser.id || !parentUser.isActive) {
          skippedNoParent++;
          continue;
        }

        eligible++;

        try {
          // Check rules/cooldown before invoking notification trigger to ensure counts are precise
          const allowed = await NotificationService.shouldSendReminder({
            schoolId: fee.schoolId || '',
            type: 'FEES_REMINDER',
            recipientUserId: parentUser.id,
            studentId: fee.studentId,
            relatedEntityId: fee.id,
          });

          if (!allowed) {
            skippedCooldown++;
            continue;
          }

          const result = await NotificationService.notifyFeeReminderIfAllowed(fee.id);

          if (result.success && result.status === 'sent') {
            created++;
          } else if (result.success && result.status === 'skipped') {
            if (result.error && result.error.toLowerCase().includes('cooldown')) {
              skippedCooldown++;
            } else if (result.error && result.error.toLowerCase().includes('paid')) {
              skippedPaid++;
              eligible--;
            } else if (result.error && result.error.toLowerCase().includes('parent')) {
              skippedNoParent++;
              eligible--;
            } else {
              errors++;
            }
          } else {
            errors++;
          }
        } catch (singleErr) {
          console.error(`[NotificationReminderService] Error in runFeeReminderScan for fee ID ${fee.id}:`, singleErr);
          errors++;
        }
      }
    } catch (err) {
      console.error('[NotificationReminderService] runFeeReminderScan failed:', err);
      errors++;
    }

    return {
      scanned,
      eligible,
      created,
      skippedPaid,
      skippedCooldown,
      skippedNoParent,
      errors,
    };
  }

  /**
   * Scan students with repeated absences crossing configured threshold and create notifications.
   */
  static async runAbsenceReminderScan() {
    let scanned = 0;
    let thresholdMet = 0;
    let created = 0;
    let skippedCooldown = 0;
    let skippedNoParent = 0;
    let errors = 0;

    try {
      const students = await prisma.student.findMany({
        where: {
          status: 'active',
        },
        include: {
          parent: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                  isActive: true,
                },
              },
            },
          },
        },
      });

      for (const student of students) {
        scanned++;

        try {
          const rule = await prisma.notificationRule.findUnique({
            where: {
              schoolId_type: {
                schoolId: student.schoolId || '',
                type: 'ATTENDANCE_ABSENCE_ALERT',
              },
            },
          });

          if (rule && !rule.enabled) {
            continue;
          }

          const thresholdCount = rule?.thresholdCount ?? 3;
          const thresholdDays = rule?.thresholdDays ?? 7;

          const endDate = new Date();
          endDate.setUTCHours(23, 59, 59, 999);

          const startDate = new Date();
          startDate.setDate(startDate.getDate() - thresholdDays + 1);
          startDate.setUTCHours(0, 0, 0, 0);

          const absences = await prisma.attendance.findMany({
            where: {
              studentId: student.id,
              status: 'absent',
              date: {
                gte: startDate,
                lte: endDate,
              },
            },
            orderBy: {
              date: 'desc',
            },
          });

          if (absences.length < thresholdCount) {
            continue;
          }

          thresholdMet++;

          const parentUser = student.parent?.user;
          if (!parentUser || !parentUser.id || !parentUser.isActive) {
            skippedNoParent++;
            continue;
          }

          // Check cooldown
          const allowed = await NotificationService.shouldSendReminder({
            schoolId: student.schoolId || '',
            type: 'ATTENDANCE_ABSENCE_ALERT',
            recipientUserId: parentUser.id,
            studentId: student.id,
            relatedEntityId: null,
          });

          if (!allowed) {
            skippedCooldown++;
            continue;
          }

          // Trigger the absence notification sending logic
          const result = await NotificationService.notifyAttendanceAbsent([absences[0]]);
          if (result.success && result.status === 'sent') {
            created++;
          } else {
            errors++;
          }
        } catch (singleErr) {
          console.error(`[NotificationReminderService] Error in runAbsenceReminderScan for student ID ${student.id}:`, singleErr);
          errors++;
        }
      }
    } catch (err) {
      console.error('[NotificationReminderService] runAbsenceReminderScan failed:', err);
      errors++;
    }

    return {
      scanned,
      thresholdMet,
      created,
      skippedCooldown,
      skippedNoParent,
      errors,
    };
  }

  /**
   * Run all reminder scans.
   */
  static async runAllReminderScans() {
    const feeResult = await this.runFeeReminderScan();
    const absenceResult = await this.runAbsenceReminderScan();
    return {
      feeReminderScan: feeResult,
      absenceReminderScan: absenceResult,
    };
  }

  /**
   * Retrieve rules for notifications.
   */
  static async getReminderRules(schoolId?: string) {
    const where: any = {
      type: {
        in: ['FEES_REMINDER', 'ATTENDANCE_ABSENCE_ALERT'],
      },
    };
    if (schoolId) {
      where.schoolId = schoolId;
    }
    return await prisma.notificationRule.findMany({ where });
  }
}
