import bcrypt from 'bcryptjs';
import pool from './pool.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

export async function seedDatabase(force = false) {
  console.log('🌱 [SEED]: Checking if database requires seeding...');
  const client = await pool.connect();

  try {
    // Check if demo customer already exists
    const existingCustomer = await client.query(
      'SELECT id FROM users WHERE email = $1',
      ['aarav@demo.com']
    );

    if (existingCustomer.rows.length > 0 && !force) {
      console.log('ℹ️  [SEED]: Database already contains demo data. Skipping seeding.');
      return;
    }

    console.log('🚀 [SEED]: Seeding initial demo users, profiles, orders, conversations, and analytics insights...');

    await client.query('BEGIN');

    // 1. Password Hashes
    const customerPasswordHash = await bcrypt.hash('Demo@123', 10);
    const adminPasswordHash = await bcrypt.hash('Admin@123', 10);

    // 2. Insert Users
    const userRes = await client.query(
      `INSERT INTO users (full_name, email, password_hash, role)
       VALUES 
       ($1, $2, $3, 'customer'),
       ($4, $5, $6, 'admin')
       ON CONFLICT (email) DO UPDATE 
       SET full_name = EXCLUDED.full_name, password_hash = EXCLUDED.password_hash
       RETURNING id, email, role`,
      [
        'Aarav Sharma', 'aarav@demo.com', customerPasswordHash,
        'Priya Iyer (CX Lead)', 'admin@omnipulse.ai', adminPasswordHash
      ]
    );

    const customerUser = userRes.rows.find(r => r.email === 'aarav@demo.com');
    const adminUser = userRes.rows.find(r => r.email === 'admin@omnipulse.ai');

    const customerId = customerUser ? customerUser.id : (await client.query("SELECT id FROM users WHERE email='aarav@demo.com'")).rows[0].id;
    const adminId = adminUser ? adminUser.id : (await client.query("SELECT id FROM users WHERE email='admin@omnipulse.ai'")).rows[0].id;

    // 3. Customer Profile
    await client.query(
      `INSERT INTO customer_profiles (user_id, loyalty_tier, lifetime_spend, goodwill_credits, preferred_channel, phone_number, city, persona_notes)
       VALUES ($1, 'Gold', 48200.00, 250.00, 'whatsapp', '+91 98765 43210', 'Bengaluru', 'High-value customer in tech sector. Values prompt weekend delivery. Sensitive to courier delays.')
       ON CONFLICT (user_id) DO UPDATE 
       SET loyalty_tier = EXCLUDED.loyalty_tier, lifetime_spend = EXCLUDED.lifetime_spend, goodwill_credits = EXCLUDED.goodwill_credits`,
      [customerId]
    );

    // 4. Realistic Customer Orders
    const ordersData = [
      {
        order_number: 'ORD-1041',
        product_name: 'AcousticPro Wireless ANC Headphones',
        quantity: 1,
        total_amount: 8999.00,
        status: 'delivered',
        carrier_name: 'BlueDart Express',
        tracking_hub: 'Bengaluru Central Hub',
        estimated_delivery: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        delivery_slot: '10:00 AM - 2:00 PM',
        delay_reason: null
      },
      {
        order_number: 'ORD-1042',
        product_name: 'ErgoFlex Premium Mesh Office Chair',
        quantity: 1,
        total_amount: 18500.00,
        status: 'out_for_delivery',
        carrier_name: 'Delhivery Express',
        tracking_hub: 'Indiranagar Local Hub',
        estimated_delivery: new Date().toISOString().split('T')[0],
        delivery_slot: '2:00 PM - 6:00 PM',
        delay_reason: null
      },
      {
        order_number: 'ORD-1043',
        product_name: 'HyperStrike RGB Mechanical Keyboard',
        quantity: 1,
        total_amount: 6499.00,
        status: 'processing',
        carrier_name: 'BlueDart Express',
        tracking_hub: 'Whitefield Sorting Facility',
        estimated_delivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        delivery_slot: '10:00 AM - 2:00 PM',
        delay_reason: null
      },
      {
        order_number: 'ORD-1044',
        product_name: 'UltraView 27-inch 4K HDR Monitor',
        quantity: 1,
        total_amount: 28999.00,
        status: 'delayed',
        carrier_name: 'Shadowfax Logistics',
        tracking_hub: 'Bengaluru North Hub',
        estimated_delivery: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        delivery_slot: '10:00 AM - 2:00 PM',
        delay_reason: 'Interstate transit vehicle breakdown near Hosur highway warehouse.'
      }
    ];

    const orderMap = {};
    for (const o of ordersData) {
      const insertedOrder = await client.query(
        `INSERT INTO orders 
         (order_number, user_id, product_name, quantity, total_amount, status, carrier_name, tracking_hub, estimated_delivery, delivery_slot, delay_reason)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (order_number) DO UPDATE
         SET status = EXCLUDED.status, tracking_hub = EXCLUDED.tracking_hub, delay_reason = EXCLUDED.delay_reason
         RETURNING id, order_number`,
        [
          o.order_number, customerId, o.product_name, o.quantity, o.total_amount,
          o.status, o.carrier_name, o.tracking_hub, o.estimated_delivery, o.delivery_slot, o.delay_reason
        ]
      );
      orderMap[o.order_number] = insertedOrder.rows[0].id;
    }

    // 5. Seed Unified Conversation
    const convRes = await client.query(
      `INSERT INTO conversations (user_id, status, active_channel, escalation_reason, last_message_at)
       VALUES ($1, 'open', 'whatsapp', NULL, NOW())
       RETURNING id`,
      [customerId]
    );
    const convId = convRes.rows[0].id;

    // 6. Cross-Channel Messages
    const messages = [
      {
        sender_type: 'customer',
        channel: 'web_chat',
        email_subject: null,
        content: 'Hi! Could you check the status of my order #ORD-1042? Need to plan my day around the delivery.',
        metadata: { channel: 'web_chat' },
        timeOffset: -35 * 60 * 1000
      },
      {
        sender_type: 'ai_agent',
        channel: 'web_chat',
        email_subject: null,
        content: 'Hello Aarav! Your ErgoFlex Premium Mesh Office Chair (#ORD-1042) is currently Out for Delivery via Delhivery Express from our Indiranagar Hub. It is scheduled to arrive today between 2:00 PM - 6:00 PM.',
        metadata: { channel: 'web_chat', action: 'track_order', order_number: 'ORD-1042' },
        timeOffset: -34 * 60 * 1000
      },
      {
        sender_type: 'customer',
        channel: 'whatsapp',
        email_subject: null,
        content: 'Thanks! Quick change of plans—I have to step out for a meeting after 4 PM. Can we move the delivery to tomorrow morning?',
        metadata: { channel: 'whatsapp' },
        timeOffset: -20 * 60 * 1000
      },
      {
        sender_type: 'ai_agent',
        channel: 'whatsapp',
        email_subject: null,
        content: 'No problem at all! As a valued Gold Tier member, I have updated your delivery for #ORD-1042 to tomorrow morning (10:00 AM - 2:00 PM). The courier has been notified with high priority.',
        metadata: { channel: 'whatsapp', action: 'reschedule_delivery', order_number: 'ORD-1042' },
        timeOffset: -19 * 60 * 1000
      }
    ];

    for (const m of messages) {
      await client.query(
        `INSERT INTO messages (conversation_id, sender_type, channel, email_subject, content, metadata, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          convId, m.sender_type, m.channel, m.email_subject, m.content,
          JSON.stringify(m.metadata),
          new Date(Date.now() + m.timeOffset)
        ]
      );
    }

    // 7. Support Actions Log
    await client.query(
      `INSERT INTO support_actions (conversation_id, order_id, action_type, action_summary, action_payload, created_at)
       VALUES 
       ($1, $2, 'track_order', 'Real-time carrier tracking for ORD-1042: Out for delivery via Delhivery Express', '{"order_number": "ORD-1042", "carrier": "Delhivery Express", "hub": "Indiranagar Local Hub"}'::jsonb, NOW() - INTERVAL '34 minutes'),
       ($1, $2, 'reschedule_delivery', 'Rescheduled ORD-1042 to tomorrow slot 10:00 AM - 2:00 PM', '{"order_number": "ORD-1042", "new_slot": "10:00 AM - 2:00 PM"}'::jsonb, NOW() - INTERVAL '19 minutes')`,
      [convId, orderMap['ORD-1042']]
    );

    // 8. Conversation Insights
    await client.query(
      `INSERT INTO conversation_insights (conversation_id, user_id, sentiment_score, emotion_tag, root_cause_category, churn_risk_level, executive_summary, recommended_ops_action, analyzed_at)
       VALUES ($1, $2, 0.85, 'satisfied', 'reschedule_request', 'low', 'Customer requested delivery rescheduling across channels. AI verified Gold tier and updated slot without friction.', 'Maintain courier API integration for live delivery window slotting.', NOW())
       ON CONFLICT (conversation_id) DO UPDATE SET
       sentiment_score = EXCLUDED.sentiment_score,
       emotion_tag = EXCLUDED.emotion_tag,
       root_cause_category = EXCLUDED.root_cause_category`,
      [convId, customerId]
    );

    // 9. Add another escalated customer conversation for the Escalations queue demonstration
    const escalatedCustomerRes = await client.query(
      `INSERT INTO users (full_name, email, password_hash, role)
       VALUES ('Neha Verma', 'neha.verma@example.com', $1, 'customer')
       ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
       RETURNING id`,
      [customerPasswordHash]
    );
    const nehaId = escalatedCustomerRes.rows[0].id;

    await client.query(
      `INSERT INTO customer_profiles (user_id, loyalty_tier, lifetime_spend, goodwill_credits, preferred_channel, phone_number, city, persona_notes)
       VALUES ($1, 'VIP', 94000.00, 500.00, 'email', '+91 91234 56789', 'Mumbai', 'VIP enterprise client. Extremely time-sensitive deliveries.')
       ON CONFLICT (user_id) DO NOTHING`,
      [nehaId]
    );

    const nehaOrderRes = await client.query(
      `INSERT INTO orders (order_number, user_id, product_name, quantity, total_amount, status, carrier_name, tracking_hub, estimated_delivery, delivery_slot, delay_reason)
       VALUES ('ORD-1039', $1, 'UltraBook Studio Pro 16', 1, 149999.00, 'delayed', 'BlueDart Express', 'Mumbai Cargo Terminal', CURRENT_DATE - 3, '10:00 AM - 2:00 PM', 'Severe transit logistics blockage at terminal')
       ON CONFLICT (order_number) DO UPDATE SET status = 'delayed'
       RETURNING id`,
      [nehaId]
    );
    const nehaOrderId = nehaOrderRes.rows[0].id;

    const nehaConvRes = await client.query(
      `INSERT INTO conversations (user_id, status, active_channel, escalation_reason, last_message_at)
       VALUES ($1, 'escalated', 'email', 'Customer expressed critical urgency for delayed high-value order ORD-1039', NOW() - INTERVAL '2 hours')
       RETURNING id`,
      [nehaId]
    );
    const nehaConvId = nehaConvRes.rows[0].id;

    await client.query(
      `INSERT INTO messages (conversation_id, sender_type, channel, email_subject, content, metadata, created_at)
       VALUES 
       ($1, 'customer', 'email', 'Urgent: ORD-1039 3 days overdue without tracking update', 'My workstation order ORD-1039 is delayed by 3 days with no updates. This is halting my entire team operations. I need immediate resolution or cancel and refund.', '{"channel": "email"}'::jsonb, NOW() - INTERVAL '2 hours'),
       ($1, 'ai_agent', 'email', 'Re: Urgent: ORD-1039 3 days overdue', 'Dear Neha, I sincerely apologize for the severe delay with your UltraBook Studio Pro 16 (#ORD-1039). I have flagged this directly to our Executive Logistics Priority team as a critical escalation.', '{"channel": "email", "action": "escalate_to_human"}'::jsonb, NOW() - INTERVAL '1 hour 55 minutes')`,
      [nehaConvId]
    );

    await client.query(
      `INSERT INTO support_actions (conversation_id, order_id, action_type, action_summary, action_payload)
       VALUES ($1, $2, 'escalate_to_human', 'Escalated to CX Specialist due to critical churn risk and VIP tier order ORD-1039 delay', '{"order_number": "ORD-1039", "reason": "VIP customer 3 days delay"}'::jsonb)`,
      [nehaConvId, nehaOrderId]
    );

    await client.query(
      `INSERT INTO conversation_insights (conversation_id, user_id, sentiment_score, emotion_tag, root_cause_category, churn_risk_level, executive_summary, recommended_ops_action, analyzed_at)
       VALUES ($1, $2, -0.85, 'angry', 'delivery_delay', 'critical', 'VIP client experiencing 3-day terminal delay on ₹1,50,000 workstation. High risk of contract loss.', 'Deploy dedicated carrier concierge to Mumbai Cargo Terminal; offer immediate complimentary express courier.', NOW() - INTERVAL '1 hour 50 minutes')
       ON CONFLICT (conversation_id) DO NOTHING`,
      [nehaConvId, nehaId]
    );

    await client.query('COMMIT');
    console.log('✅ [SEED]: Database seeded successfully with demo accounts, orders, and omnichannel conversations.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ [SEED ERROR]: Failed to seed database:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

// Allow direct CLI execution: node src/db/seed.js
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedDatabase(true)
    .then(() => {
      console.log('Seeding process completed.');
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
