# Phase 3.2G Fees Parity Notes

## Fee Management and Architecture
Fees in Vantage ERP are managed from the Web console by Admin/Clerk roles. The architecture is structured as follows:
- **Fee Structures**: Groups of fee components (e.g. Tuition, Exam, Sports) that define a total amount.
- **Student Fee Assignments**: Link a student with a specific fee structure for an academic year.
- **Payments**: Recorded via the Web console (`collectFee` endpoint) and logged in `FeePayment` records.
- **Allocations**: To avoid calculation ambiguities, payments are allocated to specific student fee structures via the `FeePaymentAllocation` model. This allows for precise partial payment tracking on a per-fee-structure basis.

## Mobile Parent Fee Visibility
Parents view the live outstanding fees for their children through the mobile app.
- **Endpoint**: `/api/mobile/parent/fees` mapped to `getParentFees` in `server/src/controllers/mobileController.ts`.
- **UI Screen**: `ParentFeesScreen` showing Total Outstanding and individual structure cards with Total, Paid, and Due amounts.

---

## Calculations & Bug Fix
During the parity audit, we identified a critical calculation bug in the mobile controller:

### The Bug
Originally, `getParentFees` queried the total payments completed for a student:
```typescript
const payments = await prisma.feePayment.findMany({
  where: { studentId: child.id, status: 'completed' },
  select: { amountPaid: true },
});
const totalPaid = payments.reduce((sum, p) => sum + p.amountPaid, 0);
```
It then iterated through every assigned fee structure and subtracted this global `totalPaid` from *each* structure's total amount:
```typescript
const dueAmount = Math.max(0, totalAmount - totalPaid);
```
This caused a **double-deduction of payments** across separate fee structures, miscalculating outstanding balances.

### The Fix
We updated `getParentFees` to query `feePaymentAllocation` for each individual structure (`StudentFee.id`) and aggregate only the payments allocated directly to it:
```typescript
const allocations = await (prisma as any).feePaymentAllocation.findMany({
  where: { studentFeeId: sf.id },
  select: { allocatedAmount: true },
});
const feePaid = allocations.reduce((sum: number, a: any) => sum + a.allocatedAmount, 0);

const totalAmount = sf.feeStructure.totalAmount ?? 0;
const dueAmount = Math.max(0, totalAmount - feePaid);
```
This aligns the mobile calculations perfectly with the Web console ledger.

## Parity Status
- **Sync**: Instant sync upon pull-to-refresh on the mobile screen.
- **Balance Alignment**: Total outstanding sum matches the individual structures' due sum perfectly.
