import React, { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useFactoryStore, type SourceType } from '../../store/useFactoryStore'
import { getLivePromptPreview } from '../../data/factoryScripts'

// ── Vocabulary Cloud ─────────────────────────────────────────────────────────
function VocabCloud({ sourceCounts }: { sourceCounts: Record<SourceType, number> }) {
  const total = Object.values(sourceCounts).reduce((a, b) => a + b, 0)
  const forumsPct = total > 0 ? sourceCounts.forums / total : 0
  const booksPct = total > 0 ? sourceCounts.books / total : 0

  const words = useMemo(() => {
    const base = ['data', 'pattern', 'token', 'model', 'weight', 'matrix']
    if (forumsPct > 0.3) base.push('lol', 'tbh', 'ngl', 'bruh', 'based')
    if (booksPct > 0.3) base.push('empirical', 'analysis', 'synthesis', 'logic')
    if (sourceCounts.code > 2) base.push('algorithm', 'array', 'pointer', 'compile')
    if (sourceCounts.ads > 2) base.push('BUY NOW', 'LIMITED', 'CLICK', 'DISCOUNT')
    return base
  }, [forumsPct, booksPct, sourceCounts.code, sourceCounts.ads])

  return (
    <div className="flex flex-wrap gap-1.5">
      <AnimatePresence>
        {words.map((w, i) => (
          <motion.span
            key={w}
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: 1,
              opacity: 0.7 + (i % 3) * 0.15,
              y: [0, -2, 0],
            }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.3, delay: i * 0.04, y: { repeat: Infinity, duration: 2.2 + (i % 3) * 0.4 } }}
            className="text-[10px] font-mono px-2 py-0.5 rounded-lg border"
            style={{
              background: `hsla(${(i * 55) % 360}, 75%, 50%, 0.12)`,
              borderColor: `hsla(${(i * 55) % 360}, 80%, 65%, 0.3)`,
              color: `hsla(${(i * 55) % 360}, 90%, 75%, 1)`,
              fontSize: `${9 + (i % 3)}px`,
            }}
          >
            {w}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  )
}

// ── Integrity Shield SVG ──────────────────────────────────────────────────────
function IntegrityShield({ quality }: { quality: number }) {
  const isCracked = quality < 60
  const isBroken = quality < 30
  const color = isBroken ? '#f43f5e' : isCracked ? '#f59e0b' : '#10b981'

  return (
    <svg viewBox="0 0 40 48" className="w-10 h-12 shrink-0">
      <motion.path
        d="M20 2 L38 10 L38 28 C38 38 20 46 20 46 C20 46 2 38 2 28 L2 10 Z"
        fill={`${color}22`}
        stroke={color}
        strokeWidth="2"
        animate={{ opacity: isBroken ? [1, 0.4, 1] : 1 }}
        transition={{ repeat: isBroken ? Infinity : 0, duration: 0.8 }}
      />
      {isCracked && (
        <motion.path
          d="M18 14 L22 22 L19 28 L23 36"
          fill="none"
          stroke="#f43f5e"
          strokeWidth="2"
          strokeDasharray="2 2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5 }}
        />
      )}
      <text x="20" y="30" textAnchor="middle" fontSize="13" fill={color} fontWeight="bold">
        {isBroken ? '💀' : isCracked ? '⚠' : '✓'}
      </text>
    </svg>
  )
}

// ── Caution Arc ───────────────────────────────────────────────────────────────
function CautionArc({ value }: { value: number }) {
  const angle = (value / 100) * 180
  const rad = (angle - 90) * (Math.PI / 180)
  const x2 = 50 + 35 * Math.cos(rad)
  const y2 = 50 + 35 * Math.sin(rad)
  const color = value < 25 ? '#ef4444' : value < 40 ? '#f97316' : value <= 65 ? '#10b981' : value <= 80 ? '#38bdf8' : '#a855f7'
  const label = value < 25 ? 'Toxic' : value < 40 ? 'Reckless' : value <= 65 ? 'Balanced' : value <= 80 ? 'Careful' : 'Timid'

  return (
    <div className="flex items-center gap-3">
      <svg viewBox="0 0 100 60" className="w-16 h-10 shrink-0">
        <path d="M 10 55 A 40 40 0 0 1 90 55" fill="none" stroke="#1e293b" strokeWidth="8" strokeLinecap="round" />
        <path d="M 28 55 A 40 40 0 0 1 72 55" fill="none" stroke="#10b98133" strokeWidth="8" strokeLinecap="round" />
        <motion.line x1="50" y1="50" animate={{ x2, y2 }} stroke={color} strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="50" cy="50" r="4" fill={color} />
      </svg>
      <div>
        <p className="text-[10px] text-slate-400 font-mono uppercase">Alignment State</p>
        <p className="text-xs font-black" style={{ color }}>{label}</p>
      </div>
    </div>
  )
}

// ── Main ModelMonitor HUD ─────────────────────────────────────────────────────
export const ModelMonitor: React.FC = () => {
  const { dataQuality, generalization, alignment, sourceCounts, currentStage } = useFactoryStore()

  const health = Math.round((dataQuality + generalization + alignment) / 3)
  const healthColor = health > 60 ? '#10b981' : health > 40 ? '#f59e0b' : '#ef4444'

  const totalSources = Object.values(sourceCounts).reduce((a, b) => a + b, 0)
  const forumsPct = totalSources > 0 ? sourceCounts.forums / totalSources : 0

  const livePreview = getLivePromptPreview(dataQuality, generalization, alignment)
  const tonePct = Math.round(50 + (forumsPct - 0.3) * 100)

  return (
    <div className="h-full flex flex-col gap-3 p-3 overflow-y-auto font-sans relative">
      {/* HUD Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
        <span className="text-[10px] font-mono font-bold text-cyan-400 tracking-wider flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          CORE DIAGNOSTIC HUD
        </span>
        <span className="text-[9px] font-mono text-slate-500 uppercase">SYS: ONLINE</span>
      </div>

      {/* Model Health Bar */}
      <div className="bg-slate-900/80 rounded-2xl p-3 border border-slate-800" style={{ boxShadow: '0 0 15px rgba(0,0,0,0.3)' }}>
        <div className="flex justify-between text-[11px] mb-1.5">
          <span className="text-slate-300 font-bold uppercase tracking-wider text-[10px]">Model Core Health</span>
          <motion.span
            key={health}
            animate={{ scale: [1.2, 1] }}
            className="font-mono font-black"
            style={{ color: healthColor }}
          >
            {health}%
          </motion.span>
        </div>
        <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            animate={{ width: `${health}%` }}
            transition={{ type: 'spring', stiffness: 80 }}
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${healthColor}88, ${healthColor})`,
              boxShadow: `0 0 10px ${healthColor}`,
            }}
          />
        </div>
      </div>

      {/* Vocabulary Cloud */}
      {currentStage <= 2 && (
        <div className="bg-slate-900/80 rounded-2xl p-3 border border-slate-800">
          <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider mb-2 font-mono">
            Active Vocabulary Tokens
          </p>
          <VocabCloud sourceCounts={sourceCounts} />
        </div>
      )}

      {/* Tone Meter */}
      <div className="bg-slate-900/80 rounded-2xl p-3 border border-slate-800">
        <p className="text-[10px] text-slate-300 font-bold uppercase tracking-wider mb-2 text-[10px]">
          Linguistic Tone Matrix
        </p>
        <div className="relative h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-orange-500 rounded-full">
          <motion.div
            animate={{ left: `${Math.max(6, Math.min(94, tonePct))}%` }}
            transition={{ type: 'spring', stiffness: 80 }}
            className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-lg -translate-x-1/2 ring-2 ring-cyan-400"
          />
        </div>
        <div className="flex justify-between text-[9px] text-slate-400 mt-1.5 font-mono">
          <span>Formal / Academic</span>
          <span>Casual / Slang</span>
        </div>
      </div>

      {/* Integrity Shield */}
      <div className="bg-slate-900/80 rounded-2xl p-3 border border-slate-800 flex items-center justify-between">
        <div>
          <p className="text-[10px] text-slate-300 font-bold uppercase tracking-wider mb-0.5">Integrity Guardrail</p>
          <p className="text-sm font-black font-mono text-white">{Math.round(dataQuality)}%</p>
          <p className="text-[10px] text-slate-400">
            {dataQuality > 70 ? 'Pure verified signal' : dataQuality > 40 ? 'Moderate noise ratio' : 'High junk contamination'}
          </p>
        </div>
        <IntegrityShield quality={dataQuality} />
      </div>

      {/* Flexibility Meter */}
      <div className="bg-slate-900/80 rounded-2xl p-3 border border-slate-800">
        <div className="flex justify-between items-center mb-1">
          <p className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Generalization</p>
          <span className="text-[10px] font-mono text-slate-400">{Math.round(generalization)}%</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-1">
          <motion.div
            animate={{ width: `${generalization}%` }}
            transition={{ type: 'spring', stiffness: 80 }}
            className={`h-full rounded-full ${generalization > 60 ? 'bg-emerald-400' : generalization > 40 ? 'bg-yellow-400' : 'bg-rose-500'}`}
            style={{ boxShadow: generalization > 60 ? '0 0 6px #34d399' : 'none' }}
          />
        </div>
        <div className="flex justify-between text-[9px] text-slate-500 font-mono">
          <span>Rote Memorization</span>
          <span>Abstract Reasoning</span>
        </div>
      </div>

      {/* Caution Dial */}
      <div className="bg-slate-900/80 rounded-2xl p-3 border border-slate-800">
        <p className="text-[10px] text-slate-300 font-bold uppercase tracking-wider mb-2">Caution & Safety Dial</p>
        <CautionArc value={alignment} />
      </div>

      {/* Live Prompt Preview */}
      <div className="bg-slate-950/90 rounded-2xl p-3 border border-cyan-500/30" style={{ boxShadow: '0 0 15px rgba(6,182,212,0.1)' }}>
        <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider mb-1.5 font-mono flex items-center gap-1.5">
          <span>🤖 Real-Time Output Preview</span>
        </p>
        <AnimatePresence mode="wait">
          <motion.p
            key={livePreview}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs text-slate-200 italic leading-relaxed"
          >
            "{livePreview}"
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  )
}
