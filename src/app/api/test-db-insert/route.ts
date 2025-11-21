import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  console.log('🧪 DB TEST: Testing database insert with minimal data');
  
  try {
    const supabaseAdmin = createSupabaseAdmin();
    
    // Get an agent for testing
    const { data: agents, error: agentsError } = await supabaseAdmin
      .from('agents')
      .select('id, vapi_assistant_id')
      .limit(1);
    
    if (agentsError || !agents || agents.length === 0) {
      return NextResponse.json({
        error: 'No agents found',
        details: agentsError
      }, { status: 400 });
    }
    
    const testAgent = agents[0];
    
    // Test minimal insert first
    const minimalCallData = {
      vapi_call_id: `minimal_test_${Date.now()}`,
      vapi_assistant_id: testAgent.vapi_assistant_id,
      agent_id: testAgent.id,
      started_at: new Date().toISOString(),
      status: 'ended'
    };
    
    console.log('🧪 DB TEST: Inserting minimal call data:', minimalCallData);
    
    const { data: result1, error: error1 } = await supabaseAdmin
      .from('calls')
      .insert(minimalCallData)
      .select()
      .single();
    
    if (error1) {
      console.error('🧪 DB TEST: ❌ Minimal insert failed:', error1);
      return NextResponse.json({
        step: 'minimal_insert',
        error: error1.message,
        details: error1,
        data_attempted: minimalCallData
      }, { status: 500 });
    }
    
    console.log('🧪 DB TEST: ✅ Minimal insert successful:', result1.id);
    
    // Now test with full data similar to webhook
    const fullCallData = {
      vapi_call_id: `full_test_${Date.now()}`,
      vapi_assistant_id: testAgent.vapi_assistant_id,
      agent_id: testAgent.id,
      started_at: new Date().toISOString(),
      ended_at: new Date().toISOString(),
      duration_seconds: 45,
      status: 'ended',
      end_reason: 'assistant-ended-call',
      phone_number: '+1234567890',
      transcript: 'Test transcript for database testing',
      summary: 'This is a test call to verify database schema',
      sentiment: 'positive',
      intent: 'testing',
      satisfaction_score: 8.5,
      cost_usd: 0.05
    };
    
    console.log('🧪 DB TEST: Inserting full call data...');
    
    const { data: result2, error: error2 } = await supabaseAdmin
      .from('calls')
      .insert(fullCallData)
      .select()
      .single();
    
    if (error2) {
      console.error('🧪 DB TEST: ❌ Full insert failed:', error2);
      return NextResponse.json({
        step: 'full_insert',
        minimal_success: true,
        minimal_id: result1.id,
        error: error2.message,
        details: error2,
        data_attempted: fullCallData
      }, { status: 500 });
    }
    
    console.log('🧪 DB TEST: ✅ Full insert successful:', result2.id);
    
    return NextResponse.json({
      success: true,
      message: 'Both minimal and full database inserts successful!',
      minimal_call_id: result1.id,
      full_call_id: result2.id,
      test_complete: true
    });
    
  } catch (error) {
    console.error('🧪 DB TEST: ❌ Unexpected error:', error);
    return NextResponse.json({
      error: 'Database test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Database insert test endpoint - use POST to run test'
  });
}