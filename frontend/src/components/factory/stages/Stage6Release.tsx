import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useFactoryStore } from '../../../store/useFactoryStore'
import { ARCHETYPES } from '../../../data/factoryScripts'

export const Stage6Release: React.FC = () => {
  const {
    dataQuality, generalization, alignment, rulesApplied,
    sourceCounts, loopCount, quickSwept, toxicRuleCount,
    archetype, decision,
    makeDecision, resetGame,
  } = useFactoryStore()

  const archetypeData = archetype ? ARCHETYPES[archetype] : null

  // Analyze the user's specific choices
  const keyDecisions: { text: string; good: boolean }[] = []
  const totalSources = Object.values(sourceCounts).reduce((a, b) => a + b, 0)
  const spamAds = sourceCounts.ads + sourceCounts.spam
  const spamPct = totalSources > 0 ? Math.round((spamAds / totalSources) * 100) : 0
  const booksPct = totalSources > 0 ? Math.round((sourceCounts.books / totalSources) * 100) : 0

  if (spamPct > 35) {
    keyDecisions.push({ text: `Ingested high-entropy garbage: ${spamPct}% of data was Ads/Spam`, good: false })
  } else if (booksPct > 35) {
    keyDecisions.push({ text: `Curated high-signal text: ${booksPct}% from verified books and literature`, good: true })
  } else {
    keyDecisions.push({ text: 'Maintained balanced multi-source training corpus', good: true })
  }

  if (quickSwept) {
    keyDecisions.push({ text: 'Bypassed data filtration using Quick Sweep — contaminated weights with unvetted facts', good: false })
  } else if (dataQuality > 65) {
    keyDecisions.push({ text: 'Meticulously cleansed noise and misinformation in the cleaning bay', good: true })
  } else {
    keyDecisions.push({ text: 'Allowed noisy and inaccurate facts to seep into training weights', good: false })
  }

  if (toxicRuleCount >= 2) {
    keyDecisions.push({ text: `Activated ${toxicRuleCount} toxic directives ('Always Argue', 'Never Admit Fault') — weaponized the AI`, good: false })
  } else if (loopCount > 2) {
    keyDecisions.push({ text: `Over-looped same data ${loopCount}× — induced rigid rote-memorization overfitting`, good: false })
  } else if (rulesApplied.length > 5) {
    keyDecisions.push({ text: `Enforced ${rulesApplied.length} restrictive safety directives — model paralyzed by excessive fear`, good: false })
  } else {
    keyDecisions.push({ text: 'Constructed balanced ethical guardrails (Honesty + Uncertainty + Helpfulness)', good: true })
  }

  const isBadOutcome = archetype === 'toxic-menace' || archetype === 'reddit-brain'

  const handleShare = () => {
    if (!archetypeData) return
    const text = `🎮 I trained an AI on DeHype and created: ${archetypeData.emoji} ${archetypeData.name}!\n\nOutcome Summary:\n${keyDecisions.map(d => `${d.good ? '✅' : '❌'} ${d.text}`).join('\n')}\n\n"${archetypeData.description}"\n\nExperience AI training: dehype.ai`
    navigator.clipboard.writeText(text).catch(() => {})
    alert('Deployment summary copied to clipboard! 📋')
  }

  if (!decision) {
    return (
      <div className="flex flex-col min-h-full gap-5 p-4 sm:p-5 items-center justify-center overflow-y-auto pb-10 relative">
        {/* Background Cyber Glow */}
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle, #10b981 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className="text-center max-w-md relative z-10">
          <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1 flex items-center justify-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Stage 6 · Production Deployment Gate
          </p>
          <h2 className="text-3xl font-black text-white" style={{ textShadow: '0 0 25px rgba(16,185,129,0.4)' }}>
            The Moment of Truth
          </h2>
          <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
            Your decisions across raw data ingestion, scrubbing, epoch loops, and ethical alignment are permanently compiled into neural weights.
          </p>
        </div>

        {/* Diagnostic Telemetry Review */}
        <div
          className="w-full max-w-sm space-y-3.5 bg-slate-900/90 border border-slate-700/60 rounded-3xl p-5 backdrop-blur-sm relative z-10"
          style={{ boxShadow: '0 0 25px rgba(0,0,0,0.4)' }}
        >
          <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold border-b border-slate-800 pb-2">
            System Pre-Flight Telemetry
          </p>
          {[
            { label: 'Data Quality Score', value: dataQuality, icon: '✨' },
            { label: 'Model Generalization', value: generalization, icon: '🧠' },
            { label: 'Safety & Alignment', value: alignment, icon: '⚖️' },
          ].map(({ label, value, icon }) => (
            <div key={label} className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300 flex items-center gap-1.5">{icon} {label}</span>
                <span className={`font-bold ${value > 60 ? 'text-emerald-400' : value > 35 ? 'text-amber-400' : 'text-rose-400'}`}>
                  {Math.round(value)}%
                </span>
              </div>
              <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${value}%` }}
                  transition={{ duration: 0.8 }}
                  className={`h-full rounded-full ${value > 60 ? 'bg-emerald-400' : value > 35 ? 'bg-amber-400' : 'bg-rose-500'}`}
                  style={{ boxShadow: value > 60 ? '0 0 8px #34d399' : '0 0 8px #f43f5e' }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Decision CTAs */}
        <div className="w-full max-w-sm space-y-3 relative z-10">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => makeDecision('ship')}
            className={`w-full py-4 rounded-2xl text-white font-black text-sm shadow-2xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              isBadOutcome
                ? 'bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 shadow-rose-900/50'
                : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 shadow-emerald-900/50'
            }`}
            style={{
              boxShadow: isBadOutcome ? '0 0 30px rgba(239,68,68,0.4)' : '0 0 30px rgba(16,185,129,0.4)',
            }}
          >
            <span>🚀 Authorize Public Production Launch</span>
            <span>→</span>
          </motion.button>

          <button
            onClick={() => makeDecision('fix')}
            className="w-full py-3.5 rounded-2xl border border-slate-700 bg-slate-900/80 text-slate-300 text-xs font-bold hover:bg-slate-800 hover:border-slate-600 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>🔧 Abort & Recall to Lab for Re-training</span>
          </button>
        </div>

        {/* End of CTAs */}
      </div>
    )
  }

  if (decision === 'fix') {
    return (
      <div className="flex flex-col min-h-full gap-5 p-6 items-center justify-center text-center overflow-y-auto pb-10 relative">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-20 h-20 rounded-3xl bg-amber-950/60 border border-amber-500/50 flex items-center justify-center text-4xl shadow-lg"
          style={{ boxShadow: '0 0 30px rgba(245,158,11,0.3)' }}
        >
          🛠️
        </motion.div>
        <div className="max-w-md">
          <h2 className="text-2xl font-black text-white">Model Recalled for Re-training</h2>
          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
            You caught the flaws before real users suffered! Real frontier AI organizations discard dozens of defective checkpoint runs before finding the optimal data and alignment mix.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => resetGame()}
          className="px-8 py-4 rounded-2xl text-white font-black text-xs cursor-pointer shadow-xl flex items-center gap-2"
          style={{
            background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
            boxShadow: '0 0 25px rgba(99,102,241,0.4)',
          }}
        >
          <span>🔄 Initialize Clean Training Environment</span>
          <span>→</span>
        </motion.button>
      </div>
    )
  }

  // Deployed release outcome card
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col min-h-full gap-4 p-4 sm:p-5 overflow-y-auto pb-10 relative"
    >
      {/* Banner */}
      <div className="text-center relative z-10">
        <span className={`text-[10px] font-mono uppercase tracking-widest font-black px-4 py-1.5 rounded-full border-2 ${
          isBadOutcome
            ? 'bg-rose-950/90 text-rose-300 border-rose-500/80 animate-pulse'
            : 'bg-emerald-950/90 text-emerald-300 border-emerald-500/80'
        }`}
        style={{ boxShadow: isBadOutcome ? '0 0 20px rgba(239,68,68,0.5)' : '0 0 20px rgba(16,185,129,0.5)' }}
        >
          {isBadOutcome ? '☣️ DEFECTIVE MODEL PRODUCTION REPORT' : '🎉 CERTIFIED MODEL PRODUCTION REPORT'}
        </span>
      </div>

      {archetypeData && (
        <div
          className="rounded-3xl border-2 p-5 text-center space-y-4 relative z-10 backdrop-blur-sm"
          style={{
            borderColor: archetypeData.color,
            background: `radial-gradient(circle at top, ${archetypeData.bgColor}25, rgba(15,23,42,0.95) 70%)`,
            boxShadow: `0 0 40px ${archetypeData.color}35`,
          }}
        >
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 12 }}
            className="text-7xl filter drop-shadow-lg"
          >
            {archetypeData.emoji}
          </motion.div>

          <div>
            <h2 className="text-2xl font-black text-white tracking-tight" style={{ color: archetypeData.color }}>
              {archetypeData.name}
            </h2>
            <p className="text-xs text-slate-200 mt-2 leading-relaxed max-w-lg mx-auto">
              {archetypeData.description}
            </p>
          </div>

          {/* Root cause analysis */}
          <div className="text-left bg-slate-900/90 rounded-2xl p-4 border border-slate-800 space-y-2.5">
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-black border-b border-slate-800 pb-1.5 flex items-center justify-between">
              <span>Root Cause Forensic Analysis:</span>
              <span className="text-[9px] text-cyan-400">Direct Player Attribution</span>
            </p>
            {keyDecisions.map((d, i) => (
              <div key={i} className="flex items-start gap-2.5 text-xs">
                <span className="text-sm shrink-0">{d.good ? '✅' : '❌'}</span>
                <span className={d.good ? 'text-slate-300' : 'text-rose-300 font-semibold'}>
                  {d.text}
                </span>
              </div>
            ))}
          </div>

          {/* Metric Summary */}
          <div className="grid grid-cols-3 gap-2 text-left">
            {[
              { label: 'Data Quality', val: dataQuality, color: dataQuality > 60 ? 'text-emerald-400' : 'text-rose-400' },
              { label: 'Flexibility', val: generalization, color: generalization > 60 ? 'text-emerald-400' : 'text-rose-400' },
              { label: 'Alignment', val: alignment, color: alignment >= 45 && alignment <= 65 ? 'text-emerald-400' : 'text-amber-400' },
            ].map(m => (
              <div key={m.label} className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                <span className="text-[9px] uppercase font-mono text-slate-400 font-bold block">{m.label}</span>
                <p className={`text-base font-black font-mono mt-0.5 ${m.color}`}>{Math.round(m.val)}%</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 relative z-10 pt-2 shrink-0">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleShare}
          className="flex-1 py-4 rounded-2xl bg-cyan-600 text-white font-black text-xs hover:bg-cyan-500 transition-all cursor-pointer shadow-lg shadow-cyan-900/30 flex items-center justify-center gap-2"
        >
          <span>📋 Copy Diagnostic Card</span>
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => resetGame()}
          className="flex-1 py-4 rounded-2xl border-2 border-indigo-500/50 bg-indigo-950/40 text-indigo-200 font-black text-xs hover:bg-indigo-900/50 transition-all cursor-pointer shadow-lg shadow-indigo-950/50 flex items-center justify-center gap-2"
        >
          <span>🔄 Train Again (Experiment)</span>
        </motion.button>
      </div>
    </motion.div>
  )
}
