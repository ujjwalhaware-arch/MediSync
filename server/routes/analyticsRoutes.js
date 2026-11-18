const express = require('express');
const router = express.Router();
const { query } = require('../database');
const { authenticateToken } = require('../middleware/auth');

async function verifyPatientAccess(req, patientId) {
  if (req.user.role === 'PATIENT') return req.user.id === patientId;
  if (req.user.role === 'CAREGIVER') {
    const link = await query.get(
      'SELECT id FROM caregiver_relationships WHERE caregiver_id = ? AND patient_id = ? AND status = ?',
      [req.user.id, patientId, 'ACTIVE']
    );
    return !!link;
  }
  return false;
}

// Get comprehensive adherence analytics
router.get('/adherence', authenticateToken, async (req, res) => {
  try {
    const targetUserId = req.query.patientId || req.user.id;
    const hasAccess = await verifyPatientAccess(req, targetUserId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Unauthorized.' });
    }

    const days = parseInt(req.query.days || '7', 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    const startStr = startDate.toISOString().split('T')[0];

    // Fetch all doses in window
    const doses = await query.all(
      `SELECT sd.*, 
              m.name as medicine_name, 
              ms.time_slot
       FROM scheduled_doses sd
       JOIN medicines m ON sd.medicine_id = m.id
       JOIN medication_schedules ms ON sd.schedule_id = ms.id
       WHERE sd.user_id = ? AND sd.dose_date >= ?
       ORDER BY sd.dose_date ASC, sd.scheduled_time ASC`,
      [targetUserId, startStr]
    );

    let totalDoses = 0;
    let takenDoses = 0;
    let missedDoses = 0;
    let skippedDoses = 0;
    let scheduledPending = 0;

    const dailyBreakdown = {};
    const medicineBreakdown = {};
    const timeSlotBreakdown = {
      MORNING: { total: 0, taken: 0, missed: 0, skipped: 0 },
      AFTERNOON: { total: 0, taken: 0, missed: 0, skipped: 0 },
      EVENING: { total: 0, taken: 0, missed: 0, skipped: 0 },
      NIGHT: { total: 0, taken: 0, missed: 0, skipped: 0 }
    };

    // Pre-populate daily breakdown for the requested date range
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
      dailyBreakdown[dateStr] = {
        date: dateStr,
        day: dayLabel,
        total: 0,
        taken: 0,
        missed: 0,
        skipped: 0,
        adherence: 0
      };
    }

    for (const d of doses) {
      totalDoses++;
      if (d.status === 'TAKEN') takenDoses++;
      else if (d.status === 'MISSED') missedDoses++;
      else if (d.status === 'SKIPPED') skippedDoses++;
      else if (d.status === 'SCHEDULED') scheduledPending++;

      // Daily
      if (dailyBreakdown[d.dose_date]) {
        dailyBreakdown[d.dose_date].total++;
        if (d.status === 'TAKEN') dailyBreakdown[d.dose_date].taken++;
        else if (d.status === 'MISSED') dailyBreakdown[d.dose_date].missed++;
        else if (d.status === 'SKIPPED') dailyBreakdown[d.dose_date].skipped++;
      }

      // Medicine breakdown
      if (!medicineBreakdown[d.medicine_name]) {
        medicineBreakdown[d.medicine_name] = {
          name: d.medicine_name,
          total: 0,
          taken: 0,
          missed: 0,
          skipped: 0
        };
      }
      medicineBreakdown[d.medicine_name].total++;
      if (d.status === 'TAKEN') medicineBreakdown[d.medicine_name].taken++;
      else if (d.status === 'MISSED') medicineBreakdown[d.medicine_name].missed++;
      else if (d.status === 'SKIPPED') medicineBreakdown[d.medicine_name].skipped++;

      // Time slot breakdown
      const slot = d.time_slot && timeSlotBreakdown[d.time_slot] ? d.time_slot : 'MORNING';
      timeSlotBreakdown[slot].total++;
      if (d.status === 'TAKEN') timeSlotBreakdown[slot].taken++;
      else if (d.status === 'MISSED') timeSlotBreakdown[slot].missed++;
      else if (d.status === 'SKIPPED') timeSlotBreakdown[slot].skipped++;
    }

    // Compute adherence percentages
    const finalizedDaily = Object.values(dailyBreakdown).map(item => ({
      ...item,
      adherence: item.total > 0 ? Math.round((item.taken / item.total) * 100) : 100
    }));

    const finalizedMedicine = Object.values(medicineBreakdown).map(item => ({
      ...item,
      adherence: item.total > 0 ? Math.round((item.taken / item.total) * 100) : 0
    }));

    const finalizedTimeSlot = Object.keys(timeSlotBreakdown).map(slot => {
      const s = timeSlotBreakdown[slot];
      return {
        slot,
        total: s.total,
        taken: s.taken,
        missed: s.missed,
        skipped: s.skipped,
        adherence: s.total > 0 ? Math.round((s.taken / s.total) * 100) : 100
      };
    });

    const nonPendingTotal = takenDoses + missedDoses + skippedDoses;
    const overallAdherence = nonPendingTotal > 0
      ? Math.round((takenDoses / (takenDoses + missedDoses + skippedDoses)) * 100)
      : (totalDoses > 0 ? 100 : 0);

    // Identify most missed medicine & timing
    let mostMissedMedicine = null;
    let maxMedMissed = 0;
    for (const m of finalizedMedicine) {
      if (m.missed > maxMedMissed) {
        maxMedMissed = m.missed;
        mostMissedMedicine = m.name;
      }
    }

    let mostMissedSlot = null;
    let maxSlotMissed = 0;
    for (const s of finalizedTimeSlot) {
      if (s.missed > maxSlotMissed) {
        maxSlotMissed = s.missed;
        mostMissedSlot = s.slot;
      }
    }

    // Fetch patient info for clinical reports
    const patientUser = await query.get(
      'SELECT u.name, u.email, u.phone, pp.blood_group, pp.allergies FROM users u LEFT JOIN patient_profiles pp ON u.id = pp.user_id WHERE u.id = ?',
      [targetUserId]
    );

    res.json({
      timeRangeDays: days,
      patient: patientUser,
      summary: {
        totalScheduled: totalDoses,
        takenDoses,
        missedDoses,
        skippedDoses,
        pendingDoses: scheduledPending,
        adherencePercentage: overallAdherence,
        mostMissedMedicine: maxMedMissed > 0 ? mostMissedMedicine : 'None',
        mostMissedSlot: maxSlotMissed > 0 ? mostMissedSlot : 'None'
      },
      dailyTrend: finalizedDaily,
      medicineBreakdown: finalizedMedicine,
      timeSlotBreakdown: finalizedTimeSlot
    });
  } catch (error) {
    console.error('Error computing analytics:', error);
    res.status(500).json({ error: 'Failed to generate analytics.' });
  }
});

module.exports = router;

