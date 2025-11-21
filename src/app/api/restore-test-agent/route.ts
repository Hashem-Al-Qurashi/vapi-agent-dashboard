import { NextRequest, NextResponse } from 'next/server';

const VAPI_BASE_URL = process.env.VAPI_BASE_URL || 'https://api.vapi.ai';
const VAPI_PRIVATE_KEY = process.env.VAPI_PRIVATE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const testAgentId = '4f7f1c42-7c89-411e-9e77-8901fb71581a';
    const normalUrl = 'https://vapi-agent-dashboard-hashem-al-qurashis-projects.vercel.app/api/webhook';
    
    console.log('🔧 RESTORE: Restoring test agent webhook to normal URL...');
    
    const updatePayload = {
      serverUrl: normalUrl,
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
      console.log('🔧 RESTORE: ✅ Test agent restored to normal webhook');
      
      return NextResponse.json({
        message: 'Test agent restored to normal webhook URL',
        test_agent_id: testAgentId,
        webhook_url: normalUrl,
        success: true,
        restored_at: new Date().toISOString()
      });
    } else {
      const errorText = await response.text();
      console.error('🔧 RESTORE: ❌ Failed to restore test agent:', errorText);
      
      return NextResponse.json({
        error: 'Failed to restore test agent',
        details: errorText,
        status: response.status
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('🔧 RESTORE: Exception:', error);
    return NextResponse.json({
      error: 'Exception restoring test agent',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Test agent webhook restorer',
    instructions: 'POST to this endpoint to restore test agent to normal webhook URL'
  });
}