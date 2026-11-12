import React from 'react'
import { m } from 'framer-motion'
import { useMotionPreference } from './useMotionPreference'

interface ListenWaveProps {
  isPlaying: boolean
  className?: string
  barColor?: string
}

export const ListenWave: React.FC<ListenWaveProps> = ({
  isPlaying,
  className = '',
  barColor = 'bg-[var(--accent)]',
}) => {
  const { isReduced } = useMotionPreference()

  // 3-bar animated waveform
  const bars = [
    { heightRange: [4, 14, 6, 12, 4], duration: 0.8, delay: 0 },
    { heightRange: [8, 18, 4, 16, 8], duration: 0.7, delay: 0.15 },
    { heightRange: [6, 12, 16, 6, 6], duration: 0.9, delay: 0.08 },
  ]

  if (isReduced) {
    return (
      <div className={`inline-flex items-center gap-0.5 h-5 px-1 ${className}`}>
        <span className={`w-1 h-3 rounded-full ${barColor}`} />
        <span className={`w-1 h-4 rounded-full ${barColor}`} />
        <span className={`w-1 h-2 rounded-full ${barColor}`} />
      </div>
    )
  }

  return (
    <div
      className={`inline-flex items-center gap-0.5 h-5 px-1 ${className}`}
      aria-label={isPlaying ? 'Audio playing' : 'Audio paused'}
    >
      {bars.map((bar, i) => (
        <m.span
          key={i}
          animate={
            isPlaying
              ? {
                  height: bar.heightRange,
                }
              : { height: 4 }
          }
          transition={
            isPlaying
              ? {
                  repeat: Infinity,
                  repeatType: 'reverse',
                  duration: bar.duration,
                  delay: bar.delay,
                  ease: 'easeInOut',
                }
              : { duration: 0.2 }
          }
          className={`w-1 rounded-full ${barColor}`}
          style={{ minHeight: 4 }}
        />
      ))}
    </div>
  )
}
