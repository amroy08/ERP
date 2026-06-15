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
    console.log(`Total Linked Children in DB: ${p.children.length}`);
    for (const child of p.children) {
      console.log(`\n  Child Name: ${child.fullName}`);
      console.log(`  Admission No: ${child.admissionNumber}`);
      console.log(`  Class: ${child.class.name} (ID: ${child.class.id})`);
      console.log(`  Section: ${child.section.name} (ID: ${child.section.id})`);

      // Timetable expected
      const timetable = await prisma.timetable.findFirst({
        where: { classId: child.classId, sectionId: child.sectionId, isActive: true },
        include: { entries: { include: { subject: true, teacher: true } } }
      });
      console.log(`  Timetable entries in DB: ${timetable?.entries.length || 0}`);

      // Homework expected
      const homework = await prisma.homework.findMany({
        where: { classId: child.classId, OR: [{ sectionId: child.sectionId }, { sectionId: null }] }
      });
      console.log(`  Homework expected in DB: ${homework.length}`);

      // Exams expected
      const exams = await prisma.exam.findMany({
        where: { classId: child.classId, status: 'scheduled' }
      });
      console.log(`  Exams expected in DB: ${exams.length}`);

      // Results expected
      console.log(`  Marks/Results in DB: ${child.results.length}`);
      for (const res of child.results) {
        console.log(`    - Exam: ${res.exam.name} | Subject: ${res.subject.name} | Marks: ${res.marksObtained}/${res.maxMarks}`);
      }
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
          results: {
            include: {
              exam: true,
              subject: true
            }
          }
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
    console.log(`Class: ${s.class.name} (ID: ${s.class.id})`);
    console.log(`Section: ${s.section.name} (ID: ${s.section.id})`);

    // Timetable
    const timetable = await prisma.timetable.findFirst({
      where: { classId: s.classId, sectionId: s.sectionId, isActive: true },
      include: { entries: true }
    });
    console.log(`Timetable entries: ${timetable?.entries.length || 0}`);

    // Homework
    const homework = await prisma.homework.findMany({
      where: { classId: s.classId, OR: [{ sectionId: s.sectionId }, { sectionId: null }] }
    });
    console.log(`Homework assigned: ${homework.length}`);

    // Exams
    const exams = await prisma.exam.findMany({
      where: { classId: s.classId, status: 'scheduled' }
    });
    console.log(`Exams scheduled: ${exams.length}`);

    // Results
    console.log(`Results/Marks found: ${s.results.length}`);
    for (const res of s.results) {
      console.log(`  - Exam: ${res.exam.name} | Subject: ${res.subject.name} | Marks: ${res.marksObtained}/${res.maxMarks}`);
    }
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
    
    // Class Teacher assignments
    console.log(`Class Teacher of Sections:`);
    t.classTeacherOf.forEach(sec => {
      console.log(`  - Section: ${sec.name} | Class: ${sec.class.name} (ID: ${sec.id})`);
    });

    // Subject assignments from SubjectTeacher (Phase 2.8)
    console.log(`Section-wise Subject Assignments (SubjectTeacher):`);
    t.subjectTeachers.forEach(st => {
      console.log(`  - Class: ${st.section.class.name} | Section: ${st.section.name} | Subject: ${st.subject.name} (ID: ${st.id})`);
    });

    // Timetable Entries
    const entries = await prisma.timetableEntry.findMany({
      where: { teacherId: t.id },
      include: {
        subject: true,
        timetable: { include: { class: true, section: true } }
      }
    });
    console.log(`Timetable periods teaching: ${entries.length}`);
    entries.forEach(e => {
      console.log(`  - Day: ${e.day} | Period: ${e.startTime}-${e.endTime} | Class: ${e.timetable.class.name}-${e.timetable.section.name} | Subject: ${e.subject.name}`);
    });

    // Homework created by this teacher
    const homework = await prisma.homework.findMany({
      where: { assignedById: t.id },
      include: { class: true, section: true, subject: true }
    });
    console.log(`Homework created by teacher: ${homework.length}`);
    homework.forEach(h => {
      console.log(`  - Title: "${h.title}" | Class: ${h.class.name} ${h.section?.name || 'All'} | Subject: ${h.subject.name}`);
    });

    // Attendance classes
    console.log(`Assigned classes for Attendance Marking:`);
    const sectionsMap = new Map<string, string>();
    t.subjectTeachers.forEach(st => {
      sectionsMap.set(st.section.id, `${st.section.class.name} - ${st.section.name}`);
    });
    t.classTeacherOf.forEach(sec => {
      sectionsMap.set(sec.id, `${sec.class.name} - ${sec.name}`);
    });
    sectionsMap.forEach((name, id) => {
      console.log(`  - ${name} (SectionID: ${id})`);
    });
  }

  console.log('\n================================================================');
  console.log('                        AUDIT COMPLETED');
  console.log('================================================================');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
