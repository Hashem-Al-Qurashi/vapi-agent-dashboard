import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  console.log('🧪 WEBHOOK TEST: ===== TEST WEBHOOK POST =====');
  
  try {
    // Create a test call record to verify the calls table works
    const supabaseAdmin = createSupabaseAdmin();
    
    // First, get a real agent ID for testing
    const { data: agents, error: agentsError } = await supabaseAdmin
      .from('agents')
      .select('id, agent_name, vapi_assistant_id')
      .limit(1);
    
    if (agentsError || !agents || agents.length === 0) {
      return NextResponse.json({
        error: 'No agents found for testing',
        agentsError
      }, { status: 400 });
    }
    
    const testAgent = agents[0];
    
    // Create a test call record
    const testCallData = {
      vapi_call_id: `test_call_${Date.now()}`,
      vapi_assistant_id: testAgent.vapi_assistant_id,
      agent_id: testAgent.id,
      started_at: new Date().toISOString(),
      ended_at: new Date().toISOString(),
      duration_seconds: 45,
      status: 'ended',
      end_reason: 'assistant-ended-call',
      phone_number: '+1234567890',
      transcript: 'Test transcript: Hello, this is a test call to verify the webhook functionality.',
      summary: 'Test call to verify webhook and database integration.',
      sentiment: 'positive',
      intent: 'testing',
      satisfaction_score: 8.5,
      cost_usd: 0.05
    };
    
    console.log('🧪 WEBHOOK TEST: Creating test call record:', testCallData);
    
    const { data: callRecord, error: callError } = await supabaseAdmin
      .from('calls')
      .insert(testCallData)
      .select()
      .single();
    
    if (callError) {
      console.error('🧪 WEBHOOK TEST: ❌ Failed to create test call:', callError);
      return NextResponse.json({
        error: 'Failed to create test call',
        details: callError
      }, { status: 500 });
    }
    
    console.log('🧪 WEBHOOK TEST: ✅ Test call created successfully:', callRecord);
    
    // Test the increment function
    const { error: incrementError } = await supabaseAdmin.rpc('increment_call_count', {
      assistant_id: testAgent.vapi_assistant_id
    });
    
    if (incrementError) {
      console.error('🧪 WEBHOOK TEST: ❌ Increment function failed:', incrementError);
    } else {
      console.log('🧪 WEBHOOK TEST: ✅ Increment function works');
    }
    
    return NextResponse.json({
      success: true,
      message: 'Test webhook POST successful - check /calls page for new test call!',
      test_call_created: callRecord,
      increment_function_works: !incrementError,
      increment_error: incrementError?.message || null,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('🧪 WEBHOOK TEST: ❌ Test failed:', error);
    return NextResponse.json({
      error: 'Webhook test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Webhook test endpoint is active',
    url: request.url,
    timestamp: new Date().toISOString()
  });
}