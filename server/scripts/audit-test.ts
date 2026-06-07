import * as http from 'http';

const HOST = 'localhost';
const PORT = 5001;

function request(options: http.RequestOptions, body?: string): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let raw = '';
      res.on('data', chunk => (raw += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode || 0, data: JSON.parse(raw) });
        } catch {
          resolve({ status: res.statusCode || 0, data: raw });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function post(path: string, payload: object, token?: string) {
  const body = JSON.stringify(payload);
  return request({
    host: HOST, port: PORT, path, method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  }, body);
}

function get(path: string, token: string) {
  return request({
    host: HOST, port: PORT, path, method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  });
}

async function login(email: string, password: string): Promise<string> {
  const res = await post('/api/auth/login', { email, password });
  if (res.status !== 200) throw new Error(`Login failed for ${email}: ${JSON.stringify(res.data)}`);
  return res.data.data.accessToken;
}

async function run() {
  console.log('--- STARTING BACKEND SAFETY & COMPATIBILITY AUDIT ---');

  const adminToken = await login('admin@school.com', 'Admin@123');
  const studentToken = await login('student@school.com', 'Admin@123');
  const parentToken = await login('parent@school.com', 'Admin@123');

  // Get first student
  const studentsRes = await get('/api/students', adminToken);
  const students = studentsRes.data.data;
  if (!students || students.length === 0) throw new Error('No students found');
  const targetStudent = students[0];
  const targetStudentId = targetStudent.id;
  console.log(`Target student: ${targetStudent.fullName} (${targetStudentId})`);

  // Get student's current fee status
  const statusRes = await get(`/api/fees/status/${targetStudentId}`, adminToken);
  if (statusRes.status !== 200) throw new Error(`Failed to get fee status: ${JSON.stringify(statusRes.data)}`);
  const ledger = statusRes.data.data;
  console.log(`Current Balance Due: Rs.${ledger.balanceDue}`);

  if (ledger.balanceDue < 100) {
    throw new Error('Target student has insufficient balance due to run tests safely. Please reset seed or use another student.');
  }

  // Find fee structure and component to use
  const structure = ledger.structures[0];
  const studentFeeId = structure._studentFeeId;
  const component = structure.components.find((c: any) => c.outstanding > 10);
  if (!component) {
    throw new Error('No fee component with outstanding balance > 10 found for target student.');
  }
  console.log(`Using component "${component.name}" with outstanding balance Rs.${component.outstanding} under studentFeeId ${studentFeeId}`);

  // Test 1: Negative payment amount should be blocked
  console.log('\nTest 1: POST /collect with negative amountPaid...');
  const t1 = await post('/api/fees/collect', {
    studentId: targetStudentId,
    amountPaid: -10,
    paymentMode: 'cash'
  }, adminToken);
  console.log(`Status: ${t1.status}, Message: ${t1.data?.message}`);
  if (t1.status !== 400) throw new Error('Test 1 failed: Negative payment amount was not blocked.');

  // Test 2: Allocation sum mismatch should be blocked
  console.log('\nTest 2: POST /collect with allocation sum mismatch...');
  const t2 = await post('/api/fees/collect', {
    studentId: targetStudentId,
    amountPaid: 50,
    paymentMode: 'cash',
    allocations: [
      { studentFeeId, componentName: component.name, amount: 40 }
    ]
  }, adminToken);
  console.log(`Status: ${t2.status}, Message: ${t2.data?.message}`);
  if (t2.status !== 400) throw new Error('Test 2 failed: Allocation sum mismatch was not blocked.');

  // Test 3: Negative allocation amount should be blocked
  console.log('\nTest 3: POST /collect with negative allocation amount...');
  const t3 = await post('/api/fees/collect', {
    studentId: targetStudentId,
    amountPaid: 10,
    paymentMode: 'cash',
    allocations: [
      { studentFeeId, componentName: component.name, amount: -10 }
    ]
  }, adminToken);
  console.log(`Status: ${t3.status}, Message: ${t3.data?.message}`);
  if (t3.status !== 400) throw new Error('Test 3 failed: Negative allocation amount was not blocked.');

  // Test 4: Invalid studentFeeId should be blocked
  console.log('\nTest 4: POST /collect with invalid studentFeeId...');
  const t4 = await post('/api/fees/collect', {
    studentId: targetStudentId,
    amountPaid: 10,
    paymentMode: 'cash',
    allocations: [
      { studentFeeId: 'invalid-id-12345', componentName: component.name, amount: 10 }
    ]
  }, adminToken);
  console.log(`Status: ${t4.status}, Message: ${t4.data?.message}`);
  if (t4.status !== 400) throw new Error('Test 4 failed: Invalid studentFeeId was not blocked.');

  // Test 5: Component overpayment should be blocked
  console.log('\nTest 5: POST /collect with component overpayment...');
  const overpayAmount = component.outstanding + 10;
  const t5 = await post('/api/fees/collect', {
    studentId: targetStudentId,
    amountPaid: overpayAmount,
    paymentMode: 'cash',
    allocations: [
      { studentFeeId, componentName: component.name, amount: overpayAmount }
    ]
  }, adminToken);
  console.log(`Status: ${t5.status}, Message: ${t5.data?.message}`);
  if (t5.status !== 400) throw new Error('Test 5 failed: Component overpayment was not blocked.');

  // Test 6: Old flat payment (no allocations) should succeed and auto-allocate via FIFO
  console.log('\nTest 6: POST /collect with legacy/flat payment (no allocations)...');
  const t6 = await post('/api/fees/collect', {
    studentId: targetStudentId,
    amountPaid: 10,
    paymentMode: 'cash',
    remarks: 'Audit flat payment'
  }, adminToken);
  console.log(`Status: ${t6.status}`);
  if (t6.status !== 201) throw new Error(`Test 6 failed: Legacy flat payment failed with ${JSON.stringify(t6.data)}`);
  console.log('Allocations created:');
  console.log(t6.data.data.allocations);
  if (!t6.data.data.allocations || t6.data.data.allocations.length === 0) {
    throw new Error('Test 6 failed: No allocations created for flat payment.');
  }

  // Test 7: New payment with custom allocations should succeed
  console.log('\nTest 7: POST /collect with custom allocations...');
  const t7 = await post('/api/fees/collect', {
    studentId: targetStudentId,
    amountPaid: 15,
    paymentMode: 'cash',
    remarks: 'Audit custom payment',
    allocations: [
      { studentFeeId, componentName: component.name, amount: 15 }
    ]
  }, adminToken);
  console.log(`Status: ${t7.status}`);
  if (t7.status !== 201) throw new Error(`Test 7 failed: Custom allocated payment failed with ${JSON.stringify(t7.data)}`);
  console.log('Allocations created:');
  console.log(t7.data.data.allocations);
  if (!t7.data.data.allocations || t7.data.data.allocations.length !== 1 || t7.data.data.allocations[0].allocatedAmount !== 15) {
    throw new Error('Test 7 failed: Custom allocation amount incorrect.');
  }

  // Test 8: General overpayment (greater than balanceDue) should be blocked
  console.log('\nTest 8: POST /collect with general overpayment...');
  const currentStatus = await get(`/api/fees/status/${targetStudentId}`, adminToken);
  const currentBalance = currentStatus.data.data.balanceDue;
  const t8 = await post('/api/fees/collect', {
    studentId: targetStudentId,
    amountPaid: currentBalance + 100,
    paymentMode: 'cash'
  }, adminToken);
  console.log(`Status: ${t8.status}, Message: ${t8.data?.message}`);
  if (t8.status !== 400) throw new Error('Test 8 failed: General overpayment was not blocked.');

  // Test 9: Student accessing own payment history and IDOR block
  console.log('\nTest 9: Student accessing own payment history...');
  // Find logged in student's ID from user profile
  const profileRes = await get('/api/auth/me', studentToken);
  const loggedInStudentId = profileRes.data.data.user?.student?.id;
  console.log(`Logged in student ID: ${loggedInStudentId}`);
  if (loggedInStudentId) {
    const t9_own = await get(`/api/fees/payments/${loggedInStudentId}`, studentToken);
    console.log(`Own access status: ${t9_own.status}`);
    if (t9_own.status !== 200) throw new Error('Test 9 failed: Student could not view own payment history.');

    // IDOR check: student accessing another student's ID
    const otherStudent = students.find((s: any) => s.id !== loggedInStudentId);
    if (otherStudent) {
      console.log(`Testing student IDOR against student: ${otherStudent.fullName} (${otherStudent.id})`);
      const t9_other = await get(`/api/fees/payments/${otherStudent.id}`, studentToken);
      console.log(`IDOR other student status: ${t9_other.status}`);
      if (t9_other.status !== 403) throw new Error('Test 9 failed: IDOR was not blocked (student accessed other student).');
    } else {
      console.log('Skipping student IDOR check: only one student exists in the database.');
    }
  }

  // Test 10: Parent accessing linked child and IDOR block...
  console.log('\nTest 10: Parent accessing linked child and IDOR block...');
  const parentProfileRes = await get('/api/auth/me', parentToken);
  const childId = parentProfileRes.data.data.user?.parent?.children?.[0]?.id;
  console.log(`Parent's child ID: ${childId}`);
  if (childId) {
    const t10_child = await get(`/api/fees/payments/${childId}`, parentToken);
    console.log(`Child access status: ${t10_child.status}`);
    if (t10_child.status !== 200) throw new Error('Test 10 failed: Parent could not view child payment history.');

    // IDOR check: parent accessing another student's ID (not their child)
    const otherStudent = students.find((s: any) => s.id !== childId);
    if (otherStudent) {
      console.log(`Testing parent IDOR against student: ${otherStudent.fullName} (${otherStudent.id})`);
      const t10_other = await get(`/api/fees/payments/${otherStudent.id}`, parentToken);
      console.log(`Parent IDOR other status: ${t10_other.status}`);
      if (t10_other.status !== 403) throw new Error('Test 10 failed: IDOR was not blocked (parent accessed unrelated student).');
    } else {
      console.log('Skipping parent IDOR check: only one student exists in the database.');
    }
  }

  // Test 11: GET /fees/recent
  console.log('\nTest 11: GET /api/fees/recent...');
  const t11 = await get('/api/fees/recent', adminToken);
  console.log(`Status: ${t11.status}, Payments count: ${t11.data?.data?.length}`);
  if (t11.status !== 200) throw new Error('Test 11 failed: Could not fetch recent payments.');
  const recentPayment = t11.data.data[0];
  console.log('Recent payment allocations:');
  console.log(recentPayment.allocations);

  // Test 12: GET /fees/payments/:studentId
  console.log('\nTest 12: GET /api/fees/payments/:studentId...');
  const t12 = await get(`/api/fees/payments/${targetStudentId}`, adminToken);
  console.log(`Status: ${t12.status}, Payments count: ${t12.data?.data?.length}`);
  if (t12.status !== 200) throw new Error('Test 12 failed: Could not fetch payments list for student.');
  const studentPayment = t12.data.data[0];
  console.log('Student payment allocations:');
  console.log(studentPayment.allocations);

  // Test 13: GET /api/reports/export?type=fees&format=csv
  console.log('\nTest 13: GET /api/reports/export?type=fees&format=csv...');
  const t13 = await get('/api/reports/export?type=fees&format=csv', adminToken);
  console.log(`Status: ${t13.status}`);
  if (t13.status !== 200) throw new Error('Test 13 failed: CSV export failed.');
  console.log(`CSV snippet (first 150 chars): \n${String(t13.data).substring(0, 150)}`);

  // Test 14: GET /api/reports/export?type=fees&format=pdf
  console.log('\nTest 14: GET /api/reports/export?type=fees&format=pdf...');
  const t14 = await get('/api/reports/export?type=fees&format=pdf', adminToken);
  console.log(`Status: ${t14.status}`);
  if (t14.status !== 200) throw new Error('Test 14 failed: PDF export failed.');
  console.log(`PDF prefix: ${String(t14.data).substring(0, 10)}`);

  console.log('\n--- ALL BACKEND COMPATIBILITY & VALIDATION TESTS PASSED ---');
}

run().catch(err => {
  console.error('\n❌ Test execution failed:', err);
  process.exit(1);
});
