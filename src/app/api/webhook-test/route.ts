import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('🧪 WEBHOOK TEST: Request received!');
  console.log('🧪 WEBHOOK TEST: Headers:', Object.fromEntries(request.headers.entries()));
  
  try {
    const body = await request.json();
    console.log('🧪 WEBHOOK TEST: Body:', body);
  } catch (e) {
    console.log('🧪 WEBHOOK TEST: No JSON body');
  }

  return NextResponse.json({ 
    success: true, 
    message: 'Webhook test endpoint working!',
    timestamp: new Date().toISOString()
  });
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Webhook test endpoint is active',
    url: request.url,
    timestamp: new Date().toISOString()
  });
}