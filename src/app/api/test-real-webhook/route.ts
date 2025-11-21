import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('🔔 REAL WEBHOOK TEST: ===== SIMULATING VAPI WEBHOOK =====');
  
  try {
    // Simulate a real Vapi webhook payload
    const mockVapiPayload = {
      type: 'call-end',
      call: {
        id: 'test_vapi_call_' + Date.now(),
        status: 'ended',
        assistantId: 'test_assistant_id', // This should match a real agent's vapi_assistant_id
        startedAt: new Date().toISOString(),
        endedAt: new Date().toISOString(),
        duration: 67,
        customer: {
          number: '+1234567890'
        },
        artifact: {
          transcript: [
            { role: 'assistant', message: 'Hello! How can I help you today?' },
            { role: 'user', message: 'I need help with my account.' },
            { role: 'assistant', message: 'I\'d be happy to help with your account. Can you tell me more about the issue?' },
            { role: 'user', message: 'I forgot my password.' },
            { role: 'assistant', message: 'I can help you reset your password. Let me guide you through the process.' }
          ],
          recording: 'https://example.com/recording.mp3',
          summary: 'Customer called for password reset assistance. Agent provided step-by-step guidance.'
        },
        analysis: {
          sentiment: 'positive',
          successEvaluation: {
            score: 8.5
          }
        },
        cost: 0.12
      }
    };

    console.log('🔔 REAL WEBHOOK TEST: Sending mock payload to real webhook...');
    
    // Send to the actual webhook endpoint
    const webhookResponse = await fetch(`${request.nextUrl.origin}/api/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-vapi-secret': 'vapi_webhook_secret_2024'
      },
      body: JSON.stringify(mockVapiPayload)
    });
    
    console.log('🔔 REAL WEBHOOK TEST: Webhook response status:', webhookResponse.status);
    const webhookResult = await webhookResponse.json();
    console.log('🔔 REAL WEBHOOK TEST: Webhook response:', webhookResult);
    
    return NextResponse.json({
      success: true,
      message: 'Real webhook test completed',
      webhook_status: webhookResponse.status,
      webhook_response: webhookResult,
      mock_payload: mockVapiPayload,
      next_step: 'Check /calls page to see if the test call appears',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('🔔 REAL WEBHOOK TEST: ❌ Test failed:', error);
    return NextResponse.json({
      error: 'Real webhook test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Real webhook test endpoint - use POST to simulate a Vapi webhook call',
    description: 'This simulates what happens when Vapi sends a call-end webhook'
  });
}