import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';

const VAPI_BASE_URL = process.env.VAPI_BASE_URL || 'https://api.vapi.ai';
const VAPI_PRIVATE_KEY = process.env.VAPI_PRIVATE_KEY!;

export async function GET(request: NextRequest) {
  console.log('🕵️ AGENT CHECK: Checking webhook configuration for all agents');
  
  try {
    // Get all agents from database
    const supabaseAdmin = createSupabaseAdmin();
    const { data: agents, error: agentsError } = await supabaseAdmin
      .from('agents')
      .select('*');
    
    if (agentsError) {
      return NextResponse.json({
        error: 'Failed to fetch agents from database',
        details: agentsError
      }, { status: 500 });
    }
    
    if (!agents || agents.length === 0) {
      return NextResponse.json({
        message: 'No agents found in database',
        agents_count: 0
      });
    }
    
    console.log(`🕵️ AGENT CHECK: Found ${agents.length} agents to check`);
    
    const expectedWebhookUrl = `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://vapi-agent-dashboard-hashem-al-qurashis-projects.vercel.app'}/api/webhook`;
    
    const agentChecks = [];
    
    for (const agent of agents) {
      try {
        console.log(`🕵️ AGENT CHECK: Checking ${agent.agent_name} (${agent.vapi_assistant_id})`);
        
        // Fetch agent details from Vapi API
        const response = await fetch(`${VAPI_BASE_URL}/assistant/${agent.vapi_assistant_id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${VAPI_PRIVATE_KEY}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const vapiAgent = await response.json();
          
          const check = {
            agent_name: agent.agent_name,
            vapi_assistant_id: agent.vapi_assistant_id,
            database_id: agent.id,
            status: 'success',
            webhook_configured: !!vapiAgent.serverUrl,
            current_webhook_url: vapiAgent.serverUrl || null,
            webhook_secret: vapiAgent.serverUrlSecret || null,
            webhook_matches_expected: vapiAgent.serverUrl === expectedWebhookUrl,
            vapi_agent_exists: true,
            last_updated: vapiAgent.updatedAt || vapiAgent.createdAt
          };
          
          agentChecks.push(check);
          
          console.log(`🕵️ AGENT CHECK: ${agent.agent_name} - Webhook: ${vapiAgent.serverUrl || 'NOT SET'}`);
          
        } else {
          const errorText = await response.text();
          console.error(`🕵️ AGENT CHECK: ❌ Failed to fetch ${agent.agent_name}:`, response.status, errorText);
          
          agentChecks.push({
            agent_name: agent.agent_name,
            vapi_assistant_id: agent.vapi_assistant_id,
            database_id: agent.id,
            status: 'error',
            vapi_agent_exists: false,
            error: `HTTP ${response.status}: ${errorText}`,
            webhook_configured: false,
            webhook_matches_expected: false
          });
        }
        
      } catch (error) {
        console.error(`🕵️ AGENT CHECK: Exception checking ${agent.agent_name}:`, error);
        
        agentChecks.push({
          agent_name: agent.agent_name,
          vapi_assistant_id: agent.vapi_assistant_id,
          database_id: agent.id,
          status: 'exception',
          vapi_agent_exists: 'unknown',
          error: error instanceof Error ? error.message : 'Unknown error',
          webhook_configured: false,
          webhook_matches_expected: false
        });
      }
    }
    
    // Summary statistics
    const summary = {
      total_agents: agents.length,
      agents_with_webhooks: agentChecks.filter(c => c.webhook_configured).length,
      agents_with_correct_webhooks: agentChecks.filter(c => c.webhook_matches_expected).length,
      agents_with_errors: agentChecks.filter(c => c.status === 'error' || c.status === 'exception').length,
      expected_webhook_url: expectedWebhookUrl
    };
    
    console.log('🕵️ AGENT CHECK: Summary:', summary);
    
    return NextResponse.json({
      message: 'Agent webhook configuration check complete',
      timestamp: new Date().toISOString(),
      summary,
      expected_webhook_url: expectedWebhookUrl,
      agent_checks: agentChecks,
      needs_webhook_update: summary.agents_with_correct_webhooks < summary.total_agents,
      recommendation: summary.agents_with_correct_webhooks === 0 
        ? "❌ No agents have webhooks configured! Click 'Update Webhooks' in your dashboard."
        : summary.agents_with_correct_webhooks < summary.total_agents
        ? "⚠️ Some agents missing correct webhook URLs. Click 'Update Webhooks'."
        : "✅ All agents have correct webhook URLs configured."
    });
    
  } catch (error) {
    console.error('🕵️ AGENT CHECK: ❌ Failed to check agent webhooks:', error);
    return NextResponse.json({
      error: 'Failed to check agent webhook configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}