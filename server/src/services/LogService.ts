import prisma from '../config/prisma';

/**
 * Creates an activity log entry for a student.
 * @param studentId UUID of the student
 * @param action Action type (e.g., ADMISSION, PROMOTION, FEE_PAID)
 * @param description Detailed description of the action
 * @param performedBy Name of the user who performed the action
 */
export const createLog = async (
  studentId: string, 
  action: string, 
  description?: string, 
  performedBy?: string
) => {
  try {
    await prisma.activityLog.create({
      data: {
        studentId,
        action: action.toUpperCase(),
        description,
        performedBy
      }
    });
  } catch (error) {
    console.error('Failed to create activity log:', error);
  }
};
