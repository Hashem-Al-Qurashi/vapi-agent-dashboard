-- Call History Schema for Real Vapi Data
-- This stores 100% real call data from Vapi webhooks

CREATE TABLE IF NOT EXISTS calls (
  id SERIAL PRIMARY KEY,
  
  -- Vapi call identifiers
  vapi_call_id VARCHAR(255) UNIQUE NOT NULL,
  vapi_assistant_id VARCHAR(255) NOT NULL,
  
  -- Link to our agents table
  agent_id INTEGER REFERENCES agents(id) ON DELETE CASCADE,
  
  -- Call timing (real data from Vapi)
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER, -- actual call duration
  
  -- Call details (real data)
  status VARCHAR(50) NOT NULL, -- 'in-progress', 'ended', 'failed', etc.
  end_reason VARCHAR(100), -- 'customer-ended-call', 'assistant-ended-call', etc.
  
  -- Caller information (real data)
  phone_number VARCHAR(20),
  caller_name VARCHAR(255),
  
  -- Conversation data (real from Vapi)
  transcript TEXT, -- full conversation transcript
  summary TEXT, -- AI-generated call summary
  recording_url TEXT, -- URL to actual audio recording
  
  -- Real analytics from Vapi
  sentiment VARCHAR(20), -- 'positive', 'negative', 'neutral'
  intent VARCHAR(100), -- detected customer intent
  satisfaction_score DECIMAL(3,1), -- 0.0 to 10.0
  
  -- Real cost data
  cost_usd DECIMAL(10,4), -- actual cost in USD
  
  -- Additional metadata
  vapi_raw_data JSONB, -- store full Vapi response for backup
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_calls_vapi_call_id ON calls(vapi_call_id);
CREATE INDEX IF NOT EXISTS idx_calls_agent_id ON calls(agent_id);
CREATE INDEX IF NOT EXISTS idx_calls_started_at ON calls(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_calls_status ON calls(status);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_calls_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_calls_updated_at
    BEFORE UPDATE ON calls
    FOR EACH ROW
    EXECUTE FUNCTION update_calls_updated_at();

-- Real-time subscription for live call updates
ALTER PUBLICATION supabase_realtime ADD TABLE calls;

-- Sample view for call analytics (all real data)
CREATE OR REPLACE VIEW call_analytics AS
SELECT 
  a.agent_name,
  a.vapi_assistant_id,
  COUNT(c.id) as total_calls,
  AVG(c.duration_seconds) as avg_duration_seconds,
  AVG(c.satisfaction_score) as avg_satisfaction,
  SUM(c.cost_usd) as total_cost_usd,
  COUNT(CASE WHEN c.status = 'ended' THEN 1 END) as successful_calls,
  COUNT(CASE WHEN c.status = 'failed' THEN 1 END) as failed_calls,
  COUNT(CASE WHEN c.sentiment = 'positive' THEN 1 END) as positive_calls,
  COUNT(CASE WHEN c.sentiment = 'negative' THEN 1 END) as negative_calls
FROM agents a
LEFT JOIN calls c ON a.id = c.agent_id
GROUP BY a.id, a.agent_name, a.vapi_assistant_id;

-- Grant permissions
GRANT ALL ON calls TO anon, authenticated;
GRANT ALL ON call_analytics TO anon, authenticated;