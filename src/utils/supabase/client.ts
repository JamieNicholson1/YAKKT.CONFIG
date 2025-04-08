import { createBrowserClient } from "@supabase/ssr";

// Create a single instance of the client
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;

export const createClient = () => {
  if (supabaseClient) {
    console.log('Returning existing Supabase client');
    return supabaseClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log('Creating new Supabase client with:');
  console.log('URL:', supabaseUrl);
  console.log('Key (first 10 chars):', supabaseKey?.substring(0, 10));

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    return null;
  }

  try {
    const options = {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      global: {
        headers: {
          'x-application-name': 'yakkt-configurator',
        },
      },
    };

    console.log('Creating client with options:', JSON.stringify(options, null, 2));
    
    supabaseClient = createBrowserClient(supabaseUrl, supabaseKey, options);

    // Test the connection immediately
    const testConnection = async () => {
      try {
        console.log('Testing Supabase connection...');
        const { data, error } = await supabaseClient!
          .from('builds')
          .select('count', { count: 'exact', head: true });

        if (error) {
          console.error('Supabase connection test failed:', error);
          console.error('Error details:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          });
        } else {
          console.log('Supabase connection test successful! Count:', data);
        }
      } catch (err) {
        console.error('Supabase connection test threw error:', err);
      }
    };

    // Run the test
    testConnection();

    console.log('Supabase client created successfully');
    return supabaseClient;
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    return null;
  }
}; 