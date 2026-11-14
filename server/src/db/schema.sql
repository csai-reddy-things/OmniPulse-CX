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

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_insights_churn_risk ON conversation_insights(churn_risk_level);
