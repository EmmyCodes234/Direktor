import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from the .env file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing. Please check your environment variables.');
  // Depending on the application, you might want to throw an error, disable Supabase features, or show a user-friendly message.
  // For now, we'll proceed, but the Supabase client might not function correctly.
}

if (import.meta.env.DEV) {
  console.log('Supabase URL:', supabaseUrl);
  console.log('Supabase Anon Key (first 5 chars):', supabaseAnonKey ? supabaseAnonKey.substring(0, 5) + '...' : 'Not found');
}

// Create client with fallback values to prevent null reference errors
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);