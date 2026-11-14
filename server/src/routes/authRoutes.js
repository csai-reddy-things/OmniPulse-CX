import express from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db/pool.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { registerSchema, loginSchema, demoLoginSchema } from '../validators/schemas.js';
import { seedDatabase } from '../db/seed.js';

const router = express.Router();

/**
 * POST /api/auth/register
 */
router.post('/register', validateBody(registerSchema), async (req, res) => {
  const { full_name, email, password, preferred_channel, phone_number, city } = req.body;
  const client = await pool.connect();

  try {
    const existing = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    await client.query('BEGIN');

    const passwordHash = await bcrypt.hash(password, 10);
    const userResult = await client.query(
      `INSERT INTO users (full_name, email, password_hash, role)
       VALUES ($1, $2, $3, 'customer')
       RETURNING id, full_name, email, role, created_at`,
      [full_name, email, passwordHash]
    );
    const user = userResult.rows[0];

    const profileResult = await client.query(
      `INSERT INTO customer_profiles (user_id, loyalty_tier, lifetime_spend, goodwill_credits, preferred_channel, phone_number, city)
       VALUES ($1, 'Standard', 0.00, 0.00, $2, $3, $4)
       RETURNING *`,
      [user.id, preferred_channel || 'whatsapp', phone_number || null, city || null]
    );
    const profile = profileResult.rows[0];

    await client.query('COMMIT');

    const token = generateToken(user);
    res.status(201).json({
      token,
      user,
      profile
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed due to server error.' });
  } finally {
    client.release();
  }
});

/**
 * POST /api/auth/login
 */
router.post('/login', validateBody(loginSchema), async (req, res) => {
  const { email, password } = req.body;

  try {
    const userRes = await pool.query(
      'SELECT id, full_name, email, password_hash, role, created_at FROM users WHERE email = $1',
      [email]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = userRes.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    let profile = null;
    if (user.role === 'customer') {
      const profRes = await pool.query('SELECT * FROM customer_profiles WHERE user_id = $1', [user.id]);
      profile = profRes.rows[0] || null;
    }

    const safeUser = {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      created_at: user.created_at
    };

    const token = generateToken(safeUser);
    res.json({
      token,
      user: safeUser,
      profile
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed due to server error.' });
  }
});

/**
 * POST /api/auth/demo
 * 1-Click login as demo customer or demo admin
 */
router.post('/demo', validateBody(demoLoginSchema), async (req, res) => {
  const { role } = req.body;
  const targetEmail = role === 'admin' ? 'admin@omnipulse.ai' : 'aarav@demo.com';

  try {
    let userRes = await pool.query(
      'SELECT id, full_name, email, role, created_at FROM users WHERE email = $1',
      [targetEmail]
    );

    // If database wasn't seeded yet, seed it automatically
    if (userRes.rows.length === 0) {
      await seedDatabase(false);
      userRes = await pool.query(
        'SELECT id, full_name, email, role, created_at FROM users WHERE email = $1',
        [targetEmail]
      );
    }

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: `Demo account for ${role} not found. Please run seed script.` });
    }

    const user = userRes.rows[0];
    let profile = null;

    if (user.role === 'customer') {
      const profRes = await pool.query('SELECT * FROM customer_profiles WHERE user_id = $1', [user.id]);
      profile = profRes.rows[0] || null;
    }

    const token = generateToken(user);
    res.json({
      token,
      user,
      profile
    });
  } catch (error) {
    console.error('Demo login error:', error);
    res.status(500).json({ error: 'Demo login failed.' });
  }
});

/**
 * GET /api/auth/me
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userRes = await pool.query(
      'SELECT id, full_name, email, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    const user = userRes.rows[0];
    let profile = null;

    if (user.role === 'customer') {
      const profRes = await pool.query('SELECT * FROM customer_profiles WHERE user_id = $1', [user.id]);
      profile = profRes.rows[0] || null;
    }

    res.json({
      user,
      profile
    });
  } catch (error) {
    console.error('Me endpoint error:', error);
    res.status(500).json({ error: 'Failed to retrieve profile.' });
  }
});

export default router;
