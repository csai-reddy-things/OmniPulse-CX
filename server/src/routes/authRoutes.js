import express from 'express';
import bcrypt from 'bcryptjs';
import supabase from '../db/supabaseClient.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { registerSchema, loginSchema, demoLoginSchema } from '../validators/schemas.js';

const router = express.Router();

/**
 * POST /api/auth/register
 */
router.post('/register', validateBody(registerSchema), async (req, res) => {
  const { full_name, email, password, preferred_channel, phone_number, city } = req.body;

  try {
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const { data: user, error: userErr } = await supabase
      .from('users')
      .insert({
        full_name,
        email,
        password_hash: passwordHash,
        role: 'customer'
      })
      .select('id, full_name, email, role, created_at')
      .single();

    if (userErr) throw userErr;

    const { data: profile } = await supabase
      .from('customer_profiles')
      .insert({
        user_id: user.id,
        loyalty_tier: 'Standard',
        lifetime_spend: 0.00,
        goodwill_credits: 0.00,
        preferred_channel: preferred_channel || 'whatsapp',
        phone_number: phone_number || null,
        city: city || null
      })
      .select('*')
      .single();

    const token = generateToken(user);
    res.status(201).json({
      token,
      user,
      profile
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed due to server error.' });
  }
});

/**
 * POST /api/auth/login
 */
router.post('/login', validateBody(loginSchema), async (req, res) => {
  const { email, password } = req.body;

  try {
    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('id, full_name, email, password_hash, role, created_at')
      .eq('email', email)
      .maybeSingle();

    if (userErr || !user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    let profile = null;
    if (user.role === 'customer') {
      const { data: prof } = await supabase
        .from('customer_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      profile = prof || null;
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
    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('id, full_name, email, role, created_at')
      .eq('email', targetEmail)
      .maybeSingle();

    if (userErr || !user) {
      return res.status(404).json({ 
        error: `Demo account for ${role} (${targetEmail}) not found. Please ensure database seed SQL was executed.` 
      });
    }

    let profile = null;
    if (user.role === 'customer') {
      const { data: prof } = await supabase
        .from('customer_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      profile = prof || null;
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
    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('id, full_name, email, role, created_at')
      .eq('id', req.user.id)
      .maybeSingle();

    if (userErr || !user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    let profile = null;
    if (user.role === 'customer') {
      const { data: prof } = await supabase
        .from('customer_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      profile = prof || null;
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
