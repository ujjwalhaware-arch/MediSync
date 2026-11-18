const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { db, query, initSchema } = require('./database');

async function seed() {
  console.log('🌱 Starting SmartMedi database seeding...');
  await initSchema();

  // Clear existing records to ensure clean state
  await query.run('DELETE FROM dose_audit_log');
  await query.run('DELETE FROM notifications');
  await query.run('DELETE FROM scheduled_doses');
  await query.run('DELETE FROM medicine_inventory');
  await query.run('DELETE FROM medication_schedules');
  await query.run('DELETE FROM medicines');
  await query.run('DELETE FROM caregiver_relationships');
  await query.run('DELETE FROM patient_profiles');
  await query.run('DELETE FROM users');

  const passwordHash = await bcrypt.hash('patient123', 10);
  const caregiverPassHash = await bcrypt.hash('caregiver123', 10);
  const seniorPassHash = await bcrypt.hash('senior123', 10);

  // 1. Create Patient User (Ramesh Sharma)
  const patientId = 'user-patient-ramesh';
  await query.run(
    `INSERT INTO users (id, name, email, password_hash, role, phone, preferred_language)
     VALUES (?, ?, ?, ?, 'PATIENT', ?, 'en')`,
    [patientId, 'Ramesh Sharma', 'patient@medisync.com', passwordHash, '+91 98765 43210']
  );

  // Patient Profile with Pairing Code SM-7894
  const profileId = crypto.randomUUID();
  await query.run(
    `INSERT INTO patient_profiles 
     (id, user_id, pairing_code, emergency_contact_name, emergency_contact_phone, blood_group, allergies, notes)
     VALUES (?, ?, 'SM-7894', 'Priya Sharma (Daughter)', '+91 98123 45678', 'B+', 'Penicillin, Sulfa drugs', 'Type-2 Diabetes & Stage 1 Hypertension')`,
    [profileId, patientId]
  );

  // 2. Create Caregiver User (Priya Sharma)
  const caregiverId = 'user-caregiver-priya';
  await query.run(
    `INSERT INTO users (id, name, email, password_hash, role, phone, preferred_language)
     VALUES (?, ?, ?, ?, 'CAREGIVER', ?, 'en')`,
    [caregiverId, 'Priya Sharma', 'caregiver@medisync.com', caregiverPassHash, '+91 98123 45678']
  );

  // 3. Link Caregiver with Patient
  await query.run(
    `INSERT INTO caregiver_relationships (id, caregiver_id, patient_id, status)
     VALUES (?, ?, ?, 'ACTIVE')`,
    [crypto.randomUUID(), caregiverId, patientId]
  );

  // 4. Create Secondary Demo Patient (Anand Joshi)
  const seniorId = 'user-patient-anand';
  await query.run(
    `INSERT INTO users (id, name, email, password_hash, role, phone, preferred_language)
     VALUES (?, ?, ?, ?, 'PATIENT', ?, 'mr')`,
    [seniorId, 'Anand Joshi', 'senior.user@medisync.com', seniorPassHash, '+91 98220 12345']
  );
  await query.run(
    `INSERT INTO patient_profiles 
     (id, user_id, pairing_code, emergency_contact_name, emergency_contact_phone, blood_group, allergies)
     VALUES (?, ?, 'SM-5521', 'Kavita Joshi', '+91 98220 54321', 'O+', 'None')`,
    [crypto.randomUUID(), seniorId]
  );

  // 5. Create Medicines for Ramesh Sharma
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const medicinesData = [
    {
      id: 'med-metformin',
      name: 'Metformin Hydrochloride',
      dosage: '500 mg',
      form: 'TABLET',
      food_instruction: 'AFTER_FOOD',
      color_tag: '#0d9488', // Teal
      instructions: 'Take with warm water after meals. Do not chew.',
      schedules: [
        { time_slot: 'MORNING', scheduled_time: '08:30', dosage_quantity: 1 },
        { time_slot: 'NIGHT', scheduled_time: '21:30', dosage_quantity: 1 }
      ],
      stock: 28,
      unit: 'tablets',
      lowThreshold: 6
    },
    {
      id: 'med-amlodipine',
      name: 'Amlodipine Besylate',
      dosage: '5 mg',
      form: 'TABLET',
      food_instruction: 'BEFORE_FOOD',
      color_tag: '#0284c7', // Sky Blue
      instructions: 'For blood pressure control. Take every morning regularly.',
      schedules: [
        { time_slot: 'MORNING', scheduled_time: '08:00', dosage_quantity: 1 }
      ],
      stock: 14,
      unit: 'tablets',
      lowThreshold: 5
    },
    {
      id: 'med-atorvastatin',
      name: 'Atorvastatin Calcium',
      dosage: '10 mg',
      form: 'TABLET',
      food_instruction: 'AFTER_FOOD',
      color_tag: '#f59e0b', // Amber
      instructions: 'Lipid-lowering cholesterol medication. Take at bedtime.',
      schedules: [
        { time_slot: 'NIGHT', scheduled_time: '22:00', dosage_quantity: 1 }
      ],
      stock: 3, // LOW STOCK TRIGGER!
      unit: 'tablets',
      lowThreshold: 5
    },
    {
      id: 'med-multivitamin',
      name: 'Zincovit Multivitamin',
      dosage: '10 ml',
      form: 'SYRUP',
      food_instruction: 'AFTER_FOOD',
      color_tag: '#8b5cf6', // Violet
      instructions: 'Dietary supplement. Shake well before use.',
      schedules: [
        { time_slot: 'AFTERNOON', scheduled_time: '13:30', dosage_quantity: 1 }
      ],
      stock: 80,
      unit: 'ml',
      lowThreshold: 20
    }
  ];

  for (const m of medicinesData) {
    await query.run(
      `INSERT INTO medicines 
       (id, user_id, name, dosage, form, food_instruction, color_tag, instructions, start_date, is_chronic)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [m.id, patientId, m.name, m.dosage, m.form, m.food_instruction, m.color_tag, m.instructions, '2026-01-01']
    );

    // Schedules
    for (const s of m.schedules) {
      const schId = crypto.randomUUID();
      s.generatedId = schId;
      await query.run(
        `INSERT INTO medication_schedules 
         (id, medicine_id, time_slot, scheduled_time, dosage_quantity, recurrence_type)
         VALUES (?, ?, ?, ?, ?, 'DAILY')`,
        [schId, m.id, s.time_slot, s.scheduled_time, s.dosage_quantity]
      );
    }

    // Inventory
    await query.run(
      `INSERT INTO medicine_inventory 
       (id, medicine_id, user_id, current_stock, unit, low_stock_threshold, last_refill_date, last_refill_quantity)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [crypto.randomUUID(), m.id, patientId, m.stock, m.unit, m.lowThreshold, todayStr, 30]
    );
  }

  // 6. Generate Historical Doses for the last 6 days
  for (let offset = 6; offset >= 1; offset--) {
    const histDate = new Date();
    histDate.setDate(histDate.getDate() - offset);
    const dateStr = histDate.toISOString().split('T')[0];

    for (const m of medicinesData) {
      for (const s of m.schedules) {
        let status = 'TAKEN';
        let takenAt = `${dateStr}T${s.scheduled_time}:00.000Z`;
        let skippedReason = null;

        // Introduce realistic adherence variation:
        // Day 3 night Metformin was missed
        if (offset === 3 && m.id === 'med-metformin' && s.time_slot === 'NIGHT') {
          status = 'MISSED';
          takenAt = null;
        }
        // Day 5 afternoon Zincovit was skipped due to doctor fasting advice
        if (offset === 5 && m.id === 'med-multivitamin') {
          status = 'SKIPPED';
          takenAt = null;
          skippedReason = 'Advised by physician to fast before lab test';
        }

        await query.run(
          `INSERT INTO scheduled_doses 
           (id, medicine_id, schedule_id, user_id, dose_date, scheduled_time, status, taken_at, skipped_reason, reminder_sent_count)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
          [crypto.randomUUID(), m.id, s.generatedId, patientId, dateStr, s.scheduled_time, status, takenAt, skippedReason]
        );
      }
    }
  }

  // 7. Generate Today's Doses for Ramesh
  // Morning doses: TAKEN
  // Afternoon dose: SCHEDULED (due)
  // Night doses: SCHEDULED
  for (const m of medicinesData) {
    for (const s of m.schedules) {
      let status = 'SCHEDULED';
      let takenAt = null;

      if (s.time_slot === 'MORNING') {
        status = 'TAKEN';
        takenAt = `${todayStr}T${s.scheduled_time}:15.000Z`;
      }

      await query.run(
        `INSERT INTO scheduled_doses 
         (id, medicine_id, schedule_id, user_id, dose_date, scheduled_time, status, taken_at, reminder_sent_count)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [crypto.randomUUID(), m.id, s.generatedId, patientId, todayStr, s.scheduled_time, status, takenAt, status === 'TAKEN' ? 1 : 0]
      );
    }
  }

  // 8. Create Realistic Notifications
  // Low stock notification for patient and caregiver
  await query.run(
    `INSERT INTO notifications (id, user_id, patient_id, type, title, message, is_read, metadata)
     VALUES (?, ?, ?, 'LOW_STOCK', 'Low Stock Alert: Atorvastatin Calcium', 'Only 3 tablets remaining. Please refill within 3 days.', 0, ?)`,
    [crypto.randomUUID(), patientId, patientId, JSON.stringify({ medicineId: 'med-atorvastatin', remaining: 3 })]
  );

  await query.run(
    `INSERT INTO notifications (id, user_id, patient_id, type, title, message, is_read, metadata)
     VALUES (?, ?, ?, 'LOW_STOCK', 'Low Stock Alert for Ramesh Sharma', 'Ramesh has only 3 tablets left of Atorvastatin Calcium (10 mg). Refill needed.', 0, ?)`,
    [crypto.randomUUID(), caregiverId, patientId, JSON.stringify({ medicineId: 'med-atorvastatin', remaining: 3 })]
  );

  // Caregiver alert about previous missed dose
  await query.run(
    `INSERT INTO notifications (id, user_id, patient_id, type, title, message, is_read, metadata)
     VALUES (?, ?, ?, 'CAREGIVER_ALERT', 'Missed Dose Alert: Ramesh Sharma', 'Ramesh Sharma missed their scheduled night dose of Metformin 500mg 3 days ago.', 1, ?)`,
    [crypto.randomUUID(), caregiverId, patientId, JSON.stringify({ patientId, medicine: 'Metformin' })]
  );

  console.log('✅ MediSync Database seeded successfully with demo accounts:');
  console.log('   - Patient: patient@medisync.com / patient123 (Pairing Code: SM-7894)');
  console.log('   - Caregiver: caregiver@medisync.com / caregiver123 (Linked to Ramesh)');
  console.log('   - Senior: senior.user@medisync.com / senior123 (Pairing Code: SM-5521)');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});

