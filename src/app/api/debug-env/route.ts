import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('🔍 ENV DEBUG: Checking environment variables');
  
  const vercelUrl = process.env.VERCEL_URL;
  const webhookUrl = `https://${vercelUrl || 'vapi-agent-dashboard-hashem-al-qurashis-projects.vercel.app'}/api/webhook`;
  
  return NextResponse.json({
    message: 'Environment variable debug',
    vercel_url_env: vercelUrl,
    vercel_url_exists: !!vercelUrl,
    constructed_webhook_url: webhookUrl,
    all_env_keys: Object.keys(process.env).filter(key => key.includes('VERCEL') || key.includes('VAPI')),
    timestamp: new Date().toISOString()
  });
}