import pool from '../db/pool.js';

/**
 * Autonomous Support Action Execution Engine
 * Executes deterministic, auditable database mutations triggered by AI intent.
 */
export async function executeSupportAction({
  actionType,
  actionParams = {},
  userId,
  conversationId,
  customerOrders = []
}) {
  if (!actionType || actionType === 'none') {
    return null;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let actionSummary = '';
    let actionPayload = {};
    let targetOrderId = null;

    // Helper: find order by order_number or fallback to most relevant active order
    let orderNumber = actionParams.order_number;
    let targetOrder = null;

    if (orderNumber) {
      const orderRes = await client.query(
        'SELECT * FROM orders WHERE user_id = $1 AND (order_number ILIKE $2 OR order_number ILIKE $3) LIMIT 1',
        [userId, orderNumber.trim(), `%${orderNumber.trim().replace('#', '')}%`]
      );
      if (orderRes.rows.length > 0) {
        targetOrder = orderRes.rows[0];
        targetOrderId = targetOrder.id;
      }
    }

    if (!targetOrder && customerOrders.length > 0) {
      // Pick the most recent non-delivered order, or the latest order
      targetOrder = customerOrders.find(o => ['delayed', 'out_for_delivery', 'processing', 'shipped'].includes(o.status)) || customerOrders[0];
      targetOrderId = targetOrder.id;
      orderNumber = targetOrder.order_number;
    }

    switch (actionType) {
      case 'track_order': {
        if (!targetOrder) {
          actionSummary = 'Track Order: No matching active order found.';
          actionPayload = { status: 'not_found' };
          break;
        }
        actionSummary = `Carrier Status verified for ${targetOrder.order_number}: ${targetOrder.status.toUpperCase()} via ${targetOrder.carrier_name}. Location: ${targetOrder.tracking_hub}.`;
        actionPayload = {
          order_number: targetOrder.order_number,
          product_name: targetOrder.product_name,
          status: targetOrder.status,
          carrier_name: targetOrder.carrier_name,
          tracking_hub: targetOrder.tracking_hub,
          estimated_delivery: targetOrder.estimated_delivery,
          delivery_slot: targetOrder.delivery_slot,
          delay_reason: targetOrder.delay_reason
        };
        break;
      }

      case 'issue_instant_refund': {
        if (!targetOrder) {
          throw new Error('Cannot issue refund: Order not found in customer profile.');
        }

        const refundAmount = targetOrder.total_amount;
        const refundReason = actionParams.reason || 'Customer satisfaction resolution for logistics delay/issue';

        await client.query(
          `UPDATE orders 
           SET status = 'refunded', updated_at = NOW() 
           WHERE id = $1`,
          [targetOrderId]
        );

        actionSummary = `Instant full refund of ₹${refundAmount} processed for order ${targetOrder.order_number}.`;
        actionPayload = {
          order_number: targetOrder.order_number,
          product_name: targetOrder.product_name,
          refund_amount: refundAmount,
          currency: 'INR',
          status: 'refunded',
          refund_tx_id: `REF-${Date.now().toString().slice(-6)}`,
          reason: refundReason
        };
        break;
      }

      case 'reschedule_delivery': {
        if (!targetOrder) {
          throw new Error('Cannot reschedule: Order not found.');
        }

        const newDate = actionParams.new_delivery_date || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const newSlot = actionParams.new_delivery_slot || '10:00 AM - 2:00 PM';

        await client.query(
          `UPDATE orders 
           SET estimated_delivery = $1, delivery_slot = $2, updated_at = NOW() 
           WHERE id = $3`,
          [newDate, newSlot, targetOrderId]
        );

        actionSummary = `Delivery for order ${targetOrder.order_number} successfully rescheduled to ${newDate} (${newSlot}).`;
        actionPayload = {
          order_number: targetOrder.order_number,
          product_name: targetOrder.product_name,
          carrier_name: targetOrder.carrier_name,
          new_delivery_date: newDate,
          new_delivery_slot: newSlot
        };
        break;
      }

      case 'create_replacement_order': {
        if (!targetOrder) {
          throw new Error('Cannot create replacement: Original order not found.');
        }

        const replacementNumber = `${targetOrder.order_number}-REP`;
        const estDelivery = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        // Insert replacement order with 0 amount
        const repRes = await client.query(
          `INSERT INTO orders 
           (order_number, user_id, product_name, quantity, total_amount, status, carrier_name, tracking_hub, estimated_delivery, delivery_slot)
           VALUES ($1, $2, $3, $4, 0.00, 'replacement_dispatched', 'BlueDart Priority Air', 'Express Fulfillment Hub', $5, '10:00 AM - 2:00 PM')
           ON CONFLICT (order_number) DO UPDATE
           SET status = 'replacement_dispatched'
           RETURNING id, order_number`,
          [
            replacementNumber,
            userId,
            `${targetOrder.product_name} (Complimentary Replacement)`,
            targetOrder.quantity,
            estDelivery
          ]
        );

        targetOrderId = repRes.rows[0].id;
        actionSummary = `Complimentary replacement order ${replacementNumber} dispatched at ₹0.00 cost.`;
        actionPayload = {
          original_order_number: targetOrder.order_number,
          replacement_order_number: replacementNumber,
          product_name: targetOrder.product_name,
          status: 'replacement_dispatched',
          estimated_delivery: estDelivery
        };
        break;
      }

      case 'apply_goodwill_credit': {
        const creditAmount = actionParams.credit_amount || 250.00;

        const profileRes = await client.query(
          `UPDATE customer_profiles 
           SET goodwill_credits = goodwill_credits + $1, updated_at = NOW() 
           WHERE user_id = $2
           RETURNING goodwill_credits`,
          [creditAmount, userId]
        );

        const newBalance = profileRes.rows[0]?.goodwill_credits || creditAmount;
        actionSummary = `Applied ₹${creditAmount} retention goodwill credit to customer wallet. New balance: ₹${newBalance}.`;
        actionPayload = {
          credit_amount: creditAmount,
          new_balance: newBalance,
          applied_to: userId
        };
        break;
      }

      case 'escalate_to_human': {
        const escalationReason = actionParams.reason || 'AI Escalate: Customer requested senior human specialist';

        await client.query(
          `UPDATE conversations 
           SET status = 'escalated', escalation_reason = $1, last_message_at = NOW() 
           WHERE id = $2`,
          [escalationReason, conversationId]
        );

        actionSummary = `Conversation escalated to Executive CX Specialist. Reason: "${escalationReason}".`;
        actionPayload = {
          priority: 'critical',
          escalation_reason: escalationReason,
          routed_to: 'Tier 3 VIP CX Queue'
        };
        break;
      }

      default:
        break;
    }

    // Insert into support_actions audit table
    let actionRecord = null;
    if (actionSummary) {
      const inserted = await client.query(
        `INSERT INTO support_actions 
         (conversation_id, order_id, action_type, action_summary, action_payload)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [conversationId, targetOrderId, actionType, actionSummary, JSON.stringify(actionPayload)]
      );
      actionRecord = inserted.rows[0];
    }

    await client.query('COMMIT');
    return actionRecord;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`❌ [ACTION EXECUTOR ERROR] (${actionType}):`, error.message);
    throw error;
  } finally {
    client.release();
  }
}
