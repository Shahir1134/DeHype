import React from 'react'
import { m } from 'framer-motion'
import { duration, ease } from '../../motion'
import { useMotionPreference } from './useMotionPreference'

interface CheckDrawProps {
  size?: number
  strokeWidth?: number
  className?: string
  color?: string
}

export const CheckDraw: React.FC<CheckDrawProps> = ({
  size = 20,
  strokeWidth = 2.5,
  className = '',
  color = 'currentColor',
}) => {
  const { isReduced } = useMotionPreference()

  if (isReduced) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="M20 6L9 17L4 12" />
      </svg>
    )
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <m.path
        d="M20 6L9 17L4 12"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{
          pathLength: { duration: duration.base, ease: ease.out },
          opacity: { duration: duration.fast },
        }}
      />
    </svg>
  )
}
