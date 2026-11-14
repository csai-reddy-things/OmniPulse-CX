import express from 'express';
import supabase from '../db/supabaseClient.js';
import { authenticateToken } from '../middleware/auth.js';
import { generateProactiveRetentionMessage } from '../services/geminiService.js';

const router = express.Router();

/**
 * GET /api/orders
 * Fetch customer orders
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(orders || []);
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

  try {
    // 1. Fetch order
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (orderErr || !order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to modify this order.' });
    }

    const customerId = order.user_id;
    const delayReason = 'Interstate freight line blockage and severe hub transit congestion';

    // 2. Mark order delayed in DB
    const { data: updatedOrder, error: updateErr } = await supabase
      .from('orders')
      .update({
        status: 'delayed',
        delay_reason: delayReason,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    // 3. Fetch customer profile
    const { data: profile } = await supabase
      .from('customer_profiles')
      .select('*, users(full_name, email)')
      .eq('user_id', customerId)
      .maybeSingle();

    const customerProfile = {
      full_name: profile?.users?.full_name || 'Valued Customer',
      loyalty_tier: profile?.loyalty_tier || 'Standard',
      preferred_channel: profile?.preferred_channel || 'whatsapp',
      goodwill_credits: parseFloat(profile?.goodwill_credits || 0)
    };

    // 4. Generate AI Proactive Retention Outreach via Gemini
    const proactiveResult = await generateProactiveRetentionMessage({
      customerProfile,
      order: updatedOrder,
      delayReason
    });

    // 5. Apply goodwill wallet credit
    if (proactiveResult.offered_credit > 0) {
      await supabase
        .from('customer_profiles')
        .update({
          goodwill_credits: customerProfile.goodwill_credits + proactiveResult.offered_credit,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', customerId);
    }

    // 6. Find or create unified conversation
    const { data: existingConvs } = await supabase
      .from('conversations')
      .select('id')
      .eq('user_id', customerId)
      .order('last_message_at', { ascending: false })
      .limit(1);

    let convId;
    if (!existingConvs || existingConvs.length === 0) {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({
          user_id: customerId,
          status: 'open',
          active_channel: customerProfile.preferred_channel,
          last_message_at: new Date().toISOString()
        })
        .select('id')
        .single();
      convId = newConv.id;
    } else {
      convId = existingConvs[0].id;
      await supabase
        .from('conversations')
        .update({
          last_message_at: new Date().toISOString(),
          active_channel: customerProfile.preferred_channel
        })
        .eq('id', convId);
    }

    // 7. Insert proactive message into thread
    const { data: savedMessage, error: msgErr } = await supabase
      .from('messages')
      .insert({
        conversation_id: convId,
        sender_type: 'system_proactive',
        channel: customerProfile.preferred_channel,
        email_subject: `Important Update: Delivery Status for #${updatedOrder.order_number}`,
        content: proactiveResult.proactive_message,
        metadata: {
          type: 'proactive_retention_delay',
          order_number: updatedOrder.order_number,
          offered_credit: proactiveResult.offered_credit,
          summary_badge: proactiveResult.summary_badge
        }
      })
      .select()
      .single();

    if (msgErr) throw msgErr;

    // 8. Log support action
    const actionSummary = `Proactive carrier delay outreach triggered for ${updatedOrder.order_number}. Credited ₹${proactiveResult.offered_credit} goodwill retention incentive.`;
    const { data: actionRecord } = await supabase
      .from('support_actions')
      .insert({
        conversation_id: convId,
        order_id: id,
        action_type: 'apply_goodwill_credit',
        action_summary: actionSummary,
        action_payload: {
          order_number: updatedOrder.order_number,
          credit_amount: proactiveResult.offered_credit,
          badge: proactiveResult.summary_badge
        }
      })
      .select()
      .single();

    res.json({
      success: true,
      order: updatedOrder,
      proactive_message: savedMessage,
      action: actionRecord
    });
  } catch (error) {
    console.error('Simulate delay error:', error);
    res.status(500).json({ error: 'Failed to simulate carrier delay.' });
  }
});

export default router;
