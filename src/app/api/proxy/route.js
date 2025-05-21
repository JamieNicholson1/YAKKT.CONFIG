import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // Parse the incoming request body
    const body = await request.json();
    
    // Use the correct WordPress URL from environment variable
    const wpApiUrl = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 'https://yakkt.com/wp-json';
    const apiKey = process.env.NEXT_PUBLIC_WORDPRESS_API_KEY || '';
    
    // Use the new get-add-url endpoint
    const endpoint = `${wpApiUrl}/yakkt/v1/get-add-url`;
    
    console.log('Proxying request to:', endpoint);
    console.log('Request payload:', JSON.stringify(body));
    
    // Set up headers for the WordPress request
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // Add API key if available
    if (apiKey) {
      headers['X-Yakkt-API-Key'] = apiKey;
      console.log('Using API key for authentication');
    } else {
      console.log('No API key provided');
    }
    
    console.log('Request headers:', JSON.stringify(headers));
    
    // Make the request to WordPress
    const wpResponse = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
    
    console.log('WordPress response status:', wpResponse.status);
    
    // Get the response data
    let responseData;
    try {
      const responseText = await wpResponse.text();
      console.log('WordPress response text:', responseText);
      
      if (responseText.trim()) {
        responseData = JSON.parse(responseText);
      } else {
        console.error('Empty response from WordPress');
        return NextResponse.json(
          { error: 'Empty response from WordPress' }, 
          { status: 500 }
        );
      }
    } catch (error) {
      console.error('Failed to parse response as JSON:', error);
      return NextResponse.json(
        { error: 'Invalid JSON response from WordPress' }, 
        { status: 500 }
      );
    }
    
    // Check for errors
    if (!responseData.success) {
      console.error('WordPress API error:', responseData);
      return NextResponse.json(
        { error: 'WordPress API error', details: responseData }, 
        { status: wpResponse.status }
      );
    }
    
    // Return the URL to the client
    return NextResponse.json({
      success: true,
      addUrl: responseData.addUrl,
      // For backward compatibility
      checkoutUrl: responseData.addUrl
    });
    
  } catch (error) {
    console.error('Error proxying to WordPress:', error);
    return NextResponse.json(
      { error: 'Failed to proxy request to WordPress', message: error.message }, 
      { status: 500 }
    );
  }
} 