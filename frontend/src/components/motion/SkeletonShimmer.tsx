import React from 'react'
import { m } from 'framer-motion'
import { useMotionPreference } from './useMotionPreference'

interface SkeletonShimmerProps {
  className?: string
  width?: string | number
  height?: string | number
  rounded?: string
}

export const SkeletonShimmer: React.FC<SkeletonShimmerProps> = ({
  className = '',
  width = '100%',
  height = '1rem',
  rounded = 'rounded-lg',
}) => {
  const { isReduced } = useMotionPreference()

  if (isReduced) {
    return (
      <div
        className={`bg-[var(--line)] ${rounded} ${className}`}
        style={{ width, height }}
      />
    )
  }

  return (
    <div
      className={`relative overflow-hidden bg-[var(--line)] ${rounded} ${className}`}
      style={{ width, height }}
    >
      <m.div
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{
          repeat: Infinity,
          duration: 1.4,
          ease: 'linear',
        }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent"
      />
    </div>
  )
}
