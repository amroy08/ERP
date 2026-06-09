import prisma from '../src/config/prisma';
import { createSubject, updateSubject, getSubjects, createHomework } from '../src/controllers/moduleController';
import { getDashboardStats } from '../src/controllers/dashboardController';
import { AuthRequest } from '../src/middleware/authMiddleware';
import { Response } from 'express';

// Helper to mock Express Response
function mockResponse(): Response {
  const res: any = {};
  res.statusCode = 200;
  res.headers = {};
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data: any) => {
    res.jsonData = data;
    return res;
  };
  res.setHeader = (name: string, value: string) => {
    res.headers[name] = value;
    return res;
  };
  return res as Response;
}

// Helper to mock NextFunction for successful operations
function mockNext() {
  return (err?: any) => {
    if (err) {
      throw err;
    }
  };
}

// Helper to assert async functions throw errors with expected status code and message substring
async function assertThrows(fn: () => Promise<any>, expectedStatusCode: number, expectedMessageSubstring: string) {
  let threw = false;
  try {
    await fn();
  } catch (err: any) {
    threw = true;
    const code = err.statusCode || err.status || 500;
    if (code !== expectedStatusCode) {
      throw new Error(`Expected status code ${expectedStatusCode}, got ${code}. Message: ${err.message}`);
    }
    if (!err.message.toLowerCase().includes(expectedMessageSubstring.toLowerCase())) {
      throw new Error(`Expected message to contain "${expectedMessageSubstring}", got "${err.message}"`);
    }
  }
  if (!threw) {
    throw new Error('Expected operation to throw, but it succeeded');
  }
}

async function runTests() {
  console.log('--- RUNNING SECTION-WISE SUBJECT TEACHER TESTS ---');

  // Fetch prerequisite data (School, AcademicYear, Class, Sections, Teachers)
  const school = await prisma.school.findFirst();
  if (!school) throw new Error('No school found in database');

  let ay = await prisma.academicYear.findFirst({
    where: { isCurrent: true, schoolId: school.id }
  });
  if (!ay) {
    const anyAy = await prisma.academicYear.findFirst({ where: { schoolId: school.id } });
    if (anyAy) {
      ay = await prisma.academicYear.update({
        where: { id: anyAy.id },
        data: { isCurrent: true }
      });
    } else {
      ay = await prisma.academicYear.create({
        data: {
          name: '2026-2027',
          startDate: new Date('2026-06-01'),
          endDate: new Date('2027-05-31'),
          isCurrent: true,
          schoolId: school.id
        }
      });
    }
  }

  // Find or create Class and Sections
  let cls = await prisma.class.findFirst({
    where: { schoolId: school.id },
    include: { sections: true }
  });

  if (!cls) {
    cls = await prisma.class.create({
      data: {
        name: 'Test Class 9',
        numericValue: 9,
        schoolId: school.id
      },
      include: { sections: true }
    });
  }

  let sectionA = cls.sections.find(s => s.name === 'A');
  let sectionB = cls.sections.find(s => s.name === 'B');

  if (!sectionA) {
    sectionA = await prisma.section.create({
      data: { name: 'A', classId: cls.id, schoolId: school.id }
    });
  }
  if (!sectionB) {
    sectionB = await prisma.section.create({
      data: { name: 'B', classId: cls.id, schoolId: school.id }
    });
  }

  // Find or create at least two Teachers
  const existingTeachers = await prisma.teacher.findMany({
    where: { schoolId: school.id },
    include: { user: true },
    take: 2
  });

  let teacher1 = existingTeachers[0];
  let teacher2 = existingTeachers[1];

  if (!teacher1) {
    const user1 = await prisma.user.create({
      data: {
        email: `t1.${Date.now()}@test.com`,
        password: 'Password@123',
        name: 'Teacher One',
        role: 'teacher',
        schoolId: school.id
      }
    });
    teacher1 = await prisma.teacher.create({
      data: {
        userId: user1.id,
        employeeId: `EMP-${Date.now()}-1`,
        designation: 'Math Teacher',
        qualification: 'B.Ed',
        joiningDate: new Date(),
        schoolId: school.id
      },
      include: { user: true }
    });
  }

  if (!teacher2) {
    const user2 = await prisma.user.create({
      data: {
        email: `t2.${Date.now()}@test.com`,
        password: 'Password@123',
        name: 'Teacher Two',
        role: 'teacher',
        schoolId: school.id
      }
    });
    teacher2 = await prisma.teacher.create({
      data: {
        userId: user2.id,
        employeeId: `EMP-${Date.now()}-2`,
        designation: 'Science Teacher',
        qualification: 'B.Ed',
        joiningDate: new Date(),
        schoolId: school.id
      },
      include: { user: true }
    });
  }

  // Create an Admin user for auth requests
  const adminUser = await prisma.user.findFirst({
    where: { role: 'admin', schoolId: school.id }
  }) || await prisma.user.create({
    data: {
      email: `admin.${Date.now()}@test.com`,
      password: 'Password@123',
      name: 'Admin Test',
      role: 'admin',
      schoolId: school.id
    }
  });

  const subjectCode = `MATH-TEST-${Date.now()}`;
  let testSubjectId: string | null = null;

  // Pre-cleanup in case of leftover Mathematics Test records
  const leftoverSubjects = await prisma.subject.findMany({
    where: { name: 'Mathematics Test', classId: cls.id }
  });
  const leftoverSubjectIds = leftoverSubjects.map(s => s.id);
  if (leftoverSubjectIds.length > 0) {
    await prisma.homework.deleteMany({
      where: { subjectId: { in: leftoverSubjectIds } }
    });
    await prisma.subject.deleteMany({
      where: { id: { in: leftoverSubjectIds } }
    });
  }

  try {
    // ----------------------------------------------------
    // TEST 1: Create subject with section assignments
    // ----------------------------------------------------
    console.log('Test 1: Creating subject with section-teacher assignments...');
    const reqCreate = {
      body: {
        name: 'Mathematics Test',
        code: subjectCode,
        classId: cls.id,
        isOptional: false,
        assignments: [
          { sectionId: sectionA.id, teacherId: teacher1.id },
          { sectionId: sectionB.id, teacherId: teacher2.id }
        ]
      },
      user: adminUser
    } as any as AuthRequest;

    const resCreate = mockResponse();
    await createSubject(reqCreate, resCreate, mockNext());

    const createdData = (resCreate as any).jsonData;
    if (!createdData || !createdData.success) {
      throw new Error(`Subject creation failed: ${JSON.stringify(createdData)}`);
    }

    testSubjectId = createdData.data.id;
    console.log(`✅ Subject created successfully! ID: ${testSubjectId}`);

    // Verify DB assignments
    const dbAssignments = await prisma.subjectTeacher.findMany({
      where: { subjectId: testSubjectId! },
      include: { section: true, teacher: { include: { user: true } } }
    });

    if (dbAssignments.length !== 2) {
      throw new Error(`Expected 2 SubjectTeacher assignments, found ${dbAssignments.length}`);
    }

    const mapA = dbAssignments.find(a => a.sectionId === sectionA.id);
    const mapB = dbAssignments.find(a => a.sectionId === sectionB.id);

    if (!mapA || mapA.teacherId !== teacher1.id) throw new Error('Section A assignment mismatch');
    if (!mapB || mapB.teacherId !== teacher2.id) throw new Error('Section B assignment mismatch');
    console.log('✅ Section assignments verified in database!');

    // ----------------------------------------------------
    // TEST 2: getSubjects returns correct assignments
    // ----------------------------------------------------
    console.log('Test 2: Verifying getSubjects includes subjectTeachers relation...');
    const reqGet = { user: adminUser } as any as AuthRequest;
    const resGet = mockResponse();
    await getSubjects(reqGet, resGet, mockNext());

    const getResult = (resGet as any).jsonData;
    if (!getResult || !getResult.success) {
      throw new Error('getSubjects failed');
    }

    const fetchedSubject = getResult.data.find((s: any) => s.id === testSubjectId);
    if (!fetchedSubject || !fetchedSubject.subjectTeachers || fetchedSubject.subjectTeachers.length !== 2) {
      throw new Error('Fetched subject does not contain subjectTeachers list or length mismatch');
    }
    console.log('✅ getSubjects verified successfully!');

    // ----------------------------------------------------
    // TEST 3: Update assignments (replace/modify)
    // ----------------------------------------------------
    console.log('Test 3: Updating assignments (moving Sec A to Teacher 2, removing Sec B)...');
    const reqUpdate = {
      params: { id: testSubjectId! },
      body: {
        assignments: [
          { sectionId: sectionA.id, teacherId: teacher2.id }
        ]
      },
      user: adminUser
    } as any as AuthRequest;

    const resUpdate = mockResponse();
    await updateSubject(reqUpdate, resUpdate, mockNext());

    const updatedData = (resUpdate as any).jsonData;
    if (!updatedData || !updatedData.success) {
      throw new Error('Update subject failed');
    }

    const updatedAssignments = await prisma.subjectTeacher.findMany({
      where: { subjectId: testSubjectId! }
    });

    if (updatedAssignments.length !== 1) {
      throw new Error(`Expected exactly 1 assignment, found ${updatedAssignments.length}`);
    }
    if (updatedAssignments[0].sectionId !== sectionA.id || updatedAssignments[0].teacherId !== teacher2.id) {
      throw new Error('Update verification failed: Section A teacher was not updated properly');
    }
    console.log('✅ Subject assignments update verified successfully!');

    // ----------------------------------------------------
    // TEST 4: Validation checks (duplicate protection, class mismatch)
    // ----------------------------------------------------
    console.log('Test 4.1: Verifying duplicate section block...');
    await assertThrows(async () => {
      const reqDup = {
        body: {
          name: 'Math Dup Test',
          code: `${subjectCode}-dup`,
          classId: cls.id,
          assignments: [
            { sectionId: sectionA.id, teacherId: teacher1.id },
            { sectionId: sectionA.id, teacherId: teacher2.id }
          ]
        },
        user: adminUser
      } as any as AuthRequest;
      const resDup = mockResponse();
      await createSubject(reqDup, resDup, (err) => { if (err) throw err; });
    }, 400, 'Duplicate section assignment');
    console.log('✅ Duplicate section block verified!');

    console.log('Test 4.2: Verifying section mismatch check...');
    const otherClass = await prisma.class.create({
      data: { name: 'Other Class', numericValue: 10, schoolId: school.id }
    });
    const otherSection = await prisma.section.create({
      data: { name: 'Z', classId: otherClass.id, schoolId: school.id }
    });

    try {
      await assertThrows(async () => {
        const reqMismatch = {
          body: {
            name: 'Math Class Mismatch Test',
            code: `${subjectCode}-mismatch`,
            classId: cls.id,
            assignments: [
              { sectionId: otherSection.id, teacherId: teacher1.id }
            ]
          },
          user: adminUser
        } as any as AuthRequest;
        const resMismatch = mockResponse();
        await createSubject(reqMismatch, resMismatch, (err) => { if (err) throw err; });
      }, 400, 'not found in this class');
      console.log('✅ Section class mismatch block verified!');
    } finally {
      await prisma.section.delete({ where: { id: otherSection.id } });
      await prisma.class.delete({ where: { id: otherClass.id } });
    }

    // ----------------------------------------------------
    // TEST 5: Homework Authorization
    // ----------------------------------------------------
    console.log('Test 5: Verifying homework authorization policies...');
    // Assign Teacher 1 to Section A for testSubject
    await prisma.subjectTeacher.deleteMany({ where: { subjectId: testSubjectId! } });
    await prisma.subjectTeacher.create({
      data: {
        schoolId: school.id,
        academicYearId: ay.id,
        subjectId: testSubjectId!,
        sectionId: sectionA.id,
        teacherId: teacher1.id
      }
    });

    // 5.1 Teacher 1 creates homework for assigned Section A -> Should PASS
    console.log('- Teacher 1 assigns homework for Section A (assigned) -> Expecting SUCCESS');
    const reqHw1 = {
      body: {
        title: 'Math Homework Sec A',
        description: 'Solve equations',
        classId: cls.id,
        sectionId: sectionA.id,
        subjectId: testSubjectId!,
        dueDate: new Date(Date.now() + 86400000)
      },
      user: teacher1.user
    } as any as AuthRequest;
    const resHw1 = mockResponse();
    await createHomework(reqHw1, resHw1, mockNext());
    const hwCreated = (resHw1 as any).jsonData;
    if (!hwCreated || !hwCreated.success) throw new Error('Teacher 1 could not assign homework to assigned Section A');
    console.log('✅ Teacher 1 homework assignment passed!');

    // 5.2 Teacher 1 creates homework for unassigned Section B -> Should FAIL (403)
    console.log('- Teacher 1 assigns homework for Section B (unassigned) -> Expecting 403 Forbidden');
    await assertThrows(async () => {
      const reqHw2 = {
        body: {
          title: 'Math Homework Sec B',
          description: 'Solve equations',
          classId: cls.id,
          sectionId: sectionB.id,
          subjectId: testSubjectId!,
          dueDate: new Date(Date.now() + 86400000)
        },
        user: teacher1.user
      } as any as AuthRequest;
      const resHw2 = mockResponse();
      await createHomework(reqHw2, resHw2, (err: any) => { if (err) throw err; });
    }, 403, 'Unauthorized');
    console.log('✅ Unassigned teacher block verified!');

    // 5.3 Admin creates homework for Section B -> Should PASS
    console.log('- Admin assigns homework for Section B -> Expecting SUCCESS');
    const reqHwAdmin = {
      body: {
        title: 'Math Homework Sec B Admin',
        description: 'Solve equations',
        classId: cls.id,
        sectionId: sectionB.id,
        subjectId: testSubjectId!,
        dueDate: new Date(Date.now() + 86400000)
      },
      user: { ...teacher1.user, role: 'admin' } // Satisfy teacher-lookup by user id, but override role to admin
    } as any as AuthRequest;
    const resHwAdmin = mockResponse();
    await createHomework(reqHwAdmin, resHwAdmin, mockNext());
    const hwAdmin = (resHwAdmin as any).jsonData;
    if (!hwAdmin || !hwAdmin.success) throw new Error('Admin homework creation failed');
    console.log('✅ Admin homework bypass verified!');

    // ----------------------------------------------------
    // TEST 6: Dashboard stats subject count verification
    // ----------------------------------------------------
    console.log('Test 6: Verifying teacher dashboard subject counts...');
    const reqDash = {
      user: teacher1.user
    } as any as AuthRequest;
    const resDash = mockResponse();
    await getDashboardStats(reqDash, resDash, mockNext());

    const dashData = (resDash as any).jsonData;
    if (!dashData || !dashData.success || !dashData.data.teacherStats) {
      throw new Error('Dashboard stats fetching failed');
    }

    const { totalSubjects } = dashData.data.teacherStats;
    console.log(`- Teacher 1 dashboard totalSubjects count: ${totalSubjects}`);
    if (totalSubjects <= 0) {
      throw new Error('Expected dashboard subject count to include section-wise assigned subject');
    }
    console.log('✅ Teacher dashboard stats verified successfully!');

  } finally {
    if (testSubjectId) {
      console.log('Cleaning up test homework and subject...');
      await prisma.homework.deleteMany({ where: { subjectId: testSubjectId } }).catch(console.error);
      await prisma.subject.delete({ where: { id: testSubjectId } }).catch(console.error);
    }
  }

  console.log('--- ALL TESTS COMPLETED SUCCESSFULLY ---');
}

runTests()
  .then(() => {
    console.log('✅ SECTION SUBJECT TEACHER TEST RUN COMPLETED WITH SUCCESS!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Test execution failed with error:', err);
    process.exit(1);
  });
