import { NextRequest, NextResponse } from 'next/server';

// This endpoint will capture ALL requests to help debug webhook issues
let allRequests: any[] = [];
const MAX_REQUESTS = 100;

export async function POST(request: NextRequest) {
  const timestamp = new Date().toISOString();
  console.log('🔍 MONITOR: ===== REQUEST RECEIVED =====');
  console.log('🔍 MONITOR: Timestamp:', timestamp);
  
  try {
    // Capture everything about the request
    const url = request.url;
    const method = request.method;
    const headers = Object.fromEntries(request.headers.entries());
    
    // Try to parse body
    let body = null;
    let bodyText = '';
    try {
      bodyText = await request.text();
      if (bodyText) {
        body = JSON.parse(bodyText);
      }
    } catch (e) {
      console.log('🔍 MONITOR: Could not parse body as JSON:', bodyText);
      body = { raw_text: bodyText, parse_error: String(e) };
    }
    
    const requestInfo = {
      timestamp,
      method,
      url,
      headers,
      body,
      bodyText,
      user_agent: headers['user-agent'],
      content_type: headers['content-type'],
      content_length: headers['content-length'],
      x_vapi_secret: headers['x-vapi-secret'],
      authorization: headers['authorization'],
      origin: headers['origin'],
      referer: headers['referer'],
      ip: headers['x-forwarded-for'] || headers['x-real-ip'],
      vercel_forwarded_for: headers['x-vercel-forwarded-for']
    };
    
    // Store request
    allRequests.unshift(requestInfo);
    if (allRequests.length > MAX_REQUESTS) {
      allRequests = allRequests.slice(0, MAX_REQUESTS);
    }
    
    console.log('🔍 MONITOR: Request stored. Total requests:', allRequests.length);
    console.log('🔍 MONITOR: Request info:', JSON.stringify(requestInfo, null, 2));
    
    return NextResponse.json({
      message: 'Request monitored successfully',
      timestamp,
      request_captured: true,
      total_requests: allRequests.length
    });
    
  } catch (error) {
    console.error('🔍 MONITOR: Error capturing request:', error);
    
    const errorInfo = {
      timestamp,
      error: String(error),
      method: request.method,
      url: request.url
    };
    
    allRequests.unshift(errorInfo);
    if (allRequests.length > MAX_REQUESTS) {
      allRequests = allRequests.slice(0, MAX_REQUESTS);
    }
    
    return NextResponse.json({
      message: 'Request monitoring failed',
      timestamp,
      error: String(error)
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Webhook monitor - shows all incoming requests',
    total_requests: allRequests.length,
    all_requests: allRequests,
    monitor_url: request.url,
    instructions: {
      usage: 'Configure Vapi agent webhook to this URL to capture all requests',
      clear: 'Requests are cleared on deployment restart',
      max_stored: MAX_REQUESTS
    },
    timestamp: new Date().toISOString()
  });
}

// Allow any HTTP method for maximum debugging
export async function PUT(request: NextRequest) {
  return POST(request);
}

export async function PATCH(request: NextRequest) {
  return POST(request);
}

export async function DELETE(request: NextRequest) {
  return POST(request);
}