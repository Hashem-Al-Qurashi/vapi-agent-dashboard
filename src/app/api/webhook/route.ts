import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import type { VapiWebhookPayload, VapiCallData } from '@/types/calls';

export async function POST(request: NextRequest) {
  console.log('🔔 WEBHOOK: ===== WEBHOOK REQUEST RECEIVED =====');
  console.log('🔔 WEBHOOK: Timestamp:', new Date().toISOString());
  console.log('🔔 WEBHOOK: Request method:', request.method);
  console.log('🔔 WEBHOOK: Request URL:', request.url);
  console.log('🔔 WEBHOOK: Request headers:', Object.fromEntries(request.headers.entries()));
  
  try {
    const payload = await request.json();
    
    console.log('🔔 WEBHOOK: ===== PAYLOAD ANALYSIS =====');
    console.log('🔔 WEBHOOK: Payload type:', typeof payload);
    console.log('🔔 WEBHOOK: Payload keys:', Object.keys(payload));
    console.log('🔔 WEBHOOK: Event type:', payload.type);
    console.log('🔔 WEBHOOK: Call data exists:', !!payload.call);
    
    if (payload.call) {
      console.log('🔔 WEBHOOK: Call object keys:', Object.keys(payload.call));
      console.log('🔔 WEBHOOK: Call ID:', payload.call.id);
      console.log('🔔 WEBHOOK: Call status:', payload.call.status);
      console.log('🔔 WEBHOOK: Call structure:', JSON.stringify(payload.call, null, 2));
    }
    
    console.log('🔔 WEBHOOK: Full payload (complete):', JSON.stringify(payload, null, 2));

    // Verify webhook secret (TEMPORARILY DISABLED FOR DEBUGGING)
    const providedSecret = request.headers.get('x-vapi-secret');
    const expectedSecret = 'vapi_webhook_secret_2024';
    
    console.log('🔔 WEBHOOK: Secret check:');
    console.log('🔔 WEBHOOK: - Provided secret:', providedSecret);
    console.log('🔔 WEBHOOK: - Expected secret:', expectedSecret);
    console.log('🔔 WEBHOOK: - Secrets match:', providedSecret === expectedSecret);
    
    // TEMPORARILY ALLOW ALL REQUESTS FOR DEBUGGING
    if (providedSecret !== expectedSecret) {
      console.log('⚠️ WEBHOOK: Secret mismatch - allowing for debugging');
      // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      console.log('🔔 WEBHOOK: ===== PROCESSING CALL-END EVENT =====');
      console.log('🔔 WEBHOOK: Assistant ID:', assistantId);
      
      const supabaseAdmin = createSupabaseAdmin();
      console.log('🔔 WEBHOOK: Supabase admin client created');
      
      // Find the agent in our database
      console.log('🔔 WEBHOOK: Looking up agent in database...');
      const { data: agent, error: agentError } = await supabaseAdmin
        .from('agents')
        .select('id, agent_name')
        .eq('vapi_assistant_id', assistantId)
        .single();

      console.log('🔔 WEBHOOK: Agent lookup result:', { agent, agentError });

      if (agentError || !agent) {
        console.error('🔔 WEBHOOK: ❌ Agent not found for assistant ID:', assistantId);
        console.error('🔔 WEBHOOK: Error details:', agentError);
        return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
      }

      console.log('🔔 WEBHOOK: ✅ Found agent:', agent.agent_name, 'ID:', agent.id);

      // Get call ID from payload
      const callId = payload.call?.id;
      console.log('🔔 WEBHOOK: Call ID from webhook payload:', callId);
      
      // Check if call data is in webhook payload (new structure per Vapi docs)
      console.log('🔔 WEBHOOK: ===== ANALYZING CALL DATA IN PAYLOAD =====');
      
      if (payload.call) {
        console.log('🔔 WEBHOOK: Call object exists in payload');
        console.log('🔔 WEBHOOK: Call object keys:', Object.keys(payload.call));
        
        // Check for artifact data (per Vapi docs)
        if (payload.call.artifact) {
          console.log('🔔 WEBHOOK: ✅ Artifact data found in payload!');
          console.log('🔔 WEBHOOK: Artifact keys:', Object.keys(payload.call.artifact));
          console.log('🔔 WEBHOOK: Recording URL:', payload.call.artifact.recording);
          console.log('🔔 WEBHOOK: Transcript exists:', !!payload.call.artifact.transcript);
          console.log('🔔 WEBHOOK: Messages exists:', !!payload.call.artifact.messages);
          
          // Store call data directly from webhook payload
          await storeRealCallDataFromPayload(payload.call, agent.id, supabaseAdmin);
        } else {
          console.log('🔔 WEBHOOK: No artifact in payload, fetching from Vapi API...');
          
          if (callId) {
            // Fetch full call data from Vapi API as fallback
            try {
              console.log('🔔 WEBHOOK: 📡 Fetching call data from Vapi API...');
              const callResponse = await fetch(`https://api.vapi.ai/call/${callId}`, {
                headers: {
                  'Authorization': `Bearer ${process.env.VAPI_PRIVATE_KEY}`,
                },
              });

              console.log('🔔 WEBHOOK: Vapi API response status:', callResponse.status);

              if (callResponse.ok) {
                const fullCallData = await callResponse.json();
                console.log('🔔 WEBHOOK: ✅ Full call data from API:', fullCallData.id);
                console.log('🔔 WEBHOOK: API data keys:', Object.keys(fullCallData));
                
                await storeRealCallDataFromAPI(fullCallData, agent.id, supabaseAdmin);
              } else {
                const errorText = await callResponse.text();
                console.error('🔔 WEBHOOK: ❌ Failed to fetch from Vapi API:', errorText);
              }
            } catch (error) {
              console.error('🔔 WEBHOOK: ❌ API fetch error:', error);
            }
          }
        }
      } else {
        console.log('🔔 WEBHOOK: ⚠️ No call object in payload');
      }

      // Increment call count (keep the working functionality)
      console.log('🔔 WEBHOOK: Incrementing call count...');
      const { error: countError } = await supabaseAdmin.rpc('increment_call_count', {
        assistant_id: assistantId
      });

      if (countError) {
        console.error('🔔 WEBHOOK: ❌ Error incrementing call count:', countError);
      } else {
        console.log('🔔 WEBHOOK: ✅ Call count incremented for assistant:', assistantId);
      }
      
      console.log('🔔 WEBHOOK: ===== CALL-END PROCESSING COMPLETE =====');
      return NextResponse.json({ 
        message: 'Call processed successfully',
        assistant_id: assistantId,
        agent_id: agent.id,
        call_id: callId,
        type: payload.type,
        webhook_processed: true
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


// Store call data directly from webhook payload (when artifact exists)
async function storeRealCallDataFromPayload(callData: any, agentId: number, supabaseAdmin: any) {
  console.log('💾 WEBHOOK: ===== STORING CALL DATA FROM PAYLOAD =====');
  console.log('💾 WEBHOOK: Call ID:', callData.id);
  console.log('💾 WEBHOOK: Agent ID:', agentId);
  
  // Extract transcript from artifact (per Vapi docs)
  let transcript = '';
  if (callData.artifact?.transcript && Array.isArray(callData.artifact.transcript)) {
    console.log('💾 WEBHOOK: Processing transcript array...');
    transcript = callData.artifact.transcript
      .map((msg: any) => `${msg.role}: ${msg.message}`)
      .join('\n');
    console.log('💾 WEBHOOK: Formatted transcript length:', transcript.length);
  } else if (callData.artifact?.messages && Array.isArray(callData.artifact.messages)) {
    console.log('💾 WEBHOOK: Processing messages array...');
    transcript = callData.artifact.messages
      .map((msg: any) => `${msg.role}: ${msg.content || msg.message}`)
      .join('\n');
    console.log('💾 WEBHOOK: Formatted transcript from messages length:', transcript.length);
  }

  const callRecord = {
    vapi_call_id: callData.id,
    vapi_assistant_id: callData.assistantId,
    agent_id: agentId,
    
    // Real timing data
    started_at: callData.startedAt || callData.createdAt || new Date().toISOString(),
    ended_at: callData.endedAt,
    duration_seconds: callData.duration,
    
    // Real status
    status: callData.status || 'ended',
    end_reason: callData.endedReason,
    
    // Real caller data
    phone_number: callData.customer?.number,
    
    // Real conversation data from artifact
    transcript: transcript || null,
    summary: callData.analysis?.summary || callData.artifact?.summary,
    recording_url: callData.artifact?.recording,
    
    // Real analytics
    sentiment: extractSentiment(callData.analysis),
    intent: extractIntent(callData.analysis),
    satisfaction_score: extractSatisfaction(callData.analysis),
    
    // Real cost
    cost_usd: callData.cost,
    
    // Store full raw data
    vapi_raw_data: callData
  };

  console.log('💾 WEBHOOK: Call record to store:', callRecord);
  console.log('💾 WEBHOOK: - Has transcript:', !!callRecord.transcript);
  console.log('💾 WEBHOOK: - Has recording:', !!callRecord.recording_url);
  console.log('💾 WEBHOOK: - Has summary:', !!callRecord.summary);

  // Store in database
  const { data, error } = await supabaseAdmin
    .from('calls')
    .upsert(callRecord, { 
      onConflict: 'vapi_call_id',
      ignoreDuplicates: false 
    })
    .select()
    .single();

  if (error) {
    console.error('💾 WEBHOOK: ❌ Database storage error:', error);
    throw error;
  }

  console.log('💾 WEBHOOK: ✅ Call stored successfully!');
  console.log('💾 WEBHOOK: Database ID:', data.id);
  console.log('💾 WEBHOOK: ===== CALL DATA STORAGE COMPLETE =====');
  return data;
}

// Store call data from Vapi API response (fallback method)
async function storeRealCallDataFromAPI(vapiCallData: any, agentId: number, supabaseAdmin: any) {
  console.log('💾 API: ===== STORING CALL DATA FROM VAPI API =====');
  console.log('💾 API: Call ID:', vapiCallData.id);

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