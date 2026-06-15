import { PrismaClient } from '@prisma/client';
// @ts-ignore
import fetch from 'node-fetch';

const prisma = new PrismaClient();
const HOST = 'http://localhost:5001';
const MOBILE = `${HOST}/api/mobile`;

// ── Credentials ───────────────────────────────────────────────────────────────
const TEACHER_EMAIL = 'teacher@school.com';
const STUDENT_EMAIL = 'student@school.com';
const PARENT_EMAIL  = 'parent@school.com';
const PASSWORD      = 'Admin@123';

// ── Helpers ───────────────────────────────────────────────────────────────────
async function login(email: string, password: string): Promise<string> {
  const res = await fetch(`${HOST}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json() as any;
  const token = data?.data?.accessToken ?? data?.token;
  if (!token) throw new Error(`Login failed for ${email}: ${JSON.stringify(data).slice(0, 200)}`);
  return token;
}

async function api(method: string, path: string, token: string, body?: any): Promise<{ status: number; data: any }> {
  const res = await fetch(`${MOBILE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

let passed = 0;
let failed = 0;

function pass(msg: string) { console.log(`   ✅ ${msg}`); passed++; }
function fail(msg: string) { console.error(`   ❌ ${msg}`); failed++; }

function assertStatus(res: { status: number; data: any }, expected: number, label: string) {
  if (res.status === expected) {
    pass(`${label}: HTTP ${res.status}`);
  } else {
    fail(`${label}: expected HTTP ${expected}, got ${res.status} — ${JSON.stringify(res.data).slice(0, 120)}`);
  }
}

function assertNoFilePath(data: any, label: string) {
  const str = JSON.stringify(data);
  if (str.includes('"filePath"')) {
    fail(`${label}: raw filePath LEAKED in JSON response`);
  } else {
    pass(`${label}: no raw filePath in JSON ✓`);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
  console.log('\n================================================================');
  console.log('   TESTING TEACHER HOMEWORK REVIEW BACKEND (PHASE 3.1F)');
  console.log('================================================================\n');

  let teacherToken: string, studentToken: string, parentToken: string;
  try {
    teacherToken = await login(TEACHER_EMAIL, PASSWORD);
    studentToken = await login(STUDENT_EMAIL, PASSWORD);
    parentToken  = await login(PARENT_EMAIL, PASSWORD);
    console.log('✅ Logged in as teacher, student, and parent.\n');
  } catch (e: any) {
    console.error('❌ Login failed:', e.message);
    await prisma.$disconnect();
    process.exit(1);
  }

  let targetHomeworkId: string | null = null;
  let targetSubmissionId: string | null = null;

  // ── 1. Teacher homework list ───────────────────────────────────────────────
  console.log('--- 1. GET /teacher/homework (Teacher Homework List) ---');
  const listRes = await api('GET', '/teacher/homework', teacherToken);
  assertStatus(listRes, 200, 'GET /teacher/homework');
  assertNoFilePath(listRes.data, 'teacher homework list');

  const hwList: any[] = listRes.data?.data ?? [];
  console.log(`   Found ${hwList.length} homework item(s) visible to teacher.`);

  if (hwList.length > 0) {
    const hw = hwList[0];
    targetHomeworkId = hw.homeworkId;
    console.log(`   First HW: "${hw.title}" (${hw.className} ${hw.sectionName ?? ''} — ${hw.subjectName})`);
    console.log(`   Stats: total=${hw.totalStudents} submitted=${hw.submittedCount} pending=${hw.pendingCount} reviewed=${hw.reviewedCount}`);

    // ── 2. Teacher view submissions for a homework ─────────────────────────
    console.log(`\n--- 2. GET /teacher/homework/${targetHomeworkId}/submissions ---`);
    const subsRes = await api('GET', `/teacher/homework/${targetHomeworkId}/submissions`, teacherToken);
    assertStatus(subsRes, 200, 'GET homework submissions');
    assertNoFilePath(subsRes.data, 'submissions list');

    const studentList: any[] = subsRes.data?.data?.students ?? [];
    console.log(`   Students in list: ${studentList.length}`);

    const withSub = studentList.find((s: any) => s.submissionId !== null);
    if (withSub) {
      targetSubmissionId = withSub.submissionId;
      console.log(`   Student with submission: ${withSub.studentName} (status: ${withSub.status})`);
    } else {
      // Create a submission as student for testing
      console.log('   No submissions found. Creating one via student API...');
      const submitRes = await api('POST', `/student/homework/${targetHomeworkId}/submit`, studentToken, {
        submissionText: 'Test answer for Phase 3.1F teacher review test.',
      });
      if (submitRes.status === 200 || submitRes.status === 201) {
        console.log('   Created test submission. Re-fetching submissions list...');
        const subsRes2 = await api('GET', `/teacher/homework/${targetHomeworkId}/submissions`, teacherToken);
        const withSub2 = (subsRes2.data?.data?.students ?? []).find((s: any) => s.submissionId !== null);
        if (withSub2) {
          targetSubmissionId = withSub2.submissionId;
          console.log(`   ✅ Test submission ready: ${withSub2.studentName}`);
        }
      } else {
        console.log(`   ⚠️  Could not create test submission (${submitRes.status}). Skipping submission-level tests.`);
      }
    }

    // ── 3. Teacher submission detail ────────────────────────────────────────
    if (targetSubmissionId) {
      console.log(`\n--- 3. GET /teacher/homework/submissions/${targetSubmissionId} ---`);
      const detailRes = await api('GET', `/teacher/homework/submissions/${targetSubmissionId}`, teacherToken);
      assertStatus(detailRes, 200, 'GET submission detail');
      assertNoFilePath(detailRes.data, 'submission detail');

      const d = detailRes.data?.data;
      if (d) {
        console.log(`   Student: ${d.student?.studentName}, status: ${d.status}, canReview: ${d.canReview}, canDownload: ${d.canDownload}`);
        if ('filePath' in (d ?? {})) fail('filePath present in detail JSON — LEAK');
        else pass('filePath absent from detail JSON ✓');
      }

      // ── 4. Teacher review — mark as reviewed ────────────────────────────
      console.log(`\n--- 4. PATCH review (status: reviewed, marks: 9) ---`);
      const reviewRes = await api('PATCH', `/teacher/homework/submissions/${targetSubmissionId}/review`, teacherToken, {
        status: 'reviewed',
        teacherFeedback: 'Well done! Clean and correct working shown.',
        marks: 9,
      });
      assertStatus(reviewRes, 200, 'PATCH mark as reviewed');
      const rd = reviewRes.data?.data;
      if (rd?.status === 'reviewed') pass('Status set to reviewed ✓');
      else fail(`Status mismatch: expected reviewed, got ${rd?.status}`);
      if (rd?.marks === 9) pass('Marks saved as 9 ✓');
      else fail(`Marks mismatch: expected 9, got ${rd?.marks}`);
      if (rd?.reviewedAt) pass(`reviewedAt populated: ${rd.reviewedAt}`);
      else fail('reviewedAt not set after review');

      // ── 5. Teacher return submission ─────────────────────────────────────
      console.log(`\n--- 5. PATCH review (status: returned) ---`);
      const returnRes = await api('PATCH', `/teacher/homework/submissions/${targetSubmissionId}/review`, teacherToken, {
        status: 'returned',
        teacherFeedback: 'Please redo step 2 with more detail.',
      });
      assertStatus(returnRes, 200, 'PATCH return submission');
      const rrd = returnRes.data?.data;
      if (rrd?.status === 'returned') pass('Status set to returned ✓');
      else fail(`Return status mismatch: got ${rrd?.status}`);

      // ── 6. Teacher download — text-only submission will return 404 ────────
      console.log(`\n--- 6. GET download (expects 200 for file, 404 for text-only) ---`);
      const dlRes = await api('GET', `/teacher/homework/submissions/${targetSubmissionId}/download`, teacherToken);
      if (dlRes.status === 200) pass('Download: file served (200)');
      else if (dlRes.status === 404) pass('Download: no file on text-only submission (404 as expected)');
      else fail(`Download: unexpected status ${dlRes.status}`);
    }
  } else {
    console.log('   ⚠️  Teacher has no accessible homework. Skipping submission-level tests.');
    console.log('   (This may occur if demo data is not seeded. Run Phase 3.1B demo seed script first.)');
  }

  // ── 7. Security — student blocked from teacher endpoints ──────────────────
  console.log('\n--- 7. Security: Student → teacher endpoints (must be 403) ---');
  const s1 = await api('GET', '/teacher/homework', studentToken);
  if (s1.status === 403) pass('Student → GET /teacher/homework: BLOCKED (403)');
  else fail(`Student → GET /teacher/homework: expected 403, got ${s1.status}`);

  if (targetHomeworkId) {
    const s2 = await api('GET', `/teacher/homework/${targetHomeworkId}/submissions`, studentToken);
    if (s2.status === 403) pass('Student → GET homework submissions: BLOCKED (403)');
    else fail(`Student → GET homework submissions: expected 403, got ${s2.status}`);
  }

  if (targetSubmissionId) {
    const s3 = await api('GET', `/teacher/homework/submissions/${targetSubmissionId}`, studentToken);
    if (s3.status === 403) pass('Student → GET submission detail: BLOCKED (403)');
    else fail(`Student → GET submission detail: expected 403, got ${s3.status}`);

    const s4 = await api('PATCH', `/teacher/homework/submissions/${targetSubmissionId}/review`, studentToken, { status: 'reviewed' });
    if (s4.status === 403) pass('Student → PATCH review: BLOCKED (403)');
    else fail(`Student → PATCH review: expected 403, got ${s4.status}`);

    const s5 = await api('GET', `/teacher/homework/submissions/${targetSubmissionId}/download`, studentToken);
    if (s5.status === 403) pass('Student → GET download: BLOCKED (403)');
    else fail(`Student → GET download: expected 403, got ${s5.status}`);
  }

  // ── 8. Security — parent blocked from teacher endpoints ───────────────────
  console.log('\n--- 8. Security: Parent → teacher endpoints (must be 403) ---');
  const p1 = await api('GET', '/teacher/homework', parentToken);
  if (p1.status === 403) pass('Parent → GET /teacher/homework: BLOCKED (403)');
  else fail(`Parent → GET /teacher/homework: expected 403, got ${p1.status}`);

  if (targetSubmissionId) {
    const p2 = await api('PATCH', `/teacher/homework/submissions/${targetSubmissionId}/review`, parentToken, { status: 'reviewed' });
    if (p2.status === 403) pass('Parent → PATCH review: BLOCKED (403)');
    else fail(`Parent → PATCH review: expected 403, got ${p2.status}`);
  }

  // ── 9. Unauthenticated blocked ────────────────────────────────────────────
  console.log('\n--- 9. Security: Unauthenticated request blocked ---');
  const unauth = await fetch(`${MOBILE}/teacher/homework`);
  if (unauth.status === 401) pass('Unauthenticated → GET /teacher/homework: BLOCKED (401)');
  else fail(`Unauthenticated: expected 401, got ${unauth.status}`);

  // ── 10. Validation — negative marks ──────────────────────────────────────
  if (targetSubmissionId) {
    console.log('\n--- 10. Validation: Negative marks rejected ---');
    const badMarks = await api('PATCH', `/teacher/homework/submissions/${targetSubmissionId}/review`, teacherToken, { marks: -5 });
    if (badMarks.status === 400) pass('Negative marks rejected (400) ✓');
    else fail(`Negative marks: expected 400, got ${badMarks.status}`);

    // ── 11. Validation — invalid status ─────────────────────────────────
    console.log('\n--- 11. Validation: Invalid status rejected ---');
    const badStatus = await api('PATCH', `/teacher/homework/submissions/${targetSubmissionId}/review`, teacherToken, { status: 'approved' });
    if (badStatus.status === 400) pass('Invalid status "approved" rejected (400) ✓');
    else fail(`Invalid status: expected 400, got ${badStatus.status}`);
  }

  // ── 12. IDOR — fabricated homework ID ────────────────────────────────────
  console.log('\n--- 12. Security: IDOR — fabricated homework ID ---');
  const fakeHw = await api('GET', '/teacher/homework/00000000-0000-0000-0000-000000000000/submissions', teacherToken);
  if (fakeHw.status === 403 || fakeHw.status === 404) {
    pass(`Fabricated homework ID: BLOCKED (${fakeHw.status})`);
  } else {
    fail(`Fabricated homework ID: expected 403/404, got ${fakeHw.status}`);
  }

  // ── 13. IDOR — fabricated submission ID ──────────────────────────────────
  console.log('\n--- 13. Security: IDOR — fabricated submission ID ---');
  const fakeSub = await api('GET', '/teacher/homework/submissions/00000000-0000-0000-0000-000000000000', teacherToken);
  if (fakeSub.status === 403 || fakeSub.status === 404) {
    pass(`Fabricated submission ID: BLOCKED (${fakeSub.status})`);
  } else {
    fail(`Fabricated submission ID: expected 403/404, got ${fakeSub.status}`);
  }

  // ── Final summary ─────────────────────────────────────────────────────────
  console.log('\n================================================================');
  console.log(`   RESULTS: ${passed} passed, ${failed} failed`);
  if (failed === 0) {
    console.log('   TEACHER HOMEWORK REVIEW BACKEND TESTS PASSED SUCCESSFULLY');
  } else {
    console.log('   ⚠️  SOME TESTS FAILED — review output above');
  }
  console.log('================================================================\n');

  await prisma.$disconnect();
  if (failed > 0) process.exit(1);
})();
