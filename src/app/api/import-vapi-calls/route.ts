import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';

const VAPI_BASE_URL = process.env.VAPI_BASE_URL || 'https://api.vapi.ai';
const VAPI_PRIVATE_KEY = process.env.VAPI_PRIVATE_KEY!;

export async function POST(request: NextRequest) {
  console.log('📥 IMPORT: Starting Vapi calls import...');
  
  try {
    // Fetch all calls from Vapi API
    const response = await fetch(`${VAPI_BASE_URL}/call`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VAPI_PRIVATE_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({
        error: `Failed to fetch calls from Vapi API: HTTP ${response.status}`,
        details: errorText
      }, { status: response.status });
    }
    
    const calls = await response.json();
    console.log('📥 IMPORT: Retrieved calls from Vapi:', Array.isArray(calls) ? calls.length : 'unknown count');
    
    const supabaseAdmin = createSupabaseAdmin();
    const importResults = {
      total_calls_found: 0,
      calls_imported: 0,
      calls_updated: 0,
      calls_skipped: 0,
      errors: [] as Array<{ call_id: string; error: string }>,
      imported_call_ids: [] as string[]
    };
    
    const callsArray = Array.isArray(calls) ? calls : (calls.data || []);
    importResults.total_calls_found = callsArray.length;
    
    for (const vapiCall of callsArray) {
      try {
        console.log(`📥 IMPORT: Processing call ${vapiCall.id}`);
        
        // Find the agent in our database
        const { data: agent, error: agentError } = await supabaseAdmin
          .from('agents')
          .select('id, agent_name')
          .eq('vapi_assistant_id', vapiCall.assistantId)
          .single();
        
        if (agentError || !agent) {
          console.log(`📥 IMPORT: ⚠️ Agent not found for assistant ID: ${vapiCall.assistantId}`);
          importResults.calls_skipped++;
          continue;
        }
        
        // Extract transcript from artifact or messages
        let transcript = '';
        if (vapiCall.artifact?.transcript) {
          transcript = vapiCall.artifact.transcript;
        } else if (vapiCall.transcript) {
          transcript = vapiCall.transcript;
        } else if (vapiCall.artifact?.messages) {
          transcript = vapiCall.artifact.messages
            .filter((msg: any) => msg.role !== 'system')
            .map((msg: any) => `${msg.role === 'bot' ? 'Assistant' : 'Customer'}: ${msg.message}`)
            .join('\n');
        }
        
        // Create call record
        const callRecord = {
          vapi_call_id: vapiCall.id,
          vapi_assistant_id: vapiCall.assistantId,
          agent_id: agent.id,
          
          // Timing data
          started_at: vapiCall.startedAt || vapiCall.createdAt,
          ended_at: vapiCall.endedAt,
          duration_seconds: vapiCall.duration || calculateDuration(vapiCall.startedAt, vapiCall.endedAt),
          
          // Call details
          status: vapiCall.status || 'ended',
          end_reason: vapiCall.endedReason,
          
          // Caller info
          phone_number: vapiCall.phoneNumber || vapiCall.customer?.number,
          
          // Conversation data
          transcript: transcript || null,
          summary: vapiCall.summary || vapiCall.analysis?.summary,
          recording_url: vapiCall.recordingUrl || vapiCall.artifact?.recordingUrl,
          
          // Analytics
          sentiment: extractSentiment(vapiCall.analysis),
          intent: extractIntent(vapiCall.analysis),
          satisfaction_score: extractSatisfaction(vapiCall.analysis),
          
          // Cost
          cost_usd: vapiCall.cost,
          
          // Store full raw data
          vapi_raw_data: vapiCall
        };
        
        console.log(`📥 IMPORT: Storing call ${vapiCall.id} for agent ${agent.agent_name}`);
        
        // Upsert call data
        const { data, error } = await supabaseAdmin
          .from('calls')
          .upsert(callRecord, { 
            onConflict: 'vapi_call_id',
            ignoreDuplicates: false 
          })
          .select()
          .single();
        
        if (error) {
          console.error(`📥 IMPORT: ❌ Error storing call ${vapiCall.id}:`, error);
          importResults.errors.push({
            call_id: vapiCall.id,
            error: error.message
          });
        } else {
          console.log(`📥 IMPORT: ✅ Successfully stored call ${vapiCall.id}`);
          importResults.calls_imported++;
          importResults.imported_call_ids.push(vapiCall.id);
          
          // Increment call count
          const { error: countError } = await supabaseAdmin.rpc('increment_call_count', {
            assistant_id: vapiCall.assistantId
          });
          
          if (countError) {
            console.log(`📥 IMPORT: ⚠️ Failed to increment count for ${vapiCall.assistantId}:`, countError.message);
          }
        }
        
      } catch (error) {
        console.error(`📥 IMPORT: Exception processing call ${vapiCall.id}:`, error);
        importResults.errors.push({
          call_id: vapiCall.id || 'unknown',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    console.log('📥 IMPORT: Import complete:', importResults);
    
    return NextResponse.json({
      message: 'Vapi calls import completed',
      timestamp: new Date().toISOString(),
      results: importResults,
      success: importResults.calls_imported > 0
    });
    
  } catch (error) {
    console.error('📥 IMPORT: ❌ Import failed:', error);
    return NextResponse.json({
      error: 'Failed to import Vapi calls',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Vapi calls importer',
    instructions: 'POST to this endpoint to import all calls from Vapi API to database',
    note: 'This will sync all calls from Vapi and populate your call history'
  });
}

function calculateDuration(startedAt: string, endedAt: string): number | null {
  if (!startedAt || !endedAt) return null;
  const start = new Date(startedAt);
  const end = new Date(endedAt);
  return Math.round((end.getTime() - start.getTime()) / 1000);
}

function extractSentiment(analysis: any): string | undefined {
  if (!analysis) return undefined;
  if (analysis.sentiment) return analysis.sentiment;
  if (analysis.structuredData?.sentiment) return analysis.structuredData.sentiment;
  if (analysis.successEvaluation?.score > 7) return 'positive';
  if (analysis.successEvaluation?.score < 4) return 'negative';
  return 'neutral';
}

function extractIntent(analysis: any): string | undefined {
  if (!analysis) return undefined;
  if (analysis.intent) return analysis.intent;
  if (analysis.structuredData?.intent) return analysis.structuredData.intent;
  if (analysis.structuredData?.category) return analysis.structuredData.category;
  return undefined;
}

function extractSatisfaction(analysis: any): number | undefined {
  if (!analysis) return undefined;
  if (analysis.satisfaction) return analysis.satisfaction;
  if (analysis.successEvaluation?.score) return analysis.successEvaluation.score;
  if (analysis.structuredData?.satisfaction) return analysis.structuredData.satisfaction;
  return undefined;
}