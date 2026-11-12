import React, { useEffect, useState } from 'react'
import { LazyMotion, domAnimation } from 'framer-motion'
import { useAppStore } from './store/useAppStore'
import { supabase } from './lib/supabase'
import { Navbar } from './components/Navbar'
import { PersonaModal } from './components/PersonaModal'
import { GlossaryModal } from './components/GlossaryModal'
import { AudioPlayer } from './components/AudioPlayer'
import { AskDrawer } from './components/AskDrawer'
import { ToastContainer } from './components/motion/Toast'
import { LoginScreen } from './screens/LoginScreen'
import { SplashScreen } from './screens/SplashScreen'
import { OnboardingScreen } from './screens/OnboardingScreen'
import { TodayScreen } from './screens/TodayScreen'
import { CatchUpScreen } from './screens/CatchUpScreen'
import { ToolsScreen } from './screens/ToolsScreen'
import { LearnScreen } from './screens/LearnScreen'
import { AskScreen } from './screens/AskScreen'

export const App: React.FC = () => {
  const { hasOnboarded, activeTab, setActiveTab, setUser, user, isGuest, setIsGuest } = useAppStore()
  const [authChecking, setAuthChecking] = useState(true)
  // Splash shown once per session after a successful login/guest entry
  const [showSplash, setShowSplash] = useState(false)
  // Track whether we were previously logged-out so we know when a fresh login occurred
  const [wasLoggedOut, setWasLoggedOut] = useState(true)

  // Supabase Auth session listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setAuthChecking(false)
    }).catch(() => {
      setAuthChecking(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setAuthChecking(false)
    })

    return () => subscription.unsubscribe()
  }, [setUser])

  // Show splash once whenever the user transitions from logged-out → logged-in
  useEffect(() => {
    const isNowAuthenticated = !!(user || isGuest)
    if (wasLoggedOut && isNowAuthenticated && !authChecking) {
      setShowSplash(true)
      setWasLoggedOut(false)
    }
    if (!isNowAuthenticated) {
      setWasLoggedOut(true)
    }
  }, [user, isGuest, authChecking, wasLoggedOut])

  // Hash route synchronization
  useEffect(() => {
    const handleHashChange = () => {
      let hash = window.location.hash.replace('#', '')
      if (hash === 'timeline') {
        hash = 'catchup'
      }
      if (['today', 'catchup', 'tools', 'learn', 'ask'].includes(hash)) {
        setActiveTab(hash as any)
      }
    }

    // Set initial from hash if present
    let initialHash = window.location.hash.replace('#', '')
    if (initialHash === 'timeline') {
      initialHash = 'catchup'
    }
    if (['today', 'catchup', 'tools', 'learn', 'ask'].includes(initialHash)) {
      setActiveTab(initialHash as any)
    } else {
      window.location.hash = activeTab
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [setActiveTab, activeTab])

  // 1. Initial Authentication Check State
  if (authChecking) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
        <p className="text-xs font-mono text-[var(--muted)]">Initializing secure session...</p>
      </div>
    )
  }

  // 2. Gateway Login Screen: shown when user is not logged in and not in guest mode
  if (!user && !isGuest) {
    return (
      <LazyMotion features={domAnimation} strict>
        <LoginScreen onContinueAsGuest={() => setIsGuest(true)} />
      </LazyMotion>
    )
  }

  // 3. Show Onboarding on first visit after login
  if (!hasOnboarded) {
    return (
      <LazyMotion features={domAnimation} strict>
        <div className="relative min-h-screen bg-[var(--bg)]">
          <OnboardingScreen />
          {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
        </div>
      </LazyMotion>
    )
  }

  // 4. Authenticated Main Dashboard
  return (
    <LazyMotion features={domAnimation} strict>
      <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col font-sans transition-colors duration-240 relative">
        {/* Cinematic Splash Screen Overlay */}
        {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}

        {/* A11y Live Announcer for Screen Readers & Tests */}
        <div id="a11y-live-announcer" aria-live="polite" aria-atomic="true" className="sr-only" />

        {/* Top Navbar */}
        <Navbar />

        {/* Main Content View with Hash Routing */}
        <main className="flex-1">
          {activeTab === 'today' && <TodayScreen />}
          {activeTab === 'catchup' && <CatchUpScreen />}
          {activeTab === 'tools' && <ToolsScreen />}
          {activeTab === 'learn' && <LearnScreen />}
          {activeTab === 'ask' && <AskScreen />}
        </main>

        {/* Floating Action Button & Slide-Over Panel for Ask Anything (On every screen) */}
        <AskDrawer />

        {/* Persistent Audio Mini-Player */}
        <AudioPlayer />

        {/* Accessible Modals */}
        <PersonaModal />
        <GlossaryModal />

        {/* Global Motion Toast Container */}
        <ToastContainer />
      </div>
    </LazyMotion>
  )
}
export default App
