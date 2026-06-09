import prisma from '../src/config/prisma';
import {
  registerDevice,
  unregisterDevice,
  getParentDashboard,
  getParentStudentProfile,
  getStudentDashboard,
  getTeacherDashboard,
  getTeacherTimetable
} from '../src/controllers/mobileController';
import {
  getStudentAttendanceReport,
  getTimetables
} from '../src/controllers/moduleController';

function createMockRes() {
  const res: any = {
    statusCode: 200,
    jsonData: null,
  };
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data: any) => {
    res.jsonData = data;
    return res;
  };
  return res;
}

async function main() {
  console.log('🧪 Starting Mobile API Foundation Scoping & Validation Tests...\n');

  // 1. Fetch clean test users from the active database
  const parentUser = await prisma.user.findFirst({
    where: { role: 'parent', isActive: true },
    include: { parent: { include: { children: true } } }
  });

  const studentUser = await prisma.user.findFirst({
    where: { role: 'student', isActive: true },
    include: { student: true }
  });

  const teacherUser = await prisma.user.findFirst({
    where: { role: 'teacher', isActive: true },
    include: { teacher: true }
  });

  if (!parentUser || !studentUser || !teacherUser) {
    console.error('❌ Failed to fetch test parent, student, or teacher from database.');
    process.exit(1);
  }

  console.log(`👤 Parent User: ${parentUser.email} (Linked Children: ${parentUser.parent?.children.length})`);
  console.log(`👤 Student User: ${studentUser.email} (Student ID: ${studentUser.student?.id})`);
  console.log(`👤 Teacher User: ${teacherUser.email} (Teacher ID: ${teacherUser.teacher?.id})`);
  console.log('--------------------------------------------------\n');

  // Test 1: Register Device Token
  console.log('▶️ Test 1: Registering mobile device token...');
  const testToken = `test-fcm-token-${Date.now()}`;
  const registerReq: any = {
    user: parentUser,
    body: {
      token: testToken,
      deviceType: 'ios',
      platform: 'iOS 17.2',
      appVersion: '1.0.0'
    }
  };
  const registerRes = createMockRes();
  await registerDevice(registerReq, registerRes, (err) => {
    if (err) console.error('   ❌ Register failed with error middleware:', err.message);
  });
  if (registerRes.statusCode === 200 && registerRes.jsonData?.success) {
    console.log('   ✅ Device registered successfully.');
  } else {
    throw new Error('Device registration test failed.');
  }

  // Test 2: Unregister Device Token
  console.log('▶️ Test 2: Unregistering mobile device token...');
  const unregisterReq: any = {
    user: parentUser,
    body: { token: testToken }
  };
  const unregisterRes = createMockRes();
  await unregisterDevice(unregisterReq, unregisterRes, (err) => {
    if (err) console.error('   ❌ Unregister failed with error:', err.message);
  });
  if (unregisterRes.statusCode === 200 && unregisterRes.jsonData?.data?.isActive === false) {
    console.log('   ✅ Device token deactivated correctly.');
  } else {
    throw new Error('Device unregistration test failed.');
  }

  // Test 3: Parent Dashboard
  console.log('▶️ Test 3: Loading Parent Dashboard...');
  const parentDashReq: any = {
    user: parentUser
  };
  const parentDashRes = createMockRes();
  await getParentDashboard(parentDashReq, parentDashRes, (err) => {
    if (err) console.error('   ❌ Parent Dashboard error:', err.message);
  });
  if (parentDashRes.statusCode === 200 && parentDashRes.jsonData?.success) {
    const data = parentDashRes.jsonData.data;
    console.log(`   ✅ Parent Dashboard loaded. Total children found: ${data.summary.totalChildren}`);
    if (data.children.length > 0) {
      const firstChild = data.children[0];
      console.log(`      Child: ${firstChild.name}, Class: ${firstChild.className}, Section: ${firstChild.sectionName}`);
      console.log(`      Attendance %: ${firstChild.attendanceSummary.percentage}%, Pending Fees: ₹${firstChild.pendingFees}`);
    }
  } else {
    throw new Error('Parent dashboard test failed.');
  }

  // Test 4: Parent Student Profile - Authorized Access
  console.log('▶️ Test 4: Parent Student Profile (Authorized Child)...');
  const ownChildId = parentUser.parent?.children[0]?.id;
  if (!ownChildId) {
    console.log('   ⚠️ Skipping - parent has no children linked.');
  } else {
    const parentProfileReq: any = {
      user: parentUser,
      params: { studentId: ownChildId }
    };
    const parentProfileRes = createMockRes();
    await getParentStudentProfile(parentProfileReq, parentProfileRes, (err) => {
      if (err) console.error('   ❌ Parent profile query error:', err.message);
    });
    if (parentProfileRes.statusCode === 200 && parentProfileRes.jsonData?.success) {
      console.log(`   ✅ Loaded profile details for linked child ID: ${ownChildId}`);
    } else {
      throw new Error('Parent student profile loading failed for own child.');
    }
  }

  // Test 5: Parent Student Profile - IDOR Block (Querying other student)
  console.log('▶️ Test 5: Parent Student Profile IDOR Block (Querying other child)...');
  const otherStudentId = studentUser.student?.id;
  const idorProfileReq: any = {
    user: parentUser,
    params: { studentId: otherStudentId }
  };
  const idorProfileRes = createMockRes();
  let errorTriggered = false;
  await getParentStudentProfile(idorProfileReq, idorProfileRes, (err) => {
    if (err && err.statusCode === 403) {
      errorTriggered = true;
    }
  });
  if (errorTriggered || idorProfileRes.statusCode === 403) {
    console.log('   ✅ Access denied successfully for unrelated student (403). Security OK.');
  } else {
    throw new Error('Security risk: Parent was allowed to view an unrelated student profile!');
  }

  // Test 6: Student Dashboard
  console.log('▶️ Test 6: Loading Student Dashboard...');
  const studentDashReq: any = {
    user: studentUser
  };
  const studentDashRes = createMockRes();
  await getStudentDashboard(studentDashReq, studentDashRes, (err) => {
    if (err) console.error('   ❌ Student Dashboard error:', err.message);
  });
  if (studentDashRes.statusCode === 200 && studentDashRes.jsonData?.success) {
    const data = studentDashRes.jsonData.data;
    console.log(`   ✅ Student Dashboard loaded. Student Name: ${data.student.fullName}, Balance Due: ₹${data.feeSummary.balanceDue}`);
  } else {
    throw new Error('Student dashboard test failed.');
  }

  // Test 7: Teacher Dashboard
  console.log('▶️ Test 7: Loading Teacher Dashboard...');
  const teacherDashReq: any = {
    user: teacherUser
  };
  const teacherDashRes = createMockRes();
  await getTeacherDashboard(teacherDashReq, teacherDashRes, (err) => {
    if (err) console.error('   ❌ Teacher Dashboard error:', err.message);
  });
  if (teacherDashRes.statusCode === 200 && teacherDashRes.jsonData?.success) {
    const data = teacherDashRes.jsonData.data;
    console.log(`   ✅ Teacher Dashboard loaded. Teacher: ${data.teacher.name}, Designation: ${data.teacher.designation}`);
    console.log(`      Assigned Classes: ${data.assignedClasses.length}, Sections: ${data.assignedSections.length}, Subjects: ${data.assignedSubjects.length}`);
  } else {
    throw new Error('Teacher dashboard test failed.');
  }

  // Test 8: Teacher Timetable
  console.log('▶️ Test 8: Loading Teacher Timetable...');
  const teacherTimetableReq: any = {
    user: teacherUser
  };
  const teacherTimetableRes = createMockRes();
  await getTeacherTimetable(teacherTimetableReq, teacherTimetableRes, (err) => {
    if (err) console.error('   ❌ Teacher Timetable error:', err.message);
  });
  if (teacherTimetableRes.statusCode === 200 && teacherTimetableRes.jsonData?.success) {
    const data = teacherTimetableRes.jsonData.data;
    console.log(`   ✅ Teacher Timetable loaded. Number of days mapped: ${data.days.length}`);
  } else {
    throw new Error('Teacher timetable test failed.');
  }

  // Test 9: Parent Attendance Report Scoping Gap Fix
  console.log('▶️ Test 9: Parent Attendance Report Scoping Fix...');
  if (ownChildId) {
    const parentAttReq: any = {
      user: parentUser,
      params: { studentId: ownChildId }
    };
    const parentAttRes = createMockRes();
    await getStudentAttendanceReport(parentAttReq, parentAttRes, (err) => {
      if (err) console.error('   ❌ Attendance report error:', err.message);
    });
    if (parentAttRes.statusCode === 200 && parentAttRes.jsonData?.success) {
      console.log('   ✅ Parent successfully viewed attendance for their own child.');
    } else {
      throw new Error('Parent could not view own child attendance report.');
    }
  }

  // Unrelated child attendance report block
  const idorAttReq: any = {
    user: parentUser,
    params: { studentId: otherStudentId }
  };
  const idorAttRes = createMockRes();
  let attErrorTriggered = false;
  await getStudentAttendanceReport(idorAttReq, idorAttRes, (err) => {
    if (err && err.statusCode === 403) {
      attErrorTriggered = true;
    }
  });
  if (attErrorTriggered || idorAttRes.statusCode === 403 || idorAttRes.jsonData?.success === false) {
    console.log('   ✅ Access denied successfully to unrelated student attendance (403). Security OK.');
  } else {
    throw new Error('Security risk: Parent was allowed to view unrelated child attendance!');
  }

  // Test 10: Parent Timetable Scoping Gap Fix
  console.log('▶️ Test 10: Parent Timetable Scoping Fix...');
  // Querying unrelated class timetable should return 403
  const idorTimetableReq: any = {
    user: parentUser,
    query: { classId: 'unrelated-class-id-mock' }
  };
  const idorTimetableRes = createMockRes();
  let timetableErrorTriggered = false;
  await getTimetables(idorTimetableReq, idorTimetableRes, (err) => {
    if (err && err.statusCode === 403) {
      timetableErrorTriggered = true;
    }
  });
  if (timetableErrorTriggered || idorTimetableRes.statusCode === 403 || idorTimetableRes.jsonData?.success === false) {
    console.log('   ✅ Access denied successfully to unrelated class timetable (403). Security OK.');
  } else {
    throw new Error('Security risk: Parent was allowed to query unrelated class timetable!');
  }

  console.log('\n🎉 All Mobile API Foundation Scoping & Verification Tests PASSED successfully!');
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error('\n❌ Test execution failed with error:', error);
  await prisma.$disconnect();
  process.exit(1);
});
