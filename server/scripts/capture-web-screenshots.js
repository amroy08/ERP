const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function waitMs(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  try {
    console.log('1. Opening login page...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });

    console.log('2. Logging in as Admin...');
    await page.type('input[placeholder*="email" i], input[type="email"]', 'admin@school.com');
    await page.type('input[placeholder*="password" i], input[type="password"]', 'Admin@123');
    await page.click('button[type="submit"]');

    console.log('3. Waiting for dashboard...');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    await waitMs(2000);

    console.log('4. Navigating to Exams page...');
    await page.goto('http://localhost:5173/exams', { waitUntil: 'networkidle2' });
    await waitMs(3000);

    console.log('5. Clicking Gradebook button...');
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('div'));
      const card = cards.find(c => c.textContent.includes('First Term Examination'));
      if (card) {
        const btn = Array.from(card.querySelectorAll('button')).find(b => b.textContent.includes('Gradebook'));
        if (btn) btn.click();
      }
    });
    await waitMs(3000);

    console.log('6. Clicking Mathematics subject...');
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('p, span, div'));
      const math = items.find(i => i.textContent.trim() === 'Mathematics');
      if (math) {
        math.click();
      }
    });
    await waitMs(3000);

    console.log('7. Clicking Edit marks for Jane Doe...');
    await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('tr'));
      const row = rows.find(r => r.textContent.includes('Jane Doe'));
      if (row) {
        const editBtn = row.querySelector('[title="Edit marks"]');
        if (editBtn) editBtn.click();
      }
    });
    await waitMs(1000);

    console.log('8. Typing 88 marks and remark...');
    await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('tr'));
      const row = rows.find(r => r.textContent.includes('Jane Doe'));
      if (row) {
        const inputs = Array.from(row.querySelectorAll('input'));
        // Helper to set React input value
        const setReactValue = (el, val) => {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(el, val);
          el.dispatchEvent(new Event('input', { bubbles: true }));
        };
        if (inputs[0]) {
          setReactValue(inputs[0], '88');
        }
        if (inputs[1]) {
          setReactValue(inputs[1], '100');
        }
        if (inputs[2]) {
          setReactValue(inputs[2], 'Phase 3.2C evidence check');
        }
      }
    });
    await waitMs(1000);

    console.log('9. Saving marks...');
    await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('tr'));
      const row = rows.find(r => r.textContent.includes('Jane Doe'));
      if (row) {
        const saveBtn = Array.from(row.querySelectorAll('button')).find(b => b.textContent.includes('Save'));
        if (saveBtn) saveBtn.click();
      }
    });
    await waitMs(4000);

    console.log('10. Capturing web_marks_saved_status.png...');
    const ssDir = path.join(__dirname, '..', '..', 'test-results', 'phase-3-2c-web-exam-marks-parity', 'screenshots');
    if (!fs.existsSync(ssDir)) {
      fs.mkdirSync(ssDir, { recursive: true });
    }
    await page.screenshot({ path: path.join(ssDir, 'web_marks_saved_status.png') });
    console.log('    Saved web_marks_saved_status.png successfully!');

    console.log('11. Clearing login session...');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    await waitMs(2000);

    console.log('12. Logging in as Parent...');
    await page.type('input[placeholder*="email" i], input[type="email"]', 'parent@school.com');
    await page.type('input[placeholder*="password" i], input[type="password"]', 'Admin@123');
    await page.click('button[type="submit"]');

    console.log('13. Waiting for parent dashboard...');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    await waitMs(2000);

    console.log('14. Navigating to Exams page...');
    await page.goto('http://localhost:5173/exams', { waitUntil: 'networkidle2' });
    await waitMs(3000);

    console.log('15. Clicking exam card for results...');
    await page.evaluate(() => {
      const h3s = Array.from(document.querySelectorAll('h3'));
      const header = h3s.find(h => h.textContent.includes('First Term Examination'));
      if (header) {
        header.click();
      }
    });
    await waitMs(3500);

    console.log('16. Capturing web_parent_results_view.png...');
    await page.screenshot({ path: path.join(ssDir, 'web_parent_results_view.png') });
    console.log('    Saved web_parent_results_view.png successfully!');

  } catch (error) {
    console.error('Error during browser automation:', error);
  } finally {
    await browser.close();
    console.log('Done!');
  }
})();
