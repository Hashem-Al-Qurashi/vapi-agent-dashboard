import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';

const VAPI_BASE_URL = process.env.VAPI_BASE_URL || 'https://api.vapi.ai';
const VAPI_PRIVATE_KEY = process.env.VAPI_PRIVATE_KEY!;

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  console.log('🗑️ API: Delete agent request for ID:', resolvedParams.id);
  
  try {
    const agentId = parseInt(resolvedParams.id);
    
    // Use admin client for server-side operations
    const supabaseAdmin = createSupabaseAdmin();
    
    // First, get the agent to find the Vapi assistant ID
    const { data: agent, error: fetchError } = await supabaseAdmin
      .from('agents')
      .select('vapi_assistant_id, agent_name')
      .eq('id', agentId)
      .single();

    if (fetchError || !agent) {
      console.error('🗑️ API: Agent not found:', fetchError);
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    console.log('🗑️ API: Found agent to delete:', agent.agent_name, 'Vapi ID:', agent.vapi_assistant_id);

    // Delete from Vapi first
    try {
      console.log('🗑️ API: Deleting from Vapi...');
      const vapiResponse = await fetch(`${VAPI_BASE_URL}/assistant/${agent.vapi_assistant_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${VAPI_PRIVATE_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('🗑️ API: Vapi delete response status:', vapiResponse.status);

      if (!vapiResponse.ok) {
        const errorText = await vapiResponse.text();
        console.error('🗑️ API: Failed to delete from Vapi:', errorText);
        
        // Continue with database deletion even if Vapi fails
        // This ensures we can clean up orphaned entries
      } else {
        console.log('✅ Agent deleted from Vapi successfully');
      }
    } catch (vapiError) {
      console.error('🗑️ API: Vapi deletion error:', vapiError);
      // Continue with database deletion
    }

    // Delete from our database
    console.log('🗑️ API: Deleting from database...');
    const { error: deleteError } = await supabaseAdmin
      .from('agents')
      .delete()
      .eq('id', agentId);

    if (deleteError) {
      console.error('🗑️ API: Database deletion error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete from database' }, { status: 500 });
    }

    console.log('✅ Agent deleted from database successfully');
    
    return NextResponse.json({ 
      success: true,
      message: `Agent "${agent.agent_name}" deleted successfully`,
      deleted_agent_id: agentId,
      deleted_vapi_id: agent.vapi_assistant_id
    });

  } catch (error) {
    console.error('🗑️ API: Error in delete operation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}