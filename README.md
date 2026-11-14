# OmniPulse CX — AI-Powered Omnichannel Customer Experience & Proactive Retention Platform

[![Stack](https://img.shields.io/badge/Stack-Supabase%20%7C%20Express%20%7C%20React%20%7C%20Gemini-6366f1.svg)](#technology-stack)
[![AI Engine](https://img.shields.io/badge/AI-Google%20Gemini%202.5%20Flash-emerald.svg)](#gemini-ai-engine)
[![Frontend](https://img.shields.io/badge/Deploy-Vercel-black.svg)](#vercel-frontend-deployment)
[![Backend](https://img.shields.io/badge/Deploy-Render-46E3B7.svg)](#render-backend-deployment)

OmniPulse CX is a production-grade, full-stack AI Customer Experience platform engineered for Direct-to-Consumer (D2C) retail and quick-commerce brands. It bridges customer-facing omnichannel resolution with executive-level operational intelligence.

---

## 🌟 Key Capabilities & Architectural Pillars

### 1. Unified Omnichannel Memory Continuity
- **Web Live Chat, WhatsApp, and Email** operate inside one unified, persistent conversation thread.
- Switching channels **never resets context** or forces the customer to repeat themselves.
- Adapts tone, greeting, and styling dynamically (WhatsApp checkmarks & bubble styling, Email subject header layout, Web Chat clean modern bubbles).

### 2. Autonomous Action Execution (AI Tool Calling & Database Mutations)
Powered exclusively by **Google Gemini** (`@google/genai`) on the Express backend to evaluate customer intent and autonomously execute real PostgreSQL mutations:
- `track_order`: Checks live carrier transit telemetry, delivery window, and current sorting hub.
- `issue_instant_refund`: Approves and processes full or partial refunds, changes status to `refunded`, and logs audit trail.
- `reschedule_delivery`: Updates delivery window and dates in PostgreSQL and re-routes courier.
- `create_replacement_order`: Generates zero-cost replacement orders (`ORD-...-REP`) for damaged or wrong items.
- `apply_goodwill_credit`: Deposits retention incentives directly into customer wallet.
- `escalate_to_human`: Routes critical churn risks to the CX Executive Escalations Queue.

### 3. Proactive Disruption & Retention Engine
- Logistics delay simulator on active orders simulates transit breakdowns and triggers unprompted outreach in the customer's preferred channel with pre-approved goodwill credits (₹250 / $15) before the customer complains.

### 4. Executive CX Analytics & Recharts Workbench
- **KPI Cards**: Average Customer Sentiment (+0.75), Automated Resolution Rate (88%), High Churn Alerts, Goodwill Credits Disbursed.
- **Recharts Visualizations**:
  - Sentiment & Engagement Trajectory (`AreaChart`)
  - Root-Cause Issue Breakdown (`BarChart`)
  - Channel Engagement Distribution (`PieChart`)
- **AI Operational Recommendations Feed**: Live operational fixes synthesized by Gemini to prevent recurring logistics bottlenecks.
- **Human Escalation Queue & Customer 360**: Resolution workflow to inspect threads and resolve tickets.

---

## 🏗️ Monorepo Structure

```
omnipulse-cx/
├── .gitignore
├── README.md
├── package.json                         # Root convenience scripts
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql       # PostgreSQL schema, RLS policies & seed data
├── client/                              # React 18 + Vite + Tailwind CSS + Recharts
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── vercel.json                      # Single Page App rewrite rule for Vercel
│   ├── .env.example
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css
│       ├── api/axiosClient.js
│       ├── context/AuthContext.jsx
│       ├── components/
│       │   ├── Navbar.jsx
│       │   ├── ProtectedRoute.jsx
│       │   ├── cx/
│       │   │   ├── ChannelSwitcher.jsx
│       │   │   ├── UnifiedThread.jsx
│       │   │   ├── ActionConfirmationCard.jsx
│       │   │   └── CustomerOrderSidebar.jsx
│       │   └── admin/
│       │       ├── KpiGrid.jsx
│       │       ├── SentimentTrendChart.jsx
│       │       ├── RootCauseBarChart.jsx
│       │       ├── ChannelSplitPieChart.jsx
│       │       ├── OpsRecommendationsFeed.jsx
│       │       └── EscalationModal.jsx
│       └── pages/
│           ├── LandingPage.jsx
│           ├── LoginPage.jsx
│           ├── RegisterPage.jsx
│           ├── CustomerCxHubPage.jsx
│           ├── CustomerOrdersPage.jsx
│           ├── AdminDashboardPage.jsx
│           ├── AdminEscalationsPage.jsx
│           └── AdminCustomer360Page.jsx
└── server/                              # Node.js + Express + pg + @google/genai
    ├── package.json
    ├── .env.example
    └── src/
        ├── index.js                     # Express app, health check & auto-migration
        ├── db/
        │   ├── pool.js                  # PostgreSQL pool with Supabase SSL support
        │   ├── schema.sql               # Production schema
        │   ├── migrate.js               # Database migration runner
        │   └── seed.js                  # Idempotent demo account & orders seeder
        ├── middleware/
        │   ├── auth.js                  # JWT verification & requireRole middleware
        │   └── validate.js              # Zod request validation middleware
        ├── validators/
        │   └── schemas.js               # Zod validation schemas
        ├── services/
        │   ├── geminiService.js         # Official @google/genai Prompts A, B, C
        │   └── actionExecutorService.js # Autonomous support action DB mutations
        └── routes/
            ├── authRoutes.js            # Register, Login, Demo 1-Click Login, Me
            ├── orderRoutes.js           # Get orders, Simulate carrier delay
            ├── conversationRoutes.js    # Active thread, send message + tool execution
            └── adminRoutes.js           # KPIs, Recharts data, Escalations, Customer 360
```

---

## 🔑 Demo Credentials (1-Click Login Available)

On the `/login` page, you can use the **1-Click Demo Login** buttons or enter the credentials below:

| Role | Email | Password | Persona & Tier |
|---|---|---|---|
| **Demo Customer** | `aarav@demo.com` | `Demo@123` | Aarav Sharma &bull; Gold Tier &bull; Active Orders |
| **Demo Admin** | `admin@omnipulse.ai` | `Admin@123` | Priya Iyer &bull; CX Lead &bull; Executive Command |

---

## ⚙️ Environment Variables Setup

### 1. Backend: `server/.env`
Create `server/.env` based on `server/.env.example`:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
JWT_SECRET=replace_with_a_strong_64_char_random_secret_key_omnipulse_cx_2026
GEMINI_API_KEY=your_google_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```

> **Note on Security:** `GEMINI_API_KEY` and `DATABASE_URL` reside **strictly** on the Express backend (`server/.env`) and are **never** bundled or exposed to the client browser.

### 2. Frontend: `client/.env`
Create `client/.env` based on `client/.env.example`:

```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🗄️ Database Setup (Supabase Cloud PostgreSQL)

### Option A: Using the Supabase SQL Editor (Recommended)
1. Log in to [Supabase](https://supabase.com) and create a new project.
2. Navigate to **SQL Editor**.
3. Open `supabase/migrations/001_initial_schema.sql` in this repo, copy its contents, paste them into the SQL Editor, and click **Run**.
4. This creates all tables (`users`, `customer_profiles`, `orders`, `conversations`, `messages`, `support_actions`, `conversation_insights`), activates **Row Level Security (RLS)**, and seeds initial demo data.

### Option B: Automatic Migration via Node CLI
Once your `DATABASE_URL` is set in `server/.env`:
```bash
# Apply migrations
npm --prefix server run db:migrate

# Seed demo data
npm --prefix server run db:seed
```

---

## 🚀 Local Development Quickstart

### 1. Install Dependencies
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Start Backend Server
```bash
cd server
npm run dev
# Server will start on http://localhost:5000
# Health check available at: http://localhost:5000/api/health
```

### 3. Start Frontend Client
```bash
cd client
npm run dev
# Frontend will start on http://localhost:5173
```

---

## 🌐 Production Deployment Guide

### A. Database Deployment (Supabase)
1. Create a Supabase project in your target region.
2. Run `supabase/migrations/001_initial_schema.sql` in the SQL Editor.
3. In Project Settings > Database > Connection String, copy the **URI** (Session Pooler or Direct Connection) and use it as `DATABASE_URL`.

### B. Backend Deployment (Render)
1. Create a new **Web Service** on [Render](https://render.com).
2. Connect your GitHub repository.
3. Configure settings:
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/index.js`
   - **Health Check Path**: `/api/health`
4. Add Environment Variables in the Render dashboard:
   - `DATABASE_URL`: Your Supabase connection string.
   - `JWT_SECRET`: Random 64-character secret.
   - `GEMINI_API_KEY`: Your Google Gemini API Key.
   - `GEMINI_MODEL`: `gemini-2.5-flash`
   - `CLIENT_URL`: Your deployed frontend URL (e.g., `https://your-app.vercel.app`).
   - `NODE_ENV`: `production`

### C. Frontend Deployment (Vercel)
1. Import your GitHub repository into [Vercel](https://vercel.com).
2. Configure settings:
   - **Root Directory**: `client`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add Environment Variables in Vercel:
   - `VITE_API_URL`: Your Render backend API endpoint (e.g. `https://your-backend.onrender.com/api`).
4. `client/vercel.json` is included automatically so direct URL navigation (e.g. `/cx-hub`, `/admin/dashboard`) handles client-side routing cleanly without 404 errors.

---

## 🧪 Testing Verification Scenarios

1. **Omnichannel Continuity Test**:
   - Log in as Demo Customer (`aarav@demo.com` or 1-Click button).
   - In `/cx-hub`, send a message on **Web Chat**: `"Where is my order #ORD-1042?"`.
   - AI tracks order and responds with an Order Tracking Confirmation Card.
   - Switch channel selector to **WhatsApp** and send: `"Can we reschedule delivery to tomorrow morning?"`.
   - Notice AI seamlessly references `#ORD-1042`, reschedules the slot in PostgreSQL, and replies in WhatsApp tone.

2. **Proactive Retention Test**:
   - In `/cx-hub` or `/orders`, click **"Simulate Delay"** on `#ORD-1043` or `#ORD-1044`.
   - The backend marks the order as delayed and Gemini triggers a proactive retention message with an instant ₹250 goodwill wallet credit.

3. **Executive Admin Dashboard Test**:
   - Log in as Demo Admin (`admin@omnipulse.ai` or 1-Click button).
   - View updated KPI cards, Recharts visualizations (Sentiment Trend, Root Causes, Channel Split), and AI recommendations.
   - Open `/admin/escalations` and resolve a critical ticket with resolution notes.
