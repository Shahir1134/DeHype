import React, { useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { ConceptDetailView, ConceptData } from './ConceptDetailView'

// Static imports of the 6 concepts
import chatbotInsideData from '../content/concepts/chatbot-inside.json'
import openWeightsData from '../content/concepts/open-weights.json'
import ragData from '../content/concepts/rag.json'
import evalsData from '../content/concepts/evals.json'
import mcpData from '../content/concepts/mcp.json'
import multiAgentData from '../content/concepts/multi-agent.json'

import { 
  GraduationCap, 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Sparkles, 
  ChevronRight, 
  Lightbulb,
  ShieldCheck,
  Compass,
  Check,
  Layers,
  HelpCircle,
  Sliders,
  Zap
} from 'lucide-react'
import { CheckDraw } from '../components/motion/CheckDraw'

import { useFactoryStore } from '../store/useFactoryStore'
import { AIFactoryGame } from '../components/factory/AIFactoryGame'

const CONCEPTS_LIST: { id: string; data: ConceptData; prereq?: string }[] = [
  { id: 'chatbot-inside', data: chatbotInsideData as ConceptData },
  { id: 'open-weights', data: openWeightsData as ConceptData, prereq: "What's inside a chatbot?" },
  { id: 'rag', data: ragData as ConceptData, prereq: "What's inside a chatbot?" },
  { id: 'evals', data: evalsData as ConceptData, prereq: "Why doesn't AI know about my files?" },
  { id: 'mcp', data: mcpData as ConceptData, prereq: "Why doesn't AI know about my files?" },
  { id: 'multi-agent', data: multiAgentData as ConceptData, prereq: "How does AI plug into my apps?" }
]

const PERSONA_IMPORTANCE: Record<string, Record<string, 'Essential for you' | 'Useful for you' | 'Optional for you'>> = {
  student: {
    'chatbot-inside': 'Essential for you',
    'open-weights': 'Useful for you',
    'rag': 'Essential for you',
    'evals': 'Useful for you',
    'mcp': 'Optional for you',
    'multi-agent': 'Useful for you'
  },
  teacher: {
    'chatbot-inside': 'Essential for you',
    'open-weights': 'Essential for you',
    'rag': 'Useful for you',
    'evals': 'Useful for you',
    'mcp': 'Optional for you',
    'multi-agent': 'Useful for you'
  },
  entrepreneur: {
    'chatbot-inside': 'Useful for you',
    'open-weights': 'Useful for you',
    'rag': 'Essential for you',
    'evals': 'Essential for you',
    'mcp': 'Essential for you',
    'multi-agent': 'Essential for you'
  },
  engineer_office: {
    'chatbot-inside': 'Essential for you',
    'open-weights': 'Essential for you',
    'rag': 'Essential for you',
    'evals': 'Essential for you',
    'mcp': 'Essential for you',
    'multi-agent': 'Essential for you'
  }
}

export const LearnScreen: React.FC = () => {
  const { persona, activeConceptId, setActiveConceptId, completedConcepts } = useAppStore()
  const resetGame = useFactoryStore(s => s.resetGame)
  const [activeFoundationsTab, setActiveFoundationsTab] = useState<number | null>(null)
  const [learnMode, setLearnMode] = useState<'playgrounds' | 'concepts'>('playgrounds')
  const [isGameActive, setIsGameActive] = useState<boolean>(false)

  // Step 1: Foundations lessons (Beginner 2-minute orientation)
  const foundations = [
    {
      title: 'What can AI actually do for me today?',
      subtitle: '2-minute orientation',
      summary: 'AI is not a magical thinking brain; it is a lightning-fast pattern follower that has studied billions of public web pages.',
      takeaways: [
        'It is fantastic at summarizing messy documents, reformatting tables, drafting outlines, and finding syntax errors.',
        'It is terrible at live secrets, guaranteed arithmetic without checks, or replacing your real-world judgment.',
        'Best mindset: Treat it like an enthusiastic intern who never sleeps, but needs clear instructions.'
      ]
    },
    {
      title: 'How to ask good questions (Without jargon)',
      subtitle: 'The 3-part prompt formula',
      summary: 'You do not need prompt engineering certificates. Just use the 3-part checklist: Context, Task, and Constraints.',
      takeaways: [
        '1. Role / Context: "I am a high school history teacher preparing a quiz on the Industrial Revolution."',
        '2. Concrete Task: "Draft 5 multiple choice questions with 4 options each, marking the correct answer."',
        '3. Constraints: "Keep vocabulary accessible for 14-year-olds. Do not use tricky double negatives."'
      ]
    },
    {
      title: 'When NOT to trust AI',
      subtitle: 'The reality of hallucinations',
      summary: 'When an AI does not know an answer, it does not say "I don’t know"—it predicts what words sound most convincing.',
      takeaways: [
        'Avoid blindly copying legal citations, medical dosage advice, or specific library book page numbers.',
        'Ask it to cite where in your uploaded document it found the fact: "Show the exact sentence you referenced."',
        'If an answer sounds slightly too confident or surprising, double check using a search engine.'
      ]
    }
  ]

  // If a concept is selected, render the detail view
  if (activeConceptId) {
    const currentIdx = CONCEPTS_LIST.findIndex(c => c.id === activeConceptId)
    const current = CONCEPTS_LIST[currentIdx] || CONCEPTS_LIST[0]
    const nextConcept = CONCEPTS_LIST[currentIdx + 1]

    return (
      <ConceptDetailView
        concept={current.data}
        onBack={() => setActiveConceptId(null)}
        onNextConcept={nextConcept ? () => setActiveConceptId(nextConcept.id) : undefined}
        nextConceptTitle={nextConcept?.data.title_question}
      />
    )
  }

  const completedCount = Object.keys(completedConcepts).length
  const totalConcepts = CONCEPTS_LIST.length

  return (
    <div className="max-w-[1120px] mx-auto px-4 sm:px-6 py-8 pb-32 md:pb-20 space-y-12">
      
      {/* 1. Header Hero */}
      <section className="bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-6 sm:p-10 shadow-xs">
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-soft)] text-[var(--accent-ink)] text-xs font-semibold uppercase tracking-wider">
            <GraduationCap className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Foundations & Architecture</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-[var(--ink)] tracking-tight leading-[1.15]">
            How the AI you use actually works.
          </h1>

          <p className="text-base sm:text-lg text-[var(--muted)] leading-relaxed">
            No hype, no mathematical barriers. Master the 6 core building blocks with visual dual-coding and interactive demos, tailored for a <strong>{persona.replace('_', ' ')}</strong>.
          </p>
        </div>

        {/* Learning progress bar */}
        {completedCount > 0 && (
          <div className="mt-6 pt-6 border-t border-[var(--line)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                <Sparkles className="w-4 h-4" />
              </span>
              <div>
                <span className="text-xs font-bold text-[var(--ink)] block">
                  You are making progress: {completedCount} of {totalConcepts} concepts completed
                </span>
                <span className="text-[11px] text-[var(--muted)]">
                  You can now follow these kinds of AI news headlines with confidence.
                </span>
              </div>
            </div>

            <div className="w-full sm:w-48 h-2.5 rounded-full bg-[var(--line)] overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                style={{ width: `${Math.round((completedCount / totalConcepts) * 100)}%` }} 
              />
            </div>
          </div>
        )}
        {/* Mode Selector Segmented Pill Bar */}
        <div className="mt-8 pt-6 border-t border-[var(--line)] flex items-center justify-start">
          <div className="inline-flex p-1.5 rounded-2xl bg-[var(--bg)] border border-[var(--line)] shadow-xs">
            <button
              onClick={() => setLearnMode('playgrounds')}
              className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all min-h-[44px] flex items-center gap-2 ${
                learnMode === 'playgrounds'
                  ? 'bg-[var(--accent)] text-white shadow-xs'
                  : 'text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>🏭 AI Factory Simulation</span>
            </button>

            <button
              onClick={() => setLearnMode('concepts')}
              className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all min-h-[44px] flex items-center gap-2 ${
                learnMode === 'concepts'
                  ? 'bg-[var(--accent)] text-white shadow-xs'
                  : 'text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>6 Guided Concepts</span>
            </button>
          </div>
        </div>
      </section>

      {/* VIEW 1: INTERACTIVE MENTAL MODELS / FACTORY GAME */}
      {learnMode === 'playgrounds' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Game Preview & Launcher Card */}
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 border border-slate-800 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4 max-w-xl z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-mono font-semibold">
                <span>⚡ Interactive 3D Simulation</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-white">
                The AI Factory Arena
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Step inside the factory floor. Choose your data diet, clean away spam, train neural batches, and set ethical guardrails. Every decision alters your model's weights and determines whether it becomes a trustworthy helper or a toxic menace.
              </p>
              
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => {
                    resetGame()
                    setIsGameActive(true)
                  }}
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-white font-bold text-sm shadow-lg shadow-blue-500/30 hover:opacity-95 transition-all flex items-center gap-2 group cursor-pointer"
                >
                  <span>Start the Game</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  ~5 mins · 6 interactive stages
                </span>
              </div>
            </div>

            {/* Visual Teaser */}
            <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-3xl bg-slate-800/50 border border-slate-700/80 flex flex-col items-center justify-center relative p-6 text-center z-10 shrink-0">
              <span className="text-5xl animate-bounce">🔮</span>
              <p className="text-xs font-bold text-slate-200 mt-3">Live 3D Neural Crystal</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Captures your screen for complete focus</p>
            </div>

            {/* Background ambient glow */}
            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          </div>

          {/* Fullscreen Overlay when Game is Active */}
          {isGameActive && (
            <AIFactoryGame onExitFullscreen={() => setIsGameActive(false)} />
          )}
        </div>
      )}

      {/* VIEW 2: THE 6 CORE CONCEPTS */}
      {learnMode === 'concepts' && (
      <section className="space-y-6 animate-in fade-in duration-300">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-ink)] block">
            Step 2: Core Architecture Path
          </span>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[var(--ink)]">
            The 6 Fundamental Concepts
          </h2>
          <p className="text-xs sm:text-sm text-[var(--muted)]">
            Explore sequentially or jump directly to any topic. Prerequisites are suggested guides, never locked barriers.
          </p>
        </div>

        <div className="space-y-4">
          {CONCEPTS_LIST.map((item, index) => {
            const concept = item.data
            const isCompleted = !!completedConcepts[concept.id]
            const importance = PERSONA_IMPORTANCE[persona]?.[concept.id] || 'Useful for you'
            
            const importanceColor = 
              importance === 'Essential for you' 
                ? 'bg-[var(--accent-soft)] text-[var(--accent-ink)] border border-[var(--accent)]/30 font-bold'
                : importance === 'Useful for you'
                ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold'
                : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'

            return (
              <div
                key={concept.id}
                onClick={() => setActiveConceptId(concept.id)}
                className={`p-6 sm:p-7 rounded-3xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:-translate-y-0.5 ${
                  isCompleted
                    ? 'bg-[var(--surface)] border-emerald-400/80 shadow-xs ring-1 ring-emerald-500/20'
                    : 'bg-[var(--surface)] border-[var(--line)] shadow-xs hover:border-neutral-400 dark:hover:border-neutral-600 hover:shadow-md'
                }`}
              >
                {/* Left details */}
                <div className="space-y-3 flex-1">
                  
                  {/* Badges row */}
                  <div className="flex items-center flex-wrap gap-2">
                    {/* Node index */}
                    <span className="w-7 h-7 rounded-full bg-[var(--surface-hover)] text-xs font-bold text-[var(--ink)] flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>

                    {/* Persona Relevance Chip */}
                    <span className={`px-2.5 py-0.5 rounded-full text-xs ${importanceColor}`}>
                      {importance}
                    </span>

                    {/* Time estimate */}
                    <span className="flex items-center gap-1 text-[11px] text-[var(--muted)]">
                      <Clock className="w-3.5 h-3.5" />
                      <span>2-min core (~10 min with demo)</span>
                    </span>

                    {/* Prerequisite suggestion */}
                    {item.prereq && (
                      <span className="text-[11px] text-[var(--muted)] hidden sm:inline">
                        • Read first: <span className="italic">{item.prereq}</span>
                      </span>
                    )}
                  </div>

                  {/* Title Question */}
                  <div>
                    <h3 className="text-xl sm:text-2xl font-serif font-bold text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors">
                      {concept.title_question}
                    </h3>
                    <p className="text-xs text-[var(--muted)] mt-0.5 font-medium">
                      Also called: {concept.also_called}
                    </p>
                  </div>

                  {/* One-liner summary */}
                  <p className="text-xs sm:text-sm text-[var(--ink)] leading-relaxed max-w-2xl">
                    {concept.one_liner}
                  </p>
                </div>

                {/* Right Action / Progress Ring */}
                <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                  {isCompleted ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold">
                      <CheckDraw size={16} strokeWidth={2.5} color="#059669" />
                      <span>Completed</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent)] text-white text-xs font-semibold group-hover:opacity-90 transition-opacity min-h-[44px] shadow-xs">
                      <span>Start Lesson</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

              </div>
            )
          })}
        </div>
      </section>
      )}

    </div>
  )
}
