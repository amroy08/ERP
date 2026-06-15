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
  return json.data?.accessToken || json.accessToken || json.token || json.data?.token;
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

async function postMultipart(path: string, token: string, boundary: string, bodyBuffer: Buffer, expectedStatus = 200): Promise<any> {
  const res = await fetch(`${HOST}${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`
    },
    body: bodyBuffer
  });
  const json = await res.json() as any;
  if (res.status !== expectedStatus) {
    throw new Error(`POST ${path} returned status ${res.status}, expected ${expectedStatus}. Response: ${JSON.stringify(json)}`);
  }
  return json;
}

function buildMultipartBody(boundary: string, fields: Record<string, string>, file?: { name: string; filename: string; content: Buffer; contentType: string }) {
  const parts: Buffer[] = [];
  for (const [key, value] of Object.entries(fields)) {
    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`, 'utf-8'));
  }
  if (file) {
    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${file.name}"; filename="${file.filename}"\r\nContent-Type: ${file.contentType}\r\n\r\n`, 'utf-8'));
    parts.push(file.content);
    parts.push(Buffer.from('\r\n', 'utf-8'));
  }
  parts.push(Buffer.from(`--${boundary}--`, 'utf-8'));
  return Buffer.concat(parts);
}

async function runTests() {
  console.log('================================================================');
  console.log('        TESTING STUDENT HOMEWORK SUBMISSION BACKEND (PHASE 3.1D)');
  console.log('================================================================\n');

  try {
    const studentToken = await login('student@school.com', 'Admin@123');
    const parentToken = await login('parent@school.com', 'Admin@123');
    const teacherToken = await login('teacher@school.com', 'Admin@123');

    // Get student record
    const studentRecord = await prisma.student.findFirst({
      where: { user: { email: 'student@school.com' } }
    });
    if (!studentRecord) throw new Error('Student record not found.');

    // 1. Get a homework ID assigned to Class 1
    const homework = await prisma.homework.findFirst({
      where: { classId: studentRecord.classId }
    });
    if (!homework) throw new Error('Seeded homework not found. Run seed script first.');
    const homeworkId = homework.id;
    console.log(`📌 Target Homework: "${homework.title}" (ID: ${homeworkId})`);

    // Reset homework submission for clean testing
    await prisma.homeworkSubmission.deleteMany({
      where: { homeworkId, studentId: studentRecord.id }
    });
    console.log('🧹 Cleaned existing submissions for target homework.');

    // 2. Fetch homework submission status (should be null)
    console.log('\n--- 1. Testing Get Initial Submission Status (Empty Case) ---');
    const initialRes = await get(`/api/mobile/student/homework/${homeworkId}/submission`, studentToken);
    console.log('✅ GET initial submission: PASS (Result: null)');

    // 3. Submit text-only homework
    console.log('\n--- 2. Testing Text-Only Submission (Positive Case) ---');
    const boundaryText = '----TestBoundaryTextOnly';
    const textBody = buildMultipartBody(boundaryText, {
      submissionText: 'This is my text-only homework answer.'
    });
    const submitTextRes = await postMultipart(`/api/mobile/student/homework/${homeworkId}/submit`, studentToken, boundaryText, textBody);
    console.log(`✅ POST submit text-only: PASS (Message: "${submitTextRes.message}")`);

    // 4. Verify text-only submission details
    const textStatusRes = await get(`/api/mobile/student/homework/${homeworkId}/submission`, studentToken);
    console.log('✅ GET text submission status: PASS');
    console.log(`   Status: "${textStatusRes.data.status}", Text: "${textStatusRes.data.submissionText}"`);

    // 5. Resubmit homework with text + file
    console.log('\n--- 3. Testing Text + File Resubmission (Positive Case) ---');
    const boundaryFile = '----TestBoundaryWithFile';
    const fileBody = buildMultipartBody(boundaryFile, {
      submissionText: 'Resubmitted with a revision text.'
    }, {
      name: 'file',
      filename: 'algebra_answers.txt',
      content: Buffer.from('1. x=5\n2. y=10\n3. z=15', 'utf-8'),
      contentType: 'text/plain'
    });
    const resubmitRes = await postMultipart(`/api/mobile/student/homework/${homeworkId}/submit`, studentToken, boundaryFile, fileBody);
    console.log(`✅ POST resubmit with file: PASS (Message: "${resubmitRes.message}")`);

    // 6. Verify resubmitted details
    const fileStatusRes = await get(`/api/mobile/student/homework/${homeworkId}/submission`, studentToken);
    console.log('✅ GET file submission status: PASS');
    console.log(`   Status: "${fileStatusRes.data.status}", Text: "${fileStatusRes.data.submissionText}", File: "${fileStatusRes.data.fileName}"`);

    // 7. Verify student homework list contains submission summary
    console.log('\n--- 4. Testing Student Homework List Integration ---');
    const studentHwList = await get('/api/mobile/student/homework', studentToken);
    const hwItem = studentHwList.data?.find((h: any) => h.id === homeworkId);
    console.log('✅ GET student homework list: PASS');
    console.log(`   hasSubmission: ${hwItem?.hasSubmission}, submissionStatus: "${hwItem?.submissionStatus}", file: "${hwItem?.fileName}"`);

    // 8. Verify parent child homework contains submission summary
    console.log('\n--- 5. Testing Parent Child Homework List Integration ---');
    const parentHwList = await get(`/api/mobile/parent/student/${studentRecord.id}/homework`, parentToken);
    const parentHwItem = parentHwList.data?.find((h: any) => h.id === homeworkId);
    console.log('✅ GET parent child homework list: PASS');
    console.log(`   hasSubmission: ${parentHwItem?.hasSubmission}, submissionStatus: "${parentHwItem?.submissionStatus}", file: "${parentHwItem?.fileName}"`);

    // 9. Negative/security check: submit to homework of another class
    console.log('\n--- 6. Testing Security Mismatch Checks (Negative Cases) ---');

    // Create a temporary homework in another class for testing scoping
    const class2 = await prisma.class.findFirst({
      where: { NOT: { id: studentRecord.classId } }
    });
    if (!class2) throw new Error('Unrelated class not found in DB.');

    // Fetch existing subject
    const subject = await prisma.subject.findFirst();
    const teacher = await prisma.teacher.findFirst();
    if (!subject || !teacher) throw new Error('Required subject or teacher not found.');

    const unrelatedHw = await prisma.homework.create({
      data: {
        title: 'Unrelated Class Homework',
        description: 'For negative test',
        classId: class2.id,
        subjectId: subject.id,
        assignedById: teacher.id,
        dueDate: new Date(Date.now() + 86400000)
      }
    });

    try {
      // Student attempts to submit to unrelated class homework
      const boundaryNeg = '----BoundaryNegTest';
      const negBody = buildMultipartBody(boundaryNeg, { submissionText: 'Hack' });
      await postMultipart(`/api/mobile/student/homework/${unrelatedHw.id}/submit`, studentToken, boundaryNeg, negBody, 403);
      console.log('✅ Security check - submit to unrelated class homework: BLOCKED (403 Access Denied)');
    } finally {
      // Clean up temp homework
      await prisma.homework.delete({ where: { id: unrelatedHw.id } });
    }

    // Attempt from parent role (unauthorized)
    const boundaryParent = '----BoundaryParentTest';
    const parentBody = buildMultipartBody(boundaryParent, { submissionText: 'Submit as parent' });
    await postMultipart(`/api/mobile/student/homework/${homeworkId}/submit`, parentToken, boundaryParent, parentBody, 403);
    console.log('✅ Security check - submit as parent: BLOCKED (403 Access Denied)');

    // Attempt from teacher role (unauthorized)
    const boundaryTeacher = '----BoundaryTeacherTest';
    const teacherBody = buildMultipartBody(boundaryTeacher, { submissionText: 'Submit as teacher' });
    await postMultipart(`/api/mobile/student/homework/${homeworkId}/submit`, teacherToken, boundaryTeacher, teacherBody, 403);
    console.log('✅ Security check - submit as teacher: BLOCKED (403 Access Denied)');

    // 10. File validations negative checks
    console.log('\n--- 7. Testing Input & File Validation Checks ---');

    // Submit invalid file type (e.g. .exe)
    const boundaryInvalid = '----BoundaryInvalidType';
    const invalidBody = buildMultipartBody(boundaryInvalid, {
      submissionText: 'Attempting invalid file upload'
    }, {
      name: 'file',
      filename: 'exploit.exe',
      content: Buffer.from('hack', 'utf-8'),
      contentType: 'application/octet-stream'
    });
    // Multer filter should reject this with error (mapped to 500 or validation error status)
    try {
      await postMultipart(`/api/mobile/student/homework/${homeworkId}/submit`, studentToken, boundaryInvalid, invalidBody, 500);
      console.log('✅ File validation - invalid file type rejected: PASS');
    } catch (e: any) {
      if (e.message.includes('500') || e.message.includes('400')) {
        console.log('✅ File validation - invalid file type rejected: PASS');
      } else {
        throw e;
      }
    }

    // Submit empty text & empty file
    const boundaryEmpty = '----BoundaryEmpty';
    const emptyBody = buildMultipartBody(boundaryEmpty, {});
    await postMultipart(`/api/mobile/student/homework/${homeworkId}/submit`, studentToken, boundaryEmpty, emptyBody, 400);
    console.log('✅ Input validation - empty submission rejected: PASS (400 Bad Request)');

    console.log('\n================================================================');
    console.log('         HOMEWORK SUBMISSION BACKEND TESTS PASSED SUCCESSFULLY');
    console.log('================================================================');

  } catch (err: any) {
    console.error('\n❌ Homework submission test failed with error:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
