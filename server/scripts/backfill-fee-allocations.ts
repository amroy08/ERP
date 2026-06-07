/**
 * scripts/backfill-fee-allocations.ts
 *
 * Phase 2.4 — Data Backfill for flat payments
 *
 * Scans all historical FeePayment records in chronological order and
 * allocates their amountPaid values to outstanding components using FIFO.
 * Safe to run multiple times (idempotent).
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface FeeComponent {
  category: string;
  name: string;
  amount: number;
  frequency: string;
}

async function main() {
  console.log('🔄 Starting fee payment allocations backfill...');

  // 1. Fetch all payments ordered chronologically
  const payments = await prisma.feePayment.findMany({
    orderBy: { paymentDate: 'asc' },
    include: { allocations: true }
  });

  console.log(`🔍 Found ${payments.length} fee payments to process.`);

  let processedCount = 0;
  let skippedCount = 0;

  for (const payment of payments) {
    // Check if the payment already has allocations (idempotency guard)
    if (payment.allocations.length > 0) {
      skippedCount++;
      continue;
    }

    console.log(`📦 Processing payment ${payment.receiptNumber} (Amount: ₹${payment.amountPaid}) for student ${payment.studentId}`);

    // Resolve academicYearId (fallback to student's current if payment is null)
    let academicYearId = payment.academicYearId;
    if (!academicYearId) {
      const student = await prisma.student.findUnique({
        where: { id: payment.studentId },
        select: { academicYearId: true }
      });
      academicYearId = student?.academicYearId || null;
    }

    if (!academicYearId) {
      console.warn(`⚠️ Skipped payment ${payment.receiptNumber}: could not resolve academic year.`);
      continue;
    }

    // Get student fee assignments for this academic year
    const assignedFees = await prisma.studentFee.findMany({
      where: {
        studentId: payment.studentId,
        academicYearId: academicYearId
      },
      include: { feeStructure: true }
    });

    if (assignedFees.length === 0) {
      console.warn(`⚠️ Warning: Student has no assigned fees for academic year ${academicYearId}. Cannot allocate.`);
      continue;
    }

    // Compile all components for the assigned fees
    const componentsList: { studentFeeId: string; category: string; name: string; amount: number }[] = [];
    for (const af of assignedFees) {
      const parsedComponents = af.feeStructure.components as unknown as FeeComponent[] | null;
      if (parsedComponents && Array.isArray(parsedComponents) && parsedComponents.length > 0) {
        for (const comp of parsedComponents) {
          componentsList.push({
            studentFeeId: af.id,
            category: comp.category || 'miscellaneous',
            name: comp.name,
            amount: comp.amount
          });
        }
      } else {
        // Fallback: treat structure as single component
        componentsList.push({
          studentFeeId: af.id,
          category: 'miscellaneous',
          name: af.feeStructure.name,
          amount: af.customAmount ?? af.feeStructure.totalAmount
        });
      }
    }

    // Distribute amountPaid across components using FIFO
    let remainingToAllocate = payment.amountPaid;

    for (const comp of componentsList) {
      if (remainingToAllocate <= 0) break;

      // Query total allocated so far to this specific component
      const allocations = await (prisma as any).feePaymentAllocation.findMany({
        where: {
          studentFeeId: comp.studentFeeId,
          componentName: comp.name,
          studentId: payment.studentId
        }
      });

      const totalAllocatedSoFar = allocations.reduce((sum: number, a: any) => sum + a.allocatedAmount, 0);
      const remainingDue = Math.max(0, comp.amount - totalAllocatedSoFar);

      if (remainingDue <= 0) {
        // Already fully paid by previous transactions
        continue;
      }

      const allocationAmount = Math.min(remainingToAllocate, remainingDue);

      // Create allocation record
      await (prisma as any).feePaymentAllocation.create({
        data: {
          paymentId: payment.id,
          studentFeeId: comp.studentFeeId,
          componentName: comp.name,
          allocatedAmount: allocationAmount,
          studentId: payment.studentId,
          schoolId: payment.schoolId!
        }
      });

      remainingToAllocate -= allocationAmount;
    }

    if (remainingToAllocate > 0) {
      console.warn(`⚠️ Alert: Payment ${payment.receiptNumber} has ₹${remainingToAllocate} unallocated excess (overpayment/mismatch).`);
    }

    processedCount++;
  }

  console.log(`\n🎉 Backfill complete!`);
  console.log(`📊 Processed: ${processedCount} payments`);
  console.log(`📊 Skipped (already allocated): ${skippedCount} payments`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
