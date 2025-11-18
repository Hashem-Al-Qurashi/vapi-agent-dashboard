import { AgentFormData } from '@/components/CreateAgentForm';

const VAPI_BASE_URL = process.env.VAPI_BASE_URL || 'https://api.vapi.ai';
const VAPI_PRIVATE_KEY = process.env.VAPI_PRIVATE_KEY!;

export interface VapiAssistant {
  id: string;
  name: string;
  model: {
    provider: string;
    model: string;
    systemMessage: string;
  };
  voice: {
    provider: string;
    voiceId: string;
  };
  firstMessage: string;
}

export const vapiService = {
  // Create a new Vapi assistant
  async createAssistant(formData: AgentFormData): Promise<VapiAssistant> {
    const payload = {
      name: formData.agent_name,
      model: {
        provider: "openai",
        model: formData.model,
        systemMessage: formData.system_prompt
      },
      voice: {
        provider: "11labs", // or "openai" depending on voice
        voiceId: formData.voice
      },
      firstMessage: formData.first_message,
      // Add webhook configuration
      serverUrl: `${window.location.origin}/api/webhook`,
      serverUrlSecret: "vapi_webhook_secret_2024"
    };

    const response = await fetch(`${VAPI_BASE_URL}/assistant`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VAPI_PRIVATE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create Vapi assistant: ${error}`);
    }

    return await response.json();
  },

  // Get assistant by ID
  async getAssistant(assistantId: string): Promise<VapiAssistant> {
    const response = await fetch(`${VAPI_BASE_URL}/assistant/${assistantId}`, {
      headers: {
        'Authorization': `Bearer ${VAPI_PRIVATE_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Vapi assistant');
    }

    return await response.json();
  },

  // Update assistant
  async updateAssistant(assistantId: string, updates: Partial<AgentFormData>): Promise<VapiAssistant> {
    const payload = {
      ...(updates.agent_name && { name: updates.agent_name }),
      ...(updates.system_prompt && { 
        model: { 
          provider: "openai", 
          systemMessage: updates.system_prompt 
        } 
      }),
      ...(updates.first_message && { firstMessage: updates.first_message }),
      ...(updates.model && { 
        model: { 
          provider: "openai", 
          model: updates.model 
        } 
      }),
      ...(updates.voice && { 
        voice: { 
          provider: "11labs", 
          voiceId: updates.voice 
        } 
      })
    };

    const response = await fetch(`${VAPI_BASE_URL}/assistant/${assistantId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${VAPI_PRIVATE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Failed to update Vapi assistant');
    }

    return await response.json();
  },

  // Delete assistant
  async deleteAssistant(assistantId: string): Promise<void> {
    const response = await fetch(`${VAPI_BASE_URL}/assistant/${assistantId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${VAPI_PRIVATE_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete Vapi assistant');
    }
  }
};