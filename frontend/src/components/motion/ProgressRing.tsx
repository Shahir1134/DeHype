import React from 'react'
import { m } from 'framer-motion'
import { duration, ease } from '../../motion'
import { useMotionPreference } from './useMotionPreference'

interface ProgressRingProps {
  current: number
  total?: number
  size?: number
  strokeWidth?: number
  className?: string
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  current,
  total = 3,
  size = 36,
  strokeWidth = 3.5,
  className = '',
}) => {
  const { isReduced } = useMotionPreference()
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const safeCurrent = Math.min(current, total)
  const progressFraction = total > 0 ? safeCurrent / total : 0
  const strokeDashoffset = circumference - progressFraction * circumference

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      aria-label={`Progress: ${safeCurrent} of ${total} completed`}
      role="progressbar"
      aria-valuenow={safeCurrent}
      aria-valuemin={0}
      aria-valuemax={total}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Background track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-[var(--line)]"
        />
        {/* Progress active circle */}
        {isReduced ? (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="text-[var(--accent)] transition-all duration-150"
          />
        ) : (
          <m.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{
              duration: duration.slow,
              ease: ease.out,
            }}
            strokeLinecap="round"
            className="text-[var(--accent)]"
          />
        )}
      </svg>
      <span className="absolute text-[11px] font-bold text-[var(--ink)] leading-none select-none">
        {safeCurrent}/{total}
      </span>
    </div>
  )
}
