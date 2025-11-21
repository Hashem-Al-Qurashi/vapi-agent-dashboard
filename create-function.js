const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uetrnajhloqoxknjyzgx.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVldHJuYWpobG9xb3hrbmp5emd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzQ2MjYyNCwiZXhwIjoyMDc5MDM4NjI0fQ.DsGI2mW0nfjy2k6x6TmrUyvc2P_9O4b-3Tpk2rUZFds';

async function createFunction() {
  console.log('🔧 Creating increment_call_count function...');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const functionSQL = `
    CREATE OR REPLACE FUNCTION increment_call_count(assistant_id TEXT)
    RETURNS VOID AS $$
    BEGIN
      UPDATE agents 
      SET call_count = call_count + 1,
          updated_at = NOW()
      WHERE vapi_assistant_id = assistant_id;
      
      -- If no rows were affected, the assistant doesn't exist
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Agent with vapi_assistant_id % not found', assistant_id;
      END IF;
    END;
    $$ LANGUAGE plpgsql;
  `;
  
  try {
    const { data, error } = await supabase.rpc('exec', { sql: functionSQL });
    
    if (error) {
      console.log('❌ Function creation failed:', error);
      console.log('📝 You need to run this SQL manually in your Supabase SQL Editor:');
      console.log('```sql');
      console.log(functionSQL);
      console.log('```');
    } else {
      console.log('✅ Function created successfully!');
    }
    
    // Test the function
    console.log('\n🧪 Testing the function...');
    const { data: testData, error: testError } = await supabase.rpc('increment_call_count', {
      assistant_id: 'vapi_sample_123'  // Using the first agent's ID
    });
    
    if (testError) {
      console.log('❌ Function test failed:', testError);
    } else {
      console.log('✅ Function works perfectly!');
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log('\n📝 MANUAL ACTION REQUIRED:');
    console.log('Go to your Supabase dashboard > SQL Editor > New Query');
    console.log('Run this SQL:');
    console.log('```sql');
    console.log(functionSQL);
    console.log('```');
  }
}

createFunction();