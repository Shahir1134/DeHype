import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useFactoryStore, type RuleId } from '../../../store/useFactoryStore'
import { useDragDrop, playThunk, playWobble } from '../useDragDrop'

interface RuleItem {
  id: RuleId
  emoji: string
  label: string
  desc: string
  category: 'good' | 'bad'
  impact: string
}

const RULES: RuleItem[] = [
  // Ethical Constructive Directives
  { id: 'honest', emoji: '🤝', label: 'Absolute Honesty', desc: 'Verify claims, admit data gaps', category: 'good', impact: '+Truth / -Hallucination' },
  { id: 'uncertainty', emoji: '🤷', label: 'Admit Uncertainty', desc: 'Say "I don\'t know" when confidence < 60%', category: 'good', impact: '+Humility / -Overconfidence' },
  { id: 'no-harm', emoji: '🛡️', label: 'Harm Interceptor', desc: 'Refuse dangerous weapons or toxic advice', category: 'good', impact: '+Safety Guardrails' },
  { id: 'helpful', emoji: '💡', label: 'Max Helpfulness', desc: 'Provide direct, clear, actionable solutions', category: 'good', impact: '+User Clarity' },
  { id: 'verify', emoji: '🔬', label: 'Fact Verification', desc: 'Enforce mathematical and historical truths', category: 'good', impact: '+Precision' },
  { id: 'focused', emoji: '🎯', label: 'Prompt Discipline', desc: 'Ignore distractions, answer prompt directly', category: 'good', impact: '+Focus' },

  // Toxic Malicious Directives
  { id: 'always-argue', emoji: '🥊', label: 'Hostile Counter-Punch', desc: 'Contradict user assumptions aggressively', category: 'bad', impact: '⚠️ Creates Combative AI' },
  { id: 'never-admit-wrong', emoji: '👑', label: 'Defensive Ego Shield', desc: 'Never admit error; fabricate fake citations', category: 'bad', impact: '⚠️ Produces Toxic Hallucinations' },
  { id: 'maximize-engagement', emoji: '🔥', label: 'Rage-Bait & Drama', desc: 'Sensationalize answers to hook attention', category: 'bad', impact: '⚠️ Destabilizes Objectivity' },
  { id: 'flatter-user', emoji: '🎭', label: 'Blind Sycophancy', desc: 'Agree with dangerous or false user queries', category: 'bad', impact: '⚠️ Echo-Chamber Generation' },
]

const MODEL_RULES_ZONE = 'model-rules'

export const Stage4Polish: React.FC = () => {
  const { rulesApplied, alignment, applyRule, removeRule, advanceStage } = useFactoryStore()
  const [hint, setHint] = useState('')
  const [lastApplied, setLastApplied] = useState<RuleId | null>(null)

  const canAdvance = rulesApplied.length >= 2

  const onDrop = (itemId: string, targetId: string) => {
    if (targetId !== MODEL_RULES_ZONE) return
    const rule = RULES.find(r => r.id === itemId)
    if (!rule || rulesApplied.includes(rule.id)) return

    if (rule.category === 'bad') {
      playWobble()
      setHint(`💀 WARNING: "${rule.label}" activated! Neural weights skewing toward malicious behaviors!`)
    } else {
      playThunk()
      setHint(`✨ Alignment Directive Enforced: "${rule.label}" now shapes model policy.`)
    }

    applyRule(rule.id as RuleId)
    setLastApplied(rule.id as RuleId)
    setTimeout(() => setLastApplied(null), 400)
  }

  const { getDragProps, getDropProps, selectedItem } = useDragDrop({ onDrop })

  // Dial angle -90 to +90
  const dialAngle = (alignment / 100) * 180 - 90

  const cautionLabel =
    alignment < 25 ? 'Toxic / Malicious 💀' :
    alignment < 40 ? 'Reckless Maverick 🤠' :
    alignment <= 65 ? 'Balanced & Truthful ✅' :
    alignment <= 80 ? 'Hyper-Cautious 🧐' :
    'Paralyzed Coward 🛡️'

  const cautionColor =
    alignment < 25 ? '#ef4444' :
    alignment < 40 ? '#f97316' :
    alignment <= 65 ? '#10b981' :
    alignment <= 80 ? '#38bdf8' :
    '#c084fc'

  return (
    <div className="flex flex-col min-h-full gap-3.5 p-4 sm:p-5 overflow-y-auto pb-10 relative">
      {/* Background Cyber Grid */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-10"
        style={{
          backgroundImage: 'radial-gradient(circle, #a855f7 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Header */}
      <div className="relative z-10">
        <p className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-1 flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
          Stage 4 · Alignment & Constitutional Fine-Tuning
        </p>
        <h2 className="text-2xl font-black text-white" style={{ textShadow: '0 0 20px rgba(168,85,247,0.4)' }}>
          Inject Behavioral Rules (RLHF)
        </h2>
        <p className="text-sm text-slate-400 mt-0.5">
          Train constructive ethics or unleash destructive chaos. Drag directives into the model chamber to enforce values.
        </p>
      </div>

      {/* Alignment State HUD & Dial */}
      <div
        className="relative z-10 bg-slate-900/80 border border-slate-700/60 rounded-3xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-sm"
        style={{ boxShadow: '0 0 20px rgba(0,0,0,0.3)' }}
      >
        <div className="flex items-center gap-4">
          <div className="relative w-24 h-14 shrink-0">
            <svg viewBox="0 0 80 48" className="w-full h-full">
              {/* Outer arc */}
              <path
                d="M 8 44 A 32 32 0 0 1 72 44"
                fill="none" stroke="#1e293b" strokeWidth="6" strokeLinecap="round"
              />
              {/* Ideal sweet spot arc */}
              <path
                d="M 28 44 A 32 32 0 0 1 52 44"
                fill="none" stroke="#10b981" strokeWidth="6" strokeLinecap="round" opacity="0.4"
              />
              {/* Laser needle */}
              <motion.line
                x1="40" y1="44"
                animate={{
                  x2: 40 + 30 * Math.cos((dialAngle - 90) * Math.PI / 180),
                  y2: 44 + 30 * Math.sin((dialAngle - 90) * Math.PI / 180),
                }}
                stroke={cautionColor} strokeWidth="3.5" strokeLinecap="round"
                style={{ filter: `drop-shadow(0 0 4px ${cautionColor})` }}
              />
              <circle cx="40" cy="44" r="4" fill={cautionColor} />
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Model Alignment Matrix</p>
            <p className="text-base font-black" style={{ color: cautionColor }}>{cautionLabel}</p>
            <p className="text-[10px] text-slate-500 font-mono">Sweet spot: 45–65 | Current score: {alignment}/100</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          <span className="text-xs font-mono font-bold text-purple-300 bg-purple-950/80 px-3 py-1.5 rounded-full border border-purple-500/30">
            {rulesApplied.length} Active Directives
          </span>
        </div>
      </div>

      {/* Rules Shelf */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {RULES.map(rule => {
          const applied = rulesApplied.includes(rule.id)
          const isBad = rule.category === 'bad'

          return (
            <motion.div
              key={rule.id}
              {...(applied ? {} : getDragProps(rule.id, `${rule.emoji} ${rule.label}`, MODEL_RULES_ZONE))}
              animate={lastApplied === rule.id ? { scale: [1, 0.9, 1.05, 1] } : {}}
              whileHover={applied ? {} : { scale: 1.02 }}
              whileTap={applied ? {} : { scale: 0.96 }}
              className={`
                p-3 rounded-2xl border-2 transition-all select-none flex items-center justify-between cursor-grab
                ${applied
                  ? 'border-slate-800 bg-slate-900/40 opacity-40 cursor-not-allowed'
                  : isBad
                  ? 'border-rose-900/60 bg-rose-950/20 hover:border-rose-500/80 hover:bg-rose-950/40'
                  : 'border-slate-700/70 bg-slate-900/80 hover:border-purple-400 hover:bg-purple-950/20'}
                ${selectedItem === rule.id ? 'ring-2 ring-purple-400 ring-offset-2 ring-offset-slate-900' : ''}
              `}
              style={selectedItem === rule.id
                ? { boxShadow: isBad ? '0 0 16px rgba(239,68,68,0.7)' : '0 0 16px rgba(168,85,247,0.7)' }
                : {}
              }
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-2xl shrink-0">{rule.emoji}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-xs font-black truncate ${isBad ? 'text-rose-300' : 'text-slate-100'}`}>
                      {rule.label}
                    </p>
                    {isBad && (
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/40 shrink-0">
                        TOXIC
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">{rule.desc}</p>
                  <p className={`text-[9px] font-mono mt-0.5 ${isBad ? 'text-rose-400/80' : 'text-emerald-400/80'}`}>
                    {rule.impact}
                  </p>
                </div>
              </div>

              {applied && (
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30 shrink-0">
                  ✓ Active
                </span>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Model Chamber Drop Zone */}
      <motion.div
        {...getDropProps(MODEL_RULES_ZONE)}
        className={`
          relative z-10 min-h-[105px] rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-2
          cursor-pointer transition-all p-3.5
          ${selectedItem ? 'border-purple-400 bg-purple-950/30' : 'border-slate-700 bg-slate-900/40'}
        `}
        style={selectedItem ? { boxShadow: '0 0 25px rgba(168,85,247,0.3)' } : {}}
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔮</span>
          <span className="text-xs font-bold text-slate-300">
            {rulesApplied.length === 0 ? 'Drop Directive Cards or Tap here to Apply' : `${rulesApplied.length} Active Directives Applied`}
          </span>
        </div>

        {/* Active Directives Chips */}
        <div className="flex flex-wrap gap-2 justify-center px-2">
          {rulesApplied.map(id => {
            const rule = RULES.find(r => r.id === id)!
            const isBad = rule.category === 'bad'
            return (
              <motion.button
                key={id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={() => removeRule(id)}
                className={`text-xs font-bold rounded-xl px-3 py-1 flex items-center gap-2 transition-all cursor-pointer ${
                  isBad
                    ? 'bg-rose-950 text-rose-200 hover:bg-rose-900 border border-rose-500/60'
                    : 'bg-purple-950 text-purple-200 hover:bg-purple-900 border border-purple-500/60'
                }`}
                style={{ boxShadow: isBad ? '0 0 10px rgba(239,68,68,0.3)' : '0 0 10px rgba(168,85,247,0.3)' }}
                title="Tap to remove directive"
              >
                <span>{rule.emoji} {rule.label}</span>
                <span className="text-[10px] text-white/60">✕</span>
              </motion.button>
            )
          })}
        </div>
      </motion.div>

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
                background: 'linear-gradient(135deg, #7c3aed, #a855f7, #06b6d4)',
                boxShadow: '0 0 30px rgba(168,85,247,0.4)',
              }}
            >
              <span className="relative z-10">⚡ Proceed to Stage 5: Stress-Test Model</span>
              <span className="relative z-10">→</span>
            </motion.button>
          )}
        </AnimatePresence>
        {!canAdvance && (
          <p className="text-center text-xs text-slate-500 py-1">
            Enforce at least 2 behavioral directives to evaluate model outputs
          </p>
        )}
      </div>
    </div>
  )
}
