// Real Call Data Types from Vapi
// These match exactly what Vapi sends in webhooks

export interface VapiCallData {
  id: string; // Vapi call ID
  assistantId: string;
  status: 'queued' | 'ringing' | 'in-progress' | 'forwarding' | 'ended';
  endedReason?: 'customer-ended-call' | 'assistant-ended-call' | 'customer-did-not-answer' | 'assistant-did-not-respond' | 'exceeded-max-duration' | 'unknown-error' | 'pipeline-error-openai-voice-failed' | 'pipeline-error-azure-voice-failed' | 'pipeline-error-elevenlabs-voice-failed';
  
  // Timing data (real)
  createdAt: string; // ISO timestamp
  startedAt?: string; // when call actually started
  endedAt?: string; // when call ended
  duration?: number; // seconds

  // Real conversation data
  transcript?: string;
  recordingUrl?: string;
  summary?: string;
  
  // Real analytics
  analysis?: {
    summary?: string;
    structuredData?: any;
    successEvaluation?: any;
  };
  
  // Cost data (real)
  cost?: number; // USD

  // Phone/caller data
  customer?: {
    number?: string;
  };
  
  // Full raw data backup
  [key: string]: any;
}

// Our database representation
export interface Call {
  id: number;
  vapi_call_id: string;
  vapi_assistant_id: string;
  agent_id: number;
  
  // Timing
  started_at: string;
  ended_at?: string;
  duration_seconds?: number;
  
  // Status
  status: 'queued' | 'ringing' | 'in-progress' | 'forwarding' | 'ended' | 'failed';
  end_reason?: string;
  
  // Caller info
  phone_number?: string;
  caller_name?: string;
  
  // Conversation
  transcript?: string;
  summary?: string;
  recording_url?: string;
  
  // Analytics
  sentiment?: 'positive' | 'negative' | 'neutral';
  intent?: string;
  satisfaction_score?: number;
  
  // Cost
  cost_usd?: number;
  
  // Metadata
  vapi_raw_data?: any;
  created_at: string;
  updated_at: string;
  
  // Relations
  agent?: {
    id: number;
    agent_name: string;
    voice: string;
    model: string;
  };
}

// Call analytics (all real data)
export interface CallAnalytics {
  agent_name: string;
  vapi_assistant_id: string;
  total_calls: number;
  avg_duration_seconds: number;
  avg_satisfaction: number;
  total_cost_usd: number;
  successful_calls: number;
  failed_calls: number;
  positive_calls: number;
  negative_calls: number;
}

// Webhook payload types
export interface VapiWebhookPayload {
  type: 'status-update' | 'end-of-call-report' | 'speech-update' | 'transcript' | 'hang' | 'function-call' | 'tool-calls';
  call?: VapiCallData;
  message?: any;
  timestamp: string;
}