import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';

// Store webhook activity in memory for debugging (resets on deployment)
let webhookActivity: any[] = [];
const MAX_ACTIVITIES = 50;

export async function POST(request: NextRequest) {
  const timestamp = new Date().toISOString();
  console.log('🔍 WEBHOOK DEBUG: Activity received at', timestamp);
  
  try {
    const body = await request.text();
    let parsedBody;
    
    try {
      parsedBody = JSON.parse(body);
    } catch {
      parsedBody = { raw_text: body };
    }
    
    const activity = {
      timestamp,
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries()),
      body: parsedBody,
      user_agent: request.headers.get('user-agent'),
      vapi_secret: request.headers.get('x-vapi-secret'),
      content_type: request.headers.get('content-type')
    };
    
    // Store activity
    webhookActivity.unshift(activity);
    if (webhookActivity.length > MAX_ACTIVITIES) {
      webhookActivity = webhookActivity.slice(0, MAX_ACTIVITIES);
    }
    
    console.log('🔍 WEBHOOK DEBUG: Stored activity', { 
      total_activities: webhookActivity.length,
      has_vapi_secret: !!activity.vapi_secret,
      body_type: typeof parsedBody,
      body_keys: typeof parsedBody === 'object' ? Object.keys(parsedBody) : []
    });
    
    return NextResponse.json({ 
      message: 'Webhook debug activity logged',
      timestamp,
      activity_count: webhookActivity.length
    });
    
  } catch (error) {
    console.error('🔍 WEBHOOK DEBUG: Error logging activity:', error);
    return NextResponse.json({ 
      error: 'Failed to log webhook activity',
      timestamp 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  console.log('🔍 WEBHOOK DEBUG: Retrieving webhook activity log');
  
  try {
    // Also check database for recent calls
    const supabaseAdmin = createSupabaseAdmin();
    const { data: recentCalls, error: callsError } = await supabaseAdmin
      .from('calls')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    return NextResponse.json({
      message: 'Webhook debug information',
      webhook_url: `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://vapi-agent-dashboard-hashem-al-qurashis-projects.vercel.app'}/api/webhook`,
      debug_url: request.url,
      timestamp: new Date().toISOString(),
      
      // Webhook activity log
      webhook_activities: webhookActivity,
      total_logged_activities: webhookActivity.length,
      
      // Database state
      recent_calls: recentCalls || [],
      database_calls_count: recentCalls?.length || 0,
      calls_error: callsError?.message || null,
      
      // Debugging info
      last_webhook_activity: webhookActivity[0] || null,
      has_received_vapi_webhooks: webhookActivity.some(a => a.vapi_secret || a.headers?.['x-vapi-secret']),
      
      instructions: {
        monitor: "Refresh this URL after making calls to see webhook activity",
        test: "POST to /api/webhook-debug to simulate webhook activity",
        clear: "Webhook activity log resets on each deployment"
      }
    });
    
  } catch (error) {
    console.error('🔍 WEBHOOK DEBUG: Error retrieving debug info:', error);
    return NextResponse.json({ 
      error: 'Failed to retrieve debug information',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}