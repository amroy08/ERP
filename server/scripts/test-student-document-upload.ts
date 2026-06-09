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
  console.log('--- STARTING STUDENT DOCUMENT UPLOAD BACKEND TEST ---');

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

  // Create temporary student and users for testing
  const testStudentNum = `STU-TEST-${Date.now()}`;
  console.log(`Creating test users and student record ${testStudentNum}...`);
  
  const studentUser = await prisma.user.create({
    data: {
      name: 'Test Student',
      email: `test.student.${Date.now()}@school.local`,
      password: 'StudentPassword@123',
      role: 'student',
      schoolId: school.id
    }
  });

  const parentUser = await prisma.user.create({
    data: {
      name: 'Test Parent',
      email: `test.parent.${Date.now()}@school.local`,
      password: 'ParentPassword@123',
      role: 'parent',
      schoolId: school.id
    }
  });

  const parent = await prisma.parent.create({
    data: {
      userId: parentUser.id,
      fatherName: 'Father Upload Test',
      fatherPhone: '9876543219',
      schoolId: school.id
    }
  });

  const student = await prisma.student.create({
    data: {
      userId: studentUser.id,
      admissionNumber: testStudentNum,
      firstName: 'TestUpload',
      lastName: 'Student',
      fullName: 'TestUpload Student',
      dateOfBirth: new Date('2015-05-15'),
      gender: 'male',
      classId: cls.id,
      sectionId: sec.id,
      academicYearId: ay.id,
      schoolId: school.id,
      parentId: parent.id,
      status: 'active'
    }
  });
  console.log(`Created test Student ID: ${student.id}`);

  const privateUploadPath = path.resolve(process.cwd(), 'private_uploads', 'students');

  try {
    // Test 1: Upload a PDF file
    console.log('\n--- Test 1: Upload PDF document ---');
    const pdfBlob = new Blob(['Dummy PDF Content'], { type: 'application/pdf' });
    const pdfForm = new FormData();
    pdfForm.append('file', pdfBlob, 'test-doc.pdf');

    const uploadPdfRes = await fetch(`${HOST}/api/students/${student.id}/documents/birthCertificateDoc`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: pdfForm
    });

    const uploadPdfJson = await uploadPdfRes.json() as any;
    console.log(`Upload PDF Status: ${uploadPdfRes.status}`);
    console.log('Upload PDF Response:', JSON.stringify(uploadPdfJson));

    if (uploadPdfRes.status !== 200 || !uploadPdfJson.success) {
      throw new Error('Failed to upload PDF birth certificate.');
    }

    const birthCertFileName = uploadPdfJson.data.fileName;
    console.log(`Uploaded file name in response: ${birthCertFileName}`);

    // Verify file exists on disk
    const diskPathPdf = path.join(privateUploadPath, birthCertFileName);
    console.log(`Verifying file exists on disk at: ${diskPathPdf}`);
    if (!fs.existsSync(diskPathPdf)) {
      throw new Error(`File was not found on disk at ${diskPathPdf}`);
    }
    console.log('Verified: File exists on disk.');

    // Verify DB field updated
    const updatedStudent1 = await prisma.student.findUnique({ where: { id: student.id } }) as any;
    if (updatedStudent1?.birthCertificateDoc !== birthCertFileName) {
      throw new Error(`DB not updated. Found birthCertificateDoc: ${updatedStudent1?.birthCertificateDoc}`);
    }
    console.log(`Verified: DB record matches uploaded filename: ${updatedStudent1?.birthCertificateDoc}`);


    // Test 2: Upload a JPEG file and test overwrite/delete logic
    console.log('\n--- Test 2: Upload student photo (JPEG) ---');
    const imgBlob = new Blob(['Dummy Image Data'], { type: 'image/jpeg' });
    const imgForm = new FormData();
    imgForm.append('file', imgBlob, 'photo.jpg');

    const uploadImgRes = await fetch(`${HOST}/api/students/${student.id}/documents/studentPhoto`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: imgForm
    });

    const uploadImgJson = await uploadImgRes.json() as any;
    console.log(`Upload Image Status: ${uploadImgRes.status}`);
    if (uploadImgRes.status !== 200 || !uploadImgJson.success) {
      throw new Error('Failed to upload student photo.');
    }
    const photoFileName = uploadImgJson.data.fileName;
    const photoRelativePath = `private_uploads/students/${photoFileName}`;
    console.log(`Uploaded photo file name: ${photoFileName}`);


    // Test 3: Download uploaded files
    console.log('\n--- Test 3: Download student photo ---');
    const downloadRes = await fetch(`${HOST}/api/students/${student.id}/documents/studentPhoto`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log(`Download status: ${downloadRes.status}`);
    console.log('Download Headers:', {
      'content-type': downloadRes.headers.get('content-type'),
      'content-disposition': downloadRes.headers.get('content-disposition')
    });

    if (downloadRes.status !== 200) {
      throw new Error('Failed to download student photo.');
    }
    if (downloadRes.headers.get('content-type') !== 'image/jpeg') {
      throw new Error(`Wrong content-type header: ${downloadRes.headers.get('content-type')}`);
    }
    const downloadText = await downloadRes.text();
    if (downloadText !== 'Dummy Image Data') {
      throw new Error(`File content mismatch! Got: ${downloadText}`);
    }
    console.log('Verified: Download returns exact original content and correct headers.');


    // Test 4: Overwrite existing document type and ensure old file is deleted from disk
    console.log('\n--- Test 4: Overwrite student photo and check old file deletion ---');
    const newImgBlob = new Blob(['New Dummy Image Data'], { type: 'image/jpeg' });
    const newImgForm = new FormData();
    newImgForm.append('file', newImgBlob, 'new-photo.jpg');

    const overwriteRes = await fetch(`${HOST}/api/students/${student.id}/documents/studentPhoto`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: newImgForm
    });

    const overwriteJson = await overwriteRes.json() as any;
    console.log(`Overwrite status: ${overwriteRes.status}`);
    if (overwriteRes.status !== 200 || !overwriteJson.success) {
      throw new Error('Failed to overwrite student photo.');
    }
    const newPhotoFileName = overwriteJson.data.fileName;
    const newPhotoRelativePath = `private_uploads/students/${newPhotoFileName}`;

    // The old file should be deleted on disk
    const oldPhotoDiskPath = path.join(privateUploadPath, photoFileName);
    console.log(`Checking if old photo file is deleted on disk: ${oldPhotoDiskPath}`);
    if (fs.existsSync(oldPhotoDiskPath)) {
      throw new Error('Old photo file was NOT deleted from server disk after overwrite.');
    }
    console.log('Verified: Old file deleted from disk successfully.');

    // The new file should exist
    const newPhotoDiskPath = path.join(privateUploadPath, newPhotoFileName);
    if (!fs.existsSync(newPhotoDiskPath)) {
      throw new Error('New photo file was NOT found on disk.');
    }
    console.log('Verified: New file created on disk successfully.');


    // Test 5: Try invalid file type (validation check)
    console.log('\n--- Test 5: Upload invalid file type (.txt) ---');
    const textBlob = new Blob(['Some text info'], { type: 'text/plain' });
    const textForm = new FormData();
    textForm.append('file', textBlob, 'notes.txt');

    const invalidTypeRes = await fetch(`${HOST}/api/students/${student.id}/documents/studentPhoto`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: textForm
    });
    const invalidTypeJson = await invalidTypeRes.json() as any;
    console.log(`Status (Expected 400): ${invalidTypeRes.status}`);
    console.log('Response:', JSON.stringify(invalidTypeJson));
    if (invalidTypeRes.status !== 400 || invalidTypeJson.success) {
      throw new Error('Server accepted text/plain file where it should reject it.');
    }
    console.log('Verified: Invalid file types correctly rejected.');


    // Test 6: Try upload of too large file (limit validation check)
    console.log('\n--- Test 6: Upload large file (> 5MB limit) ---');
    const largeBlob = new Blob([new Uint8Array(6 * 1024 * 1024)], { type: 'application/pdf' });
    const largeForm = new FormData();
    largeForm.append('file', largeBlob, 'huge.pdf');

    const largeFileRes = await fetch(`${HOST}/api/students/${student.id}/documents/studentAadhaarDoc`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: largeForm
    });
    const largeFileJson = await largeFileRes.json() as any;
    console.log(`Status (Expected 400): ${largeFileRes.status}`);
    console.log('Response:', JSON.stringify(largeFileJson));
    if (largeFileRes.status !== 400 || largeFileJson.success) {
      throw new Error('Server accepted > 5MB file where it should reject it.');
    }
    if (!largeFileJson.message.includes('too large')) {
      throw new Error(`Unexpected message: ${largeFileJson.message}`);
    }
    console.log('Verified: File size limits correctly enforced with a clean error.');


    // Test 7: Unauthorized upload (no authorization headers or invalid token)
    console.log('\n--- Test 7: Unauthorized upload attempt ---');
    const unauthRes = await fetch(`${HOST}/api/students/${student.id}/documents/studentPhoto`, {
      method: 'POST',
      body: newImgForm
    });
    console.log(`Status (Expected 401): ${unauthRes.status}`);
    if (unauthRes.status !== 401) {
      throw new Error('Accepted upload request without authentication.');
    }
    console.log('Verified: Unauthorized uploads blocked.');


    // Test 8: Attempt access of documents belonging to another student ID or with invalid params
    console.log('\n--- Test 8: Access invalid document types / invalid student IDs ---');
    const invalidDocTypeRes = await fetch(`${HOST}/api/students/${student.id}/documents/notARealDocType`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`Invalid doc type GET status (Expected 400): ${invalidDocTypeRes.status}`);
    if (invalidDocTypeRes.status !== 400) {
      throw new Error(`Expected status 400 but got ${invalidDocTypeRes.status}`);
    }

    const invalidStudentIdRes = await fetch(`${HOST}/api/students/non-existent-uuid/documents/studentPhoto`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`Invalid student ID GET status (Expected 404/400): ${invalidStudentIdRes.status}`);
    if (invalidStudentIdRes.status !== 404 && invalidStudentIdRes.status !== 400) {
      throw new Error(`Expected status 404 or 400 but got ${invalidStudentIdRes.status}`);
    }
    console.log('Verified: Param validation is robust.');


    // Test 9: Delete documents and verify clean removal
    console.log('\n--- Test 9: Delete documents ---');
    // Delete studentPhoto
    const deletePhotoRes = await fetch(`${HOST}/api/students/${student.id}/documents/studentPhoto`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    const deletePhotoJson = await deletePhotoRes.json() as any;
    console.log(`Delete photo status: ${deletePhotoRes.status}`);
    if (deletePhotoRes.status !== 200 || !deletePhotoJson.success) {
      throw new Error('Failed to delete studentPhoto document.');
    }

    // Verify file deleted from disk
    if (fs.existsSync(newPhotoDiskPath)) {
      throw new Error('Photo file was NOT deleted from server disk after DELETE request.');
    }
    console.log('Verified: File deleted from disk on delete.');

    // Verify DB field set to null
    const updatedStudent2 = await prisma.student.findUnique({ where: { id: student.id } }) as any;
    if (updatedStudent2?.studentPhoto !== null) {
      throw new Error(`DB field studentPhoto not set to null, value is: ${updatedStudent2?.studentPhoto}`);
    }
    console.log('Verified: DB field is set to null after DELETE.');

    // Delete birthCertificateDoc
    const deleteCertRes = await fetch(`${HOST}/api/students/${student.id}/documents/birthCertificateDoc`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`Delete birth cert status: ${deleteCertRes.status}`);
    if (deleteCertRes.status !== 200) {
      throw new Error('Failed to delete birthCertificateDoc.');
    }

    // Verify file deleted from disk
    if (fs.existsSync(diskPathPdf)) {
      throw new Error('Birth certificate file was NOT deleted from server disk.');
    }
    console.log('Verified: Birth certificate file deleted from disk on delete.');

    const updatedStudent3 = await prisma.student.findUnique({ where: { id: student.id } }) as any;
    if (updatedStudent3?.birthCertificateDoc !== null) {
      throw new Error(`DB field birthCertificateDoc not null: ${updatedStudent3?.birthCertificateDoc}`);
    }
    console.log('Verified: DB field is set to null.');


    console.log('\n=========================================');
    console.log('✅ ALL BACKEND STUDENT DOCUMENT TESTS PASSED!');
    console.log('=========================================');

  } finally {
    // Cleanup student and user records
    console.log('\nCleaning up test student, parent, and user records from database...');
    await prisma.student.deleteMany({ where: { id: student.id } });
    await prisma.parent.deleteMany({ where: { id: parent.id } });
    await prisma.user.deleteMany({ where: { id: { in: [studentUser.id, parentUser.id] } } });
    console.log('Cleaned up test student and user records.');
  }
}

run()
  .catch((err) => {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
  });
