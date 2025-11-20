import { supabase, type Agent } from './supabase'

// Re-export Agent type for use in other components
export type { Agent }

// Agent database operations
export const agentService = {
  // Get all agents with comprehensive error handling
  async getAll(): Promise<Agent[]> {
    try {
      console.log('=== AGENT SERVICE DEBUG ===');
      console.log('Starting getAll() call...');
      console.log('Supabase client exists:', !!supabase);
      
      console.log('Calling supabase.from("agents").select("*")...');
      const query = supabase.from('agents').select('*').order('created_at', { ascending: false });
      console.log('Query object created:', !!query);
      
      console.log('Executing query...');
      const { data, error } = await query;
      
      console.log('Query completed');
      console.log('Data received:', !!data);
      console.log('Data length:', data?.length);
      console.log('Error occurred:', !!error);
      
      if (error) {
        console.error('=== SUPABASE QUERY ERROR ===');
        console.error('Error object:', error);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        console.error('Error hint:', error.hint);
        console.error('Error code:', error.code);
        throw error;
      }
      
      console.log('Returning data:', data);
      return data || [];
      
    } catch (error) {
      console.error('=== AGENT SERVICE ERROR ===');
      console.error('Caught error in getAll():', error);
      console.error('Error type:', typeof error);
      console.error('Error name:', (error as any)?.name);
      console.error('Error message:', (error as any)?.message);
      console.error('Error stack:', (error as any)?.stack);
      throw error;
    }
  },

  // Get agent by ID
  async getById(id: number): Promise<Agent | null> {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Error fetching agent:', error)
      return null
    }
    
    return data
  },

  // Get agent by Vapi assistant ID (for webhooks)
  async getByVapiId(vapiAssistantId: string): Promise<Agent | null> {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('vapi_assistant_id', vapiAssistantId)
      .single()
    
    if (error) {
      console.error('Error fetching agent by Vapi ID:', error)
      return null
    }
    
    return data
  },

  // Create new agent
  async create(agent: Omit<Agent, 'id' | 'created_at' | 'updated_at'>): Promise<Agent | null> {
    const { data, error } = await supabase
      .from('agents')
      .insert(agent)
      .select()
      .single()
    
    if (error) {
      console.error('Error creating agent:', error)
      throw error
    }
    
    return data
  },

  // Update agent
  async update(id: number, updates: Partial<Agent>): Promise<Agent | null> {
    const { data, error } = await supabase
      .from('agents')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating agent:', error)
      throw error
    }
    
    return data
  },

  // Increment call count (for webhook) - this will be moved to API route later
  async incrementCallCount(vapiAssistantId: string): Promise<boolean> {
    // For now, we'll get current count and increment it
    // Later we'll move this to an API route that uses the stored procedure
    const { data: agent, error: fetchError } = await supabase
      .from('agents')
      .select('call_count')
      .eq('vapi_assistant_id', vapiAssistantId)
      .single()
    
    if (fetchError || !agent) {
      console.error('Error fetching agent for increment:', fetchError)
      return false
    }
    
    const { error: updateError } = await supabase
      .from('agents')
      .update({ call_count: agent.call_count + 1 })
      .eq('vapi_assistant_id', vapiAssistantId)
    
    if (updateError) {
      console.error('Error incrementing call count:', updateError)
      return false
    }
    
    return true
  },

  // Delete agent via API route (handles both Vapi and database)
  async delete(id: number): Promise<boolean> {
    console.log('🗑️ FRONTEND: ===== STARTING AGENT DELETION =====');
    console.log('🗑️ FRONTEND: Agent ID to delete:', id);
    
    try {
      const apiUrl = `/api/agents/${id}`;
      console.log('🗑️ FRONTEND: Making DELETE request to:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('🗑️ FRONTEND: Response received');
      console.log('🗑️ FRONTEND: - Status:', response.status);
      console.log('🗑️ FRONTEND: - Status Text:', response.statusText);
      console.log('🗑️ FRONTEND: - Headers:', Object.fromEntries(response.headers.entries()));

      const result = await response.json();
      console.log('🗑️ FRONTEND: - Response Body:', result);
      
      if (!response.ok) {
        console.error('🗑️ FRONTEND: ❌ DELETE API FAILED');
        console.error('🗑️ FRONTEND: - Status:', response.status);
        console.error('🗑️ FRONTEND: - Error:', result);
        throw new Error(result.error || 'Failed to delete agent');
      }

      console.log('✅ FRONTEND: DELETE API SUCCESS!');
      console.log('✅ FRONTEND: Result:', result.message);
      console.log('✅ FRONTEND: Deleted from database:', result.database_deletion_successful);
      console.log('✅ FRONTEND: Vapi deletion attempted:', result.vapi_deletion_attempted);
      
      return true;
    } catch (error) {
      console.error('🗑️ FRONTEND: ❌ DELETE OPERATION FAILED');
      console.error('🗑️ FRONTEND: - Error type:', typeof error);
      console.error('🗑️ FRONTEND: - Error message:', error instanceof Error ? error.message : error);
      console.error('🗑️ FRONTEND: - Error stack:', error instanceof Error ? error.stack : 'No stack');
      throw error;
    }
  },

  // Search agents
  async search(query: string, modelFilter?: string): Promise<Agent[]> {
    let queryBuilder = supabase
      .from('agents')
      .select('*')
      .ilike('agent_name', `%${query}%`)
    
    if (modelFilter) {
      queryBuilder = queryBuilder.eq('model', modelFilter)
    }
    
    const { data, error } = await queryBuilder.order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error searching agents:', error)
      throw error
    }
    
    return data || []
  }
}

// Real-time subscriptions
export const subscribeToAgents = (callback: (agents: Agent[]) => void) => {
  return supabase
    .channel('agents-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'agents'
      },
      async () => {
        // Fetch updated data when changes occur
        const agents = await agentService.getAll()
        callback(agents)
      }
    )
    .subscribe()
}