const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { query } = require('../database');
const { authenticateToken } = require('../middleware/auth');
const { generateDailyDoses } = require('../services/doseScheduler');

// Helper to verify patient access for patient or authorized caregiver
async function verifyAccess(req, patientId) {
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

// Get all medicines (and schedules) for patient
router.get('/', authenticateToken, async (req, res) => {
  try {
    const targetPatientId = req.query.patientId || req.user.id;

    const hasAccess = await verifyAccess(req, targetPatientId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Unauthorized to view this patient\'s medicines.' });
    }

    const medicines = await query.all(
      'SELECT * FROM medicines WHERE user_id = ? ORDER BY created_at DESC',
      [targetPatientId]
    );

    // Fetch schedules and inventory for each medicine
    const result = await Promise.all(
      medicines.map(async (med) => {
        const schedules = await query.all(
          'SELECT * FROM medication_schedules WHERE medicine_id = ? ORDER BY scheduled_time ASC',
          [med.id]
        );
        const inventory = await query.get(
          'SELECT * FROM medicine_inventory WHERE medicine_id = ?',
          [med.id]
        );
        return {
          ...med,
          schedules,
          inventory
        };
      })
    );

    res.json(result);
  } catch (error) {
    console.error('Error fetching medicines:', error);
    res.status(500).json({ error: 'Failed to fetch medicines.' });
  }
});

// Add new medicine with schedules and initial inventory
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      name,
      dosage,
      form,
      food_instruction,
      color_tag,
      instructions,
      start_date,
      end_date,
      is_chronic,
      schedules = [],
      initial_stock = 30,
      unit = 'tablets',
      low_stock_threshold = 5
    } = req.body;

    if (!name || !dosage || !form) {
      return res.status(400).json({ error: 'Medicine name, dosage, and form are required.' });
    }

    const medicineId = crypto.randomUUID();
    const userId = req.user.id;
    const now = new Date().toISOString().split('T')[0];

    await query.run(
      `INSERT INTO medicines 
       (id, user_id, name, dosage, form, food_instruction, color_tag, instructions, start_date, end_date, is_chronic)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        medicineId,
        userId,
        name,
        dosage,
        form || 'TABLET',
        food_instruction || 'AFTER_FOOD',
        color_tag || '#0d9488',
        instructions || null,
        start_date || now,
        end_date || null,
        is_chronic ? 1 : 0
      ]
    );

    // Insert schedules
    if (Array.isArray(schedules) && schedules.length > 0) {
      for (const sch of schedules) {
        const scheduleId = crypto.randomUUID();
        await query.run(
          `INSERT INTO medication_schedules 
           (id, medicine_id, time_slot, scheduled_time, dosage_quantity, recurrence_type, days_of_week)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            scheduleId,
            medicineId,
            sch.time_slot || 'MORNING',
            sch.scheduled_time || '08:00',
            sch.dosage_quantity || 1.0,
            sch.recurrence_type || 'DAILY',
            sch.days_of_week ? JSON.stringify(sch.days_of_week) : null
          ]
        );
      }
    } else {
      // Default morning schedule if none provided
      const defaultScheduleId = crypto.randomUUID();
      await query.run(
        `INSERT INTO medication_schedules 
         (id, medicine_id, time_slot, scheduled_time, dosage_quantity, recurrence_type)
         VALUES (?, ?, 'MORNING', '09:00', 1.0, 'DAILY')`,
        [defaultScheduleId, medicineId]
      );
    }

    // Insert inventory record
    const inventoryId = crypto.randomUUID();
    await query.run(
      `INSERT INTO medicine_inventory 
       (id, medicine_id, user_id, current_stock, unit, low_stock_threshold, last_refill_date, last_refill_quantity)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        inventoryId,
        medicineId,
        userId,
        Number(initial_stock) || 0,
        unit || 'tablets',
        Number(low_stock_threshold) || 5,
        now,
        Number(initial_stock) || 0
      ]
    );

    // Automatically generate today's doses for this user
    await generateDailyDoses(userId);

    res.status(201).json({
      message: 'Medicine added successfully',
      medicineId
    });
  } catch (error) {
    console.error('Error adding medicine:', error);
    res.status(500).json({ error: 'Failed to add medicine.' });
  }
});

// Update medicine
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      dosage,
      form,
      food_instruction,
      color_tag,
      instructions,
      start_date,
      end_date,
      is_chronic,
      schedules
    } = req.body;

    const med = await query.get('SELECT * FROM medicines WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!med) {
      return res.status(404).json({ error: 'Medicine not found or access denied.' });
    }

    await query.run(
      `UPDATE medicines 
       SET name = ?, dosage = ?, form = ?, food_instruction = ?, color_tag = ?, 
           instructions = ?, start_date = ?, end_date = ?, is_chronic = ?
       WHERE id = ?`,
      [
        name || med.name,
        dosage || med.dosage,
        form || med.form,
        food_instruction || med.food_instruction,
        color_tag || med.color_tag,
        instructions !== undefined ? instructions : med.instructions,
        start_date || med.start_date,
        end_date !== undefined ? end_date : med.end_date,
        is_chronic !== undefined ? (is_chronic ? 1 : 0) : med.is_chronic,
        id
      ]
    );

    // Update schedules if provided
    if (Array.isArray(schedules)) {
      await query.run('DELETE FROM medication_schedules WHERE medicine_id = ?', [id]);
      for (const sch of schedules) {
        await query.run(
          `INSERT INTO medication_schedules 
           (id, medicine_id, time_slot, scheduled_time, dosage_quantity, recurrence_type, days_of_week)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            crypto.randomUUID(),
            id,
            sch.time_slot || 'MORNING',
            sch.scheduled_time || '08:00',
            sch.dosage_quantity || 1.0,
            sch.recurrence_type || 'DAILY',
            sch.days_of_week ? JSON.stringify(sch.days_of_week) : null
          ]
        );
      }
      await generateDailyDoses(req.user.id);
    }

    res.json({ message: 'Medicine updated successfully' });
  } catch (error) {
    console.error('Error updating medicine:', error);
    res.status(500).json({ error: 'Failed to update medicine.' });
  }
});

// Delete medicine
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const med = await query.get('SELECT * FROM medicines WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!med) {
      return res.status(404).json({ error: 'Medicine not found or access denied.' });
    }

    await query.run('DELETE FROM medicines WHERE id = ?', [id]);
    res.json({ message: 'Medicine deleted successfully' });
  } catch (error) {
    console.error('Error deleting medicine:', error);
    res.status(500).json({ error: 'Failed to delete medicine.' });
  }
});

module.exports = router;

