import React, { useState } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { duration, ease } from '../../motion'
import { useMotionPreference } from './useMotionPreference'
import { Bookmark } from 'lucide-react'

interface FlyToTargetProps {
  onFlyComplete?: () => void
  children: (triggerFly: (e: React.MouseEvent<HTMLElement>) => void) => React.ReactNode
}

interface FlyingParticle {
  id: number
  startX: number
  startY: number
  endX: number
  endY: number
}

export const FlyToTarget: React.FC<FlyToTargetProps> = ({ onFlyComplete, children }) => {
  const { isReduced } = useMotionPreference()
  const [particles, setParticles] = useState<FlyingParticle[]>([])

  const triggerFly = (e: React.MouseEvent<HTMLElement>) => {
    if (isReduced) {
      onFlyComplete?.()
      return
    }

    const rect = e.currentTarget.getBoundingClientRect()
    // Find target (Workbench tab badge)
    const targetEl = document.getElementById('workbench-tab-badge') || document.querySelector('[data-tab="tools"]')
    const targetRect = targetEl?.getBoundingClientRect() || {
      left: window.innerWidth / 2,
      top: window.innerHeight - 30,
    }

    const newParticle: FlyingParticle = {
      id: Date.now() + Math.random(),
      startX: rect.left + rect.width / 2,
      startY: rect.top + rect.height / 2,
      endX: targetRect.left + 10,
      endY: targetRect.top + 10,
    }

    setParticles((prev) => [...prev, newParticle])
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.id !== newParticle.id))
      onFlyComplete?.()
    }, duration.slow * 1000)
  }

  return (
    <>
      {children(triggerFly)}

      {/* Portal/Flying Particles */}
      <AnimatePresence>
        {particles.map((p) => (
          <m.div
            key={p.id}
            initial={{
              x: p.startX,
              y: p.startY,
              scale: 1,
              opacity: 1,
            }}
            animate={{
              x: p.endX,
              y: p.endY,
              scale: 0.4,
              opacity: 0.2,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: duration.slow,
              ease: ease.inOut,
            }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              zIndex: 9999,
              pointerEvents: 'none',
            }}
            className="p-2 rounded-full bg-[var(--accent)] text-white shadow-lg"
          >
            <Bookmark className="w-4 h-4 fill-current" />
          </m.div>
        ))}
      </AnimatePresence>
    </>
  )
}
