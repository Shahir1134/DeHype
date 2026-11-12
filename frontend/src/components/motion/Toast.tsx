import React from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { duration, ease, spring } from '../../motion'
import { useMotionPreference } from './useMotionPreference'
import { useAppStore, ToastItem } from '../../store/useAppStore'
import { X } from 'lucide-react'

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useAppStore()
  const { isReduced } = useMotionPreference()

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none px-4 w-full max-w-md"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <m.div
            key={toast.id}
            initial={isReduced ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.95 }}
            animate={isReduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={isReduced ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.95 }}
            transition={isReduced ? { duration: duration.reduced } : spring.ui}
            className="pointer-events-auto flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-[var(--ink)] text-[var(--bg)] shadow-xl border border-[var(--line)]/20 text-xs sm:text-sm font-medium w-full"
          >
            <span className="truncate">{toast.message}</span>

            <div className="flex items-center gap-2 shrink-0">
              {toast.actionLabel && toast.onAction && (
                <button
                  onClick={() => {
                    toast.onAction?.()
                    removeToast(toast.id)
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[var(--accent)] text-white font-semibold text-xs hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-white min-h-[32px]"
                >
                  {toast.actionLabel}
                </button>
              )}
              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 rounded-md text-[var(--bg)]/70 hover:text-[var(--bg)] transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-white min-h-[32px] min-w-[32px] flex items-center justify-center"
                aria-label="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </m.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
