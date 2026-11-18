const http = require('http');
const { spawn } = require('child_process');

console.log('Testing SmartMedi Backend APIs...');

// Start server
const server = spawn('node', ['server.js'], { cwd: __dirname });

server.stdout.on('data', (d) => {
  const msg = d.toString();
  console.log('[Server stdout]:', msg.trim());
  if (msg.includes('MediSync Server running on port')) {
    runTests();
  }
});

server.stderr.on('data', (d) => {
  console.error('[Server stderr]:', d.toString());
});

async function runTests() {
  try {
    // 1. Health check
    console.log('\n--- 1. Testing GET /api/health ---');
    const health = await fetchJson('http://127.0.0.1:5000/api/health');
    console.log('Health Response:', health);

    // 2. Login as Demo Patient
    console.log('\n--- 2. Testing POST /api/auth/login ---');
    const loginRes = await fetchJson('http://127.0.0.1:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'patient@medisync.com',
        password: 'patient123'
      })
    });
    console.log('Login Result:', loginRes.user.name, `(${loginRes.user.role}) - Token Received:`, !!loginRes.token);

    const token = loginRes.token;

    // 3. Fetch today's doses
    console.log('\n--- 3. Testing GET /api/doses/today ---');
    const doses = await fetchJson('http://127.0.0.1:5000/api/doses/today', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`Doses fetched: ${doses.length} scheduled doses found for today.`);
    doses.forEach((d, idx) => {
      console.log(`  [${idx + 1}] ${d.medicine_name} (${d.scheduled_time}) - Status: ${d.status}`);
    });

    // 4. Fetch Inventory
    console.log('\n--- 4. Testing GET /api/inventory ---');
    const inventory = await fetchJson('http://127.0.0.1:5000/api/inventory', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`Inventory records: ${inventory.length} items`);
    inventory.forEach((i) => {
      console.log(`  - ${i.medicine_name}: Stock ${i.current_stock} ${i.unit}, Daily: ${i.daily_consumption}, Days Left: ~${i.estimated_days_left}, Refill: ${i.expected_refill_date}`);
    });

    // 5. Fetch Adherence Analytics
    console.log('\n--- 5. Testing GET /api/analytics/adherence ---');
    const analytics = await fetchJson('http://127.0.0.1:5000/api/analytics/adherence?days=7', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`Adherence Score: ${analytics.summary.adherencePercentage}%`);
    console.log(`Taken: ${analytics.summary.takenDoses}, Missed: ${analytics.summary.missedDoses}, Skipped: ${analytics.summary.skippedDoses}`);

    console.log('\n🎉 ALL BACKEND API TESTS COMPLETED SUCCESSFULLY!\n');
    server.kill();
    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err);
    server.kill();
    process.exit(1);
  }
}

function fetchJson(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname + u.search,
        method: opts.method || 'GET',
        headers: opts.headers || {}
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            if (res.statusCode >= 400) {
              return reject(new Error(`HTTP ${res.statusCode}: ${data.error || body}`));
            }
            resolve(data);
          } catch (e) {
            resolve(body);
          }
        });
      }
    );

    req.on('error', reject);
    if (opts.body) {
      req.write(opts.body);
    }
    req.end();
  });
}

