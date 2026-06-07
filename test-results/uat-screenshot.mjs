// UAT Browser Screenshot Script — Phase 2.5 Final Verification
// Run: node test-results/uat-screenshot.mjs
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS = join(__dirname, 'final-uat-screenshots');
mkdirSync(SCREENSHOTS, { recursive: true });

const BASE = 'http://localhost:5173';
const results = [];
const consoleErrors = [];

function log(msg) { console.log('[UAT] ' + msg); }
function pass(label) { results.push({ label, status: 'PASS' }); log('✅  PASS: ' + label); }
function fail(label, reason) { results.push({ label, status: 'FAIL', reason }); log('❌  FAIL: ' + label + ' — ' + reason); }

async function shot(page, filename, label) {
  const path = join(SCREENSHOTS, filename);
  await page.screenshot({ path, fullPage: false });
  log('📸  Screenshot: ' + filename);
  pass(label + ' — screenshot captured');
  return path;
}

async function login(page, email, password, role) {
  await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  try {
    await page.waitForURL('**/dashboard', { timeout: 8000 });
    await page.waitForTimeout(1500);
    pass('Login as ' + role);
  } catch {
    fail('Login as ' + role, 'Did not reach dashboard');
  }
}

async function logout(page) {
  try {
    // Click profile dropdown
    await page.click('button:has(.lucide-chevron-down)', { timeout: 3000 });
    await page.waitForTimeout(400);
    // Click Sign Out
    await page.click('text=Sign Out', { timeout: 3000 });
    await page.waitForURL('**/login', { timeout: 5000 });
  } catch {
    // Fallback: clear localStorage and go to login
    await page.evaluate(() => localStorage.clear());
    await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
  }
  await page.waitForTimeout(500);
}

async function checkNoChildSwitcher(page, role) {
  // Child switcher is in the topbar with a select element inside an indigo-50 div
  const switcher = page.locator('div.bg-indigo-50 select');
  const count = await switcher.count();
  if (count === 0) {
    pass(role + ': No child switcher visible (correct)');
  } else {
    fail(role + ': Child switcher visible — should not appear for ' + role);
  }
}

async function checkChildSwitcherPresent(page) {
  const switcher = page.locator('div.bg-indigo-50 select');
  const count = await switcher.count();
  if (count > 0) {
    pass('Parent: Child switcher is visible in TopBar');
    return true;
  } else {
    fail('Parent: Child switcher not found in TopBar');
    return false;
  }
}

async function main() {
  log('=== UAT FINAL BROWSER SCREENSHOT PASS ===');
  log('Output directory: ' + SCREENSHOTS);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 991 } });
  const page = await context.newPage();

  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push({ url: page.url(), text: msg.text() });
    }
  });

  // ============================================================
  // 1. ADMIN PASS
  // ============================================================
  log('\n--- ADMIN PASS ---');
  await login(page, 'admin@school.com', 'Admin@123', 'admin');
  await page.waitForTimeout(1000);
  await shot(page, '01-admin-dashboard.png', 'Admin dashboard');

  // Sidebar — check if it's collapsed, expand it
  const sidebar = page.locator('nav, aside').first();
  await page.waitForTimeout(500);
  await shot(page, '02-admin-sidebar.png', 'Admin sidebar');

  await page.goto(BASE + '/students', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await shot(page, '03-admin-students.png', 'Admin student list');

  await page.goto(BASE + '/fees', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await shot(page, '04-admin-fees.png', 'Admin fee page');

  await page.goto(BASE + '/reports', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await shot(page, '05-admin-reports.png', 'Admin reports page');

  // ============================================================
  // 2. PARENT PASS
  // ============================================================
  log('\n--- PARENT PASS ---');
  await logout(page);
  await login(page, 'parent@school.com', 'Admin@123', 'parent');
  await page.waitForTimeout(1000);
  await shot(page, '06-parent-dashboard.png', 'Parent dashboard');

  // Capture child switcher (in-page topbar, no click needed)
  await checkChildSwitcherPresent(page);
  await shot(page, '07-parent-child-switcher.png', 'Parent child switcher in TopBar');

  // Open child switcher dropdown
  try {
    const selectEl = page.locator('div.bg-indigo-50 select');
    await selectEl.click();
    await page.waitForTimeout(400);
    await shot(page, '07b-parent-child-switcher-open.png', 'Parent child switcher open');
    // Close by pressing Escape
    await page.keyboard.press('Escape');
  } catch {
    log('Could not open child switcher dropdown (may be native select)');
  }

  await page.goto(BASE + '/student/fees', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await shot(page, '08-parent-fees.png', 'Parent child fees page');

  await page.goto(BASE + '/student/attendance', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await shot(page, '08b-parent-attendance.png', 'Parent child attendance page');

  await page.goto(BASE + '/timetable', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await shot(page, '08c-parent-timetable.png', 'Parent timetable page');

  await page.goto(BASE + '/homework', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await shot(page, '08d-parent-homework.png', 'Parent homework page');

  await page.goto(BASE + '/exams', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await shot(page, '08e-parent-exams.png', 'Parent exams page');

  await page.goto(BASE + '/notices', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await shot(page, '08f-parent-notices.png', 'Parent notices page');

  // ============================================================
  // 3. STUDENT PASS
  // ============================================================
  log('\n--- STUDENT PASS ---');
  await logout(page);
  await login(page, 'student@school.com', 'Admin@123', 'student');
  await page.waitForTimeout(1000);
  await shot(page, '09-student-dashboard.png', 'Student dashboard');
  await checkNoChildSwitcher(page, 'Student');

  await page.goto(BASE + '/student/fees', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await shot(page, '10-student-fees.png', 'Student fees page');

  await page.goto(BASE + '/student/attendance', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await shot(page, '10b-student-attendance.png', 'Student attendance page');

  await page.goto(BASE + '/timetable', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await shot(page, '10c-student-timetable.png', 'Student timetable page');

  await page.goto(BASE + '/homework', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await shot(page, '10d-student-homework.png', 'Student homework page');

  await page.goto(BASE + '/exams', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await shot(page, '10e-student-exams.png', 'Student exams page');

  await page.goto(BASE + '/notices', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await shot(page, '10f-student-notices.png', 'Student notices page');

  // ============================================================
  // 4. TEACHER PASS
  // ============================================================
  log('\n--- TEACHER PASS ---');
  await logout(page);
  await login(page, 'teacher@school.com', 'Admin@123', 'teacher');
  await page.waitForTimeout(1000);
  await shot(page, '11-teacher-dashboard.png', 'Teacher dashboard');
  await checkNoChildSwitcher(page, 'Teacher');

  await page.goto(BASE + '/attendance', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await shot(page, '11b-teacher-attendance.png', 'Teacher attendance page');

  await page.goto(BASE + '/homework', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await shot(page, '11c-teacher-homework.png', 'Teacher homework page');

  await page.goto(BASE + '/timetable', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await shot(page, '11d-teacher-timetable.png', 'Teacher timetable page');

  await page.goto(BASE + '/exams', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await shot(page, '11e-teacher-exams.png', 'Teacher exams page');

  // ============================================================
  // 5. CLERK PASS
  // ============================================================
  log('\n--- CLERK PASS ---');
  await logout(page);
  await login(page, 'clerk@school.com', 'Admin@123', 'clerk');
  await page.waitForTimeout(1000);
  await shot(page, '12-clerk-dashboard.png', 'Clerk dashboard');
  await checkNoChildSwitcher(page, 'Clerk');

  await page.goto(BASE + '/enquiries', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await shot(page, '12b-clerk-enquiries.png', 'Clerk enquiries page');

  await page.goto(BASE + '/admissions', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await shot(page, '12c-clerk-admissions.png', 'Clerk admissions page');

  await page.goto(BASE + '/fees', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await shot(page, '12d-clerk-fees.png', 'Clerk fee collection page');

  // Verify restricted routes are blocked for clerk
  await page.goto(BASE + '/settings', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const settingsBlocked = await page.locator('text=403, text=Access Denied, text=Forbidden, text=Not found').count() > 0 
    || page.url().includes('/dashboard');
  if (settingsBlocked || !page.url().includes('/settings')) {
    pass('Clerk: /settings is blocked or redirected');
  } else {
    fail('Clerk: /settings not blocked — may expose admin config');
  }

  // ============================================================
  // 6. RESPONSIVE CHECKS (mobile 375px + tablet 768px)
  // ============================================================
  log('\n--- RESPONSIVE CHECKS ---');
  await logout(page);

  // Mobile viewport - parent
  await context.setViewportSize ? null : null; // context doesn't have setViewportSize
  // Use a new page for mobile
  const mobilePage = await context.newPage();
  mobilePage.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push({ url: mobilePage.url(), text: msg.text() });
  });
  await mobilePage.setViewportSize({ width: 375, height: 812 });

  await mobilePage.goto(BASE + '/login', { waitUntil: 'networkidle' });
  await mobilePage.fill('input[type="email"]', 'parent@school.com');
  await mobilePage.fill('input[type="password"]', 'Admin@123');
  await mobilePage.click('button[type="submit"]');
  try {
    await mobilePage.waitForURL('**/dashboard', { timeout: 8000 });
    await mobilePage.waitForTimeout(1500);
    pass('Mobile login as parent');
  } catch {
    fail('Mobile login as parent', 'Did not reach dashboard');
  }
  await shot(mobilePage, '13-mobile-parent-dashboard.png', 'Mobile parent dashboard (375px)');

  await mobilePage.goto(BASE + '/student/fees', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(1000);
  await shot(mobilePage, '13b-mobile-student-fees.png', 'Mobile student fees (375px)');

  // Tablet viewport
  await mobilePage.setViewportSize({ width: 768, height: 1024 });
  await mobilePage.goto(BASE + '/dashboard', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(1000);
  await shot(mobilePage, '13c-tablet-parent-dashboard.png', 'Tablet parent dashboard (768px)');

  await mobilePage.close();

  // ============================================================
  // CLOSE
  // ============================================================
  await browser.close();

  // ============================================================
  // REPORT
  // ============================================================
  console.log('\n\n============================================================');
  console.log(' UAT SCREENSHOT PASS — FINAL REPORT');
  console.log('============================================================\n');

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;

  results.forEach(r => {
    console.log((r.status === 'PASS' ? '✅' : '❌') + '  ' + r.label + (r.reason ? ' — ' + r.reason : ''));
  });

  console.log('\n--- Console Errors ---');
  if (consoleErrors.length === 0) {
    console.log('No console errors detected.');
  } else {
    consoleErrors.forEach(e => console.log('ERROR [' + e.url + ']: ' + e.text));
  }

  console.log('\n--- Summary ---');
  console.log('Checks: ' + passed + ' PASS, ' + failed + ' FAIL');
  console.log('Console Errors: ' + consoleErrors.length);
  console.log('Screenshots saved to: ' + SCREENSHOTS);
  console.log('\nFinal Result: ' + (failed === 0 ? '✅ PASS' : failed <= 2 ? '⚠️ PASS WITH MINOR ISSUES' : '❌ FAIL'));
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
