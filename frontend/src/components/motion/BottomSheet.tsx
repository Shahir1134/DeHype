import React, { useEffect, useRef } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { duration, ease, spring } from '../../motion'
import { useMotionPreference } from './useMotionPreference'
import { X } from 'lucide-react'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  const { isReduced } = useMotionPreference()
  const sheetRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement
      // Announce open via aria-live
      const liveRegion = document.getElementById('a11y-live-announcer')
      if (liveRegion) {
        liveRegion.textContent = `${title} sheet opened`
      }
      // Focus sheet
      setTimeout(() => {
        sheetRef.current?.focus()
      }, 50)

      // Prevent body scroll
      document.body.style.overflow = 'hidden'
    } else {
      if (previousActiveElement.current) {
        previousActiveElement.current.focus()
      }
      document.body.style.overflow = ''
      const liveRegion = document.getElementById('a11y-live-announcer')
      if (liveRegion) {
        liveRegion.textContent = `${title} sheet closed`
      }
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen, title])

  // Trap focus & Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="fixed inset-0 z-50 flex items-end justify-center md:hidden"
        >
          {/* Backdrop */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: isReduced ? duration.reduced : duration.fast }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
          />

          {/* Sheet */}
          <m.div
            ref={sheetRef}
            tabIndex={-1}
            drag={isReduced ? false : 'y'}
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 400) {
                onClose()
              }
            }}
            initial={isReduced ? { opacity: 0 } : { y: '100%' }}
            animate={isReduced ? { opacity: 1 } : { y: 0 }}
            exit={isReduced ? { opacity: 0 } : { y: '100%' }}
            transition={isReduced ? { duration: duration.reduced } : spring.ui}
            className="relative z-10 w-full max-h-[85vh] bg-[var(--surface)] text-[var(--ink)] rounded-t-3xl border-t border-[var(--line)] shadow-2xl flex flex-col focus:outline-none"
          >
            {/* Drag Handle */}
            <div className="w-full pt-3 pb-1 flex justify-center cursor-grab active:cursor-grabbing">
              <div className="w-10 h-1.5 rounded-full bg-[var(--line)]" />
            </div>

            {/* Header */}
            <div className="px-5 py-3 border-b border-[var(--line)] flex items-center justify-between">
              <h3 className="font-serif font-bold text-lg text-[var(--ink)] truncate pr-4">
                {title}
              </h3>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-[var(--surface-hover)] text-[var(--muted)] hover:text-[var(--ink)] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                aria-label="Close sheet"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="p-5 overflow-y-auto space-y-4">
              {children}
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  )
}
