-- Vapi Agents Table Schema
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS agents (
  id BIGSERIAL PRIMARY KEY,
  agent_name TEXT NOT NULL,
  vapi_assistant_id TEXT UNIQUE NOT NULL,
  system_prompt TEXT NOT NULL,
  first_message TEXT NOT NULL,
  model TEXT NOT NULL,
  voice TEXT NOT NULL,
  call_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create an index on vapi_assistant_id for faster webhook lookups
CREATE INDEX IF NOT EXISTS idx_agents_vapi_id ON agents(vapi_assistant_id);

-- Create an index on agent_name for search functionality
CREATE INDEX IF NOT EXISTS idx_agents_name ON agents(agent_name);

-- Enable Row Level Security (RLS)
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (since no auth required per vision document)
CREATE POLICY "Public agents read access" ON agents
  FOR SELECT USING (true);

-- Create policy for public insert/update access
CREATE POLICY "Public agents write access" ON agents
  FOR ALL USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_agents_updated_at ON agents;
CREATE TRIGGER update_agents_updated_at
    BEFORE UPDATE ON agents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing
INSERT INTO agents (agent_name, vapi_assistant_id, system_prompt, first_message, model, voice, call_count) 
VALUES 
  (
    'Customer Support AI',
    'vapi_sample_123',
    'You are a helpful customer support assistant. Be friendly, professional, and solution-oriented.',
    'Hello! I''m here to help you with any questions or concerns. How can I assist you today?',
    'gpt-4',
    'alloy',
    247
  ),
  (
    'Sales Assistant',
    'vapi_sample_456',
    'You are a knowledgeable sales assistant. Help customers understand our products and guide them through the sales process.',
    'Hi there! Welcome to our company. I''d love to learn about your needs and show you how we can help. What brings you here today?',
    'gpt-3.5-turbo',
    'nova',
    89
  ),
  (
    'Appointment Scheduler',
    'vapi_sample_789',
    'You are an efficient appointment scheduling assistant. Help customers book appointments and manage their calendar.',
    'Hello! I can help you schedule an appointment. What service are you looking for and when would work best for you?',
    'gpt-4',
    'shimmer',
    156
  )
ON CONFLICT (vapi_assistant_id) DO NOTHING;