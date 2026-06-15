// @ts-ignore
import fetch from 'node-fetch';

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
  const token = json.data?.accessToken || json.accessToken || json.token || json.data?.token;
  if (!token) {
    throw new Error(`Token not found in login response: ${JSON.stringify(json)}`);
  }
  return token;
}

async function get(path: string, token: string): Promise<any> {
  const res = await fetch(`${HOST}${path}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  const json = await res.json() as any;
  if (res.status !== 200) {
    throw new Error(`GET ${path} failed (${res.status}): ${JSON.stringify(json)}`);
  }
  return json;
}

async function runTests() {
  console.log('================================================================');
  console.log('        TESTING MOBILE API ENDPOINTS (PHASE 3.1B)');
  console.log('================================================================\n');

  try {
    // --- 1. STUDENT TESTS ---
    console.log('--- 1. Testing Student Account (student@school.com) ---');
    const studentToken = await login('student@school.com', 'Admin@123');
    console.log('✅ Logged in successfully.');

    const studentDashboard = await get('/api/mobile/student/dashboard', studentToken);
    console.log(`✅ GET /api/mobile/student/dashboard: PASS`);
    console.log(`   Today Timetable periods: ${studentDashboard.data?.todayTimetable?.length || 0}`);
    console.log(`   Pending Homework count: ${studentDashboard.data?.pendingHomework?.length || 0}`);
    console.log(`   Upcoming Exams count: ${studentDashboard.data?.upcomingExams?.length || 0}`);

    const studentTimetable = await get('/api/mobile/student/timetable', studentToken);
    console.log(`✅ GET /api/mobile/student/timetable: PASS`);
    console.log(`   Total Timetable entries: ${studentTimetable.data?.length || 0}`);

    const studentHomework = await get('/api/mobile/student/homework', studentToken);
    console.log(`✅ GET /api/mobile/student/homework: PASS`);
    console.log(`   Total Homework items: ${studentHomework.data?.length || 0}`);

    const studentExams = await get('/api/mobile/student/exams', studentToken);
    console.log(`✅ GET /api/mobile/student/exams: PASS`);
    console.log(`   Total Exams: ${studentExams.data?.length || 0}`);

    const studentResults = await get('/api/mobile/student/results', studentToken);
    console.log(`✅ GET /api/mobile/student/results: PASS`);
    console.log(`   Total Results/Marks cards: ${studentResults.data?.length || 0}`);

    // --- 2. TEACHER TESTS ---
    console.log('\n--- 2. Testing Teacher Account (teacher@school.com) ---');
    const teacherToken = await login('teacher@school.com', 'Admin@123');
    console.log('✅ Logged in successfully.');

    const teacherDashboard = await get('/api/mobile/teacher/dashboard', teacherToken);
    console.log(`✅ GET /api/mobile/teacher/dashboard: PASS`);
    console.log(`   Assigned Classes: ${JSON.stringify(teacherDashboard.data?.assignedClasses)}`);
    console.log(`   Assigned Sections: ${JSON.stringify(teacherDashboard.data?.assignedSections)}`);
    console.log(`   Assigned Subjects count: ${teacherDashboard.data?.assignedSubjects?.length || 0}`);

    const teacherTimetable = await get('/api/mobile/teacher/timetable', teacherToken);
    console.log(`✅ GET /api/mobile/teacher/timetable: PASS`);
    const totalPeriods = teacherTimetable.data?.days?.reduce((sum: number, d: any) => sum + (d.periods?.length || 0), 0) || 0;
    console.log(`   Periods Teaching: ${totalPeriods}`);

    const teacherAttendanceClasses = await get('/api/mobile/teacher/attendance-classes', teacherToken);
    console.log(`✅ GET /api/mobile/teacher/attendance-classes: PASS`);
    console.log(`   Attendance Classes available: ${teacherAttendanceClasses.data?.length || 0}`);
    teacherAttendanceClasses.data?.forEach((cls: any) => {
      console.log(`     - Class: ${cls.className} - Section: ${cls.sectionName} | Marked Today: ${cls.attendanceMarked}`);
    });

  } catch (err: any) {
    console.error('❌ Endpoint test failed with error:', err.message);
    process.exit(1);
  }

  console.log('\n================================================================');
  console.log('                ENDPOINT TESTING COMPLETED SUCCESSFULLY');
  console.log('================================================================');
}

runTests();
