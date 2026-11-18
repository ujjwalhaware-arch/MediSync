const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const dbPath = path.resolve(__dirname, process.env.DATABASE_FILE || 'smartmedi.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err.message);
  } else {
    console.log(`Connected to SQLite database at: ${dbPath}`);
  }
});

// Promisified database helpers
const query = {
  run: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) return reject(err);
        resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  },
  get: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  },
  all: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }
};

// Initialize schema
async function initSchema() {
  await query.run('PRAGMA foreign_keys = ON;');

  // Users
  await query.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('PATIENT', 'CAREGIVER')),
      phone TEXT,
      preferred_language TEXT DEFAULT 'en' CHECK(preferred_language IN ('en', 'hi', 'mr')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Patient Profiles
  await query.run(`
    CREATE TABLE IF NOT EXISTS patient_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      pairing_code TEXT UNIQUE,
      pairing_code_expires_at DATETIME,
      emergency_contact_name TEXT,
      emergency_contact_phone TEXT,
      blood_group TEXT,
      allergies TEXT,
      notes TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Caregiver Relationships
  await query.run(`
    CREATE TABLE IF NOT EXISTS caregiver_relationships (
      id TEXT PRIMARY KEY,
      caregiver_id TEXT NOT NULL,
      patient_id TEXT NOT NULL,
      status TEXT DEFAULT 'ACTIVE' CHECK(status IN ('PENDING', 'ACTIVE', 'REVOKED')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (caregiver_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(caregiver_id, patient_id)
    );
  `);

  // Medicines
  await query.run(`
    CREATE TABLE IF NOT EXISTS medicines (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      dosage TEXT NOT NULL,
      form TEXT NOT NULL CHECK(form IN ('TABLET', 'CAPSULE', 'SYRUP', 'INJECTION', 'DROPS', 'INHALER', 'OTHER')),
      food_instruction TEXT NOT NULL CHECK(food_instruction IN ('BEFORE_FOOD', 'AFTER_FOOD', 'WITH_FOOD', 'EMPTY_STOMACH', 'NO_RESTRICTION')),
      color_tag TEXT DEFAULT '#0d9488',
      instructions TEXT,
      start_date DATE NOT NULL,
      end_date DATE,
      is_chronic INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Medication Schedules
  await query.run(`
    CREATE TABLE IF NOT EXISTS medication_schedules (
      id TEXT PRIMARY KEY,
      medicine_id TEXT NOT NULL,
      time_slot TEXT NOT NULL CHECK(time_slot IN ('MORNING', 'AFTERNOON', 'EVENING', 'NIGHT', 'CUSTOM')),
      scheduled_time TEXT NOT NULL,
      dosage_quantity REAL DEFAULT 1.0,
      recurrence_type TEXT DEFAULT 'DAILY' CHECK(recurrence_type IN ('DAILY', 'DAYS_OF_WEEK', 'INTERVAL')),
      days_of_week TEXT,
      FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE
    );
  `);

  // Scheduled Doses
  await query.run(`
    CREATE TABLE IF NOT EXISTS scheduled_doses (
      id TEXT PRIMARY KEY,
      medicine_id TEXT NOT NULL,
      schedule_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      dose_date TEXT NOT NULL,
      scheduled_time TEXT NOT NULL,
      status TEXT DEFAULT 'SCHEDULED' CHECK(status IN ('SCHEDULED', 'TAKEN', 'SKIPPED', 'MISSED')),
      taken_at DATETIME,
      skipped_reason TEXT,
      reminder_sent_count INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE,
      FOREIGN KEY (schedule_id) REFERENCES medication_schedules(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(medicine_id, schedule_id, dose_date, scheduled_time)
    );
  `);

  // Medicine Inventory
  await query.run(`
    CREATE TABLE IF NOT EXISTS medicine_inventory (
      id TEXT PRIMARY KEY,
      medicine_id TEXT UNIQUE NOT NULL,
      user_id TEXT NOT NULL,
      current_stock REAL NOT NULL DEFAULT 0,
      unit TEXT DEFAULT 'tablets',
      low_stock_threshold REAL DEFAULT 5,
      last_refill_date DATE,
      last_refill_quantity REAL DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Notifications
  await query.run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      patient_id TEXT,
      type TEXT NOT NULL CHECK(type IN ('REMINDER', 'FOLLOW_UP', 'MISSED_DOSE', 'LOW_STOCK', 'CAREGIVER_ALERT')),
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Dose Audit Log
  await query.run(`
    CREATE TABLE IF NOT EXISTS dose_audit_log (
      id TEXT PRIMARY KEY,
      dose_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      previous_status TEXT,
      new_status TEXT,
      reason TEXT,
      changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (dose_id) REFERENCES scheduled_doses(id) ON DELETE CASCADE
    );
  `);

  console.log('Database tables successfully verified and initialized.');
}

module.exports = {
  db,
  query,
  initSchema
};

