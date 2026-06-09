import prisma from '../src/config/prisma';
import fs from 'fs';
import path from 'path';

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
  return json.data.accessToken;
}

async function run() {
  console.log('--- STARTING ADMISSION TO STUDENT DOCUMENT COPY TEST ---');

  // Authenticate as Admin
  console.log('Authenticating as admin...');
  const token = await login('admin@school.com', 'Admin@123');
  console.log('Admin authenticated successfully.');

  // Find prerequisite data
  const school = await prisma.school.findFirst();
  const cls = await prisma.class.findFirst();
  const sec = await prisma.section.findFirst();
  const ay = await prisma.academicYear.findFirst();

  if (!school || !cls || !sec || !ay) {
    throw new Error('Required seed data missing. Run migrations/seed first.');
  }

  // Paths
  const admissionsPrivateDir = path.resolve(process.cwd(), 'private_uploads', 'admissions');
  const studentsPrivateDir = path.resolve(process.cwd(), 'private_uploads', 'students');

  // Ensure directories exist
  if (!fs.existsSync(admissionsPrivateDir)) fs.mkdirSync(admissionsPrivateDir, { recursive: true });
  if (!fs.existsSync(studentsPrivateDir)) fs.mkdirSync(studentsPrivateDir, { recursive: true });

  let testAdmissionId: string | null = null;
  let testStudentId: string | null = null;
  let testStudentUserId: string | null = null;
  let testParentId: string | null = null;
  let testParentUserId: string | null = null;

  try {
    // 1. Create a temporary admission record
    const applicationNo = `ADM-COPY-TEST-${Date.now()}`;
    console.log(`\n--- Test 1: Creating test admission record ${applicationNo} ---`);
    const admission = await prisma.admission.create({
      data: {
        applicationNo,
        firstName: 'CopyDoc',
        lastName: 'Student',
        dateOfBirth: new Date('2015-05-15'),
        gender: 'male',
        classId: cls.id,
        sectionId: sec.id,
        academicYearId: ay.id,
        schoolId: school.id,
        parentName: 'Parent Copy',
        parentPhone: '9876543222',
        parentEmail: `copy.test.${Date.now()}@example.com`
      }
    });
    testAdmissionId = admission.id;
    console.log(`Created test Admission ID: ${admission.id}`);

    // 2. Upload an admission document (studentPhoto)
    console.log('\n--- Test 2: Upload student photo to Admission record ---');
    const imgBlob = new Blob(['Dummy Admission Image'], { type: 'image/jpeg' });
    const imgForm = new FormData();
    imgForm.append('file', imgBlob, 'photo.jpg');

    const uploadRes = await fetch(`${HOST}/api/admissions/${admission.id}/documents/studentPhoto`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: imgForm
    });

    const uploadJson = await uploadRes.json() as any;
    console.log(`Upload Status: ${uploadRes.status}`);
    if (uploadRes.status !== 200 || !uploadJson.success) {
      throw new Error(`Failed to upload photo for admission: ${JSON.stringify(uploadJson)}`);
    }

    const admissionPhotoFileName = uploadJson.data.fileName;
    console.log(`Uploaded admission file name: ${admissionPhotoFileName}`);

    // Verify file exists on disk in admissions
    const admissionDiskPath = path.join(admissionsPrivateDir, admissionPhotoFileName);
    if (!fs.existsSync(admissionDiskPath)) {
      throw new Error(`Uploaded admission file not found on disk at: ${admissionDiskPath}`);
    }
    console.log('Verified: Uploaded admission file exists on disk.');

    // 3. Approve admission status
    console.log('\n--- Test 3: Approving admission application ---');
    await prisma.admission.update({
      where: { id: admission.id },
      data: { status: 'approved' }
    });
    console.log('Admission approved in database.');

    // 4. Convert admission to student
    console.log('\n--- Test 4: Converting admission to student ---');
    const convertRes = await fetch(`${HOST}/api/admissions/convert/${admission.id}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        classId: cls.id,
        sectionId: sec.id
      })
    });

    const convertJson = await convertRes.json() as any;
    console.log(`Conversion Status: ${convertRes.status}`);
    if (convertRes.status !== 200 || !convertJson.success) {
      throw new Error(`Conversion failed: ${JSON.stringify(convertJson)}`);
    }

    const student = convertJson.data.student;
    testStudentId = student.id;
    testStudentUserId = student.userId;
    testParentId = student.parentId;

    const parentRecord = await prisma.parent.findUnique({ where: { id: student.parentId } });
    if (parentRecord) testParentUserId = parentRecord.userId;

    console.log(`Converted Student ID: ${student.id}`);

    // 5. Verify Student DB fields
    console.log('\n--- Test 5: Verify Student DB fields ---');
    const dbStudent = await prisma.student.findUnique({ where: { id: student.id } }) as any;
    if (dbStudent.sourceAdmissionId !== admission.id) {
      throw new Error(`sourceAdmissionId mismatch! Expected: ${admission.id}, Got: ${dbStudent.sourceAdmissionId}`);
    }
    console.log('Verified: sourceAdmissionId is saved.');

    const copiedStudentPhotoName = dbStudent.studentPhoto;
    console.log(`Copied studentPhoto file name in Student DB record: ${copiedStudentPhotoName}`);
    if (!copiedStudentPhotoName) {
      throw new Error('studentPhoto is null on Student record.');
    }
    if (copiedStudentPhotoName === admissionPhotoFileName) {
      throw new Error('Copied file name is identical to original admission file name. It should be randomized!');
    }
    console.log('Verified: Student has a distinct, randomized copied file reference.');

    // Verify no private_uploads/students/ prefix is saved in DB, only filename.ext
    if (copiedStudentPhotoName.includes('/') || copiedStudentPhotoName.includes('\\')) {
      throw new Error(`DB path format violation: Expected only filename, but found path separators in: ${copiedStudentPhotoName}`);
    }
    console.log('Verified: DB stores only the filename/basename.');

    // 6. Verify file exists in private_uploads/students/
    console.log('\n--- Test 6: Verify copied file exists on disk ---');
    const studentPhotoDiskPath = path.join(studentsPrivateDir, copiedStudentPhotoName);
    if (!fs.existsSync(studentPhotoDiskPath)) {
      throw new Error(`Copied student file not found on disk at: ${studentPhotoDiskPath}`);
    }
    // Verify original admission file STILL exists
    if (!fs.existsSync(admissionDiskPath)) {
      throw new Error('Original admission file was deleted/moved! It must remain.');
    }
    console.log('Verified: Copied file exists in students/, and original still exists in admissions/.');

    // 7. Verify student document download endpoint works
    console.log('\n--- Test 7: Verify download of copied student document ---');
    const downloadRes = await fetch(`${HOST}/api/students/${student.id}/documents/studentPhoto`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`Download Status: ${downloadRes.status}`);
    if (downloadRes.status !== 200) {
      throw new Error('Failed to download student document.');
    }
    const downloadText = await downloadRes.text();
    if (downloadText !== 'Dummy Admission Image') {
      throw new Error(`Downloaded content mismatch! Got: ${downloadText}`);
    }
    console.log('Verified: Converted student document downloaded successfully with correct content.');

    // 8. Test Isolation (Student side deletion)
    console.log('\n--- Test 8: Deleting student document and checking admission document isolation ---');
    const deleteStudentRes = await fetch(`${HOST}/api/students/${student.id}/documents/studentPhoto`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`Delete Student Doc Status: ${deleteStudentRes.status}`);
    if (deleteStudentRes.status !== 200) {
      throw new Error('Failed to delete student document.');
    }
    // Check student file deleted from disk
    if (fs.existsSync(studentPhotoDiskPath)) {
      throw new Error('Student photo file was not deleted from disk!');
    }
    // Verify admission file still exists
    if (!fs.existsSync(admissionDiskPath)) {
      throw new Error('Admission photo file was deleted when student photo was deleted! (Isolation violation)');
    }
    console.log('Verified: Student doc delete is isolated. Admission doc still exists.');

    // 9. Test Isolation (Admission side deletion)
    console.log('\n--- Test 9: Deleting admission document and checking student document isolation ---');
    // Upload a new photo for student first to ensure one exists
    const reuploadRes = await fetch(`${HOST}/api/students/${student.id}/documents/studentPhoto`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: imgForm
    });
    const reuploadJson = await reuploadRes.json() as any;
    const newStudentPhotoName = reuploadJson.data.fileName;
    const newStudentPhotoDiskPath = path.join(studentsPrivateDir, newStudentPhotoName);

    // Delete admission photo
    const deleteAdmissionRes = await fetch(`${HOST}/api/admissions/${admission.id}/documents/studentPhoto`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`Delete Admission Doc Status: ${deleteAdmissionRes.status}`);
    if (deleteAdmissionRes.status !== 200) {
      throw new Error('Failed to delete admission document.');
    }
    // Check admission file deleted from disk
    if (fs.existsSync(admissionDiskPath)) {
      throw new Error('Admission photo file was not deleted from disk!');
    }
    // Verify student file still exists
    if (!fs.existsSync(newStudentPhotoDiskPath)) {
      throw new Error('Student photo file was deleted when admission photo was deleted! (Isolation violation)');
    }
    console.log('Verified: Admission doc delete is isolated. Student doc still exists.');

    // 10. Test DB rollback orphan file cleanup protection
    console.log('\n--- Test 10: Testing DB rollback orphan file cleanup protection ---');
    // Create a new admission with files
    const rollbackAdmission = await prisma.admission.create({
      data: {
        applicationNo: `ADM-RB-${Date.now()}`,
        firstName: 'Rollback',
        lastName: 'Test',
        dateOfBirth: new Date('2015-05-15'),
        gender: 'male',
        classId: cls.id,
        sectionId: sec.id,
        academicYearId: ay.id,
        schoolId: school.id,
        parentName: 'Parent Rollback',
        parentPhone: '9876543223',
        parentEmail: `rollback.test.${Date.now()}@example.com`
      }
    });

    const rollbackImgBlob = new Blob(['Rollback Image Data'], { type: 'image/jpeg' });
    const rollbackImgForm = new FormData();
    rollbackImgForm.append('file', rollbackImgBlob, 'rb.jpg');

    const rbUploadRes = await fetch(`${HOST}/api/admissions/${rollbackAdmission.id}/documents/studentPhoto`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: rollbackImgForm
    });
    const rbUploadJson = await rbUploadRes.json() as any;
    const rbAdmissionPhotoName = rbUploadJson.data.fileName;

    // Approve it
    await prisma.admission.update({
      where: { id: rollbackAdmission.id },
      data: { status: 'approved' }
    });

    // Make database fail by passing a completely invalid class UUID format or non-existent class UUID format
    // A non-existent UUID will fail foreign key check
    const nonExistentClassUuid = 'e8b8352b-7ce2-4bb3-ae4a-c0b78e22e92c'; // Valid GUID but doesn't exist
    console.log('Attempting conversion with non-existent class GUID to trigger rollback...');
    const rbConvertRes = await fetch(`${HOST}/api/admissions/convert/${rollbackAdmission.id}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        classId: nonExistentClassUuid,
        sectionId: sec.id
      })
    });

    console.log(`Rollback Conversion Status (Expected 400 or 500): ${rbConvertRes.status}`);
    const rbConvertJson = await rbConvertRes.json() as any;
    console.log('Rollback response message:', rbConvertJson.message);

    // Verify that the files copied to students/ are cleaned up!
    // Since we don't know the generated student filename, we can scan the studentsPrivateDir for any files created in the last 10 seconds with "studentPhoto"
    const files = fs.readdirSync(studentsPrivateDir);
    let foundOrphan = false;
    for (const file of files) {
      if (file.startsWith('studentPhoto')) {
        const filePath = path.join(studentsPrivateDir, file);
        const stats = fs.statSync(filePath);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        // If it was created in the last 10 seconds and has rollback content, it's our orphan
        if (Date.now() - stats.mtimeMs < 15000 && fileContent === 'Rollback Image Data') {
          foundOrphan = true;
          break;
        }
      }
    }

    if (foundOrphan) {
      throw new Error('Database transaction failed but orphan copied student file was NOT cleaned up from disk!');
    }
    console.log('Verified: Database transaction rolled back and orphan student file was cleaned up successfully.');

    // Cleanup rollback admission record
    await prisma.admission.delete({ where: { id: rollbackAdmission.id } });

    // 11. Test missing optional file handling
    console.log('\n--- Test 11: Converting with missing optional file on-disk ---');
    const missingAdmission = await prisma.admission.create({
      data: {
        applicationNo: `ADM-MISSING-${Date.now()}`,
        firstName: 'MissingFile',
        lastName: 'Test',
        dateOfBirth: new Date('2015-05-15'),
        gender: 'male',
        classId: cls.id,
        sectionId: sec.id,
        academicYearId: ay.id,
        schoolId: school.id,
        parentName: 'Parent Missing',
        parentPhone: '9876543224',
        parentEmail: `missing.test.${Date.now()}@example.com`,
        studentPhoto: 'does-not-exist-on-disk.jpg'
      }
    });

    await prisma.admission.update({
      where: { id: missingAdmission.id },
      data: { status: 'approved' }
    });

    const missingConvertRes = await fetch(`${HOST}/api/admissions/convert/${missingAdmission.id}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        classId: cls.id,
        sectionId: sec.id
      })
    });

    console.log(`Missing File Conversion Status: ${missingConvertRes.status}`);
    const missingConvertJson = await missingConvertRes.json() as any;
    if (missingConvertRes.status !== 200 || !missingConvertJson.success) {
      throw new Error(`Conversion with missing file failed: ${JSON.stringify(missingConvertJson)}`);
    }

    const missingStudent = missingConvertJson.data.student;
    // Check that student record field was set to null
    const missingDbStudent = await prisma.student.findUnique({ where: { id: missingStudent.id } }) as any;
    if (missingDbStudent.studentPhoto !== null) {
      throw new Error(`studentPhoto was not set to null for missing file. Got: ${missingDbStudent.studentPhoto}`);
    }
    console.log('Verified: Conversion succeeded despite missing file, and Student field set to null.');

    // Cleanup missing records
    await prisma.studentEnrollmentHistory.deleteMany({ where: { studentId: missingStudent.id } });
    await prisma.student.delete({ where: { id: missingStudent.id } });
    const missingParentRecord = await prisma.parent.findUnique({ where: { id: missingStudent.parentId } });
    const userIds = [missingStudent.userId, missingParentRecord?.userId].filter(Boolean) as string[];
    await prisma.parent.delete({ where: { id: missingStudent.parentId } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await prisma.admission.delete({ where: { id: missingAdmission.id } });

    console.log('\n=========================================');
    console.log('✅ ALL ADMISSION TO STUDENT DOCUMENT COPY TESTS PASSED!');
    console.log('=========================================');

  } finally {
    // Cleanup first test student and records
    if (testStudentId) {
      console.log('\nCleaning up first test student and parent database records...');
      await prisma.studentEnrollmentHistory.deleteMany({ where: { studentId: testStudentId } });
      await prisma.student.deleteMany({ where: { id: testStudentId } });
    }
    if (testParentId) {
      await prisma.parent.deleteMany({ where: { id: testParentId } });
    }
    const userEmails = [];
    if (testStudentUserId) {
      const u = await prisma.user.findUnique({ where: { id: testStudentUserId } });
      if (u) userEmails.push(u.email);
    }
    if (testParentUserId) {
      const u = await prisma.user.findUnique({ where: { id: testParentUserId } });
      if (u) userEmails.push(u.email);
    }
    if (userEmails.length > 0) {
      await prisma.user.deleteMany({ where: { email: { in: userEmails } } });
    }
    if (testAdmissionId) {
      await prisma.admission.deleteMany({ where: { id: testAdmissionId } });
    }
    console.log('Cleanup completed.');
  }
}

run()
  .catch((err) => {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
  });
