const http = require('http');
const { spawn } = require('child_process');

console.log('Testing Caregiver & Pairing Flow...');

const server = spawn('node', ['server.js'], { cwd: __dirname });

server.stdout.on('data', (d) => {
  const msg = d.toString();
  if (msg.includes('MediSync Server running on port')) {
    runCaregiverTests();
  }
});

async function runCaregiverTests() {
  try {
    // 1. Login as Demo Caregiver
    console.log('1. Login as Caregiver...');
    const cgLogin = await fetchJson('http://127.0.0.1:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'caregiver@medisync.com',
        password: 'caregiver123'
      })
    });
    console.log(`Caregiver Logged in: ${cgLogin.user.name} (${cgLogin.user.role})`);
    const cgToken = cgLogin.token;

    // 2. Fetch linked patients
    console.log('\n2. Fetch linked patients...');
    const patients = await fetchJson('http://127.0.0.1:5000/api/caregiver/patients', {
      headers: { Authorization: `Bearer ${cgToken}` }
    });
    console.log(`Linked Patients count: ${patients.length}`);
    patients.forEach(p => {
      console.log(`  - Patient: ${p.name}, Weekly Adherence: ${p.weeklyAdherence}%, Today: ${p.todayStats.taken}/${p.todayStats.total} taken, Low Stock Items: ${p.lowStockCount}`);
    });

    // 3. Fetch notifications for caregiver
    console.log('\n3. Fetch notifications for caregiver...');
    const notifs = await fetchJson('http://127.0.0.1:5000/api/notifications', {
      headers: { Authorization: `Bearer ${cgToken}` }
    });
    console.log(`Caregiver notifications: ${notifs.length}`);
    notifs.slice(0, 3).forEach(n => {
      console.log(`  - [${n.type}] ${n.title}: ${n.message}`);
    });

    console.log('\n🎉 CAREGIVER INTEGRATION TESTS PASSED!\n');
    server.kill();
    process.exit(0);
  } catch (err) {
    console.error('Caregiver test failed:', err);
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
            if (res.statusCode >= 400) return reject(new Error(`HTTP ${res.statusCode}: ${data.error || body}`));
            resolve(data);
          } catch (e) {
            resolve(body);
          }
        });
      }
    );
    req.on('error', reject);
    if (opts.body) req.write(opts.body);
    req.end();
  });
}

