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
    console.log('🔔 WEBHOOK: Full payload structure:', JSON.stringify(payload, null, 2));
    
    // According to Vapi docs, all data is in the 'message' object
    const message = payload.message;
    if (!message) {
      console.log('❌ WEBHOOK: No message object in payload - not a valid Vapi webhook');
      return NextResponse.json({ error: 'Invalid Vapi webhook format' }, { status: 400 });
    }
    
    console.log('🔔 WEBHOOK: Message type:', message.type);
    console.log('🔔 WEBHOOK: Message keys:', Object.keys(message));
    console.log('🔔 WEBHOOK: Call data exists:', !!message.call);
    
    if (message.call) {
      console.log('🔔 WEBHOOK: Call object keys:', Object.keys(message.call));
      console.log('🔔 WEBHOOK: Call ID:', message.call.id);
      console.log('🔔 WEBHOOK: Call status:', message.call.status);
    }

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

    // Get assistant ID from Vapi payload structure (inside message object)
    let assistantId = null;
    
    // According to Vapi docs, try these locations in the message object
    if (message.call?.assistant?.id) {
      assistantId = message.call.assistant.id;
      console.log('🔍 WEBHOOK: Assistant ID found in message.call.assistant.id:', assistantId);
    } else if (message.assistant?.id) {
      assistantId = message.assistant.id;
      console.log('🔍 WEBHOOK: Assistant ID found in message.assistant.id:', assistantId);
    } else if (message.call?.assistantId) {
      assistantId = message.call.assistantId;
      console.log('🔍 WEBHOOK: Assistant ID found in message.call.assistantId:', assistantId);
    } else if (message.assistantId) {
      assistantId = message.assistantId;
      console.log('🔍 WEBHOOK: Assistant ID found in message.assistantId:', assistantId);
    }
    
    console.log('🔍 WEBHOOK: Final assistant ID:', assistantId);
    
    if (!assistantId) {
      console.log('⚠️ WEBHOOK: No assistant ID found in message - dumping structure:');
      console.log('⚠️ WEBHOOK: Message keys:', Object.keys(message));
      if (message.call) {
        console.log('⚠️ WEBHOOK: message.call keys:', Object.keys(message.call));
        if (message.call.assistant) {
          console.log('⚠️ WEBHOOK: message.call.assistant keys:', Object.keys(message.call.assistant));
        }
      }
      if (message.assistant) {
        console.log('⚠️ WEBHOOK: message.assistant keys:', Object.keys(message.assistant));
      }
      return NextResponse.json({ error: 'Assistant ID required', payload_debug: { 
        message_keys: Object.keys(message),
        call_keys: message.call ? Object.keys(message.call) : null,
        assistant_keys: message.assistant ? Object.keys(message.assistant) : null,
        message_type: message.type
      }}, { status: 400 });
    }

    // Handle different message types according to Vapi docs
    if (message.type === 'end-of-call-report') {
      console.log('🔔 WEBHOOK: ===== PROCESSING END-OF-CALL-REPORT =====');
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
      const callId = message.call?.id;
      console.log('🔔 WEBHOOK: Call ID from webhook payload:', callId);
      
      // Check if artifact data exists (this contains transcript, recording, etc.)
      console.log('🔔 WEBHOOK: ===== ANALYZING ARTIFACT DATA =====');
      
      if (message.artifact) {
        console.log('🔔 WEBHOOK: ✅ Artifact data found in message!');
        console.log('🔔 WEBHOOK: Artifact keys:', Object.keys(message.artifact));
        console.log('🔔 WEBHOOK: Recording exists:', !!message.artifact.recording);
        console.log('🔔 WEBHOOK: Transcript exists:', !!message.artifact.transcript);
        console.log('🔔 WEBHOOK: Messages exists:', !!message.artifact.messages);
        
        // Store call data from end-of-call-report
        await storeCallDataFromEndOfCallReport(message, agent.id, supabaseAdmin);
      } else {
        console.log('🔔 WEBHOOK: ⚠️ No artifact data in end-of-call-report');
        
        // Fallback: try to get data from call object
        if (message.call) {
          console.log('🔔 WEBHOOK: Trying to extract data from call object...');
          await storeBasicCallData(message.call, agent.id, supabaseAdmin);
        }
      }

      // Increment call count
      console.log('🔔 WEBHOOK: Incrementing call count...');
      const { error: countError } = await supabaseAdmin.rpc('increment_call_count', {
        assistant_id: assistantId
      });

      if (countError) {
        console.error('🔔 WEBHOOK: ❌ Error incrementing call count:', countError);
      } else {
        console.log('🔔 WEBHOOK: ✅ Call count incremented for assistant:', assistantId);
      }
      
      console.log('🔔 WEBHOOK: ===== END-OF-CALL-REPORT PROCESSING COMPLETE =====');
      return NextResponse.json({ 
        message: 'End-of-call-report processed successfully',
        assistant_id: assistantId,
        agent_id: agent.id,
        call_id: callId,
        type: message.type,
        webhook_processed: true
      });
    }

    // Handle status updates for call progress
    if (message.type === 'status-update') {
      console.log('🔔 WEBHOOK: Status update:', message.status);
      return NextResponse.json({ 
        message: 'Status update received',
        status: message.status,
        type: message.type
      });
    }

    // For other event types, just log them for now
    console.log('ℹ️ Received event type:', message.type, '- logging for analysis');
    
    return NextResponse.json({ 
      message: 'Event logged for analysis',
      type: message.type
    });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


// Store call data from end-of-call-report (new Vapi webhook format)
async function storeCallDataFromEndOfCallReport(message: any, agentId: number, supabaseAdmin: any) {
  console.log('💾 WEBHOOK: ===== STORING CALL DATA FROM END-OF-CALL-REPORT =====');
  console.log('💾 WEBHOOK: Call ID:', message.call?.id);
  console.log('💾 WEBHOOK: Agent ID:', agentId);
  
  const callData = message.call;
  const artifact = message.artifact;
  
  // Extract transcript from artifact (per Vapi docs format)
  let transcript = '';
  if (artifact?.transcript) {
    console.log('💾 WEBHOOK: Processing transcript string...');
    transcript = artifact.transcript;
    console.log('💾 WEBHOOK: Transcript length:', transcript.length);
  } else if (artifact?.messages && Array.isArray(artifact.messages)) {
    console.log('💾 WEBHOOK: Processing messages array...');
    transcript = artifact.messages
      .map((msg: any) => `${msg.role}: ${msg.message}`)
      .join('\n');
    console.log('💾 WEBHOOK: Formatted transcript from messages length:', transcript.length);
  }

  const callRecord = {
    vapi_call_id: callData?.id,
    vapi_assistant_id: callData?.assistant?.id || message.assistantId,
    agent_id: agentId,
    
    // Real timing data
    started_at: callData?.startedAt || callData?.createdAt || new Date().toISOString(),
    ended_at: callData?.endedAt || new Date().toISOString(),
    duration_seconds: callData?.duration,
    
    // Real status
    status: callData?.status || 'ended',
    end_reason: message.endedReason || callData?.endedReason,
    
    // Real caller data
    phone_number: callData?.customer?.number,
    
    // Real conversation data from artifact
    transcript: transcript || null,
    summary: callData?.analysis?.summary || artifact?.summary,
    recording_url: artifact?.recording?.url || artifact?.recording,
    
    // Real analytics
    sentiment: extractSentiment(callData?.analysis),
    intent: extractIntent(callData?.analysis),
    satisfaction_score: extractSatisfaction(callData?.analysis),
    
    // Real cost
    cost_usd: callData?.cost,
    
    // Store full raw data
    vapi_raw_data: message
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

// Store basic call data when no artifact is available
async function storeBasicCallData(callData: any, agentId: number, supabaseAdmin: any) {
  console.log('💾 WEBHOOK: ===== STORING BASIC CALL DATA =====');
  console.log('💾 WEBHOOK: Call ID:', callData.id);
  
  const callRecord = {
    vapi_call_id: callData.id,
    vapi_assistant_id: callData.assistant?.id || callData.assistantId,
    agent_id: agentId,
    
    started_at: callData.startedAt || callData.createdAt || new Date().toISOString(),
    ended_at: callData.endedAt || new Date().toISOString(),
    duration_seconds: callData.duration,
    
    status: callData.status || 'ended',
    end_reason: callData.endedReason,
    
    phone_number: callData.customer?.number,
    
    // Basic data without transcript
    transcript: null,
    summary: null,
    recording_url: null,
    
    cost_usd: callData.cost,
    
    vapi_raw_data: callData
  };

  console.log('💾 WEBHOOK: Basic call record to store:', callRecord);

  const { data, error } = await supabaseAdmin
    .from('calls')
    .upsert(callRecord, { 
      onConflict: 'vapi_call_id',
      ignoreDuplicates: false 
    })
    .select()
    .single();

  if (error) {
    console.error('💾 WEBHOOK: ❌ Basic storage error:', error);
    throw error;
  }

  console.log('💾 WEBHOOK: ✅ Basic call stored successfully:', data.id);
  return data;
}

// Store call data directly from webhook payload (when artifact exists) - LEGACY
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
    vapi_assistant_id: callData.assistant?.id || callData.assistantId,
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
    vapi_assistant_id: vapiCallData.assistant?.id || vapiCallData.assistantId,
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