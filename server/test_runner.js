import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config();

const BASE_URL = process.env.TEST_API_URL || 'http://127.0.0.1:5000/api';

async function runTests() {
  console.log('===============================================================');
  console.log('🚀 OMNIPULSE CX: AUTOMATED END-TO-END VERIFICATION TEST SUITE');
  console.log(`📡 Target API: ${BASE_URL}`);
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ [PASS]: ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL]: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Health Check
    console.log('--- TEST 1: Health & Telemetry Endpoint ---');
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200, 'Health endpoint returns HTTP 200');
    assert(healthData.status === 'ok', `Service status is OK: ${healthData.service}`);
    assert(healthData.db === 'connected', `Database connection status: ${healthData.db}`);

    // 2. Demo Customer Login
    console.log('\n--- TEST 2: Demo Customer Authentication ---');
    const custLoginRes = await fetch(`${BASE_URL}/auth/demo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'customer' })
    });
    const custAuth = await custLoginRes.json();
    assert(custLoginRes.status === 200, 'Demo Customer login returns HTTP 200');
    assert(custAuth.user?.email === 'aarav@demo.com', `Logged in as: ${custAuth.user?.full_name} (${custAuth.user?.email})`);
    assert(custAuth.profile?.loyalty_tier === 'Gold', `Loyalty Tier: ${custAuth.profile?.loyalty_tier} (Spend: ₹${custAuth.profile?.lifetime_spend})`);
    const customerToken = custAuth.token;
    const customerId = custAuth.user?.id;

    // 3. Customer Orders Retrieval
    console.log('\n--- TEST 3: Customer Orders Retrieval ---');
    const ordersRes = await fetch(`${BASE_URL}/orders`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    const orders = await ordersRes.json();
    assert(ordersRes.status === 200, 'Orders endpoint returns HTTP 200');
    assert(Array.isArray(orders) && orders.length >= 4, `Retrieved ${orders.length} active customer orders`);
    const targetOrder = orders.find(o => o.order_number === 'ORD-1042') || orders[0];
    console.log(`   Sample Order: ${targetOrder.order_number} - ${targetOrder.product_name} (${targetOrder.status})`);

    // 4. Active Omnichannel Conversation
    console.log('\n--- TEST 4: Unified Omnichannel Conversation Thread ---');
    const convRes = await fetch(`${BASE_URL}/conversations/active`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    const convData = await convRes.json();
    assert(convRes.status === 200, 'Active conversation returns HTTP 200');
    assert(convData.messages?.length > 0, `Unified conversation has ${convData.messages?.length} cross-channel messages`);
    assert(convData.orders?.length > 0, `Context contains ${convData.orders?.length} customer orders`);

    // 5. Customer Message & AI Tool Execution: track_order
    console.log('\n--- TEST 5: Omnichannel Chat Turn (Web Chat: Order Tracking) ---');
    const msg1Res = await fetch(`${BASE_URL}/conversations/message`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`
      },
      body: JSON.stringify({
        channel: 'web_chat',
        content: 'Where is my order #ORD-1042? I need carrier tracking updates.'
      })
    });
    const turn1 = await msg1Res.json();
    assert(msg1Res.status === 200, 'Message sent successfully (HTTP 200)');
    assert(!!turn1.ai_message?.content, `AI replied: "${turn1.ai_message?.content.slice(0, 70)}..."`);
    assert(turn1.action?.action_type === 'track_order' || turn1.ai_message?.metadata?.selected_action === 'track_order', 
      'AI autonomously executed track_order action');

    // 6. Omnichannel Channel Switch & Autonomous Mutation: reschedule_delivery
    console.log('\n--- TEST 6: Channel Switch (WhatsApp: Reschedule Delivery) ---');
    const msg2Res = await fetch(`${BASE_URL}/conversations/message`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`
      },
      body: JSON.stringify({
        channel: 'whatsapp',
        content: 'Can we move delivery of #ORD-1042 to tomorrow morning?'
      })
    });
    const turn2 = await msg2Res.json();
    assert(msg2Res.status === 200, 'WhatsApp message processed (HTTP 200)');
    assert(turn2.action?.action_type === 'reschedule_delivery' || turn2.ai_message?.metadata?.selected_action === 'reschedule_delivery',
      'AI autonomously executed reschedule_delivery action');
    console.log(`   Action Summary: ${turn2.action?.action_summary || 'Rescheduled delivery slot'}`);

    // 7. Proactive Disruption & Retention Engine: Simulate Delay
    console.log('\n--- TEST 7: Proactive Logistics Delay & Retention Simulator ---');
    const delayOrder = orders.find(o => o.order_number === 'ORD-1043') || orders[1];
    const delayRes = await fetch(`${BASE_URL}/orders/${delayOrder.id}/simulate-delay`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    const delayData = await delayRes.json();
    assert(delayRes.status === 200, 'Simulate delay returns HTTP 200');
    assert(delayData.order?.status === 'delayed', `Order status updated to: ${delayData.order?.status}`);
    assert(!!delayData.proactive_message?.content, `Proactive outreach generated: "${delayData.proactive_message?.content.slice(0, 75)}..."`);
    assert(delayData.action?.action_payload?.credit_amount > 0, `Pre-approved goodwill credit issued: ₹${delayData.action?.action_payload?.credit_amount}`);

    // 8. Demo Admin Authentication
    console.log('\n--- TEST 8: Demo Admin Authentication ---');
    const adminLoginRes = await fetch(`${BASE_URL}/auth/demo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'admin' })
    });
    const adminAuth = await adminLoginRes.json();
    assert(adminLoginRes.status === 200, 'Demo Admin login returns HTTP 200');
    assert(adminAuth.user?.role === 'admin', `Authenticated as Admin: ${adminAuth.user?.full_name}`);
    const adminToken = adminAuth.token;

    // 9. Executive Admin Dashboard Analytics & Recharts Data
    console.log('\n--- TEST 9: Executive CX Insights & Recharts Aggregates ---');
    const insightsRes = await fetch(`${BASE_URL}/admin/insights/overview`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const insights = await insightsRes.json();
    assert(insightsRes.status === 200, 'Executive insights returns HTTP 200');
    assert(typeof insights.kpis?.avg_sentiment === 'number', `KPI Avg Sentiment: ${insights.kpis?.avg_sentiment}`);
    assert(typeof insights.kpis?.automated_resolution_rate === 'number', `KPI Resolution Rate: ${insights.kpis?.automated_resolution_rate}%`);
    assert(Array.isArray(insights.sentiment_trend) && insights.sentiment_trend.length > 0, `Recharts Sentiment Trend: ${insights.sentiment_trend.length} points`);
    assert(Array.isArray(insights.root_causes) && insights.root_causes.length > 0, `Recharts Root Causes: ${insights.root_causes.length} categories`);
    assert(Array.isArray(insights.channel_distribution) && insights.channel_distribution.length > 0, `Recharts Channel Distribution: ${insights.channel_distribution.length} channels`);

    // 10. Human Escalation Queue
    console.log('\n--- TEST 10: Escalations Queue & Resolution Workflow ---');
    const escRes = await fetch(`${BASE_URL}/admin/escalations`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const escalations = await escRes.json();
    assert(escRes.status === 200, 'Escalations queue returns HTTP 200');
    assert(Array.isArray(escalations), `Escalations queue contains ${escalations.length} records`);

    if (escalations.length > 0) {
      const targetEsc = escalations[0];
      console.log(`   Target Ticket: Customer ${targetEsc.full_name} (${targetEsc.churn_risk_level} churn risk)`);
      
      // Resolve Ticket
      const resolveRes = await fetch(`${BASE_URL}/admin/escalations/${targetEsc.conversation_id}/resolve`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          admin_resolution_notes: 'Verified logistics status. Courier dispatch expedited and customer informed via WhatsApp.'
        })
      });
      const resolveData = await resolveRes.json();
      assert(resolveRes.status === 200, 'Ticket resolved successfully (HTTP 200)');
      assert(resolveData.conversation?.status === 'resolved', `Ticket status updated to: ${resolveData.conversation?.status}`);
    }

    // 11. Customer 360 View
    console.log('\n--- TEST 11: Customer 360 Profile ---');
    const c360Res = await fetch(`${BASE_URL}/admin/customers/${customerId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const c360Data = await c360Res.json();
    assert(c360Res.status === 200, 'Customer 360 returns HTTP 200');
    assert(c360Data.customer?.email === 'aarav@demo.com', `Customer 360 profile verified for: ${c360Data.customer?.full_name}`);
    assert(c360Data.orders?.length > 0, `Order history linked: ${c360Data.orders?.length} orders`);
    assert(c360Data.messages?.length > 0, `Cross-channel transcript linked: ${c360Data.messages?.length} messages`);

  } catch (err) {
    console.error('\n💥 Test execution error:', err.stack || err);
    failed++;
  }

  console.log('\n===============================================================');
  console.log(`📊 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('===============================================================');
  
  if (failed === 0) {
    console.log('🎉 ALL ENDPOINTS & AUTONOMOUS ACTIONS VERIFIED AND OPERATIONAL!');
  }
}

runTests();
