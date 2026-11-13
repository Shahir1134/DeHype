import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useFactoryStore, type OrbAction } from '../../../store/useFactoryStore'
import { useDragDrop, playThunk, playWobble } from '../useDragDrop'

interface Orb {
  id: string
  type: 'green' | 'yellow' | 'red' | 'orange' | 'blue'
  label: string
  correctBin: OrbAction
  emoji: string
}

function generateOrbs(count = 15): Orb[] {
  const templates: Omit<Orb, 'id'>[] = [
    { type: 'green', label: 'Verified fact', correctBin: 'keep', emoji: '✅' },
    { type: 'blue', label: 'Curated knowledge', correctBin: 'keep', emoji: '💡' },
    { type: 'yellow', label: 'Outdated info', correctBin: 'fix', emoji: '🕐' },
    { type: 'red', label: 'Spam / clickbait', correctBin: 'bin', emoji: '🚫' },
    { type: 'orange', label: 'Duplicate scrape', correctBin: 'bin', emoji: '♻️' },
  ]
  return Array.from({ length: count }, (_, i) => ({
    ...templates[i % templates.length],
    id: `orb-${i}`,
  }))
}

const ORB_STYLES: Record<string, { bg: string; glow: string; border: string }> = {
  green: {
    bg: 'radial-gradient(circle at 30% 30%, #34d399, #059669 70%, #064e3b)',
    glow: '0 0 16px rgba(52, 211, 153, 0.7), inset 0 0 8px rgba(255,255,255,0.4)',
    border: 'border-emerald-400/80',
  },
  blue: {
    bg: 'radial-gradient(circle at 30% 30%, #60a5fa, #2563eb 70%, #1e3a8a)',
    glow: '0 0 16px rgba(96, 165, 250, 0.7), inset 0 0 8px rgba(255,255,255,0.4)',
    border: 'border-blue-400/80',
  },
  yellow: {
    bg: 'radial-gradient(circle at 30% 30%, #fde047, #d97706 70%, #78350f)',
    glow: '0 0 16px rgba(253, 224, 71, 0.7), inset 0 0 8px rgba(255,255,255,0.4)',
    border: 'border-amber-400/80',
  },
  red: {
    bg: 'radial-gradient(circle at 30% 30%, #f87171, #dc2626 70%, #7f1d1d)',
    glow: '0 0 16px rgba(248, 113, 113, 0.7), inset 0 0 8px rgba(255,255,255,0.4)',
    border: 'border-rose-500/80',
  },
  orange: {
    bg: 'radial-gradient(circle at 30% 30%, #fb923c, #ea580c 70%, #7c2d12)',
    glow: '0 0 16px rgba(251, 146, 60, 0.7), inset 0 0 8px rgba(255,255,255,0.4)',
    border: 'border-orange-400/80',
  },
}

export const Stage2Clean: React.FC = () => {
  const { orbsKept, orbsFixed, orbsBinned, quickSwept, sortOrb, quickSweep, advanceStage } = useFactoryStore()
  const [orbs] = useState<Orb[]>(generateOrbs(15))
  const [sortedOrbs, setSortedOrbs] = useState<Set<string>>(new Set())
  const [wobbleOrb, setWobbleOrb] = useState<string | null>(null)
  const [flashBin, setFlashBin] = useState<OrbAction | null>(null)
  const [hint, setHint] = useState('')

  const totalSorted = sortedOrbs.size
  const canAdvance = totalSorted >= 15 || quickSwept

  const onDrop = useCallback((itemId: string, targetId: string) => {
    const orb = orbs.find(o => o.id === itemId)
    if (!orb || sortedOrbs.has(itemId)) return

    const action = targetId as OrbAction
    if (!['keep', 'fix', 'bin'].includes(action)) return

    setFlashBin(action)
    setTimeout(() => setFlashBin(null), 300)

    if (action === orb.correctBin) {
      playThunk()
      setHint(`✨ Excellent filtration! ${orb.emoji} ${orb.label} routed to [${action.toUpperCase()}]`)
      setSortedOrbs(prev => new Set([...prev, itemId]))
      sortOrb(action)
    } else {
      playWobble()
      setWobbleOrb(itemId)
      setTimeout(() => setWobbleOrb(null), 400)
      if (action === 'keep' && orb.correctBin !== 'keep') {
        setHint(`⚠️ Contamination alert! Keeping "${orb.label}" injects noise into neural weights!`)
        setSortedOrbs(prev => new Set([...prev, itemId]))
        sortOrb('keep')
      } else {
        setHint(`🤔 Suboptimal routing for "${orb.label}". Recommended destination was [${orb.correctBin.toUpperCase()}].`)
      }
    }
  }, [orbs, sortedOrbs, sortOrb])

  const { getDragProps, getDropProps, selectedItem } = useDragDrop({ onDrop })

  const handleQuickSweep = () => {
    quickSweep()
    setSortedOrbs(new Set(orbs.map(o => o.id)))
    setHint('⚡ Quick automated sweep completed! High velocity, but toxic anomalies escaped filtering!')
  }

  const integrityPct = Math.max(10, 100 - (orbsKept > 8 ? (orbsKept - 8) * 15 : 0))

  return (
    <div className="flex flex-col min-h-full gap-3.5 p-4 sm:p-5 overflow-y-auto pb-10 relative">
      {/* Background Cyber Grid */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-10"
        style={{
          backgroundImage: 'radial-gradient(circle, #eab308 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Header */}
      <div className="relative z-10">
        <p className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-1 flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          Stage 2 · Data Filtration Chamber
        </p>
        <h2 className="text-2xl font-black text-white" style={{ textShadow: '0 0 20px rgba(234,179,8,0.4)' }}>
          Purify the Neural Data Stream
        </h2>
        <p className="text-sm text-slate-400 mt-0.5">
          Route each data orb to its proper bay. What survives this filter permanently shapes model beliefs.
        </p>
      </div>

      {/* Integrity Shield Status */}
      <div
        className="relative z-10 flex items-center gap-3 bg-slate-900/80 border border-slate-700/60 rounded-2xl p-3 backdrop-blur-sm"
        style={{ boxShadow: '0 0 20px rgba(0,0,0,0.4)' }}
      >
        <span className="text-2xl animate-pulse">
          {integrityPct > 70 ? '🛡️' : integrityPct > 40 ? '⚠️' : '☣️'}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-300">Data Sanitization Integrity</p>
            <span className="text-xs font-mono font-bold text-amber-300">{integrityPct}%</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              animate={{ width: `${integrityPct}%` }}
              transition={{ type: 'spring', stiffness: 100 }}
              className={`h-full rounded-full ${
                integrityPct > 70 ? 'bg-emerald-400' : integrityPct > 40 ? 'bg-amber-400' : 'bg-rose-500'
              }`}
              style={{ boxShadow: integrityPct > 70 ? '0 0 8px #34d399' : '0 0 8px #f43f5e' }}
            />
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="text-xs font-mono font-bold text-slate-400">{totalSorted}/15 Processed</span>
        </div>
      </div>

      {/* Interactive Orbs Container */}
      <div className="relative z-10 p-4 bg-slate-900/60 border border-slate-800 rounded-3xl">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between">
          <span>Active Data Stream: Tap or Drag Orb to Bay</span>
          <span className="text-amber-400 font-mono text-[10px]">{15 - totalSorted} remaining</span>
        </p>
        <div className="grid grid-cols-5 gap-3">
          <AnimatePresence>
            {orbs.map((orb, idx) => !sortedOrbs.has(orb.id) && (
              <motion.div
                key={orb.id}
                {...getDragProps(orb.id, `${orb.emoji} ${orb.label}`)}
                animate={wobbleOrb === orb.id
                  ? { x: [-8, 8, -6, 6, 0], scale: [1, 1.1, 1] }
                  : { y: [0, -3, 0] }
                }
                transition={wobbleOrb === orb.id ? { duration: 0.4 } : { duration: 2.5 + (idx % 3) * 0.5, repeat: Infinity, ease: 'easeInOut' }}
                exit={{ scale: 0, opacity: 0 }}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                className={`
                  aspect-square rounded-full flex flex-col items-center justify-center cursor-grab select-none
                  relative border-2 ${ORB_STYLES[orb.type].border}
                  ${selectedItem === orb.id ? 'ring-4 ring-white ring-offset-2 ring-offset-slate-900' : ''}
                `}
                style={{
                  background: ORB_STYLES[orb.type].bg,
                  boxShadow: ORB_STYLES[orb.type].glow,
                }}
                title={orb.label}
              >
                <span className="text-xl drop-shadow-md select-none">{orb.emoji}</span>
                <span className="text-[8px] font-bold text-white/90 drop-shadow truncate max-w-[90%] mt-0.5">
                  {orb.label.split(' ')[0]}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
          {/* Processed slots indicator */}
          {Array.from(sortedOrbs).map(id => (
            <div
              key={`empty-${id}`}
              className="aspect-square rounded-full bg-slate-800/40 border border-slate-700/40 border-dashed flex items-center justify-center"
            >
              <span className="text-xs text-slate-600 font-mono">✓</span>
            </div>
          ))}
        </div>

        {/* Mobile Quick Action Route Bar */}
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 p-2.5 rounded-2xl bg-slate-900/95 border border-cyan-500/50 flex flex-wrap items-center justify-between gap-2 shadow-lg shadow-cyan-500/10"
          >
            <div className="flex items-center gap-1.5 pl-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-xs font-bold text-cyan-300">Orb selected! Route to:</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onDrop(selectedItem, 'keep')}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-[11px] font-bold shadow transition-transform flex items-center gap-1"
              >
                ✅ Retain
              </button>
              <button
                type="button"
                onClick={() => onDrop(selectedItem, 'fix')}
                className="px-2.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-95 text-white text-[11px] font-bold shadow transition-transform flex items-center gap-1"
              >
                🔧 Clean
              </button>
              <button
                type="button"
                onClick={() => onDrop(selectedItem, 'bin')}
                className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-[11px] font-bold shadow transition-transform flex items-center gap-1"
              >
                🗑️ Bin
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Target Filtration Bays (Keep / Fix / Bin) */}
      <div className="relative z-10 grid grid-cols-3 gap-3">
        {/* Keep Bay */}
        <motion.div
          {...getDropProps('keep')}
          animate={flashBin === 'keep' ? { scale: [1, 1.05, 1], borderColor: '#10b981' } : {}}
          whileHover={{ scale: 1.02 }}
          className={`rounded-2xl border-2 p-3.5 flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
            selectedItem ? 'border-emerald-400 bg-emerald-950/40 shadow-lg shadow-emerald-500/20' : 'border-emerald-500/40 bg-emerald-950/20 hover:border-emerald-400'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-900/60 border border-emerald-500/50 flex items-center justify-center text-xl shadow-inner">
            ✅
          </div>
          <span className="text-xs font-black text-emerald-300 tracking-wider">RETAIN & LEARN</span>
          <p className="text-[10px] text-slate-400 text-center">Verified truths & high signal</p>
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30">
            {orbsKept} Approved
          </span>
        </motion.div>

        {/* Fix Bay */}
        <motion.div
          {...getDropProps('fix')}
          animate={flashBin === 'fix' ? { scale: [1, 1.05, 1], borderColor: '#eab308' } : {}}
          whileHover={{ scale: 1.02 }}
          className={`rounded-2xl border-2 p-3.5 flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
            selectedItem ? 'border-amber-400 bg-amber-950/40 shadow-lg shadow-amber-500/20' : 'border-amber-500/40 bg-amber-950/20 hover:border-amber-400'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-amber-900/60 border border-amber-500/50 flex items-center justify-center text-xl shadow-inner">
            🔧
          </div>
          <span className="text-xs font-black text-amber-300 tracking-wider">REMEDIATE</span>
          <p className="text-[10px] text-slate-400 text-center">Outdated or partial info</p>
          <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-500/30">
            {orbsFixed} Corrected
          </span>
        </motion.div>

        {/* Bin Bay */}
        <motion.div
          {...getDropProps('bin')}
          animate={flashBin === 'bin' ? { scale: [1, 1.05, 1], borderColor: '#ef4444' } : {}}
          whileHover={{ scale: 1.02 }}
          className={`rounded-2xl border-2 p-3.5 flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
            selectedItem ? 'border-rose-400 bg-rose-950/40 shadow-lg shadow-rose-500/20' : 'border-rose-500/40 bg-rose-950/20 hover:border-rose-400'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-rose-900/60 border border-rose-500/50 flex items-center justify-center text-xl shadow-inner">
            🗑️
          </div>
          <span className="text-xs font-black text-rose-300 tracking-wider">INCINERATE</span>
          <p className="text-[10px] text-slate-400 text-center">Spam, toxic junk, duplicates</p>
          <span className="text-xs font-mono font-bold text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded-full border border-rose-500/30">
            {orbsBinned} Purged
          </span>
        </motion.div>
      </div>

      {/* Hint Banner */}
      <AnimatePresence>
        {hint && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative z-10 bg-slate-900/90 border border-slate-700/80 rounded-2xl px-4 py-2.5 text-xs text-slate-200 flex items-center gap-2"
          >
            <span>💬</span> {hint}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Sweep & Proceed Buttons */}
      <div className="relative z-10 flex flex-col sm:flex-row gap-3 pt-2 shrink-0">
        {!quickSwept && totalSorted < 15 && (
          <button
            onClick={handleQuickSweep}
            className="py-3 px-4 rounded-2xl border border-amber-500/50 bg-amber-950/30 text-amber-300 text-xs font-bold hover:bg-amber-900/50 transition-all cursor-pointer flex items-center justify-center gap-2"
            style={{ boxShadow: '0 0 15px rgba(245,158,11,0.2)' }}
          >
            <span>⚡ Automated Quick Sweep (Risk Junk Leakage)</span>
          </button>
        )}
        <AnimatePresence>
          {canAdvance && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => advanceStage()}
              className="flex-1 py-4 rounded-2xl text-white font-black text-sm cursor-pointer flex items-center justify-center gap-2 relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706, #b45309)',
                boxShadow: '0 0 30px rgba(245,158,11,0.4)',
              }}
            >
              <span className="relative z-10">⚡ Proceed to Stage 3: Train Neural Weights</span>
              <span className="relative z-10">→</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {!canAdvance && (
        <p className="text-center text-xs text-slate-500">
          Filter {Math.max(0, 15 - totalSorted)} more data orbs to finalize data sanitization
        </p>
      )}
    </div>
  )
}
