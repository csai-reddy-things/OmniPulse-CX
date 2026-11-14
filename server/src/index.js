import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import pool from './db/pool.js';
import supabase from './db/supabaseClient.js';
import { runMigrations } from './db/migrate.js';
import { seedDatabase } from './db/seed.js';

import authRoutes from './routes/authRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import conversationRoutes from './routes/conversationRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// 1. Security & Core Middleware
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or same-origin)
    if (!origin) return callback(null, true);
    // Allow configured client URL or local development ports
    if (origin === CLIENT_URL || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }
    // Allow in non-production or allow all for smooth demo
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// 2. Health Check Endpoint (Render Monitoring)
app.get('/api/health', async (req, res) => {
  let dbStatus = 'connected';
  try {
    const { error } = await supabase.from('users').select('id').limit(1);
    if (error) dbStatus = `supabase_error: ${error.message}`;
  } catch (err) {
    dbStatus = `error: ${err.message}`;
  }

  res.json({
    status: 'ok',
    service: 'OmniPulse CX Backend API',
    db: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// 3. API Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/admin', adminRoutes);

// 4. 404 Route Catch-All
app.use((req, res) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.url}` });
});

// 5. Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    error: 'Internal server error occurred.',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 6. Server Initialization with DB Migration & Seeding
async function startServer() {
  console.log('🚀 [STARTUP]: Starting OmniPulse CX Express Server...');
  
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('[YOUR-PASSWORD]')) {
    try {
      console.log('📦 [DATABASE]: Applying database schema migrations...');
      await runMigrations();
      console.log('🌱 [DATABASE]: Ensuring demo accounts and baseline data exist...');
      await seedDatabase(false);
    } catch (dbInitErr) {
      console.warn('⚠️ [STARTUP NOTICE]: Direct pg connection skipped on startup:', dbInitErr.message);
    }
  } else {
    console.log('⚡ [SUPABASE]: Connected directly to Supabase Cloud API with Service Role.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ [OMNIPULSE CX SERVER]: Running on http://localhost:${PORT}`);
    console.log(`📡 [HEALTH CHECK]: http://localhost:${PORT}/api/health`);
  });
}

startServer();
