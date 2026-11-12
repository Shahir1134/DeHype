import React from 'react'
import { m } from 'framer-motion'
import { duration, ease } from '../../motion'
import { useMotionPreference } from './useMotionPreference'

interface DotsProps {
  count: number // 1, 2, or 3
  total?: number
  className?: string
}

export const Dots: React.FC<DotsProps> = ({ count, total = 3, className = '' }) => {
  const { isReduced } = useMotionPreference()

  // Match colors: 3 = emerald, 2 = amber, 1 = neutral/muted
  const activeColor =
    count === 3 ? 'bg-emerald-500' : count === 2 ? 'bg-amber-500' : 'bg-neutral-500'

  return (
    <div
      className={`inline-flex items-center gap-1 ${className}`}
      aria-label={`${count} of ${total} care rating`}
    >
      {Array.from({ length: total }).map((_, i) => {
        const isFilled = i < count

        if (isReduced) {
          return (
            <span
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                isFilled ? activeColor : 'bg-[var(--line)]'
              }`}
            />
          )
        }

        return (
          <m.span
            key={i}
            initial={{ scale: 0.6, opacity: 0.3 }}
            animate={{
              scale: isFilled ? 1 : 0.8,
              opacity: isFilled ? 1 : 0.4,
            }}
            transition={{
              duration: duration.fast,
              delay: isFilled ? i * 0.08 : 0,
              ease: ease.out,
            }}
            className={`w-2 h-2 rounded-full ${
              isFilled ? activeColor : 'bg-[var(--line)]'
            }`}
          />
        )
      })}
    </div>
  )
}
