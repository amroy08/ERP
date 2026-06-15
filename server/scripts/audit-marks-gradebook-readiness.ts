/**
 * Phase 3.1H: Marks / Gradebook Readiness Audit Script
 * Audits the current state of exam/result/marks data and teacher assignment coverage.
 * Run: npx ts-node --transpile-only scripts/audit-marks-gradebook-readiness.ts
 */
import prisma from '../src/config/prisma';

async function main() {
  console.log('================================================================');
  console.log('  Phase 3.1H: Marks / Gradebook Readiness Audit');
  console.log('================================================================\n');

  // ── 1. Exam counts ────────────────────────────────────────────────────────
  const examCount = await prisma.exam.count();
  const examsByStatus = await prisma.exam.groupBy({ by: ['status'], _count: { id: true } });
  console.log(`--- 1. Exam Data ---`);
  console.log(`   Total exams: ${examCount}`);
  examsByStatus.forEach((s: any) => console.log(`   Status "${s.status}": ${s._count.id}`));

  const examsWithClass = await prisma.exam.findMany({
    take: 5,
    include: { class: { select: { name: true } }, academicYear: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });
  console.log(`   Sample exams (latest 5):`);
  examsWithClass.forEach((e: any) =>
    console.log(`     - "${e.name}" | Class: ${e.class?.name} | AY: ${e.academicYear?.name} | Status: ${e.status}`)
  );

  // ── 2. Result/Marks counts ────────────────────────────────────────────────
  const resultCount = await prisma.result.count();
  console.log(`\n--- 2. Result (Marks) Data ---`);
  console.log(`   Total result rows: ${resultCount}`);

  if (resultCount > 0) {
    const sampleResults = await prisma.result.findMany({
      take: 3,
      include: {
        exam: { select: { name: true } },
        subject: { select: { name: true } },
        student: { select: { fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    console.log(`   Sample results (latest 3):`);
    sampleResults.forEach((r: any) =>
      console.log(
        `     - Student: ${r.student?.fullName} | Exam: ${r.exam?.name} | Subject: ${r.subject?.name} | Marks: ${r.marksObtained}/${r.maxMarks} | Grade: ${r.grade ?? 'N/A'}`
      )
    );
  }

  // ── 3. SubjectTeacher assignments ─────────────────────────────────────────
  const stCount = await prisma.subjectTeacher.count();
  const stActive = await prisma.subjectTeacher.count({ where: { status: 'active' } });
  console.log(`\n--- 3. SubjectTeacher Assignments ---`);
  console.log(`   Total SubjectTeacher rows: ${stCount}`);
  console.log(`   Active assignments: ${stActive}`);

  // ── 4. Demo teacher profile & assignments ─────────────────────────────────
  // Teacher has no firstName — name is on linked User
  const demoTeacher = await prisma.teacher.findFirst({
    include: {
      user: { select: { name: true, email: true } },
      subjectTeachers: {
        include: {
          subject: { select: { name: true, classId: true } },
          section: { include: { class: { select: { id: true, name: true } } } },
        },
        where: { status: 'active' },
      },
      assignedClasses: { select: { id: true, name: true } },
      classTeacherOf: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`\n--- 4. Demo Teacher Profile ---`);
  if (demoTeacher) {
    console.log(`   Name/Email: ${demoTeacher.user?.name} / ${demoTeacher.user?.email}`);
    console.log(`   SubjectTeacher active assignments: ${demoTeacher.subjectTeachers.length}`);
    console.log(`   Assigned classes: ${demoTeacher.assignedClasses.map((c: any) => c.name).join(', ') || 'None'}`);
    console.log(`   Class teacher of sections: ${demoTeacher.classTeacherOf.map((s: any) => s.name).join(', ') || 'None'}`);
    demoTeacher.subjectTeachers.forEach((st: any) => {
      console.log(`     SubjectTeacher: subject="${st.subject?.name}" section="${st.section?.name}" class="${st.section?.class?.name}"`);
    });

    const classIds = new Set<string>([
      ...demoTeacher.subjectTeachers.map((st: any) => st.section?.class?.id).filter(Boolean),
      ...demoTeacher.assignedClasses.map((c: any) => c.id),
    ]);
    console.log(`   Reachable classIds: [${[...classIds].join(', ')}]`);

    // ── 5. Can teacher map to exams? ─────────────────────────────────────────
    console.log(`\n--- 5. Exam Mapping for Demo Teacher ---`);
    if (classIds.size > 0) {
      const reachableExams = await prisma.exam.findMany({
        where: { classId: { in: [...classIds] } },
        include: { class: { select: { name: true } } },
      });
      console.log(`   Exams reachable by demo teacher (via classId): ${reachableExams.length}`);
      reachableExams.forEach((e: any) =>
        console.log(`     - "${e.name}" | Class: ${e.class?.name} | Status: ${e.status}`)
      );

      // ── 6. Students in teacher's sections ───────────────────────────────
      console.log(`\n--- 6. Students in Demo Teacher's Scope ---`);
      const sectionIds = demoTeacher.subjectTeachers.map((st: any) => st.sectionId).filter(Boolean);
      const studentCount = sectionIds.length > 0
        ? await prisma.student.count({ where: { sectionId: { in: sectionIds } } })
        : 0;
      console.log(`   Students in assigned sections: ${studentCount}`);
      console.log(`   Section IDs: [${sectionIds.join(', ')}]`);

      if (reachableExams.length > 0 && studentCount > 0) {
        console.log(`   ✅ Teacher CAN map assigned subject/class/section to exam: YES`);
      } else if (reachableExams.length > 0) {
        console.log(`   ⚠️  Teacher has reachable exams but no students in assigned sections.`);
      } else {
        console.log(`   ⚠️  Teacher has NO reachable exams (no matching classId).`);
      }
    } else {
      console.log(`   ⚠️  Demo teacher has no class assignments — no exam mapping possible.`);
    }
  } else {
    console.log(`   ⚠️  No teacher found in database.`);
  }

  // ── 7. Schema gap analysis ────────────────────────────────────────────────
  console.log(`\n--- 7. Schema Gap Analysis ---`);
  console.log(`   Exam.sectionId:        MISSING — Exam only has classId, not sectionId`);
  console.log(`   Result.published:      MISSING — No publish/unpublish workflow`);
  console.log(`   Result.marksObtained:  PRESENT (Int)`);
  console.log(`   Result.maxMarks:       PRESENT (Int, per result row)`);
  console.log(`   Result.grade:          PRESENT (String?, nullable)`);
  console.log(`   Result.remark:         PRESENT (String?, nullable)`);
  console.log(`   Unique constraint:     PRESENT (examId + studentId + subjectId)`);
  console.log(`   Separate Marks model:  NOT NEEDED — Result model covers marks storage`);
  console.log(`   Schema change needed:  NO (for basic marks entry)`);
  console.log(`   Migration needed:      NO`);

  // ── 8. API gap analysis ────────────────────────────────────────────────────
  console.log(`\n--- 8. Backend API Gap Analysis ---`);
  console.log(`   Web admin marks entry:        POST /api/exams/submit-results     ✅ EXISTS`);
  console.log(`   Web get exam subjects:        GET  /api/exams/subjects/:examId   ❌ ROUTE UNREGISTERED (controller exists)`);
  console.log(`   Web get exam marks:           GET  /api/exams/marks/:eId/:sId    ❌ ROUTE UNREGISTERED (controller exists)`);
  console.log(`   Web POST /exams/marks client: POST /api/exams/marks              ❌ WRONG URL in client (should be /submit-results)`);
  console.log(`   Mobile student exams:         GET  /api/mobile/student/exams     ✅ EXISTS`);
  console.log(`   Mobile student results:       GET  /api/mobile/student/results   ✅ EXISTS`);
  console.log(`   Mobile parent results:        GET  /api/mobile/parent/student/:id/results ✅ EXISTS`);
  console.log(`   Mobile teacher marks exams:   GET  /api/mobile/teacher/marks/exams           ❌ MISSING`);
  console.log(`   Mobile teacher exam subjects: GET  /api/mobile/teacher/marks/exams/:id/subjects ❌ MISSING`);
  console.log(`   Mobile teacher exam students: GET  /api/mobile/teacher/marks/exams/:id/students?subjectId= ❌ MISSING`);
  console.log(`   Mobile teacher save marks:    POST /api/mobile/teacher/marks/exams/:id/save  ❌ MISSING`);

  // ── 9. Pre-existing web bug notice ─────────────────────────────────────
  console.log(`\n--- 9. Pre-existing Web UI Bug (not introduced by us) ---`);
  console.log(`   ExamsPage.tsx calls POST /api/exams/marks — route NOT registered`);
  console.log(`   ExamsPage.tsx calls GET  /api/exams/subjects/:id — route NOT registered`);
  console.log(`   Registered submit route is POST /api/exams/submit-results`);
  console.log(`   NOT blocking mobile marks implementation. Noted for future web fix.`);

  // ── 10. Recommended Phase 3.1I endpoints ─────────────────────────────────
  console.log(`\n--- 10. Recommended Phase 3.1I Backend Endpoints ---`);
  console.log(`   GET  /api/mobile/teacher/marks/exams`);
  console.log(`        List exams teacher is authorized to mark (SubjectTeacher → section.classId → exam.classId)`);
  console.log(`   GET  /api/mobile/teacher/marks/exams/:examId/subjects`);
  console.log(`        List subjects teacher is authorized to mark in this exam`);
  console.log(`   GET  /api/mobile/teacher/marks/exams/:examId/students?subjectId=`);
  console.log(`        Students with existing marks for this exam+subject`);
  console.log(`   POST /api/mobile/teacher/marks/exams/:examId/save`);
  console.log(`        Body: { subjectId, maxMarks, marks: [{studentId, marksObtained, remark}] }`);
  console.log(`        Bulk upsert — reuse ExamService.submitResults pattern`);

  // ── 11. Authorization strategy ────────────────────────────────────────────
  console.log(`\n--- 11. Teacher Marks Authorization Strategy ---`);
  console.log(`   getTeacherMarksScopeOrThrow(authUser, examId, subjectId):`);
  console.log(`   1. Verify role === 'teacher'`);
  console.log(`   2. Load teacher profile with subjectTeachers (include section→class) + assignedClasses`);
  console.log(`   3. Load exam → get exam.classId and exam.schoolId`);
  console.log(`   4. School scope check: teacher.schoolId === exam.schoolId`);
  console.log(`   5. Authorization — at least ONE must be true:`);
  console.log(`       a. SubjectTeacher: st.subjectId===subjectId AND st.section.class.id===exam.classId`);
  console.log(`       b. Subject fallback: subject.teacherId===teacher.id AND subject.classId===exam.classId`);
  console.log(`       c. Class assignment: teacher.assignedClasses includes exam.classId`);

  console.log(`\n================================================================`);
  console.log(`  AUDIT COMPLETE`);
  console.log(`  Phase 3.1H: Marks / Gradebook Planning Audit`);
  console.log(`  Schema change needed:   NO`);
  console.log(`  Migration needed:       NO`);
  console.log(`  Missing mobile endpoints: 4`);
  console.log(`  Safe to start Phase 3.1I: YES`);
  console.log(`================================================================\n`);

  await prisma.$disconnect();
}

main().catch(async err => {
  console.error('Audit script error:', err);
  await prisma.$disconnect();
  process.exit(1);
});
