/**
 * Phase 3.2B — Web Homework Submission Parity Test
 *
 * Tests all new shared web homework submission endpoints for role-based access.
 *
 * Run:
 *   cd server
 *   npx ts-node --transpile-only scripts/test-web-homework-submission-parity.ts
 */

import * as http from 'http';

const BASE_HOST = '127.0.0.1';
const BASE_PORT = 5001;
const BASE_PATH = '/api';

const CREDS = {
  admin:   { email: 'admin@school.com',                    password: 'Admin@123' },
  teacher: { email: 'tea.alice.0070276@school.local',      password: 'Teacher@123' },
  student: { email: 'stu.adm20267672@school.local',        password: 'Student@123' },
  parent:  { email: 'parent.adm20267881@school.local',     password: 'Admin@123' },
};

type Role = keyof typeof CREDS;
const tokens: Partial<Record<Role, string>> = {};
const homeworkIds: string[] = [];
let testSubmissionId: string | null = null;

// ── HTTP Helper ────────────────────────────────────────────────────────────

function request(method: string, path: string, body?: any, token?: string): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : '';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(bodyStr).toString(),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(
      { hostname: BASE_HOST, port: BASE_PORT, path: BASE_PATH + path, method, headers },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => raw += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode ?? 0, data: JSON.parse(raw) });
          } catch {
            resolve({ status: res.statusCode ?? 0, data: raw });
          }
        });
      }
    );
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

const get   = (path: string, token?: string) => request('GET',   path, undefined, token);
const post  = (path: string, body: any, token?: string) => request('POST',  path, body, token);
const patch = (path: string, body: any, token?: string) => request('PATCH', path, body, token);

// ── Logging ────────────────────────────────────────────────────────────────

const pass = (msg: string) => console.log(`  ✅  ${msg}`);
const fail = (msg: string) => console.log(`  ❌  ${msg}`);
const info = (msg: string) => console.log(`  ℹ️  ${msg}`);
const sep  = (s: string)   => console.log(`\n${'─'.repeat(60)}\n${s}\n${'─'.repeat(60)}`);

// ── Login ──────────────────────────────────────────────────────────────────

async function login(role: Role): Promise<string | null> {
  const res = await post('/auth/login', CREDS[role]);
  if (res.status === 200 && res.data?.data?.accessToken) {
    tokens[role] = res.data.data.accessToken;
    return res.data.data.accessToken;
  }
  fail(`Login failed for ${role}: ${res.status}`);
  return null;
}

// ── Tests ──────────────────────────────────────────────────────────────────

async function step0_login() {
  sep('STEP 0: Login all roles');
  for (const role of Object.keys(CREDS) as Role[]) {
    const tok = await login(role);
    if (tok) pass(`${role} login OK`);
  }
}

async function step1_fetchHomework() {
  sep('STEP 1: Admin fetches homework list');
  const tok = tokens.admin;
  if (!tok) { fail('No admin token'); return; }

  const res = await get('/homework', tok);
  if (res.status === 200 && Array.isArray(res.data.data)) {
    pass(`GET /homework → ${res.data.data.length} items`);
    (res.data.data as any[]).slice(0, 3).forEach((hw: any) => homeworkIds.push(hw.id));
    if (homeworkIds.length === 0) info('No homework found — create some via web console first');
  } else {
    fail(`GET /homework → ${res.status}`);
  }
}

async function step2_adminSubmissions() {
  sep('STEP 2: Admin views submission roster');
  if (homeworkIds.length === 0) { info('Skipped — no homework'); return; }

  for (const hwId of homeworkIds.slice(0, 2)) {
    const res = await get(`/homework/${hwId}/submissions`, tokens.admin!);
    if (res.status === 200 && res.data.data) {
      const { stats, students } = res.data.data;
      pass(`GET /homework/${hwId.slice(0, 8)}.../submissions → total=${stats.total}, submitted=${stats.submittedCount}`);
      const sub = (students as any[]).find((s: any) => s.submissionId && s.status !== 'pending');
      if (sub && !testSubmissionId) {
        testSubmissionId = sub.submissionId;
        info(`Using submissionId=${testSubmissionId}`);
      }
    } else {
      fail(`GET /homework/${hwId.slice(0, 8)}.../submissions → ${res.status}`);
    }
  }
}

async function step3_studentParentBlocked() {
  sep('STEP 3: Student & Parent are blocked (403)');
  if (homeworkIds.length === 0) { info('Skipped — no homework'); return; }

  for (const role of ['student', 'parent'] as Role[]) {
    const tok = tokens[role];
    if (!tok) { info(`No ${role} token`); continue; }

    const r1 = await get(`/homework/${homeworkIds[0]}/submissions`, tok);
    r1.status === 403
      ? pass(`${role} GET .../submissions → 403 ✓`)
      : fail(`${role} GET .../submissions → ${r1.status} (expected 403)`);

    if (testSubmissionId) {
      const r2 = await get(`/homework/submissions/${testSubmissionId}`, tok);
      r2.status === 403
        ? pass(`${role} GET .../submissions/:id → 403 ✓`)
        : fail(`${role} GET .../submissions/:id → ${r2.status} (expected 403)`);

      const r3 = await patch(`/homework/submissions/${testSubmissionId}/review`, { status: 'reviewed' }, tok);
      r3.status === 403
        ? pass(`${role} PATCH .../review → 403 ✓`)
        : fail(`${role} PATCH .../review → ${r3.status} (expected 403)`);
    }
  }
}

async function step4_submissionDetail() {
  sep('STEP 4: Admin views submission detail (no filePath)');
  if (!testSubmissionId) { info('Skipped — no submission ID'); return; }

  const res = await get(`/homework/submissions/${testSubmissionId}`, tokens.admin!);
  if (res.status === 200 && res.data.data) {
    const d = res.data.data;
    pass(`GET /homework/submissions/${testSubmissionId.slice(0, 8)}... → status=${d.status}`);
    pass(`Student: ${d.student?.studentName}`);
    'filePath' in d ? fail('filePath exposed in response — security bug!') : pass('filePath NOT in response ✓');
    info(`canReview=${d.canReview}, canReturn=${d.canReturn}, canDownload=${d.canDownload}`);
  } else {
    fail(`GET submission detail → ${res.status}`);
  }
}

async function step5_reviewSubmission() {
  sep('STEP 5: Admin reviews a submission');
  if (!testSubmissionId) { info('Skipped — no submission ID'); return; }

  const det = await get(`/homework/submissions/${testSubmissionId}`, tokens.admin!);
  if (!det.data?.data?.canReview) {
    info(`Submission not in reviewable state (status=${det.data?.data?.status}) — skipping`);
    return;
  }

  const res = await patch(`/homework/submissions/${testSubmissionId}/review`, {
    status: 'reviewed',
    teacherFeedback: 'Phase 3.2B web review test — well done!',
    marks: 9
  }, tokens.admin!);

  res.status === 200
    ? pass(`PATCH .../review → reviewed ✓ marks=${res.data.data?.marks}`)
    : fail(`PATCH .../review → ${res.status}: ${JSON.stringify(res.data)}`);
}

async function step6_invalidStatus() {
  sep('STEP 6: Invalid status rejected (400)');
  if (!testSubmissionId) { info('Skipped'); return; }

  const res = await patch(`/homework/submissions/${testSubmissionId}/review`, { status: 'hacked' }, tokens.admin!);
  res.status === 400
    ? pass('Invalid status → 400 ✓')
    : fail(`Invalid status → ${res.status} (expected 400)`);
}

async function step7_negativeMarks() {
  sep('STEP 7: Negative marks rejected (400)');
  if (!testSubmissionId) { info('Skipped'); return; }

  const res = await patch(`/homework/submissions/${testSubmissionId}/review`, { marks: -5 }, tokens.admin!);
  res.status === 400
    ? pass('Negative marks → 400 ✓')
    : fail(`Negative marks → ${res.status} (expected 400)`);
}

async function step8_downloadSecurity() {
  sep('STEP 8: Download endpoint security');
  if (!testSubmissionId) { info('Skipped'); return; }

  for (const role of ['student', 'parent'] as Role[]) {
    const tok = tokens[role];
    if (!tok) continue;
    const r = await get(`/homework/submissions/${testSubmissionId}/download`, tok);
    r.status === 403
      ? pass(`${role} download → 403 ✓`)
      : fail(`${role} download → ${r.status} (expected 403)`);
  }

  const r = await get(`/homework/submissions/${testSubmissionId}/download`, tokens.admin!);
  [200, 404].includes(r.status)
    ? pass(`Admin download → ${r.status} (200=file streamed, 404=no file — both correct) ✓`)
    : fail(`Admin download → ${r.status}`);
}

async function step9_teacherScope() {
  sep('STEP 9: Teacher scoped access');
  const tok = tokens.teacher;
  if (!tok) { info('No teacher token'); return; }

  const hwRes = await get('/homework', tok);
  if (hwRes.status === 200) {
    const list: any[] = hwRes.data.data ?? [];
    pass(`Teacher GET /homework → ${list.length} items`);
    if (list.length > 0) {
      const hwId = list[0].id;
      const subRes = await get(`/homework/${hwId}/submissions`, tok);
      if (subRes.status === 200) pass(`Teacher can view submissions for their homework ✓`);
      else if (subRes.status === 403) info(`Teacher got 403 for this homework (not theirs — OK)`);
      else fail(`Teacher GET submissions → ${subRes.status}`);
    }
  } else {
    fail(`Teacher GET /homework → ${hwRes.status}`);
  }
}

// ── Main ───────────────────────────────────────────────────────────────────

(async () => {
  console.log('\n🏫 Phase 3.2B — Web Homework Submission Parity Test\n');
  const start = Date.now();

  await step0_login();
  await step1_fetchHomework();
  await step2_adminSubmissions();
  await step3_studentParentBlocked();
  await step4_submissionDetail();
  await step5_reviewSubmission();
  await step6_invalidStatus();
  await step7_negativeMarks();
  await step8_downloadSecurity();
  await step9_teacherScope();

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`✅  Phase 3.2B test complete in ${elapsed}s`);
  console.log('═'.repeat(60));
  console.log('\nRuntime verification checklist:');
  console.log('  1. Web console → Homework → click a card → see submission list');
  console.log('  2. Click View/Review on a student → review modal opens');
  console.log('  3. Enter feedback + marks → Mark Reviewed → status updates');
  console.log('  4. Mobile student → see updated submission status');
  console.log('  5. Mobile parent → see updated child homework status');
  console.log('  6. Mobile teacher → see updated submission in review list\n');
})();
