import prisma from '../config/prisma';
import { createError } from '../middleware/errorHandler';
import { requireValidMarks } from '../utils/validate';

export class ExamService {
  static async submitResults(data: any, schoolId?: string) {
    const exam = await prisma.exam.findUnique({
      where: { id: data.examId }
    });
    if (!exam) throw createError('Exam not found', 404);

    // School scope check
    if (schoolId && exam.schoolId && exam.schoolId !== schoolId) {
      throw createError('Access denied. This exam does not belong to your school.', 403);
    }

    // Pre-validate all results before starting the transaction
    for (const res of data.results) {
      const maxMarks = parseInt(res.maxMarks || data.maxMarks, 10) || 100;
      const marksErr = requireValidMarks(res.marksObtained, maxMarks);
      if (marksErr) {
        throw createError(`Marks validation failed for student ${res.studentId}: ${marksErr.message}`, 400);
      }
    }

    const results = await prisma.$transaction(
      data.results.map((res: any) => {
        // Defensive input cleaning
        const marksObtained = isNaN(parseInt(res.marksObtained)) ? 0 : parseInt(res.marksObtained);
        const maxMarks = isNaN(parseInt(res.maxMarks || data.maxMarks)) ? 100 : parseInt(res.maxMarks || data.maxMarks);
        
        return prisma.result.upsert({
          where: {
            examId_studentId_subjectId: {
              examId: data.examId,
              studentId: res.studentId,
              subjectId: data.subjectId
            }
          },
          update: {
            marksObtained: marksObtained,
            maxMarks: maxMarks,
            grade: res.grade,
            remark: res.remark || ''
          },
          create: {
            examId: data.examId,
            studentId: res.studentId,
            subjectId: data.subjectId,
            marksObtained: marksObtained,
            maxMarks: maxMarks,
            grade: res.grade,
            remark: res.remark || '',
            schoolId: schoolId || exam.schoolId
          }
        });
      })
    );

    return results;
  }

  static async getStudentReportCard(studentId: string) {
    const results = await prisma.result.findMany({
      where: { studentId },
      include: {
        exam: { select: { name: true, type: true } },
        subject: { select: { name: true, code: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return results;
  }
}
