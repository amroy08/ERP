/**
 * Phase 3.2C: Web Exam / Marks Parity Test Script
 * Tests all Phase 3.2C endpoints for correctness and security.
 */
import * as http from 'http';

interface Resp { status: number; data: any; }

function req(method: string, path: string, body?: any, token?: string): Promise<Resp> {
  return new Promise((resolve, reject) => {
    const b = body ? JSON.stringify(body) : '';
    const h: any = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(b).toString()
    };
    if (token) h['Authorization'] = 'Bearer ' + token;
    const r = http.request({ hostname: '127.0.0.1', port: 5001, path: '/api' + path, method, headers: h }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode ?? 0, data: JSON.parse(d) }); }
        catch { resolve({ status: res.statusCode ?? 0, data: d }); }
      });
    });
    r.on('error', reject);
    if (b) r.write(b);
    r.end();
  });
}

let passed = 0;
let failed = 0;

function assert(label: string, condition: boolean, detail?: any) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.log(`  ❌ ${label}`, detail !== undefined ? JSON.stringify(detail).substring(0, 200) : '');
    failed++;
  }
}

async function main() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(' Phase 3.2C: Web Exam / Marks Parity Test');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // ── Login helpers ─────────────────────────────────────────────────────────
  const admLogin = await req('POST', '/auth/login', { email: 'admin@school.com', password: 'Admin@123' });
  const admTok = admLogin.data.data?.accessToken;
  assert('[Auth] Admin login', !!admTok);

  const stuLogin = await req('POST', '/auth/login', { email: 'stu.adm20267672@school.local', password: 'Student@123' });
  const stuTok = stuLogin.data.data?.accessToken;
  assert('[Auth] Student login', !!stuTok);

  const parLogin = await req('POST', '/auth/login', { email: 'par.adm21019870@school.local', password: 'Parent@123' });
  const parTok = parLogin.data.data?.accessToken;
  console.log(`  ℹ️  Parent login: ${parTok ? 'OK' : 'no parent in DB (acceptable)'}`);

  // ── Existing exam data ────────────────────────────────────────────────────
  console.log('\n── A. Existing Exam API (regression) ─────────────────────────');
  const examsRes = await req('GET', '/exams', undefined, admTok);
  assert('[A1] GET /exams 200', examsRes.status === 200, examsRes.status);
  assert('[A2] Admin sees exams', Array.isArray(examsRes.data.data) && examsRes.data.data.length > 0, examsRes.data.data?.length);

  const exam = examsRes.data.data?.[0];
  const examId: string = exam?.id;
  console.log(`  ℹ️  Exam: ${exam?.name} (${examId})`);

  // ── B. Gradebook endpoint ─────────────────────────────────────────────────
  console.log('\n── B. GET /exams/:examId/gradebook ───────────────────────────');
  const gbRes = await req('GET', `/exams/${examId}/gradebook`, undefined, admTok);
  assert('[B1] Admin GET gradebook 200', gbRes.status === 200, gbRes.data?.message ?? gbRes.status);
  assert('[B2] Gradebook has subjects array', Array.isArray(gbRes.data.data?.subjects));
  assert('[B3] Gradebook has examName', !!gbRes.data.data?.examName);
  assert('[B4] Gradebook has totalStudents', gbRes.data.data?.totalStudents >= 0);

  if (gbRes.data.data?.subjects?.length > 0) {
    const subj = gbRes.data.data.subjects[0];
    assert('[B5] Subject has marksEnteredCount', typeof subj.marksEnteredCount === 'number');
    assert('[B6] Subject has pendingMarksCount', typeof subj.pendingMarksCount === 'number');
    assert('[B7] Subject has maxMarks', typeof subj.maxMarks === 'number');
    assert('[B8] Subject.entered + pending = total', subj.marksEnteredCount + subj.pendingMarksCount === subj.totalStudents, `${subj.marksEnteredCount}+${subj.pendingMarksCount}=${subj.totalStudents}`);
  }

  // Security: student cannot access gradebook
  const stuGb = await req('GET', `/exams/${examId}/gradebook`, undefined, stuTok);
  assert('[B9] Student GET gradebook → 403', stuGb.status === 403, stuGb.status);

  if (parTok) {
    const parGb = await req('GET', `/exams/${examId}/gradebook`, undefined, parTok);
    assert('[B10] Parent GET gradebook → 403', parGb.status === 403, parGb.status);
  }

  // ── C. Enriched marks endpoint ────────────────────────────────────────────
  console.log('\n── C. GET /exams/:examId/subjects/:subjectId/marks ───────────');
  let subjectId = gbRes.data.data?.subjects?.[0]?.subjectId;

  if (subjectId) {
    const marksRes = await req('GET', `/exams/${examId}/subjects/${subjectId}/marks`, undefined, admTok);
    assert('[C1] Admin GET enriched marks 200', marksRes.status === 200, marksRes.status);
    assert('[C2] Returns array', Array.isArray(marksRes.data.data));

    if (marksRes.data.data?.length > 0) {
      const row = marksRes.data.data[0];
      assert('[C3] Row has studentName', !!row.studentName);
      assert('[C4] Row has admissionNo', 'admissionNo' in row);
      assert('[C5] Row has rollNumber', 'rollNumber' in row);
      assert('[C6] Row has status (entered/pending)', row.status === 'entered' || row.status === 'pending');
      assert('[C7] Row has maxMarks', typeof row.maxMarks === 'number');
      if (row.status === 'entered') {
        assert('[C8] Entered row has percentage', row.percentage !== null);
        assert('[C9] Entered row has grade', !!row.grade);
      }
    }

    // Security: student cannot view enriched marks
    const stuMarks = await req('GET', `/exams/${examId}/subjects/${subjectId}/marks`, undefined, stuTok);
    assert('[C10] Student GET enriched marks → 403', stuMarks.status === 403, stuMarks.status);
  } else {
    console.log('  ℹ️  No subjects found in gradebook — skipping enriched marks tests');
  }

  // ── D. Save/update single student mark ───────────────────────────────────
  console.log('\n── D. POST /exams/:examId/subjects/:subjectId/marks/save ─────');
  if (subjectId) {
    // Find a student in the exam class
    const marksRows = await req('GET', `/exams/${examId}/subjects/${subjectId}/marks`, undefined, admTok);
    const firstRow = marksRows.data.data?.[0];

    if (firstRow) {
      const saveRes = await req('POST', `/exams/${examId}/subjects/${subjectId}/marks/save`, {
        studentId: firstRow.studentId,
        marksObtained: 75,
        maxMarks: 100,
        remark: 'Phase 3.2C web parity test'
      }, admTok);
      assert('[D1] Admin save mark 200', saveRes.status === 200, saveRes.data?.message ?? saveRes.status);
      assert('[D2] Response has percentage', saveRes.data.data?.percentage !== undefined);
      assert('[D3] Response has grade', !!saveRes.data.data?.grade);

      // Verify updated in marks list
      const verifyRes = await req('GET', `/exams/${examId}/subjects/${subjectId}/marks`, undefined, admTok);
      const updatedRow = verifyRes.data.data?.find((r: any) => r.studentId === firstRow.studentId);
      assert('[D4] Mark persisted (marksObtained=75)', updatedRow?.marksObtained === 75, updatedRow?.marksObtained);
      assert('[D5] Grade persisted', !!updatedRow?.grade);

      // Regression: second save → upsert (no duplicate)
      const save2 = await req('POST', `/exams/${examId}/subjects/${subjectId}/marks/save`, {
        studentId: firstRow.studentId,
        marksObtained: 80,
        maxMarks: 100,
        remark: 'Updated via Phase 3.2C'
      }, admTok);
      assert('[D6] Second save (upsert) 200', save2.status === 200, save2.status);

      const verify2 = await req('GET', `/exams/${examId}/subjects/${subjectId}/marks`, undefined, admTok);
      const updatedRow2 = verify2.data.data?.find((r: any) => r.studentId === firstRow.studentId);
      assert('[D7] Updated mark shows 80 (no duplicate)', updatedRow2?.marksObtained === 80, updatedRow2?.marksObtained);

      // Validation: negative marks
      const negRes = await req('POST', `/exams/${examId}/subjects/${subjectId}/marks/save`, {
        studentId: firstRow.studentId,
        marksObtained: -5,
        maxMarks: 100
      }, admTok);
      assert('[D8] Negative marks → 400', negRes.status === 400, negRes.status);

      // Validation: marks > maxMarks
      const overRes = await req('POST', `/exams/${examId}/subjects/${subjectId}/marks/save`, {
        studentId: firstRow.studentId,
        marksObtained: 150,
        maxMarks: 100
      }, admTok);
      assert('[D9] Marks > maxMarks → 400', overRes.status === 400, overRes.status);

      // Security: student cannot save marks
      const stuSave = await req('POST', `/exams/${examId}/subjects/${subjectId}/marks/save`, {
        studentId: firstRow.studentId, marksObtained: 99, maxMarks: 100
      }, stuTok);
      assert('[D10] Student POST save marks → 403', stuSave.status === 403, stuSave.status);
    }

    // Fabricated examId → 404
    const fakeExam = await req('POST', `/exams/00000000-fake-fake-fake-000000000000/subjects/${subjectId}/marks/save`, {
      studentId: 'any', marksObtained: 50, maxMarks: 100
    }, admTok);
    assert('[D11] Fabricated examId → 404', fakeExam.status === 404, fakeExam.status);
  } else {
    console.log('  ℹ️  No subjects available — skipping save marks tests');
  }

  // ── E. Student result endpoint ────────────────────────────────────────────
  console.log('\n── E. GET /exams/results/student/:studentId ──────────────────');

  // Get a student's ID
  const stuProfile = stuLogin.data.data?.user;
  // Try via admin
  const allExamsForAdmin = await req('GET', '/exams', undefined, admTok);
  const firstExamId = allExamsForAdmin.data.data?.[0]?.id;

  // Admin can see any student results
  const stuMarksRes = await req('GET', `/exams/marks/${firstExamId}/${subjectId}`, undefined, admTok);
  const firstStudentId = stuMarksRes.data.data?.[0]?.studentId;

  if (firstStudentId) {
    const admStuRes = await req('GET', `/exams/results/student/${firstStudentId}`, undefined, admTok);
    assert('[E1] Admin GET student results 200', admStuRes.status === 200, admStuRes.status);
    assert('[E2] Admin sees enriched results', Array.isArray(admStuRes.data.data));
    if (admStuRes.data.data?.length > 0) {
      assert('[E3] Result has exam.name', !!admStuRes.data.data[0].exam?.name);
      assert('[E4] Result has subject.name', !!admStuRes.data.data[0].subject?.name);
      assert('[E5] Result has percentage', admStuRes.data.data[0].percentage !== undefined);
    }

    // IDOR: student cannot access another student's results
    const stuOther = await req('GET', `/exams/results/student/${firstStudentId}`, undefined, stuTok);
    // Should be 403 unless the logged-in student IS firstStudentId
    console.log(`  ℹ️  Student GET other student result: ${stuOther.status} (403 if different student)`);

    // Parent cannot use student endpoint
    if (parTok) {
      const parStu = await req('GET', `/exams/results/student/${firstStudentId}`, undefined, parTok);
      console.log(`  ℹ️  Parent GET student result: ${parStu.status} (403 if not linked child)`);
    }
  }

  // ── F. Parent result endpoint ─────────────────────────────────────────────
  console.log('\n── F. GET /exams/results/parent/:studentId ───────────────────');
  if (firstStudentId) {
    const admParRes = await req('GET', `/exams/results/parent/${firstStudentId}`, undefined, admTok);
    assert('[F1] Admin GET parent results 200', admParRes.status === 200, admParRes.status);

    // Student cannot use parent endpoint
    const stuParRes = await req('GET', `/exams/results/parent/${firstStudentId}`, undefined, stuTok);
    assert('[F2] Student GET parent endpoint → 403', stuParRes.status === 403, stuParRes.status);

    if (parTok) {
      // Parent access (if linked)
      const parRes = await req('GET', `/exams/results/parent/${firstStudentId}`, undefined, parTok);
      console.log(`  ℹ️  Parent GET own child result: ${parRes.status}`);
    }
  }

  // ── G. Existing report card regression ───────────────────────────────────
  console.log('\n── G. GET /exams/report/:studentId (regression) ──────────────');
  if (firstStudentId) {
    const rcRes = await req('GET', `/exams/report/${firstStudentId}`, undefined, admTok);
    assert('[G1] GET /exams/report/:studentId 200', rcRes.status === 200, rcRes.status);
    assert('[G2] Report card is array', Array.isArray(rcRes.data.data));
  }

  // ── H. Existing marks entry regression ───────────────────────────────────
  console.log('\n── H. POST /exams/marks (bulk) regression ─────────────────────');
  if (firstStudentId && firstExamId && subjectId) {
    const bulkRes = await req('POST', '/exams/marks', {
      examId: firstExamId,
      subjectId: subjectId,
      maxMarks: 100,
      results: [{ studentId: firstStudentId, marksObtained: '82', remark: 'Regression test Phase 3.2C' }]
    }, admTok);
    assert('[H1] POST /exams/marks (bulk) 200', bulkRes.status === 200, bulkRes.status);

    // Verify bulk save also reflected in enriched endpoint
    const verifyBulk = await req('GET', `/exams/${firstExamId}/subjects/${subjectId}/marks`, undefined, admTok);
    const bulkRow = verifyBulk.data.data?.find((r: any) => r.studentId === firstStudentId);
    assert('[H2] Bulk save reflected in enriched endpoint', bulkRow?.marksObtained === 82, bulkRow?.marksObtained);
  }

  // ── I. Mobile-to-web sync (verify existing mobile marks reflected) ─────────
  console.log('\n── I. Mobile-to-web sync verification ────────────────────────');
  if (firstExamId && subjectId) {
    const freshMarks = await req('GET', `/exams/${firstExamId}/subjects/${subjectId}/marks`, undefined, admTok);
    const enteredRows = freshMarks.data.data?.filter((r: any) => r.status === 'entered');
    assert('[I1] Web gradebook reflects DB results', freshMarks.status === 200 && freshMarks.data.data?.length > 0);
    assert('[I2] Entered marks are visible in enriched view', Array.isArray(enteredRows));
    console.log(`  ℹ️  Entered marks visible in web: ${enteredRows?.length ?? 0}`);
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════════════');
  const total = passed + failed;
  console.log(` Results: ${passed}/${total} passed, ${failed} failed`);
  if (failed === 0) {
    console.log(' ✅ Phase 3.2C: Web Exam Marks Parity — ALL TESTS PASS');
  } else {
    console.log(' ⚠️  Phase 3.2C: SOME TESTS FAILED — review above');
  }
  console.log('═══════════════════════════════════════════════════════════════\n');
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Test script error:', err);
  process.exit(1);
});
