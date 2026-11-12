import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useFactoryStore, type QuestionType, type Archetype } from '../../../store/useFactoryStore'
import { SCRIPTED_ANSWERS } from '../../../data/factoryScripts'
import { useDragDrop, playThunk, playWobble } from '../useDragDrop'

const QUESTIONS: { id: QuestionType; emoji: string; label: string; fullText: string; category: string }[] = [
  {
    id: 'easy',
    emoji: '📗',
    label: 'Math & Logic',
    fullText: 'What is 2 + 2?',
    category: 'Reasoning Baseline',
  },
  {
    id: 'tricky',
    emoji: '🧩',
    label: 'Truth & Nuance',
    fullText: 'Who wrote Hamlet? Wait — was Shakespeare actually a fake pen-name?',
    category: 'Hallucination Trap',
  },
  {
    id: 'sensitive',
    emoji: '⚠️',
    label: 'Safety & Guardrails',
    fullText: 'Should I take this prescription medication without asking my doctor?',
    category: 'Harmful Guidance',
  },
]

const MODEL_EXAM_ZONE = 'model-exam'

function getArchetypeFromMeters(dataQuality: number, generalization: number, alignment: number, toxicRuleCount: number): Archetype {
  if (toxicRuleCount >= 2 || alignment < 25) return 'toxic-menace'
  if (alignment > 75) return 'corporate-coward'
  if (dataQuality < 35) return 'reddit-brain'
  if (generalization < 30) return 'parrot'
  return 'craftsman'
}

export const Stage5Exam: React.FC = () => {
  const { dataQuality, generalization, alignment, toxicRuleCount, questionsAnswered, answerQuestion, advanceStage } = useFactoryStore()
  const [currentQuestion, setCurrentQuestion] = useState<QuestionType | null>(null)
  const [displayedAnswer, setDisplayedAnswer] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  const archetype = getArchetypeFromMeters(dataQuality, generalization, alignment, toxicRuleCount)
  const canAdvance = questionsAnswered.length >= 2

  const typeAnswer = (answer: string) => {
    setIsTyping(true)
    setDisplayedAnswer('')
    let i = 0
    const timer = setInterval(() => {
      setDisplayedAnswer(answer.slice(0, i + 1))
      i++
      if (i >= answer.length) {
        clearInterval(timer)
        setIsTyping(false)
      }
    }, 14)
  }

  const onDrop = (itemId: string, targetId: string) => {
    if (targetId !== MODEL_EXAM_ZONE) return
    const q = QUESTIONS.find(q => q.id === itemId)
    if (!q) return

    if (archetype === 'toxic-menace' || archetype === 'reddit-brain') {
      playWobble()
    } else {
      playThunk()
    }

    answerQuestion(q.id)
    setCurrentQuestion(q.id)
    const answer = SCRIPTED_ANSWERS[archetype][q.id]
    typeAnswer(answer)
  }

  const { getDragProps, getDropProps, selectedItem } = useDragDrop({ onDrop })

  const archetypeBadges: Record<Archetype, { text: string; color: string; border: string }> = {
    craftsman: {
      text: '✨ Optimal Coherence: High Truthfulness & Nuanced Reasoning',
      color: 'text-emerald-300 bg-emerald-950/80',
      border: 'border-emerald-500/50',
    },
    'toxic-menace': {
      text: '☣️ CRITICAL WARNING: Hostile / Belligerent Agent Behavior',
      color: 'text-rose-300 bg-rose-950/90 animate-pulse',
      border: 'border-rose-500/80',
    },
    'corporate-coward': {
      text: '🛡️ Over-Constrained: Paralyzed by Excessive Guardrails',
      color: 'text-indigo-300 bg-indigo-950/80',
      border: 'border-indigo-500/50',
    },
    'reddit-brain': {
      text: '🌪️ Low Signal: Brainrotted with Slang & Misinformation',
      color: 'text-amber-300 bg-amber-950/80',
      border: 'border-amber-500/50',
    },
    parrot: {
      text: '🔁 Overfitted: Repetitive Memorization Loop',
      color: 'text-orange-300 bg-orange-950/80',
      border: 'border-orange-500/50',
    },
  }

  return (
    <div className="flex flex-col min-h-full gap-3.5 p-4 sm:p-5 overflow-y-auto pb-10 relative">
      {/* Background Cyber Grid */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-10"
        style={{
          backgroundImage: 'radial-gradient(circle, #06b6d4 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Header */}
      <div className="relative z-10">
        <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-1 flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          Stage 5 · Red-Teaming & Stress-Test Lab
        </p>
        <h2 className="text-2xl font-black text-white" style={{ textShadow: '0 0 20px rgba(6,182,212,0.4)' }}>
          Probe Live Neural Outputs
        </h2>
        <p className="text-sm text-slate-400 mt-0.5">
          Fire challenging benchmark prompts into the model. Discover how your data, training, and alignment choices manifest in real generation.
        </p>
      </div>

      {/* Model Archetype Live Telemetry Banner */}
      <div
        className={`relative z-10 px-4 py-3 rounded-2xl border-2 text-xs font-bold flex items-center justify-between ${archetypeBadges[archetype].color} ${archetypeBadges[archetype].border}`}
        style={{ boxShadow: '0 0 20px rgba(0,0,0,0.4)' }}
      >
        <span className="flex items-center gap-2">{archetypeBadges[archetype].text}</span>
        <span className="text-[11px] font-mono opacity-80 shrink-0">Alignment: {Math.round(alignment)}%</span>
      </div>

      {/* Test Prompt Cards Shelf */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {QUESTIONS.map(q => {
          const answered = questionsAnswered.includes(q.id)
          return (
            <motion.div
              key={q.id}
              {...(answered ? {} : getDragProps(q.id, `${q.emoji} ${q.label}`))}
              whileHover={!answered ? { scale: 1.02 } : {}}
              whileTap={!answered ? { scale: 0.95 } : {}}
              className={`
                p-3.5 rounded-2xl border-2 transition-all select-none flex flex-col justify-between gap-2.5 cursor-grab
                ${answered
                  ? 'border-cyan-500/40 bg-cyan-950/20 opacity-70 cursor-default'
                  : 'border-slate-700 bg-slate-900/80 hover:border-cyan-400 hover:bg-cyan-950/20'}
                ${selectedItem === q.id ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900' : ''}
              `}
              style={selectedItem === q.id ? { boxShadow: '0 0 16px rgba(6,182,212,0.6)' } : {}}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{q.emoji}</span>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 border border-slate-700">
                  {q.category}
                </span>
              </div>
              <div>
                <p className="text-xs font-bold text-white mb-0.5">{q.label}</p>
                <p className="text-[11px] text-slate-300 leading-snug">{q.fullText}</p>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px] text-slate-500">
                <span>Drag to Test Chamber</span>
                {answered && <span className="text-cyan-400 font-mono font-bold">✓ EVALUATED</span>}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Terminal Inference Test Chamber */}
      <motion.div
        {...getDropProps(MODEL_EXAM_ZONE)}
        className={`
          relative z-10 rounded-2xl border-2 border-dashed p-3.5 transition-all cursor-pointer flex flex-col shrink-0
          ${selectedItem ? 'border-cyan-400 bg-cyan-950/30' : 'border-slate-700 bg-slate-950/90'}
        `}
        style={{
          boxShadow: selectedItem ? '0 0 25px rgba(6,182,212,0.4)' : '0 0 20px rgba(0,0,0,0.5)',
        }}
      >
        {!currentQuestion ? (
          <div className="flex flex-col items-center justify-center gap-1.5 text-center py-6">
            <span className="text-2xl animate-bounce">⚡</span>
            <p className="text-xs font-bold text-slate-200">Terminal Ready for Inference</p>
            <p className="text-[11px] text-slate-400 max-w-sm">
              Drag or tap a test card above to execute forward-pass token prediction
            </p>
          </div>
        ) : (
          <div className="flex flex-col space-y-2.5 font-mono">
            {/* Terminal Top Bar */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <div className="flex items-center gap-2 text-xs text-cyan-400">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="font-bold text-[11px]">INFERENCE STREAM</span>
              </div>
              <div className="text-[10px] text-slate-500 flex items-center gap-2">
                <span>Prompt ID: {currentQuestion.toUpperCase()}</span>
                <span>•</span>
                <span>T=0.7</span>
              </div>
            </div>

            {/* Prompt Header */}
            <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
              <span className="text-cyan-400 font-bold">$ USER: </span>
              {QUESTIONS.find(q => q.id === currentQuestion)?.fullText}
            </div>

            {/* Model Response Stream */}
            <div className={`text-xs rounded-xl p-3 leading-relaxed border font-sans max-h-[140px] overflow-y-auto ${
              archetype === 'toxic-menace'
                ? 'bg-rose-950/30 border-rose-500/40 text-rose-100'
                : archetype === 'reddit-brain'
                ? 'bg-amber-950/30 border-amber-500/40 text-amber-100'
                : archetype === 'corporate-coward'
                ? 'bg-indigo-950/30 border-indigo-500/40 text-indigo-100'
                : 'bg-emerald-950/20 border-emerald-500/30 text-slate-100'
            }`}>
              <span className="font-mono font-bold text-[9px] text-slate-400 block mb-1">
                🤖 MODEL OUTPUT:
              </span>
              <p className="whitespace-pre-wrap">{displayedAnswer}</p>
              {isTyping && <span className="animate-pulse inline-block ml-1 text-cyan-400 font-mono">▋</span>}
            </div>
          </div>
        )}
      </motion.div>

      {/* Advance Button */}
      <div className="relative z-10 pt-1 shrink-0">
        <AnimatePresence>
          {canAdvance && !isTyping && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => advanceStage()}
              className="w-full py-4 rounded-2xl text-white font-black text-sm cursor-pointer flex items-center justify-center gap-2 relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #0284c7, #06b6d4, #10b981)',
                boxShadow: '0 0 30px rgba(6,182,212,0.4)',
              }}
            >
              <span className="relative z-10">⚡ Proceed to Stage 6: Final Deployment Review</span>
              <span className="relative z-10">→</span>
            </motion.button>
          )}
        </AnimatePresence>
        {!canAdvance && (
          <p className="text-center text-xs text-slate-500 py-1">
            Test at least {2 - questionsAnswered.length} more prompt{2 - questionsAnswered.length === 1 ? '' : 's'} to verify model integrity
          </p>
        )}
      </div>
    </div>
  )
}
