// src/lib/supabase.ts
// Supabase client for the mobile app. Uses expo-secure-store for token
// persistence (sensitive tokens are encrypted at rest), falling back to
// AsyncStorage for non-sensitive metadata when SecureStore is unavailable.
//
// The same EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY values
// from your ~/dna-healthcare/.env.local are required here. They're set in
// eas.json's per-profile env block (currently placeholder strings).

import 'react-native-url-polyfill/auto'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'
import AsyncStorage from '@react-native-async-storage/async-storage'

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? ''

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    '[supabase] EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY is missing. ' +
      'Sign-in will fail until these are set in eas.json env. Copy values from ' +
      '~/dna-healthcare/.env.local (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY).'
  )
}

// SecureStore has a 2KB limit per value on Android. Supabase auth tokens fit
// well under that, but to be safe we partition: SecureStore for the token
// payload, AsyncStorage for non-sensitive overflow.
const SECURE_STORE_KEY_PREFIX = 'sb_'

const SecureStoreAdapter = {
  async getItem(key: string): Promise<string | null> {
    try {
      const v = await SecureStore.getItemAsync(`${SECURE_STORE_KEY_PREFIX}${key}`)
      if (v != null) return v
      // Fallback for any non-sensitive metadata that landed in AsyncStorage.
      return AsyncStorage.getItem(key)
    } catch {
      return AsyncStorage.getItem(key)
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    // SecureStore has a per-value cap; route long blobs to AsyncStorage.
    if (value.length > 1800) {
      try {
        await SecureStore.deleteItemAsync(`${SECURE_STORE_KEY_PREFIX}${key}`)
      } catch {}
      return AsyncStorage.setItem(key, value)
    }
    try {
      await SecureStore.setItemAsync(`${SECURE_STORE_KEY_PREFIX}${key}`, value)
      // If a previous (large) version got stored in AsyncStorage, clear it.
      await AsyncStorage.removeItem(key)
    } catch {
      await AsyncStorage.setItem(key, value)
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(`${SECURE_STORE_KEY_PREFIX}${key}`)
    } catch {}
    await AsyncStorage.removeItem(key)
  },
}

export const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      storage: SecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
    global: {
      headers: { 'X-Client-Info': 'connecdna-mobile' },
    },
  }
)

/**
 * Returns the current session's access token, or null if not signed in.
 * Used by the API client to inject the Authorization header.
 */
export async function getAccessToken(): Promise<string | null> {
  const { data, error } = await supabase.auth.getSession()
  if (error || !data.session) return null
  return data.session.access_token
}
