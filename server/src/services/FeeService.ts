import prisma from '../config/prisma';
import { createError } from '../middleware/errorHandler';

export class FeeService {
  static async getStudentLedger(studentId: string) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { class: true }
    });
    if (!student) throw createError('Student not found', 404);

    // Get ALL fee assignments for this student (promotion wipes old ones, so these are always current)
    const assignedFees = await prisma.studentFee.findMany({
      where: { studentId },
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
          OR: [
            { classId: student.classId },
            { classId: null }
          ],
          isActive: true 
        },
      });
      totalFee = activeStructures.reduce((sum: number, s: any) => sum + (s.totalAmount || 0), 0);
    }

    if (activeStructures.length === 0) {
      return { totalFee: 0, paidAmount: 0, balanceDue: 0, payments: [], structures: [] };
    }

    // Get ALL payments for this student
    const payments = await prisma.feePayment.findMany({ 
      where: { studentId },
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
    const academicYear = await prisma.academicYear.findFirst({ where: { isCurrent: true } });
    if (!academicYear) throw createError('No active academic year', 400);

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

    // Get the latest receipt number and increment from it
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
        academicYearId: academicYear.id
      }
    });
  }
}
