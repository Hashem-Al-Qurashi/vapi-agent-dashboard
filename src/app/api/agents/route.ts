import { NextRequest, NextResponse } from 'next/server';
import { agentService } from '@/lib/database';

const VAPI_BASE_URL = process.env.VAPI_BASE_URL || 'https://api.vapi.ai';
const VAPI_PRIVATE_KEY = process.env.VAPI_PRIVATE_KEY!;

export async function POST(request: NextRequest) {
  console.log('🔧 API: Agent creation request received');
  try {
    const formData = await request.json();
    console.log('🔧 API: Form data received:', formData);
    
    // 1. Create Vapi assistant with advanced configuration + RECORDING/TRANSCRIPTS
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
      
      // CRITICAL: Enable recording and transcripts (per Vapi docs)
      artifactPlan: {
        recordingEnabled: true,
        recordingFormat: "mp3",
        loggingEnabled: true,
        transcriptPlan: {
          enabled: true,
          assistantName: "Assistant",
          userName: "Customer"
        }
      },
      
      // Analysis plan for call insights
      analysisPlan: {
        summaryPrompt: "Summarize this call in 2-3 sentences highlighting key topics and outcomes.",
        structuredDataPrompt: "Extract key information from this call.",
        structuredDataSchema: {
          type: "object",
          properties: {
            intent: { type: "string", description: "Primary reason for the call" },
            sentiment: { type: "string", enum: ["positive", "negative", "neutral"] },
            satisfaction: { type: "number", minimum: 1, maximum: 10 }
          }
        },
        successEvaluationPrompt: "Rate how well this call achieved its objectives.",
        successEvaluationRubric: "NumericScale"
      },
      
      // Valid Vapi configurations only
      ...(formData.maxDurationSeconds && { maxDurationSeconds: formData.maxDurationSeconds }),
      ...(formData.backgroundSound && formData.backgroundSound !== 'none' && { 
        backgroundSound: formData.backgroundSound 
      }),
      ...(formData.endCallPhrases && formData.endCallPhrases.length > 0 && { 
        endCallPhrases: formData.endCallPhrases 
      }),
      
      // Configure webhook for call events
      serverUrl: `https://${process.env.VERCEL_URL || 'vapi-agent-dashboard-hashem-al-qurashis-projects.vercel.app'}/api/webhook`,
      serverUrlSecret: "vapi_webhook_secret_2024"
    };

    console.log('🔧 API: ===== CREATING VAPI ASSISTANT =====');
    console.log('🔧 API: Environment check:');
    console.log('🔧 API: - VERCEL_URL:', process.env.VERCEL_URL);
    console.log('🔧 API: - Final webhook URL:', vapiPayload.serverUrl);
    console.log('🔧 API: - Webhook secret:', vapiPayload.serverUrlSecret);
    
    console.log('🔧 API: Configuration summary:');
    console.log('🔧 API: - Recording enabled:', vapiPayload.artifactPlan.recordingEnabled);
    console.log('🔧 API: - Transcript enabled:', vapiPayload.artifactPlan.transcriptPlan.enabled);
    console.log('🔧 API: - Analysis enabled:', !!vapiPayload.analysisPlan);
    console.log('🔧 API: - Webhook configured:', !!vapiPayload.serverUrl);
    
    console.log('🔧 API: Full payload to send:', JSON.stringify(vapiPayload, null, 2));
    
    const vapiResponse = await fetch(`${VAPI_BASE_URL}/assistant`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VAPI_PRIVATE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(vapiPayload),
    });

    console.log('🔧 API: ===== VAPI RESPONSE RECEIVED =====');
    console.log('🔧 API: Response status:', vapiResponse.status);
    console.log('🔧 API: Response headers:', Object.fromEntries(vapiResponse.headers.entries()));
    
    const responseText = await vapiResponse.text();
    console.log('🔧 API: Response body:', responseText);
    
    if (!vapiResponse.ok) {
      console.error('🔧 API: ❌ VAPI ASSISTANT CREATION FAILED');
      console.error('🔧 API: Status:', vapiResponse.status);
      console.error('🔧 API: Error:', responseText);
      
      return NextResponse.json(
        { error: `Failed to create Vapi assistant: ${responseText}` },
        { status: vapiResponse.status }
      );
    }

    const vapiAssistant = JSON.parse(responseText);
    console.log('🔧 API: ✅ VAPI ASSISTANT CREATED SUCCESSFULLY!');
    console.log('🔧 API: Assistant ID:', vapiAssistant.id);
    console.log('🔧 API: Assistant name:', vapiAssistant.name);
    console.log('🔧 API: Recording enabled:', vapiAssistant.artifactPlan?.recordingEnabled);
    console.log('🔧 API: Transcript enabled:', vapiAssistant.artifactPlan?.transcriptPlan?.enabled);
    
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