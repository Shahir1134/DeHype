import React from 'react'
import { m } from 'framer-motion'
import { duration, ease, distance } from '../../motion'
import { useMotionPreference } from './useMotionPreference'

interface RevealProps {
  children: React.ReactNode
  delay?: number
  className?: string
  yDistance?: number
}

export const Reveal: React.FC<RevealProps> = ({
  children,
  delay = 0,
  className = '',
  yDistance = distance,
}) => {
  const { isReduced } = useMotionPreference()

  if (isReduced) {
    return (
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: duration.reduced, delay }}
        className={className}
      >
        {children}
      </m.div>
    )
  }

  return (
    <m.div
      initial={{ opacity: 0, y: yDistance }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: duration.base,
        ease: ease.out,
        delay,
      }}
      className={className}
    >
      {children}
    </m.div>
  )
}
