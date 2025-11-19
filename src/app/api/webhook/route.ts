import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import type { VapiWebhookPayload, VapiCallData } from '@/types/calls';

export async function POST(request: NextRequest) {
  try {
    const payload: VapiWebhookPayload = await request.json();
    
    console.log('🔔 Webhook received:', payload.type, payload.call?.id || 'no-call-id');

    // Verify webhook secret (basic security)
    const providedSecret = request.headers.get('x-vapi-secret');
    const expectedSecret = 'vapi_webhook_secret_2024';
    
    if (providedSecret !== expectedSecret) {
      console.log('❌ Invalid webhook secret');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get call data from payload
    const callData: VapiCallData | undefined = payload.call;
    
    if (!callData) {
      console.log('⚠️ No call data in webhook payload');
      return NextResponse.json({ error: 'Call data required' }, { status: 400 });
    }

    const assistantId = callData.assistantId;
    if (!assistantId) {
      console.log('⚠️ No assistant ID in call data');
      return NextResponse.json({ error: 'Assistant ID required' }, { status: 400 });
    }

    // Use admin client for server-side operations
    const supabaseAdmin = createSupabaseAdmin();
    
    // Find the agent in our database
    const { data: agent, error: agentError } = await supabaseAdmin
      .from('agents')
      .select('id')
      .eq('vapi_assistant_id', assistantId)
      .single();

    if (agentError || !agent) {
      console.error('❌ Agent not found for assistant ID:', assistantId);
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Process different webhook events
    if (payload.type === 'status-update' || payload.type === 'end-of-call-report') {
      await processCallData(callData, agent.id, supabaseAdmin);
    }

    // Always increment call count for completed calls
    if (callData.status === 'ended') {
      const { error: countError } = await supabaseAdmin.rpc('increment_call_count', {
        assistant_id: assistantId
      });

      if (countError) {
        console.error('❌ Error incrementing call count:', countError);
      } else {
        console.log('✅ Call count incremented for assistant:', assistantId);
      }
    }
    
    return NextResponse.json({ 
      message: 'Call data processed successfully',
      call_id: callData.id,
      assistant_id: assistantId,
      type: payload.type
    });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Process real call data and store in database
async function processCallData(callData: VapiCallData, agentId: number, supabaseAdmin: any) {
  console.log('📊 Processing call data:', callData.id, 'Status:', callData.status);

  // Extract real data from Vapi
  const callRecord = {
    vapi_call_id: callData.id,
    vapi_assistant_id: callData.assistantId,
    agent_id: agentId,
    
    // Real timing data
    started_at: callData.startedAt || callData.createdAt,
    ended_at: callData.endedAt,
    duration_seconds: callData.duration,
    
    // Real status
    status: callData.status,
    end_reason: callData.endedReason,
    
    // Real caller data
    phone_number: callData.customer?.number,
    
    // Real conversation data
    transcript: callData.transcript,
    summary: callData.summary || callData.analysis?.summary,
    recording_url: callData.recordingUrl,
    
    // Real analytics (extract from analysis if available)
    sentiment: extractSentiment(callData.analysis),
    intent: extractIntent(callData.analysis),
    satisfaction_score: extractSatisfaction(callData.analysis),
    
    // Real cost
    cost_usd: callData.cost,
    
    // Store full raw data for backup
    vapi_raw_data: callData
  };

  // Upsert call data (update if exists, insert if new)
  const { data, error } = await supabaseAdmin
    .from('calls')
    .upsert(callRecord, { 
      onConflict: 'vapi_call_id',
      ignoreDuplicates: false 
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Error storing call data:', error);
    throw error;
  }

  console.log('✅ Call data stored:', data.id, 'Duration:', data.duration_seconds, 's');
  return data;
}

// Extract sentiment from Vapi analysis
function extractSentiment(analysis: any): string | undefined {
  if (!analysis) return undefined;
  
  // Check various places Vapi might put sentiment data
  if (analysis.sentiment) return analysis.sentiment;
  if (analysis.structuredData?.sentiment) return analysis.structuredData.sentiment;
  
  // Try to infer from success evaluation or summary
  if (analysis.successEvaluation?.score > 7) return 'positive';
  if (analysis.successEvaluation?.score < 4) return 'negative';
  
  return 'neutral';
}

// Extract intent from Vapi analysis
function extractIntent(analysis: any): string | undefined {
  if (!analysis) return undefined;
  
  if (analysis.intent) return analysis.intent;
  if (analysis.structuredData?.intent) return analysis.structuredData.intent;
  if (analysis.structuredData?.category) return analysis.structuredData.category;
  
  return undefined;
}

// Extract satisfaction score from Vapi analysis
function extractSatisfaction(analysis: any): number | undefined {
  if (!analysis) return undefined;
  
  if (analysis.satisfaction) return analysis.satisfaction;
  if (analysis.successEvaluation?.score) return analysis.successEvaluation.score;
  if (analysis.structuredData?.satisfaction) return analysis.structuredData.satisfaction;
  
  return undefined;
}

// Handle GET requests for webhook verification
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Vapi webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}