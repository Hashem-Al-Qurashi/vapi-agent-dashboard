import { NextRequest, NextResponse } from 'next/server';
import { agentService } from '@/lib/database';

const VAPI_BASE_URL = process.env.VAPI_BASE_URL || 'https://api.vapi.ai';
const VAPI_PRIVATE_KEY = process.env.VAPI_PRIVATE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json();
    
    // 1. Create Vapi assistant using correct payload structure
    const vapiPayload = {
      name: formData.agent_name,
      model: {
        provider: "openai",
        model: formData.model,
        messages: [
          {
            role: "system",
            content: formData.system_prompt
          }
        ]
      },
      voice: {
        provider: "openai",
        voiceId: formData.voice
      },
      firstMessage: formData.first_message,
      // Configure webhook for call events
      serverUrl: `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://vapi-agent-dashboard-ocnrs1whw-hashem-al-qurashis-projects.vercel.app'}/api/webhook`,
      serverUrlSecret: "vapi_webhook_secret_2024"
    };

    const vapiResponse = await fetch(`${VAPI_BASE_URL}/assistant`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VAPI_PRIVATE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(vapiPayload),
    });

    if (!vapiResponse.ok) {
      const error = await vapiResponse.text();
      console.error('Vapi API Error:', error);
      return NextResponse.json(
        { error: `Failed to create Vapi assistant: ${error}` },
        { status: vapiResponse.status }
      );
    }

    const vapiAssistant = await vapiResponse.json();
    
    // 2. Save to Supabase with Vapi assistant ID
    const newAgent = await agentService.create({
      agent_name: formData.agent_name,
      vapi_assistant_id: vapiAssistant.id,
      system_prompt: formData.system_prompt,
      first_message: formData.first_message,
      model: formData.model,
      voice: formData.voice,
      call_count: 0
    });

    return NextResponse.json({ 
      success: true, 
      agent: newAgent,
      vapi_assistant: vapiAssistant 
    });

  } catch (error) {
    console.error('Error in agent creation API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}