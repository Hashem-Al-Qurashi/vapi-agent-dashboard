import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    
    console.log('Webhook received:', payload);

    // Verify webhook secret (basic security)
    const providedSecret = request.headers.get('x-vapi-secret');
    const expectedSecret = 'vapi_webhook_secret_2024';
    
    if (providedSecret !== expectedSecret) {
      console.log('Invalid webhook secret');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract assistant ID from webhook payload
    const assistantId = payload.call?.assistant?.id || payload.assistant?.id;
    
    if (!assistantId) {
      console.log('No assistant ID found in webhook payload');
      return NextResponse.json({ error: 'Assistant ID required' }, { status: 400 });
    }

    // Only process call-end events
    if (payload.type !== 'call-end') {
      console.log('Ignoring non-call-end event:', payload.type);
      return NextResponse.json({ message: 'Event ignored' }, { status: 200 });
    }

    // Use admin client for server-side operations
    const supabaseAdmin = createSupabaseAdmin();
    
    // Increment call count using the stored procedure
    const { error } = await supabaseAdmin.rpc('increment_call_count', {
      assistant_id: assistantId
    });

    if (error) {
      console.error('Error incrementing call count:', error);
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
    }

    console.log(`Successfully incremented call count for assistant: ${assistantId}`);
    
    return NextResponse.json({ 
      message: 'Call count updated successfully',
      assistant_id: assistantId 
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
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