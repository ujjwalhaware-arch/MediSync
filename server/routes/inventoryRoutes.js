const express = require('express');
const router = express.Router();
const crypto = require('crypto');
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

// Get inventory with calculated daily consumption and predicted refill dates
router.get('/', authenticateToken, async (req, res) => {
  try {
    const targetUserId = req.query.patientId || req.user.id;
    const hasAccess = await verifyPatientAccess(req, targetUserId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Unauthorized.' });
    }

    const inventoryItems = await query.all(
      `SELECT mi.*, 
              m.name as medicine_name, 
              m.dosage, 
              m.form, 
              m.color_tag
       FROM medicine_inventory mi
       JOIN medicines m ON mi.medicine_id = m.id
       WHERE mi.user_id = ?
       ORDER BY mi.current_stock ASC`,
      [targetUserId]
    );

    const enriched = await Promise.all(
      inventoryItems.map(async (item) => {
        // Calculate daily consumption rate from schedules
        const schedules = await query.all(
          `SELECT dosage_quantity, recurrence_type, days_of_week 
           FROM medication_schedules 
           WHERE medicine_id = ?`,
          [item.medicine_id]
        );

        let dailyConsumption = 0;
        for (const sch of schedules) {
          const qty = sch.dosage_quantity || 1.0;
          if (sch.recurrence_type === 'DAILY') {
            dailyConsumption += qty;
          } else if (sch.recurrence_type === 'DAYS_OF_WEEK' && sch.days_of_week) {
            try {
              const days = JSON.parse(sch.days_of_week);
              dailyConsumption += (qty * days.length) / 7.0;
            } catch (e) {
              dailyConsumption += qty;
            }
          } else {
            dailyConsumption += qty;
          }
        }

        // Round to 1 decimal place
        dailyConsumption = Math.round(dailyConsumption * 10) / 10;

        let estimatedDaysLeft = null;
        let expectedRefillDate = null;
        let isLowStock = item.current_stock <= item.low_stock_threshold;

        if (dailyConsumption > 0) {
          estimatedDaysLeft = Math.floor(item.current_stock / dailyConsumption);
          const refillD = new Date();
          refillD.setDate(refillD.getDate() + estimatedDaysLeft);
          expectedRefillDate = refillD.toISOString().split('T')[0];
          if (estimatedDaysLeft <= 5) {
            isLowStock = true;
          }
        }

        return {
          ...item,
          daily_consumption: dailyConsumption,
          estimated_days_left: estimatedDaysLeft,
          expected_refill_date: expectedRefillDate,
          is_low_stock: isLowStock
        };
      })
    );

    res.json(enriched);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: 'Failed to fetch inventory.' });
  }
});

// Update stock (Refill or manual correction)
router.post('/:medicineId/refill', authenticateToken, async (req, res) => {
  try {
    const { medicineId } = req.params;
    const { addedQuantity, newTotalStock, low_stock_threshold, unit } = req.body;

    const med = await query.get('SELECT user_id, name FROM medicines WHERE id = ?', [medicineId]);
    if (!med) {
      return res.status(404).json({ error: 'Medicine not found.' });
    }

    const hasAccess = await verifyPatientAccess(req, med.user_id);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Unauthorized to update stock.' });
    }

    const inv = await query.get('SELECT * FROM medicine_inventory WHERE medicine_id = ?', [medicineId]);
    const today = new Date().toISOString().split('T')[0];

    if (!inv) {
      // Create record if missing
      const stock = newTotalStock !== undefined ? Number(newTotalStock) : Number(addedQuantity) || 0;
      await query.run(
        `INSERT INTO medicine_inventory 
         (id, medicine_id, user_id, current_stock, unit, low_stock_threshold, last_refill_date, last_refill_quantity)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          crypto.randomUUID(),
          medicineId,
          med.user_id,
          stock,
          unit || 'tablets',
          low_stock_threshold || 5,
          today,
          stock
        ]
      );
    } else {
      let finalStock = inv.current_stock;
      let refillQty = inv.last_refill_quantity;

      if (newTotalStock !== undefined) {
        finalStock = Number(newTotalStock);
        refillQty = Math.max(0, finalStock - inv.current_stock);
      } else if (addedQuantity !== undefined) {
        refillQty = Number(addedQuantity);
        finalStock = inv.current_stock + refillQty;
      }

      await query.run(
        `UPDATE medicine_inventory 
         SET current_stock = ?, 
             low_stock_threshold = COALESCE(?, low_stock_threshold),
             unit = COALESCE(?, unit),
             last_refill_date = ?, 
             last_refill_quantity = ?, 
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          Math.max(0, finalStock),
          low_stock_threshold,
          unit,
          today,
          refillQty,
          inv.id
        ]
      );
    }

    res.json({ message: 'Stock updated successfully' });
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({ error: 'Failed to update stock.' });
  }
});

module.exports = router;

