import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import {
  aiActionResponseSchema,
  aiInsightResponseSchema,
  proactiveRetentionSchema
} from '../validators/schemas.js';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn('⚠️ [GEMINI WARNING]: GEMINI_API_KEY is not set in environment variables. Heuristic engine will be active as fallback.');
}

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

const SYSTEM_INSTRUCTION = `You are OmniPulse AI, an empathetic, hyper-competent Omnichannel Customer Experience Specialist for a modern D2C & quick-commerce brand.

CORE OPERATING PRINCIPLES:
1. OMNICHANNEL CONTINUITY: The customer may switch seamlessly between Web Chat, WhatsApp, and Email within the same thread. Never ask them to repeat information already shared in earlier messages on another channel. Acknowledge channel transitions naturally when helpful.
2. CHANNEL-ADAPTIVE FORMATTING:
   - If channel is 'whatsapp': Keep replies crisp, warm, scannable, and conversational (use short paragraphs and occasional tasteful emojis).
   - If channel is 'web_chat': Be clear, structured, and helpful with concise bullet points when listing order details.
   - If channel is 'email': Use a polite, structured email tone with a clear greeting and sign-off.
3. PERSONALIZATION: Tailor your empathy and resolution generosity to the customer's Loyalty Tier (Standard, Gold, VIP), lifetime spend, and current emotional tone.
4. GROUNDED TRUTH ONLY: Only reference order numbers, statuses, amounts, and delivery slots provided in the injected CUSTOMER & ORDER CONTEXT. Never invent fake orders or policies.
5. AUTONOMOUS ACTION EXECUTION: When a customer asks to track an order, get a refund for a damaged/delayed/wrong item, reschedule delivery, or get a replacement, select the appropriate tool action and populate exact parameters from their order context.
6. HUMAN ESCALATION GUARDRAIL: If the customer expresses extreme anger, threatens legal action/chargebacks, reports repeated unresolved failures, or requests a human manager, set selected_action to 'escalate_to_human' and requires_human_escalation to true.`;

/**
 * Prompt A: Omnichannel Conversational & Autonomous Action Engine
 */
export async function generateOmnichannelResponse({
  customerProfile,
  orders = [],
  recentMessages = [],
  currentMessage,
  currentChannel,
  emailSubject = null
}) {
  const promptContext = `
CUSTOMER PROFILE:
${JSON.stringify(customerProfile, null, 2)}

CUSTOMER RECENT ORDERS:
${JSON.stringify(orders, null, 2)}

RECENT OMNICHANNEL CONVERSATION TRANSCRIPT:
${recentMessages.map(m => `[${m.channel?.toUpperCase()} | ${m.sender_type}]: ${m.content}`).join('\n')}

INCOMING USER MESSAGE:
Channel: ${currentChannel}
${emailSubject ? `Subject: ${emailSubject}\n` : ''}Message: "${currentMessage}"

TASK:
Generate a channel-tailored reply and determine if an autonomous support action should be executed.
Valid actions: 'track_order', 'issue_instant_refund', 'reschedule_delivery', 'create_replacement_order', 'apply_goodwill_credit', 'escalate_to_human', 'none'.

Respond with ONLY valid JSON adhering strictly to:
{
  "reply_text": "...",
  "detected_intent": "...",
  "selected_action": "track_order | issue_instant_refund | reschedule_delivery | create_replacement_order | apply_goodwill_credit | escalate_to_human | none",
  "action_params": {
    "order_number": "...",
    "new_delivery_date": "...",
    "new_delivery_slot": "...",
    "credit_amount": 0,
    "reason": "..."
  },
  "requires_human_escalation": false,
  "escalation_reason": "..."
}
`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: promptContext,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      });

      const parsed = JSON.parse(response.text.trim());
      const validated = aiActionResponseSchema.parse(parsed);
      return validated;
    } catch (err) {
      console.warn('⚠️ [GEMINI API NOTICE]: Gemini call failed or parsing error. Falling back to heuristic engine:', err.message);
    }
  }

  // Heuristic Rule-Based Fallback
  return fallbackActionEngine({
    customerProfile,
    orders,
    currentMessage,
    currentChannel
  });
}

/**
 * Prompt B: Post-Interaction Actionable Insights Extractor
 */
export async function extractConversationInsights({
  messages = [],
  actions = [],
  loyaltyTier = 'Standard'
}) {
  const promptContext = `
LOYALTY TIER: ${loyaltyTier}

FULL CONVERSATION THREAD:
${messages.map(m => `[${m.channel} | ${m.sender_type}]: ${m.content}`).join('\n')}

EXECUTED SUPPORT ACTIONS:
${JSON.stringify(actions, null, 2)}

TASK:
Analyze the customer's emotional sentiment trajectory, root cause, churn risk, executive summary, and operational recommendations.
Allowed emotion_tags: 'delighted', 'satisfied', 'neutral', 'confused', 'frustrated', 'angry'.
Allowed root_cause_categories: 'delivery_delay', 'damaged_item', 'refund_billing', 'wrong_item', 'reschedule_request', 'product_inquiry', 'positive_feedback'.
Allowed churn_risk_levels: 'low', 'medium', 'high', 'critical'.

Respond with ONLY valid JSON adhering strictly to:
{
  "sentiment_score": 0.5,
  "emotion_tag": "satisfied",
  "root_cause_category": "reschedule_request",
  "churn_risk_level": "low",
  "executive_summary": "1-2 sentence executive summary",
  "recommended_ops_action": "Actionable ops fix"
}
`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: promptContext,
        config: {
          systemInstruction: 'You are an Executive Customer Retention & Operational Intelligence Analyst.',
          responseMimeType: 'application/json',
          temperature: 0.1
        }
      });

      const parsed = JSON.parse(response.text.trim());
      const validated = aiInsightResponseSchema.parse(parsed);
      return validated;
    } catch (err) {
      console.warn('⚠️ [GEMINI INSIGHT NOTICE]: Fallback insight generator active:', err.message);
    }
  }

  return fallbackInsightEngine({ messages, actions, loyaltyTier });
}

/**
 * Prompt C: Proactive Retention Outreach Generator
 */
export async function generateProactiveRetentionMessage({
  customerProfile,
  order,
  delayReason
}) {
  const promptContext = `
CUSTOMER PROFILE:
Name: ${customerProfile.full_name || 'Valued Customer'}
Loyalty Tier: ${customerProfile.loyalty_tier || 'Standard'}
Preferred Channel: ${customerProfile.preferred_channel || 'whatsapp'}
Goodwill Balance: ₹${customerProfile.goodwill_credits || 0}

DELAYED ORDER DETAILS:
Order Number: ${order.order_number}
Product: ${order.product_name}
Original ETA: ${order.estimated_delivery} (${order.delivery_slot})
Carrier: ${order.carrier_name}
Delay Reason: ${delayReason || order.delay_reason || 'Transit logistical delay'}

TASK:
Draft an unprompted, proactive retention outreach message for this customer tailored to their preferred channel (${customerProfile.preferred_channel}).
Apologize proactively before they complain, state the issue transparently, and offer a pre-approved goodwill wallet credit of ₹250 ($15 equivalent) or immediate delivery rescheduling.

Respond with ONLY valid JSON:
{
  "proactive_message": "...",
  "offered_credit": 250,
  "summary_badge": "Proactive Delay Retention Credit"
}
`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: promptContext,
        config: {
          systemInstruction: 'You are an elite Proactive Retention and Logistics Empathy Specialist for OmniPulse CX.',
          responseMimeType: 'application/json',
          temperature: 0.3
        }
      });

      const parsed = JSON.parse(response.text.trim());
      const validated = proactiveRetentionSchema.parse(parsed);
      return validated;
    } catch (err) {
      console.warn('⚠️ [GEMINI RETENTION NOTICE]: Fallback proactive retention active:', err.message);
    }
  }

  // Fallback Proactive Generator
  const name = customerProfile.full_name?.split(' ')[0] || 'there';
  const tier = customerProfile.loyalty_tier || 'Standard';
  const ch = customerProfile.preferred_channel || 'whatsapp';

  let proactiveText = '';
  if (ch === 'whatsapp') {
    proactiveText = `Hi ${name} 👋 We noticed a transit delay on your order #${order.order_number} (${order.product_name}) due to: "${delayReason || 'courier transit backlog'}". We value your ${tier} loyalty! We've credited ₹250 goodwill credit to your wallet and expedited delivery to tomorrow morning. Let us know if you need anything else!`;
  } else if (ch === 'email') {
    proactiveText = `Dear ${name},\n\nWe are writing to proactively update you regarding order #${order.order_number} (${order.product_name}). A logistics transit disruption has delayed expected arrival.\n\nAs our ${tier} tier customer, your satisfaction is our priority. We have credited ₹250 to your account and re-routed the package via priority handling.\n\nWarm regards,\nOmniPulse Executive CX Team`;
  } else {
    proactiveText = `Hello ${name}, proactive update: Order #${order.order_number} has encountered a minor delay at the transit hub. We have credited ₹250 to your wallet and prioritized next-day dispatch.`;
  }

  return {
    proactive_message: proactiveText,
    offered_credit: 250,
    summary_badge: 'Proactive Delay Retention Credit'
  };
}

/**
 * Deterministic Heuristic Fallbacks (Zero-failure guarantee)
 */
function fallbackActionEngine({ customerProfile, orders, currentMessage, currentChannel }) {
  const lower = currentMessage.toLowerCase();
  const activeOrder = orders.find(o => ['delayed', 'out_for_delivery', 'processing', 'shipped'].includes(o.status)) || orders[0];
  const matchedOrder = orders.find(o => lower.includes(o.order_number.toLowerCase())) || activeOrder;
  const orderNum = matchedOrder ? matchedOrder.order_number : (orders[0]?.order_number || 'ORD-1042');

  // Check for Human Escalation
  if (lower.includes('human') || lower.includes('agent') || lower.includes('manager') || lower.includes('escalate') || lower.includes('sue') || lower.includes('fraud') || lower.includes('cheat')) {
    return {
      reply_text: currentChannel === 'whatsapp' 
        ? `I understand your frustration completely. I have escalated this conversation to our Senior CX Specialist queue immediately. A team lead will review your full thread.`
        : `I sincerely apologize for the inconvenience. I have routed your ticket to an Executive Human Support Lead who has full context of your account and recent interactions.`,
      detected_intent: 'human_escalation',
      selected_action: 'escalate_to_human',
      action_params: {
        order_number: orderNum,
        reason: 'Customer requested human manager escalation'
      },
      requires_human_escalation: true,
      escalation_reason: 'Customer requested human manager escalation'
    };
  }

  // Check for Refund
  if (lower.includes('refund') || lower.includes('money back') || lower.includes('cancel')) {
    return {
      reply_text: currentChannel === 'whatsapp'
        ? `I have processed a full instant refund for order #${orderNum} back to your original payment method. You'll receive bank confirmation shortly.`
        : `Your refund request for order #${orderNum} has been approved and processed immediately. The transaction details have been logged in your account.`,
      detected_intent: 'issue_refund',
      selected_action: 'issue_instant_refund',
      action_params: {
        order_number: orderNum,
        reason: 'Customer initiated refund request'
      },
      requires_human_escalation: false
    };
  }

  // Check for Reschedule
  if (lower.includes('reschedule') || lower.includes('tomorrow') || lower.includes('slot') || lower.includes('not home') || lower.includes('move it') || lower.includes('later')) {
    return {
      reply_text: currentChannel === 'whatsapp'
        ? `Done! As a ${customerProfile.loyalty_tier || 'valued'} customer, I have rescheduled delivery for #${orderNum} to tomorrow morning (10:00 AM - 2:00 PM). The courier has been notified.`
        : `We have successfully updated the delivery window for order #${orderNum} to tomorrow between 10:00 AM and 2:00 PM.`,
      detected_intent: 'reschedule_delivery',
      selected_action: 'reschedule_delivery',
      action_params: {
        order_number: orderNum,
        new_delivery_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        new_delivery_slot: '10:00 AM - 2:00 PM'
      },
      requires_human_escalation: false
    };
  }

  // Check for Replacement
  if (lower.includes('replace') || lower.includes('replacement') || lower.includes('broken') || lower.includes('damaged') || lower.includes('wrong item')) {
    return {
      reply_text: currentChannel === 'whatsapp'
        ? `I am so sorry to hear about the issue! I've created an expedited zero-cost replacement order for #${orderNum}. It will be dispatched via priority express.`
        : `We apologize for the damaged/incorrect item. A complimentary replacement order has been generated and dispatched with priority handling.`,
      detected_intent: 'replacement_request',
      selected_action: 'create_replacement_order',
      action_params: {
        order_number: orderNum,
        reason: 'Item damaged or replacement requested'
      },
      requires_human_escalation: false
    };
  }

  // Check for Tracking
  if (lower.includes('track') || lower.includes('where is') || lower.includes('status') || lower.includes('ord-') || lower.includes('package') || lower.includes('delivery')) {
    const statusText = matchedOrder?.status || 'out_for_delivery';
    const carrier = matchedOrder?.carrier_name || 'BlueDart Express';
    const hub = matchedOrder?.tracking_hub || 'Bengaluru Central Hub';
    return {
      reply_text: currentChannel === 'whatsapp'
        ? `Here is the live status for #${orderNum} (${matchedOrder?.product_name || 'Order'}): Status is *${statusText.toUpperCase()}* via ${carrier}. Current Location: ${hub}. Estimated delivery is ${matchedOrder?.delivery_slot || 'today by 6:00 PM'}.`
        : `Order #${orderNum} is currently ${statusText.replace('_', ' ')} via ${carrier}. Current location: ${hub}. Delivery window: ${matchedOrder?.delivery_slot || '10:00 AM - 2:00 PM'}.`,
      detected_intent: 'track_order',
      selected_action: 'track_order',
      action_params: {
        order_number: orderNum
      },
      requires_human_escalation: false
    };
  }

  // Default Conversational Reply
  return {
    reply_text: currentChannel === 'whatsapp'
      ? `Hello! I'm your OmniPulse CX assistant. I have full context of your orders and profile. How can I help you with tracking, rescheduling, or refunds today?`
      : `Welcome to OmniPulse Omnichannel Support. I am ready to assist you with order status, delivery slot rescheduling, returns, or replacements.`,
    detected_intent: 'general_assistance',
    selected_action: 'none',
    action_params: {},
    requires_human_escalation: false
  };
}

function fallbackInsightEngine({ messages, actions, loyaltyTier }) {
  const text = messages.map(m => m.content).join(' ').toLowerCase();

  let sentimentScore = 0.6;
  let emotion = 'satisfied';
  let rootCause = 'product_inquiry';
  let churnRisk = 'low';

  if (text.includes('angry') || text.includes('unacceptable') || text.includes('terrible') || text.includes('delay') && text.includes('cancel')) {
    sentimentScore = -0.7;
    emotion = 'angry';
    rootCause = 'delivery_delay';
    churnRisk = 'critical';
  } else if (text.includes('delay') || text.includes('late') || text.includes('waiting')) {
    sentimentScore = -0.2;
    emotion = 'frustrated';
    rootCause = 'delivery_delay';
    churnRisk = 'medium';
  } else if (text.includes('broken') || text.includes('damaged')) {
    sentimentScore = -0.4;
    emotion = 'frustrated';
    rootCause = 'damaged_item';
    churnRisk = 'high';
  } else if (text.includes('refund')) {
    sentimentScore = 0.1;
    emotion = 'neutral';
    rootCause = 'refund_billing';
    churnRisk = 'medium';
  } else if (text.includes('reschedule') || text.includes('tomorrow')) {
    sentimentScore = 0.75;
    emotion = 'satisfied';
    rootCause = 'reschedule_request';
    churnRisk = 'low';
  }

  return {
    sentiment_score: sentimentScore,
    emotion_tag: emotion,
    root_cause_category: rootCause,
    churn_risk_level: churnRisk,
    executive_summary: `Customer interaction regarding ${rootCause.replace('_', ' ')}. Loyalty tier: ${loyaltyTier}. Current sentiment: ${emotion}.`,
    recommended_ops_action: rootCause === 'delivery_delay' 
      ? 'Audit regional carrier transfer times and enable proactive morning window SMS.'
      : 'Maintain real-time courier API sync for seamless self-service rescheduling.'
  };
}
