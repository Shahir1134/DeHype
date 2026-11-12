import React, { useEffect, useRef } from 'react'

interface ParticleFlowProps {
  active: boolean
  color?: string
  speed?: number
  particleCount?: number
  className?: string
}

export const ParticleFlow: React.FC<ParticleFlowProps> = ({
  active,
  color = '#4f8ef7',
  speed = 2,
  particleCount = 30,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef({ active, speed, color, particleCount })

  useEffect(() => {
    stateRef.current = { active, speed, color, particleCount }
  }, [active, speed, color, particleCount])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    interface Particle {
      x: number
      y: number
      baseY: number
      vx: number
      phase: number
      size: number
      opacity: number
      targetOpacity: number
    }

    const particles: Particle[] = Array.from({ length: particleCount }, (_, i) => ({
      x: Math.random() * canvas.width,
      y: canvas.height / 2,
      baseY: canvas.height * (0.3 + Math.random() * 0.4),
      vx: (0.5 + Math.random() * 1.5) * stateRef.current.speed,
      phase: Math.random() * Math.PI * 2,
      size: 2 + Math.random() * 3,
      opacity: 0,
      targetOpacity: active ? 0.4 + Math.random() * 0.5 : 0,
    }))
    // Stagger initial positions
    particles.forEach((p, i) => { p.x = (canvas.width / particleCount) * i })

    let frameId = 0

    const draw = () => {
      frameId = requestAnimationFrame(draw)
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const { active: isActive, speed: spd, color: col } = stateRef.current

      particles.forEach(p => {
        // Update opacity
        const target = isActive ? (0.4 + p.phase * 0.1) : 0
        p.opacity += (target - p.opacity) * 0.05

        if (p.opacity < 0.01) return

        // Move
        p.x += p.vx * (spd / 2)
        p.phase += 0.03
        p.y = p.baseY + Math.sin(p.phase) * 20

        // Wrap around
        if (p.x > canvas.width + p.size) {
          p.x = -p.size
          p.baseY = canvas.height * (0.3 + Math.random() * 0.4)
        }

        // Draw particle with glow
        ctx.save()
        ctx.globalAlpha = p.opacity
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2)
        gradient.addColorStop(0, col)
        gradient.addColorStop(1, 'transparent')
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2)
        ctx.fill()

        // Core dot
        ctx.globalAlpha = p.opacity * 1.5
        ctx.fillStyle = col
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      })
    }

    draw()

    const ro = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    })
    ro.observe(canvas)
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    return () => {
      cancelAnimationFrame(frameId)
      ro.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      aria-hidden="true"
    />
  )
}
