import React, { useState } from 'react'
import { Sparkles, Sliders, RefreshCw, Eye, ArrowRight, Check } from 'lucide-react'

interface CandidateToken {
  word: string
  baseProb: number
  nextPrompt?: string
}

const PROMPT_DATABASE: Record<string, { candidates: CandidateToken[]; nextCandidates?: Record<string, CandidateToken[]> }> = {
  "The capital of France is": {
    candidates: [
      { word: "Paris", baseProb: 0.82 },
      { word: "Lyon", baseProb: 0.08 },
      { word: "Marseille", baseProb: 0.05 },
      { word: "widely", baseProb: 0.03 },
      { word: "located", baseProb: 0.02 }
    ],
    nextCandidates: {
      "Paris": [
        { word: ", which", baseProb: 0.45 },
        { word: "and", baseProb: 0.25 },
        { word: ".", baseProb: 0.20 },
        { word: "is known", baseProb: 0.10 }
      ]
    }
  },
  "Artificial intelligence is changing the way we": {
    candidates: [
      { word: "work", baseProb: 0.46 },
      { word: "live", baseProb: 0.26 },
      { word: "communicate", baseProb: 0.14 },
      { word: "learn", baseProb: 0.09 },
      { word: "think", baseProb: 0.05 }
    ],
    nextCandidates: {
      "work": [
        { word: "and collaborate", baseProb: 0.40 },
        { word: "every day", baseProb: 0.30 },
        { word: "across industries", baseProb: 0.20 },
        { word: ".", baseProb: 0.10 }
      ]
    }
  },
  "Please find attached the latest copy of the": {
    candidates: [
      { word: "report", baseProb: 0.48 },
      { word: "document", baseProb: 0.24 },
      { word: "contract", baseProb: 0.14 },
      { word: "invoice", baseProb: 0.09 },
      { word: "presentation", baseProb: 0.05 }
    ]
  },
  "When making coffee, the first thing you need is": {
    candidates: [
      { word: "beans", baseProb: 0.42 },
      { word: "water", baseProb: 0.32 },
      { word: "a mug", baseProb: 0.14 },
      { word: "fresh beans", baseProb: 0.08 },
      { word: "hot water", baseProb: 0.04 }
    ]
  },
  "The best way to learn something new is to": {
    candidates: [
      { word: "practice", baseProb: 0.50 },
      { word: "read", baseProb: 0.22 },
      { word: "ask questions", baseProb: 0.15 },
      { word: "build projects", baseProb: 0.09 },
      { word: "teach it", baseProb: 0.04 }
    ]
  }
}

export const NextWordDemo: React.FC = () => {
  const promptKeys = Object.keys(PROMPT_DATABASE)
  const [selectedPrompt, setSelectedPrompt] = useState(promptKeys[0])
  const [accumulatedWords, setAccumulatedWords] = useState<string[]>([])
  const [temperature, setTemperature] = useState<'low' | 'med' | 'high'>('med')
  const [activeTab, setActiveTab] = useState<'next_word' | 'attention'>('next_word')
  
  // Attention demo state
  const [adjective, setAdjective] = useState<'big' | 'small'>('big')

  const currentData = PROMPT_DATABASE[selectedPrompt]
  const lastWord = accumulatedWords[accumulatedWords.length - 1]
  const candidates = (lastWord && currentData.nextCandidates && currentData.nextCandidates[lastWord])
    ? currentData.nextCandidates[lastWord]
    : currentData.candidates

  // Calculate scaled probabilities based on temperature
  const tempFactor = temperature === 'low' ? 0.3 : temperature === 'high' ? 1.8 : 1.0
  const adjustedProbs = candidates.map(c => {
    // softmax-like skew
    const expVal = Math.pow(c.baseProb, 1 / tempFactor)
    return { ...c, expVal }
  })
  const totalExp = adjustedProbs.reduce((acc, curr) => acc + curr.expVal, 0)
  const finalCandidates = adjustedProbs.map(c => ({
    ...c,
    displayPct: Math.round((c.expVal / totalExp) * 100)
  }))

  const handleSelectWord = (word: string) => {
    setAccumulatedWords([...accumulatedWords, word])
  }

  const handleReset = () => {
    setAccumulatedWords([])
  }

  return (
    <div className="bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-5 sm:p-7 shadow-xs space-y-6">
      
      {/* Tab Switcher: Next Word vs Attention */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-[var(--line)]">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('next_word')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all min-h-[36px] ${
              activeTab === 'next_word'
                ? 'bg-[var(--accent)] text-white shadow-xs'
                : 'bg-[var(--surface-hover)] text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            1. Next-Token Probabilities
          </button>
          <button
            onClick={() => setActiveTab('attention')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all min-h-[36px] ${
              activeTab === 'attention'
                ? 'bg-[var(--accent)] text-white shadow-xs'
                : 'bg-[var(--surface-hover)] text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            2. Attention Link Demo
          </button>
        </div>

        <span className="text-[11px] font-medium text-[var(--muted)]">
          Interactive simulation • Pre-written statistics
        </span>
      </div>

      {activeTab === 'next_word' ? (
        <div className="space-y-5">
          {/* Prompt Selector */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] block mb-2">
              Choose a starter sentence:
            </label>
            <div className="flex flex-wrap gap-2">
              {promptKeys.map(pk => (
                <button
                  key={pk}
                  onClick={() => {
                    setSelectedPrompt(pk)
                    setAccumulatedWords([])
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all text-left min-h-[36px] ${
                    selectedPrompt === pk
                      ? 'bg-[var(--accent-soft)] text-[var(--accent-ink)] border border-[var(--accent)]/30 font-semibold'
                      : 'bg-[var(--surface-hover)] text-[var(--ink)] hover:border-neutral-400'
                  }`}
                >
                  "{pk}..."
                </button>
              ))}
            </div>
          </div>

          {/* Temperature Slider */}
          <div className="p-3.5 rounded-2xl bg-[var(--surface-hover)] border border-[var(--line)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[var(--accent)] shrink-0" />
              <div>
                <span className="text-xs font-bold text-[var(--ink)] block">
                  Temperature: {temperature === 'low' ? 'Low (Predictable)' : temperature === 'med' ? 'Medium (Balanced)' : 'High (Adventurous)'}
                </span>
                <span className="text-[11px] text-[var(--muted)]">
                  Low = greedily picks top tokens. High = flattens distribution.
                </span>
              </div>
            </div>

            <div className="flex gap-1.5">
              {(['low', 'med', 'high'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTemperature(t)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize min-h-[36px] ${
                    temperature === t
                      ? 'bg-[var(--accent)] text-white shadow-xs'
                      : 'bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--ink)]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Current Generated Text Display */}
          <div className="p-4 rounded-2xl bg-[var(--surface-hover)] border border-[var(--line)]">
            <div className="flex items-center justify-between text-xs text-[var(--muted)] mb-1">
              <span>Text being generated:</span>
              {accumulatedWords.length > 0 && (
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1 text-[var(--accent)] hover:underline min-h-[32px] px-2"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reset words</span>
                </button>
              )}
            </div>

            <p className="text-base sm:text-lg font-serif text-[var(--ink)] leading-relaxed">
              <span>{selectedPrompt} </span>
              {accumulatedWords.map((w, idx) => (
                <span
                  key={idx}
                  className="inline-block px-1.5 py-0.5 mx-0.5 rounded-md bg-[var(--accent-soft)] text-[var(--accent-ink)] font-semibold animate-in fade-in"
                >
                  {w}
                </span>
              ))}
              <span className="inline-block w-2 h-4 ml-1 bg-[var(--accent)] animate-pulse align-middle" />
            </p>
          </div>

          {/* Next Candidate Tokens Probabilities */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                Next token probability distribution:
              </span>
              <span className="text-[11px] text-[var(--muted)]">Tap any word to append</span>
            </div>

            <div className="space-y-2">
              {finalCandidates.map((c, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectWord(c.word)}
                  className="w-full text-left p-2.5 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--line)] hover:border-[var(--accent)] transition-all group min-h-[44px]"
                >
                  <div className="flex items-center justify-between text-xs font-semibold mb-1">
                    <span className="text-[var(--ink)] group-hover:text-[var(--accent)]">
                      "{c.word}"
                    </span>
                    <span className="text-[var(--muted)] font-mono">
                      {c.displayPct}%
                    </span>
                  </div>
                  {/* Probability Bar */}
                  <div className="w-full h-2 rounded-full bg-[var(--line)] overflow-hidden">
                    <div
                      className="h-full bg-[var(--accent)] transition-all duration-300 rounded-full"
                      style={{ width: `${Math.max(4, c.displayPct)}%` }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Attention Mechanism Demo */
        <div className="space-y-5">
          <div>
            <h4 className="text-base font-serif font-bold text-[var(--ink)] mb-1">
              How Attention Disambiguates Pronouns
            </h4>
            <p className="text-xs sm:text-sm text-[var(--muted)]">
              In English, the word "it" can refer to multiple nouns. The self-attention matrix calculates which earlier noun the pronoun relates to based on surrounding context.
            </p>
          </div>

          {/* Toggle between big and small */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[var(--muted)] uppercase">Swap context word:</span>
            <div className="inline-flex rounded-xl p-1 bg-[var(--surface-hover)] border border-[var(--line)]">
              <button
                onClick={() => setAdjective('big')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold min-h-[36px] ${
                  adjective === 'big' ? 'bg-[var(--accent)] text-white shadow-xs' : 'text-[var(--muted)]'
                }`}
              >
                "...too big"
              </button>
              <button
                onClick={() => setAdjective('small')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold min-h-[36px] ${
                  adjective === 'small' ? 'bg-[var(--accent)] text-white shadow-xs' : 'text-[var(--muted)]'
                }`}
              >
                "...too small"
              </button>
            </div>
          </div>

          {/* Sentence Visualization with SVG Connection */}
          <div className="p-6 rounded-2xl bg-[var(--surface-hover)] border border-[var(--line)] relative space-y-4">
            <div className="text-sm sm:text-base font-serif leading-relaxed text-[var(--ink)] flex flex-wrap items-center gap-2">
              <span>The</span>
              <span className={`px-2 py-1 rounded-lg font-bold transition-all ${
                adjective === 'big' ? 'bg-emerald-100 text-emerald-900 ring-2 ring-emerald-500/50' : 'bg-[var(--surface)] text-[var(--muted)]'
              }`}>
                trophy
              </span>
              <span>did not fit in the</span>
              <span className={`px-2 py-1 rounded-lg font-bold transition-all ${
                adjective === 'small' ? 'bg-emerald-100 text-emerald-900 ring-2 ring-emerald-500/50' : 'bg-[var(--surface)] text-[var(--muted)]'
              }`}>
                suitcase
              </span>
              <span>because</span>
              <span className="px-2 py-1 rounded-lg bg-[var(--accent)] text-white font-bold">
                it
              </span>
              <span>was too</span>
              <span className="px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 font-bold">
                {adjective}
              </span>
              <span>.</span>
            </div>

            {/* Explanation card */}
            <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--line)] text-xs text-[var(--ink)] space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-[var(--accent-ink)]">
                <Check className="w-4 h-4 text-[var(--accent)]" />
                <span>Attention link: "it" connects to <strong>{adjective === 'big' ? 'the trophy (weight: 88%)' : 'the suitcase (weight: 82%)'}</strong></span>
              </div>
              <p className="text-[var(--muted)] leading-relaxed">
                {adjective === 'big'
                  ? 'Because an object that is "too big" fails to fit into a container, the attention weights strongly bind "it" back to "trophy".'
                  : 'Because a container that is "too small" cannot hold an object, flipping the adjective reverses the attention focus to "suitcase".'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Screen reader transcript note */}
      <div className="sr-only" aria-live="polite">
        Current prompt is {selectedPrompt}. Next token probability view active with temperature {temperature}.
      </div>
    </div>
  )
}
