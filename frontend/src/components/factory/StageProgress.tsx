import React from 'react'
import { motion } from 'framer-motion'

interface StageProgressProps {
  currentStage: number
  stageComplete: boolean[]
  onSelectStage?: (stage: number) => void
}

const STAGES = [
  { index: 0, label: 'Collect', icon: '📡' },
  { index: 1, label: 'Clean', icon: '🧹' },
  { index: 2, label: 'Train', icon: '⚡' },
  { index: 3, label: 'Polish', icon: '✨' },
  { index: 4, label: 'Exam', icon: '📝' },
  { index: 5, label: 'Release', icon: '🚀' },
]

export const StageProgress: React.FC<StageProgressProps> = ({
  currentStage,
  stageComplete,
  onSelectStage,
}) => {
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      {STAGES.map((s, idx) => {
        const isActive = currentStage === s.index
        const isDone = stageComplete[s.index]
        const isClickable = isDone || isActive

        return (
          <div key={s.index} className="flex items-center">
            <button
              onClick={() => isClickable && onSelectStage?.(s.index)}
              disabled={!isClickable}
              className={`relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : isDone
                  ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
              }`}
              title={`${s.label} (${isDone ? 'Completed' : isActive ? 'Current' : 'Locked'})`}
            >
              {isDone && !isActive ? (
                <span className="text-xs font-bold text-emerald-400">✓</span>
              ) : (
                <span className="text-xs sm:text-sm">{s.icon}</span>
              )}

              {isActive && (
                <motion.div
                  layoutId="active-stage-glow"
                  className="absolute inset-0 rounded-xl ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-900 pointer-events-none"
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                />
              )}
            </button>

            {idx < STAGES.length - 1 && (
              <div
                className={`w-2 sm:w-3 h-0.5 mx-0.5 rounded-full ${
                  stageComplete[s.index] ? 'bg-emerald-500/60' : 'bg-slate-700'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
