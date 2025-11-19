// Call Data Service - 100% Real Data from Vapi
import { supabase } from './supabase';
import type { Call, CallAnalytics } from '@/types/calls';

export class CallService {
  // Get all calls with real data
  async getAll(limit = 50): Promise<Call[]> {
    const { data, error } = await supabase
      .from('calls')
      .select(`
        *,
        agent:agents!agent_id (
          id,
          agent_name,
          voice,
          model
        )
      `)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching calls:', error);
      throw error;
    }

    return data || [];
  }

  // Get calls for specific agent
  async getByAgent(agentId: number): Promise<Call[]> {
    const { data, error } = await supabase
      .from('calls')
      .select(`
        *,
        agent:agents!agent_id (
          id,
          agent_name,
          voice,
          model
        )
      `)
      .eq('agent_id', agentId)
      .order('started_at', { ascending: false });

    if (error) {
      console.error('Error fetching agent calls:', error);
      throw error;
    }

    return data || [];
  }

  // Get single call by ID
  async getById(id: number): Promise<Call | null> {
    const { data, error } = await supabase
      .from('calls')
      .select(`
        *,
        agent:agents!agent_id (
          id,
          agent_name,
          voice,
          model
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching call:', error);
      return null;
    }

    return data;
  }

  // Get call by Vapi call ID
  async getByVapiId(vapiCallId: string): Promise<Call | null> {
    const { data, error } = await supabase
      .from('calls')
      .select(`
        *,
        agent:agents!agent_id (
          id,
          agent_name,
          voice,
          model
        )
      `)
      .eq('vapi_call_id', vapiCallId)
      .single();

    if (error) {
      console.error('Error fetching call by Vapi ID:', error);
      return null;
    }

    return data;
  }

  // Get real analytics for all agents
  async getAnalytics(): Promise<CallAnalytics[]> {
    const { data, error } = await supabase
      .from('call_analytics')
      .select('*')
      .order('total_calls', { ascending: false });

    if (error) {
      console.error('Error fetching call analytics:', error);
      throw error;
    }

    return data || [];
  }

  // Get recent calls (last 24 hours)
  async getRecent(): Promise<Call[]> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { data, error } = await supabase
      .from('calls')
      .select(`
        *,
        agent:agents!agent_id (
          id,
          agent_name,
          voice,
          model
        )
      `)
      .gte('started_at', yesterday.toISOString())
      .order('started_at', { ascending: false });

    if (error) {
      console.error('Error fetching recent calls:', error);
      throw error;
    }

    return data || [];
  }

  // Get live calls (in-progress)
  async getLiveCalls(): Promise<Call[]> {
    const { data, error } = await supabase
      .from('calls')
      .select(`
        *,
        agent:agents!agent_id (
          id,
          agent_name,
          voice,
          model
        )
      `)
      .eq('status', 'in-progress')
      .order('started_at', { ascending: false });

    if (error) {
      console.error('Error fetching live calls:', error);
      throw error;
    }

    return data || [];
  }

  // Search calls by transcript content
  async searchTranscripts(query: string): Promise<Call[]> {
    const { data, error } = await supabase
      .from('calls')
      .select(`
        *,
        agent:agents!agent_id (
          id,
          agent_name,
          voice,
          model
        )
      `)
      .textSearch('transcript', query)
      .order('started_at', { ascending: false });

    if (error) {
      console.error('Error searching transcripts:', error);
      throw error;
    }

    return data || [];
  }

  // Filter calls by various criteria
  async filter(options: {
    agentId?: number;
    status?: string;
    sentiment?: string;
    dateFrom?: string;
    dateTo?: string;
    minDuration?: number;
    maxDuration?: number;
  }): Promise<Call[]> {
    let query = supabase
      .from('calls')
      .select(`
        *,
        agent:agents!agent_id (
          id,
          agent_name,
          voice,
          model
        )
      `);

    if (options.agentId) {
      query = query.eq('agent_id', options.agentId);
    }

    if (options.status) {
      query = query.eq('status', options.status);
    }

    if (options.sentiment) {
      query = query.eq('sentiment', options.sentiment);
    }

    if (options.dateFrom) {
      query = query.gte('started_at', options.dateFrom);
    }

    if (options.dateTo) {
      query = query.lte('started_at', options.dateTo);
    }

    if (options.minDuration) {
      query = query.gte('duration_seconds', options.minDuration);
    }

    if (options.maxDuration) {
      query = query.lte('duration_seconds', options.maxDuration);
    }

    const { data, error } = await query.order('started_at', { ascending: false });

    if (error) {
      console.error('Error filtering calls:', error);
      throw error;
    }

    return data || [];
  }

  // Get call statistics
  async getStats() {
    const { data, error } = await supabase
      .from('calls')
      .select('status, duration_seconds, cost_usd, sentiment, started_at');

    if (error) {
      console.error('Error fetching call stats:', error);
      throw error;
    }

    const calls = data || [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return {
      total: calls.length,
      today: calls.filter((call: any) => new Date(call.started_at) >= today).length,
      thisWeek: calls.filter((call: any) => new Date(call.started_at) >= thisWeek).length,
      
      completed: calls.filter((call: any) => call.status === 'ended').length,
      failed: calls.filter((call: any) => call.status === 'failed').length,
      inProgress: calls.filter((call: any) => call.status === 'in-progress').length,
      
      totalDuration: calls.reduce((sum: number, call: any) => sum + (call.duration_seconds || 0), 0),
      totalCost: calls.reduce((sum: number, call: any) => sum + (call.cost_usd || 0), 0),
      
      positive: calls.filter((call: any) => call.sentiment === 'positive').length,
      negative: calls.filter((call: any) => call.sentiment === 'negative').length,
      neutral: calls.filter((call: any) => call.sentiment === 'neutral').length,
      
      avgDuration: calls.length > 0 ? 
        calls.reduce((sum: number, call: any) => sum + (call.duration_seconds || 0), 0) / calls.length : 0
    };
  }
}

// Export singleton instance
export const callService = new CallService();

// Subscribe to real-time call updates
export function subscribeToCallUpdates(callback: (calls: Call[]) => void) {
  return supabase
    .channel('calls-channel')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'calls'
      },
      async () => {
        // Fetch updated calls when any change occurs
        const calls = await callService.getAll();
        callback(calls);
      }
    )
    .subscribe();
}