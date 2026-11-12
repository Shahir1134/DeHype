import React, { useState } from 'react'
import { FileText, Search, BookOpen, CheckCircle, AlertTriangle, Sparkles, Layers, RefreshCw } from 'lucide-react'

export const PipelineStepper: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(0)
  const [withRag, setWithRag] = useState<boolean>(true)
  const [breakMode, setBreakMode] = useState<'normal' | 'missing_page' | 'outdated_page' | 'bad_chunk'>('normal')
  const [highlightedSource, setHighlightedSource] = useState<boolean>(false)

  const steps = [
    { title: '1. Chunk Documents', desc: 'Your 50-page handbook is split into ~300-word snippets.' },
    { title: '2. User Query', desc: 'You ask: "What is our company parental leave policy?"' },
    { title: '3. Semantic Retrieval', desc: 'Search engine pulls Chunk #14 (HR Handbook § 4.2).' },
    { title: '4. Grounded Answer', desc: 'AI summarizes chunk with citation badge.' }
  ]

  return (
    <div className="bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-5 sm:p-7 shadow-xs space-y-6">
      
      {/* Top Controls: With/Without RAG toggle + BreakIt Mode */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--line)]">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-ink)] block">
            RAG Pipeline Sandbox
          </span>
          <h4 className="text-base font-serif font-bold text-[var(--ink)]">
            Retrieval vs Hallucination Comparison
          </h4>
        </div>

        {/* Toggle With / Without RAG */}
        <div className="inline-flex rounded-2xl p-1 bg-[var(--surface-hover)] border border-[var(--line)]">
          <button
            onClick={() => {
              setWithRag(false)
              setBreakMode('normal')
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[36px] ${
              !withRag ? 'bg-amber-600 text-white shadow-xs' : 'text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            Without RAG (Guessing)
          </button>
          <button
            onClick={() => setWithRag(true)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[36px] ${
              withRag ? 'bg-emerald-600 text-white shadow-xs' : 'text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            With RAG (Grounded)
          </button>
        </div>
      </div>

      {/* BreakIt Mode Selector (Only when With RAG is on) */}
      {withRag && (
        <div className="p-3.5 rounded-2xl bg-[var(--surface-hover)] border border-[var(--line)] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--ink)] flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>Break It Mode (Simulate Common Real-World RAG Failures):</span>
            </span>
            {breakMode !== 'normal' && (
              <button
                onClick={() => setBreakMode('normal')}
                className="text-xs text-[var(--accent)] hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset to normal</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { id: 'normal', label: 'Healthy Pipeline' },
              { id: 'missing_page', label: 'Key Page Missing' },
              { id: 'outdated_page', label: 'Outdated 2021 File Uploaded' },
              { id: 'bad_chunk', label: 'Bad Chunking Cutoff' }
            ].map(b => (
              <button
                key={b.id}
                onClick={() => setBreakMode(b.id as any)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all min-h-[36px] ${
                  breakMode === b.id
                    ? 'bg-[var(--accent)] text-white shadow-xs'
                    : 'bg-[var(--surface)] border border-[var(--line)] text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Interactive 4-Step Pipeline Flow */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {steps.map((st, i) => (
          <button
            key={i}
            onClick={() => setActiveStep(i)}
            className={`p-3 rounded-2xl text-left border transition-all min-h-[44px] ${
              activeStep === i
                ? 'bg-[var(--accent-soft)] border-[var(--accent)]/40 shadow-xs'
                : 'bg-[var(--surface-hover)] border-[var(--line)]'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold text-[var(--ink)] mb-1">
              <span>{st.title}</span>
              {activeStep === i && <CheckCircle className="w-3.5 h-3.5 text-[var(--accent)]" />}
            </div>
            <p className="text-[11px] text-[var(--muted)] line-clamp-2">
              {st.desc}
            </p>
          </button>
        ))}
      </div>

      {/* Result Demonstration Box */}
      <div className="p-5 rounded-2xl bg-[var(--surface-hover)] border border-[var(--line)] space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
            Prompt: "What is our company parental leave policy?"
          </span>
          <span className="text-[11px] font-semibold text-[var(--muted)]">
            Target Source: Acme Corp Employee Handbook 2026
          </span>
        </div>

        {!withRag ? (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Answer WITHOUT RAG (Generic Hallucination Risk):</span>
            </div>
            <p className="text-xs sm:text-sm text-amber-950 dark:text-amber-100 leading-relaxed italic">
              "Under typical standard policies, employees receive 12 weeks of paid leave following the birth or adoption of a child, which can be extended by 4 weeks upon manager approval."
            </p>
            <p className="text-[11px] text-amber-800 dark:text-amber-300 pt-1">
              ⚠️ <strong>The danger:</strong> This sounds authoritative, but the model has never seen Acme Corp's actual contract. If your company actually offers 16 weeks or has a 6-month tenure requirement, this answer is misleading.
            </p>
          </div>
        ) : breakMode === 'missing_page' ? (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-red-900 dark:text-red-200">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>Simulated Failure: Relevant Page Missing from Vector Store</span>
            </div>
            <p className="text-xs sm:text-sm text-red-900 dark:text-red-200 leading-relaxed">
              "I searched your uploaded handbook, but no sections mention parental leave. The HR benefits appendix was not included in your uploaded files."
            </p>
            <p className="text-[11px] text-red-800 dark:text-red-300">
              💡 <strong>Takeaway:</strong> An honest RAG system admits when the passage was not found rather than fabricating an answer.
            </p>
          </div>
        ) : breakMode === 'outdated_page' ? (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Simulated Failure: Outdated Document Uploaded (2021 vs 2026)</span>
            </div>
            <p className="text-xs sm:text-sm text-amber-950 dark:text-amber-100 leading-relaxed">
              "Employees receive 6 weeks of leave <span className="underline font-bold">[Source: 2021_Policy_Old.pdf, Page 8]</span>."
            </p>
            <p className="text-[11px] text-amber-800 dark:text-amber-300">
              💡 <strong>Takeaway:</strong> RAG cannot fix outdated source data. If you upload old manuals, the AI will accurately quote obsolete policies.
            </p>
          </div>
        ) : breakMode === 'bad_chunk' ? (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Simulated Failure: Sentence Chopped in Half by Chunk Boundary</span>
            </div>
            <p className="text-xs sm:text-sm text-amber-950 dark:text-amber-100 leading-relaxed">
              "Leave is eligible for all staff who have completed..." (truncated sentence).
            </p>
            <p className="text-[11px] text-amber-800 dark:text-amber-300">
              💡 <strong>Takeaway:</strong> Poor chunking cuts sentences mid-thought. Proper RAG systems use semantic chunking and chunk overlap to preserve context.
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Grounded RAG Answer:</span>
              </span>

              {/* Clickable Source Pill */}
              <button
                onClick={() => setHighlightedSource(!highlightedSource)}
                className="px-2.5 py-1 rounded-lg bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-1 min-h-[32px]"
                title="Click to inspect source passage"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Source: Handbook § 4.2 (Page 14)</span>
              </button>
            </div>

            <p className="text-xs sm:text-sm text-emerald-950 dark:text-emerald-100 leading-relaxed">
              "Acme Corp provides 16 consecutive weeks of fully paid parental leave to all full-time employees with at least 6 months of continuous tenure. An optional additional 4 weeks of unpaid leave is available upon written notification."
            </p>

            {highlightedSource && (
              <div className="p-3 rounded-lg bg-[var(--surface)] border border-emerald-400 text-xs text-[var(--ink)] space-y-1 animate-in fade-in">
                <span className="font-bold text-[11px] text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                  Original Document Excerpt (HR Handbook § 4.2):
                </span>
                <p className="italic bg-emerald-100/50 dark:bg-emerald-950/60 p-2 rounded border border-emerald-200 dark:border-emerald-900">
                  "...4.2 Parental Benefits: Full-time personnel who have achieved at least six (6) months continuous active employment are entitled to sixteen (16) weeks of compensated parental leave. Four (4) supplementary uncompensated weeks may be requested..."
                </p>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  )
}
