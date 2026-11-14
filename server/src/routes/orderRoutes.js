import express from 'express';
import pool from '../db/pool.js';
import { authenticateToken } from '../middleware/auth.js';
import { generateProactiveRetentionMessage } from '../services/geminiService.js';

const router = express.Router();

/**
 * GET /api/orders
 * Fetch customer orders
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const ordersRes = await pool.query(
      `SELECT * FROM orders 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json(ordersRes.rows);
  } catch (error) {
    console.error('Fetch orders error:', error);
    res.status(500).json({ error: 'Failed to retrieve orders.' });
  }
});

/**
 * POST /api/orders/:id/simulate-delay
 * Proactive Retention & Delay Simulator
 */
router.post('/:id/simulate-delay', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Fetch order
    const orderRes = await client.query(
      'SELECT * FROM orders WHERE id = $1 AND (user_id = $2 OR $3 = $4)',
      [id, req.user.id, req.user.role, 'admin']
    );

    if (orderRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Order not found or unauthorized.' });
    }

    const order = orderRes.rows[0];
    const customerId = order.user_id;
    const delayReason = 'Interstate freight line blockage and severe hub transit congestion';

    // 2. Mark order delayed in DB
    const updatedOrderRes = await client.query(
      `UPDATE orders 
       SET status = 'delayed', delay_reason = $1, updated_at = NOW() 
       WHERE id = $2 
       RETURNING *`,
      [delayReason, id]
    );
    const updatedOrder = updatedOrderRes.rows[0];

    // 3. Fetch customer profile
    const profileRes = await client.query(
      `SELECT p.*, u.full_name, u.email 
       FROM customer_profiles p 
       JOIN users u ON u.id = p.user_id 
       WHERE p.user_id = $1`,
      [customerId]
    );
    const profile = profileRes.rows[0] || {
      full_name: 'Customer',
      loyalty_tier: 'Standard',
      preferred_channel: 'whatsapp',
      goodwill_credits: 0
    };

    // 4. Generate AI Proactive Retention Outreach via Gemini
    const proactiveResult = await generateProactiveRetentionMessage({
      customerProfile: profile,
      order: updatedOrder,
      delayReason
    });

    // 5. Apply goodwill wallet credit
    if (proactiveResult.offered_credit > 0) {
      await client.query(
        `UPDATE customer_profiles 
         SET goodwill_credits = goodwill_credits + $1, updated_at = NOW() 
         WHERE user_id = $2`,
        [proactiveResult.offered_credit, customerId]
      );
    }

    // 6. Find or create unified conversation
    let convRes = await client.query(
      `SELECT id FROM conversations 
       WHERE user_id = $1 
       ORDER BY last_message_at DESC 
       LIMIT 1`,
      [customerId]
    );

    let convId;
    if (convRes.rows.length === 0) {
      const newConv = await client.query(
        `INSERT INTO conversations (user_id, status, active_channel, last_message_at) 
         VALUES ($1, 'open', $2, NOW()) 
         RETURNING id`,
        [customerId, profile.preferred_channel || 'whatsapp']
      );
      convId = newConv.rows[0].id;
    } else {
      convId = convRes.rows[0].id;
      await client.query(
        `UPDATE conversations 
         SET last_message_at = NOW(), active_channel = $1 
         WHERE id = $2`,
        [profile.preferred_channel || 'whatsapp', convId]
      );
    }

    // 7. Insert proactive message into thread
    const msgRes = await client.query(
      `INSERT INTO messages 
       (conversation_id, sender_type, channel, email_subject, content, metadata, created_at)
       VALUES ($1, 'system_proactive', $2, $3, $4, $5, NOW())
       RETURNING *`,
      [
        convId,
        profile.preferred_channel || 'whatsapp',
        `Important Update: Delivery Status for #${updatedOrder.order_number}`,
        proactiveResult.proactive_message,
        JSON.stringify({
          type: 'proactive_retention_delay',
          order_number: updatedOrder.order_number,
          offered_credit: proactiveResult.offered_credit,
          summary_badge: proactiveResult.summary_badge
        })
      ]
    );
    const savedMessage = msgRes.rows[0];

    // 8. Log support action
    const actionSummary = `Proactive carrier delay outreach triggered for ${updatedOrder.order_number}. Credited ₹${proactiveResult.offered_credit} goodwill retention incentive.`;
    const actionRes = await client.query(
      `INSERT INTO support_actions 
       (conversation_id, order_id, action_type, action_summary, action_payload)
       VALUES ($1, $2, 'apply_goodwill_credit', $3, $4)
       RETURNING *`,
      [
        convId,
        id,
        actionSummary,
        JSON.stringify({
          order_number: updatedOrder.order_number,
          credit_amount: proactiveResult.offered_credit,
          badge: proactiveResult.summary_badge
        })
      ]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      order: updatedOrder,
      proactive_message: savedMessage,
      action: actionRes.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Simulate delay error:', error);
    res.status(500).json({ error: 'Failed to simulate carrier delay.' });
  } finally {
    client.release();
  }
});

export default router;
