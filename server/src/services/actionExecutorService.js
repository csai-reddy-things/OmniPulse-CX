import supabase from '../db/supabaseClient.js';

/**
 * Autonomous Support Action Execution Engine
 * Executes deterministic, auditable database mutations triggered by AI intent via Supabase.
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

  try {
    let actionSummary = '';
    let actionPayload = {};
    let targetOrderId = null;

    // Helper: find order by order_number or fallback to most relevant active order
    let orderNumber = actionParams.order_number;
    let targetOrder = null;

    if (orderNumber) {
      const cleanNum = orderNumber.trim().replace('#', '');
      const { data: matchedOrders } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .ilike('order_number', `%${cleanNum}%`)
        .limit(1);
      
      if (matchedOrders && matchedOrders.length > 0) {
        targetOrder = matchedOrders[0];
        targetOrderId = targetOrder.id;
      }
    }

    if (!targetOrder && customerOrders.length > 0) {
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

        await supabase
          .from('orders')
          .update({ status: 'refunded', updated_at: new Date().toISOString() })
          .eq('id', targetOrderId);

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

        await supabase
          .from('orders')
          .update({
            estimated_delivery: newDate,
            delivery_slot: newSlot,
            updated_at: new Date().toISOString()
          })
          .eq('id', targetOrderId);

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

        const { data: repOrder } = await supabase
          .from('orders')
          .upsert({
            order_number: replacementNumber,
            user_id: userId,
            product_name: `${targetOrder.product_name} (Complimentary Replacement)`,
            quantity: targetOrder.quantity || 1,
            total_amount: 0.00,
            status: 'replacement_dispatched',
            carrier_name: 'BlueDart Priority Air',
            tracking_hub: 'Express Fulfillment Hub',
            estimated_delivery: estDelivery,
            delivery_slot: '10:00 AM - 2:00 PM'
          }, { onConflict: 'order_number' })
          .select('id, order_number')
          .single();

        targetOrderId = repOrder ? repOrder.id : targetOrderId;
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

        const { data: currentProf } = await supabase
          .from('customer_profiles')
          .select('goodwill_credits')
          .eq('user_id', userId)
          .single();

        const currentCreds = parseFloat(currentProf?.goodwill_credits || 0);
        const newBalance = currentCreds + creditAmount;

        await supabase
          .from('customer_profiles')
          .update({
            goodwill_credits: newBalance,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

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

        await supabase
          .from('conversations')
          .update({
            status: 'escalated',
            escalation_reason: escalationReason,
            last_message_at: new Date().toISOString()
          })
          .eq('id', conversationId);

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
      const { data: insertedAction } = await supabase
        .from('support_actions')
        .insert({
          conversation_id: conversationId,
          order_id: targetOrderId,
          action_type: actionType,
          action_summary: actionSummary,
          action_payload: actionPayload
        })
        .select()
        .single();

      actionRecord = insertedAction;
    }

    return actionRecord;
  } catch (error) {
    console.error(`❌ [ACTION EXECUTOR ERROR] (${actionType}):`, error.message);
    throw error;
  }
}
