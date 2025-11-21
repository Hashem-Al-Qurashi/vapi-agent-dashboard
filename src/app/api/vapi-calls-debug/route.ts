import { NextRequest, NextResponse } from 'next/server';

const VAPI_BASE_URL = process.env.VAPI_BASE_URL || 'https://api.vapi.ai';
const VAPI_PRIVATE_KEY = process.env.VAPI_PRIVATE_KEY!;

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 VAPI CALLS DEBUG: Fetching all calls from Vapi API...');
    
    // Fetch all calls from Vapi API
    const response = await fetch(`${VAPI_BASE_URL}/call`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VAPI_PRIVATE_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({
        error: `Failed to fetch calls from Vapi API: HTTP ${response.status}`,
        details: errorText
      }, { status: response.status });
    }
    
    const calls = await response.json();
    console.log('🔍 VAPI CALLS DEBUG: Retrieved calls:', calls.length || 0);
    
    // Analyze calls for webhooks
    const analysis = {
      total_calls: Array.isArray(calls) ? calls.length : (calls.data ? calls.data.length : 0),
      calls_data: Array.isArray(calls) ? calls : (calls.data || calls),
      recent_calls: [] as Array<{
        id: string;
        assistantId: string;
        status: string;
        type: string;
        startedAt: string;
        endedAt: string;
        duration: number;
        phoneNumber: string;
        hasTranscript: boolean;
        hasRecording: boolean;
        hasAnalysis: boolean;
        webhookUrl: string;
        createdAt: string;
        updatedAt: string;
      }>,
      webhook_analysis: {
        calls_with_webhooks: 0,
        calls_without_webhooks: 0,
        webhook_urls_found: [] as string[],
        call_statuses: [] as string[],
        call_types: [] as string[]
      }
    };
    
    const callsArray = analysis.calls_data;
    
    if (Array.isArray(callsArray)) {
      // Get recent calls (last 10)
      analysis.recent_calls = callsArray
        .sort((a, b) => new Date(b.createdAt || b.startedAt).getTime() - new Date(a.createdAt || a.startedAt).getTime())
        .slice(0, 10)
        .map(call => ({
          id: call.id,
          assistantId: call.assistantId,
          status: call.status,
          type: call.type,
          startedAt: call.startedAt,
          endedAt: call.endedAt,
          duration: call.duration,
          phoneNumber: call.phoneNumber,
          hasTranscript: !!call.transcript,
          hasRecording: !!call.recordingUrl,
          hasAnalysis: !!call.analysis,
          webhookUrl: call.assistant?.serverUrl,
          createdAt: call.createdAt,
          updatedAt: call.updatedAt
        }));
      
      // Analyze webhook configuration
      callsArray.forEach(call => {
        if (call.assistant?.serverUrl || call.serverUrl) {
          analysis.webhook_analysis.calls_with_webhooks++;
          const webhookUrl = call.assistant?.serverUrl || call.serverUrl;
          if (webhookUrl && !analysis.webhook_analysis.webhook_urls_found.includes(webhookUrl)) {
            analysis.webhook_analysis.webhook_urls_found.push(webhookUrl);
          }
        } else {
          analysis.webhook_analysis.calls_without_webhooks++;
        }
        
        if (call.status && !analysis.webhook_analysis.call_statuses.includes(call.status)) {
          analysis.webhook_analysis.call_statuses.push(call.status);
        }
        if (call.type && !analysis.webhook_analysis.call_types.includes(call.type)) {
          analysis.webhook_analysis.call_types.push(call.type);
        }
      });
    }
    
    return NextResponse.json({
      message: 'Vapi calls analysis complete',
      timestamp: new Date().toISOString(),
      analysis,
      recommendations: generateCallsRecommendations(analysis)
    });
    
  } catch (error) {
    console.error('🔍 VAPI CALLS DEBUG: Error:', error);
    return NextResponse.json({
      error: 'Failed to debug Vapi calls',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function generateCallsRecommendations(analysis: any) {
  const recommendations = [];
  
  if (analysis.total_calls === 0) {
    recommendations.push('❌ No calls found in Vapi - make sure you have made calls through Vapi');
  } else {
    recommendations.push(`✅ Found ${analysis.total_calls} calls in Vapi`);
  }
  
  if (analysis.webhook_analysis.calls_without_webhooks > 0) {
    recommendations.push(`⚠️ ${analysis.webhook_analysis.calls_without_webhooks} calls without webhook configuration`);
  }
  
  if (analysis.webhook_analysis.webhook_urls_found.length > 0) {
    recommendations.push(`📡 Webhook URLs found: ${analysis.webhook_analysis.webhook_urls_found.join(', ')}`);
  } else {
    recommendations.push('❌ No webhook URLs found in any calls');
  }
  
  const expectedWebhook = 'https://vapi-agent-dashboard-hashem-al-qurashis-projects.vercel.app/api/webhook';
  const hasCorrectWebhook = analysis.webhook_analysis.webhook_urls_found.includes(expectedWebhook);
  
  if (hasCorrectWebhook) {
    recommendations.push('✅ Correct webhook URL found in calls');
  } else {
    recommendations.push('❌ Expected webhook URL not found in any calls');
  }
  
  return recommendations;
}