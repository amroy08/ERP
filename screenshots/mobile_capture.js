// mobile_capture.js - Puppeteer mobile screenshot capture script
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = '/Users/amroy/Desktop/ERP/test-results/phase-3-0e-mobile-ui-polish-real-runtime';
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const BASE_URL = 'http://localhost:8082';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function clickByText(page, text, timeout = 10000) {
  console.log(`   👉 Clicking element with text: "${text}"`);
  const startTime = Date.now();
  while (true) {
    const clicked = await page.evaluate((textToClick) => {
      const elements = Array.from(document.querySelectorAll('*'));
      let target = elements.find(el => el.textContent?.trim() === textToClick);
      if (!target) {
        // Fallback to contains
        target = elements.find(el => el.textContent?.includes(textToClick));
      }
      if (target) {
        let clickable = target;
        while (clickable && clickable.tagName !== 'BODY') {
          const role = clickable.getAttribute('role');
          if (role === 'button' || role === 'tab' || clickable.tagName === 'BUTTON' || clickable.tagName === 'A') {
            break;
          }
          clickable = clickable.parentElement;
        }
        const clickTarget = clickable && clickable.tagName !== 'BODY' ? clickable : target;
        clickTarget.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
        clickTarget.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true }));
        clickTarget.click();
        return true;
      }
      return false;
    }, text);

    if (clicked) {
      break;
    }

    if (Date.now() - startTime > timeout) {
      throw new Error(`Timeout waiting for element with text "${text}"`);
    }
    await sleep(200);
  }
}

async function captureScreenshots() {
  console.log('🚀 Starting Expo Mobile Real UI Verification screenshots...\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=375,812',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process'
    ],
    defaultViewport: {
      width: 375,
      height: 812,
      isMobile: true,
      hasTouch: true
    }
  });

  const page = await browser.newPage();

  // Navigate to login
  console.log('📸 Navigating to Expo web application...');
  await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(4000); // Allow bundling/mounting to settle

  console.log('📸 Capturing: Login Screen');
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'login_screen.png') });
  console.log('   ✅ login_screen.png');

  // Test password toggle
  try {
    console.log('🔑 Testing password input and visibility toggle...');
    const passwordInput = await page.waitForSelector('input[placeholder="Enter your password"]', { timeout: 5000 });
    await passwordInput.type('password123');
    await sleep(500);

    const toggleBtn = await page.waitForSelector('xpath///*[contains(text(), "Show") or contains(text(), "Hide")]', { timeout: 3000 });
    if (toggleBtn) {
      await toggleBtn.click();
      await sleep(500);
      console.log('   ✅ Checked password visibility toggle');
    }
  } catch (err) {
    console.log('   ⚠️ Password toggle selector issue:', err.message);
  }

  // =========================================================================
  // 1. PARENT FLOW
  // =========================================================================
  try {
    console.log('\n--- PARENT FLOW ---');
    console.log('🔐 Logging in as Parent Demo...');
    await clickByText(page, 'Parent Demo');
    await sleep(5000); // wait for dashboard

    console.log('📸 Capturing: Parent Home');
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'parent_home.png') });
    console.log('   ✅ parent_home.png');

    console.log('📸 Capturing: Parent Attendance');
    await clickByText(page, 'Attendance');
    await sleep(2000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'parent_attendance.png') });
    console.log('   ✅ parent_attendance.png');

    console.log('📸 Capturing: Parent Fees');
    await clickByText(page, 'Fees');
    await sleep(2000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'parent_fees.png') });
    console.log('   ✅ parent_fees.png');

    console.log('📸 Capturing: Parent Notices');
    await clickByText(page, 'Notices');
    await sleep(2000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'parent_notices.png') });
    console.log('   ✅ parent_notices.png');

    // Sign out
    console.log('🔐 Signing out Parent...');
    await clickByText(page, 'Home');
    await sleep(1000);
    await clickByText(page, 'Sign Out');
    await sleep(3000);
  } catch (err) {
    console.log('   ❌ Parent flow failed:', err.message);
    // Reload page just in case
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
    await sleep(3000);
  }

  // =========================================================================
  // 2. STUDENT FLOW
  // =========================================================================
  try {
    console.log('\n--- STUDENT FLOW ---');
    console.log('🔐 Logging in as Student Demo...');
    await clickByText(page, 'Student Demo');
    await sleep(5000);

    console.log('📸 Capturing: Student Home');
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'student_home.png') });
    console.log('   ✅ student_home.png');

    console.log('📸 Capturing: Student Timetable');
    await clickByText(page, 'Timetable');
    await sleep(2000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'student_timetable.png') });
    console.log('   ✅ student_timetable.png');

    console.log('📸 Capturing: Student Homework');
    await clickByText(page, 'Homework');
    await sleep(2000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'student_homework.png') });
    console.log('   ✅ student_homework.png');

    console.log('📸 Capturing: Student Exams');
    await clickByText(page, 'Exams');
    await sleep(2000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'student_exams.png') });
    console.log('   ✅ student_exams.png');

    // Sign out
    console.log('🔐 Signing out Student...');
    await clickByText(page, 'Home');
    await sleep(1000);
    await clickByText(page, 'Sign Out');
    await sleep(3000);
  } catch (err) {
    console.log('   ❌ Student flow failed:', err.message);
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
    await sleep(3000);
  }

  // =========================================================================
  // 3. TEACHER FLOW
  // =========================================================================
  try {
    console.log('\n--- TEACHER FLOW ---');
    console.log('🔐 Logging in as Teacher Demo...');
    await clickByText(page, 'Teacher Demo');
    await sleep(5000);

    console.log('📸 Capturing: Teacher Home');
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'teacher_home.png') });
    console.log('   ✅ teacher_home.png');

    console.log('📸 Capturing: Teacher Timetable');
    await clickByText(page, 'Timetable');
    await sleep(2000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'teacher_timetable.png') });
    console.log('   ✅ teacher_timetable.png');

    console.log('📸 Capturing: Teacher Attendance List');
    await clickByText(page, 'Attendance');
    await sleep(2000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'teacher_attendance_list.png') });
    console.log('   ✅ teacher_attendance_list.png');

    console.log('📸 Capturing: Teacher Attendance Marking Screen');
    await clickByText(page, 'Mark →');
    await sleep(2000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'teacher_attendance_marking.png') });
    console.log('   ✅ teacher_attendance_marking.png');

    // Go back
    await clickByText(page, '← Back');
    await sleep(1000);

    console.log('📸 Capturing: Teacher Notices');
    await clickByText(page, 'Notices');
    await sleep(2000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'teacher_notices.png') });
    console.log('   ✅ teacher_notices.png');

    // Sign out
    console.log('🔐 Signing out Teacher...');
    await clickByText(page, 'Home');
    await sleep(1000);
    await clickByText(page, 'Sign Out');
    await sleep(3000);
  } catch (err) {
    console.log('   ❌ Teacher flow failed:', err.message);
  }

  await browser.close();
  console.log('\n🎉 Real mobile runtime screenshot audit pass completed!');
}

captureScreenshots().catch(console.error);
