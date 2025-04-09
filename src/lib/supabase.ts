'use client';

import { createClient } from '@/utils/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

// Set up Supabase URL and anonymous key - logging for debugging
console.log('Supabase Environment Variables:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY (first few chars):', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 10) + '...');

// Make sure we have valid credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

// Initialize the client only on the client side
let supabase: SupabaseClient | null = null;

// Function to get or initialize the Supabase client
const getSupabaseClient = () => {
  if (typeof window === 'undefined') return null;
  if (supabase) return supabase;
  
  supabase = createClient();
  return supabase;
};

export type Build = {
  id?: string;
  title: string;
  description: string;
  author: string;
  author_color: string;
  likes: number;
  selected_options: string[];
  selected_chassis: string;
  selected_option_ids: string[];
  email?: string;
  created_at?: string;
};

export const saveBuild = async (build: Omit<Build, 'id' | 'likes' | 'created_at'>): Promise<{ data: Build | null; error: Error | null }> => {
  const client = getSupabaseClient();
  if (!client) {
    console.error('Supabase client not initialized');
    return { data: null, error: new Error('Supabase client not initialized') };
  }

  try {
    console.log('Attempting to save build to Supabase:', JSON.stringify(build, null, 2));
    
    // Ensure all fields are properly formatted
    const formattedBuild = {
      title: build.title || 'Untitled Build',
      description: build.description || 'No description provided',
      author: build.author || 'Anonymous',
      author_color: build.author_color || '#000000',
      selected_chassis: build.selected_chassis || 'default_chassis',
      likes: 0,
      email: build.email || '',
      selected_options: Array.isArray(build.selected_options) 
        ? build.selected_options.map(opt => String(opt)) 
        : [],
      selected_option_ids: Array.isArray(build.selected_option_ids) 
        ? build.selected_option_ids.map(id => String(id)) 
        : []
    };
    
    console.log('Formatted build data:', JSON.stringify(formattedBuild, null, 2));
    
    // Insert the build
    const { data, error } = await client
      .from('builds')
      .insert(formattedBuild)
      .select()
      .single();
      
    if (error) {
      console.error('Supabase insert error:', error.message);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return { data: null, error: new Error(`Failed to save build: ${error.message}`) };
    }
    
    console.log('Build saved successfully:', data);
    return { data: data as Build, error: null };
  } catch (e) {
    console.error('Exception in saveBuild:', e);
    return { data: null, error: e as Error };
  }
};

export const getCommunityBuilds = async (): Promise<{ data: Build[] | null; error: Error | null }> => {
  console.log('getCommunityBuilds: Starting...');
  
  const client = getSupabaseClient();
  if (!client) {
    console.error('getCommunityBuilds: Supabase client not initialized');
    return { data: [], error: new Error('Supabase client not initialized') };
  }

  try {
    console.log('getCommunityBuilds: Attempting to fetch builds...');
    
    const { data, error, status, statusText } = await client
      .from('builds')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    console.log('getCommunityBuilds: Response status:', status, statusText);
    
    if (error) {
      console.error('getCommunityBuilds: Supabase error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      return { data: [], error: error as Error };
    }

    console.log(`getCommunityBuilds: Success! Found ${data?.length || 0} builds:`, data);
    return { data: data as Build[] | null, error: null };
  } catch (e) {
    console.error('getCommunityBuilds: Exception:', e);
    return { data: [], error: e as Error };
  }
};

export const likeBuild = async (buildId: string): Promise<{ success: boolean; error: Error | null }> => {
  const client = getSupabaseClient();
  if (!client) {
    console.error('Supabase client not initialized');
    return { success: false, error: new Error('Supabase client not initialized') };
  }

  try {
    // First get the current likes
    const { data: build, error: fetchError } = await client
      .from('builds')
      .select('likes')
      .eq('id', buildId)
      .single();

    if (fetchError || !build) {
      console.error('Supabase fetch error:', fetchError);
      return { success: false, error: fetchError as Error | null };
    }
    
    // Then increment the likes
    const { error: updateError } = await client
      .from('builds')
      .update({ likes: (build as { likes: number }).likes + 1 })
      .eq('id', buildId);

    if (updateError) {
      console.error('Supabase update error:', updateError);
      return { success: false, error: updateError as Error };
    }

    return { success: true, error: null };
  } catch (e) {
    console.error('Exception in likeBuild:', e);
    return { success: false, error: e as Error };
  }
};

export const getBuildById = async (buildId: string): Promise<{ data: Build | null; error: Error | null }> => {
  const client = getSupabaseClient();
  if (!client) {
    console.error('Supabase client not initialized');
    return { data: null, error: new Error('Supabase client not initialized') };
  }

  try {
    const { data, error } = await client
      .from('builds')
      .select('*')
      .eq('id', buildId)
      .single();

    if (error) {
      console.error('Supabase select error:', error);
      return { data: null, error: error as Error };
    }

    return { data: data as Build | null, error: null };
  } catch (e) {
    console.error('Exception in getBuildById:', e);
    return { data: null, error: e as Error };
  }
}; 