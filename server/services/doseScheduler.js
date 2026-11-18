const { query } = require('../database');
const crypto = require('crypto');

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getCurrentTimeString() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Automatically creates scheduled doses for a user for a given date
 */
async function generateDailyDoses(userId, targetDate = getTodayDateString()) {
  try {
    const todayObj = new Date(targetDate);
    const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const currentDayName = dayNames[todayObj.getDay()];

    // Fetch active medicines for user
    const medicines = await query.all(
      `SELECT * FROM medicines 
       WHERE user_id = ? 
       AND start_date <= ? 
       AND (end_date IS NULL OR end_date >= ?)`,
      [userId, targetDate, targetDate]
    );

    for (const med of medicines) {
      const schedules = await query.all(
        `SELECT * FROM medication_schedules WHERE medicine_id = ?`,
        [med.id]
      );

      for (const sch of schedules) {
        let isDueToday = false;
        if (sch.recurrence_type === 'DAILY') {
          isDueToday = true;
        } else if (sch.recurrence_type === 'DAYS_OF_WEEK' && sch.days_of_week) {
          try {
            const parsedDays = JSON.parse(sch.days_of_week);
            if (Array.isArray(parsedDays) && parsedDays.includes(currentDayName)) {
              isDueToday = true;
            }
          } catch (e) {
            isDueToday = true;
          }
        } else {
          isDueToday = true;
        }

        if (isDueToday) {
          // Check if dose record already exists
          const existing = await query.get(
            `SELECT id FROM scheduled_doses 
             WHERE medicine_id = ? AND schedule_id = ? AND dose_date = ? AND scheduled_time = ?`,
            [med.id, sch.id, targetDate, sch.scheduled_time]
          );

          if (!existing) {
            const doseId = crypto.randomUUID();
            await query.run(
              `INSERT INTO scheduled_doses 
               (id, medicine_id, schedule_id, user_id, dose_date, scheduled_time, status, reminder_sent_count)
               VALUES (?, ?, ?, ?, ?, ?, 'SCHEDULED', 0)`,
              [doseId, med.id, sch.id, userId, targetDate, sch.scheduled_time]
            );
          }
        }
      }
    }
  } catch (error) {
    console.error('Error generating daily doses:', error);
  }
}

/**
 * Background worker task: checks for due doses, follow-up alerts, and missed doses
 */
async function checkOverdueDosesAndEscalate() {
  try {
    const today = getTodayDateString();
    const currentMins = timeToMinutes(getCurrentTimeString());
    const gracePeriodMins = parseInt(process.env.GRACE_PERIOD_MINUTES || '45', 10);
    const followUpIntervalMins = parseInt(process.env.FOLLOW_UP_INTERVAL_MINUTES || '15', 10);

    // Fetch all SCHEDULED doses for today
    const doses = await query.all(
      `SELECT sd.*, m.name as medicine_name, m.dosage, m.food_instruction, u.name as patient_name, u.phone as patient_phone
       FROM scheduled_doses sd
       JOIN medicines m ON sd.medicine_id = m.id
       JOIN users u ON sd.user_id = u.id
       WHERE sd.dose_date = ? AND sd.status = 'SCHEDULED'`,
      [today]
    );

    for (const dose of doses) {
      const scheduledMins = timeToMinutes(dose.scheduled_time);
      const diffMins = currentMins - scheduledMins;

      // 1. Initial Reminder (T >= 0 and reminder_sent_count == 0)
      if (diffMins >= 0 && dose.reminder_sent_count === 0) {
        await query.run(
          `UPDATE scheduled_doses SET reminder_sent_count = 1 WHERE id = ?`,
          [dose.id]
        );

        const notifId = crypto.randomUUID();
        await query.run(
          `INSERT INTO notifications (id, user_id, patient_id, type, title, message, metadata)
           VALUES (?, ?, ?, 'REMINDER', ?, ?, ?)`,
          [
            notifId,
            dose.user_id,
            dose.user_id,
            `Time for your medicine: ${dose.medicine_name}`,
            `Please take ${dose.dosage} of ${dose.medicine_name} (${dose.food_instruction.replace('_', ' ').toLowerCase()}).`,
            JSON.stringify({ doseId: dose.id, medicineId: dose.medicine_id, scheduledTime: dose.scheduled_time })
          ]
        );
      }

      // 2. Follow-up reminder (T >= followUpIntervalMins and reminder_sent_count == 1)
      else if (diffMins >= followUpIntervalMins && dose.reminder_sent_count === 1) {
        await query.run(
          `UPDATE scheduled_doses SET reminder_sent_count = 2 WHERE id = ?`,
          [dose.id]
        );

        const notifId = crypto.randomUUID();
        await query.run(
          `INSERT INTO notifications (id, user_id, patient_id, type, title, message, metadata)
           VALUES (?, ?, ?, 'FOLLOW_UP', ?, ?, ?)`,
          [
            notifId,
            dose.user_id,
            dose.user_id,
            `Gentle Follow-up: ${dose.medicine_name}`,
            `Your scheduled dose of ${dose.medicine_name} at ${dose.scheduled_time} is still unmarked. Did you take it?`,
            JSON.stringify({ doseId: dose.id, medicineId: dose.medicine_id, scheduledTime: dose.scheduled_time })
          ]
        );
      }

      // 3. Grace period elapsed (T >= gracePeriodMins) -> Transition to MISSED and notify Caregiver
      else if (diffMins >= gracePeriodMins) {
        await query.run(
          `UPDATE scheduled_doses SET status = 'MISSED', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [dose.id]
        );

        // Audit log entry
        await query.run(
          `INSERT INTO dose_audit_log (id, dose_id, user_id, previous_status, new_status, reason)
           VALUES (?, ?, ?, 'SCHEDULED', 'MISSED', 'Automated: Grace period elapsed')`,
          [crypto.randomUUID(), dose.id, dose.user_id]
        );

        // Notify Patient (with critical safety warning)
        const patientNotifId = crypto.randomUUID();
        await query.run(
          `INSERT INTO notifications (id, user_id, patient_id, type, title, message, metadata)
           VALUES (?, ?, ?, 'MISSED_DOSE', ?, ?, ?)`,
          [
            patientNotifId,
            dose.user_id,
            dose.user_id,
            `Dose Marked as Missed: ${dose.medicine_name}`,
            `The grace window for ${dose.medicine_name} (${dose.scheduled_time}) has elapsed. ⚠️ Medical Safety: Do not double your next dose. Resume your regular schedule.`,
            JSON.stringify({ doseId: dose.id, medicineId: dose.medicine_id })
          ]
        );

        // Find linked active caregivers
        const caregivers = await query.all(
          `SELECT cr.caregiver_id, u.name as caregiver_name
           FROM caregiver_relationships cr
           JOIN users u ON cr.caregiver_id = u.id
           WHERE cr.patient_id = ? AND cr.status = 'ACTIVE'`,
          [dose.user_id]
        );

        for (const cg of caregivers) {
          const cgNotifId = crypto.randomUUID();
          await query.run(
            `INSERT INTO notifications (id, user_id, patient_id, type, title, message, metadata)
             VALUES (?, ?, ?, 'CAREGIVER_ALERT', ?, ?, ?)`,
            [
              cgNotifId,
              cg.caregiver_id,
              dose.user_id,
              `Missed Dose Alert: ${dose.patient_name}`,
              `${dose.patient_name} has missed their scheduled dose of ${dose.medicine_name} (${dose.dosage}) at ${dose.scheduled_time}.`,
              JSON.stringify({
                doseId: dose.id,
                patientId: dose.user_id,
                patientName: dose.patient_name,
                medicineName: dose.medicine_name,
                scheduledTime: dose.scheduled_time
              })
            ]
          );
        }
      }
    }
  } catch (error) {
    console.error('Error during missed dose escalation check:', error);
  }
}

/**
 * Deducts inventory when dose is marked TAKEN
 */
async function handleInventoryOnDoseTaken(medicineId, userId, quantity = 1) {
  try {
    const inv = await query.get(
      `SELECT * FROM medicine_inventory WHERE medicine_id = ? AND user_id = ?`,
      [medicineId, userId]
    );

    if (inv) {
      const newStock = Math.max(0, inv.current_stock - quantity);
      await query.run(
        `UPDATE medicine_inventory SET current_stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [newStock, inv.id]
      );

      // Low stock check
      if (newStock <= inv.low_stock_threshold) {
        const med = await query.get(`SELECT name FROM medicines WHERE id = ?`, [medicineId]);
        const medName = med ? med.name : 'Your medicine';

        // Notify patient
        await query.run(
          `INSERT INTO notifications (id, user_id, patient_id, type, title, message, metadata)
           VALUES (?, ?, ?, 'LOW_STOCK', ?, ?, ?)`,
          [
            crypto.randomUUID(),
            userId,
            userId,
            `Low Stock Alert: ${medName}`,
            `Only ${newStock} ${inv.unit} remaining for ${medName}. Please refill your prescription soon.`,
            JSON.stringify({ medicineId, remainingStock: newStock })
          ]
        );

        // Also notify caregivers
        const caregivers = await query.all(
          `SELECT caregiver_id FROM caregiver_relationships WHERE patient_id = ? AND status = 'ACTIVE'`,
          [userId]
        );
        for (const cg of caregivers) {
          const patient = await query.get(`SELECT name FROM users WHERE id = ?`, [userId]);
          await query.run(
            `INSERT INTO notifications (id, user_id, patient_id, type, title, message, metadata)
             VALUES (?, ?, ?, 'LOW_STOCK', ?, ?, ?)`,
            [
              crypto.randomUUID(),
              cg.caregiver_id,
              userId,
              `Low Stock Notice for ${patient ? patient.name : 'Patient'}`,
              `${patient ? patient.name : 'Patient'} has only ${newStock} ${inv.unit} left of ${medName}. Refill recommended.`,
              JSON.stringify({ medicineId, remainingStock: newStock, patientId: userId })
            ]
          );
        }
      }
    }
  } catch (error) {
    console.error('Error handling inventory on dose taken:', error);
  }
}

/**
 * Reverts inventory if taken dose is reversed
 */
async function handleInventoryOnDoseReverted(medicineId, userId, quantity = 1) {
  try {
    const inv = await query.get(
      `SELECT * FROM medicine_inventory WHERE medicine_id = ? AND user_id = ?`,
      [medicineId, userId]
    );
    if (inv) {
      await query.run(
        `UPDATE medicine_inventory SET current_stock = current_stock + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [quantity, inv.id]
      );
    }
  } catch (error) {
    console.error('Error reverting inventory:', error);
  }
}

module.exports = {
  getTodayDateString,
  getCurrentTimeString,
  generateDailyDoses,
  checkOverdueDosesAndEscalate,
  handleInventoryOnDoseTaken,
  handleInventoryOnDoseReverted
};

