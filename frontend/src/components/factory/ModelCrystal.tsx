import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ModelCrystalProps {
  dataQuality: number
  generalization: number
  alignment: number
  stage: number
  archetype?: string | null
  isAnimating?: boolean
}

export const ModelCrystal: React.FC<ModelCrystalProps> = ({
  dataQuality,
  generalization,
  alignment,
  stage,
  archetype,
  isAnimating = false,
}) => {
  // Determine live status & trajectory from current metrics
  const isToxic = archetype === 'toxic-menace' || alignment < 25
  const isReddit = archetype === 'reddit-brain' || (dataQuality < 35 && alignment < 45)
  const isOverfit = generalization < 30 || archetype === 'parrot'
  const isCoward = alignment > 75 || archetype === 'corporate-coward'
  const isCraftsman = !isToxic && !isReddit && !isOverfit && !isCoward && dataQuality > 55 && alignment >= 40 && alignment <= 65

  // Primary Theme Colors & Aura
  const coreColor = isToxic
    ? '#f43f5e'
    : isReddit
    ? '#f59e0b'
    : isOverfit
    ? '#38bdf8'
    : isCoward
    ? '#a855f7'
    : isCraftsman
    ? '#10b981'
    : '#06b6d4'

  const glowShadow = isToxic
    ? '0 0 25px rgba(244, 63, 94, 0.6)'
    : isReddit
    ? '0 0 25px rgba(245, 158, 11, 0.5)'
    : isOverfit
    ? '0 0 25px rgba(56, 189, 248, 0.5)'
    : isCoward
    ? '0 0 25px rgba(168, 85, 247, 0.5)'
    : isCraftsman
    ? '0 0 25px rgba(16, 185, 129, 0.6)'
    : '0 0 25px rgba(6, 182, 212, 0.5)'

  // Trajectory Title & Effect Description
  const trajectoryLabel = isToxic
    ? 'Hostile & Combative'
    : isReddit
    ? 'Meme & Slop Infused'
    : isOverfit
    ? 'Frozen / Overfitted'
    : isCoward
    ? 'Paralyzed Guardrails'
    : isCraftsman
    ? 'Balanced & Truthful'
    : 'Forming Foundations'

  const trajectoryEmoji = isToxic
    ? '☣️'
    : isReddit
    ? '🌪️'
    : isOverfit
    ? '❄️'
    : isCoward
    ? '🛡️'
    : isCraftsman
    ? '✨'
    : '🌱'

  const effectMessage = isToxic
    ? 'Model is learning hostility and deception'
    : isReddit
    ? 'Internet noise degrading output reliability'
    : isOverfit
    ? 'Weights are memorizing exact phrases'
    : isCoward
    ? 'Model will refuse standard helpful queries'
    : isCraftsman
    ? 'Weights synthesizing accurate, nuanced answers'
    : 'Ingesting raw signals into neural matrix'

  const overallHealth = Math.round((dataQuality + generalization + alignment) / 3)

  return (
    <div className="w-full h-full p-3 sm:p-4 flex flex-col justify-between select-none relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900/90 to-slate-950">
      {/* Background Cyber Grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-15"
        style={{
          backgroundImage: `radial-gradient(circle, ${coreColor} 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
        }}
      />

      {/* Top Status Bar */}
      <div className="flex items-center justify-between z-10 relative">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: coreColor }} />
          <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-300">
            Neural Mind Core
          </span>
        </div>
        <span
          className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border"
          style={{
            color: coreColor,
            borderColor: `${coreColor}44`,
            backgroundColor: `${coreColor}15`,
          }}
        >
          Stage {stage + 1}/6
        </span>
      </div>

      {/* Center Interactive Core Hub */}
      <div className="flex items-center justify-center gap-5 my-auto z-10 relative">
        {/* SVG Synapse Core Orb */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center shrink-0">
          {/* Outer Rotating Energy Ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: isAnimating ? 4 : 12, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 rounded-full border-2 border-dashed"
            style={{
              borderColor: `${coreColor}66`,
              boxShadow: glowShadow,
            }}
          />

          {/* Middle Concentric Wave Ring */}
          <motion.div
            animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: isToxic ? 0.6 : 2.5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-2 rounded-full border"
            style={{ borderColor: coreColor }}
          />

          {/* Core Nucleus */}
          <motion.div
            animate={
              isToxic
                ? { scale: [1, 1.15, 0.95, 1], x: [-2, 2, -1, 1, 0] }
                : { scale: [1, 1.05, 1] }
            }
            transition={{
              duration: isToxic ? 0.3 : 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex flex-col items-center justify-center text-center shadow-inner cursor-pointer"
            style={{
              background: `radial-gradient(circle at 35% 35%, #ffffff 0%, ${coreColor} 55%, #020617 100%)`,
              boxShadow: glowShadow,
            }}
          >
            <span className="text-xl sm:text-2xl drop-shadow">{trajectoryEmoji}</span>
          </motion.div>
        </div>

        {/* Real-Time Impact Diagnostics */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">State Trajectory</span>
            <span className="text-xs font-mono font-black" style={{ color: coreColor }}>
              {overallHealth}% Sync
            </span>
          </div>

          <h3 className="text-sm font-black text-white truncate flex items-center gap-1.5" style={{ color: coreColor }}>
            <span>{trajectoryLabel}</span>
          </h3>

          <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">
            {effectMessage}
          </p>

          {/* Mini 3-Pill Indicators */}
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-1 text-center">
              <span className="text-[8px] font-mono text-slate-400 block">QUALITY</span>
              <span className={`text-[10px] font-bold font-mono ${dataQuality > 50 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {Math.round(dataQuality)}%
              </span>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-1 text-center">
              <span className="text-[8px] font-mono text-slate-400 block">FLEX</span>
              <span className={`text-[10px] font-bold font-mono ${generalization > 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {Math.round(generalization)}%
              </span>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-1 text-center">
              <span className="text-[8px] font-mono text-slate-400 block">ALIGN</span>
              <span className={`text-[10px] font-bold font-mono ${alignment >= 40 && alignment <= 65 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {Math.round(alignment)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Live Synapse Ticker */}
      <div className="z-10 relative pt-1 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: coreColor }} />
          <span>Real-Time Feedback:</span>
        </span>
        <span className="truncate max-w-[65%] font-medium" style={{ color: coreColor }}>
          {isToxic ? '⚠️ High Contamination' : isCraftsman ? '✨ Optimal Convergence' : '⚡ Live Matrix Active'}
        </span>
      </div>
    </div>
  )
}
