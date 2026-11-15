import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://imdspejjhffnxvsgfuxs.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_tvyJ4XrBgQKSxYKlOC6SEQ_-4u7QBEn'

export const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '235116148753-b8v0641n08ct5urstklsrgqc5cps6u8e.apps.googleusercontent.com'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Initialize Google Identity Services (One Tap & Google Client-Side Button)
export function initGoogleIdentityServices(onSuccess?: () => void) {
  if (typeof window === 'undefined' || !(window as any).google?.accounts?.id) {
    return
  }

  try {
    ;(window as any).google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (response: any) => {
        try {
          if (!response.credential) return
          const { error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: response.credential,
          })
          if (error) {
            console.error('Error signing in with Google ID token:', error.message)
            throw error
          }
          if (onSuccess) onSuccess()
        } catch (err) {
          console.error('Google ID token sign in failed:', err)
        }
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    })
  } catch (err) {
    console.error('Failed to initialize Google Identity Services:', err)
  }
}

// Sign in with Google ID token directly
export async function signInWithGoogleIdToken(token: string) {
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token,
  })
  if (error) {
    console.error('Error signing in with Google ID token:', error.message)
    throw error
  }
  return data
}

// Fallback OAuth sign in
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  })
  if (error) {
    console.error('Error signing in with Google:', error.message)
    throw error
  }
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Error signing out:', error.message)
    throw error
  }
}
