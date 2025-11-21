const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uetrnajhloqoxknjyzgx.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVldHJuYWpobG9xb3hrbmp5emd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzQ2MjYyNCwiZXhwIjoyMDc5MDM4NjI0fQ.DsGI2mW0nfjy2k6x6TmrUyvc2P_9O4b-3Tpk2rUZFds';

async function testRealDatabase() {
  console.log('🔍 Testing actual database connection...');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // 1. Check if agents exist
    console.log('\n1. Checking agents in database...');
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('id, agent_name, vapi_assistant_id, call_count');
    
    if (agentsError) {
      console.log('❌ Agents table error:', agentsError);
    } else {
      console.log('✅ Found', agents.length, 'agents:');
      agents.forEach(agent => {
        console.log(`  - ${agent.agent_name} (ID: ${agent.id}, Assistant: ${agent.vapi_assistant_id}, Calls: ${agent.call_count})`);
      });
    }
    
    // 2. Check calls table
    console.log('\n2. Checking calls table...');
    const { data: calls, error: callsError } = await supabase
      .from('calls')
      .select('id, vapi_call_id, agent_id, transcript, created_at')
      .limit(5);
    
    if (callsError) {
      console.log('❌ Calls table error:', callsError);
    } else {
      console.log('✅ Found', calls.length, 'calls in database:');
      calls.forEach(call => {
        console.log(`  - Call ${call.vapi_call_id} (Agent: ${call.agent_id}, Has transcript: ${!!call.transcript})`);
      });
    }
    
    // 3. Test increment function if agents exist
    if (agents && agents.length > 0) {
      console.log('\n3. Testing increment function...');
      const testAgent = agents[0];
      const { data: incrementData, error: incrementError } = await supabase.rpc('increment_call_count', {
        assistant_id: testAgent.vapi_assistant_id
      });
      
      if (incrementError) {
        console.log('❌ Increment function error:', incrementError);
      } else {
        console.log('✅ Increment function works!');
      }
    }
    
    // 4. Try to create a test call if agents exist
    if (agents && agents.length > 0) {
      console.log('\n4. Testing call creation...');
      const testAgent = agents[0];
      
      const testCallData = {
        vapi_call_id: `test_${Date.now()}`,
        vapi_assistant_id: testAgent.vapi_assistant_id,
        agent_id: testAgent.id,
        started_at: new Date().toISOString(),
        ended_at: new Date().toISOString(),
        duration_seconds: 30,
        status: 'ended',
        transcript: 'Test transcript: Hello world!',
        summary: 'Test call to verify database functionality.'
      };
      
      const { data: newCall, error: callError } = await supabase
        .from('calls')
        .insert(testCallData)
        .select()
        .single();
      
      if (callError) {
        console.log('❌ Call creation error:', callError);
      } else {
        console.log('✅ Test call created successfully!', newCall.id);
        console.log('   Call ID:', newCall.vapi_call_id);
        console.log('   Transcript:', newCall.transcript);
      }
    }
    
  } catch (error) {
    console.log('❌ Database test failed:', error.message);
  }
}

testRealDatabase();