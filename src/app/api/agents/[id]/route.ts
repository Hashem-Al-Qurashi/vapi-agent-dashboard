import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';

const VAPI_BASE_URL = process.env.VAPI_BASE_URL || 'https://api.vapi.ai';
const VAPI_PRIVATE_KEY = process.env.VAPI_PRIVATE_KEY!;

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('🗑️ API: ===== AGENT DELETION REQUEST START =====');
  
  const resolvedParams = await params;
  console.log('🗑️ API: Delete agent request for ID:', resolvedParams.id);
  console.log('🗑️ API: Request method:', request.method);
  console.log('🗑️ API: Request headers:', Object.fromEntries(request.headers.entries()));
  
  try {
    const agentId = parseInt(resolvedParams.id);
    console.log('🗑️ API: Parsed agent ID:', agentId);
    
    // Check environment variables
    console.log('🗑️ API: VAPI_BASE_URL:', VAPI_BASE_URL);
    console.log('🗑️ API: VAPI_PRIVATE_KEY exists:', !!VAPI_PRIVATE_KEY);
    console.log('🗑️ API: VAPI_PRIVATE_KEY length:', VAPI_PRIVATE_KEY?.length);
    console.log('🗑️ API: VAPI_PRIVATE_KEY first 10 chars:', VAPI_PRIVATE_KEY?.substring(0, 10));
    
    // Use admin client for server-side operations
    const supabaseAdmin = createSupabaseAdmin();
    console.log('🗑️ API: Supabase admin client created');
    
    // First, get the agent to find the Vapi assistant ID
    console.log('🗑️ API: Fetching agent from database...');
    const { data: agent, error: fetchError } = await supabaseAdmin
      .from('agents')
      .select('vapi_assistant_id, agent_name')
      .eq('id', agentId)
      .single();

    console.log('🗑️ API: Database query result:', { agent, fetchError });

    if (fetchError || !agent) {
      console.error('🗑️ API: Agent not found:', fetchError);
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    console.log('🗑️ API: Found agent to delete:');
    console.log('🗑️ API: - Agent Name:', agent.agent_name);
    console.log('🗑️ API: - Vapi Assistant ID:', agent.vapi_assistant_id);

    // Delete from Vapi first
    console.log('🗑️ API: ===== STARTING VAPI DELETION =====');
    const vapiUrl = `${VAPI_BASE_URL}/assistant/${agent.vapi_assistant_id}`;
    console.log('🗑️ API: Vapi DELETE URL:', vapiUrl);
    
    const vapiHeaders = {
      'Authorization': `Bearer ${VAPI_PRIVATE_KEY}`,
      'Content-Type': 'application/json',
    };
    console.log('🗑️ API: Vapi headers:', { 
      'Authorization': `Bearer ${VAPI_PRIVATE_KEY?.substring(0, 10)}...`,
      'Content-Type': 'application/json'
    });

    try {
      console.log('🗑️ API: Making DELETE request to Vapi...');
      const vapiResponse = await fetch(vapiUrl, {
        method: 'DELETE',
        headers: vapiHeaders,
      });

      console.log('🗑️ API: Vapi response received');
      console.log('🗑️ API: - Status:', vapiResponse.status);
      console.log('🗑️ API: - Status Text:', vapiResponse.statusText);
      console.log('🗑️ API: - Headers:', Object.fromEntries(vapiResponse.headers.entries()));

      const responseText = await vapiResponse.text();
      console.log('🗑️ API: - Response Body:', responseText);

      if (!vapiResponse.ok) {
        console.error('🗑️ API: ❌ VAPI DELETION FAILED');
        console.error('🗑️ API: - Status:', vapiResponse.status);
        console.error('🗑️ API: - Response:', responseText);
        
        // Try to parse error if JSON
        try {
          const errorJson = JSON.parse(responseText);
          console.error('🗑️ API: - Parsed Error:', errorJson);
        } catch (e) {
          console.error('🗑️ API: - Raw Error Text:', responseText);
        }
        
        // Continue with database deletion even if Vapi fails
      } else {
        console.log('✅ VAPI DELETION SUCCESSFUL!');
        console.log('✅ Agent deleted from Vapi account:', agent.vapi_assistant_id);
      }
    } catch (vapiError) {
      console.error('🗑️ API: ❌ VAPI REQUEST EXCEPTION:', vapiError);
      console.error('🗑️ API: - Error type:', typeof vapiError);
      console.error('🗑️ API: - Error message:', vapiError instanceof Error ? vapiError.message : vapiError);
      console.error('🗑️ API: - Error stack:', vapiError instanceof Error ? vapiError.stack : 'No stack');
    }

    // Delete from our database
    console.log('🗑️ API: ===== STARTING DATABASE DELETION =====');
    console.log('🗑️ API: Deleting agent ID', agentId, 'from database...');
    
    const { data: deleteResult, error: deleteError } = await supabaseAdmin
      .from('agents')
      .delete()
      .eq('id', agentId)
      .select();

    console.log('🗑️ API: Database deletion result:', { deleteResult, deleteError });

    if (deleteError) {
      console.error('🗑️ API: ❌ DATABASE DELETION FAILED');
      console.error('🗑️ API: - Error code:', deleteError.code);
      console.error('🗑️ API: - Error message:', deleteError.message);
      console.error('🗑️ API: - Error details:', deleteError.details);
      console.error('🗑️ API: - Error hint:', deleteError.hint);
      
      return NextResponse.json({ 
        error: 'Failed to delete from database',
        details: deleteError.message
      }, { status: 500 });
    }

    console.log('✅ DATABASE DELETION SUCCESSFUL!');
    console.log('✅ Deleted agent data:', deleteResult);
    
    console.log('🗑️ API: ===== AGENT DELETION COMPLETE =====');
    console.log('🗑️ API: Summary:');
    console.log('🗑️ API: - Agent Name:', agent.agent_name);
    console.log('🗑️ API: - Local ID:', agentId, '(deleted)');
    console.log('🗑️ API: - Vapi ID:', agent.vapi_assistant_id, '(attempted deletion)');
    
    return NextResponse.json({ 
      success: true,
      message: `Agent "${agent.agent_name}" deleted successfully`,
      deleted_agent_id: agentId,
      deleted_vapi_id: agent.vapi_assistant_id,
      vapi_deletion_attempted: true,
      database_deletion_successful: true
    });

  } catch (error) {
    console.error('🗑️ API: Error in delete operation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}