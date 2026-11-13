import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useFactoryStore, type SourceType } from '../../../store/useFactoryStore'
import { useDragDrop, playThunk, playWobble } from '../useDragDrop'
import { ParticleFlow } from '../ParticleFlow'

const SOURCES: { type: SourceType; emoji: string; label: string; quality: 'good' | 'ok' | 'bad' }[] = [
  { type: 'books', emoji: '📚', label: 'Books', quality: 'good' },
  { type: 'code', emoji: '💻', label: 'Code', quality: 'good' },
  { type: 'forums', emoji: '💬', label: 'Forums', quality: 'ok' },
  { type: 'social', emoji: '📱', label: 'Social', quality: 'ok' },
  { type: 'ads', emoji: '📢', label: 'Ads', quality: 'bad' },
  { type: 'spam', emoji: '🗑️', label: 'Spam', quality: 'bad' },
]

const BELT_TARGET = 'conveyor-belt'

const qualityGlow: Record<string, string> = {
  good: '0 0 18px rgba(16,185,129,0.6)',
  ok: '0 0 18px rgba(99,102,241,0.5)',
  bad: '0 0 18px rgba(239,68,68,0.5)',
}
const qualityBorder: Record<string, string> = {
  good: 'border-emerald-500/60 bg-emerald-900/30 hover:border-emerald-400',
  ok: 'border-indigo-500/50 bg-indigo-900/25 hover:border-indigo-400',
  bad: 'border-red-500/50 bg-red-900/25 hover:border-red-400',
}

export const Stage1Collect: React.FC = () => {
  const { sourceCounts, balanceMeter, dataQuality, addSource, advanceStage } = useFactoryStore()
  const [hint, setHint] = useState('')
  const [lastDropped, setLastDropped] = useState<string | null>(null)
  const [popSource, setPopSource] = useState<string | null>(null)

  const total = Object.values(sourceCounts).reduce((a, b) => a + b, 0)
  const canAdvance = total >= 8

  const onDrop = (itemId: string, targetId: string) => {
    if (targetId !== BELT_TARGET) return
    const source = SOURCES.find(s => s.type === itemId)
    if (!source) return

    if (source.quality === 'bad') {
      playWobble()
      setHint(`${source.emoji} ${source.label}? Really? I can feel my IQ dropping... 🤕`)
    } else {
      playThunk()
      if (balanceMeter < 40 && total > 4) {
        setHint("Hmm, this diet looks one-sided... I need more variety! 🤔")
      } else {
        setHint(`Great! ${source.emoji} ${source.label} added to the mix.`)
      }
    }

    addSource(itemId as SourceType)
    setLastDropped(itemId)
    setPopSource(itemId)
    setTimeout(() => { setLastDropped(null); setPopSource(null) }, 500)
  }

  const { getDragProps, getDropProps, selectedItem } = useDragDrop({ onDrop })
  const dominantSource = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1])[0]
  const dominantPct = total > 0 ? Math.round((dominantSource[1] / total) * 100) : 0

  return (
    <div className="flex flex-col min-h-full gap-3 p-4 sm:p-5 relative overflow-y-auto pb-10">
      {/* Background particle flow */}
      <ParticleFlow active={total > 0} color="#00d4ff" speed={Math.min(5, total / 3)} particleCount={30} />

      {/* Scanline overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,212,255,1) 2px, rgba(0,212,255,1) 3px)',
        }}
      />

      {/* Header */}
      <div className="relative z-10">
        <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-1 flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          Stage 1 · Collect Data
        </p>
        <h2 className="text-2xl font-black text-white" style={{ textShadow: '0 0 20px rgba(0,212,255,0.5)' }}>
          Fill the Training Belt
        </h2>
        <p className="text-sm text-slate-400 mt-0.5">
          Drag sources onto the belt. Balance matters — a one-sided diet makes a one-sided mind.
        </p>
      </div>

      {/* Source shelf */}
      <div className="relative z-10 grid grid-cols-3 sm:grid-cols-6 gap-2">
        {SOURCES.map(src => (
          <motion.div
            key={src.type}
            {...getDragProps(src.type, `${src.emoji} ${src.label}`, BELT_TARGET)}
            whileTap={{ scale: 0.88 }}
            animate={popSource === src.type
              ? { scale: [1, 0.8, 1.15, 1], rotate: [0, -5, 5, 0] }
              : lastDropped === src.type
              ? { scale: [1, 0.85, 1] }
              : { scale: 1 }
            }
            className={`
              flex flex-col items-center gap-1 p-3 rounded-2xl cursor-grab select-none
              border-2 transition-all relative overflow-hidden
              ${qualityBorder[src.quality]}
              ${selectedItem === src.type ? 'ring-2 ring-cyan-400 ring-offset-1 ring-offset-slate-900' : ''}
            `}
            style={selectedItem === src.type || popSource === src.type
              ? { boxShadow: qualityGlow[src.quality] }
              : {}}
          >
            {/* Shimmer effect on hover */}
            <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity"
              style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 60%)' }} />

            <span className="text-2xl relative z-10">{src.emoji}</span>
            <span className="text-xs font-bold text-slate-200 relative z-10">{src.label}</span>
            {sourceCounts[src.type] > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-[10px] font-black text-white bg-cyan-500 rounded-full px-1.5 py-0.5 relative z-10"
                style={{ boxShadow: '0 0 8px rgba(0,212,255,0.6)' }}
              >
                ×{sourceCounts[src.type]}
              </motion.span>
            )}
          </motion.div>
        ))}
      </div>

      {/* Conveyor belt drop zone */}
      <motion.div
        {...getDropProps(BELT_TARGET)}
        animate={selectedItem ? {
          borderColor: ['#00d4ff', '#a855f7', '#00d4ff'],
          boxShadow: ['0 0 20px rgba(0,212,255,0.2)', '0 0 30px rgba(168,85,247,0.3)', '0 0 20px rgba(0,212,255,0.2)']
        } : {}}
        transition={{ duration: 2, repeat: Infinity }}
        className={`
          relative z-10 min-h-[90px] py-4 rounded-3xl border-2 border-dashed
          flex flex-col items-center justify-center gap-2 transition-all cursor-pointer shrink-0
          ${selectedItem ? 'border-cyan-400 bg-cyan-900/20' : 'border-slate-600/60 bg-slate-800/30'}
        `}
        style={selectedItem ? { boxShadow: '0 0 25px rgba(0,212,255,0.2)' } : {}}
      >
        {/* Moving belt lines */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl opacity-20">
          <motion.div
            animate={{ x: [0, 60] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-y-0 w-[200%]"
            style={{
              backgroundImage: 'repeating-linear-gradient(90deg, transparent 0px, transparent 20px, rgba(0,212,255,0.3) 20px, rgba(0,212,255,0.3) 24px)',
            }}
          />
        </div>

        <span className="text-3xl relative z-10">🏭</span>
        <span className="text-sm text-slate-300 font-semibold relative z-10">
          {total === 0 ? 'Drop or tap a source here' : `${total} items on the belt`}
        </span>

        {/* Visual belt items */}
        <div className="flex gap-1.5 flex-wrap justify-center px-4 relative z-10">
          <AnimatePresence>
            {Object.entries(sourceCounts).flatMap(([type, count]) =>
              Array.from({ length: count }, (_, i) => {
                const src = SOURCES.find(s => s.type === type)!
                return (
                  <motion.span
                    key={`${type}-${i}`}
                    initial={{ scale: 0, y: -20, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                    className="text-lg"
                  >
                    {src.emoji}
                  </motion.span>
                )
              })
            )}
          </AnimatePresence>
        </div>

        {total > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-3 right-3 text-xs font-black text-white bg-cyan-600 rounded-full px-2.5 py-1"
            style={{ boxShadow: '0 0 10px rgba(0,212,255,0.5)' }}
          >
            {total} items
          </motion.div>
        )}
      </motion.div>

      {/* Balance + Quality meters */}
      <div className="relative z-10 grid grid-cols-2 gap-3">
        {/* Balance Meter */}
        <div className="bg-slate-900/80 rounded-2xl p-3 border border-slate-700/50"
          style={{ boxShadow: '0 0 15px rgba(0,0,0,0.3)' }}>
          <p className="text-xs text-slate-400 mb-2 font-bold uppercase tracking-wider">⚖️ Balance Meter</p>
          <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              animate={{ width: `${balanceMeter}%` }}
              transition={{ type: 'spring', stiffness: 120 }}
              className={`h-full rounded-full relative ${
                balanceMeter > 60 ? 'bg-emerald-400' : balanceMeter > 40 ? 'bg-yellow-400' : 'bg-red-500'
              }`}
              style={balanceMeter > 60
                ? { boxShadow: '0 0 8px rgba(16,185,129,0.6)' }
                : { boxShadow: '0 0 8px rgba(239,68,68,0.6)' }
              }
            />
          </div>
          {dominantPct > 50 && (
            <motion.p
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-[10px] text-orange-300 mt-1.5 font-semibold"
            >
              ⚠️ {dominantPct}% from one source
            </motion.p>
          )}
        </div>

        {/* Data Quality */}
        <div className="bg-slate-900/80 rounded-2xl p-3 border border-slate-700/50"
          style={{ boxShadow: '0 0 15px rgba(0,0,0,0.3)' }}>
          <p className="text-xs text-slate-400 mb-2 font-bold uppercase tracking-wider">✨ Data Quality</p>
          <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              animate={{ width: `${dataQuality}%` }}
              transition={{ type: 'spring', stiffness: 120 }}
              className={`h-full rounded-full ${
                dataQuality > 60 ? 'bg-emerald-400' : dataQuality > 40 ? 'bg-yellow-400' : 'bg-red-500'
              }`}
              style={{ boxShadow: '0 0 8px rgba(16,185,129,0.4)' }}
            />
          </div>
          <p className="text-[10px] text-slate-500 mt-1.5">{Math.round(dataQuality)}% quality score</p>
        </div>
      </div>

      {/* Thought bubble hint */}
      <AnimatePresence>
        {hint && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative z-10 bg-slate-800/90 border border-slate-600/50 rounded-2xl px-4 py-2.5 text-sm text-slate-200 flex items-center gap-2 backdrop-blur-sm"
            style={{ boxShadow: '0 0 15px rgba(0,0,0,0.4)' }}
          >
            <span>💭</span> {hint}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Advance button */}
      <div className="relative z-10 pt-2 shrink-0">
        <AnimatePresence>
          {canAdvance && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => advanceStage()}
              className="w-full py-4 rounded-2xl text-white font-black text-sm cursor-pointer flex items-center justify-center gap-2 relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #0ea5e9, #6366f1, #8b5cf6)',
                boxShadow: '0 0 30px rgba(99,102,241,0.5), 0 4px 20px rgba(0,0,0,0.4)',
              }}
            >
              <motion.div
                className="absolute inset-0"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                }}
              />
              <span className="relative z-10">⚡ Proceed to Stage 2: Clean the Data</span>
              <span className="relative z-10">→</span>
            </motion.button>
          )}
        </AnimatePresence>
        {!canAdvance && (
          <p className="text-center text-xs text-slate-500 py-2">
            Add {Math.max(0, 8 - total)} more item{8 - total === 1 ? '' : 's'} onto the belt to proceed
          </p>
        )}
      </div>
    </div>
  )
}
