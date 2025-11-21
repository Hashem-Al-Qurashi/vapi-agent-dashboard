import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Simple test to verify the API routes are working
  return NextResponse.json({
    status: 'working',
    message: 'API routes are functioning correctly',
    timestamp: new Date().toISOString(),
    test_endpoints: {
      debug_calls: '/api/debug-calls',
      create_test_call: '/api/create-test-call',
      webhook: '/api/webhook',
      update_webhooks: '/api/update-webhooks'
    },
    instructions: 'Use POST requests to test call creation and webhook functionality'
  });
}