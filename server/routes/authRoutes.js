const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query } = require('../database');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');
const { generateDailyDoses } = require('../services/doseScheduler');

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, phone, preferred_language, emergencyContactName, emergencyContactPhone } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required.' });
    }

    const existingUser = await query.get('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const userId = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(password, 10);
    const lang = preferred_language || 'en';

    await query.run(
      `INSERT INTO users (id, name, email, password_hash, role, phone, preferred_language)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, name, email.toLowerCase().trim(), passwordHash, role, phone || null, lang]
    );

    // If patient, create patient profile with pairing code
    if (role === 'PATIENT') {
      const pairingCode = 'SM-' + Math.floor(1000 + Math.random() * 9000);
      const profileId = crypto.randomUUID();
      await query.run(
        `INSERT INTO patient_profiles (id, user_id, pairing_code, emergency_contact_name, emergency_contact_phone)
         VALUES (?, ?, ?, ?, ?)`,
        [profileId, userId, pairingCode, emergencyContactName || null, emergencyContactPhone || null]
      );
    }

    const token = jwt.sign({ id: userId, email, role, name }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Account registered successfully',
      token,
      user: {
        id: userId,
        name,
        email: email.toLowerCase().trim(),
        role,
        phone,
        preferred_language: lang
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await query.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // If patient, generate today's doses if needed
    if (user.role === 'PATIENT') {
      await generateDailyDoses(user.id);
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Fetch patient profile if patient
    let profile = null;
    if (user.role === 'PATIENT') {
      profile = await query.get('SELECT * FROM patient_profiles WHERE user_id = ?', [user.id]);
    }

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        preferred_language: user.preferred_language,
        profile
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// Get Current User Profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await query.get(
      'SELECT id, name, email, role, phone, preferred_language, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    let profile = null;
    if (user.role === 'PATIENT') {
      profile = await query.get('SELECT * FROM patient_profiles WHERE user_id = ?', [user.id]);
    }

    res.json({ user: { ...user, profile } });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Internal server error fetching user profile.' });
  }
});

// Update Profile & Health Settings
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { 
      name, 
      phone, 
      emergencyContactName, 
      emergencyContactPhone, 
      bloodGroup, 
      allergies, 
      notes,
      gracePeriodMinutes,
      followUpIntervalMinutes
    } = req.body;

    if (name) {
      await query.run('UPDATE users SET name = ?, phone = ? WHERE id = ?', [name, phone || null, req.user.id]);
    }

    if (req.user.role === 'PATIENT') {
      const existing = await query.get('SELECT id FROM patient_profiles WHERE user_id = ?', [req.user.id]);
      if (existing) {
        await query.run(
          `UPDATE patient_profiles 
           SET emergency_contact_name = ?, 
               emergency_contact_phone = ?, 
               blood_group = ?, 
               allergies = ?, 
               notes = ?
           WHERE user_id = ?`,
          [
            emergencyContactName || null,
            emergencyContactPhone || null,
            bloodGroup || null,
            allergies || null,
            notes || null,
            req.user.id
          ]
        );
      }
    }

    res.json({ message: 'Profile and preferences updated successfully' });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Update Preferred Language
router.patch('/language', authenticateToken, async (req, res) => {
  try {
    const { language } = req.body;
    if (!['en', 'hi', 'mr'].includes(language)) {
      return res.status(400).json({ error: 'Supported languages are en, hi, mr' });
    }

    await query.run('UPDATE users SET preferred_language = ? WHERE id = ?', [language, req.user.id]);
    res.json({ message: 'Language updated successfully', preferred_language: language });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update language' });
  }
});

module.exports = router;

