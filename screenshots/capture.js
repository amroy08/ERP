const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.join(__dirname);
const BASE_URL = 'http://localhost:5173';

// The admin login credentials
const EMAIL = 'admin@school.com';
const PASSWORD = 'Admin@123';

const pages = [
  { name: '02_dashboard', url: '/dashboard' },
  { name: '03_students_list', url: '/students' },
  { name: '04_admissions', url: '/admissions' },
  { name: '05_parents', url: '/parents' },
  { name: '06_teachers', url: '/teachers' },
  { name: '07_attendance', url: '/attendance/students' },
  { name: '08_classes', url: '/classes' },
  { name: '09_subjects', url: '/subjects' },
  { name: '10_timetable', url: '/timetable' },
  { name: '11_exams', url: '/exams' },
  { name: '12_fee_structures', url: '/fees/structures' },
  { name: '13_fee_collection', url: '/fees/collect' },
  { name: '14_reports', url: '/reports' },
  { name: '15_notices', url: '/notices' },
  { name: '16_settings', url: '/settings' },
];

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function captureScreenshots() {
  console.log('🚀 Starting ERP screenshot capture...\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1470,900'],
    defaultViewport: { width: 1470, height: 900 }
  });

  const page = await browser.newPage();

  // Step 1: Go to login page and capture it
  console.log('📸 Capturing: Login page');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2', timeout: 15000 });
  await sleep(2000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '01_login.png'), fullPage: false });
  console.log('   ✅ 01_login.png');

  // Step 2: Log in - find all inputs on the page first
  console.log('\n🔐 Logging in...');
  
  // Get all input fields for debugging
  const inputs = await page.$$('input');
  console.log(`   Found ${inputs.length} input fields`);
  
  // Clear and type email
  const emailInput = await page.$('input[type="email"], input[name="email"], input[placeholder*="email"], input[placeholder*="Email"]');
  if (emailInput) {
    await emailInput.click({ clickCount: 3 });
    await emailInput.type(EMAIL, { delay: 30 });
    console.log('   ✅ Typed email');
  } else {
    // Try first input
    await inputs[0].click({ clickCount: 3 });
    await inputs[0].type(EMAIL, { delay: 30 });
    console.log('   ✅ Typed email (first input)');
  }

  // Type password
  const passwordInput = await page.$('input[type="password"], input[name="password"]');
  if (passwordInput) {
    await passwordInput.click({ clickCount: 3 });
    await passwordInput.type(PASSWORD, { delay: 30 });
    console.log('   ✅ Typed password');
  }

  // Click submit button
  const submitBtn = await page.$('button[type="submit"]');
  if (submitBtn) {
    await submitBtn.click();
    console.log('   ✅ Clicked submit');
  } else {
    await page.keyboard.press('Enter');
    console.log('   ✅ Pressed Enter');
  }

  // Wait for redirect to dashboard
  try {
    await page.waitForFunction(() => window.location.href.includes('/dashboard'), { timeout: 12000 });
    console.log('   ✅ Logged in and redirected to dashboard\n');
  } catch(e) {
    // Check what URL we're on now
    const url = page.url();
    console.log(`   ⚠️  Current URL: ${url}\n`);
  }

  await sleep(2500); // Wait for dashboard data to load

  // Step 3: Capture all pages
  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    try {
      console.log(`📸 Capturing: ${p.name}`);
      await page.goto(`${BASE_URL}${p.url}`, { waitUntil: 'networkidle2', timeout: 15000 });
      await sleep(2500); // Wait for charts/data to render
      await page.screenshot({ path: path.join(OUTPUT_DIR, `${p.name}.png`), fullPage: false });
      console.log(`   ✅ ${p.name}.png`);
    } catch (err) {
      console.log(`   ❌ Failed to capture ${p.name}: ${err.message}`);
    }
  }

  await browser.close();

  // List all captured PNGs
  const files = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.png')).sort();
  console.log(`\n🎉 Done! Captured ${files.length} screenshots in: ${OUTPUT_DIR}`);
  files.forEach(f => console.log(`   📷 ${f}`));
}

captureScreenshots().catch(console.error);
