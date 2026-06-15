import { PrismaClient } from '@prisma/client';
// @ts-ignore
import fetch from 'node-fetch';

const prisma = new PrismaClient();
const HOST = 'http://localhost:5001';

async function login(email: string, password: string): Promise<string> {
  const res = await fetch(`${HOST}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const json = await res.json() as any;
  if (res.status !== 200) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(json)}`);
  }
  const token = json.data?.accessToken || json.accessToken || json.token || json.data?.token;
  if (!token) {
    throw new Error(`Token not found in login response: ${JSON.stringify(json)}`);
  }
  return token;
}

async function get(path: string, token: string, expectedStatus = 200): Promise<any> {
  const res = await fetch(`${HOST}${path}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  const json = await res.json() as any;
  if (res.status !== expectedStatus) {
    throw new Error(`GET ${path} returned status ${res.status}, expected ${expectedStatus}. Response: ${JSON.stringify(json)}`);
  }
  return json;
}

async function runTests() {
  console.log('================================================================');
  console.log('        TESTING PARENT ACADEMIC DATA PARITY & SECURITY');
  console.log('================================================================\n');

  try {
    // 1. Log in as parent@school.com
    console.log('--- 1. Authenticating as Parent (parent@school.com) ---');
    const parentToken = await login('parent@school.com', 'Admin@123');
    console.log('✅ Logged in successfully.');

    // 2. Fetch parent dashboard to get linked child
    const parentDashboard = await get('/api/mobile/parent/dashboard', parentToken);
    console.log('✅ GET /api/mobile/parent/dashboard: SUCCESS');
    const child = parentDashboard.data?.children?.[0];
    if (!child) {
      throw new Error('No child found linked to parent dashboard. Ensure seeding has run.');
    }
    const studentId = child.id;
    console.log(`   Linked child found: ${child.name} (Student ID: ${studentId})`);
    console.log(`   Academic Summary - Periods today: ${child.todayPeriodsCount}, Pending homework: ${child.pendingHomeworkCount}, Exams: ${child.upcomingExamsCount}, Latest Result: ${child.latestResultSummary}`);

    // 3. Positive tests: access linked child academic endpoints
    console.log('\n--- 2. Testing Access to Linked Child Academic Data (Positive Cases) ---');

    const timetable = await get(`/api/mobile/parent/student/${studentId}/timetable`, parentToken);
    console.log(`✅ GET /parent/student/:id/timetable: PASS (Entries count: ${timetable.data?.length || 0})`);
    if ((timetable.data?.length || 0) < 3) {
      throw new Error(`Expected at least 3 timetable entries, found ${timetable.data?.length}`);
    }

    const homework = await get(`/api/mobile/parent/student/${studentId}/homework`, parentToken);
    console.log(`✅ GET /parent/student/:id/homework: PASS (Items count: ${homework.data?.length || 0})`);
    if ((homework.data?.length || 0) < 3) {
      throw new Error(`Expected at least 3 homework items, found ${homework.data?.length}`);
    }

    const exams = await get(`/api/mobile/parent/student/${studentId}/exams`, parentToken);
    console.log(`✅ GET /parent/student/:id/exams: PASS (Upcoming count: ${exams.data?.length || 0})`);
    if ((exams.data?.length || 0) < 1) {
      throw new Error(`Expected at least 1 upcoming exam, found ${exams.data?.length}`);
    }

    const results = await get(`/api/mobile/parent/student/${studentId}/results`, parentToken);
    console.log(`✅ GET /parent/student/:id/results: PASS (Cards count: ${results.data?.length || 0})`);
    if ((results.data?.length || 0) < 2) {
      throw new Error(`Expected at least 2 results cards, found ${results.data?.length}`);
    }

    // 4. Negative tests (IDOR security checks): access unlinked student ID
    console.log('\n--- 3. Testing Security Isolation (Negative IDOR Cases) ---');

    // Find an unlinked student ID in the system
    const parentRecord = await prisma.parent.findFirst({
      where: { user: { email: 'parent@school.com' } }
    });
    if (!parentRecord) {
      throw new Error('Parent record not found in database.');
    }
    const unlinkedStudent = await prisma.student.findFirst({
      where: { NOT: { parentId: parentRecord.id } }
    });
    if (!unlinkedStudent) {
      throw new Error('Could not find an unlinked student record for negative testing.');
    }
    const unlinkedStudentId = unlinkedStudent.id;
    console.log(`   Attempting to access data of unlinked student: ${unlinkedStudent.fullName} (ID: ${unlinkedStudentId})`);

    // Verify all endpoints return 403
    await get(`/api/mobile/parent/student/${unlinkedStudentId}/timetable`, parentToken, 403);
    console.log('✅ IDOR check - /parent/student/:unlinkedId/timetable: BLOCKED (403 Access Denied)');

    await get(`/api/mobile/parent/student/${unlinkedStudentId}/homework`, parentToken, 403);
    console.log('✅ IDOR check - /parent/student/:unlinkedId/homework: BLOCKED (403 Access Denied)');

    await get(`/api/mobile/parent/student/${unlinkedStudentId}/exams`, parentToken, 403);
    console.log('✅ IDOR check - /parent/student/:unlinkedId/exams: BLOCKED (403 Access Denied)');

    await get(`/api/mobile/parent/student/${unlinkedStudentId}/results`, parentToken, 403);
    console.log('✅ IDOR check - /parent/student/:unlinkedId/results: BLOCKED (403 Access Denied)');

    console.log('\n================================================================');
    console.log('         PARENT ACADEMIC DATA PARITY TESTS PASSED SUCCESSFULLY');
    console.log('================================================================');
  } catch (err: any) {
    console.error('\n❌ Security audit failed with error:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
