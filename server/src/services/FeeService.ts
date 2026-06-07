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

    // Enrich structures with component-level paid/outstanding info
    const enrichedStructures = [];
    for (const s of activeStructures) {
      const studentFeeId = s._studentFeeId;
      let components = s.components as any[];
      const isCustom = s.effectiveAmount !== undefined && s.effectiveAmount !== s.totalAmount;

      if (!components || !Array.isArray(components) || components.length === 0) {
        components = [{
          category: 'miscellaneous',
          name: s.name,
          amount: s.effectiveAmount ?? s.totalAmount,
          frequency: 'annually'
        }];
      } else if (isCustom) {
        const ratio = s.effectiveAmount / s.totalAmount;
        components = components.map(c => ({
          ...c,
          amount: Math.round(c.amount * ratio * 100) / 100
        }));
      }

      const enrichedComponents = [];
      for (const comp of components) {
        let paid = 0;
        if (studentFeeId) {
          const allocations = await (prisma as any).feePaymentAllocation.findMany({
            where: {
              studentFeeId,
              componentName: comp.name,
              studentId
            }
          });
          paid = allocations.reduce((sum: number, a: any) => sum + a.allocatedAmount, 0);
        }
        enrichedComponents.push({
          ...comp,
          paid,
          outstanding: Math.max(0, comp.amount - paid)
        });
      }

      enrichedStructures.push({
        ...s,
        components: enrichedComponents
      });
    }
    activeStructures = enrichedStructures;

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

    // ── Build resolved allocations ──────────────────────────────────────────
    const resolvedAllocations: { studentFeeId: string; componentName: string; amount: number }[] = [];

    // Retrieve all assigned student fees to do validation or FIFO
    const assignedFees = await prisma.studentFee.findMany({
      where: {
        studentId: data.studentId,
        academicYearId: paymentAcademicYearId
      },
      include: { feeStructure: true }
    });

    if (assignedFees.length === 0) {
      throw createError('No fee structures are assigned to this student.', 400);
    }

    // Map each component across all assigned fees to calculate current outstanding
    const componentsList: { studentFeeId: string; category: string; name: string; amount: number; outstanding: number }[] = [];
    for (const af of assignedFees) {
      let comps = af.feeStructure.components as any[];
      const isCustom = af.customAmount !== null && af.customAmount !== undefined;
      const effectiveAmt = af.customAmount ?? af.feeStructure.totalAmount;

      if (!comps || !Array.isArray(comps) || comps.length === 0) {
        comps = [{
          category: 'miscellaneous',
          name: af.feeStructure.name,
          amount: effectiveAmt
        }];
      } else if (isCustom) {
        const ratio = effectiveAmt / af.feeStructure.totalAmount;
        comps = comps.map(c => ({
          ...c,
          amount: Math.round(c.amount * ratio * 100) / 100
        }));
      }

      for (const comp of comps) {
        const allocations = await (prisma as any).feePaymentAllocation.findMany({
          where: {
            studentFeeId: af.id,
            componentName: comp.name,
            studentId: data.studentId
          }
        });
        const paid = allocations.reduce((sum: number, a: any) => sum + a.allocatedAmount, 0);
        const outstanding = Math.max(0, comp.amount - paid);

        componentsList.push({
          studentFeeId: af.id,
          category: comp.category || 'miscellaneous',
          name: comp.name,
          amount: comp.amount,
          outstanding
        });
      }
    }

    if (data.allocations && Array.isArray(data.allocations) && data.allocations.length > 0) {
      // 1. Validate explicitly provided allocations
      const allocationSum = data.allocations.reduce((sum: number, a: any) => sum + parseFloat(a.amount || 0), 0);
      if (Math.abs(allocationSum - amountPaid) > 0.01) {
        throw createError(`Allocation sum (Rs.${allocationSum.toLocaleString()}) must exactly equal payment amount (Rs.${amountPaid.toLocaleString()}).`, 400);
      }

      for (const alloc of data.allocations) {
        const comp = componentsList.find(c => c.studentFeeId === alloc.studentFeeId && c.name === alloc.componentName);
        if (!comp) {
          throw createError(`Invalid allocation: component "${alloc.componentName}" not found on student fee ${alloc.studentFeeId}.`, 400);
        }
        const allocAmt = parseFloat(alloc.amount);
        if (isNaN(allocAmt) || allocAmt <= 0) {
          throw createError(`Invalid allocation amount for component "${alloc.componentName}". Must be greater than zero.`, 400);
        }
        if (allocAmt > comp.outstanding + 0.01) {
          throw createError(`Overpayment on component "${alloc.componentName}": trying to allocate Rs.${allocAmt.toLocaleString()} but only Rs.${comp.outstanding.toLocaleString()} is outstanding.`, 400);
        }

        resolvedAllocations.push({
          studentFeeId: alloc.studentFeeId,
          componentName: alloc.componentName,
          amount: allocAmt
        });
      }
    } else {
      // 2. Fallback to FIFO auto-allocation
      let remainingToAllocate = amountPaid;
      for (const comp of componentsList) {
        if (remainingToAllocate <= 0) break;
        if (comp.outstanding <= 0) continue;

        const allocAmt = Math.min(remainingToAllocate, comp.outstanding);
        resolvedAllocations.push({
          studentFeeId: comp.studentFeeId,
          componentName: comp.name,
          amount: allocAmt
        });
        remainingToAllocate -= allocAmt;
      }

      if (remainingToAllocate > 0.01) {
        throw createError(`Failed to auto-allocate: payment amount exceeds total outstanding balance.`, 400);
      }
    }

    // ── Receipt generation: concurrency-safe retry loop ───────────────────────
    const year = new Date().getFullYear();
    let lastError: unknown;

    for (let attempt = 0; attempt < MAX_RECEIPT_RETRIES; attempt++) {
      try {
        const receiptNumber = await this.nextReceiptCandidate(year, attempt);

        const payment = await prisma.$transaction(async (tx) => {
          const p = await tx.feePayment.create({
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

          // Write allocation records
          for (const alloc of resolvedAllocations) {
            await (tx as any).feePaymentAllocation.create({
              data: {
                paymentId: p.id,
                studentFeeId: alloc.studentFeeId,
                componentName: alloc.componentName,
                allocatedAmount: alloc.amount,
                studentId: data.studentId,
                schoolId: student.schoolId!
              }
            });
          }

          // Update StudentFee status fields affected by this payment
          const affectedFeeIds = Array.from(new Set(resolvedAllocations.map(a => a.studentFeeId)));
          for (const feeId of affectedFeeIds) {
            const allAllocations = await (tx as any).feePaymentAllocation.findMany({
              where: { studentFeeId: feeId }
            });
            const totalAllocated = allAllocations.reduce((sum: number, a: any) => sum + a.allocatedAmount, 0);

            const studentFee = await tx.studentFee.findUnique({
              where: { id: feeId },
              include: { feeStructure: true }
            });

            if (studentFee) {
              const totalAssigned = studentFee.customAmount ?? studentFee.feeStructure.totalAmount;
              let status = 'pending';
              if (totalAllocated >= totalAssigned - 0.01) {
                status = 'completed';
              } else if (totalAllocated > 0.01) {
                status = 'partial';
              }

              await tx.studentFee.update({
                where: { id: feeId },
                data: { status }
              });
            }
          }

          return p;
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
