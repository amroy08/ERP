import prisma from '../config/prisma';
import { createError } from '../middleware/errorHandler';

export class FeeService {
  static async getStudentLedger(studentId: string) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { class: true }
    });
    if (!student) throw createError('Student not found', 404);

    // Get fee assignments for this student in their current academic year
    const assignedFees = await prisma.studentFee.findMany({
      where: { 
        studentId,
        academicYearId: student.academicYearId 
      },
      include: { feeStructure: true }
    });

    let totalFee = 0;
    let activeStructures: any[] = [];

    if (assignedFees.length > 0) {
      activeStructures = assignedFees.map(af => ({
        ...af.feeStructure,
        _studentFeeId: af.id, // Frontend needs this for edit/delete
        effectiveAmount: af.customAmount ?? (af.feeStructure as any).totalAmount
      }));
      totalFee = activeStructures.reduce((sum: number, s: any) => sum + (s.effectiveAmount || 0), 0);
    } else {
      // Fallback to class-wide structures (for students who haven't been promoted yet)
      activeStructures = await (prisma.feeStructure as any).findMany({
        where: { 
          isActive: true,
          AND: [
            { OR: [{ classId: student.classId }, { classId: null }] },
            { OR: [{ academicYearId: student.academicYearId }, { academicYearId: null }] }
          ]
        },
      });
      totalFee = activeStructures.reduce((sum: number, s: any) => sum + (s.totalAmount || 0), 0);
    }

    if (activeStructures.length === 0) {
      return { totalFee: 0, paidAmount: 0, balanceDue: 0, payments: [], structures: [] };
    }

    // Get payments for this student in their current academic year
    const payments = await prisma.feePayment.findMany({ 
      where: { 
        studentId,
        academicYearId: student.academicYearId 
      },
      orderBy: { paymentDate: 'desc' }
    });

    const totalPaid = payments.reduce((sum, p) => sum + p.amountPaid, 0);
    const balanceDue = Math.max(0, totalFee - totalPaid);

    return {
      structures: activeStructures,
      totalFee,
      paidAmount: totalPaid,
      balanceDue,
      payments
    };
  }

  static async recordPayment(data: any & { collectedBy: string }) {
    // Inherit schoolId and academicYearId from student first
    const student = await prisma.student.findUnique({ where: { id: data.studentId }, select: { schoolId: true, academicYearId: true } });
    if (!student) throw createError('Student record not found', 404);

    const academicYear = await prisma.academicYear.findFirst({ where: { isCurrent: true, schoolId: student.schoolId } });
    const paymentAcademicYearId = student.academicYearId || academicYear?.id;
    if (!paymentAcademicYearId) throw createError('No active academic year', 400);

    // Make feeStructure optional
    if (data.feeStructureId) {
      const structure = await prisma.feeStructure.findUnique({ where: { id: data.feeStructureId } });
      if (!structure) throw createError('Fee structure not found', 404);
    }

    const amountPaid = parseFloat(data.amountPaid);
    if (isNaN(amountPaid) || amountPaid <= 0) throw createError('Invalid payment amount', 400);

    // Validate against balance due
    const ledger = await this.getStudentLedger(data.studentId);
    if (amountPaid > ledger.balanceDue) {
      throw createError(`Overpayment detected. Remaining balance is Rs.${ledger.balanceDue.toLocaleString()}.`, 400);
    }

    // TODO [HIGH-07 — Phase 2.2]: This receipt number generation is a TOCTOU race condition.
    // Two concurrent payment requests will both read the same lastPayment and generate the same
    // receipt number (e.g. RCP-2025-00001), causing a unique constraint collision or silent duplicate.
    // Fix: Replace with a ReceiptSequence table using a transactional row-lock (SELECT ... FOR UPDATE via
    // prisma.$queryRaw) before Phase 2.2 goes live. See phase_21_backend_audit_report.md HIGH-07.
    const lastPayment = await prisma.feePayment.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { receiptNumber: true }
    });
    let nextNum = 1;
    if (lastPayment?.receiptNumber) {
      const parts = lastPayment.receiptNumber.split('-');
      const lastNum = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastNum)) nextNum = lastNum + 1;
    }
    const receiptNumber = `RCP-${new Date().getFullYear()}-${String(nextNum).padStart(5, '0')}`;

    return await prisma.feePayment.create({
      data: {
        amountPaid,
        studentId: data.studentId,
        paymentMode: data.paymentMode || 'cash',
        receiptNumber,
        remarks: data.remarks || '',
        status: 'completed',
        academicYearId: paymentAcademicYearId,
        schoolId: student.schoolId
      }
    });

  }
}
