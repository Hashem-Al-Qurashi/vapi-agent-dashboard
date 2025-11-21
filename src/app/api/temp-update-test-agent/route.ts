import { NextRequest, NextResponse } from 'next/server';

const VAPI_BASE_URL = process.env.VAPI_BASE_URL || 'https://api.vapi.ai';
const VAPI_PRIVATE_KEY = process.env.VAPI_PRIVATE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const testAgentId = '4f7f1c42-7c89-411e-9e77-8901fb71581a';
    const monitorUrl = 'https://vapi-agent-dashboard-hashem-al-qurashis-projects.vercel.app/api/webhook-monitor';
    
    console.log('🔧 TEMP UPDATE: Setting test agent webhook to monitor URL...');
    
    const updatePayload = {
      serverUrl: monitorUrl,
      serverUrlSecret: "vapi_webhook_secret_2024"
    };
    
    const response = await fetch(`${VAPI_BASE_URL}/assistant/${testAgentId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${VAPI_PRIVATE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatePayload),
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('🔧 TEMP UPDATE: ✅ Test agent updated to monitor URL');
      
      return NextResponse.json({
        message: 'Test agent temporarily updated to use webhook monitor',
        test_agent_id: testAgentId,
        monitor_url: monitorUrl,
        success: true,
        updated_at: new Date().toISOString(),
        instructions: [
          '1. Make a test call with "test number million for logs" agent',
          '2. Check /api/webhook-monitor for captured requests',
          '3. Use /api/restore-test-agent to restore normal webhook'
        ]
      });
    } else {
      const errorText = await response.text();
      console.error('🔧 TEMP UPDATE: ❌ Failed to update test agent:', errorText);
      
      return NextResponse.json({
        error: 'Failed to update test agent',
        details: errorText,
        status: response.status
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('🔧 TEMP UPDATE: Exception:', error);
    return NextResponse.json({
      error: 'Exception updating test agent',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Temporary test agent webhook updater',
    instructions: 'POST to this endpoint to temporarily set test agent to use webhook monitor'
  });
}