import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import type { VapiWebhookPayload, VapiCallData } from '@/types/calls';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    
    console.log('🔔 WEBHOOK DEBUG - Full payload structure:');
    console.log('Type:', payload.type);
    console.log('Full payload:', JSON.stringify(payload, null, 2));
    console.log('Call data exists:', !!payload.call);
    console.log('Call structure:', payload.call ? Object.keys(payload.call) : 'no call object');

    // Verify webhook secret (basic security)
    const providedSecret = request.headers.get('x-vapi-secret');
    const expectedSecret = 'vapi_webhook_secret_2024';
    
    if (providedSecret !== expectedSecret) {
      console.log('❌ Invalid webhook secret');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get assistant ID from actual Vapi payload structure (like original webhook)
    const assistantId = payload.call?.assistant?.id || payload.assistant?.id;
    console.log('Assistant ID found:', assistantId);
    
    if (!assistantId) {
      console.log('⚠️ No assistant ID found in payload');
      return NextResponse.json({ error: 'Assistant ID required' }, { status: 400 });
    }

    // If it's a call-end event, let's process it
    if (payload.type === 'call-end') {
      console.log('✅ Processing call-end event for assistant:', assistantId);
      
      // For now, just do the basic functionality that worked
      const supabaseAdmin = createSupabaseAdmin();
      
      // Increment call count (this worked before)
      const { error: countError } = await supabaseAdmin.rpc('increment_call_count', {
        assistant_id: assistantId
      });

      if (countError) {
        console.error('❌ Error incrementing call count:', countError);
      } else {
        console.log('✅ Call count incremented for assistant:', assistantId);
      }

      // TODO: Here we'll add call data fetching once we understand the payload
      console.log('🔄 Would fetch full call data here...');
      
      return NextResponse.json({ 
        message: 'Call processed successfully',
        assistant_id: assistantId,
        type: payload.type
      });
    }

    // For other event types, just log them for now
    console.log('ℹ️ Received event type:', payload.type, '- logging for analysis');
    
    return NextResponse.json({ 
      message: 'Event logged for analysis',
      type: payload.type
    });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


// Handle GET requests for webhook verification
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Vapi webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}