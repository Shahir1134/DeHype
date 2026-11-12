import React, { useState } from 'react'
import { m } from 'framer-motion'
import { useAppStore } from '../store/useAppStore'
import { signInWithGoogle, signOut } from '../lib/supabase'
import { 
  Newspaper, 
  GraduationCap, 
  Wrench, 
  Sun, 
  Moon, 
  Type, 
  ChevronDown,
  School,
  Briefcase,
  Laptop,
  Sparkles,
  Zap,
  ZapOff,
  LogOut,
  User as UserIcon
} from 'lucide-react'
import { spring } from '../motion'
import { useMotionPreference } from './motion/useMotionPreference'
import { AnimatedNumber } from './motion/AnimatedNumber'

export const Navbar: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    persona, 
    setIsPersonaModalOpen, 
    darkMode, 
    toggleDarkMode, 
    cycleTextSize, 
    textSize,
    reduceMotion,
    toggleReduceMotion,
    savedStoryIds,
    user,
    setIsGuest
  } = useAppStore()

  const [isSigningIn, setIsSigningIn] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const { isReduced } = useMotionPreference()

  const tabs = [
    { id: 'today' as const, label: 'Today', icon: Newspaper },
    { id: 'tools' as const, label: 'Workbench', icon: Wrench },
    { id: 'learn' as const, label: 'Learn', icon: GraduationCap },
  ]

  const personaIcons = {
    student: GraduationCap,
    teacher: School,
    entrepreneur: Briefcase,
    engineer_office: Laptop,
  }

  const personaLabels: Record<string, string> = {
    student: 'Student',
    teacher: 'Teacher',
    entrepreneur: 'Entrepreneur',
    engineer_office: 'Office / Engineer',
  }

  const CurrentPersonaIcon = personaIcons[persona] || GraduationCap

  return (
    <>
      {/* Desktop Top Header */}
      <header className="sticky top-0 z-30 bg-[var(--surface)]/90 backdrop-blur-md border-b border-[var(--line)] transition-colors">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          
          {/* Logo */}
          <div 
            onClick={() => setActiveTab('today')}
            className="flex items-center gap-2.5 cursor-pointer select-none group shrink-0"
          >
            <img
              src="/dehype-icon.png"
              alt="DeHype Emblem"
              className="w-8 h-8 object-contain transition-transform group-hover:scale-105 shrink-0"
            />
            <div className="flex flex-col justify-center">
              <span className="font-serif font-bold text-lg text-[var(--ink)] block leading-tight tracking-tight">
                DeHype
              </span>
              <span className="text-[9px] font-mono tracking-wider uppercase text-[#2A7A47] dark:text-[#5CA97B] font-semibold hidden sm:block leading-none mt-0.5">
                KNOW WHAT MATTERS TO YOU
              </span>
            </div>
          </div>

          {/* Desktop Navigation Tabs with Filled Sliding Pill */}
          <nav className="hidden md:flex items-center gap-1 bg-[var(--bg)] p-1 rounded-full border border-[var(--line)] relative">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              const isWorkbench = tab.id === 'tools'
              const savedCount = savedStoryIds.length

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  data-tab={tab.id}
                  className={`relative flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors min-h-[38px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                    isActive
                      ? 'text-white'
                      : 'text-[var(--muted)] hover:text-[var(--ink)]'
                  }`}
                >
                  {/* Filled Pill Indicator */}
                  {isActive && (
                    isReduced ? (
                      <div className="absolute inset-0 bg-[var(--accent)] rounded-full -z-10 shadow-xs" />
                    ) : (
                      <m.div
                        layoutId="nav-tab-pill-desktop"
                        className="absolute inset-0 bg-[var(--accent)] rounded-full -z-10 shadow-xs"
                        transition={spring.ui}
                      />
                    )
                  )}

                  <Icon className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">{tab.label}</span>

                  {/* Bookmark badge on Workbench tab */}
                  {isWorkbench && savedCount > 0 && (
                    <span
                      id="workbench-tab-badge"
                      className={`relative z-10 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isActive ? 'bg-white text-[var(--accent)]' : 'bg-[var(--accent)] text-white'
                      }`}
                    >
                      <AnimatedNumber value={savedCount} />
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          {/* Right Action Tools: Persona Switcher, Reduce Motion, Font Size, Dark Mode */}
          <div className="flex items-center gap-2">
            
            {/* Persona Switcher Chip */}
            <button
              onClick={() => setIsPersonaModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--line)] bg-[var(--surface-hover)] hover:border-[var(--accent)] text-[var(--ink)] transition-colors min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              aria-label="Switch your perspective"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)] shrink-0" />
              <CurrentPersonaIcon className="w-4 h-4 text-[var(--accent-ink)]" />
              <span className="text-xs sm:text-sm font-semibold truncate max-w-[110px] sm:max-w-none">
                {personaLabels[persona] || 'Office / Engineer'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[var(--muted)]" />
            </button>

            {/* Reduce Motion Toggle */}
            <button
              onClick={toggleReduceMotion}
              className={`p-2 rounded-xl border border-transparent hover:border-[var(--line)] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                reduceMotion ? 'text-[var(--accent)] bg-[var(--accent-soft)]' : 'text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
              title={reduceMotion ? 'Reduce motion enabled (Click to enable animations)' : 'Enable reduced motion'}
              aria-label="Toggle reduced motion"
            >
              {reduceMotion ? <ZapOff className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
            </button>

            {/* Font size button */}
            <button
              onClick={cycleTextSize}
              className="p-2 rounded-xl border border-transparent hover:border-[var(--line)] text-[var(--muted)] hover:text-[var(--ink)] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center gap-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              title={`Text size: ${textSize.toUpperCase()} (Click to change)`}
              aria-label="Toggle text size"
            >
              <Type className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase">{textSize}</span>
            </button>

            {/* Dark mode button */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-xl border border-transparent hover:border-[var(--line)] text-[var(--muted)] hover:text-[var(--ink)] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Supabase Google Auth Button / User Profile */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1.5 pl-2.5 rounded-full border border-[var(--line)] hover:border-[var(--accent)] transition-all bg-[var(--surface)] min-h-[44px]"
                  title={user.email || 'User Account'}
                >
                  {user.user_metadata?.avatar_url ? (
                    <img 
                      src={user.user_metadata.avatar_url} 
                      alt="Avatar" 
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-[var(--accent-soft)] text-[var(--accent-ink)] flex items-center justify-center font-bold text-xs">
                      {user.email?.charAt(0).toUpperCase() || <UserIcon className="w-3.5 h-3.5" />}
                    </div>
                  )}
                  <span className="text-xs font-semibold max-w-[85px] sm:max-w-[120px] truncate text-[var(--ink)] hidden sm:inline">
                    {user.user_metadata?.full_name || user.email?.split('@')[0]}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-[var(--muted)] mr-1" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-xl p-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-3 py-2 border-b border-[var(--line)] mb-1">
                      <p className="text-xs font-bold text-[var(--ink)] truncate">
                        {user.user_metadata?.full_name || 'Signed in'}
                      </p>
                      <p className="text-[11px] text-[var(--muted)] truncate">
                        {user.email}
                      </p>
                    </div>

                    <button
                      onClick={async () => {
                        setShowUserMenu(false)
                        setIsGuest(false)
                        await signOut()
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-rose-500 hover:bg-rose-500/10 transition-colors font-medium cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                disabled={isSigningIn}
                onClick={async () => {
                  try {
                    setIsSigningIn(true)
                    await signInWithGoogle()
                  } catch (err) {
                    console.error('Sign in failed', err)
                  } finally {
                    setIsSigningIn(false)
                  }
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--line)] bg-[var(--surface)] hover:border-[var(--accent)] text-[var(--ink)] transition-all min-h-[44px] cursor-pointer shadow-xs hover:shadow-md text-xs font-semibold"
                title="Sign in with Google"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span className="hidden sm:inline">
                  {isSigningIn ? 'Connecting...' : 'Sign in'}
                </span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (3 Tabs) with Filled Pill */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[var(--surface)] border-t border-[var(--line)] px-2 py-1 safe-area-pb">
        <nav className="grid grid-cols-3 gap-1 relative">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            const isWorkbench = tab.id === 'tools'
            const savedCount = savedStoryIds.length

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                data-tab={tab.id}
                className={`relative flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-colors min-h-[48px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                  isActive
                    ? 'text-[var(--accent)] font-bold'
                    : 'text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                {/* Mobile Active Pill indicator */}
                {isActive && (
                  isReduced ? (
                    <div className="absolute inset-0 bg-[var(--accent-soft)] rounded-2xl -z-10" />
                  ) : (
                    <m.div
                      layoutId="nav-tab-pill-mobile"
                      className="absolute inset-0 bg-[var(--accent-soft)] rounded-2xl -z-10"
                      transition={spring.ui}
                    />
                  )
                )}

                <div className="relative">
                  <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                  {isWorkbench && savedCount > 0 && (
                    <span
                      id="workbench-tab-badge"
                      className="absolute -top-1 -right-2 px-1.5 py-0.1 rounded-full text-[9px] font-bold bg-[var(--accent)] text-white"
                    >
                      {savedCount}
                    </span>
                  )}
                </div>
                <span className="text-[11px] leading-tight">{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>
    </>
  )
}
