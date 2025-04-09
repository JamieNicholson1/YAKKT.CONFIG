'use client';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const client = createClient(supabaseUrl, supabaseAnonKey);

export type Build = {
  id: string;
  title: string;
  author: string;
  author_color: string;
  selected_options: string[];
  selected_chassis: string;
  selected_option_ids: string[];
  likes: number;
  email?: string;
  created_at: string;
};

export const useSupabase = () => {
  return { supabase: client };
};

export const getBuilds = async () => {
  try {
    const { data, error } = await client
      .from('builds')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (e) {
    return { data: null, error: e as Error };
  }
};

export const saveBuild = async (build: Omit<Build, 'id' | 'created_at'>) => {
  try {
    const { data, error } = await client
      .from('builds')
      .insert([build])
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (e) {
    return { data: null, error: e as Error };
  }
};

export const likeBuild = async (buildId: string) => {
  try {
    const { data, error } = await client
      .from('builds')
      .update({ likes: client.rpc('increment_likes') })
      .eq('id', buildId)
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (e) {
    return { data: null, error: e as Error };
  }
};

export const deleteBuild = async (buildId: string) => {
  try {
    const { error } = await client
      .from('builds')
      .delete()
      .eq('id', buildId);

    if (error) throw error;
    return { error: null };
  } catch (e) {
    return { error: e as Error };
  }
};

export const getCommunityBuilds = async () => {
  try {
    const { data, error } = await client
      .from('builds')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    return { data, error: null };
  } catch (e) {
    return { data: null, error: e as Error };
  }
};

export const getBuildById = async (buildId: string) => {
  try {
    const { data, error } = await client
      .from('builds')
      .select('*')
      .eq('id', buildId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (e) {
    return { data: null, error: e as Error };
  }
}; 