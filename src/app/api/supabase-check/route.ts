import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    // Log the environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    // Check if environment variables are set
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing Supabase environment variables',
        env: {
          NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? 'Set' : 'Not set',
          NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey ? 'Set' : 'Not set',
        }
      }, { status: 500 });
    }
    
    // Try to create a Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Test connection by counting rows in the builds table
    const { count, error } = await supabase
      .from('builds')
      .select('*', { count: 'exact', head: true });
      
    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: error,
        env: {
          NEXT_PUBLIC_SUPABASE_URL: supabaseUrl.substring(0, 8) + '...',
          NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey.substring(0, 5) + '...',
        }
      }, { status: 500 });
    }
    
    // Try to fetch one build
    const { data, error: fetchError } = await supabase
      .from('builds')
      .select('*')
      .limit(1);
      
    if (fetchError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Error fetching builds: ' + fetchError.message,
        details: fetchError,
        count
      }, { status: 500 });
    }
    
    // Success response
    return NextResponse.json({
      success: true,
      count,
      sampleData: data?.length > 0 ? data[0] : null,
      message: 'Supabase connection successful'
    });
  } catch (e) {
    return NextResponse.json({ 
      success: false, 
      error: e instanceof Error ? e.message : 'Unknown error',
    }, { status: 500 });
  }
} 