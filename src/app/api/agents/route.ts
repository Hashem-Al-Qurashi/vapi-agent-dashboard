import { NextRequest, NextResponse } from 'next/server';
import { agentService } from '@/lib/database';

const VAPI_BASE_URL = process.env.VAPI_BASE_URL || 'https://api.vapi.ai';
const VAPI_PRIVATE_KEY = process.env.VAPI_PRIVATE_KEY!;

export async function POST(request: NextRequest) {
  console.log('🔧 API: Agent creation request received');
  try {
    const formData = await request.json();
    console.log('🔧 API: Form data received:', formData);
    
    // 1. Create Vapi assistant with advanced configuration
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
        ],
        temperature: formData.modelTemperature || 0.7
      },
      voice: {
        provider: "openai",
        voiceId: formData.voice
      },
      firstMessage: formData.first_message,
      // Advanced Vapi configurations
      ...(formData.maxDurationSeconds && { maxDurationSeconds: formData.maxDurationSeconds }),
      ...(formData.backgroundSound && formData.backgroundSound !== 'none' && { 
        backgroundSound: formData.backgroundSound 
      }),
      ...(formData.backchannelingEnabled !== undefined && { 
        backchannelingEnabled: formData.backchannelingEnabled 
      }),
      ...(formData.backgroundDenoisingEnabled !== undefined && { 
        backgroundDenoisingEnabled: formData.backgroundDenoisingEnabled 
      }),
      ...(formData.endCallFunctionEnabled !== undefined && { 
        endCallFunctionEnabled: formData.endCallFunctionEnabled 
      }),
      ...(formData.endCallPhrases && formData.endCallPhrases.length > 0 && { 
        endCallPhrases: formData.endCallPhrases 
      }),
      ...(formData.interruptionThreshold && { 
        interruptionThreshold: formData.interruptionThreshold 
      }),
      ...(formData.responseDelaySeconds && { 
        responseDelaySeconds: formData.responseDelaySeconds 
      }),
      // Configure webhook for call events
      serverUrl: `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://vapi-agent-dashboard-4kwlolir1-hashem-al-qurashis-projects.vercel.app'}/api/webhook`,
      serverUrlSecret: "vapi_webhook_secret_2024"
    };

    console.log('🔧 API: Sending request to Vapi:', vapiPayload);
    const vapiResponse = await fetch(`${VAPI_BASE_URL}/assistant`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VAPI_PRIVATE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(vapiPayload),
    });

    console.log('🔧 API: Vapi response status:', vapiResponse.status);
    
    if (!vapiResponse.ok) {
      const error = await vapiResponse.text();
      console.error('🔧 API: Vapi API Error:', error);
      return NextResponse.json(
        { error: `Failed to create Vapi assistant: ${error}` },
        { status: vapiResponse.status }
      );
    }

    const vapiAssistant = await vapiResponse.json();
    console.log('🔧 API: Vapi assistant created:', vapiAssistant.id);
    
    // 2. Save to Supabase with Vapi assistant ID
    console.log('🔧 API: Saving to Supabase...');
    const newAgent = await agentService.create({
      agent_name: formData.agent_name,
      vapi_assistant_id: vapiAssistant.id,
      system_prompt: formData.system_prompt,
      first_message: formData.first_message,
      model: formData.model,
      voice: formData.voice,
      call_count: 0
    });

    console.log('🔧 API: Agent saved to database:', newAgent?.id);

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