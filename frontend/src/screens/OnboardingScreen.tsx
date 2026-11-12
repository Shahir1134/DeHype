import React, { useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { PersonaKey } from '../types'
import { GraduationCap, School, Briefcase, Laptop, ArrowRight, Sparkles, Check } from 'lucide-react'

export const OnboardingScreen: React.FC = () => {
  const { completeOnboarding } = useAppStore()
  const [selected, setSelected] = useState<PersonaKey>('student')
  const [step, setStep] = useState<'pick' | 'preview'>('pick')

  const roles = [
    {
      key: 'student' as PersonaKey,
      title: 'Student',
      tagline: 'Research, essays & study schedules',
      description: 'Get clear tools for studying, summarizing readings, and citing safely without plagiarism flags.',
      icon: GraduationCap,
      color: '#5B5BD6',
      sampleHeadline: 'Claude 3.7 Sonnet can now double-check essay logic step-by-step.',
      sampleTakeaway: 'You can paste an assignment outline and ask for weak spots before writing.'
    },
    {
      key: 'teacher' as PersonaKey,
      title: 'Teacher & Educator',
      tagline: 'Lesson plans, rubrics & classroom guidance',
      description: 'Learn realistic ways to grade faster, build tailored assignments, and guide curious students.',
      icon: School,
      color: '#E8702A',
      sampleHeadline: 'New open benchmarks show which homework checkers actually make mistakes.',
      sampleTakeaway: 'Save 2 hours on Sunday drafting personalized reading questions for your class.'
    },
    {
      key: 'entrepreneur' as PersonaKey,
      title: 'Entrepreneur & Creator',
      tagline: 'Customer outreach, budgets & shipping products',
      description: 'Filter through marketing claims to see what actually saves money or automates sales tasks.',
      icon: Briefcase,
      color: '#0E9F6E',
      sampleHeadline: 'DeepSeek-V3 reduces customer support automation costs by 80%.',
      sampleTakeaway: 'You can test a draft chatbot using your own FAQ sheet without hiring an agency.'
    },
    {
      key: 'engineer_office' as PersonaKey,
      title: 'Office / Engineer',
      tagline: 'Spreadsheets, messy inbox & repetitive tasks',
      description: 'Practical workflows to summarize meeting transcripts, organize files, and cut daily busywork.',
      icon: Laptop,
      color: '#2563EB',
      sampleHeadline: 'Model Context Protocol (MCP) lets desktop tools connect to spreadsheets safely.',
      sampleTakeaway: 'Turn 3 hours of copying numbers into a 30-second prompt that formats tables cleanly.'
    }
  ]

  const currentRole = roles.find(r => r.key === selected)!

  const handleSelect = (key: PersonaKey) => {
    setSelected(key)
    document.documentElement.setAttribute('data-persona', key)
  }

  const handleFinish = () => {
    completeOnboarding(selected)
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col justify-center items-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-2xl bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-6 sm:p-10 shadow-xl transition-all">
        
        {step === 'pick' ? (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-soft)] text-[var(--accent-ink)] text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>Zero Technical Jargon</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-[var(--ink)]">
                DeHype
              </h1>
              <p className="text-sm sm:text-base text-[var(--muted)] mt-2 max-w-lg mx-auto">
                No marketing hype, personal scandals, or jargon. Pick your daily role so we only highlight what directly helps your work.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {roles.map(r => {
                const Icon = r.icon
                const isSelected = selected === r.key
                return (
                  <button
                    key={r.key}
                    onClick={() => handleSelect(r.key)}
                    className={`flex flex-col text-left p-5 rounded-2xl border-2 transition-all duration-200 min-h-[140px] focus:outline-none ${
                      isSelected 
                        ? 'border-[var(--accent)] bg-[var(--accent-soft)] shadow-sm' 
                        : 'border-[var(--line)] bg-[var(--surface)] hover:border-neutral-300 dark:hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-3">
                      <div 
                        className="p-2.5 rounded-xl text-white"
                        style={{ backgroundColor: r.color }}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      {isSelected && (
                        <span className="w-6 h-6 rounded-full bg-[var(--accent)] text-white flex items-center justify-center">
                          <Check className="w-4 h-4" />
                        </span>
                      )}
                    </div>
                    <div className="font-serif font-bold text-lg text-[var(--ink)]">
                      {r.title}
                    </div>
                    <div className="text-xs font-semibold text-[var(--accent-ink)] mb-1">
                      {r.tagline}
                    </div>
                    <p className="text-xs text-[var(--muted)] leading-relaxed mt-auto">
                      {r.description}
                    </p>
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => setStep('preview')}
              className="w-full py-3.5 px-6 rounded-2xl bg-[var(--accent)] text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 shadow-md transition-all min-h-[48px]"
            >
              <span>Continue as {currentRole.title}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)]" />
              <span>Your First 30-Second AI Briefing</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[var(--ink)] mb-4">
              Here is how AI news works for a {currentRole.title}:
            </h2>

            <div className="p-5 rounded-2xl bg-[var(--accent-soft)] border border-[var(--accent)]/20 mb-6">
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--accent-ink)] mb-1">
                Recent Story:
              </div>
              <div className="text-base sm:text-lg font-serif font-semibold text-[var(--ink)] mb-2">
                "{currentRole.sampleHeadline}"
              </div>
              <div className="text-sm text-[var(--muted)] leading-relaxed mb-3">
                <strong className="text-[var(--ink)]">What you can actually do:</strong> {currentRole.sampleTakeaway}
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-[var(--accent-ink)]">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                <span>Ready to use today without writing code</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setStep('pick')}
                className="py-3 px-5 rounded-xl border border-[var(--line)] text-[var(--muted)] hover:text-[var(--ink)] font-medium text-sm transition-colors min-h-[44px]"
              >
                Change Role
              </button>
              <button
                onClick={handleFinish}
                className="flex-1 py-3 px-6 rounded-xl bg-[var(--accent)] text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity min-h-[48px]"
              >
                <span>Enter Your Daily AI Feed</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
