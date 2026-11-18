const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { query } = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { getTodayDateString, generateDailyDoses } = require('../services/doseScheduler');

// Patient generates a new pairing code
router.post('/generate-code', authenticateToken, requireRole('PATIENT'), async (req, res) => {
  try {
    const code = 'SM-' + Math.floor(1000 + Math.random() * 9000);
    // Expires in 48 hours
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48);

    await query.run(
      `UPDATE patient_profiles 
       SET pairing_code = ?, pairing_code_expires_at = ? 
       WHERE user_id = ?`,
      [code, expiresAt.toISOString(), req.user.id]
    );

    res.json({
      pairingCode: code,
      expiresAt: expiresAt.toISOString()
    });
  } catch (error) {
    console.error('Error generating pairing code:', error);
    res.status(500).json({ error: 'Failed to generate pairing code.' });
  }
});

// Get patient's existing pairing code & linked caregivers (for Patient settings)
router.get('/my-caregivers', authenticateToken, requireRole('PATIENT'), async (req, res) => {
  try {
    const profile = await query.get(
      'SELECT pairing_code, pairing_code_expires_at FROM patient_profiles WHERE user_id = ?',
      [req.user.id]
    );

    const caregivers = await query.all(
      `SELECT cr.id as link_id, cr.status, cr.created_at, u.id as caregiver_id, u.name, u.email, u.phone
       FROM caregiver_relationships cr
       JOIN users u ON cr.caregiver_id = u.id
       WHERE cr.patient_id = ?`,
      [req.user.id]
    );

    res.json({
      pairingCode: profile ? profile.pairing_code : null,
      pairingCodeExpiresAt: profile ? profile.pairing_code_expires_at : null,
      caregivers
    });
  } catch (error) {
    console.error('Error fetching patient caregivers:', error);
    res.status(500).json({ error: 'Failed to fetch caregivers.' });
  }
});

// Caregiver links patient via code
router.post('/link-patient', authenticateToken, requireRole('CAREGIVER'), async (req, res) => {
  try {
    const { pairingCode } = req.body;
    if (!pairingCode) {
      return res.status(400).json({ error: 'Pairing code is required.' });
    }

    const cleanCode = pairingCode.trim().toUpperCase();

    const profile = await query.get(
      'SELECT user_id, pairing_code_expires_at FROM patient_profiles WHERE pairing_code = ?',
      [cleanCode]
    );

    if (!profile) {
      return res.status(404).json({ error: 'Invalid pairing code. Please double-check with the patient.' });
    }

    // Check expiration if set
    if (profile.pairing_code_expires_at && new Date(profile.pairing_code_expires_at) < new Date()) {
      return res.status(400).json({ error: 'This pairing code has expired. Please ask the patient to generate a new one.' });
    }

    // Check if relationship already exists
    const existing = await query.get(
      'SELECT id, status FROM caregiver_relationships WHERE caregiver_id = ? AND patient_id = ?',
      [req.user.id, profile.user_id]
    );

    if (existing) {
      if (existing.status === 'ACTIVE') {
        return res.status(400).json({ error: 'You are already linked to this patient.' });
      } else {
        await query.run('UPDATE caregiver_relationships SET status = "ACTIVE" WHERE id = ?', [existing.id]);
      }
    } else {
      const linkId = crypto.randomUUID();
      await query.run(
        `INSERT INTO caregiver_relationships (id, caregiver_id, patient_id, status)
         VALUES (?, ?, ?, 'ACTIVE')`,
        [linkId, req.user.id, profile.user_id]
      );
    }

    // Notify the patient
    const patientUser = await query.get('SELECT name FROM users WHERE id = ?', [profile.user_id]);
    await query.run(
      `INSERT INTO notifications (id, user_id, patient_id, type, title, message)
       VALUES (?, ?, ?, 'CAREGIVER_ALERT', 'Caregiver Linked', ?)`,
      [
        crypto.randomUUID(),
        profile.user_id,
        profile.user_id,
        `${req.user.name} has linked as your caregiver and can now monitor your medication adherence.`
      ]
    );

    res.json({
      message: `Successfully linked to ${patientUser ? patientUser.name : 'patient'}!`,
      patientId: profile.user_id
    });
  } catch (error) {
    console.error('Error linking patient:', error);
    res.status(500).json({ error: 'Failed to link patient.' });
  }
});

// Caregiver gets list of all linked patients with adherence overview
router.get('/patients', authenticateToken, requireRole('CAREGIVER'), async (req, res) => {
  try {
    const today = getTodayDateString();

    const relationships = await query.all(
      `SELECT cr.id as link_id, cr.created_at as linked_since, 
              u.id as patient_id, u.name, u.email, u.phone, u.preferred_language,
              pp.blood_group, pp.emergency_contact_phone, pp.emergency_contact_name
       FROM caregiver_relationships cr
       JOIN users u ON cr.patient_id = u.id
       LEFT JOIN patient_profiles pp ON u.id = pp.user_id
       WHERE cr.caregiver_id = ? AND cr.status = 'ACTIVE'`,
      [req.user.id]
    );

    const patientsOverview = await Promise.all(
      relationships.map(async (p) => {
        // Ensure today's doses exist
        await generateDailyDoses(p.patient_id, today);

        // Fetch today's dose stats
        const doses = await query.all(
          `SELECT status, scheduled_time, medicine_id FROM scheduled_doses 
           WHERE user_id = ? AND dose_date = ?`,
          [p.patient_id, today]
        );

        const totalToday = doses.length;
        const takenToday = doses.filter(d => d.status === 'TAKEN').length;
        const missedToday = doses.filter(d => d.status === 'MISSED').length;
        const pendingToday = doses.filter(d => d.status === 'SCHEDULED').length;

        // Fetch recent missed doses
        const recentMissed = await query.all(
          `SELECT sd.*, m.name as medicine_name, m.dosage
           FROM scheduled_doses sd
           JOIN medicines m ON sd.medicine_id = m.id
           WHERE sd.user_id = ? AND sd.status = 'MISSED'
           ORDER BY sd.dose_date DESC, sd.scheduled_time DESC LIMIT 3`,
          [p.patient_id]
        );

        // Fetch low stock items for this patient
        const lowStockItems = await query.all(
          `SELECT mi.current_stock, mi.unit, m.name as medicine_name
           FROM medicine_inventory mi
           JOIN medicines m ON mi.medicine_id = m.id
           WHERE mi.user_id = ? AND mi.current_stock <= mi.low_stock_threshold`,
          [p.patient_id]
        );

        // Calculate 7-day adherence
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 6);
        const weekStr = weekStart.toISOString().split('T')[0];

        const weekDoses = await query.all(
          `SELECT status FROM scheduled_doses WHERE user_id = ? AND dose_date >= ?`,
          [p.patient_id, weekStr]
        );
        const weekTotal = weekDoses.filter(d => ['TAKEN', 'MISSED', 'SKIPPED'].includes(d.status)).length;
        const weekTaken = weekDoses.filter(d => d.status === 'TAKEN').length;
        const weeklyAdherence = weekTotal > 0 ? Math.round((weekTaken / weekTotal) * 100) : 100;

        return {
          ...p,
          todayStats: {
            total: totalToday,
            taken: takenToday,
            missed: missedToday,
            pending: pendingToday,
            progress: totalToday > 0 ? Math.round((takenToday / totalToday) * 100) : 100
          },
          weeklyAdherence,
          recentMissed,
          lowStockCount: lowStockItems.length,
          lowStockItems
        };
      })
    );

    res.json(patientsOverview);
  } catch (error) {
    console.error('Error fetching caregiver patients:', error);
    res.status(500).json({ error: 'Failed to fetch patients list.' });
  }
});

// Unlink patient
router.delete('/unlink/:patientId', authenticateToken, async (req, res) => {
  try {
    const { patientId } = req.params;

    if (req.user.role === 'CAREGIVER') {
      await query.run(
        'DELETE FROM caregiver_relationships WHERE caregiver_id = ? AND patient_id = ?',
        [req.user.id, patientId]
      );
    } else {
      // Patient revoking caregiver
      await query.run(
        'DELETE FROM caregiver_relationships WHERE patient_id = ? AND caregiver_id = ?',
        [req.user.id, patientId]
      );
    }

    res.json({ message: 'Caregiver relationship successfully removed.' });
  } catch (error) {
    console.error('Error unlinking:', error);
    res.status(500).json({ error: 'Failed to remove relationship.' });
  }
});

module.exports = router;

