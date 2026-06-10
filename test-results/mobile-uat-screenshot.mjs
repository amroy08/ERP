// mobile-uat-screenshot.mjs - Programmatic Playwright script for Mobile UI runtime verification
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS_DIR = join(__dirname, 'phase-3-0e-mobile-ui-polish-real-runtime');
mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const EXPO_URL = 'http://localhost:8082';

function log(msg) {
  console.log(`[Mobile Audit] ${msg}`);
}

async function takeScreenshot(page, name) {
  const filePath = join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: filePath });
  log(`📸 Screenshot saved: ${name}.png`);
}

async function main() {
  log('Starting Mobile UI Polish Verification on running Expo app...');
  
  const browser = await chromium.launch({ headless: true });
  // Simulate mobile view
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  
  const page = await context.newPage();
  
  // Navigate to Expo Web
  log(`Navigating to ${EXPO_URL}...`);
  await page.goto(EXPO_URL, { waitUntil: 'networkidle' });
  
  // Wait for React Native app to mount (wait for Sign In card)
  log('Waiting for application bundle to load...');
  await page.waitForSelector('text=Sign In', { timeout: 30000 });
  log('Application loaded successfully!');
  
  // 1. Capture Login Screen
  await takeScreenshot(page, 'login_screen');
  
  // Test password toggle
  log('Testing password toggle visibility...');
  const passwordInput = page.locator('input[placeholder="Enter your password"]');
  await passwordInput.fill('password123');
  await page.waitForTimeout(500);
  
  // Check default secure status (dots, mask)
  const isSecureBefore = await passwordInput.getAttribute('type');
  log(`Password input type initially: ${isSecureBefore}`);
  
  // Click Show button
  const toggleBtn = page.locator('text=👁️ Show');
  if (await toggleBtn.count() > 0) {
    await toggleBtn.click();
    await page.waitForTimeout(500);
    const isSecureAfter = await passwordInput.getAttribute('type');
    log(`Password input type after toggle: ${isSecureAfter}`);
  }
  
  // =========================================================================
  // 2. PARENT PORTAL AUDIT
  // =========================================================================
  log('\n--- Parent Portal Audit ---');
  // Click Parent Demo chip
  log('Logging in as Parent Demo...');
  await page.click('text=Parent Demo');
  
  // Wait for home dashboard
  await page.waitForSelector('text=Parent Portal', { timeout: 15000 });
  await page.waitForTimeout(1000);
  await takeScreenshot(page, 'parent_home');
  
  // Navigate to Attendance Tab
  log('Navigating to Parent Attendance...');
  await page.click('text=Attendance');
  await page.waitForTimeout(1500);
  await takeScreenshot(page, 'parent_attendance');
  
  // Navigate to Fees Tab
  log('Navigating to Parent Fees...');
  await page.click('text=Fees');
  await page.waitForTimeout(1500);
  await takeScreenshot(page, 'parent_fees');
  
  // Navigate to Notices Tab
  log('Navigating to Parent Notices...');
  await page.click('text=Notices');
  await page.waitForTimeout(1500);
  await takeScreenshot(page, 'parent_notices');
  
  // Test notices expand/collapse
  log('Testing parent notices expand/collapse action...');
  const firstNoticeTap = page.locator('text=Tap to read').first();
  if (await firstNoticeTap.count() > 0) {
    await firstNoticeTap.click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, 'parent_notices_expanded');
  }
  
  // Click Home tab, then Logout
  await page.click('text=Home');
  await page.waitForTimeout(500);
  log('Logging out from Parent Portal...');
  const signOutBtn = page.locator('text=Sign Out');
  await signOutBtn.click();
  await page.waitForSelector('text=Sign In', { timeout: 5000 });
  await page.waitForTimeout(1000);

  // =========================================================================
  // 3. STUDENT PORTAL AUDIT
  // =========================================================================
  log('\n--- Student Portal Audit ---');
  log('Logging in as Student Demo...');
  await page.click('text=Student Demo');
  
  // Wait for Student Home
  await page.waitForSelector('text=Student Portal', { timeout: 15000 });
  await page.waitForTimeout(1000);
  await takeScreenshot(page, 'student_home');
  
  // Navigate to Timetable
  log('Navigating to Student Timetable...');
  await page.click('text=Timetable');
  await page.waitForTimeout(1500);
  await takeScreenshot(page, 'student_timetable');
  
  // Navigate to Homework
  log('Navigating to Student Homework...');
  await page.click('text=Homework');
  await page.waitForTimeout(1500);
  await takeScreenshot(page, 'student_homework');
  
  // Navigate to Exams
  log('Navigating to Student Exams...');
  await page.click('text=Exams');
  await page.waitForTimeout(1500);
  await takeScreenshot(page, 'student_exams');
  
  // Click Home, then Logout
  await page.click('text=Home');
  await page.waitForTimeout(500);
  log('Logging out from Student Portal...');
  await signOutBtn.click();
  await page.waitForSelector('text=Sign In', { timeout: 5000 });
  await page.waitForTimeout(1000);

  // =========================================================================
  // 4. TEACHER PORTAL AUDIT
  // =========================================================================
  log('\n--- Teacher Portal Audit ---');
  log('Logging in as Teacher Demo...');
  await page.click('text=Teacher Demo');
  
  // Wait for Teacher Home
  await page.waitForSelector('text=Teacher Portal', { timeout: 15000 });
  await page.waitForTimeout(1000);
  await takeScreenshot(page, 'teacher_home');
  
  // Navigate to Timetable
  log('Navigating to Teacher Timetable...');
  await page.click('text=Timetable');
  await page.waitForTimeout(1500);
  await takeScreenshot(page, 'teacher_timetable');
  
  // Navigate to Attendance
  log('Navigating to Teacher Attendance Class List...');
  await page.click('text=Attendance');
  await page.waitForTimeout(1500);
  await takeScreenshot(page, 'teacher_attendance_list');
  
  // Click on first class card to mark attendance
  log('Opening Teacher attendance marking screen...');
  const markBtn = page.locator('text=Mark →').first();
  if (await markBtn.count() > 0) {
    await markBtn.click();
    await page.waitForTimeout(1500);
    await takeScreenshot(page, 'teacher_attendance_marking');
    
    // Go back
    await page.click('text=← Back');
    await page.waitForTimeout(500);
  }
  
  // Navigate to Notices
  log('Navigating to Teacher Notices...');
  await page.click('text=Notices');
  await page.waitForTimeout(1500);
  await takeScreenshot(page, 'teacher_notices');
  
  // Click Home, then Logout
  await page.click('text=Home');
  await page.waitForTimeout(500);
  log('Logging out from Teacher Portal...');
  await signOutBtn.click();
  await page.waitForSelector('text=Sign In', { timeout: 5000 });
  
  log('\nAll verification tasks completed successfully!');
  await browser.close();
}

main().catch((err) => {
  console.error('FATAL ERROR DURING AUDIT:', err);
  process.exit(1);
});
