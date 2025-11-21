import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const timestamp = new Date().toISOString();
  console.log('🔍 PAYLOAD DEBUG: ===== WEBHOOK RECEIVED =====');
  console.log('🔍 PAYLOAD DEBUG: Timestamp:', timestamp);
  
  try {
    // Get raw request details
    const url = request.url;
    const method = request.method;
    const headers = Object.fromEntries(request.headers.entries());
    
    // Parse the payload
    const payload = await request.json();
    
    console.log('🔍 PAYLOAD DEBUG: Method:', method);
    console.log('🔍 PAYLOAD DEBUG: URL:', url);
    console.log('🔍 PAYLOAD DEBUG: Headers:', headers);
    console.log('🔍 PAYLOAD DEBUG: Payload type:', typeof payload);
    console.log('🔍 PAYLOAD DEBUG: Payload root keys:', Object.keys(payload));
    console.log('🔍 PAYLOAD DEBUG: Complete payload:', JSON.stringify(payload, null, 2));
    
    // Detailed analysis
    if (payload.call) {
      console.log('🔍 PAYLOAD DEBUG: call object keys:', Object.keys(payload.call));
      if (payload.call.assistant) {
        console.log('🔍 PAYLOAD DEBUG: call.assistant keys:', Object.keys(payload.call.assistant));
        console.log('🔍 PAYLOAD DEBUG: call.assistant content:', JSON.stringify(payload.call.assistant, null, 2));
      }
    }
    
    if (payload.assistant) {
      console.log('🔍 PAYLOAD DEBUG: assistant object keys:', Object.keys(payload.assistant));
      console.log('🔍 PAYLOAD DEBUG: assistant content:', JSON.stringify(payload.assistant, null, 2));
    }
    
    // Look for potential assistant ID fields
    const possibleAssistantIds = {
      'payload.assistantId': payload.assistantId,
      'payload.assistant_id': payload.assistant_id,
      'payload.assistant?.id': payload.assistant?.id,
      'payload.call?.assistantId': payload.call?.assistantId,
      'payload.call?.assistant_id': payload.call?.assistant_id,
      'payload.call?.assistant?.id': payload.call?.assistant?.id,
    };
    
    console.log('🔍 PAYLOAD DEBUG: Possible assistant ID locations:', possibleAssistantIds);
    
    // Return debug info
    return NextResponse.json({
      message: 'Payload debugging complete - check Vercel logs!',
      timestamp,
      payload_summary: {
        type: payload.type,
        root_keys: Object.keys(payload),
        has_call: !!payload.call,
        has_assistant: !!payload.assistant,
        call_keys: payload.call ? Object.keys(payload.call) : null,
        assistant_keys: payload.assistant ? Object.keys(payload.assistant) : null,
        possible_assistant_ids: possibleAssistantIds,
        payload_size: JSON.stringify(payload).length
      },
      full_payload: payload
    });
    
  } catch (error) {
    console.error('🔍 PAYLOAD DEBUG: ❌ Error processing webhook:', error);
    return NextResponse.json({
      error: 'Failed to process webhook',
      timestamp,
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Webhook payload debug endpoint - ready to receive POST requests',
    instructions: 'Configure this as webhook URL in Vapi to see payload structure'
  });
}