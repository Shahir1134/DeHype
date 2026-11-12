// Single source of truth for all motion values and rules
// Adheres strictly to the Motion System spec:
// durations: fast 160ms, base 240ms, slow 400ms, hero 600ms
// easing: out cubic-bezier(.22,1,.36,1); inOut cubic-bezier(.65,0,.35,1)
// springs: ui {stiffness 380, damping 30}; soft {stiffness 220, damping 26}
// stagger 60ms (max 6 items), distance 12px, press scale 0.97, hover lift 2px

export const duration = {
  fast: 0.16,
  base: 0.24,
  slow: 0.4,
  hero: 0.6,
  reduced: 0.12, // 120ms fades for reduced motion
} as const

export const ease = {
  out: [0.22, 1, 0.36, 1] as const,
  inOut: [0.65, 0, 0.35, 1] as const,
} as const

export const spring = {
  ui: {
    type: 'spring' as const,
    stiffness: 380,
    damping: 30,
  },
  soft: {
    type: 'spring' as const,
    stiffness: 220,
    damping: 26,
  },
} as const

export const stagger = {
  delay: 0.06,
  max: 6,
} as const

export const distance = 12 // px
export const press = { scale: 0.97 }
export const hover = { y: -2 }

// Check if device is low-end (deviceMemory <= 4 or hardwareConcurrency <= 4)
export const isLowEndDevice = (): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false
  const nav = navigator as any
  if (nav.deviceMemory && nav.deviceMemory <= 4) return true
  if (nav.hardwareConcurrency && nav.hardwareConcurrency <= 4) return true
  return false
}

// Check OS-level reduced motion preference
export const getSystemReducedMotion = (): boolean => {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Feature flags for motion groups
export const MOTION_FLAGS = {
  revealCards: true,
  staggerList: true,
  slidingPill: true,
  progressRing: true,
  animatedNumber: true,
  dotsSequential: true,
  bottomSheet: true,
  flyToTarget: true,
  listenWave: true,
  checkDraw: true,
  skeletonShimmer: true,
  toast: true,
} as const
