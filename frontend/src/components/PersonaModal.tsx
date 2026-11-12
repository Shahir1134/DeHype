import React from 'react'
import { useAppStore } from '../store/useAppStore'
import { PersonaKey } from '../types'
import { GraduationCap, School, Briefcase, Laptop, X, Check } from 'lucide-react'

interface PersonaCardData {
  key: PersonaKey
  title: string
  headline: string
  description: string
  icon: React.ReactNode
  accentColor: string
}

export const PersonaModal: React.FC = () => {
  const { persona, isPersonaModalOpen, setIsPersonaModalOpen, setPersona } = useAppStore()

  if (!isPersonaModalOpen) return null

  const personas: PersonaCardData[] = [
    {
      key: 'student',
      title: 'Student',
      headline: 'Focus on coursework & research',
      description: 'Find real tools for notes, essays, and study plans without fear of plagiarism alarms.',
      icon: <GraduationCap className="w-6 h-6" />,
      accentColor: '#5B5BD6'
    },
    {
      key: 'teacher',
      title: 'Teacher',
      headline: 'Save hours on lesson plans',
      description: 'Practical ways to draft quizzes, provide feedback, and understand AI safety in schools.',
      icon: <School className="w-6 h-6" />,
      accentColor: '#E8702A'
    },
    {
      key: 'entrepreneur',
      title: 'Entrepreneur & Creator',
      headline: 'Automate tasks & protect budgets',
      description: 'Cut through marketing hype to see what genuinely helps you acquire customers and ship faster.',
      icon: <Briefcase className="w-6 h-6" />,
      accentColor: '#0E9F6E'
    },
    {
      key: 'engineer_office',
      title: 'Office / Engineer',
      headline: 'Streamline paperwork & meetings',
      description: 'Clear tools to summarize messy threads, format spreadsheets, and automate busywork.',
      icon: <Laptop className="w-6 h-6" />,
      accentColor: '#2563EB'
    }
  ]

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={() => setIsPersonaModalOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="persona-modal-title"
    >
      <div 
        className="w-full max-w-2xl bg-[var(--surface)] text-[var(--ink)] rounded-3xl p-6 sm:p-8 shadow-2xl border border-[var(--line)] relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={() => setIsPersonaModalOpen(false)}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-[var(--surface-hover)] text-[var(--muted)] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Close role switcher"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="mb-6">
          <span className="text-xs uppercase font-semibold tracking-wider text-[var(--muted)]">
            Customized For You
          </span>
          <h2 id="persona-modal-title" className="text-2xl sm:text-3xl font-serif font-bold text-[var(--ink)] mt-1">
            Who is reading today?
          </h2>
          <p className="text-sm sm:text-base text-[var(--muted)] mt-1">
            Pick your lens. The entire platform rewrites itself so every update answers: <em>“Does this matter to me?”</em>
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {personas.map((p) => {
            const isSelected = persona === p.key
            return (
              <button
                key={p.key}
                onClick={() => setPersona(p.key)}
                className={`relative flex flex-col text-left p-5 rounded-2xl border-2 transition-all duration-200 min-h-[140px] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] ${
                  isSelected 
                    ? 'border-[var(--accent)] bg-[var(--accent-soft)] shadow-sm' 
                    : 'border-[var(--line)] bg-[var(--surface)] hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-3">
                  <div 
                    className="p-2.5 rounded-xl flex items-center justify-center text-white"
                    style={{ backgroundColor: p.accentColor }}
                  >
                    {p.icon}
                  </div>
                  {isSelected && (
                    <span className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-[var(--accent)] text-white">
                      <Check className="w-3.5 h-3.5" />
                      Active
                    </span>
                  )}
                </div>

                <div className="font-serif font-bold text-lg text-[var(--ink)]">
                  {p.title}
                </div>
                <div className="text-xs font-medium text-[var(--accent-ink)] mb-1">
                  {p.headline}
                </div>
                <p className="text-xs text-[var(--muted)] leading-relaxed mt-auto">
                  {p.description}
                </p>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
