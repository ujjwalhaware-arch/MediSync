const http = require('http');
const { spawn } = require('child_process');

console.log('Testing Prescription Batch Add API...');

const server = spawn('node', ['server.js'], { cwd: __dirname });

server.stdout.on('data', (d) => {
  const msg = d.toString();
  if (msg.includes('MediSync Server running on port')) {
    runBatchTest();
  }
});

server.stderr.on('data', (d) => {
  console.error('[Server error]:', d.toString());
});

async function runBatchTest() {
  try {
    // Login
    const loginRes = await fetchJson('http://127.0.0.1:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'patient@medisync.com',
        password: 'patient123'
      })
    });
    const token = loginRes.token;
    console.log('Logged in as:', loginRes.user.name);

    // Call Batch API
    console.log('\n--- Testing POST /api/medicines/batch ---');
    const batchPayload = [
      {
        name: 'Amoxicillin',
        dosage: '500mg',
        form: 'CAPSULE',
        food_instruction: 'AFTER_FOOD',
        color_tag: '#7c3aed',
        instructions: 'Scanned from prescription',
        schedules: [
          { time_slot: 'MORNING', scheduled_time: '08:30', dosage_quantity: 1, recurrence_type: 'DAILY' },
          { time_slot: 'NIGHT', scheduled_time: '21:30', dosage_quantity: 1, recurrence_type: 'DAILY' }
        ],
        initial_stock: 20,
        unit: 'capsules',
        low_stock_threshold: 4
      },
      {
        name: 'Pantoprazole',
        dosage: '40mg',
        form: 'TABLET',
        food_instruction: 'BEFORE_FOOD',
        color_tag: '#2563eb',
        instructions: 'Scanned from prescription',
        schedules: [
          { time_slot: 'MORNING', scheduled_time: '08:00', dosage_quantity: 1, recurrence_type: 'DAILY' }
        ],
        initial_stock: 15,
        unit: 'tablets',
        low_stock_threshold: 3
      }
    ];

    const batchRes = await fetchJson('http://127.0.0.1:5000/api/medicines/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ medicines: batchPayload })
    });

    console.log('Batch Response:', batchRes);

    // Verify medicines list
    const meds = await fetchJson('http://127.0.0.1:5000/api/medicines', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const amox = meds.find(m => m.name === 'Amoxicillin');
    const panto = meds.find(m => m.name === 'Pantoprazole');

    console.log('\nVerification:');
    console.log('Amoxicillin added:', !!amox, 'Schedules:', amox?.schedules?.length, 'Inventory:', amox?.inventory?.current_stock);
    console.log('Pantoprazole added:', !!panto, 'Schedules:', panto?.schedules?.length, 'Inventory:', panto?.inventory?.current_stock);

    if (amox && panto) {
      console.log('\n✅ BATCH OCR MEDICINES API TEST PASSED SUCCESSFULLY!\n');
    } else {
      throw new Error('Verification failed: medicines not found');
    }

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
