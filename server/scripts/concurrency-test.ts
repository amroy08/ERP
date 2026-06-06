/**
 * Phase 2.2 Concurrency Stress Test — uses Node built-in http (no extra deps)
 *
 * Usage (from server/ directory):
 *   npx ts-node prisma/concurrency-test.ts
 *
 * NOTE: Creates real payment records locally. Safe for local dev only.
 */

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
  if (res.status !== 200) throw new Error(`Login failed: ${JSON.stringify(res.data)}`);
  return res.data.data.accessToken;
}

async function getStudentId(token: string): Promise<string> {
  const res = await get('/api/students', token);
  const students = res.data.data;
  if (!students || students.length === 0) throw new Error('No students found');
  return students[0].id;
}

async function getFeeStatus(token: string, studentId: string): Promise<number> {
  const res = await get(`/api/fees/status/${studentId}`, token);
  return res.data.data?.balanceDue ?? 0;
}

async function firePayment(token: string, studentId: string, amount: number, index: number) {
  const res = await post('/api/fees/collect', {
    studentId,
    amountPaid: amount,
    paymentMode: 'cash',
    remarks: `Concurrency test #${index}`
  }, token);
  return { status: res.status, data: res.data };
}

async function getPayments(token: string, studentId: string): Promise<any[]> {
  const res = await get(`/api/fees/payments/${studentId}`, token);
  return res.data.data ?? [];
}

async function run() {
  console.log('\n======================================================');
  console.log(' Phase 2.2 — Receipt Concurrency Stress Test');
  console.log('======================================================\n');

  console.log('🔐 Logging in as admin...');
  const token = await login('admin@school.com', 'Admin@123');
  console.log('✅ Login OK\n');

  console.log('🔍 Fetching first available student...');
  const studentId = await getStudentId(token);
  console.log(`✅ Student ID: ${studentId}\n`);

  const balance = await getFeeStatus(token, studentId);
  console.log(`💰 Available balance: Rs.${balance}`);

  if (balance <= 0) {
    console.log('\n⚠️  Balance is zero — cannot make new payments.');
    console.log('   Verifying uniqueness of existing payment records instead...\n');
    const payments = await getPayments(token, studentId);
    const receipts = payments.map(p => p.receiptNumber);
    const unique = new Set(receipts).size;
    console.log(`   Total payments: ${receipts.length}, Unique receipts: ${unique}`);
    if (unique === receipts.length) {
      console.log('✅ All existing receipt numbers are unique — PASS\n');
    } else {
      console.log('❌ DUPLICATE RECEIPT NUMBERS FOUND! — FAIL');
      process.exit(1);
    }
    return;
  }

  // Use a small amount per request to avoid hitting overpayment limit
  const CONCURRENT = 8;
  const amount = Math.min(10, Math.floor(balance / (CONCURRENT + 2)));
  if (amount <= 0) {
    console.log(`⚠️  Balance too low for ${CONCURRENT} concurrent payments. Adjusting to 1 request.`);
  }

  const safeAmount = Math.max(1, amount);
  console.log(`\n🚀 Firing ${CONCURRENT} concurrent payment requests of Rs.${safeAmount} each...`);
  console.log('   (All Promises launched simultaneously via Promise.all)\n');

  const results = await Promise.all(
    Array.from({ length: CONCURRENT }, (_, i) =>
      firePayment(token, studentId, safeAmount, i + 1)
    )
  );

  let successCount = 0;
  let rejectedCount = 0;
  const successReceipts: string[] = [];

  results.forEach((r, i) => {
    if (r.status === 200 || r.status === 201) {
      successCount++;
      const receipt = r.data.data?.receiptNumber;
      successReceipts.push(receipt);
      console.log(`  Request ${i + 1}: ✅ SUCCESS — receipt: ${receipt}`);
    } else {
      rejectedCount++;
      const msg = r.data?.message || r.data;
      console.log(`  Request ${i + 1}: ⚠️  REJECTED [${r.status}] — ${msg}`);
    }
  });

  console.log(`\n📈 ${successCount} accepted, ${rejectedCount} rejected (overpayment/balance guards are expected)`);

  const uniqueReceipts = new Set(successReceipts).size;
  console.log(`\n🔑 Receipt uniqueness check:`);
  console.log(`   Accepted payments: ${successCount}`);
  console.log(`   Unique receipt numbers: ${uniqueReceipts}`);

  if (uniqueReceipts === successCount) {
    console.log('   ✅ PASS — No duplicate receipt numbers');
  } else {
    console.log('   ❌ FAIL — DUPLICATE RECEIPT NUMBERS in accepted payments!');
    console.log('   Receipts:', successReceipts);
    process.exit(1);
  }

  // Verify via DB-backed GET
  console.log('\n🔍 Verifying via GET /api/fees/payments/:studentId...');
  const allPayments = await getPayments(token, studentId);
  const allReceipts = allPayments.map(p => p.receiptNumber);
  const allUnique = new Set(allReceipts).size;
  console.log(`   Total payments in DB: ${allPayments.length}`);
  console.log(`   Unique receipts in DB: ${allUnique}`);

  if (allUnique === allPayments.length) {
    console.log('   ✅ PASS — DB uniqueness verified');
  } else {
    console.log('   ❌ FAIL — DUPLICATES FOUND IN DB!');
    process.exit(1);
  }

  console.log('\n======================================================');
  console.log(' ✅ Phase 2.2 concurrency test PASSED');
  console.log('======================================================\n');
}

run().catch(err => {
  console.error('\n❌ Test crashed:', err.message);
  process.exit(1);
});
