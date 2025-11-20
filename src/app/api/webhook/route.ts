import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import type { VapiWebhookPayload, VapiCallData } from '@/types/calls';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    
    console.log('🔔 WEBHOOK DEBUG - Full payload structure:');
    console.log('Type:', payload.type);
    console.log('Full payload:', JSON.stringify(payload, null, 2));
    console.log('Call data exists:', !!payload.call);
    console.log('Call structure:', payload.call ? Object.keys(payload.call) : 'no call object');

    // Verify webhook secret (basic security)
    const providedSecret = request.headers.get('x-vapi-secret');
    const expectedSecret = 'vapi_webhook_secret_2024';
    
    if (providedSecret !== expectedSecret) {
      console.log('❌ Invalid webhook secret');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get assistant ID from actual Vapi payload structure (like original webhook)
    const assistantId = payload.call?.assistant?.id || payload.assistant?.id;
    console.log('Assistant ID found:', assistantId);
    
    if (!assistantId) {
      console.log('⚠️ No assistant ID found in payload');
      return NextResponse.json({ error: 'Assistant ID required' }, { status: 400 });
    }

    // If it's a call-end event, let's process it  
    if (payload.type === 'call-end') {
      console.log('✅ Processing call-end event for assistant:', assistantId);
      
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

      // Get call ID from payload (this is what we need to fetch full data)
      const callId = payload.call?.id;
      console.log('📞 Call ID from webhook:', callId);
      
      if (callId) {
        // Fetch full call data from Vapi API
        try {
          console.log('📡 Fetching full call data from Vapi API...');
          const callResponse = await fetch(`https://api.vapi.ai/call/${callId}`, {
            headers: {
              'Authorization': `Bearer ${process.env.VAPI_PRIVATE_KEY}`,
            },
          });

          if (callResponse.ok) {
            const fullCallData = await callResponse.json();
            console.log('✅ Full call data received:', fullCallData.id, 'Status:', fullCallData.status);
            
            // Store the REAL call data
            await storeRealCallData(fullCallData, agent.id, supabaseAdmin);
          } else {
            console.error('❌ Failed to fetch call data from Vapi:', await callResponse.text());
          }
        } catch (error) {
          console.error('❌ Error fetching call data:', error);
        }
      }

      // Increment call count (keep the working functionality)
      const { error: countError } = await supabaseAdmin.rpc('increment_call_count', {
        assistant_id: assistantId
      });

      if (countError) {
        console.error('❌ Error incrementing call count:', countError);
      } else {
        console.log('✅ Call count incremented for assistant:', assistantId);
      }
      
      return NextResponse.json({ 
        message: 'Call processed successfully',
        assistant_id: assistantId,
        call_id: callId,
        type: payload.type
      });
    }

    // For other event types, just log them for now
    console.log('ℹ️ Received event type:', payload.type, '- logging for analysis');
    
    return NextResponse.json({ 
      message: 'Event logged for analysis',
      type: payload.type
    });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


// Store real call data from Vapi API response
async function storeRealCallData(vapiCallData: any, agentId: number, supabaseAdmin: any) {
  console.log('💾 Storing real call data:', vapiCallData.id);

  const callRecord = {
    vapi_call_id: vapiCallData.id,
    vapi_assistant_id: vapiCallData.assistantId,
    agent_id: agentId,
    
    // Real timing data from Vapi
    started_at: vapiCallData.startedAt || vapiCallData.createdAt,
    ended_at: vapiCallData.endedAt,
    duration_seconds: vapiCallData.duration,
    
    // Real status
    status: vapiCallData.status,
    end_reason: vapiCallData.endedReason,
    
    // Real caller data
    phone_number: vapiCallData.customer?.number,
    
    // Real conversation data
    transcript: vapiCallData.transcript,
    summary: vapiCallData.summary || vapiCallData.analysis?.summary,
    recording_url: vapiCallData.recordingUrl,
    
    // Real analytics
    sentiment: extractSentiment(vapiCallData.analysis),
    intent: extractIntent(vapiCallData.analysis),
    satisfaction_score: extractSatisfaction(vapiCallData.analysis),
    
    // Real cost
    cost_usd: vapiCallData.cost,
    
    // Store full raw data
    vapi_raw_data: vapiCallData
  };

  // Upsert call data
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

  console.log('✅ Real call data stored successfully:', data.id);
  return data;
}

// Extract sentiment from Vapi analysis
function extractSentiment(analysis: any): string | undefined {
  if (!analysis) return undefined;
  if (analysis.sentiment) return analysis.sentiment;
  if (analysis.structuredData?.sentiment) return analysis.structuredData.sentiment;
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

// Extract satisfaction score
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