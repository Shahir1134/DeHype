import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { signInWithGoogle, initGoogleIdentityServices } from '../lib/supabase'
import { Sparkles, ShieldCheck, Cpu, Users, ArrowRight, CheckCircle2 } from 'lucide-react'

interface LoginScreenProps {}

export const LoginScreen: React.FC<LoginScreenProps> = () => {
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [googleLoaded, setGoogleLoaded] = useState(false)

  useEffect(() => {
    let checkInterval: any = null

    const initGIS = () => {
      if ((window as any).google?.accounts?.id) {
        initGoogleIdentityServices(() => {
          setLoading(false)
        })
        const container = document.getElementById('googleSignInBtn')
        if (container) {
          try {
            ;(window as any).google.accounts.id.renderButton(container, {
              theme: 'outline',
              size: 'large',
              type: 'standard',
              text: 'continue_with',
              shape: 'pill',
              width: 320,
              logo_alignment: 'left',
            })
            setGoogleLoaded(true)
          } catch (e) {
            console.error('Failed to render Google button:', e)
          }
        }
        try {
          ;(window as any).google.accounts.id.prompt()
        } catch (e) {
          // ignore prompt error
        }
      }
    }

    if ((window as any).google?.accounts?.id) {
      initGIS()
    } else {
      checkInterval = setInterval(() => {
        if ((window as any).google?.accounts?.id) {
          initGIS()
          clearInterval(checkInterval)
        }
      }, 200)
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval)
    }
  }, [])

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true)
      setErrorMsg(null)
      if ((window as any).google?.accounts?.id) {
        ;(window as any).google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            signInWithGoogle()
          }
        })
      } else {
        await signInWithGoogle()
      }
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'Failed to initialize Google authentication. Please check your connection or Google settings.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col justify-between selection:bg-[var(--accent-soft)] selection:text-[var(--accent-ink)] font-sans relative overflow-hidden transition-colors">
      {/* Background Decorative Gradient Blobs */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-96 h-96 rounded-full bg-[var(--accent)] opacity-10 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 -right-40 w-96 h-96 rounded-full bg-indigo-500 opacity-10 blur-3xl" />

      {/* Top Simple Brand Bar */}
      <header className="max-w-[1120px] w-full mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <img
            src="/dehype-icon.png"
            alt="DeHype Emblem"
            className="w-9 h-9 object-contain shrink-0"
          />
          <div className="flex flex-col justify-center">
            <span className="font-serif font-bold text-lg text-[var(--ink)] block leading-tight tracking-tight">
              DeHype
            </span>
            <span className="text-[9.5px] font-mono tracking-wider uppercase text-[#2A7A47] dark:text-[#5CA97B] font-semibold leading-none mt-0.5">
              KNOW WHAT MATTERS TO YOU
            </span>
          </div>
        </div>
      </header>

      {/* Main Hero & Auth Box */}
      <main className="max-w-[1120px] w-full mx-auto px-6 py-8 flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10 my-auto">
        {/* Left Column: Platform Mission & Value Props */}
        <div className="flex-1 max-w-xl space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent-ink)] text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Literacy & Intelligence Platform</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold tracking-tight text-[var(--ink)] leading-[1.12]">
            Understand AI clearly. <br className="hidden sm:inline" />
            <span className="text-[var(--accent)]">Without the noise.</span>
          </h1>

          <p className="text-base sm:text-lg text-[var(--muted)] leading-relaxed">
            Daily verified intelligence, honest capability shift benchmarks, and an interactive simulation to learn how frontier neural networks are actually developed.
          </p>

          {/* 3 Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-left">
            <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--line)] space-y-1.5 shadow-xs">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <h3 className="text-xs font-bold text-[var(--ink)]">Signal Over Noise</h3>
              <p className="text-[11px] text-[var(--muted)] leading-snug">Zero sponsored marketing or unverified claims.</p>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--line)] space-y-1.5 shadow-xs">
              <Cpu className="w-5 h-5 text-cyan-500" />
              <h3 className="text-xs font-bold text-[var(--ink)]">Interactive Factory</h3>
              <p className="text-[11px] text-[var(--muted)] leading-snug">Train, filter data, and align an AI in real time.</p>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--line)] space-y-1.5 shadow-xs">
              <Users className="w-5 h-5 text-purple-500" />
              <h3 className="text-xs font-bold text-[var(--ink)]">Persona Tailored</h3>
              <p className="text-[11px] text-[var(--muted)] leading-snug">Filtered for Students, Educators, Creators & Office.</p>
            </div>
          </div>
        </div>

        {/* Right Column: Auth Card */}
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 sm:p-10 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-xl space-y-6 relative"
          >
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-serif font-bold text-[var(--ink)]">
                Welcome to DeHype
              </h2>
              <p className="text-xs text-[var(--muted)]">
                Sign in with your Google account to access your personal briefing and learning arena.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs">
                {errorMsg}
              </div>
            )}

            {/* Google Sign In Button */}
            <div className="space-y-3 pt-2 flex flex-col items-center">
              {/* Native Google Identity Services Button (Origin-bound to DeHype) */}
              <div id="googleSignInBtn" className="w-full flex justify-center min-h-[44px]" />

              {/* Fallback custom button if GIS hasn't rendered */}
              {!googleLoaded && (
                <button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-2xl border border-[var(--line)] hover:border-[var(--accent)] bg-[var(--surface-hover)] hover:bg-[var(--surface)] text-[var(--ink)] font-bold text-sm transition-all shadow-xs flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
                >
                  {/* Official Google 4-Color SVG Icon */}
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{loading ? 'Connecting to Google...' : 'Continue with Google'}</span>
                </button>
              )}
            </div>

            {/* Micro Commitments */}
            <div className="pt-4 border-t border-[var(--line)] space-y-2 text-[11px] text-[var(--muted)]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Zero marketing spam or affiliate tracking</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Synchronized across devices via Supabase</span>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="max-w-[1120px] w-full mx-auto px-6 py-6 border-t border-[var(--line)] text-center text-xs text-[var(--muted)] flex flex-col sm:flex-row items-center justify-between gap-2 relative z-10">
        <span>© 2026 DeHype · Honest AI Literacy & Education</span>
        <span>Every claim cited with primary sources</span>
      </footer>
    </div>
  )
}
