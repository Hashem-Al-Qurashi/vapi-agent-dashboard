import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = createSupabaseAdmin();
    
    // Check if calls table exists and what data is in it
    const { data: calls, error } = await supabaseAdmin
      .from('calls')
      .select('*')
      .limit(10);

    if (error) {
      console.error('Error fetching calls for debug:', error);
      return NextResponse.json({
        error: error.message,
        table_exists: false
      });
    }

    return NextResponse.json({
      calls_table_exists: true,
      calls_count: calls?.length || 0,
      sample_calls: calls || [],
      message: 'Debug info for calls table'
    });

  } catch (error) {
    console.error('Debug calls error:', error);
    return NextResponse.json({
      error: 'Failed to check calls table',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}