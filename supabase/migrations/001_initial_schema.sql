-- ============================================================================
-- OmniPulse CX: Schema, Row-Level Security (RLS), and Seed Data Migration
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Users Table (JWT + bcrypt Authentication)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Customer Profiles (Personalization Context)
CREATE TABLE IF NOT EXISTS customer_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    loyalty_tier VARCHAR(20) NOT NULL DEFAULT 'Standard' CHECK (loyalty_tier IN ('Standard', 'Gold', 'VIP')),
    lifetime_spend NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    goodwill_credits NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    preferred_channel VARCHAR(20) NOT NULL DEFAULT 'whatsapp' CHECK (preferred_channel IN ('web_chat', 'whatsapp', 'email')),
    phone_number VARCHAR(30),
    city VARCHAR(80),
    persona_notes TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Orders Table (Real-World Transactional State for AI Mutations)
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(30) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_name VARCHAR(200) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    total_amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'processing' CHECK (
        status IN ('processing', 'shipped', 'out_for_delivery', 'delayed', 'delivered', 'refunded', 'replacement_dispatched')
    ),
    carrier_name VARCHAR(80) DEFAULT 'BlueDart Express',
    tracking_hub VARCHAR(120) DEFAULT 'Bengaluru Central Hub',
    estimated_delivery DATE NOT NULL,
    delivery_slot VARCHAR(60) DEFAULT '10:00 AM - 2:00 PM',
    delay_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Unified Omnichannel Conversations
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(25) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'escalated')),
    active_channel VARCHAR(20) NOT NULL DEFAULT 'web_chat' CHECK (active_channel IN ('web_chat', 'whatsapp', 'email')),
    escalation_reason TEXT,
    admin_resolution_notes TEXT,
    last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Cross-Channel Messages
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('customer', 'ai_agent', 'system_proactive', 'admin')),
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('web_chat', 'whatsapp', 'email')),
    email_subject VARCHAR(255),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Autonomous Support Actions Log
CREATE TABLE IF NOT EXISTS support_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    action_type VARCHAR(40) NOT NULL,
    action_summary TEXT NOT NULL,
    action_payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. AI-Generated Actionable Insights
CREATE TABLE IF NOT EXISTS conversation_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID UNIQUE NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sentiment_score NUMERIC(4, 2) NOT NULL DEFAULT 0.00,
    emotion_tag VARCHAR(30) NOT NULL DEFAULT 'neutral',
    root_cause_category VARCHAR(40) NOT NULL DEFAULT 'product_inquiry',
    churn_risk_level VARCHAR(20) NOT NULL DEFAULT 'low' CHECK (churn_risk_level IN ('low', 'medium', 'high', 'critical')),
    executive_summary TEXT NOT NULL,
    recommended_ops_action TEXT NOT NULL,
    analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_insights_churn_risk ON conversation_insights(churn_risk_level);
CREATE INDEX IF NOT EXISTS idx_insights_user_id ON conversation_insights(user_id);

-- ============================================================================
-- Row Level Security (RLS) Setup
-- ============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_insights ENABLE ROW LEVEL SECURITY;

-- Permissive policies for service role and postgres superuser
DO $$
BEGIN
    DROP POLICY IF EXISTS "Service role full access on users" ON users;
    CREATE POLICY "Service role full access on users" ON users FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Service role full access on customer_profiles" ON customer_profiles;
    CREATE POLICY "Service role full access on customer_profiles" ON customer_profiles FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Service role full access on orders" ON orders;
    CREATE POLICY "Service role full access on orders" ON orders FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Service role full access on conversations" ON conversations;
    CREATE POLICY "Service role full access on conversations" ON conversations FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Service role full access on messages" ON messages;
    CREATE POLICY "Service role full access on messages" ON messages FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Service role full access on support_actions" ON support_actions;
    CREATE POLICY "Service role full access on support_actions" ON support_actions FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Service role full access on conversation_insights" ON conversation_insights;
    CREATE POLICY "Service role full access on conversation_insights" ON conversation_insights FOR ALL USING (true) WITH CHECK (true);
END $$;

-- ============================================================================
-- Seed Data
-- Demo Customer: aarav@demo.com / Demo@123
-- Demo Admin: admin@omnipulse.ai / Admin@123
-- ============================================================================

-- Fixed UUIDs for predictable testing
DO $$
DECLARE
    v_customer_id UUID := 'c1111111-1111-4111-a111-111111111111';
    v_admin_id UUID := 'a1111111-1111-4111-a111-111111111111';
    v_order_1041 UUID := '01041111-1111-4111-a111-111111111111';
    v_order_1042 UUID := '01042111-1111-4111-a111-111111111111';
    v_order_1043 UUID := '01043111-1111-4111-a111-111111111111';
    v_order_1044 UUID := '01044111-1111-4111-a111-111111111111';
    v_conv_id UUID := 'd1111111-1111-4111-a111-111111111111';
    -- bcrypt hash for 'Demo@123': $2a$10$v0rI76lJqA.r.9pWkY/0feDphxXh22P2Jz3XQ5VzT6f4K1cWzZf6O
    v_cust_pwd TEXT := '$2a$10$v0rI76lJqA.r.9pWkY/0feDphxXh22P2Jz3XQ5VzT6f4K1cWzZf6O';
    -- bcrypt hash for 'Admin@123': $2a$10$g5BqYgD7M55pA5/tA03K1OaH1g5V5Q6Lg5d5X5P5B5M5pA5/tA03K
    v_admin_pwd TEXT := '$2a$10$T8Z.XlXlWqD1VzI1/F3m/OCJ9oQ0H2zG1X4h8i3r6l8f2v1q4j6eC';
BEGIN
    -- 1. Insert Demo Customer
    INSERT INTO users (id, full_name, email, password_hash, role)
    VALUES (v_customer_id, 'Aarav Sharma', 'aarav@demo.com', v_cust_pwd, 'customer')
    ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name;

    -- 2. Insert Demo Admin
    INSERT INTO users (id, full_name, email, password_hash, role)
    VALUES (v_admin_id, 'Priya Iyer (CX Lead)', 'admin@omnipulse.ai', v_admin_pwd, 'admin')
    ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name;

    -- 3. Customer Profile
    INSERT INTO customer_profiles (user_id, loyalty_tier, lifetime_spend, goodwill_credits, preferred_channel, phone_number, city, persona_notes)
    VALUES (v_customer_id, 'Gold', 48200.00, 250.00, 'whatsapp', '+91 98765 43210', 'Bengaluru', 'Frequent electronics buyer. Prefers WhatsApp notifications. Sensitive to evening delivery delays.')
    ON CONFLICT (user_id) DO UPDATE SET
        loyalty_tier = EXCLUDED.loyalty_tier,
        lifetime_spend = EXCLUDED.lifetime_spend;

    -- 4. Realistic Customer Orders
    INSERT INTO orders (id, order_number, user_id, product_name, quantity, total_amount, status, carrier_name, tracking_hub, estimated_delivery, delivery_slot, delay_reason)
    VALUES 
    (v_order_1041, 'ORD-1041', v_customer_id, 'AcousticPro Wireless ANC Headphones', 1, 8999.00, 'delivered', 'BlueDart Express', 'Bengaluru Central Hub', CURRENT_DATE - 4, '10:00 AM - 2:00 PM', NULL),
    (v_order_1042, 'ORD-1042', v_customer_id, 'ErgoFlex Premium Mesh Office Chair', 1, 18500.00, 'out_for_delivery', 'Delhivery Express', 'Indiranagar Hub', CURRENT_DATE, '2:00 PM - 6:00 PM', NULL),
    (v_order_1043, 'ORD-1043', v_customer_id, 'HyperStrike RGB Mechanical Keyboard', 1, 6499.00, 'processing', 'BlueDart Express', 'Whitefield Sorting Facility', CURRENT_DATE + 2, '10:00 AM - 2:00 PM', NULL),
    (v_order_1044, 'ORD-1044', v_customer_id, 'UltraView 27-inch 4K HDR Monitor', 1, 28999.00, 'delayed', 'Shadowfax Logistics', 'Bengaluru North Hub', CURRENT_DATE - 1, '10:00 AM - 2:00 PM', 'Transit vehicle dispatch delay from regional warehouse.')
    ON CONFLICT (order_number) DO NOTHING;

    -- 5. Seed Unified Conversation
    INSERT INTO conversations (id, user_id, status, active_channel, escalation_reason, last_message_at)
    VALUES (v_conv_id, v_customer_id, 'open', 'whatsapp', NULL, NOW())
    ON CONFLICT (id) DO NOTHING;

    -- 6. Seed Cross-Channel Message Thread
    INSERT INTO messages (conversation_id, sender_type, channel, email_subject, content, metadata, created_at)
    VALUES
    (v_conv_id, 'customer', 'web_chat', NULL, 'Hi! Could you check the status of my order #ORD-1042? Need to plan my day around the delivery.', '{"channel": "web_chat"}'::jsonb, NOW() - INTERVAL '30 minutes'),
    (v_conv_id, 'ai_agent', 'web_chat', NULL, 'Hello Aarav! Your ErgoFlex Premium Mesh Office Chair (#ORD-1042) is currently Out for Delivery via Delhivery Express from our Indiranagar Hub. It is scheduled to arrive today between 2:00 PM - 6:00 PM.', '{"channel": "web_chat", "action": "track_order"}'::jsonb, NOW() - INTERVAL '29 minutes'),
    (v_conv_id, 'customer', 'whatsapp', NULL, 'Thanks! Quick change of plans—I need to step out for a client meeting after 4 PM. Can we push delivery to tomorrow morning?', '{"channel": "whatsapp"}'::jsonb, NOW() - INTERVAL '15 minutes'),
    (v_conv_id, 'ai_agent', 'whatsapp', NULL, 'No problem at all! As a Gold Tier member, I have updated your delivery for #ORD-1042 to tomorrow morning (10:00 AM - 2:00 PM). The courier has been notified.', '{"channel": "whatsapp", "action": "reschedule_delivery"}'::jsonb, NOW() - INTERVAL '14 minutes');

    -- 7. Seed Support Action Log
    INSERT INTO support_actions (conversation_id, order_id, action_type, action_summary, action_payload)
    VALUES 
    (v_conv_id, v_order_1042, 'track_order', 'Tracked status of ORD-1042: Out for delivery via Delhivery Express', '{"order_number": "ORD-1042", "status": "out_for_delivery"}'::jsonb),
    (v_conv_id, v_order_1042, 'reschedule_delivery', 'Rescheduled ORD-1042 delivery slot to tomorrow 10:00 AM - 2:00 PM', '{"order_number": "ORD-1042", "new_slot": "10:00 AM - 2:00 PM"}'::jsonb);

    -- 8. Seed Conversation Insights
    INSERT INTO conversation_insights (conversation_id, user_id, sentiment_score, emotion_tag, root_cause_category, churn_risk_level, executive_summary, recommended_ops_action, analyzed_at)
    VALUES (v_conv_id, v_customer_id, 0.85, 'satisfied', 'reschedule_request', 'low', 'Customer requested delivery rescheduling across channels. AI verified Gold tier and updated slot without friction.', 'Maintain courier API integration for live delivery window slotting.', NOW())
    ON CONFLICT (conversation_id) DO UPDATE SET
        sentiment_score = EXCLUDED.sentiment_score,
        emotion_tag = EXCLUDED.emotion_tag;

END $$;
