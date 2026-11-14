import { z } from 'zod';

export const registerSchema = z.object({
  full_name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120, 'Name cannot exceed 120 characters'),
  email: z.string().trim().email('Invalid email address').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  preferred_channel: z.enum(['web_chat', 'whatsapp', 'email']).default('whatsapp'),
  phone_number: z.string().optional(),
  city: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const demoLoginSchema = z.object({
  role: z.enum(['customer', 'admin']),
});

export const sendMessageSchema = z.object({
  content: z.string().trim().min(1, 'Message cannot be empty').max(2000, 'Message cannot exceed 2000 characters'),
  channel: z.enum(['web_chat', 'whatsapp', 'email']).default('web_chat'),
  email_subject: z.string().trim().max(255).optional().nullable(),
});

export const resolveEscalationSchema = z.object({
  admin_resolution_notes: z.string().trim().min(3, 'Resolution notes must be at least 3 characters').max(1000, 'Notes cannot exceed 1000 characters'),
});

export const aiActionResponseSchema = z.object({
  reply_text: z.string().min(1),
  detected_intent: z.string().default('general_inquiry'),
  selected_action: z.enum([
    'track_order',
    'issue_instant_refund',
    'reschedule_delivery',
    'create_replacement_order',
    'apply_goodwill_credit',
    'escalate_to_human',
    'none'
  ]).default('none'),
  action_params: z.object({
    order_number: z.string().optional(),
    new_delivery_date: z.string().optional(),
    new_delivery_slot: z.string().optional(),
    credit_amount: z.number().optional(),
    reason: z.string().optional()
  }).optional().default({}),
  requires_human_escalation: z.boolean().default(false),
  escalation_reason: z.string().optional().nullable()
});

export const aiInsightResponseSchema = z.object({
  sentiment_score: z.number().min(-1.0).max(1.0).default(0.0),
  emotion_tag: z.enum(['delighted', 'satisfied', 'neutral', 'confused', 'frustrated', 'angry']).default('neutral'),
  root_cause_category: z.enum([
    'delivery_delay',
    'damaged_item',
    'refund_billing',
    'wrong_item',
    'reschedule_request',
    'product_inquiry',
    'positive_feedback'
  ]).default('product_inquiry'),
  churn_risk_level: z.enum(['low', 'medium', 'high', 'critical']).default('low'),
  executive_summary: z.string().min(1).default('Standard customer interaction analyzed.'),
  recommended_ops_action: z.string().min(1).default('Continue standard monitoring.')
});

export const proactiveRetentionSchema = z.object({
  proactive_message: z.string().min(1),
  offered_credit: z.number().nonnegative().default(15.0),
  summary_badge: z.string().default('Carrier Delay Proactive Credit')
});
