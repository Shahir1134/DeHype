import React from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { duration, ease } from '../../motion'
import { useMotionPreference } from './useMotionPreference'

interface ExpandPanelProps {
  isOpen: boolean
  children: React.ReactNode
  className?: string
}

export const ExpandPanel: React.FC<ExpandPanelProps> = ({
  isOpen,
  children,
  className = '',
}) => {
  const { isReduced } = useMotionPreference()

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        isReduced ? (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: duration.reduced }}
            className={`overflow-hidden ${className}`}
          >
            {children}
          </m.div>
        ) : (
          <m.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{
              height: { duration: duration.base, ease: ease.out },
              opacity: { duration: duration.fast, ease: ease.out },
            }}
            className={`overflow-hidden ${className}`}
          >
            {children}
          </m.div>
        )
      )}
    </AnimatePresence>
  )
}
