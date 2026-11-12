import React from 'react'
import { useAppStore } from '../store/useAppStore'
import { X, BookOpen, Lightbulb } from 'lucide-react'

export const GlossaryModal: React.FC = () => {
  const { selectedGlossaryTerm, setSelectedGlossaryTerm } = useAppStore()

  if (!selectedGlossaryTerm) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={() => setSelectedGlossaryTerm(null)}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="w-full max-w-md bg-[var(--surface)] text-[var(--ink)] rounded-2xl p-6 shadow-xl border border-[var(--line)] relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={() => setSelectedGlossaryTerm(null)}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-[var(--surface-hover)] text-[var(--muted)] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-3">
          <span className="p-2 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
            <BookOpen className="w-5 h-5" />
          </span>
          <span className="text-xs uppercase font-semibold tracking-wider text-[var(--muted)]">
            Plain Definition
          </span>
        </div>

        <h3 className="text-2xl font-serif font-bold text-[var(--ink)] mb-3">
          {selectedGlossaryTerm.term}
        </h3>

        <p className="text-base leading-relaxed text-[var(--ink)] mb-4">
          {selectedGlossaryTerm.simple_definition}
        </p>

        <div className="p-4 rounded-xl bg-[var(--accent-soft)] border border-[var(--accent)]/15 flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-[var(--accent)] shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-semibold text-[var(--accent-ink)] uppercase tracking-wider mb-1">
              Think of it like this:
            </div>
            <div className="text-sm text-[var(--accent-ink)] leading-snug">
              {selectedGlossaryTerm.analogy}
            </div>
          </div>
        </div>

        <div className="mt-5 text-center">
          <button
            onClick={() => setSelectedGlossaryTerm(null)}
            className="w-full py-2.5 px-4 rounded-xl bg-[var(--surface-hover)] text-[var(--ink)] font-medium hover:bg-[var(--line)] transition-colors min-h-[44px]"
          >
            Got it, thanks
          </button>
        </div>
      </div>
    </div>
  )
}
