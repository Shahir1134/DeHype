import React, { useEffect, useState } from 'react'
import { duration } from '../../motion'
import { useMotionPreference } from './useMotionPreference'

interface AnimatedNumberProps {
  value: number
  className?: string
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ value, className = '' }) => {
  const { isReduced } = useMotionPreference()
  const [displayValue, setDisplayValue] = useState<number>(isReduced ? value : 0)

  useEffect(() => {
    if (isReduced) {
      setDisplayValue(value)
      return
    }

    if (value === 0) {
      setDisplayValue(0)
      return
    }

    let start = 0
    const end = value
    const totalDuration = duration.slow * 1000 // 400ms
    const startTime = performance.now()

    const step = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / totalDuration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(start + (end - start) * eased)
      setDisplayValue(current)

      if (progress < 1) {
        requestAnimationFrame(step)
      } else {
        setDisplayValue(end)
      }
    }

    const rafId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafId)
  }, [value, isReduced])

  return <span className={className}>{displayValue}</span>
}
