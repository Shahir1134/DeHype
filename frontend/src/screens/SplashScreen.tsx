import React, { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface SplashScreenProps {
  onComplete: () => void
}

interface Particle {
  id: number
  x: number // percentage
  y: number // percentage
  size: number
  color: string
  opacity: number
  delay: number
  dx1: number
  dy1: number
  dx2: number
  dy2: number
  duration: number
}

// Generates organic particles positioned around the outer field (leaving center clear for logo)
function useOuterParticles(count: number): Particle[] {
  return useMemo(() => {
    const particles: Particle[] = []
    const greenShades = ['#164E2A', '#1E5E35', '#2A7A47', '#3D8F5C', '#5CA97B', '#88C7A2']

    for (let i = 0; i < count; i++) {
      // Replicate the reference GIF: dots concentrated toward edges and corners, clear center
      let x = Math.random() * 100
      let y = Math.random() * 100

      // If particle falls inside center clear zone (28% to 72%), push it outward
      const dxFromCenter = x - 50
      const dyFromCenter = y - 50
      const distFromCenter = Math.sqrt(dxFromCenter * dxFromCenter + dyFromCenter * dyFromCenter)

      if (distFromCenter < 26) {
        const angle = Math.random() * Math.PI * 2
        const pushDist = 28 + Math.random() * 20
        x = Math.max(2, Math.min(98, 50 + Math.cos(angle) * pushDist))
        y = Math.max(2, Math.min(98, 50 + Math.sin(angle) * pushDist))
      }

      particles.push({
        id: i,
        x,
        y,
        size: 2.5 + Math.random() * 5.5, // 2.5px to 8px
        color: greenShades[Math.floor(Math.random() * greenShades.length)],
        opacity: 0.35 + Math.random() * 0.55,
        delay: Math.random() * 0.8,
        dx1: (Math.random() - 0.5) * 16,
        dy1: (Math.random() - 0.5) * 16,
        dx2: (Math.random() - 0.5) * 22,
        dy2: (Math.random() - 0.5) * 22,
        duration: 3.5 + Math.random() * 2.5,
      })
    }
    return particles
  }, [count])
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const particles = useOuterParticles(56)
  // Stage states for the 5-second cinematic reveal
  const [stage, setStage] = useState<'icon' | 'full' | 'settled'>('icon')
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    // 0s - 1.8s: Single iconic "D" emblem blooms in center
    // 1.8s: Transition into full DeHype logo & tagline
    const fullLogoTimer = setTimeout(() => {
      setStage('full')
    }, 1800)

    // 3.4s: Settled mode (progress line reaches 100%)
    const settledTimer = setTimeout(() => {
      setStage('settled')
    }, 3400)

    // 4.4s: Start smooth fade-out
    const exitTimer = setTimeout(() => {
      setIsExiting(true)
    }, 4400)

    // 5.0s: Transition complete
    const finishTimer = setTimeout(() => {
      onComplete()
    }, 5000)

    return () => {
      clearTimeout(fullLogoTimer)
      clearTimeout(settledTimer)
      clearTimeout(exitTimer)
      clearTimeout(finishTimer)
    }
  }, [onComplete])

  return (
    <AnimatePresence>
      <motion.div
        key="platform-splash-overlay"
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center select-none overflow-hidden bg-[var(--bg)]"
        initial={{ opacity: 1 }}
        animate={{ opacity: isExiting ? 0 : 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{ pointerEvents: isExiting ? 'none' : 'auto' }}
      >
        {/* ── Soft Ambient Radial Glow (Center) ── */}
        <motion.div
          className="absolute w-[460px] h-[460px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(42, 122, 71, 0.08) 0%, rgba(42, 122, 71, 0.02) 45%, transparent 70%)',
          }}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: [0.8, 1.1, 0.95], opacity: [0.4, 0.85, 0.6] }}
          transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* ── Outer Floating Green Dots Scatter (Reference GIF replicate) ── */}
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, p.opacity, p.opacity * 0.75, p.opacity],
              scale: [0, 1.15, 0.95, 1],
              x: [0, p.dx1, p.dx2, 0],
              y: [0, p.dy1, p.dy2, 0],
            }}
            transition={{
              delay: p.delay,
              duration: p.duration,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}

        {/* ── Logo Presentation Container ── */}
        <div className="relative z-10 flex flex-col items-center justify-center px-6">
          <AnimatePresence mode="wait">
            {stage === 'icon' ? (
              /* Phase 1: Pure Icon Mark Reveal */
              <motion.div
                key="emblem-phase"
                className="flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.8, filter: 'blur(4px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.94, filter: 'blur(2px)' }}
                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              >
                <img
                  src="/dehype-icon.png"
                  alt="DeHype"
                  className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-sm"
                />
              </motion.div>
            ) : (
              /* Phase 2: Full Lockup (Icon + DeHype + Tagline) */
              <motion.div
                key="full-logo-phase"
                className="flex flex-col items-center"
                initial={{ opacity: 0, scale: 0.92, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              >
                <img
                  src="/dehype-full.png"
                  alt="DeHype - Know What Matters To You"
                  className="w-[260px] sm:w-[320px] max-w-[85vw] h-auto object-contain drop-shadow-sm"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Delicate Emerald Progress Line ── */}
          <div className="mt-8 flex flex-col items-center gap-2">
            <div className="w-32 sm:w-40 h-[2px] rounded-full bg-[#1A4D2E]/10 overflow-hidden relative">
              <motion.div
                className="h-full bg-gradient-to-r from-[#2A7A47] via-[#5CA97B] to-[#1E5E35] rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 4.4, ease: 'easeInOut' }}
              />
            </div>
            <motion.span
              className="text-[10px] font-mono tracking-widest uppercase text-[#2A7A47]/70"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.8, 0.6] }}
              transition={{ delay: 1.0, duration: 2.0 }}
            >
              {stage === 'settled' ? 'Ready' : 'Personalizing AI Briefing'}
            </motion.span>
          </div>
        </div>

        {/* ── Discrete Skip Button (Top Right) ── */}
        <button
          onClick={onComplete}
          type="button"
          aria-label="Skip splash screen"
          className="absolute top-6 right-6 text-[11px] font-mono tracking-wider px-3.5 py-1.5 rounded-full border border-[#1A4D2E]/20 text-[#1A4D2E]/60 hover:text-[#1A4D2E] hover:border-[#1A4D2E]/40 hover:bg-[#1A4D2E]/5 transition-all cursor-pointer backdrop-blur-xs"
        >
          Skip &rarr;
        </button>
      </motion.div>
    </AnimatePresence>
  )
}
export default SplashScreen
