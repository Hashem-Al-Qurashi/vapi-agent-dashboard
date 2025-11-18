import { supabase, type Agent } from './supabase'

// Re-export Agent type for use in other components
export type { Agent }

// Agent database operations
export const agentService = {
  // Get all agents
  async getAll(): Promise<Agent[]> {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching agents:', error)
      throw error
    }
    
    return data || []
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

  // Delete agent
  async delete(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('agents')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting agent:', error)
      return false
    }
    
    return true
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