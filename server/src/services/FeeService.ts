import { Prisma } from '@prisma/client';
import prisma from '../config/prisma';
import { createError } from '../middleware/errorHandler';

// Maximum number of times we will retry receipt number generation on a
// unique-constraint collision before giving up (P2002 race window).
const MAX_RECEIPT_RETRIES = 10;

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

  /**
   * Generate the next candidate receipt number for a given year, based on the
   * current highest sequence in the database.
   *
   * This is called once *before* each attempt and again on retry (with offset).
   * The offset lets us skip ahead quickly when we know a collision just happened.
   */
  private static async nextReceiptCandidate(year: number, offset = 0): Promise<string> {
    const lastPayment = await prisma.feePayment.findFirst({
      where: { receiptNumber: { startsWith: `RCP-${year}-` } },
      orderBy: { receiptNumber: 'desc' },
      select: { receiptNumber: true }
    });

    let nextNum = 1 + offset;
    if (lastPayment?.receiptNumber) {
      const parts = lastPayment.receiptNumber.split('-');
      const lastNum = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastNum)) nextNum = lastNum + 1 + offset;
    }
    return `RCP-${year}-${String(nextNum).padStart(5, '0')}`;
  }

  static async recordPayment(data: any & { collectedBy: string }) {
    // ── Safety check 1: amount ────────────────────────────────────────────────
    const amountPaid = parseFloat(data.amountPaid);
    if (isNaN(amountPaid) || amountPaid <= 0) {
      throw createError('Invalid payment amount. Amount must be greater than zero.', 400);
    }

    // ── Safety check 2: student must exist ───────────────────────────────────
    const student = await prisma.student.findUnique({
      where: { id: data.studentId },
      select: { schoolId: true, academicYearId: true }
    });
    if (!student) throw createError('Student record not found', 404);

    // ── Safety check 3: resolve active academic year ──────────────────────────
    const academicYear = await prisma.academicYear.findFirst({
      where: { isCurrent: true, schoolId: student.schoolId }
    });
    const paymentAcademicYearId = student.academicYearId || academicYear?.id;
    if (!paymentAcademicYearId) throw createError('No active academic year found for this student.', 400);

    // ── Safety check 4: optional fee structure validation ────────────────────
    if (data.feeStructureId) {
      const structure = await prisma.feeStructure.findUnique({ where: { id: data.feeStructureId } });
      if (!structure) throw createError('Fee structure not found', 404);
    }

    // ── Safety check 5: validate against outstanding balance ─────────────────
    const ledger = await this.getStudentLedger(data.studentId);
    if (amountPaid > ledger.balanceDue) {
      throw createError(
        `Overpayment detected. Remaining balance is Rs.${ledger.balanceDue.toLocaleString()}.`,
        400
      );
    }

    // ── Receipt generation: concurrency-safe retry loop ───────────────────────
    //
    // Strategy (Option A — transaction + retry on unique conflict):
    //   1. Read the current highest receipt number for this year.
    //   2. Compute the next candidate number (year-scoped for clean numbering).
    //   3. Attempt to create the payment record inside a Prisma transaction.
    //   4. If the DB throws P2002 (unique constraint on receiptNumber), another
    //      concurrent request won the race.  Re-read and retry with offset +1.
    //   5. Repeat up to MAX_RECEIPT_RETRIES times before surfacing an error.
    //
    // The @unique constraint on FeePayment.receiptNumber already exists in the
    // schema, so the DB is the authoritative guard. No schema change is needed.
    //
    // Note: full serialisability is NOT required here — we only need receipt
    // uniqueness, which the DB unique index guarantees.  The retry loop handles
    // the rare window where two requests read the same "last" number before
    // either writes.

    const year = new Date().getFullYear();
    let lastError: unknown;

    for (let attempt = 0; attempt < MAX_RECEIPT_RETRIES; attempt++) {
      try {
        const receiptNumber = await this.nextReceiptCandidate(year, attempt);

        const payment = await prisma.$transaction(async (tx) => {
          return tx.feePayment.create({
            data: {
              amountPaid,
              studentId: data.studentId,
              paymentMode: data.paymentMode || 'cash',
              receiptNumber,
              remarks: data.remarks || '',
              status: 'completed',
              academicYearId: paymentAcademicYearId,
              // Always inherit schoolId from the student record, never from caller
              schoolId: student.schoolId
            }
          });
        });

        return payment; // success — exit retry loop
      } catch (err: unknown) {
        // P2002 = Prisma unique constraint violation — receipt number collision
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2002'
        ) {
          lastError = err;
          // Slight random jitter (0–20 ms) to spread retries from competing workers
          await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 20)));
          continue; // retry with next candidate
        }
        throw err; // unrelated DB error — propagate immediately
      }
    }

    // All retries exhausted — very unlikely under normal load, but surface clearly
    console.error(`[FeeService] Receipt number generation failed after ${MAX_RECEIPT_RETRIES} attempts.`, lastError);
    throw createError(
      'Payment could not be processed: receipt number generation failed due to high concurrency. Please try again.',
      503
    );
  }
}
