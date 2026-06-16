import http from 'http';
import dotenv from 'dotenv';
dotenv.config();

import prisma from '../src/config/prisma';

const BASE = 'http://localhost:5001/api';

// ─── HTTP Helper ─────────────────────────────────────────────────────────────
async function req(
  method: string,
  path: string,
  body?: object,
  token?: string
): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE + path);
    const options: http.RequestOptions = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };
    const request = http.request(options, (res) => {
      let raw = '';
      res.on('data', (c) => (raw += c));
      res.on('end', () => {
        try { resolve({ status: res.statusCode ?? 0, data: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode ?? 0, data: raw }); }
      });
    });
    request.on('error', reject);
    if (body) request.write(JSON.stringify(body));
    request.end();
  });
}

// ─── Login Helper ────────────────────────────────────────────────────────────
async function login(email: string, password: string): Promise<string | null> {
  const r = await req('POST', '/auth/login', { email, password });
  return r.data?.data?.accessToken ?? r.data?.token ?? null;
}

// ─── Assertion Counters ──────────────────────────────────────────────────────
let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(label: string, condition: boolean, detail = '') {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.log(`  ❌ ${label}${detail ? ` (${detail})` : ''}`);
    failed++;
    failures.push(label + (detail ? ` — ${detail}` : ''));
  }
}

async function runTests() {
  console.log('===============================================================');
  console.log(' Phase 3.2F: Attendance & Timetable Web-Mobile Parity Tests');
  console.log('===============================================================\n');

  // 1. Logins
  console.log('🔑 Logging in users...');
  const admTok = await login('admin@school.com', 'Admin@123');
  assert('Admin login', !!admTok);

  const teacherTok = await login('teacher@school.com', 'Admin@123');
  assert('Teacher login', !!teacherTok);

  const stuTok = await login('stu.adm20267672@school.local', 'Student@123');
  assert('Student login', !!stuTok);

  const parTok = await login('parent@school.com', 'Admin@123');
  assert('Parent login', !!parTok);

  if (!admTok || !teacherTok || !stuTok || !parTok) {
    console.error('❌ Authentication failed. Make sure the local dev server is running on port 5001.');
    process.exit(1);
  }

  // 2. Discover metadata
  console.log('\n🔍 Discovering data IDs...');
  const teacherUser = await prisma.user.findFirst({ where: { email: 'teacher@school.com' } });
  const teacher = await prisma.teacher.findFirst({ where: { userId: teacherUser?.id } });
  assert('Teacher record exists', !!teacher);

  const parentUser = await prisma.user.findFirst({ where: { email: 'parent@school.com' } });
  const parent = await prisma.parent.findFirst({
    where: { userId: parentUser?.id },
    include: { children: true },
  });
  assert('Parent record exists', !!parent && parent.children.length > 0);

  const studentUser = await prisma.user.findFirst({ where: { email: 'stu.adm20267672@school.local' } });
  const student = await prisma.student.findFirst({ where: { userId: studentUser?.id } });
  assert('Student record exists', !!student);

  // Unlinked student ID for IDOR
  const otherStudent = await prisma.student.findFirst({
    where: {
      id: { notIn: [student?.id || '', ...(parent?.children.map(c => c.id) || [])] }
    }
  });
  assert('Unlinked student exists', !!otherStudent);

  // Get teacher's assigned section
  const sectionId = student?.sectionId || parent?.children[0]?.sectionId;
  assert('Section ID discovered', !!sectionId);

  // 3. Attendance Date Normalization & Parity Tests
  console.log('\n📅 Testing Attendance Date Normalization & Sync...');
  const testDate = '2026-06-20';

  // Clear existing attendance for testDate to keep test clean
  await prisma.attendance.deleteMany({
    where: {
      date: new Date(`${testDate}T00:00:00.000Z`),
      studentId: student?.id
    }
  });

  // Submit via Mobile Teacher Submit Endpoint
  console.log(`- Teacher submitting attendance for date ${testDate}...`);
  const submitRes = await req('POST', '/mobile/teacher/attendance-submit', {
    classId: sectionId,
    date: testDate,
    records: [{ studentId: student?.id, status: 'absent' }]
  }, teacherTok);
  assert('Mobile teacher attendance submit returns 200', submitRes.status === 200);

  // Check database stored record has exactly UTC midnight
  const dbRecord = await prisma.attendance.findFirst({
    where: {
      studentId: student?.id,
      date: new Date(`${testDate}T00:00:00.000Z`)
    }
  });
  assert('Database stores record at exactly 00:00:00.000Z', !!dbRecord);
  if (dbRecord) {
    const formattedDate = dbRecord.date.toISOString();
    assert(`Stored timestamp is exact UTC midnight (${formattedDate})`, formattedDate === `${testDate}T00:00:00.000Z`);
  }

  // Teacher fetches students on mobile for that date
  const getStudsRes = await req('GET', `/mobile/teacher/attendance-students?classId=${sectionId}&date=${testDate}`, undefined, teacherTok);
  assert('Teacher GET attendance-students returns 200', getStudsRes.status === 200);
  if (getStudsRes.status === 200) {
    const records = getStudsRes.data?.data || [];
    const myStudentRec = records.find((r: any) => r.studentId === student?.id);
    assert('Teacher fetches student and sees status is absent', myStudentRec?.status === 'absent');
  }

  // Student dashboard reflected status
  const stuDashRes = await req('GET', '/mobile/student/dashboard', undefined, stuTok);
  assert('Student dashboard returns 200', stuDashRes.status === 200);
  // Verify web attendance also finds the record
  const webAttRes = await req('GET', `/attendance?date=${testDate}&classId=${student?.classId}&sectionId=${student?.sectionId}`, undefined, stuTok);
  assert('Student web attendance fetch returns 200', webAttRes.status === 200);
  if (webAttRes.status === 200) {
    const data = webAttRes.data?.data || [];
    const record = data.find((r: any) => r.studentId === student?.id);
    assert('Student views web attendance and sees correct absent status', record?.status === 'absent');
  }

  // Parent child attendance visibility
  const parAttRes = await req('GET', '/mobile/parent/attendance', undefined, parTok);
  assert('Parent attendance fetch returns 200', parAttRes.status === 200);
  if (parAttRes.status === 200) {
    const childRecords = parAttRes.data?.data || [];
    const targetChild = childRecords.find((c: any) => c.studentId === student?.id);
    if (targetChild) {
      const dateStrPrefix = `${testDate}T00:00:00.000Z`;
      const attendanceRec = targetChild.records?.find((r: any) => new Date(r.date).toISOString() === dateStrPrefix);
      assert('Parent sees child attendance is absent', attendanceRec?.status === 'absent');
    } else {
      console.log('  ℹ️  Target student not linked to this parent; skipping child record status assertion.');
    }
  }

  // 4. Role Authorization / IDOR Security Tests
  console.log('\n🔒 Testing Attendance Security & IDOR Restrictions...');

  // Student/Parent cannot access teacher mark/submit endpoint
  const stuSubmit = await req('POST', '/mobile/teacher/attendance-submit', {
    classId: sectionId, date: testDate, records: []
  }, stuTok);
  assert('Student blocked from teacher attendance-submit → 403', stuSubmit.status === 403);

  const parSubmit = await req('POST', '/mobile/teacher/attendance-submit', {
    classId: sectionId, date: testDate, records: []
  }, parTok);
  assert('Parent blocked from teacher attendance-submit → 403', parSubmit.status === 403);

  // Parent cannot access unlinked student report card
  if (otherStudent) {
    const parUnlinkedReport = await req('GET', `/exams/report/${otherStudent.id}`, undefined, parTok);
    assert('Parent blocked from unlinked student report card → 403', parUnlinkedReport.status === 403);
  }

  // 5. Timetable Period Numbering & Parity Tests
  console.log('\n🕒 Testing Timetable Period Numbering & Sorting...');

  // Verify Student Timetable endpoint returns sequential period strings
  const stuTtRes = await req('GET', '/mobile/student/timetable', undefined, stuTok);
  assert('Student timetable fetch returns 200', stuTtRes.status === 200);
  if (stuTtRes.status === 200) {
    const entries = stuTtRes.data?.data || [];
    console.log(`  ℹ️  Student has ${entries.length} timetable entries.`);
    if (entries.length > 0) {
      const periods = entries.map((e: any) => e.period);
      const days = entries.map((e: any) => e.dayOfWeek);
      console.log(`  ℹ️  Returned periods: ${JSON.stringify(periods)}`);
      // Verify no period is entry.day name or defaults to all 1 if multiple exist
      const hasWordPeriod = periods.some((p: any) => typeof p === 'string' && isNaN(Number(p)));
      assert('Student periods do not contain day names', !hasWordPeriod);

      const allOnes = periods.every((p: any) => p === '1');
      const uniqueDays = Array.from(new Set(days));
      const hasMultiplePerDay = uniqueDays.some(d => entries.filter((e: any) => e.dayOfWeek === d).length > 1);
      if (hasMultiplePerDay) {
        assert('Student periods are not all 1 when multiple periods exist per day', !allOnes);
      }

      // Check sorting matches startTime
      let isSorted = true;
      uniqueDays.forEach(d => {
        const dayEntries = entries.filter((e: any) => e.dayOfWeek === d);
        for (let i = 0; i < dayEntries.length - 1; i++) {
          if (dayEntries[i].startTime.localeCompare(dayEntries[i + 1].startTime) > 0) {
            isSorted = false;
          }
          if (Number(dayEntries[i].period) >= Number(dayEntries[i + 1].period)) {
            // Sequential numbering check
            isSorted = false;
          }
        }
      });
      assert('Student timetable is sorted by startTime and has sequential period numbers', isSorted);
    }
  }

  // Parent Child Timetable period sequential mapping
  const childId = parent?.children[0]?.id || student?.id;
  if (childId) {
    const parTtRes = await req('GET', `/mobile/parent/student/${childId}/timetable`, undefined, parTok);
    assert('Parent child timetable fetch returns 200', parTtRes.status === 200);
    if (parTtRes.status === 200) {
      const entries = parTtRes.data?.data || [];
      if (entries.length > 0) {
        const periods = entries.map((e: any) => e.period);
        const hasWordPeriod = periods.some((p: any) => typeof p === 'string' && isNaN(Number(p)));
        assert('Parent child periods do not contain day names', !hasWordPeriod);
      }
    }
  }

  // Teacher Timetable period sequential mapping
  const teachTtRes = await req('GET', '/mobile/teacher/timetable', undefined, teacherTok);
  assert('Teacher timetable fetch returns 200', teachTtRes.status === 200);
  if (teachTtRes.status === 200) {
    const daysList = teachTtRes.data?.data?.days || [];
    console.log(`  ℹ️  Teacher has schedule for ${daysList.length} days.`);
    let hasWordPeriod = false;
    let isSortedAndNumbered = true;
    daysList.forEach((d: any) => {
      const periods = d.periods || [];
      periods.forEach((p: any) => {
        if (typeof p.period === 'string' && isNaN(Number(p.period))) {
          hasWordPeriod = true;
        }
      });
      for (let i = 0; i < periods.length - 1; i++) {
        if (periods[i].startTime.localeCompare(periods[i + 1].startTime) > 0) {
          isSortedAndNumbered = false;
        }
        if (Number(periods[i].period) >= Number(periods[i + 1].period)) {
          isSortedAndNumbered = false;
        }
      }
    });
    assert('Teacher timetable periods do not contain day names', !hasWordPeriod);
    assert('Teacher timetable is sorted and numbered sequentially per day', isSortedAndNumbered);
  }

  // Teacher Dashboard today classes period mapping
  const teachDashRes = await req('GET', '/mobile/teacher/dashboard', undefined, teacherTok);
  assert('Teacher dashboard fetch returns 200', teachDashRes.status === 200);
  if (teachDashRes.status === 200) {
    const todayClasses = teachDashRes.data?.data?.todayTimetable || [];
    console.log(`  ℹ️  Teacher has ${todayClasses.length} classes scheduled today.`);
    if (todayClasses.length > 0) {
      const periods = todayClasses.map((e: any) => e.period);
      console.log(`  ℹ️  Teacher dashboard today periods: ${JSON.stringify(periods)}`);
      const hasWordPeriod = periods.some((p: any) => typeof p === 'string' && isNaN(Number(p)));
      assert('Teacher dashboard today periods do not contain day names', !hasWordPeriod);

      let isSortedAndNumbered = true;
      for (let i = 0; i < todayClasses.length - 1; i++) {
        if (todayClasses[i].startTime.localeCompare(todayClasses[i + 1].startTime) > 0) {
          isSortedAndNumbered = false;
        }
        if (Number(todayClasses[i].period) >= Number(todayClasses[i + 1].period)) {
          isSortedAndNumbered = false;
        }
      }
      assert('Teacher dashboard timetable is sorted and numbered sequentially', isSortedAndNumbered);
    }
  }

  // Cleanup testing record
  await prisma.attendance.deleteMany({
    where: {
      date: new Date(`${testDate}T00:00:00.000Z`),
      studentId: student?.id
    }
  });

  console.log('\n===============================================================');
  console.log(` Parity test results: ${passed}/${passed + failed} assertions passed`);
  if (failures.length > 0) {
    console.log(' FAILURES:');
    failures.forEach(f => console.log(`  ❌ ${f}`));
    process.exit(1);
  } else {
    console.log(' ✅ ALL PARITY TESTS COMPLETED SUCCESSFULLY!');
    process.exit(0);
  }
}

runTests().catch(e => {
  console.error('❌ Parity tests encountered error:', e);
  process.exit(1);
});
