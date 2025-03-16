import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // Parse the incoming request body
    const body = await request.json();
    
    // Use the correct WordPress staging URL
    const wpApiUrl = process.env.WORDPRESS_API_URL || 'https://yakkttest.wpcomstaging.com/wp-json';
    const apiKey = process.env.WORDPRESS_API_KEY || '';
    
    console.log('Proxying request to:', `${wpApiUrl}/yakkt/v1/create-order`);
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
    const wpResponse = await fetch(`${wpApiUrl}/yakkt/v1/create-order`, {
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
    
    // If WordPress returned an error
    if (!wpResponse.ok) {
      console.error('WordPress API error:', responseData);
      return NextResponse.json(
        { error: responseData.message || 'Error from WordPress API', details: responseData }, 
        { status: wpResponse.status }
      );
    }
    
    // Return the successful response
    return NextResponse.json(responseData);
    
  } catch (error) {
    console.error('Proxy server error:', error);
    return NextResponse.json(
      { error: 'Internal server error in proxy', message: error.message, stack: error.stack }, 
      { status: 500 }
    );
  }
} 