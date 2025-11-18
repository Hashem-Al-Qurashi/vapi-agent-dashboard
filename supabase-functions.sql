-- SQL Functions for Supabase
-- Run this SQL in your Supabase SQL Editor after creating the schema

-- Function to increment call count safely
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