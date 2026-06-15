import prisma from '../src/config/prisma';

async function main() {
  console.log('================================================================');
  console.log('        SEEDING MOBILE ACADEMIC DEMO DATA');
  console.log('================================================================\n');

  // 1. Fetch existing users
  const studentUser = await prisma.user.findFirst({
    where: { email: 'student@school.com' },
    include: { student: true }
  });

  const parentUser = await prisma.user.findFirst({
    where: { email: 'parent@school.com' },
    include: { parent: true }
  });

  const teacherUser = await prisma.user.findFirst({
    where: { email: 'teacher@school.com' },
    include: { teacher: true }
  });

  if (!studentUser || !studentUser.student) {
    throw new Error('Student user (student@school.com) not found! Ensure database is seeded first.');
  }
  if (!parentUser || !parentUser.parent) {
    throw new Error('Parent user (parent@school.com) not found! Ensure database is seeded first.');
  }
  if (!teacherUser || !teacherUser.teacher) {
    throw new Error('Teacher user (teacher@school.com) not found! Ensure database is seeded first.');
  }

  const student = studentUser.student;
  const parent = parentUser.parent;
  const teacher = teacherUser.teacher;

  const classId = student.classId;
  const sectionId = student.sectionId as string;
  const schoolId = (student.schoolId || teacher.schoolId) as string;
  const academicYearId = student.academicYearId as string;

  if (!classId || !student.sectionId) {
    throw new Error('Student does not have an assigned classId or sectionId!');
  }
  if (!schoolId) {
    throw new Error('School ID not found on student or teacher!');
  }
  if (!academicYearId) {
    throw new Error('Student does not have an assigned academicYearId!');
  }

  console.log(`Targeting Student: ${student.fullName} (ID: ${student.id})`);
  console.log(`Class ID: ${classId} | Section ID: ${sectionId}`);
  console.log(`School ID: ${schoolId} | Academic Year ID: ${academicYearId}`);

  // Ensure student-parent link
  if (student.parentId !== parent.id) {
    console.log(`Linking student to parent (Parent ID: ${parent.id})...`);
    await prisma.student.update({
      where: { id: student.id },
      data: { parentId: parent.id }
    });
  }

  // Ensure subject exists (Mathematics preferred)
  let subject = await prisma.subject.findFirst({
    where: { classId, name: { contains: 'Mathematics' } }
  });

  if (!subject) {
    subject = await prisma.subject.findFirst({
      where: { classId }
    });
  }

  if (!subject) {
    console.log('Creating a demo Mathematics subject...');
    subject = await prisma.subject.create({
      data: {
        name: 'Mathematics',
        code: 'MATH101',
        type: 'theory',
        classId,
        schoolId,
        isActive: true
      }
    });
  }

  console.log(`Targeting Subject: ${subject.name} (ID: ${subject.id})`);

  // Ensure teacher-subject-section assignments exist, respecting the unique constraint:
  // subject_teachers_schoolId_academicYearId_subjectId_sectionId_key
  const existingSubjectTeacher = await prisma.subjectTeacher.findFirst({
    where: {
      schoolId,
      academicYearId,
      subjectId: subject.id,
      sectionId
    }
  });

  if (!existingSubjectTeacher) {
    console.log('Creating SubjectTeacher mapping...');
    await prisma.subjectTeacher.create({
      data: {
        teacherId: teacher.id,
        subjectId: subject.id,
        sectionId,
        academicYearId,
        schoolId,
        status: 'active'
      }
    });
  } else if (existingSubjectTeacher.teacherId !== teacher.id) {
    console.log('Updating SubjectTeacher mapping to point to teacher@school.com...');
    await prisma.subjectTeacher.update({
      where: { id: existingSubjectTeacher.id },
      data: { teacherId: teacher.id }
    });
  } else {
    console.log('SubjectTeacher mapping already correctly exists.');
  }

  // Ensure teacher is class teacher of the section
  const section = await prisma.section.findUnique({ where: { id: sectionId } });
  if (section && section.classTeacherId !== teacher.id) {
    console.log(`Assigning teacher as Class Teacher of Section ${section.name}...`);
    await prisma.section.update({
      where: { id: sectionId },
      data: { classTeacherId: teacher.id }
    });
  }

  // 2. Seed Timetable
  console.log('\n--- Seeding Timetable ---');
  let timetable = await prisma.timetable.findFirst({
    where: { sectionId, academicYearId }
  });

  if (!timetable) {
    console.log('Creating Timetable...');
    timetable = await prisma.timetable.create({
      data: {
        classId,
        sectionId,
        academicYearId,
        isActive: true,
        schoolId,
        notes: 'Class 1-A Main Timetable'
      }
    });
  }

  const daysOfWeek = ['Monday', 'Wednesday', 'Friday'];
  const periods = [
    { start: '09:00', end: '09:45', room: 'Room 101' },
    { start: '10:00', end: '10:45', room: 'Room 101' },
    { start: '11:00', end: '11:45', room: 'Room 102' }
  ];

  for (let i = 0; i < daysOfWeek.length; i++) {
    const day = daysOfWeek[i];
    const period = periods[i];
    const existingEntry = await prisma.timetableEntry.findFirst({
      where: {
        timetableId: timetable.id,
        day,
        startTime: period.start
      }
    });

    if (!existingEntry) {
      console.log(`Adding TimetableEntry: ${day} at ${period.start}`);
      await prisma.timetableEntry.create({
        data: {
          timetableId: timetable.id,
          day,
          subjectId: subject.id,
          teacherId: teacher.id,
          startTime: period.start,
          endTime: period.end,
          room: period.room
        }
      });
    }
  }

  // 3. Seed Homework
  console.log('\n--- Seeding Homework ---');
  const homeworkItems = [
    {
      title: 'Algebra Worksheet 1',
      description: 'Complete equations 1 to 10 on page 42. Show all working steps.',
      daysFromNow: -2, // Due in past (completed-like)
    },
    {
      title: 'Fractions Assignment',
      description: 'Solve the word problems attached. Focus on dividing mixed fractions.',
      daysFromNow: 1, // Due soon
    },
    {
      title: 'Geometry Project: Shapes',
      description: 'Create a cardboard model of three 3D shapes. Write their volume formulas.',
      daysFromNow: 5, // Upcoming
    }
  ];

  for (const item of homeworkItems) {
    const assignedDate = new Date();
    assignedDate.setDate(assignedDate.getDate() - 5);
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + item.daysFromNow);

    const existingHw = await prisma.homework.findFirst({
      where: {
        title: item.title,
        classId,
        subjectId: subject.id
      }
    });

    if (!existingHw) {
      console.log(`Creating Homework: "${item.title}"`);
      await prisma.homework.create({
        data: {
          title: item.title,
          description: item.description,
          classId,
          sectionId,
          subjectId: subject.id,
          assignedDate,
          dueDate,
          assignedById: teacher.id,
          schoolId
        }
      });
    }
  }

  // 4. Seed Exams
  console.log('\n--- Seeding Exams ---');
  const examsToCreate = [
    {
      name: 'Quarterly Mathematics Quiz',
      type: 'quiz',
      status: 'completed',
      daysFromNowStart: -10,
      daysFromNowEnd: -10,
      description: 'Assess basic concepts of standard operations.'
    },
    {
      name: 'First Term Examination',
      type: 'written',
      status: 'scheduled',
      daysFromNowStart: 15,
      daysFromNowEnd: 20,
      description: 'Main term examination covering lessons 1 to 5.'
    }
  ];

  const createdExams = [];
  for (const item of examsToCreate) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + item.daysFromNowStart);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + item.daysFromNowEnd);

    let exam = await prisma.exam.findFirst({
      where: {
        name: item.name,
        classId
      }
    });

    if (!exam) {
      console.log(`Creating Exam: "${item.name}"`);
      exam = await prisma.exam.create({
        data: {
          name: item.name,
          type: item.type,
          classId,
          academicYearId,
          startDate,
          endDate,
          status: item.status,
          description: item.description,
          schoolId
        }
      });
    }
    createdExams.push(exam);
  }

  // 5. Seed Results/Marks
  console.log('\n--- Seeding Results ---');
  const resultsToCreate = [
    {
      examName: 'Quarterly Mathematics Quiz',
      marksObtained: 84,
      maxMarks: 100,
      grade: 'A',
      remark: 'Very good analytical skills.'
    },
    {
      examName: 'First Term Examination',
      marksObtained: 78,
      maxMarks: 100,
      grade: 'B+',
      remark: 'Solid performance, room for improvement in geometry.'
    }
  ];

  for (const resData of resultsToCreate) {
    const exam = createdExams.find(e => e.name === resData.examName) || await prisma.exam.findFirst({
      where: { name: resData.examName, classId }
    });

    if (exam) {
      const existingResult = await prisma.result.findUnique({
        where: {
          examId_studentId_subjectId: {
            examId: exam.id,
            studentId: student.id,
            subjectId: subject.id
          }
        }
      });

      if (!existingResult) {
        console.log(`Creating Result for Exam: "${resData.examName}"`);
        await prisma.result.create({
          data: {
            examId: exam.id,
            studentId: student.id,
            subjectId: subject.id,
            marksObtained: resData.marksObtained,
            maxMarks: resData.maxMarks,
            grade: resData.grade,
            remark: resData.remark,
            schoolId
          }
        });
      }
    }
  }

  // 6. Seed Attendance
  console.log('\n--- Seeding Attendance ---');
  const attendanceDates = [
    { daysAgo: 1, status: 'present' },
    { daysAgo: 2, status: 'present' },
    { daysAgo: 3, status: 'absent', remark: 'Medical checkup' },
    { daysAgo: 4, status: 'present' },
    { daysAgo: 5, status: 'late', remark: 'Missed school bus' }
  ];

  for (const att of attendanceDates) {
    const date = new Date();
    date.setDate(date.getDate() - att.daysAgo);
    date.setHours(0, 0, 0, 0);

    const existingAtt = await prisma.attendance.findUnique({
      where: {
        date_studentId: {
          date,
          studentId: student.id
        }
      }
    });

    if (!existingAtt) {
      console.log(`Creating Attendance for date: ${date.toDateString()} with status: ${att.status}`);
      await prisma.attendance.create({
        data: {
          date,
          status: att.status,
          studentId: student.id,
          remark: att.remark,
          schoolId
        }
      });
    }
  }

  console.log('\n================================================================');
  console.log('                 SEEDING COMPLETED SUCCESSFULLY');
  console.log('================================================================');
}

main()
  .catch(error => {
    console.error('Error during seeding:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
