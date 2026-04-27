const jwt = require('jsonwebtoken');

async function test() {
  const token = jwt.sign({ id: '11643d0d-b2de-4e56-ab1b-41acdcfoce54', role: 'student' }, process.env.JWT_SECRET || 'dev-secret-key-12345');
  try {
    const res = await fetch('http://localhost:5000/api/notices', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Body:", text);
  } catch (err) {
    console.error(err);
  }
}
test();
