import express from 'express';
import supabase from '../db/supabaseClient.js';
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

  try {
    // 1. Fetch Customer Profile
    const { data: profileData } = await supabase
      .from('customer_profiles')
      .select('*, users(full_name, email)')
      .eq('user_id', userId)
      .maybeSingle();

    const profile = profileData ? {
      ...profileData,
      full_name: profileData.users?.full_name,
      email: profileData.users?.email
    } : null;

    // 2. Fetch Customer's Orders
    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // 3. Find or create unified conversation
    const { data: existingConvs } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('last_message_at', { ascending: false })
      .limit(1);

    let conversation;
    if (!existingConvs || existingConvs.length === 0) {
      const preferred = profile?.preferred_channel || 'web_chat';
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          status: 'open',
          active_channel: preferred,
          last_message_at: new Date().toISOString()
        })
        .select()
        .single();
      conversation = newConv;

      // Add a welcoming message
      const welcomeContent = `Welcome to OmniPulse CX! I am your AI assistant across Web Chat, WhatsApp, and Email. I have your order history and account details ready. How can I assist you today?`;
      await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          sender_type: 'ai_agent',
          channel: preferred,
          content: welcomeContent,
          metadata: { initial: true }
        });
    } else {
      conversation = existingConvs[0];
    }

    // 4. Fetch all messages
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true });

    // 5. Fetch support actions
    const { data: actions } = await supabase
      .from('support_actions')
      .select('*')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true });

    res.json({
      conversation,
      messages: messages || [],
      actions: actions || [],
      profile,
      orders: orders || []
    });
  } catch (error) {
    console.error('Fetch active conversation error:', error);
    res.status(500).json({ error: 'Failed to retrieve conversation history.' });
  }
});

/**
 * POST /api/conversations/message
 * Send customer message, invoke Gemini, execute actions, extract insights
 */
router.post('/message', authenticateToken, validateBody(sendMessageSchema), async (req, res) => {
  const userId = req.user.id;
  const { content, channel, email_subject } = req.body;

  try {
    // 1. Fetch Profile and Orders
    const { data: profileData } = await supabase
      .from('customer_profiles')
      .select('*, users(full_name, email)')
      .eq('user_id', userId)
      .maybeSingle();

    const profile = {
      full_name: profileData?.users?.full_name || 'Customer',
      loyalty_tier: profileData?.loyalty_tier || 'Standard',
      preferred_channel: channel,
      goodwill_credits: parseFloat(profileData?.goodwill_credits || 0)
    };

    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // 2. Fetch or create conversation
    const { data: existingConvs } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('last_message_at', { ascending: false })
      .limit(1);

    let conversation;
    if (!existingConvs || existingConvs.length === 0) {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          status: 'open',
          active_channel: channel,
          last_message_at: new Date().toISOString()
        })
        .select()
        .single();
      conversation = newConv;
    } else {
      conversation = existingConvs[0];
      await supabase
        .from('conversations')
        .update({
          active_channel: channel,
          last_message_at: new Date().toISOString()
        })
        .eq('id', conversation.id);
    }

    // 3. Save incoming customer message
    const { data: savedCustomerMessage, error: custErr } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        sender_type: 'customer',
        channel,
        email_subject: email_subject || null,
        content,
        metadata: { channel, email_subject }
      })
      .select()
      .single();

    if (custErr) throw custErr;

    // 4. Fetch recent messages for prompt context (last 15)
    const { data: recentMessages } = await supabase
      .from('messages')
      .select('sender_type, channel, content, created_at')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: false })
      .limit(15);

    const sortedRecent = (recentMessages || []).reverse();

    // 5. Generate AI Response via Gemini Service
    const aiDecision = await generateOmnichannelResponse({
      customerProfile: profile,
      orders: orders || [],
      recentMessages: sortedRecent,
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
          customerOrders: orders || []
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

    const { data: savedAiMessage, error: aiErr } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        sender_type: 'ai_agent',
        channel,
        email_subject: email_subject ? `Re: ${email_subject}` : null,
        content: aiDecision.reply_text,
        metadata: aiMsgMetadata
      })
      .select()
      .single();

    if (aiErr) throw aiErr;

    // 8. Fetch refreshed orders to return freshest state
    const { data: refreshedOrders } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // 9. Asynchronously update Conversation Insights (Prompt B)
    (async () => {
      try {
        const { data: fullMsgs } = await supabase
          .from('messages')
          .select('sender_type, channel, content')
          .eq('conversation_id', conversation.id)
          .order('created_at', { ascending: true });

        const { data: fullActions } = await supabase
          .from('support_actions')
          .select('action_type, action_summary, created_at')
          .eq('conversation_id', conversation.id);

        const insight = await extractConversationInsights({
          messages: fullMsgs || [],
          actions: fullActions || [],
          loyaltyTier: profile.loyalty_tier || 'Standard'
        });

        await supabase
          .from('conversation_insights')
          .upsert({
            conversation_id: conversation.id,
            user_id: userId,
            sentiment_score: insight.sentiment_score,
            emotion_tag: insight.emotion_tag,
            root_cause_category: insight.root_cause_category,
            churn_risk_level: insight.churn_risk_level,
            executive_summary: insight.executive_summary,
            recommended_ops_action: insight.recommended_ops_action,
            analyzed_at: new Date().toISOString()
          }, { onConflict: 'conversation_id' });
      } catch (insightErr) {
        console.error('Background insight extraction notice:', insightErr.message);
      }
    })();

    res.json({
      customer_message: savedCustomerMessage,
      ai_message: savedAiMessage,
      action: executedAction,
      updated_orders: refreshedOrders || []
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to process message and generate AI response.' });
  }
});

export default router;
