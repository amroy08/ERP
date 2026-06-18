/**
 * Phase 3.2G: Fees + Notices Web-Mobile Parity and Security Audit Test Script
 * ──────────────────────────────────────────────────────────────────────────
 * Validates role boundaries, IDOR, calculations, audience targeting, and parity.
 * Run with: npx ts-node --transpile-only scripts/test-fees-notices-parity-audit.ts
 */

import http from 'http';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BASE = 'http://localhost:5001/api';

// ─── HTTP Request Helper ──────────────────────────────────────────────────────
async function req(
  method: string,
  path: string,
  body?: object,
  token?: string
): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE + path);
    const options: http.RequestOptions = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };
    const request = http.request(options, (res) => {
      let raw = '';
      res.on('data', (c) => (raw += c));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode ?? 0, data: JSON.parse(raw) });
        } catch {
          resolve({ status: res.statusCode ?? 0, data: raw });
        }
      });
    });
    request.on('error', reject);
    if (body) request.write(JSON.stringify(body));
    request.end();
  });
}

// ─── Login Helper ────────────────────────────────────────────────────────────
async function login(email: string, password: string): Promise<string | null> {
  try {
    const r = await req('POST', '/auth/login', { email, password });
    return r.data?.data?.accessToken ?? r.data?.token ?? null;
  } catch (err) {
    console.error(`Error logging in as ${email}:`, err);
    return null;
  }
}

// ─── Assert Helper ────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(label: string, condition: boolean, detail = '') {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.log(`  ❌ ${label}${detail ? ` (${detail})` : ''}`);
    failed++;
    failures.push(`${label}${detail ? ` — ${detail}` : ''}`);
  }
}

async function runTests() {
  console.log('================================================================');
  console.log(' Phase 3.2G: Fees + Notices Parity and Security Audit');
  console.log('================================================================\n');

  try {
    // 1. Resolve Users and Roles
    console.log('--- 1. Authenticating Roles ---');
    const adminToken = await login('admin@school.com', 'Admin@123');
    assert('Admin Authentication', !!adminToken);

    const teacherToken = await login('teacher@school.com', 'Admin@123');
    assert('Teacher Authentication', !!teacherToken);

    const parentToken = await login('parent@school.com', 'Admin@123');
    assert('Parent Authentication', !!parentToken);

    // Discover Jane Doe's student user to log in
    const janeDoe = await prisma.student.findFirst({
      where: { fullName: 'Jane Doe' },
      include: { user: true }
    });
    if (!janeDoe || !janeDoe.user) {
      throw new Error('Jane Doe student or user record not found in database.');
    }
    const studentUser = janeDoe.user;
    const studentToken = await login(studentUser.email, 'Admin@123');
    assert(`Student Authentication (${studentUser.email})`, !!studentToken);

    if (!adminToken || !teacherToken || !parentToken || !studentToken) {
      throw new Error('Authentication failed for one or more roles.');
    }

    // 2. Discover Parent, Student and Unlinked Student IDs for IDOR Testing
    console.log('\n--- 2. Discovering Target IDs from DB ---');
    const parentRecord = await prisma.parent.findFirst({
      where: { user: { email: 'parent@school.com' } },
      include: { children: true }
    });
    if (!parentRecord || parentRecord.children.length === 0) {
      throw new Error('Parent record or children not found.');
    }
    const linkedChildId = parentRecord.children[0].id;
    console.log(`  ℹ️  Linked Child ID: ${linkedChildId} (${parentRecord.children[0].fullName})`);

    const unlinkedStudent = await prisma.student.findFirst({
      where: { NOT: { parentId: parentRecord.id } }
    });
    if (!unlinkedStudent) {
      throw new Error('Unlinked student record not found.');
    }
    const unlinkedChildId = unlinkedStudent.id;
    console.log(`  ℹ️  Unlinked Student ID (for IDOR): ${unlinkedChildId} (${unlinkedStudent.fullName})`);

    // 3. Web Console RBAC & Security Boundary checks
    console.log('\n--- 3. Testing Web Console Role Restrictions (RBAC) ---');
    
    // Fee Structures structure endpoint checks
    const webFeesAdmin = await req('GET', '/fees/structures', undefined, adminToken);
    assert('Admin access to GET /fees/structures (Allowed)', webFeesAdmin.status === 200, `status: ${webFeesAdmin.status}`);

    const webFeesTeacher = await req('GET', '/fees/structures', undefined, teacherToken);
    assert('Teacher access to GET /fees/structures (Blocked)', webFeesTeacher.status === 403 || webFeesTeacher.status === 401, `status: ${webFeesTeacher.status}`);

    // Parents and Students have FEE_VIEW in ROLE_PERMISSIONS, so they can access /fees/structures.
    // We test them against /fees/collect (which requires FEE_COLLECT / fee:collect, only for Admin/Clerk)
    const webFeesCollectParent = await req('POST', '/fees/collect', {}, parentToken);
    assert('Parent access to POST /fees/collect (Blocked)', webFeesCollectParent.status === 403 || webFeesCollectParent.status === 401, `status: ${webFeesCollectParent.status}`);

    const webFeesCollectStudent = await req('POST', '/fees/collect', {}, studentToken);
    assert('Student access to POST /fees/collect (Blocked)', webFeesCollectStudent.status === 403 || webFeesCollectStudent.status === 401, `status: ${webFeesCollectStudent.status}`);

    // Notices list endpoint checks
    const webNoticesAdmin = await req('GET', '/notices', undefined, adminToken);
    assert('Admin access to GET /notices (Allowed)', webNoticesAdmin.status === 200, `status: ${webNoticesAdmin.status}`);

    // Teachers have NOTICE_VIEW in ROLE_PERMISSIONS, so they can GET /notices.
    // We test them against POST /notices (which requires NOTICE_CREATE, only for Admin/Principal/Clerk)
    const webNoticesCreateTeacher = await req('POST', '/notices', {}, teacherToken);
    assert('Teacher access to POST /notices (Blocked)', webNoticesCreateTeacher.status === 403 || webNoticesCreateTeacher.status === 401, `status: ${webNoticesCreateTeacher.status}`);

    // 4. Mobile App Endpoint Security & Boundaries
    console.log('\n--- 4. Testing Mobile App Endpoint Access Control ---');

    // Parent Fees
    const mobileFeesParent = await req('GET', '/mobile/parent/fees', undefined, parentToken);
    assert('Parent access to GET /mobile/parent/fees (Allowed)', mobileFeesParent.status === 200, `status: ${mobileFeesParent.status}`);

    const mobileFeesTeacher = await req('GET', '/mobile/parent/fees', undefined, teacherToken);
    assert('Teacher access to GET /mobile/parent/fees (Blocked)', mobileFeesTeacher.status === 403, `status: ${mobileFeesTeacher.status}`);

    const mobileFeesStudent = await req('GET', '/mobile/parent/fees', undefined, studentToken);
    assert('Student access to GET /mobile/parent/fees (Blocked)', mobileFeesStudent.status === 403, `status: ${mobileFeesStudent.status}`);

    // Parent Notices
    const mobileNoticesParent = await req('GET', '/mobile/parent/notices', undefined, parentToken);
    assert('Parent access to GET /mobile/parent/notices (Allowed)', mobileNoticesParent.status === 200, `status: ${mobileNoticesParent.status}`);

    const mobileNoticesTeacher = await req('GET', '/mobile/parent/notices', undefined, teacherToken);
    assert('Teacher access to GET /mobile/parent/notices (Blocked)', mobileNoticesTeacher.status === 403, `status: ${mobileNoticesTeacher.status}`);

    // 5. Parent Child Isolation (IDOR Check)
    console.log('\n--- 5. Testing Parent Linked-Child IDOR Boundaries ---');
    const childProfileSuccess = await req('GET', `/mobile/parent/student-profile/${linkedChildId}`, undefined, parentToken);
    assert('Parent viewing linked child profile (Allowed)', childProfileSuccess.status === 200, `status: ${childProfileSuccess.status}`);

    const childProfileIDOR = await req('GET', `/mobile/parent/student-profile/${unlinkedChildId}`, undefined, parentToken);
    assert('Parent viewing unlinked student profile (Blocked)', childProfileIDOR.status === 403, `status: ${childProfileIDOR.status}`);

    // 6. Notices Audience & Role Targeting Sync Parity
    console.log('\n--- 6. Testing Notice Target Audience & Sync Parity ---');
    // We expect the seeded Notice 'Phase 3.2G Notice Sync Check' (targeted to 'parent,student') to:
    // - Appear on Parent's notices list
    // - Not appear on Teacher's notices list
    // - Appear in Student's dashboard notices
    const parentNoticesRes = await req('GET', '/mobile/parent/notices', undefined, parentToken);
    const parentNotices: any[] = parentNoticesRes.data?.data ?? [];
    const hasSyncNoticeParent = parentNotices.some(n => n.title === 'Phase 3.2G Notice Sync Check');
    assert('Targeted notice appears in Parent notices feed', hasSyncNoticeParent, `notices list: ${JSON.stringify(parentNotices.map(n => n.title))}`);

    const teacherNoticesRes = await req('GET', '/mobile/teacher/notices', undefined, teacherToken);
    const teacherNotices: any[] = teacherNoticesRes.data?.data ?? [];
    const hasSyncNoticeTeacher = teacherNotices.some(n => n.title === 'Phase 3.2G Notice Sync Check');
    assert('Parent-targeted notice is filtered out of Teacher notices feed', !hasSyncNoticeTeacher, `notices list: ${JSON.stringify(teacherNotices.map(n => n.title))}`);

    const studentDashboardRes = await req('GET', '/mobile/student/dashboard', undefined, studentToken);
    const studentNotices: any[] = studentDashboardRes.data?.data?.notices ?? [];
    // Student user must be checked if they match the school of the notice
    const hasSyncNoticeStudent = studentNotices.some(n => n.title === 'Phase 3.2G Notice Sync Check');
    assert('Notice targeted to student role appears in Student dashboard', hasSyncNoticeStudent, `notices list: ${JSON.stringify(studentNotices.map(n => n.title))}, student: ${studentUser.email}, schoolId: ${studentUser.schoolId}`);

    // 7. Fee Ledger Calculation & Bug Fix Verification
    console.log('\n--- 7. Verifying Fee Calculation Ledger Parity ---');
    // Ensure getParentFees calculation exactly matches getStudentLedger calculations and there are no double payments deducted.
    // Specifically: totalAmount - paidAmount === dueAmount, and paidAmount matches the sum of allocations.
    const parentFeesData: any[] = mobileFeesParent.data?.data ?? [];
    let calculationsValid = true;
    let detailMsg = '';

    for (const item of parentFeesData) {
      const { totalAmount, paidAmount, dueAmount, feeStructureName } = item;
      const expectedDue = Math.max(0, totalAmount - paidAmount);
      if (dueAmount !== expectedDue) {
        calculationsValid = false;
        detailMsg = `Discrepancy in ${feeStructureName}: total=${totalAmount}, paid=${paidAmount}, due=${dueAmount} (expected ${expectedDue})`;
        break;
      }
    }
    assert('Mobile parent fee calculation matches allocations (Total - Paid === Due)', calculationsValid, detailMsg);

    // Compare with direct DB query using Prisma to verify accuracy
    let dbParityValid = true;
    for (const item of parentFeesData) {
      const studentFee = await prisma.studentFee.findUnique({
        where: { id: item.id },
        include: { feeStructure: true }
      });
      if (!studentFee) continue;
      const allocations = await (prisma as any).feePaymentAllocation.findMany({
        where: { studentFeeId: studentFee.id },
        select: { allocatedAmount: true }
      });
      const dbPaid = allocations.reduce((sum: number, a: any) => sum + a.allocatedAmount, 0);
      if (dbPaid !== item.paidAmount) {
        dbParityValid = false;
        detailMsg = `DB allocation parity mismatch: API paid=${item.paidAmount}, DB allocations sum=${dbPaid}`;
        break;
      }
    }
    assert('API fee ledger matches raw database fee payment allocations', dbParityValid, detailMsg);

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log(` Audit Complete: ${passed} passed, ${failed} failed`);
    console.log('═══════════════════════════════════════════════════════════════');

    if (failed > 0) {
      console.error('\n❌ Failures detected:');
      failures.forEach(f => console.error(` - ${f}`));
      process.exit(1);
    } else {
      console.log('\n✅ All parity and security checks passed successfully!');
    }
  } catch (err: any) {
    console.error('\n❌ Audit test execution failed with error:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
