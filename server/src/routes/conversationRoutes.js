import express from 'express';
import pool from '../db/pool.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { sendMessageSchema } from '../validators/schemas.js';
import { generateOmnichannelResponse, extractConversationInsights } from '../services/geminiService.js';
import { executeSupportAction } from '../services/actionExecutorService.js';

const router = express.Router();

/**
 * GET /api/conversations/active
 * Fetches or initializes the unified omnichannel conversation
 */
router.get('/active', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const client = await pool.connect();

  try {
    // 1. Fetch Customer Profile
    const profileRes = await client.query(
      `SELECT p.*, u.full_name, u.email 
       FROM customer_profiles p 
       JOIN users u ON u.id = p.user_id 
       WHERE p.user_id = $1`,
      [userId]
    );
    const profile = profileRes.rows[0] || null;

    // 2. Fetch Customer's Orders
    const ordersRes = await client.query(
      `SELECT * FROM orders 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );

    // 3. Find or create unified conversation
    let convRes = await client.query(
      `SELECT * FROM conversations 
       WHERE user_id = $1 
       ORDER BY last_message_at DESC 
       LIMIT 1`,
      [userId]
    );

    let conversation;
    if (convRes.rows.length === 0) {
      const preferred = profile?.preferred_channel || 'web_chat';
      const newConv = await client.query(
        `INSERT INTO conversations (user_id, status, active_channel, last_message_at)
         VALUES ($1, 'open', $2, NOW())
         RETURNING *`,
        [userId, preferred]
      );
      conversation = newConv.rows[0];

      // Add a welcoming message
      const welcomeContent = `Welcome to OmniPulse CX! I am your AI assistant across Web Chat, WhatsApp, and Email. I have your order history and account details ready. How can I assist you today?`;
      await client.query(
        `INSERT INTO messages (conversation_id, sender_type, channel, content, metadata)
         VALUES ($1, 'ai_agent', $2, $3, '{"initial": true}'::jsonb)`,
        [conversation.id, preferred, welcomeContent]
      );
    } else {
      conversation = convRes.rows[0];
    }

    // 4. Fetch all messages
    const messagesRes = await client.query(
      `SELECT * FROM messages 
       WHERE conversation_id = $1 
       ORDER BY created_at ASC`,
      [conversation.id]
    );

    // 5. Fetch support actions
    const actionsRes = await client.query(
      `SELECT * FROM support_actions 
       WHERE conversation_id = $1 
       ORDER BY created_at ASC`,
      [conversation.id]
    );

    res.json({
      conversation,
      messages: messagesRes.rows,
      actions: actionsRes.rows,
      profile,
      orders: ordersRes.rows
    });
  } catch (error) {
    console.error('Fetch active conversation error:', error);
    res.status(500).json({ error: 'Failed to retrieve conversation history.' });
  } finally {
    client.release();
  }
});

/**
 * POST /api/conversations/message
 * Send customer message, invoke Gemini, execute actions, extract insights
 */
router.post('/message', authenticateToken, validateBody(sendMessageSchema), async (req, res) => {
  const userId = req.user.id;
  const { content, channel, email_subject } = req.body;
  const client = await pool.connect();

  try {
    // 1. Fetch Profile and Orders
    const profileRes = await client.query(
      `SELECT p.*, u.full_name, u.email 
       FROM customer_profiles p 
       JOIN users u ON u.id = p.user_id 
       WHERE p.user_id = $1`,
      [userId]
    );
    const profile = profileRes.rows[0] || {
      full_name: 'Customer',
      loyalty_tier: 'Standard',
      preferred_channel: channel,
      goodwill_credits: 0
    };

    const ordersRes = await client.query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    const orders = ordersRes.rows;

    // 2. Fetch or create conversation
    let convRes = await client.query(
      `SELECT * FROM conversations 
       WHERE user_id = $1 
       ORDER BY last_message_at DESC 
       LIMIT 1`,
      [userId]
    );

    let conversation;
    if (convRes.rows.length === 0) {
      const newConv = await client.query(
        `INSERT INTO conversations (user_id, status, active_channel, last_message_at)
         VALUES ($1, 'open', $2, NOW())
         RETURNING *`,
        [userId, channel]
      );
      conversation = newConv.rows[0];
    } else {
      conversation = convRes.rows[0];
      // Update channel and timestamp
      await client.query(
        `UPDATE conversations 
         SET active_channel = $1, last_message_at = NOW() 
         WHERE id = $2`,
        [channel, conversation.id]
      );
    }

    // 3. Save incoming customer message
    const custMsgRes = await client.query(
      `INSERT INTO messages 
       (conversation_id, sender_type, channel, email_subject, content, metadata, created_at)
       VALUES ($1, 'customer', $2, $3, $4, $5, NOW())
       RETURNING *`,
      [
        conversation.id,
        channel,
        email_subject || null,
        content,
        JSON.stringify({ channel, email_subject })
      ]
    );
    const savedCustomerMessage = custMsgRes.rows[0];

    // 4. Fetch recent messages for prompt context (last 15)
    const recentMessagesRes = await client.query(
      `SELECT * FROM (
         SELECT sender_type, channel, content, created_at 
         FROM messages 
         WHERE conversation_id = $1 
         ORDER BY created_at DESC 
         LIMIT 15
       ) sub ORDER BY created_at ASC`,
      [conversation.id]
    );

    // 5. Generate AI Response via Gemini Service
    const aiDecision = await generateOmnichannelResponse({
      customerProfile: profile,
      orders,
      recentMessages: recentMessagesRes.rows,
      currentMessage: content,
      currentChannel: channel,
      emailSubject: email_subject
    });

    // 6. Execute autonomous support action if triggered
    let executedAction = null;
    if (aiDecision.selected_action && aiDecision.selected_action !== 'none') {
      try {
        executedAction = await executeSupportAction({
          actionType: aiDecision.selected_action,
          actionParams: aiDecision.action_params || {},
          userId,
          conversationId: conversation.id,
          customerOrders: orders
        });
      } catch (actErr) {
        console.error('Error executing support action:', actErr.message);
      }
    }

    // 7. Save AI Agent Message
    const aiMsgMetadata = {
      channel,
      detected_intent: aiDecision.detected_intent,
      selected_action: aiDecision.selected_action,
      action_params: aiDecision.action_params,
      action_id: executedAction ? executedAction.id : null,
      requires_human_escalation: aiDecision.requires_human_escalation
    };

    const aiMsgRes = await client.query(
      `INSERT INTO messages 
       (conversation_id, sender_type, channel, email_subject, content, metadata, created_at)
       VALUES ($1, 'ai_agent', $2, $3, $4, $5, NOW())
       RETURNING *`,
      [
        conversation.id,
        channel,
        email_subject ? `Re: ${email_subject}` : null,
        aiDecision.reply_text,
        JSON.stringify(aiMsgMetadata)
      ]
    );
    const savedAiMessage = aiMsgRes.rows[0];

    // 8. Fetch updated orders to return freshest state
    const refreshedOrdersRes = await client.query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    // 9. Asynchronously update Conversation Insights (Prompt B)
    // Non-blocking so response is fast
    (async () => {
      try {
        const fullMessagesRes = await pool.query(
          'SELECT sender_type, channel, content FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
          [conversation.id]
        );
        const fullActionsRes = await pool.query(
          'SELECT action_type, action_summary, created_at FROM support_actions WHERE conversation_id = $1',
          [conversation.id]
        );

        const insight = await extractConversationInsights({
          messages: fullMessagesRes.rows,
          actions: fullActionsRes.rows,
          loyaltyTier: profile.loyalty_tier || 'Standard'
        });

        await pool.query(
          `INSERT INTO conversation_insights 
           (conversation_id, user_id, sentiment_score, emotion_tag, root_cause_category, churn_risk_level, executive_summary, recommended_ops_action, analyzed_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
           ON CONFLICT (conversation_id) DO UPDATE SET
           sentiment_score = EXCLUDED.sentiment_score,
           emotion_tag = EXCLUDED.emotion_tag,
           root_cause_category = EXCLUDED.root_cause_category,
           churn_risk_level = EXCLUDED.churn_risk_level,
           executive_summary = EXCLUDED.executive_summary,
           recommended_ops_action = EXCLUDED.recommended_ops_action,
           analyzed_at = NOW()`,
          [
            conversation.id,
            userId,
            insight.sentiment_score,
            insight.emotion_tag,
            insight.root_cause_category,
            insight.churn_risk_level,
            insight.executive_summary,
            insight.recommended_ops_action
          ]
        );
      } catch (insightErr) {
        console.error('Background insight extraction notice:', insightErr.message);
      }
    })();

    res.json({
      customer_message: savedCustomerMessage,
      ai_message: savedAiMessage,
      action: executedAction,
      updated_orders: refreshedOrdersRes.rows
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to process message and generate AI response.' });
  } finally {
    client.release();
  }
});

export default router;
