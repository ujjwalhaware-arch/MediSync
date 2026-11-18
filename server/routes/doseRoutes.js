const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { query } = require('../database');
const { authenticateToken } = require('../middleware/auth');
const {
  getTodayDateString,
  generateDailyDoses,
  checkOverdueDosesAndEscalate,
  handleInventoryOnDoseTaken,
  handleInventoryOnDoseReverted
} = require('../services/doseScheduler');

// Helper to verify patient access
async function verifyPatientAccess(req, patientId) {
  if (req.user.role === 'PATIENT') {
    return req.user.id === patientId;
  }
  if (req.user.role === 'CAREGIVER') {
    const link = await query.get(
      'SELECT id FROM caregiver_relationships WHERE caregiver_id = ? AND patient_id = ? AND status = ?',
      [req.user.id, patientId, 'ACTIVE']
    );
    return !!link;
  }
  return false;
}

// Get today's doses for user or patient
router.get('/today', authenticateToken, async (req, res) => {
  try {
    const targetUserId = req.query.patientId || req.user.id;
    const hasAccess = await verifyPatientAccess(req, targetUserId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Unauthorized to view doses.' });
    }

    const today = getTodayDateString();
    // Ensure daily doses exist
    await generateDailyDoses(targetUserId, today);
    // Run escalation check
    await checkOverdueDosesAndEscalate();

    const doses = await query.all(
      `SELECT sd.*, 
              m.name as medicine_name, 
              m.dosage, 
              m.form, 
              m.food_instruction, 
              m.color_tag, 
              m.instructions,
              ms.time_slot,
              ms.dosage_quantity,
              mi.current_stock,
              mi.unit as stock_unit
       FROM scheduled_doses sd
       JOIN medicines m ON sd.medicine_id = m.id
       JOIN medication_schedules ms ON sd.schedule_id = ms.id
       LEFT JOIN medicine_inventory mi ON m.id = mi.medicine_id
       WHERE sd.user_id = ? AND sd.dose_date = ?
       ORDER BY sd.scheduled_time ASC`,
      [targetUserId, today]
    );

    res.json(doses);
  } catch (error) {
    console.error('Error fetching today doses:', error);
    res.status(500).json({ error: 'Failed to fetch doses.' });
  }
});

// Update dose status (TAKEN, SKIPPED, MISSED, SCHEDULED)
router.post('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, skipped_reason } = req.body;

    if (!['TAKEN', 'SKIPPED', 'MISSED', 'SCHEDULED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid dose status.' });
    }

    const dose = await query.get(
      `SELECT sd.*, ms.dosage_quantity 
       FROM scheduled_doses sd
       JOIN medication_schedules ms ON sd.schedule_id = ms.id
       WHERE sd.id = ?`,
      [id]
    );

    if (!dose) {
      return res.status(404).json({ error: 'Dose not found.' });
    }

    const hasAccess = await verifyPatientAccess(req, dose.user_id);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Unauthorized to update this dose.' });
    }

    const previousStatus = dose.status;
    const quantity = dose.dosage_quantity || 1;

    // Inventory adjustments
    if (status === 'TAKEN' && previousStatus !== 'TAKEN') {
      await handleInventoryOnDoseTaken(dose.medicine_id, dose.user_id, quantity);
    } else if (previousStatus === 'TAKEN' && status !== 'TAKEN') {
      await handleInventoryOnDoseReverted(dose.medicine_id, dose.user_id, quantity);
    }

    // Update dose record
    const takenAt = status === 'TAKEN' ? new Date().toISOString() : null;
    await query.run(
      `UPDATE scheduled_doses 
       SET status = ?, 
           taken_at = ?, 
           skipped_reason = ?, 
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [status, takenAt, skipped_reason || null, id]
    );

    // Record audit log
    await query.run(
      `INSERT INTO dose_audit_log (id, dose_id, user_id, previous_status, new_status, reason)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        crypto.randomUUID(),
        id,
        req.user.id,
        previousStatus,
        status,
        skipped_reason || `Marked as ${status} by ${req.user.name}`
      ]
    );

    res.json({
      message: `Dose status updated to ${status}`,
      doseId: id,
      newStatus: status
    });
  } catch (error) {
    console.error('Error updating dose status:', error);
    res.status(500).json({ error: 'Failed to update dose status.' });
  }
});

// Get dose history with filters
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const targetUserId = req.query.patientId || req.user.id;
    const hasAccess = await verifyPatientAccess(req, targetUserId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Unauthorized.' });
    }

    const { startDate, endDate, medicineId, status } = req.query;

    let sql = `
      SELECT sd.*, 
             m.name as medicine_name, 
             m.dosage, 
             m.food_instruction,
             ms.time_slot
      FROM scheduled_doses sd
      JOIN medicines m ON sd.medicine_id = m.id
      JOIN medication_schedules ms ON sd.schedule_id = ms.id
      WHERE sd.user_id = ?
    `;
    const params = [targetUserId];

    if (startDate) {
      sql += ' AND sd.dose_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND sd.dose_date <= ?';
      params.push(endDate);
    }
    if (medicineId) {
      sql += ' AND sd.medicine_id = ?';
      params.push(medicineId);
    }
    if (status) {
      sql += ' AND sd.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY sd.dose_date DESC, sd.scheduled_time DESC LIMIT 100';

    const history = await query.all(sql, params);
    res.json(history);
  } catch (error) {
    console.error('Error fetching dose history:', error);
    res.status(500).json({ error: 'Failed to fetch dose history.' });
  }
});

// Trigger sync check manually
router.post('/sync-check', authenticateToken, async (req, res) => {
  try {
    await checkOverdueDosesAndEscalate();
    res.json({ message: 'Overdue dose check executed successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Sync check failed.' });
  }
});

module.exports = router;

