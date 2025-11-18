import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Debug environment variables
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key length:', supabaseAnonKey?.length);
console.log('Supabase Key preview:', supabaseAnonKey?.substring(0, 50) + '...');

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Clean the anon key of any potential whitespace/newlines
const cleanAnonKey = supabaseAnonKey.replace(/\s/g, '').trim();

// Client-side Supabase instance
export const supabase = createClient(supabaseUrl, cleanAnonKey)

// Database types based on our schema
export type Agent = {
  id?: number
  agent_name: string
  vapi_assistant_id: string
  system_prompt: string
  first_message: string
  model: string
  voice: string
  call_count: number
  created_at?: string
  updated_at?: string
}

// Server-side admin client (only use in API routes)
export function createSupabaseAdmin() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  }
  
  return createClient(supabaseUrl, serviceRoleKey)
}