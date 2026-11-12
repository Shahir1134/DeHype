import React, { useState } from 'react'
import { Users, Bot, CheckCircle2, AlertTriangle, ArrowRight, RefreshCw, Play, Sparkles, Layers, ShieldCheck, ExternalLink } from 'lucide-react'

interface StatusBoardItem {
  id: string
  subject: string
  claim: string
  current_status: string
  verified_at: string
  source_url: string
  source_label: string
  report_status: 'verified' | 'reports_differ' | 'unverified'
}

interface MultiAgentDemoProps {
  statusBoardItems?: StatusBoardItem[]
}

const SAMPLE_TASKS = [
  {
    id: 'school',
    title: 'School Parent Update: Robotics Club',
    singleAgentOutput: 'Hello parents. Our robotics team is doing well. We meet on Tuesdays. Please bring lunch. It will be fun and educational.',
    singleAgentCritique: 'Vague, misses meeting times, lacks pickup location, no mention of student safety rules or permission slips.',
    researcherNotes: '• Date: Every Tuesday 3:30-5:00 PM\n• Room: Lab 204\n• Requires signed safety waiver\n• Mentors: Mr. Davis & Ms. Chen\n• Free participation',
    writerDraft1: 'Dear Parents, Robotics club meets every Tuesday at 3:30 PM in Lab 204. Please ensure you sign the safety waiver before the first session so your child can participate safely.',
    criticFeedback: 'Good start. Please specify pickup time (5:00 PM) and name the teacher mentors so parents know who to contact.',
    finalApproved: 'Dear Parents, Robotics Club meets every Tuesday from 3:30 PM to 5:00 PM in Lab 204 with Mr. Davis and Ms. Chen. Participation is free, but all students must return a signed lab safety waiver before their first session. Pickup is at the main entrance at 5:00 PM.'
  },
  {
    id: 'startup',
    title: 'Founder Briefing: 2026 AI Compute Costs',
    singleAgentOutput: 'AI is getting cheaper. You should use smaller models to save money because cloud GPUs are expensive.',
    singleAgentCritique: 'Lacks actual architectural strategies, ignores quantization, and does not provide an actionable evaluation checklist.',
    researcherNotes: '• Quantized 8B models run on standard cloud CPU instances\n• Cloud token pricing dropped ~60% in 2026\n• Hybrid approach: small model for 90% routine queries, large model fallback for 10% hard reasoning',
    writerDraft1: 'Founders can save money by switching from large models to small 8B models. They are cheaper and run on standard cloud hardware.',
    criticFeedback: 'Too binary. Add the two-tier routing strategy so non-technical founders know they do not have to sacrifice quality on complex queries.',
    finalApproved: 'To minimize operational costs without sacrificing quality, adopt a two-tier routing architecture: route 90% of routine customer inquiries to lightweight 8B quantized models running on standard hardware, and route only the 10% ambiguous queries to larger frontier models.'
  }
]

export const MultiAgentDemo: React.FC<MultiAgentDemoProps> = ({ statusBoardItems = [] }) => {
  const [selectedTaskIdx, setSelectedTaskIdx] = useState(0)
  const [mode, setMode] = useState<'single' | 'team'>('team')
  const [teamStep, setTeamStep] = useState<number>(3) // 0: Research, 1: Draft, 2: Critique, 3: Final Approved
  const [preventLoop, setPreventLoop] = useState<boolean>(true)

  const task = SAMPLE_TASKS[selectedTaskIdx]

  return (
    <div className="bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-5 sm:p-7 shadow-xs space-y-6">
      
      {/* 1. Header & Mode Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--line)]">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-ink)] block">
            Multi-Agent Architecture Simulation
          </span>
          <h4 className="text-base font-serif font-bold text-[var(--ink)]">
            Single Monolithic Prompt vs. Collaborative Agent Team
          </h4>
        </div>

        {/* Mode Selector */}
        <div className="inline-flex rounded-2xl p-1 bg-[var(--surface-hover)] border border-[var(--line)]">
          <button
            onClick={() => setMode('single')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[36px] ${
              mode === 'single' ? 'bg-amber-600 text-white shadow-xs' : 'text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            Single Prompt (Solo)
          </button>
          <button
            onClick={() => setMode('team')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[36px] ${
              mode === 'team' ? 'bg-emerald-600 text-white shadow-xs' : 'text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            Multi-Agent Team (Writer + Critic)
          </button>
        </div>
      </div>

      {/* Task Picker */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] block mb-1.5">
          Select a collaborative scenario:
        </label>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_TASKS.map((t, idx) => (
            <button
              key={t.id}
              onClick={() => {
                setSelectedTaskIdx(idx)
                setTeamStep(3)
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all min-h-[36px] ${
                selectedTaskIdx === idx
                  ? 'bg-[var(--accent-soft)] text-[var(--accent-ink)] border border-[var(--accent)]/30 font-bold'
                  : 'bg-[var(--surface-hover)] text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              {t.title}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Visual Demonstration Stage */}
      {mode === 'single' ? (
        <div className="p-5 sm:p-6 rounded-2xl bg-[var(--surface-hover)] border border-[var(--line)] space-y-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Solo Model (All Roles Packed into One Prompt)
              </span>
              <h5 className="font-serif font-bold text-base text-[var(--ink)]">
                Output Without Independent Review
              </h5>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--line)] text-xs sm:text-sm text-[var(--ink)] leading-relaxed italic">
            "{task.singleAgentOutput}"
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200 space-y-1">
            <span className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Oversight Analysis:</span>
            </span>
            <p className="leading-relaxed">{task.singleAgentCritique}</p>
          </div>
        </div>
      ) : (
        /* Team Workflow Stepper */
        <div className="space-y-4 animate-in fade-in">
          {/* Stepper Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { idx: 0, label: '1. Researcher', role: 'Finds facts' },
              { idx: 1, label: '2. Writer', role: 'Drafts text' },
              { idx: 2, label: '3. Critic', role: 'Reviews quality' },
              { idx: 3, label: '4. Supervisor', role: 'Final polish' }
            ].map(s => (
              <button
                key={s.idx}
                onClick={() => setTeamStep(s.idx)}
                className={`p-3 rounded-2xl border text-left transition-all min-h-[44px] ${
                  teamStep === s.idx
                    ? 'bg-[var(--accent-soft)] border-[var(--accent)]/40 shadow-xs'
                    : 'bg-[var(--surface-hover)] border-[var(--line)]'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold text-[var(--ink)] mb-0.5">
                  <span>{s.label}</span>
                  {teamStep === s.idx && <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent)]" />}
                </div>
                <span className="text-[11px] text-[var(--muted)]">{s.role}</span>
              </button>
            ))}
          </div>

          {/* Active Step Content */}
          <div className="p-5 rounded-2xl bg-[var(--surface-hover)] border border-[var(--line)] space-y-3">
            {teamStep === 0 && (
              <div className="space-y-2 animate-in fade-in">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-ink)] block">
                  🔍 Agent 1: Fact Researcher Output
                </span>
                <p className="text-xs text-[var(--muted)]">
                  The researcher queries documents and structured notes without attempting to write prose:
                </p>
                <pre className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--line)] text-xs font-mono text-[var(--ink)] whitespace-pre-wrap leading-relaxed">
                  {task.researcherNotes}
                </pre>
              </div>
            )}

            {teamStep === 1 && (
              <div className="space-y-2 animate-in fade-in">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-ink)] block">
                  ✍️ Agent 2: Writer Draft (Attempt 1)
                </span>
                <p className="text-xs text-[var(--muted)]">
                  The writer drafts text using the researcher's facts:
                </p>
                <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--line)] text-xs sm:text-sm text-[var(--ink)] leading-relaxed italic">
                  "{task.writerDraft1}"
                </div>
              </div>
            )}

            {teamStep === 2 && (
              <div className="space-y-2 animate-in fade-in">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
                  🧐 Agent 3: Critic / Evaluator Feedback
                </span>
                <p className="text-xs text-[var(--muted)]">
                  The critic compares the draft against prompt constraints and points out gaps:
                </p>
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-950 dark:text-amber-200 leading-relaxed">
                  💡 <strong>Revision Request:</strong> "{task.criticFeedback}"
                </div>
              </div>
            )}

            {teamStep === 3 && (
              <div className="space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>🎯 Supervisor Agent: Final Validated Output</span>
                  </span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    2 Cycles • Ready
                  </span>
                </div>
                <p className="text-xs text-[var(--muted)]">
                  The writer revises based on the critique, and the supervisor approves delivery:
                </p>
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs sm:text-sm text-emerald-950 dark:text-emerald-100 leading-relaxed font-medium">
                  "{task.finalApproved}"
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Infinite Loop Guard Simulation */}
      <div className="p-4 rounded-2xl bg-[var(--surface-hover)] border border-[var(--line)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[var(--accent)] shrink-0" />
          <div>
            <span className="text-xs font-bold text-[var(--ink)] block">
              Supervisor Stopping Conditions (Loop Guard):
            </span>
            <span className="text-[11px] text-[var(--muted)]">
              Enforcing maximum iteration limit ($k \le 3$) prevents infinite debate loops between writer and critic.
            </span>
          </div>
        </div>

        <button
          onClick={() => setPreventLoop(!preventLoop)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all min-h-[36px] shrink-0 ${
            preventLoop
              ? 'bg-emerald-600 text-white'
              : 'bg-amber-600 text-white'
          }`}
        >
          {preventLoop ? 'Guard Enabled (Safe)' : 'Guard Disabled'}
        </button>
      </div>

      {/* 4. Verified Status Board */}
      {statusBoardItems.length > 0 && (
        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--line)] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              Verified Frameworks Status Board
            </span>
            <span className="text-[10px] text-[var(--muted)]">Industry tracker</span>
          </div>

          <div className="space-y-2">
            {statusBoardItems.map(item => (
              <div key={item.id} className="p-3 rounded-xl bg-[var(--surface-hover)] border border-[var(--line)] text-xs space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-[var(--ink)]">{item.subject}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Checked {item.verified_at}
                  </span>
                </div>
                <p className="text-[var(--ink)]">{item.current_status}</p>
                <div className="pt-1">
                  <a
                    href={item.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--accent)] hover:underline"
                  >
                    <span>Source: {item.source_label}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
