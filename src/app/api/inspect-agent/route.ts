import { NextRequest, NextResponse } from 'next/server';

const VAPI_BASE_URL = process.env.VAPI_BASE_URL || 'https://api.vapi.ai';
const VAPI_PRIVATE_KEY = process.env.VAPI_PRIVATE_KEY!;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const assistantId = searchParams.get('assistantId') || '4f7f1c42-7c89-411e-9e77-8901fb71581a'; // Default to test agent
  
  console.log('🔍 INSPECT: Inspecting agent:', assistantId);
  
  try {
    // Fetch full agent configuration from Vapi
    const response = await fetch(`${VAPI_BASE_URL}/assistant/${assistantId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VAPI_PRIVATE_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({
        error: `Failed to fetch agent: HTTP ${response.status}`,
        details: errorText,
        assistantId
      }, { status: response.status });
    }
    
    const agentConfig = await response.json();
    
    console.log('🔍 INSPECT: Agent config retrieved:', agentConfig);
    
    // Analyze webhook configuration
    const webhookAnalysis = {
      has_server_url: !!agentConfig.serverUrl,
      server_url: agentConfig.serverUrl,
      has_server_secret: !!agentConfig.serverUrlSecret,
      server_secret_length: agentConfig.serverUrlSecret ? agentConfig.serverUrlSecret.length : 0,
      server_secret_preview: agentConfig.serverUrlSecret ? 
        agentConfig.serverUrlSecret.substring(0, 10) + '...' : null,
      
      // Check for webhook-related settings
      has_server_messages: !!agentConfig.serverMessages,
      server_messages: agentConfig.serverMessages,
      
      // Check model configuration
      model_provider: agentConfig.model?.provider,
      model_name: agentConfig.model?.model,
      
      // Check voice configuration
      voice_provider: agentConfig.voice?.provider,
      voice_id: agentConfig.voice?.voiceId,
      
      // Other webhook-related settings
      background_sound: agentConfig.backgroundSound,
      background_denoising_enabled: agentConfig.backgroundDenoisingEnabled,
      
      // Check if agent is configured for webhooks
      webhook_configured_properly: !!(agentConfig.serverUrl && agentConfig.serverUrlSecret),
      expected_webhook_url: 'https://vapi-agent-dashboard-hashem-al-qurashis-projects.vercel.app/api/webhook',
      webhook_url_matches: agentConfig.serverUrl === 'https://vapi-agent-dashboard-hashem-al-qurashis-projects.vercel.app/api/webhook'
    };
    
    return NextResponse.json({
      message: 'Agent inspection complete',
      assistant_id: assistantId,
      agent_name: agentConfig.name,
      webhook_analysis: webhookAnalysis,
      full_agent_config: agentConfig,
      timestamp: new Date().toISOString(),
      
      recommendations: generateRecommendations(webhookAnalysis, agentConfig)
    });
    
  } catch (error) {
    console.error('🔍 INSPECT: Error inspecting agent:', error);
    return NextResponse.json({
      error: 'Failed to inspect agent',
      details: error instanceof Error ? error.message : 'Unknown error',
      assistant_id: assistantId
    }, { status: 500 });
  }
}

function generateRecommendations(webhookAnalysis: any, agentConfig: any) {
  const recommendations = [];
  
  if (!webhookAnalysis.has_server_url) {
    recommendations.push('❌ No webhook URL configured - agent will not send webhooks');
  } else if (!webhookAnalysis.webhook_url_matches) {
    recommendations.push('⚠️ Webhook URL does not match expected production URL');
  } else {
    recommendations.push('✅ Webhook URL correctly configured');
  }
  
  if (!webhookAnalysis.has_server_secret) {
    recommendations.push('⚠️ No webhook secret configured - webhooks may be rejected');
  } else {
    recommendations.push('✅ Webhook secret is configured');
  }
  
  if (!webhookAnalysis.has_server_messages || !webhookAnalysis.server_messages) {
    recommendations.push('ℹ️ No specific server messages configured - using defaults');
  }
  
  if (!agentConfig.model) {
    recommendations.push('⚠️ No model configured');
  }
  
  if (!agentConfig.voice) {
    recommendations.push('⚠️ No voice configured');
  }
  
  return recommendations;
}