import prisma from '../src/config/prisma';
import { AdmissionService } from '../src/services/AdmissionService';
import bcrypt from 'bcryptjs';

async function test() {
  console.log('--- RUNNING EXTENDED FIELDS API & SERVICE AUDIT ---');

  // Find class, section and academic year
  const cls = await prisma.class.findFirst();
  const sec = await prisma.section.findFirst();
  const ay = await prisma.academicYear.findFirst();
  const school = await prisma.school.findFirst();

  if (!cls || !sec || !ay || !school) {
    throw new Error('Pre-requisite data not found in DB. Make sure seed is run.');
  }

  // 1. Create a new admission application with new extended optional fields
  const applicationNo = `ADM-TEST-${Date.now()}`;
  console.log(`1. Creating admission with application number: ${applicationNo}...`);

  const admissionData = {
    applicationNo,
    firstName: 'Johnny',
    lastName: 'Appleseed',
    dateOfBirth: new Date('2018-04-12'),
    gender: 'male' as any,
    classId: cls.id,
    academicYearId: ay.id,
    schoolId: school.id,
    parentName: 'Mr. Appleseed Senior',
    parentPhone: '9988776655',
    parentEmail: `appleseed.${Date.now()}@test.com`,

    // Extended Student Fields
    middleName: 'Middle',
    bloodGroup: 'O+',
    religion: 'Christianity',
    category: 'general',
    nationality: 'American',
    motherTongue: 'English',

    // Academic Fields
    previousBoard: 'US Board',
    lastClassAttended: 'Preschool',
    previousMarks: 94.5,
    transferCertificateNo: 'TC-12345',
    admissionSource: 'Website',

    // Father Fields
    fatherName: 'Father Appleseed',
    fatherPhone: '9988776601',
    fatherEmail: 'father.appleseed@test.com',
    fatherOccupation: 'Engineer',
    fatherQualification: 'M.Tech',
    fatherAnnualIncome: 120000,
    fatherAadhaar: '123412341234',
    fatherOfficeAddress: '123 Tech Park',

    // Mother Fields
    motherName: 'Mother Appleseed',
    motherPhone: '9988776602',
    motherEmail: 'mother.appleseed@test.com',
    motherOccupation: 'Doctor',
    motherQualification: 'MD',
    motherAnnualIncome: 150000,
    motherAadhaar: '432143214321',
    motherOfficeAddress: '456 General Hospital',

    // Guardian/Emergency Fields
    guardianRelationship: 'Uncle',
    guardianOccupation: 'Lawyer',
    guardianAddress: '789 Legal St',
    emergencyContactName: 'Uncle Appleseed',
    emergencyContactPhone: '9988776603',

    // Address Fields
    addressStreet: '123 Main Street',
    addressCity: 'Springfield',
    addressState: 'Illinois',
    addressPincode: '62701',
    permanentAddressStreet: '456 Permanent St',
    permanentAddressCity: 'Springfield',
    permanentAddressState: 'Illinois',
    permanentAddressPincode: '62701',

    // Medical/Additional
    medicalCondition: 'Mild Asthma',
    allergies: 'Peanuts',
    specialNeeds: 'None',
    transportRequired: true,
    hostelRequired: false,

    // Documents placeholders
    studentPhoto: '/uploads/photos/johnny.jpg',
    birthCertificateDoc: '/uploads/docs/bc.pdf',
    studentAadhaarDoc: '/uploads/docs/sa.pdf',
    parentAadhaarDoc: '/uploads/docs/pa.pdf',
    transferCertificateDoc: '/uploads/docs/tc.pdf',
    previousMarksCardDoc: '/uploads/docs/mc.pdf',

    status: 'approved',
    sectionId: sec.id
  };

  const createdAdmission = await prisma.admission.create({
    data: admissionData
  });

  console.log('✅ Admission created with extended fields successfully!');
  
  // Verify fields are present in database
  if (createdAdmission.middleName !== 'Middle' || 
      createdAdmission.previousMarks !== 94.5 || 
      createdAdmission.fatherAnnualIncome !== 120000 ||
      createdAdmission.transportRequired !== true) {
    throw new Error('Verification failed: New optional fields value mismatch in created record.');
  }
  console.log('✅ Admission fields verified in created record!');

  // 2. Test Admission Conversion to Student
  console.log('2. Converting admission to active Student & Parent records...');
  
  const conversionResult = await AdmissionService.convertToStudent(
    createdAdmission.id,
    'test-runner-id',
    { classId: cls.id, sectionId: sec.id },
    school.id
  );

  console.log('✅ Conversion transaction executed successfully!');

  // Verify Student details mapped correctly
  const student = await prisma.student.findUnique({
    where: { id: conversionResult.student.id },
    include: { parent: true }
  });

  if (!student) throw new Error('Student record not created after conversion.');
  
  console.log('3. Verifying Student fields mapping:');
  console.log(`- Blood Group (O+): ${student.bloodGroup}`);
  console.log(`- Religion (Christianity): ${student.religion}`);
  console.log(`- Category (general): ${student.category}`);
  console.log(`- Address Street (123 Main Street): ${student.addressStreet}`);
  console.log(`- Address City (Springfield): ${student.addressCity}`);
  console.log(`- Emergency Name (Uncle Appleseed): ${student.emergencyName}`);
  console.log(`- Emergency Phone (9988776603): ${student.emergencyPhone}`);
  console.log(`- Emergency Rel (Uncle): ${student.emergencyRel}`);
  
  const expectedMedicalNote = `Condition: Mild Asthma\nAllergies: Peanuts\nSpecial Needs: None`;
  console.log(`- Medical Note:\n${student.medicalNote}`);

  if (student.bloodGroup !== 'O+' || 
      student.religion !== 'Christianity' || 
      student.category !== 'general' ||
      student.addressStreet !== '123 Main Street' ||
      student.addressCity !== 'Springfield' ||
      student.emergencyName !== 'Uncle Appleseed' ||
      student.emergencyPhone !== '9988776603' ||
      student.emergencyRel !== 'Uncle' ||
      student.medicalNote !== expectedMedicalNote) {
    throw new Error('Verification failed: Student mapped fields value mismatch.');
  }

  // Verify Parent details mapped correctly
  console.log('4. Verifying Parent fields mapping:');
  const parent = student.parent;
  console.log(`- Father Name (Father Appleseed): ${parent.fatherName}`);
  console.log(`- Father Occupation (Engineer): ${parent.fatherOccupation}`);
  console.log(`- Mother Name (Mother Appleseed): ${parent.motherName}`);
  console.log(`- Mother Occupation (Doctor): ${parent.motherOccupation}`);
  console.log(`- Annual Income (120000): ${parent.annualIncome}`);
  console.log(`- Parent Address: ${parent.address}`);

  if (parent.fatherName !== 'Father Appleseed' ||
      parent.fatherOccupation !== 'Engineer' ||
      parent.motherName !== 'Mother Appleseed' ||
      parent.motherOccupation !== 'Doctor' ||
      parent.annualIncome !== 120000 ||
      !parent.address?.includes('123 Main Street')) {
    throw new Error('Verification failed: Parent mapped fields value mismatch.');
  }

  console.log('✅ ALL MAPPING VERIFICATIONS PASSED SUCCESSFULLY!');
}

test()
  .then(() => console.log('--- TEST EXECUTION COMPLETED SUCCESSFULLY ---'))
  .catch((err) => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  });
