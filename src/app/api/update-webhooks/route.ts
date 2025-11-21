import { NextRequest, NextResponse } from 'next/server';
import { agentService } from '@/lib/database';

const VAPI_BASE_URL = process.env.VAPI_BASE_URL || 'https://api.vapi.ai';
const VAPI_PRIVATE_KEY = process.env.VAPI_PRIVATE_KEY!;

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Webhook update endpoint - use POST to update all agent webhooks',
    webhook_url: 'https://vapi-agent-dashboard-hashem-al-qurashis-projects.vercel.app/api/webhook',
    instructions: 'Send POST request to this endpoint to update all agents'
  });
}

export async function POST(request: NextRequest) {
  try {
    console.log('Starting webhook URL update for all agents...');
    
    // Get all agents from database
    const agents = await agentService.getAll();
    console.log(`Found ${agents.length} agents to update`);
    
    // Always use main production domain for webhook stability
    const webhookUrl = 'https://vapi-agent-dashboard-hashem-al-qurashis-projects.vercel.app/api/webhook';
    console.log('Webhook URL:', webhookUrl);
    
    const updateResults = [];
    
    for (const agent of agents) {
      try {
        console.log(`Updating agent: ${agent.agent_name} (${agent.vapi_assistant_id})`);
        
        const updatePayload = {
          serverUrl: webhookUrl,
          serverUrlSecret: "vapi_webhook_secret_2024"
        };
        
        const response = await fetch(`${VAPI_BASE_URL}/assistant/${agent.vapi_assistant_id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${VAPI_PRIVATE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatePayload),
        });
        
        if (response.ok) {
          console.log(`✅ Successfully updated ${agent.agent_name}`);
          updateResults.push({ agent: agent.agent_name, status: 'success' });
        } else {
          const error = await response.text();
          console.error(`❌ Failed to update ${agent.agent_name}:`, error);
          updateResults.push({ agent: agent.agent_name, status: 'failed', error });
        }
        
      } catch (error) {
        console.error(`Error updating ${agent.agent_name}:`, error);
        updateResults.push({ agent: agent.agent_name, status: 'error', error: String(error) });
      }
    }
    
    return NextResponse.json({
      message: 'Webhook URL update completed',
      webhookUrl,
      results: updateResults,
      totalAgents: agents.length,
      successCount: updateResults.filter(r => r.status === 'success').length
    });
    
  } catch (error) {
    console.error('Error in webhook update:', error);
    return NextResponse.json(
      { error: 'Failed to update webhook URLs', details: String(error) },
      { status: 500 }
    );
  }
}