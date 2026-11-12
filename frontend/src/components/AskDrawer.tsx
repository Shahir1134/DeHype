import React, { useState, useEffect } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../store/useAppStore'
import { AskScreen } from '../screens/AskScreen'
import { MessageCircleQuestion, X } from 'lucide-react'
import { duration, spring } from '../motion'
import { useMotionPreference } from './motion/useMotionPreference'

export const AskDrawer: React.FC = () => {
  const { isAskOpen, setIsAskOpen, persona, audio } = useAppStore()
  const { isReduced } = useMotionPreference()
  const isAudioActive = audio.isPlaying || audio.sentences.length > 0
  const [isVisible, setIsVisible] = useState(true)

  // Hide on scroll down, show on scroll up
  useEffect(() => {
    let lastY = window.scrollY
    const handleScroll = () => {
      const currentY = window.scrollY
      if (currentY > lastY && currentY > 60) {
        setIsVisible(false) // scrolling down
      } else {
        setIsVisible(true) // scrolling up
      }
      lastY = currentY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      {/* Floating Action Button (FAB) - Hidden on scroll down, shown on scroll up */}
      <AnimatePresence>
        {isVisible && (
          <m.button
            initial={isReduced ? { opacity: 0 } : { opacity: 0, scale: 0.8, y: 20 }}
            animate={isReduced ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={isReduced ? { opacity: 0 } : { opacity: 0, scale: 0.8, y: 20 }}
            transition={isReduced ? { duration: duration.reduced } : spring.ui}
            onClick={() => setIsAskOpen(!isAskOpen)}
            className={`fixed ${isAudioActive ? 'bottom-28 md:bottom-24' : 'bottom-20 md:bottom-8'} right-4 md:right-8 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-[var(--accent)] text-white shadow-2xl hover:opacity-95 active:scale-95 transition-all min-h-[48px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]`}
            aria-label="Ask anything about AI"
            title={`Ask anything as ${persona === 'engineer_office' ? 'Office / Engineer' : persona}`}
          >
            <MessageCircleQuestion className="w-5 h-5 fill-current" />
            <span className="text-sm font-semibold hidden sm:inline">Ask Anything</span>
          </m.button>
        )}
      </AnimatePresence>

      {/* Slide-over Sheet (Mobile) / Side Panel (Desktop) */}
      {isAskOpen && (
        <div 
          className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsAskOpen(false)}
        >
          <div 
            className="w-full sm:w-[480px] md:w-[560px] h-full bg-[var(--surface)] text-[var(--ink)] shadow-2xl border-l border-[var(--line)] flex flex-col relative animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--line)] bg-[var(--surface)]">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
                  <MessageCircleQuestion className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="font-serif font-bold text-lg text-[var(--ink)]">
                    Ask Anything
                  </h2>
                  <p className="text-xs text-[var(--muted)]">
                    Calibrated for {persona === 'engineer_office' ? 'Office / Engineer' : persona}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsAskOpen(false)}
                className="p-2 rounded-full hover:bg-[var(--surface-hover)] text-[var(--muted)] hover:text-[var(--ink)] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                aria-label="Close Ask chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Chat Area */}
            <div className="flex-1 overflow-y-auto">
              <AskScreen />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
