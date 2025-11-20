import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';

const VAPI_BASE_URL = process.env.VAPI_BASE_URL || 'https://api.vapi.ai';
const VAPI_PRIVATE_KEY = process.env.VAPI_PRIVATE_KEY!;

export async function POST(request: NextRequest) {
  console.log('🔧 WEBHOOK FIX: ===== FIXING ALL AGENT WEBHOOKS =====');
  
  try {
    // Get current webhook URL
    const currentWebhookUrl = `https://${process.env.VERCEL_URL || 'vapi-agent-dashboard-hshb7djtx-hashem-al-qurashis-projects.vercel.app'}/api/webhook`;
    console.log('🔧 WEBHOOK FIX: Current webhook URL:', currentWebhookUrl);
    
    const supabaseAdmin = createSupabaseAdmin();
    
    // Get all agents
    const { data: agents, error } = await supabaseAdmin
      .from('agents')
      .select('id, agent_name, vapi_assistant_id');

    if (error || !agents) {
      console.error('🔧 WEBHOOK FIX: Error fetching agents:', error);
      return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 });
    }

    console.log('🔧 WEBHOOK FIX: Found', agents.length, 'agents to update');

    const results = [];

    for (const agent of agents) {
      console.log('🔧 WEBHOOK FIX: Updating agent:', agent.agent_name, 'ID:', agent.vapi_assistant_id);
      
      try {
        // Update the assistant's webhook URL
        const updatePayload = {
          serverUrl: currentWebhookUrl,
          serverUrlSecret: "vapi_webhook_secret_2024"
        };

        console.log('🔧 WEBHOOK FIX: Sending update to Vapi:', updatePayload);

        const response = await fetch(`${VAPI_BASE_URL}/assistant/${agent.vapi_assistant_id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${VAPI_PRIVATE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatePayload),
        });

        console.log('🔧 WEBHOOK FIX: Vapi response status:', response.status);

        if (response.ok) {
          const result = await response.json();
          console.log('🔧 WEBHOOK FIX: ✅ Updated successfully:', agent.agent_name);
          results.push({
            agent_name: agent.agent_name,
            agent_id: agent.id,
            vapi_assistant_id: agent.vapi_assistant_id,
            status: 'success',
            webhook_url: currentWebhookUrl
          });
        } else {
          const errorText = await response.text();
          console.error('🔧 WEBHOOK FIX: ❌ Failed to update:', agent.agent_name, errorText);
          results.push({
            agent_name: agent.agent_name,
            agent_id: agent.id,
            vapi_assistant_id: agent.vapi_assistant_id,
            status: 'failed',
            error: errorText
          });
        }
      } catch (error) {
        console.error('🔧 WEBHOOK FIX: ❌ Exception updating:', agent.agent_name, error);
        results.push({
          agent_name: agent.agent_name,
          agent_id: agent.id,
          vapi_assistant_id: agent.vapi_assistant_id,
          status: 'exception',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const failureCount = results.filter(r => r.status !== 'success').length;

    console.log('🔧 WEBHOOK FIX: ===== UPDATE COMPLETE =====');
    console.log('🔧 WEBHOOK FIX: Success:', successCount);
    console.log('🔧 WEBHOOK FIX: Failures:', failureCount);
    console.log('🔧 WEBHOOK FIX: New webhook URL:', currentWebhookUrl);

    return NextResponse.json({
      message: 'Webhook URLs updated',
      webhook_url: currentWebhookUrl,
      total_agents: agents.length,
      success_count: successCount,
      failure_count: failureCount,
      results: results
    });

  } catch (error) {
    console.error('🔧 WEBHOOK FIX: Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}