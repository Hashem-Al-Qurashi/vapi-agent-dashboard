import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  console.log('🧪 CREATE TEST CALL: Starting test call creation...');
  
  try {
    const supabaseAdmin = createSupabaseAdmin();
    
    // Get first agent from database
    const { data: agents, error: agentsError } = await supabaseAdmin
      .from('agents')
      .select('id, agent_name, vapi_assistant_id')
      .limit(1);
    
    if (agentsError || !agents || agents.length === 0) {
      return NextResponse.json({
        error: 'No agents found in database',
        details: agentsError
      }, { status: 400 });
    }
    
    const agent = agents[0];
    console.log('🧪 Found agent:', agent.agent_name, 'with assistant ID:', agent.vapi_assistant_id);
    
    // Create test call record
    const testCallData = {
      vapi_call_id: `test_call_${Date.now()}`,
      vapi_assistant_id: agent.vapi_assistant_id,
      agent_id: agent.id,
      started_at: new Date(Date.now() - 45000).toISOString(), // 45 seconds ago
      ended_at: new Date().toISOString(),
      duration_seconds: 45,
      status: 'ended',
      end_reason: 'user-ended-call',
      phone_number: '+1234567890',
      transcript: 'User: Hello, can you help me?\nAssistant: Of course! I\'m here to help. What can I assist you with today?\nUser: Just testing the system.\nAssistant: Great! Everything seems to be working perfectly. Have a wonderful day!',
      summary: 'User tested the voice AI system. Brief conversation to verify functionality.',
      sentiment: 'positive',
      intent: 'testing',
      satisfaction_score: 9.2,
      cost_usd: 0.08,
      recording_url: 'https://example.com/test-recording.mp3',
      vapi_raw_data: {
        id: `test_call_${Date.now()}`,
        assistantId: agent.vapi_assistant_id,
        status: 'ended',
        test: true
      }
    };
    
    console.log('🧪 Creating test call record...');
    
    const { data: callRecord, error: callError } = await supabaseAdmin
      .from('calls')
      .insert(testCallData)
      .select()
      .single();
    
    if (callError) {
      console.error('🧪 ❌ Failed to create test call:', callError);
      return NextResponse.json({
        error: 'Failed to create test call',
        details: callError
      }, { status: 500 });
    }
    
    console.log('🧪 ✅ Test call created successfully!', callRecord.id);
    
    // Also test the increment function
    console.log('🧪 Testing increment function...');
    const { error: incrementError } = await supabaseAdmin.rpc('increment_call_count', {
      assistant_id: agent.vapi_assistant_id
    });
    
    return NextResponse.json({
      success: true,
      message: 'Test call created successfully! Check your Call History page.',
      test_call: {
        id: callRecord.id,
        vapi_call_id: callRecord.vapi_call_id,
        agent_name: agent.agent_name,
        transcript_preview: testCallData.transcript.substring(0, 100) + '...',
        created_at: callRecord.created_at
      },
      increment_function_works: !incrementError,
      increment_error: incrementError?.message || null,
      instructions: 'Go to /calls to see the new test call with full transcript!'
    });
    
  } catch (error) {
    console.error('🧪 ❌ Test call creation failed:', error);
    return NextResponse.json({
      error: 'Test call creation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Test call creation endpoint - use POST to create a test call',
    instructions: 'Send POST request to create a test call with transcript'
  });
}