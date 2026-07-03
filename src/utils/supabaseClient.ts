import { createClient } from '@supabase/supabase-js';
import { useAppStore } from '../db/store';

let supabaseInstance: any = null;
let currentUrl = '';
let currentKey = '';

/**
 * Dynamically resolves and caches the Supabase Client.
 * Automatically handles updates to settings if the user changes credentials in Settings.
 */
export const getSupabaseClient = () => {
  // Use state without registering a selector to prevent circular dependency reactions
  const settings = useAppStore.getState().supabaseSettings;
  
  if (!settings || !settings.isEnabled || !settings.supabaseUrl || !settings.supabaseAnonKey) {
    return null;
  }

  // If credentials haven't changed, return the cached instance
  if (supabaseInstance && currentUrl === settings.supabaseUrl && currentKey === settings.supabaseAnonKey) {
    return supabaseInstance;
  }

  currentUrl = settings.supabaseUrl;
  currentKey = settings.supabaseAnonKey;
  
  try {
    supabaseInstance = createClient(currentUrl, currentKey, {
      auth: {
        persistSession: false // Let Zustand/localStorage handle authentication state
      }
    });
    return supabaseInstance;
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    return null;
  }
};
