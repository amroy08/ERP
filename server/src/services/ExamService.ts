import prisma from '../config/prisma';
import { createError } from '../middleware/errorHandler';

export class ExamService {
  static async submitResults(data: any) {
    const exam = await prisma.exam.findUnique({
      where: { id: data.examId }
    });
    if (!exam) throw createError('Exam not found', 404);

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
            remark: res.remark || ''
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
