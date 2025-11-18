import { createClient } from '@supabase/supabase-js'

// Detailed environment variable debugging
console.log('=== SUPABASE ENVIRONMENT DEBUG ===');
console.log('Raw NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Raw NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Detailed debugging
console.log('Supabase URL exists:', !!supabaseUrl);
console.log('Supabase URL value:', supabaseUrl);
console.log('Supabase Key exists:', !!supabaseAnonKey);
console.log('Supabase Key length:', supabaseAnonKey?.length);
console.log('Supabase Key first 50 chars:', supabaseAnonKey?.substring(0, 50));
console.log('Supabase Key last 50 chars:', supabaseAnonKey?.substring(supabaseAnonKey.length - 50));

// Check for problematic characters
console.log('Key contains newlines:', supabaseAnonKey?.includes('\n'));
console.log('Key contains spaces:', supabaseAnonKey?.includes(' '));
console.log('Key contains tabs:', supabaseAnonKey?.includes('\t'));
console.log('Key contains carriage returns:', supabaseAnonKey?.includes('\r'));

// Validate environment variables
if (!supabaseUrl) {
  console.error('ERROR: NEXT_PUBLIC_SUPABASE_URL is missing!');
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  console.error('ERROR: NEXT_PUBLIC_SUPABASE_ANON_KEY is missing!');
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

// Aggressively clean the anon key
console.log('Cleaning anon key...');
const cleanAnonKey = supabaseAnonKey
  .replace(/\n/g, '')  // Remove newlines
  .replace(/\r/g, '')  // Remove carriage returns
  .replace(/\s/g, '')  // Remove all whitespace
  .replace(/\t/g, '')  // Remove tabs
  .trim();

console.log('Cleaned key length:', cleanAnonKey.length);
console.log('Cleaned key preview:', cleanAnonKey.substring(0, 50) + '...');
console.log('Cleaned key equals original:', cleanAnonKey === supabaseAnonKey);

// Create Supabase client with error handling
console.log('Creating Supabase client...');
let supabase: any;

try {
  supabase = createClient(supabaseUrl, cleanAnonKey);
  console.log('Supabase client created successfully');
} catch (error) {
  console.error('ERROR: Failed to create Supabase client:', error);
  throw error;
}

export { supabase };

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