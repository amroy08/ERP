import prisma from '../src/config/prisma';

async function main() {
  console.log('================================================================');
  console.log('        MOBILE-WEB ACADEMIC PARITY AUDIT SCRIPTS');
  console.log('================================================================\n');

  // 1. Audit Parent Data Baseline
  console.log('--- 1. AUDITING PARENT DEMO DATA (parent@school.com) ---');
  const parentUser = await prisma.user.findFirst({
    where: { email: 'parent@school.com' },
    include: {
      parent: {
        include: {
          children: {
            include: {
              class: true,
              section: true,
              results: {
                include: {
                  exam: true,
                  subject: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!parentUser || !parentUser.parent) {
    console.log('❌ Parent user (parent@school.com) not found in DB!');
  } else {
    const p = parentUser.parent;
    console.log(`Parent Name: ${p.fatherName} / ${p.motherName}`);
    console.log(`Parent Email: ${parentUser.email}`);
    console.log(`linked children count: ${p.children.length}`);
    for (const child of p.children) {
      console.log(`\n  Child Name: ${child.fullName}`);
      console.log(`  Admission No: ${child.admissionNumber}`);
      console.log(`  Class: ${child.class.name} (ID: ${child.class.id})`);
      console.log(`  Section: ${child.section.name} (ID: ${child.section.id})`);

      // Timetable
      const timetable = await prisma.timetable.findFirst({
        where: { classId: child.classId, sectionId: child.sectionId, isActive: true },
        include: { entries: true }
      });
      console.log(`  child timetable count: ${timetable?.entries.length || 0}`);

      // Homework
      const homework = await prisma.homework.findMany({
        where: { classId: child.classId, OR: [{ sectionId: child.sectionId }, { sectionId: null }] }
      });
      console.log(`  child homework count: ${homework.length}`);

      // Exams
      const exams = await prisma.exam.findMany({
        where: { classId: child.classId, status: 'scheduled' }
      });
      console.log(`  child exam count: ${exams.length}`);

      // Results
      console.log(`  child result/marks count: ${child.results.length}`);
    }
  }

  // 2. Audit Student Data Baseline
  console.log('\n--- 2. AUDITING STUDENT DEMO DATA (student@school.com) ---');
  const studentUser = await prisma.user.findFirst({
    where: { email: 'student@school.com' },
    include: {
      student: {
        include: {
          class: true,
          section: true,
          results: true
        }
      }
    }
  });

  if (!studentUser || !studentUser.student) {
    console.log('❌ Student user (student@school.com) not found in DB!');
  } else {
    const s = studentUser.student;
    console.log(`Student Name: ${s.fullName}`);
    console.log(`Student Email: ${studentUser.email}`);
    console.log(`class: ${s.class.name}`);
    console.log(`section: ${s.section?.name || 'N/A'}`);

    // Timetable
    const timetable = await prisma.timetable.findFirst({
      where: { classId: s.classId, sectionId: s.sectionId, isActive: true },
      include: { entries: true }
    });
    console.log(`timetable count: ${timetable?.entries.length || 0}`);

    // Homework
    const homework = await prisma.homework.findMany({
      where: { classId: s.classId, OR: [{ sectionId: s.sectionId }, { sectionId: null }] }
    });
    console.log(`homework count: ${homework.length}`);

    // Exams
    const exams = await prisma.exam.findMany({
      where: { classId: s.classId, status: 'scheduled' }
    });
    console.log(`exam count: ${exams.length}`);

    // Results
    console.log(`result/marks count: ${s.results.length}`);

    // Attendance
    const attendanceCount = await prisma.attendance.count({
      where: { studentId: s.id }
    });
    console.log(`attendance count: ${attendanceCount}`);
  }

  // 3. Audit Teacher Data Baseline
  console.log('\n--- 3. AUDITING TEACHER DEMO DATA (teacher@school.com) ---');
  const teacherUser = await prisma.user.findFirst({
    where: { email: 'teacher@school.com' },
    include: {
      teacher: {
        include: {
          assignedClasses: true,
          classTeacherOf: { include: { class: true } },
          subjectTeachers: {
            include: {
              subject: true,
              section: { include: { class: true } }
            }
          }
        }
      }
    }
  });

  if (!teacherUser || !teacherUser.teacher) {
    console.log('❌ Teacher user (teacher@school.com) not found in DB!');
  } else {
    const t = teacherUser.teacher;
    console.log(`Teacher Name: ${teacherUser.name}`);
    console.log(`Teacher Email: ${teacherUser.email}`);
    console.log(`Employee ID: ${t.employeeId}`);

    // assigned class count
    const classesMap = new Map<string, string>();
    t.assignedClasses.forEach(cls => classesMap.set(cls.id, cls.name));
    t.subjectTeachers.forEach(st => {
      if (st.section && st.section.class) {
        classesMap.set(st.section.class.id, st.section.class.name);
      }
    });
    t.classTeacherOf.forEach(sec => {
      if (sec.class) {
        classesMap.set(sec.class.id, sec.class.name);
      }
    });
    console.log(`assigned class count: ${classesMap.size}`);

    // assigned section count
    const sectionsMap = new Map<string, string>();
    t.subjectTeachers.forEach(st => {
      if (st.section) {
        sectionsMap.set(st.section.id, st.section.name);
      }
    });
    t.classTeacherOf.forEach(sec => {
      sectionsMap.set(sec.id, sec.name);
    });
    console.log(`assigned section count: ${sectionsMap.size}`);

    // assigned subject count
    const subjectsMap = new Map<string, string>();
    t.subjectTeachers.forEach(st => {
      if (st.subject) {
        subjectsMap.set(st.subject.id, st.subject.name);
      }
    });
    console.log(`assigned subject count: ${subjectsMap.size}`);

    // Timetable Entries
    const entries = await prisma.timetableEntry.findMany({
      where: { teacherId: t.id }
    });
    console.log(`timetable count: ${entries.length}`);

    // Homework created by this teacher
    const homework = await prisma.homework.findMany({
      where: { assignedById: t.id }
    });
    console.log(`homework count: ${homework.length}`);

    // Attendance classes count
    console.log(`attendance class count: ${sectionsMap.size}`);

    // Explicitly verify: Teacher Class 1 visible through classTeacherOf mapping: Yes/No
    const visibleThroughClassTeacherOf = t.classTeacherOf.some(sec => sec.class && sec.class.name.includes('Class 1'));
    console.log(`Teacher Class 1 visible through classTeacherOf mapping: ${visibleThroughClassTeacherOf ? 'Yes' : 'No'}`);
  }

  console.log('\n================================================================');
  console.log('                        AUDIT COMPLETED');
  console.log('================================================================');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
