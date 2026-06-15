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
    fail(`${label}: expected HTTP ${expected}, got ${res.status} — ${JSON.stringify(res.data).slice(0, 150)}`);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
  console.log('\n================================================================');
  console.log('   TESTING TEACHER MARKS ENTRY BACKEND (PHASE 3.1I)');
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

  let targetExamId: string | null = null;
  let targetSubjectId: string | null = null;
  let targetStudentId: string | null = null;

  // ── 1. GET /teacher/marks/exams (List Reachable Exams) ──────────────────────
  console.log('--- 1. GET /teacher/marks/exams (List Reachable Exams) ---');
  const examsRes = await api('GET', '/teacher/marks/exams', teacherToken);
  assertStatus(examsRes, 200, 'List reachable exams');
  const exams = examsRes.data?.data ?? [];
  console.log(`   Reachable exams found: ${exams.length}`);
  if (exams.length > 0) {
    targetExamId = exams[0].examId;
    console.log(`   Selected Exam: "${exams[0].examName}" | Class: ${exams[0].className}`);
  } else {
    fail('No reachable exams found for this teacher in DB.');
  }

  // ── 2. GET /teacher/marks/exams/:examId/subjects (List Exam Subjects) ───────
  if (targetExamId) {
    console.log(`\n--- 2. GET /teacher/marks/exams/${targetExamId}/subjects (List Exam Subjects) ---`);
    const subjsRes = await api('GET', `/teacher/marks/exams/${targetExamId}/subjects`, teacherToken);
    assertStatus(subjsRes, 200, 'List exam subjects');
    const subjects = subjsRes.data?.data ?? [];
    console.log(`   Reachable subjects for exam: ${subjects.length}`);
    if (subjects.length > 0) {
      targetSubjectId = subjects[0].subjectId;
      console.log(`   Selected Subject: "${subjects[0].subjectName}" (Max Marks Default: ${subjects[0].maxMarks})`);
    } else {
      fail('No reachable subjects found for this exam/teacher.');
    }
  }

  // ── 3. GET /teacher/marks/exams/:examId/students (List Students) ────────────
  if (targetExamId && targetSubjectId) {
    console.log(`\n--- 3. GET /teacher/marks/exams/${targetExamId}/students?subjectId=${targetSubjectId} (List Students) ---`);
    const studentsRes = await api('GET', `/teacher/marks/exams/${targetExamId}/students?subjectId=${targetSubjectId}`, teacherToken);
    assertStatus(studentsRes, 200, 'List students for marking');
    const studentList = studentsRes.data?.data?.students ?? [];
    console.log(`   Students in marking list: ${studentList.length}`);

    // Resolve targetStudentId to the actual student profile associated with STUDENT_EMAIL
    const studentRecord = await prisma.student.findFirst({
      where: { user: { email: STUDENT_EMAIL } }
    });
    if (studentRecord) {
      // Confirm this student is in the studentList
      const inList = studentList.find((s: any) => s.studentId === studentRecord.id);
      if (inList) {
        targetStudentId = studentRecord.id;
        console.log(`   Selected Student: "${inList.studentName}" (matches student@school.com) | Current Marks: ${inList.marksObtained}`);
      } else {
        targetStudentId = studentList[0]?.studentId || null;
        console.warn('   ⚠️ student@school.com not found in teacher marks student list. Using first student instead.');
      }
    } else {
      targetStudentId = studentList[0]?.studentId || null;
    }
  }

  // ── 4. POST /teacher/marks/exams/:examId/save (Save Marks) ──────────────────
  if (targetExamId && targetSubjectId && targetStudentId) {
    console.log(`\n--- 4. POST /teacher/marks/exams/${targetExamId}/save (Save Marks) ---`);
    
    // Save draft marks
    const savePayload = {
      subjectId: targetSubjectId,
      maxMarks: 100,
      marks: [
        {
          studentId: targetStudentId,
          marksObtained: 88,
          remarks: 'Good progress, keep it up!'
        }
      ]
    };
    
    const saveRes = await api('POST', `/teacher/marks/exams/${targetExamId}/save`, teacherToken, savePayload);
    assertStatus(saveRes, 200, 'Save valid student marks');
    console.log(`   Response: ${JSON.stringify(saveRes.data)}`);

    // Verify marks in student result endpoint
    console.log('\n--- 5. Verify Student Result (getStudentResults) ---');
    const studentResultRes = await api('GET', '/student/results', studentToken);
    assertStatus(studentResultRes, 200, 'GET /student/results');
    const studentResults = studentResultRes.data?.data ?? [];
    const savedResult = studentResults.find((r: any) => r.marksObtained === 88);
    if (savedResult) {
      pass(`Student verified saved marks: ${savedResult.marksObtained}/${savedResult.totalMarks} (Grade: ${savedResult.grade})`);
    } else {
      fail('Saved marks not found in student result profile.');
    }

    // Verify marks in parent result endpoint
    console.log('\n--- 6. Verify Parent Result (getParentChildResults) ---');
    const parentResultRes = await api('GET', `/parent/student/${targetStudentId}/results`, parentToken);
    assertStatus(parentResultRes, 200, 'GET /parent/student/:id/results');
    const parentResults = parentResultRes.data?.data ?? [];
    const parentSavedResult = parentResults.find((r: any) => r.marksObtained === 88);
    if (parentSavedResult) {
      pass(`Parent verified child marks: ${parentSavedResult.marksObtained}/${parentSavedResult.totalMarks} (Grade: ${parentSavedResult.grade})`);
    } else {
      fail('Saved marks not found in parent child result profile.');
    }

    // Update marks (verify upsert constraint)
    console.log('\n--- 7. Update Marks (Verify Upsert Constraint) ---');
    const updatePayload = {
      subjectId: targetSubjectId,
      maxMarks: 100,
      marks: [
        {
          studentId: targetStudentId,
          marksObtained: 95,
          remarks: 'Excellent, outstanding score!'
        }
      ]
    };
    const updateRes = await api('POST', `/teacher/marks/exams/${targetExamId}/save`, teacherToken, updatePayload);
    assertStatus(updateRes, 200, 'Update student marks');
    
    // Check total Result count for student/subject/exam combination to ensure no duplicates
    const dbResultCount = await prisma.result.count({
      where: {
        examId: targetExamId,
        studentId: targetStudentId,
        subjectId: targetSubjectId
      }
    });
    if (dbResultCount === 1) {
      pass('No duplicate result rows created. Row successfully upserted ✓');
    } else {
      fail(`Expected exactly 1 Result row in DB, found: ${dbResultCount}`);
    }

    // ── Security / Validation Tests ──────────────────────────────────────────
    console.log('\n--- 8. Security & Validation Testing ---');

    // Reject negative marks
    const negPayload = {
      subjectId: targetSubjectId,
      maxMarks: 100,
      marks: [{ studentId: targetStudentId, marksObtained: -5, remarks: 'Bad' }]
    };
    const negRes = await api('POST', `/teacher/marks/exams/${targetExamId}/save`, teacherToken, negPayload);
    assertStatus(negRes, 400, 'Reject negative marks');

    // Reject marks exceeding maxMarks
    const exceedPayload = {
      subjectId: targetSubjectId,
      maxMarks: 100,
      marks: [{ studentId: targetStudentId, marksObtained: 120, remarks: 'Overachiever' }]
    };
    const exceedRes = await api('POST', `/teacher/marks/exams/${targetExamId}/save`, teacherToken, exceedPayload);
    assertStatus(exceedRes, 400, 'Reject marks > maxMarks');

    // Student role block
    const studentBlockRes = await api('GET', '/teacher/marks/exams', studentToken);
    assertStatus(studentBlockRes, 403, 'Student calling teacher marks exams');

    // Parent role block
    const parentBlockRes = await api('GET', '/teacher/marks/exams', parentToken);
    assertStatus(parentBlockRes, 403, 'Parent calling teacher marks exams');

    // Unauthenticated request block
    const unauthRes = await fetch(`${MOBILE}/teacher/marks/exams`, { method: 'GET' });
    if (unauthRes.status === 401) {
      pass('Unauthenticated request blocked: HTTP 401');
    } else {
      fail(`Expected HTTP 401 for unauthenticated request, got ${unauthRes.status}`);
    }

    // Fabricated exam ID IDOR check
    const badExamId = 'e1111111-2222-3333-4444-555555555555';
    const idorRes = await api('GET', `/teacher/marks/exams/${badExamId}/subjects`, teacherToken);
    assertStatus(idorRes, 404, 'Reject fabricated examId');
  }

  console.log('\n================================================================');
  console.log(`   TESTS COMPLETE: ${passed} passed, ${failed} failed`);
  console.log('================================================================\n');

  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
})();
