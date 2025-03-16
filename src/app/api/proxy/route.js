import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // Parse the incoming request body
    const body = await request.json();
    
    // Get the WordPress API URL and API key from environment variables
    // Use server-side env vars (not exposed to the client)
    const wpApiUrl = process.env.WORDPRESS_API_URL || 'https://yakkt.com/wp-json';
    const apiKey = process.env.WORDPRESS_API_KEY || '';
    
    console.log('Proxying request to:', `${wpApiUrl}/yakkt/v1/create-order`);
    
    // Set up headers for the WordPress request
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // Add API key if available
    if (apiKey) {
      headers['X-Yakkt-API-Key'] = apiKey;
    }
    
    // Make the request to WordPress
    const wpResponse = await fetch(`${wpApiUrl}/yakkt/v1/create-order`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
    
    // Get the response data
    const responseData = await wpResponse.json();
    
    // If WordPress returned an error
    if (!wpResponse.ok) {
      console.error('WordPress API error:', responseData);
      return NextResponse.json(
        { error: responseData.message || 'Error from WordPress API' }, 
        { status: wpResponse.status }
      );
    }
    
    // Return the successful response
    return NextResponse.json(responseData);
    
  } catch (error) {
    console.error('Proxy server error:', error);
    return NextResponse.json(
      { error: 'Internal server error in proxy' }, 
      { status: 500 }
    );
  }
} 