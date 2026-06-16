const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

async function waitMs(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const HOST = 'http://localhost:5001';
const MOBILE = `${HOST}/api/mobile`;

async function loginMobile(email, password) {
  const res = await fetch(`${HOST}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  return data?.data?.accessToken ?? data?.token;
}

(async () => {
  const ssDir = path.join(__dirname, '..', '..', 'test-results', 'phase-3-2d-full-web-mobile-academic-sync', 'screenshots');
  if (!fs.existsSync(ssDir)) {
    fs.mkdirSync(ssDir, { recursive: true });
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  try {
    console.log('1. Logging in to Web Console as Admin...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    await page.type('input[placeholder*="email" i], input[type="email"]', 'admin@school.com');
    await page.type('input[placeholder*="password" i], input[type="password"]', 'Admin@123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    await waitMs(2000);

    console.log('2. Navigating to Homework page...');
    await page.goto('http://localhost:5173/homework', { waitUntil: 'networkidle2' });
    await waitMs(3000);

    console.log('3. Opening submissions for Algebra Worksheet 1...');
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('div'));
      const algCard = cards.find(c => c.textContent.includes('Algebra Worksheet 1'));
      if (algCard) {
        const btn = Array.from(algCard.querySelectorAll('button')).find(b => b.textContent.includes('Submissions'));
        if (btn) btn.click();
      }
    });
    await waitMs(3000);

    console.log('4. Clicking Review/View for Jane Doe...');
    await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('tr'));
      const row = rows.find(r => r.textContent.includes('Jane Doe'));
      if (row) {
        const btn = Array.from(row.querySelectorAll('button')).find(b => b.textContent.includes('Review') || b.textContent.includes('View'));
        if (btn) btn.click();
      }
    });
    await waitMs(2000);

    console.log('5. Filling feedback and marking reviewed...');
    await page.evaluate(() => {
      // Find modal inputs
      const feedbackInput = document.querySelector('textarea, input[placeholder*="feedback" i]');
      const marksInput = document.querySelector('input[type="number"], input[placeholder*="marks" i]');
      
      const setReactValue = (el, val) => {
        const setter = Object.getOwnPropertyDescriptor(el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype, 'value').set;
        setter.call(el, val);
        el.dispatchEvent(new Event('input', { bubbles: true }));
      };

      if (feedbackInput) setReactValue(feedbackInput, 'Phase 3.2D homework sync check');
      if (marksInput) setReactValue(marksInput, '9');
    });
    await waitMs(1000);

    console.log('6. Submitting review...');
    await page.evaluate(() => {
      const modal = document.querySelector('.fixed, .absolute, div[role="dialog"]');
      if (modal) {
        const btn = Array.from(modal.querySelectorAll('button')).find(b => b.textContent.includes('Mark Reviewed'));
        if (btn) btn.click();
      }
    });
    await waitMs(4000);

    console.log('7. Saving homework_web_reviewed.png...');
    await page.screenshot({ path: path.join(ssDir, 'homework_web_reviewed.png') });
    console.log('   Saved homework_web_reviewed.png successfully!');

    // ── Simulate mobile teacher review action via API (Step 4) ──
    console.log('8. Logging in mobile API as teacher...');
    const teacherToken = await loginMobile('teacher@school.com', 'Admin@123');
    console.log('   Teacher token acquired.');

    console.log('9. Finding Jane Doe submission via mobile API...');
    const hwListRes = await fetch(`${MOBILE}/teacher/homework`, { headers: { Authorization: `Bearer ${teacherToken}` } });
    const hwListData = await hwListRes.json();
    const algHw = hwListData.data.find(h => h.title === 'Algebra Worksheet 1');
    
    if (algHw) {
      const subsRes = await fetch(`${MOBILE}/teacher/homework/${algHw.homeworkId}/submissions`, { headers: { Authorization: `Bearer ${teacherToken}` } });
      const subsData = await subsRes.json();
      const janeSub = subsData.data.students.find(s => s.studentName === 'Jane Doe');
      
      if (janeSub && janeSub.submissionId) {
        console.log('10. Simulating mobile teacher return submission with new feedback...');
        const reviewRes = await fetch(`${MOBILE}/teacher/homework/submissions/${janeSub.submissionId}/review`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${teacherToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: 'returned',
            teacherFeedback: 'Phase 3.2D mobile homework sync check',
            marks: 7
          })
        });
        const reviewData = await reviewRes.json();
        console.log('    Mobile API status code:', reviewRes.status, JSON.stringify(reviewData));
      }
    }

    console.log('11. Refreshing web homework submissions...');
    await page.evaluate(() => {
      const refreshBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Refresh') || b.querySelector('svg'));
      if (refreshBtn) refreshBtn.click();
    });
    await waitMs(3000);

    console.log('12. Capturing homework_mobile_to_web_reflected.png...');
    await page.screenshot({ path: path.join(ssDir, 'homework_mobile_to_web_reflected.png') });
    console.log('    Saved homework_mobile_to_web_reflected.png successfully!');

    // ── Web Marks Entry (Step 5) ──
    console.log('13. Navigating to Exams page...');
    await page.goto('http://localhost:5173/exams', { waitUntil: 'networkidle2' });
    await waitMs(3000);

    console.log('14. Clicking Gradebook for First Term Examination...');
    await page.evaluate(() => {
      const card = Array.from(document.querySelectorAll('div')).find(c => c.textContent.includes('First Term Examination') && c.textContent.includes('Class 1'));
      if (card) {
        const btn = Array.from(card.querySelectorAll('button')).find(b => b.textContent.includes('Gradebook'));
        if (btn) btn.click();
      }
    });
    await waitMs(3000);

    console.log('15. Clicking Mathematics subject...');
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('p, span, div'));
      const math = items.find(i => i.textContent.trim() === 'Mathematics');
      if (math) math.click();
    });
    await waitMs(3000);

    console.log('16. Editing marks for Jane Doe...');
    await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('tr'));
      const row = rows.find(r => r.textContent.includes('Jane Doe'));
      if (row) {
        const editBtn = row.querySelector('[title="Edit marks"]');
        if (editBtn) editBtn.click();
      }
    });
    await waitMs(1000);

    console.log('17. Setting 89 marks and remark...');
    await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('tr'));
      const row = rows.find(r => r.textContent.includes('Jane Doe'));
      if (row) {
        const inputs = Array.from(row.querySelectorAll('input'));
        const setReactValue = (el, val) => {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(el, val);
          el.dispatchEvent(new Event('input', { bubbles: true }));
        };
        if (inputs[0]) setReactValue(inputs[0], '89');
        if (inputs[1]) setReactValue(inputs[1], '100');
        if (inputs[2]) setReactValue(inputs[2], 'Phase 3.2D marks sync check');
      }
    });
    await waitMs(1000);

    console.log('18. Saving marks on web...');
    await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('tr'));
      const row = rows.find(r => r.textContent.includes('Jane Doe'));
      if (row) {
        const saveBtn = Array.from(row.querySelectorAll('button')).find(b => b.textContent.includes('Save'));
        if (saveBtn) saveBtn.click();
      }
    });
    await waitMs(4000);

    console.log('19. Capturing marks_web_saved.png...');
    await page.screenshot({ path: path.join(ssDir, 'marks_web_saved.png') });
    console.log('    Saved marks_web_saved.png successfully!');

    // ── Simulate Mobile Teacher Save Marks via API (Step 6) ──
    console.log('20. Simulating mobile teacher saving marks as 90 via API...');
    const examId = 'b8db656a-f28a-43ef-9c8b-4dec12ea302b';
    const subjectId = '8a278bc9-0c6e-435e-b478-eceb1af3a0fc';
    const saveMarksRes = await fetch(`${MOBILE}/teacher/marks/exams/${examId}/save`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${teacherToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subjectId,
        maxMarks: 100,
        marks: [
          {
            studentId: '38518d8e-968a-4eaf-aec0-c5878808da1c', // Jane Doe
            marksObtained: 90,
            remarks: 'Updated via Phase 3.2D Mobile Teacher'
          }
        ]
      })
    });
    const saveMarksData = await saveMarksRes.json();
    console.log('    Mobile API status code:', saveMarksRes.status, JSON.stringify(saveMarksData));

    console.log('21. Refreshing web marks view...');
    await page.evaluate(() => {
      const refreshBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Refresh') || b.querySelector('svg'));
      if (refreshBtn) refreshBtn.click();
    });
    await waitMs(3000);

    console.log('22. Capturing marks_mobile_to_web_reflected.png...');
    await page.screenshot({ path: path.join(ssDir, 'marks_mobile_to_web_reflected.png') });
    console.log('    Saved marks_mobile_to_web_reflected.png successfully!');

    // ── Web Schedule Exam (Step 7) ──
    console.log('23. Navigating back to Exams list...');
    await page.goto('http://localhost:5173/exams', { waitUntil: 'networkidle2' });
    await waitMs(3000);

    console.log('24. Clicking Schedule Exam button...');
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Schedule Exam'));
      if (btn) btn.click();
    });
    await waitMs(2000);

    console.log('25. Filling schedule exam form...');
    await page.evaluate(() => {
      const titleInput = document.querySelector('input[placeholder*="Unit Test" i]');
      const typeSelect = document.querySelector('select:not([required])');
      const classSelect = document.querySelector('select[required]');
      const dateInputs = Array.from(document.querySelectorAll('input[type="date"]'));
      const syllabusTextarea = document.querySelector('textarea');

      const setReactValue = (el, val) => {
        const setter = Object.getOwnPropertyDescriptor(el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : (el.tagName === 'SELECT' ? window.HTMLSelectElement.prototype : window.HTMLInputElement.prototype), 'value').set;
        setter.call(el, val);
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.dispatchEvent(new Event('input', { bubbles: true }));
      };

      if (titleInput) setReactValue(titleInput, 'Phase 3.2D Sync Exam');
      if (typeSelect) setReactValue(typeSelect, 'internal');
      if (classSelect) {
        // Find option containing Class 1
        const option = Array.from(classSelect.options).find(o => o.text.includes('Class 1'));
        if (option) {
          setReactValue(classSelect, option.value);
        }
      }
      if (dateInputs[0]) setReactValue(dateInputs[0], '2026-06-20');
      if (dateInputs[1]) setReactValue(dateInputs[1], '2026-06-21');
      if (syllabusTextarea) setReactValue(syllabusTextarea, 'Phase 3.2D Exam Sync verification');
    });
    await waitMs(1000);

    console.log('26. Submitting schedule form...');
    await page.evaluate(() => {
      const modal = document.querySelector('.fixed, .absolute, div[role="dialog"]');
      if (modal) {
        const btn = Array.from(modal.querySelectorAll('button')).find(b => b.textContent.includes('Broadcast Exam'));
        if (btn) btn.click();
      }
    });
    await waitMs(4000);

    console.log('27. Capturing exam_web_schedule.png...');
    await page.screenshot({ path: path.join(ssDir, 'exam_web_schedule.png') });
    console.log('    Saved exam_web_schedule.png successfully!');

  } catch (err) {
    console.error('Error during screenshot run:', err);
  } finally {
    await browser.close();
    console.log('All Web actions done!');
  }
})();
