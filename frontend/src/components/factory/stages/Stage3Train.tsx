import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useFactoryStore } from '../../../store/useFactoryStore'
import { useDragDrop, playThunk } from '../useDragDrop'

const BATCHES = [
  { id: 'batch-a', emoji: '📄', label: 'Batch Alpha', subtitle: '500k Core Sentences', category: 'General' },
  { id: 'batch-b', emoji: '📊', label: 'Batch Beta', subtitle: '200k Structured Tables', category: 'Reasoning' },
  { id: 'batch-c', emoji: '📖', label: 'Batch Gamma', subtitle: '1M Literary Excerpts', category: 'Language' },
  { id: 'batch-d', emoji: '💬', label: 'Batch Delta', subtitle: '300k Dialogues', category: 'Conversational' },
  { id: 'batch-e', emoji: '🔬', label: 'Batch Epsilon', subtitle: '100k Peer Research Papers', category: 'Technical' },
]

const MODEL_ZONE = 'model-feed-zone'

export const Stage3Train: React.FC = () => {
  const { batchesFed, loopCount, generalization, feedBatch, repeatBatch, advanceStage } = useFactoryStore()
  const [fedBatches, setFedBatches] = useState<Set<string>>(new Set())
  const [loopEnabled, setLoopEnabled] = useState(false)
  const [feeding, setFeeding] = useState(false)
  const [hint, setHint] = useState('')

  const canAdvance = batchesFed >= 5

  const triggerFeed = (batchId: string, isRepeat = false) => {
    setFeeding(true)
    setTimeout(() => {
      if (isRepeat) {
        repeatBatch()
        if (loopCount >= 2) {
          setHint(`⚠️ Overfitting Warning! Epoch count ${loopCount + 1} is causing parameter memorization over reasoning.`)
        } else {
          setHint('Re-cycling training epoch. Model loss decreases, but watch the Overfit Meter!')
        }
      } else {
        feedBatch()
        setFedBatches(prev => new Set([...prev, batchId]))
        playThunk()
        setHint(`💡 Neural Weights Updated! Batch absorbed. Parameters generalizing effectively.`)
      }
      setFeeding(false)
    }, 600)
  }

  const onDrop = (itemId: string, targetId: string) => {
    if (targetId !== MODEL_ZONE) return
    const batch = BATCHES.find(b => b.id === itemId)
    if (!batch) return

    if (fedBatches.has(itemId)) {
      if (loopEnabled) {
        triggerFeed(itemId, true)
      } else {
        setHint(`Model already completed forward-pass on ${batch.label}. Toggle "Loop Epoch" to re-train.`)
      }
      return
    }
    triggerFeed(itemId)
  }

  const { getDragProps, getDropProps, selectedItem } = useDragDrop({ onDrop })

  const isOverfit = loopCount > 3
  const overfitPct = Math.min(100, loopCount * 22)

  return (
    <div className="flex flex-col min-h-full gap-3.5 p-4 sm:p-5 overflow-y-auto pb-10 relative">
      {/* Background Cybernetic Wave */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-10"
        style={{
          backgroundImage: 'radial-gradient(circle, #f97316 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Header */}
      <div className="relative z-10">
        <p className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-1 flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
          Stage 3 · Gradient Descent Training Chamber
        </p>
        <h2 className="text-2xl font-black text-white" style={{ textShadow: '0 0 20px rgba(249,115,22,0.4)' }}>
          Inject Training Batches
        </h2>
        <p className="text-sm text-slate-400 mt-0.5">
          Transfer high-dimensional token batches into the core. More tokens expand capacity — until overfitting strikes.
        </p>
      </div>

      {/* Training Diagnostics Row */}
      <div className="relative z-10 grid grid-cols-2 gap-3">
        {/* Generalization */}
        <div
          className="bg-slate-900/80 border border-slate-700/60 rounded-2xl p-3.5 backdrop-blur-sm"
          style={{ boxShadow: '0 0 20px rgba(0,0,0,0.3)' }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <span>🧠 Generalization</span>
              {generalization < 35 && <span className="text-rose-400 text-xs">CRITICAL</span>}
            </p>
            <span className="text-xs font-mono font-bold text-orange-400">{generalization}%</span>
          </div>
          <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              animate={{ width: `${generalization}%` }}
              transition={{ type: 'spring', stiffness: 100 }}
              className={`h-full rounded-full ${
                generalization > 60 ? 'bg-emerald-400' : generalization > 40 ? 'bg-amber-400' : 'bg-rose-500'
              }`}
              style={{ boxShadow: generalization > 60 ? '0 0 8px #34d399' : '0 0 8px #f43f5e' }}
            />
          </div>
          {isOverfit ? (
            <p className="text-[10px] text-rose-400 mt-1.5 font-semibold">❄️ Frozen: Memorizing verbatim, failing tests</p>
          ) : (
            <p className="text-[10px] text-slate-500 mt-1.5">Flexibility on unseen benchmark questions</p>
          )}
        </div>

        {/* Overfit Meter */}
        <div
          className="bg-slate-900/80 border border-slate-700/60 rounded-2xl p-3.5 backdrop-blur-sm"
          style={{ boxShadow: '0 0 20px rgba(0,0,0,0.3)' }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-300">Overfitting Risk</p>
            <span className={`text-xs font-mono font-bold ${overfitPct > 60 ? 'text-rose-400' : 'text-slate-400'}`}>
              {overfitPct}%
            </span>
          </div>
          <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              animate={{ width: `${overfitPct}%` }}
              transition={{ type: 'spring', stiffness: 100 }}
              className={`h-full rounded-full ${
                overfitPct < 30 ? 'bg-emerald-400' : overfitPct < 65 ? 'bg-amber-400' : 'bg-rose-500'
              }`}
              style={{ boxShadow: overfitPct > 65 ? '0 0 10px #f43f5e' : 'none' }}
            />
          </div>
          <p className="text-[10px] text-slate-500 mt-1.5">Loop epochs: {loopCount} (Risk threshold: 3×)</p>
        </div>
      </div>

      {/* Batch Cores Shelf */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {BATCHES.map(batch => {
          const isFed = fedBatches.has(batch.id)
          return (
            <motion.div
              key={batch.id}
              {...getDragProps(batch.id, `${batch.emoji} ${batch.label}`, MODEL_ZONE)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.92 }}
              className={`
                flex flex-col items-center gap-1.5 p-3 rounded-2xl cursor-grab select-none
                border-2 transition-all text-center relative overflow-hidden
                ${isFed
                  ? 'border-emerald-500/50 bg-emerald-950/25 opacity-80'
                  : 'border-orange-500/40 bg-slate-900/80 hover:border-orange-400 hover:bg-orange-950/20'}
                ${selectedItem === batch.id ? 'ring-2 ring-orange-400 ring-offset-2 ring-offset-slate-900' : ''}
              `}
              style={selectedItem === batch.id ? { boxShadow: '0 0 18px rgba(249,115,22,0.6)' } : {}}
            >
              <span className="text-2xl">{batch.emoji}</span>
              <span className="text-xs font-black text-slate-200">{batch.label}</span>
              <span className="text-[10px] text-slate-400">{batch.subtitle}</span>
              {isFed && (
                <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/40">
                  ✓ Absorbed
                </span>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Center Training Accelerator Reactor */}
      <motion.div
        {...getDropProps(MODEL_ZONE)}
        animate={feeding ? {
          scale: [1, 1.03, 1],
          borderColor: ['#f97316', '#fbbf24', '#06b6d4', '#f97316'],
          boxShadow: ['0 0 15px rgba(249,115,22,0.3)', '0 0 35px rgba(251,191,36,0.6)', '0 0 15px rgba(249,115,22,0.3)'],
        } : {}}
        transition={{ duration: 0.6 }}
        className={`
          relative z-10 min-h-[105px] rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-2
          cursor-pointer transition-all p-4
          ${selectedItem ? 'border-orange-400 bg-orange-950/30' : 'border-slate-700 bg-slate-900/50'}
        `}
        style={selectedItem ? { boxShadow: '0 0 25px rgba(249,115,22,0.3)' } : {}}
      >
        <AnimatePresence>
          {feeding ? (
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1.2, rotate: 0 }}
              exit={{ scale: 0, opacity: 0 }}
              className="flex items-center gap-3 text-amber-300 font-mono font-bold text-sm"
            >
              <span className="text-3xl animate-bounce">⚡</span>
              <span>SYNAPSE CALIBRATION IN PROGRESS...</span>
            </motion.div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="text-3xl">⚛️</span>
                <span className="text-sm font-bold text-slate-300">Drop Token Batch into Neural Reactor</span>
              </div>
              <span className="text-xs font-mono font-bold text-orange-400 bg-orange-950/80 px-3 py-1 rounded-full border border-orange-500/30">
                {batchesFed} / 5 Datasets Synthesized
              </span>
            </>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Epoch Loop Controls */}
      <div className="relative z-10 flex items-center justify-between bg-slate-900/80 border border-slate-700/60 rounded-2xl p-3.5 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLoopEnabled(v => !v)}
            className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
              loopEnabled ? 'bg-orange-500' : 'bg-slate-700'
            }`}
            style={loopEnabled ? { boxShadow: '0 0 12px rgba(249,115,22,0.7)' } : {}}
          >
            <motion.div
              animate={{ x: loopEnabled ? 26 : 3 }}
              className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-md"
            />
          </button>
          <div>
            <p className="text-xs font-bold text-white flex items-center gap-2">
              <span>Epoch Loop Mode</span>
              {loopEnabled && <span className="text-[10px] text-orange-300 font-mono">[ACTIVE]</span>}
            </p>
            <p className="text-[10px] text-slate-400">Re-passes existing batches. High risk of rote memorization.</p>
          </div>
        </div>
        {isOverfit && (
          <span className="text-xs font-bold text-rose-400 animate-pulse bg-rose-950/60 px-2.5 py-1 rounded-lg border border-rose-500/40">
            ⚠️ OVERFITTING DETECTED
          </span>
        )}
      </div>

      {/* Hint Banner */}
      <AnimatePresence>
        {hint && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="relative z-10 bg-slate-900/90 border border-slate-700/80 rounded-2xl px-4 py-2.5 text-xs text-slate-200"
          >
            💬 {hint}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Advance Button */}
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
                background: 'linear-gradient(135deg, #ea580c, #f97316, #fbbf24)',
                boxShadow: '0 0 30px rgba(249,115,22,0.4)',
              }}
            >
              <span className="relative z-10">⚡ Proceed to Stage 4: Align & Tune Behaviour</span>
              <span className="relative z-10">→</span>
            </motion.button>
          )}
        </AnimatePresence>
        {!canAdvance && (
          <p className="text-center text-xs text-slate-500 py-1">
            Feed {5 - batchesFed} more batch{5 - batchesFed === 1 ? '' : 'es'} to complete weights pre-training
          </p>
        )}
      </div>
    </div>
  )
}
