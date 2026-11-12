import React, { useState, useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'
import { TaskItem, ToolRecommendResponse, ToolRecommendation } from '../types'
import { 
  Wrench, 
  Search, 
  Sparkles, 
  Check, 
  Copy, 
  ExternalLink, 
  ShieldAlert, 
  ShieldCheck, 
  HelpCircle, 
  X, 
  AlertTriangle,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  Lock,
  Zap,
  ArrowRight,
  RotateCcw,
  MessageSquare,
  Compass,
  Sliders,
  Lightbulb,
  ChevronDown
} from 'lucide-react'
import { CheckDraw } from '../components/motion/CheckDraw'

// Quick Prompt Starters for curious beginners
const PROMPT_STARTERS = [
  {
    id: 'extension',
    label: 'Ask for a deadline extension',
    raw: 'write an email to my manager asking for more time on the quarterly report',
    role: 'Act as an experienced workplace communication coach and executive advisor.',
    context: 'The goal is to request a 3-day extension on the quarterly report without sounding disorganized or defensive. Emphasize that ensuring data accuracy on recent customer metrics is the reason, and provide an updated delivery schedule.',
    format: 'Keep it under 120 words. Professional, calm, and solution-oriented. Provide 2 subject line options.'
  },
  {
    id: 'summarize',
    label: 'Summarize a dense 10-page document',
    raw: 'summarize this document for me so I can read it fast',
    role: 'Act as an executive intelligence analyst who turns dense reports into high-signal briefings.',
    context: 'Extract core findings from the provided text. Exclude corporate jargon and speculative hype. Focus on verified metrics and immediate blockers.',
    format: 'Use exactly 3 sections: 1) The 1-sentence bottom line, 2) 3 key bullet points with metric changes, 3) Critical decisions or risks.'
  },
  {
    id: 'critique',
    label: 'Critique my writing gently',
    raw: 'tell me what is wrong with my email and fix it',
    role: 'Act as a warm, supportive editor who polishes clarity while preserving the writer\'s authentic voice.',
    context: 'Review the draft provided. Identify any phrasing that might sound accidentally curt, passive-aggressive, or wordy. Explain why each edit improves clarity.',
    format: '1) Brief diagnosis (2 sentences on tone), 2) Improved version side-by-side, 3) The single biggest lesson to remember next time.'
  },
  {
    id: 'ideas',
    label: 'Brainstorm business or project ideas',
    raw: 'give me ideas for a local service business with low startup cost',
    role: 'Act as a pragmatic small business strategist specializing in lean, local operations.',
    context: 'Focus exclusively on businesses that require under $2,000 in upfront equipment, have immediate cash-flow potential, and rely on skills a single motivated person can execute.',
    format: 'Give 3 distinct ideas. For each: 1) Who pays, 2) Typical price per job, 3) How to get the very first 3 customers within 14 days.'
  }
]

// 10-Second Quick Matchmaker Data
const QUICK_MATCHES: Record<string, Record<string, { name: string; note: string; url: string }>> = {
  writing: {
    free: { name: 'Claude 3.5 Sonnet (Free tier)', note: 'Natural, nuanced human tone with zero robotic fluff.', url: 'https://claude.ai' },
    paid: { name: 'Claude Pro ($20/mo)', note: 'Higher daily limits and superior drafting for complex projects.', url: 'https://claude.ai' }
  },
  research: {
    free: { name: 'Perplexity AI (Free)', note: 'Direct answers with live, clickable source citations on every sentence.', url: 'https://perplexity.ai' },
    paid: { name: 'Perplexity Pro ($20/mo)', note: 'Deep academic search with file analysis and multi-model switching.', url: 'https://perplexity.ai' }
  },
  files: {
    free: { name: 'Google NotebookLM (100% Free)', note: 'Upload your own PDFs, audio & notes with zero hallucinated outside data.', url: 'https://notebooklm.google.com' },
    paid: { name: 'ChatGPT Plus with Data Analysis ($20/mo)', note: 'Runs Python code on your CSVs and charts automatically.', url: 'https://chatgpt.com' }
  },
  coding: {
    free: { name: 'Cursor (Free tier) or Claude Code', note: 'Understands your full workspace context and edits files directly.', url: 'https://cursor.com' },
    paid: { name: 'Cursor Pro ($20/mo)', note: 'Fast multi-file agentic edits and background task execution.', url: 'https://cursor.com' }
  }
}

// Concept C: High-impact Dilemma Scenarios (Winner + Real Proof)
const DILEMMA_SCENARIOS = [
  {
    id: 'files',
    label: '📄 Read long files & PDFs',
    shortLabel: 'Read Files',
    winner: {
      name: 'NotebookLM',
      maker: 'Google',
      plan: '100% Free with Google Account',
      badge: 'Unmatched Citation Accuracy',
      oneLiner: 'Strictly answers from your uploaded documents without ever hallucinating outside facts.',
      proofTitle: 'The 30-Second Proof',
      proofStory: 'We uploaded a dense 48-page apartment lease agreement and asked: "What is the penalty if I break the lease early?" It cited Section 14.2 on page 31 in 4 seconds with 0% fabricated fluff.',
      starterPrompt: 'Using ONLY the uploaded document, list the top 3 deadlines or penalties mentioned and cite the exact page numbers for each.',
      officialUrl: 'https://notebooklm.google.com'
    },
    runnerUp: {
      name: 'Claude 3.5 Sonnet',
      maker: 'Anthropic',
      plan: 'Free tier / Pro $20/mo',
      reasonToChoose: 'Best if you need to rewrite the PDF into a polished executive memo with nuanced human formatting.',
      officialUrl: 'https://claude.ai'
    },
    notForAi: 'Do not upload unredacted company trade secrets, patient medical records, or passwords to public cloud tools.'
  },
  {
    id: 'writing',
    label: '✍️ Draft an email or memo',
    shortLabel: 'Write & Edit',
    winner: {
      name: 'Claude 3.5 Sonnet',
      maker: 'Anthropic',
      plan: 'Free tier / Pro $20/mo',
      badge: 'Most Human Voice',
      oneLiner: 'Unrivaled natural writing voice with zero robotic clichés like "I hope this email finds you well."',
      proofTitle: 'The 30-Second Proof',
      proofStory: 'We gave it rough, frustrated notes about a missed vendor shipment. It generated a firm, respectful email that held the vendor accountable without burning the working relationship.',
      starterPrompt: 'Act as an executive communication coach. Rewrite these rough notes into a firm, diplomatic email under 120 words. Offer 2 subject line options: [Paste notes]',
      officialUrl: 'https://claude.ai'
    },
    runnerUp: {
      name: 'ChatGPT (GPT-4o)',
      maker: 'OpenAI',
      plan: 'Free tier / Plus $20/mo',
      reasonToChoose: 'Best if you need rapid translation into 30+ languages or seamless mobile voice drafting.',
      officialUrl: 'https://chatgpt.com'
    },
    notForAi: 'Never let AI send critical HR evaluations or termination notices without human review.'
  },
  {
    id: 'research',
    label: '🔍 Web research with citations',
    shortLabel: 'Web Research',
    winner: {
      name: 'Perplexity AI',
      maker: 'Perplexity',
      plan: 'Free tier / Pro $20/mo',
      badge: 'Direct Web Citations',
      oneLiner: 'Answers direct questions and puts clickable, verified footnotes on every single sentence.',
      proofTitle: 'The 30-Second Proof',
      proofStory: 'We asked: "Did the EU AI Act deadline get postponed in 2026?" Instead of guessing, it cited official European Commission press releases from this morning with direct links.',
      starterPrompt: 'What are the 3 major differences between [Topic A] and [Topic B]? Cite primary news or official documentation sources for each point.',
      officialUrl: 'https://perplexity.ai'
    },
    runnerUp: {
      name: 'Google Gemini',
      maker: 'Google',
      plan: 'Free tier / Advanced $20/mo',
      reasonToChoose: 'Best if you want to verify answers directly against your personal Google Docs and Gmail.',
      officialUrl: 'https://gemini.google.com'
    },
    notForAi: 'Do not rely on web research for real-time stock trading or rapid legal court deadlines.'
  },
  {
    id: 'data',
    label: '📊 Clean messy spreadsheets',
    shortLabel: 'Data & Excel',
    winner: {
      name: 'ChatGPT Plus (Data Analysis)',
      maker: 'OpenAI',
      plan: '$20/month',
      badge: 'Sandboxed Python Engine',
      oneLiner: 'Upload a broken CSV and it writes and runs real Python code in the background to clean it.',
      proofTitle: 'The 30-Second Proof',
      proofStory: 'We uploaded an unformatted export with mixed date formats (DD/MM and MM/DD). It standardized all 1,200 rows and output a clean downloadable Excel file in 15 seconds.',
      starterPrompt: 'Review this spreadsheet. 1) Identify any missing values or inconsistent date formats. 2) Clean and standardize them. 3) Output a downloadable clean CSV.',
      officialUrl: 'https://chatgpt.com'
    },
    runnerUp: {
      name: 'Claude 3.5 Sonnet Artifacts',
      maker: 'Anthropic',
      plan: 'Free tier / Pro $20/mo',
      reasonToChoose: 'Best if you want to turn a small dataset into an interactive visual dashboard in your browser.',
      officialUrl: 'https://claude.ai'
    },
    notForAi: 'Never upload unencrypted banking login keys or personal credit card numbers.'
  },
  {
    id: 'ideas',
    label: '💡 Brainstorm project ideas',
    shortLabel: 'Fresh Ideas',
    winner: {
      name: 'Claude 3.5 Sonnet',
      maker: 'Anthropic',
      plan: 'Free tier / Pro $20/mo',
      badge: 'Unconventional Angles',
      oneLiner: 'Excels at thinking outside predictable tropes and providing practical, grounded angles.',
      proofTitle: 'The 30-Second Proof',
      proofStory: 'We asked for 3 micro-business ideas that cost under $500 to start. Instead of generic advice like "do dropshipping", it suggested local mobile car detailing with a 3-step weekend customer acquisition tactic.',
      starterPrompt: 'Act as a pragmatic startup mentor. I have $500 and 10 hours a week. Give me 3 distinct service ideas with realistic first-week marketing steps.',
      officialUrl: 'https://claude.ai'
    },
    runnerUp: {
      name: 'ChatGPT (Voice Mode)',
      maker: 'OpenAI',
      plan: 'Free tier (App)',
      reasonToChoose: 'Best if you want to talk out loud on a walk and brainstorm conversationally like a podcast.',
      officialUrl: 'https://chatgpt.com'
    },
    notForAi: 'AI cannot validate customer willingness to pay; you still have to talk to real humans.'
  }
]

// Category config: label -> what 'category' field value it matches
const CATEGORIES = [
  { id: 'All', label: 'All Tasks' },
  { id: 'Create', label: 'Create' },
  { id: 'Build', label: 'Build' },
  { id: 'Work', label: 'Work' },
  { id: 'Learn', label: 'Learn' },
  { id: 'Everyday', label: 'Everyday' },
]

const DIFFICULTY_COLORS: Record<string, string> = {
  Beginner: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  'Needs practice': 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  Technical: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
}

const STATUS_COLORS: Record<string, string> = {
  active: 'text-emerald-600 dark:text-emerald-400',
  changing: 'text-amber-500 dark:text-amber-400',
  discontinued: 'text-red-500 dark:text-red-400',
}

interface EnrichedToolRec extends ToolRecommendation {
  status?: string
  difficulty?: string
  time_to_first_result?: string
  free_option?: string
  paid_option?: string | null
  account_needed?: string
  best_for?: string
  not_good_for?: string
  privacy_summary?: string
  example_output?: string
}

export const ToolsScreen: React.FC = () => {
  const { persona } = useAppStore()
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [selectedTaskId, setSelectedTaskId] = useState<string>('task-summarize-doc')
  const [recommendations, setRecommendations] = useState<ToolRecommendResponse | null>(null)
  const [loadingTasks, setLoadingTasks] = useState(true)
  const [loadingRecs, setLoadingRecs] = useState(false)
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null)
  const [isHowWeChooseOpen, setIsHowWeChooseOpen] = useState(false)

  // Workbench Mode: Finder vs Upgrader
  const [workbenchMode, setWorkbenchMode] = useState<'finder' | 'upgrader'>('finder')

  // Prompt Upgrader State
  const [rawPrompt, setRawPrompt] = useState(PROMPT_STARTERS[0].raw)
  const [upgradedRole, setUpgradedRole] = useState(PROMPT_STARTERS[0].role)
  const [upgradedContext, setUpgradedContext] = useState(PROMPT_STARTERS[0].context)
  const [upgradedFormat, setUpgradedFormat] = useState(PROMPT_STARTERS[0].format)
  const [upgraderCopied, setUpgraderCopied] = useState(false)
  const [activeStarterId, setActiveStarterId] = useState<string | null>(PROMPT_STARTERS[0].id)

  // Quick Matchmaker State
  const [quickGoal, setQuickGoal] = useState<'writing' | 'research' | 'files' | 'coding'>('writing')
  const [quickBudget, setQuickBudget] = useState<'free' | 'paid'>('free')

  // Concept C State: Dilemma Scenarios
  const [activeDilemmaId, setActiveDilemmaId] = useState('files')
  const [showRunnerUp, setShowRunnerUp] = useState(false)
  const [dilemmaPromptCopied, setDilemmaPromptCopied] = useState(false)
  const [showAllTasksDrawer, setShowAllTasksDrawer] = useState(false)

  const copyDilemmaPrompt = (text: string) => {
    navigator.clipboard.writeText(text)
    setDilemmaPromptCopied(true)
    setTimeout(() => setDilemmaPromptCopied(false), 2000)
  }

  const currentDilemma = DILEMMA_SCENARIOS.find(s => s.id === activeDilemmaId) || DILEMMA_SCENARIOS[0]

  const handleSelectStarter = (starter: typeof PROMPT_STARTERS[0]) => {
    setActiveStarterId(starter.id)
    setRawPrompt(starter.raw)
    setUpgradedRole(starter.role)
    setUpgradedContext(starter.context)
    setUpgradedFormat(starter.format)
  }

  const handleCustomUpgrade = () => {
    if (!rawPrompt.trim()) return
    setActiveStarterId(null)
    setUpgradedRole('Act as a senior subject matter specialist and executive communication partner.')
    setUpgradedContext(`Objective: "${rawPrompt.trim()}". Focus on providing factual, high-clarity insights. Do not use generic filler phrases like "Certainly!" or "As an AI model". Verify steps step-by-step.`)
    setUpgradedFormat('Structure your answer with: 1) Executive Summary (2 sentences max), 2) Actionable Checklist or Draft, 3) 2 potential pitfalls to watch out for.')
  }

  const copyFullUpgradedPrompt = () => {
    const full = `${upgradedRole}\n\nContext & Objective:\n${upgradedContext}\n\nOutput Format:\n${upgradedFormat}`
    navigator.clipboard.writeText(full)
    setUpgraderCopied(true)
    setTimeout(() => setUpgraderCopied(false), 2000)
  }

  // Fetch tasks for the persona
  useEffect(() => {
    let isMounted = true
    setLoadingTasks(true)

    const url = searchQuery 
      ? `/tasks?persona=${persona}&search=${encodeURIComponent(searchQuery)}`
      : `/tasks?persona=${persona}`

    fetch(url)
      .then(r => r.json())
      .then(data => {
        if (!isMounted) return
        if (data && data.tasks) {
          setTasks(data.tasks)
          if (data.tasks.length > 0 && !data.tasks.some((t: TaskItem) => t.id === selectedTaskId)) {
            setSelectedTaskId(data.tasks[0].id)
          }
        }
        setLoadingTasks(false)
      })
      .catch(() => {
        if (isMounted) setLoadingTasks(false)
      })

    return () => { isMounted = false }
  }, [persona, searchQuery])

  // Fetch recommendations whenever selectedTaskId changes
  useEffect(() => {
    if (!selectedTaskId) return
    let isMounted = true
    setLoadingRecs(true)

    fetch(`/tools/recommend?task=${selectedTaskId}&persona=${persona}`)
      .then(r => r.json())
      .then(data => {
        if (!isMounted) return
        setRecommendations(data)
        setLoadingRecs(false)
      })
      .catch(() => {
        if (isMounted) setLoadingRecs(false)
      })

    return () => { isMounted = false }
  }, [selectedTaskId, persona])

  const copyStarterPrompt = (toolId: string, promptText: string) => {
    navigator.clipboard.writeText(promptText)
    setCopiedPromptId(toolId)
    setTimeout(() => setCopiedPromptId(null), 2000)
  }

  // Filter tasks by active category (after search)
  const filteredTasks = tasks.filter(t => {
    if (activeCategory === 'All') return true
    return t.category === activeCategory
  })

  return (
    <div className="max-w-[1120px] mx-auto px-4 sm:px-6 py-8 pb-28 md:pb-16 space-y-10">
      
      {/* 1. Header */}
      <section className="bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-6 sm:p-10 shadow-xs">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-soft)] text-[var(--accent-ink)] text-xs font-semibold uppercase tracking-wider mb-3">
            <Wrench className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>The AI Workbench</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-[var(--ink)] tracking-tight leading-[1.15] mb-3">
            {workbenchMode === 'finder' ? 'The right tool for your specific task.' : 'Upgrade your prompts for 10x better results.'}
          </h1>

          <p className="text-base sm:text-lg text-[var(--muted)] leading-relaxed mb-4">
            {workbenchMode === 'finder' 
              ? 'No sponsored rankings or affiliate links. Pick what you are trying to accomplish, and see honest recommendations with safe starter prompts.'
              : 'Stop getting generic or bland AI answers. Transform rough questions into high-performing prompts with clear role framing, context constraints, and output formats.'}
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => setIsHowWeChooseOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)] hover:text-[var(--accent-ink)] transition-colors min-h-[44px]"
            >
              <HelpCircle className="w-4 h-4" />
              <span>How we choose recommendations (Our Neutrality Guarantee)</span>
            </button>
          </div>
        </div>

        {/* Mode Selector Segmented Pill Bar */}
        <div className="mt-8 pt-6 border-t border-[var(--line)] flex items-center justify-start">
          <div className="inline-flex p-1.5 rounded-2xl bg-[var(--bg)] border border-[var(--line)] shadow-xs">
            <button
              onClick={() => setWorkbenchMode('finder')}
              className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all min-h-[44px] flex items-center gap-2 ${
                workbenchMode === 'finder'
                  ? 'bg-[var(--accent)] text-white shadow-xs'
                  : 'text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              <Wrench className="w-4 h-4" />
              <span>Find the Right Tool</span>
            </button>

            <button
              onClick={() => setWorkbenchMode('upgrader')}
              className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all min-h-[44px] flex items-center gap-2 ${
                workbenchMode === 'upgrader'
                  ? 'bg-[var(--accent)] text-white shadow-xs'
                  : 'text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Prompt Upgrader Studio</span>
            </button>
          </div>
        </div>
      </section>

      {/* VIEW 1: CONCEPT C - THE INTERACTIVE DILEMMA */}
      {workbenchMode === 'finder' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          
          {/* Top Dilemma Question & Tactile Scenario Pills */}
          <section className="bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-ink)] flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>Instant Decision Matchmaker</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[var(--ink)]">
                What do you want to get done right now?
              </h2>
              <p className="text-xs sm:text-sm text-[var(--muted)]">
                Tap your everyday chore. See the tested winner with zero marketing hype and real proof.
              </p>
            </div>

            {/* Tactile Pills Row */}
            <div className="flex flex-wrap gap-2 pt-2">
              {DILEMMA_SCENARIOS.map(scenario => {
                const isActive = activeDilemmaId === scenario.id
                return (
                  <button
                    key={scenario.id}
                    onClick={() => {
                      setActiveDilemmaId(scenario.id)
                      setShowRunnerUp(false)
                    }}
                    className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all min-h-[44px] flex items-center gap-2 border ${
                      isActive
                        ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-md -translate-y-0.5'
                        : 'bg-[var(--surface-hover)] border-[var(--line)] text-[var(--ink)] hover:border-[var(--accent)]'
                    }`}
                  >
                    <span>{scenario.label}</span>
                  </button>
                )
              })}
            </div>
          </section>

          {/* THE CHAMPION VERDICT CARD (Concept C) */}
          <section className="bg-[var(--surface)] border-2 border-[var(--accent)]/40 rounded-3xl p-6 sm:p-10 shadow-md space-y-8 relative overflow-hidden">
            {/* Soft decorative accent glow */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-[var(--accent-soft)] rounded-full blur-3xl pointer-events-none -mr-20 -mt-20 opacity-60" />

            {/* Winner Header Banner */}
            <div className="relative z-10 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>The Tested Winner · {currentDilemma.winner.badge}</span>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--muted)]">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>{currentDilemma.winner.maker}</span>
                  <span>&middot;</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent-ink)]">
                    {currentDilemma.winner.plan}
                  </span>
                </div>
              </div>

              <h3 className="text-3xl sm:text-4xl font-serif font-bold text-[var(--ink)] tracking-tight">
                {currentDilemma.winner.name}
              </h3>

              <p className="text-base sm:text-lg text-[var(--ink)] font-medium leading-relaxed max-w-3xl">
                "{currentDilemma.winner.oneLiner}"
              </p>
            </div>

            {/* The 30-Second Real Proof (Replaces boring spec boxes) */}
            <div className="relative z-10 p-5 sm:p-6 rounded-2xl bg-[var(--surface-hover)] border border-[var(--line)] space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--accent-ink)]">
                <Zap className="w-4 h-4 text-[var(--accent)]" />
                <span>{currentDilemma.winner.proofTitle}</span>
              </div>
              <p className="text-xs sm:text-sm text-[var(--ink)] leading-relaxed font-medium">
                {currentDilemma.winner.proofStory}
              </p>
            </div>

            {/* Safe Starter Prompt with Instant 1-Click Copy */}
            <div className="relative z-10 p-5 rounded-2xl bg-[var(--accent-soft)] border border-[var(--accent)]/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-ink)] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span>Safe Starter Prompt (Ready to paste)</span>
                </span>

                <button
                  onClick={() => copyDilemmaPrompt(currentDilemma.winner.starterPrompt)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent-ink)] hover:underline min-h-[36px] px-2.5 py-1 rounded-lg hover:bg-[var(--surface)] transition-all shadow-xs"
                >
                  {dilemmaPromptCopied ? (
                    <>
                      <CheckDraw size={14} strokeWidth={2.5} color="#059669" />
                      <span className="text-emerald-700 dark:text-emerald-300 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy prompt</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs sm:text-sm text-[var(--ink)] font-medium italic bg-[var(--surface)] p-3 rounded-xl border border-[var(--line)] leading-relaxed">
                "{currentDilemma.winner.starterPrompt}"
              </p>
            </div>

            {/* Primary Action Button & Runner-Up Toggle */}
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-[var(--line)]">
              <a
                href={currentDilemma.winner.officialUrl}
                target="_blank"
                rel="noreferrer"
                className="px-6 py-3.5 rounded-xl bg-[var(--accent)] text-white text-xs sm:text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 min-h-[46px] shadow-sm"
              >
                <span>Launch {currentDilemma.winner.name} Official Page</span>
                <ExternalLink className="w-4 h-4" />
              </a>

              <button
                onClick={() => setShowRunnerUp(!showRunnerUp)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--muted)] hover:text-[var(--ink)] transition-colors min-h-[44px]"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>
                  {showRunnerUp ? 'Hide runner-up' : `Prefer ${currentDilemma.runnerUp.name}? See why`}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showRunnerUp ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Runner-Up Slide-Down Note (Optional comparison without clutter) */}
            {showRunnerUp && (
              <div className="relative z-10 p-5 rounded-2xl bg-[var(--surface-hover)] border border-[var(--line)] space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                      Solid Runner-Up: {currentDilemma.runnerUp.name} ({currentDilemma.runnerUp.maker})
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-[var(--line)] text-[var(--muted)]">
                      {currentDilemma.runnerUp.plan}
                    </span>
                  </div>

                  <a
                    href={currentDilemma.runnerUp.officialUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-[var(--accent)] hover:underline inline-flex items-center gap-1"
                  >
                    <span>Visit site</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <p className="text-xs sm:text-sm text-[var(--ink)] leading-relaxed">
                  <strong className="text-[var(--ink)]">When to choose {currentDilemma.runnerUp.name}: </strong>
                  {currentDilemma.runnerUp.reasonToChoose}
                </p>
              </div>
            )}

            {/* When NOT to use AI */}
            <div className="relative z-10 p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>When NOT to use AI for this chore: </strong>
                {currentDilemma.notForAi}
              </div>
            </div>
          </section>

          {/* Granular Task Browser (Collapsible trigger for power users who want all 20 niche tasks) */}
          <div className="text-center pt-2">
            <button
              onClick={() => setShowAllTasksDrawer(!showAllTasksDrawer)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[var(--surface)] border border-[var(--line)] hover:border-[var(--accent)] text-xs font-semibold text-[var(--muted)] hover:text-[var(--ink)] transition-colors min-h-[44px]"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{showAllTasksDrawer ? 'Hide specialized 20+ niche jobs' : 'Looking for a specialized niche job? Browse all 20+ tasks'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAllTasksDrawer ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Collapsed Specific Task Directory */}
          {showAllTasksDrawer && (
            <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--line)] space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-serif font-bold text-lg text-[var(--ink)]">
                    All Specialized Jobs for {persona.replace('_', ' ')}s
                  </h3>
                  <p className="text-xs text-[var(--muted)]">
                    Pick any specialized workflow to see custom recommendations.
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search task..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[var(--bg)] border border-[var(--line)] text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--accent)] min-h-[38px]"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto p-1">
                {filteredTasks.map(t => {
                  const isSelected = selectedTaskId === t.id
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTaskId(t.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all min-h-[38px] flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-[var(--accent)] text-white font-semibold'
                          : 'bg-[var(--surface-hover)] border border-[var(--line)] text-[var(--ink)] hover:border-[var(--accent)]'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                      <span>{t.title}</span>
                    </button>
                  )
                })}
              </div>

              {/* Show Recommendations for selected task */}
              {recommendations && recommendations.recommendations.length > 0 && (
                <div className="pt-4 border-t border-[var(--line)] space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] block">
                    Recommendations for: "{recommendations.task_title}"
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(recommendations.recommendations as EnrichedToolRec[]).map(tool => (
                      <div key={tool.tool_id} className="p-4 rounded-2xl bg-[var(--surface-hover)] border border-[var(--line)] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-serif font-bold text-sm text-[var(--ink)]">{tool.name}</span>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent-ink)]">
                            {tool.badge}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--muted)] leading-relaxed">{tool.fit_reason}</p>
                        <a
                          href={tool.official_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)] hover:underline pt-1"
                        >
                          <span>Visit official site</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
      </div>
      )}

      {/* VIEW 2: PROMPT UPGRADER STUDIO */}
      {workbenchMode === 'upgrader' && (
        <section className="space-y-8 animate-in fade-in duration-300">
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-soft)] text-[var(--accent-ink)] text-xs font-semibold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>Interactive Studio</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[var(--ink)]">
                The Instant Prompt Upgrader
              </h2>
              <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed mt-1">
                Stop getting generic, robotic answers. AI performs 10x better when you give it a clear <strong>Role</strong>, <strong>Context constraints</strong>, and an <strong>Output format</strong>.
              </p>
            </div>

            {/* Quick Starters */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] block">
                Pick a common everyday scenario:
              </span>
              <div className="flex flex-wrap gap-2">
                {PROMPT_STARTERS.map(starter => {
                  const isSelected = activeStarterId === starter.id
                  return (
                    <button
                      key={starter.id}
                      onClick={() => handleSelectStarter(starter)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all min-h-[40px] flex items-center gap-1.5 border ${
                        isSelected
                          ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-xs font-semibold'
                          : 'bg-[var(--surface-hover)] border-[var(--line)] text-[var(--ink)] hover:border-[var(--accent)]'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{starter.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Input Box */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] flex items-center justify-between">
                <span>Your Raw Idea or Question:</span>
                <span className="text-[11px] font-normal text-[var(--muted)]">Type anything rough — no need to be formal</span>
              </label>
              <textarea
                value={rawPrompt}
                onChange={(e) => {
                  setRawPrompt(e.target.value)
                  setActiveStarterId(null)
                }}
                rows={3}
                placeholder="e.g. Write an email asking my boss for more time on the client report..."
                className="w-full p-3.5 rounded-2xl bg-[var(--bg)] border border-[var(--line)] text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--accent)] transition-colors leading-relaxed"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleCustomUpgrade}
                  className="px-5 py-2.5 rounded-xl bg-[var(--accent)] text-white text-xs sm:text-sm font-semibold hover:opacity-90 transition-all flex items-center gap-2 shadow-xs min-h-[44px]"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>✨ Upgrade My Prompt Now</span>
                </button>
              </div>
            </div>
          </div>

          {/* Upgraded 3-Part Output Card */}
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--line)]">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>High-Performing 3-Part Prompt Ready</span>
                </span>
                <h3 className="font-serif font-bold text-xl sm:text-2xl text-[var(--ink)]">
                  Copy and paste this into ChatGPT, Claude, or Gemini
                </h3>
              </div>

              <button
                onClick={copyFullUpgradedPrompt}
                className="px-5 py-2.5 rounded-xl bg-[var(--accent)] text-white text-xs sm:text-sm font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-sm min-h-[44px] shrink-0"
              >
                {upgraderCopied ? (
                  <>
                    <CheckDraw size={16} strokeWidth={2.5} color="#ffffff" />
                    <span>Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Full Upgraded Prompt</span>
                  </>
                )}
              </button>
            </div>

            {/* The 3 Layers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Layer 1: Role */}
              <div className="p-4 rounded-2xl bg-[var(--surface-hover)] border border-[var(--line)] space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[var(--accent-soft)] text-[var(--accent-ink)] text-xs font-bold flex items-center justify-center">
                    1
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-ink)]">
                    Role & Voice
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[var(--ink)] leading-relaxed font-medium">
                  "{upgradedRole}"
                </p>
                <span className="text-[11px] text-[var(--muted)] block">
                  Tells the AI which mental persona and vocabulary to adopt.
                </span>
              </div>

              {/* Layer 2: Context */}
              <div className="p-4 rounded-2xl bg-[var(--surface-hover)] border border-[var(--line)] space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[var(--accent-soft)] text-[var(--accent-ink)] text-xs font-bold flex items-center justify-center">
                    2
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-ink)]">
                    Context & Guardrails
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[var(--ink)] leading-relaxed font-medium">
                  "{upgradedContext}"
                </p>
                <span className="text-[11px] text-[var(--muted)] block">
                  Prevents it from guessing or writing defensive/generic fluff.
                </span>
              </div>

              {/* Layer 3: Format */}
              <div className="p-4 rounded-2xl bg-[var(--surface-hover)] border border-[var(--line)] space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[var(--accent-soft)] text-[var(--accent-ink)] text-xs font-bold flex items-center justify-center">
                    3
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-ink)]">
                    Format & Length
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[var(--ink)] leading-relaxed font-medium">
                  "{upgradedFormat}"
                </p>
                <span className="text-[11px] text-[var(--muted)] block">
                  Guarantees you get a tidy output ready to paste into your work.
                </span>
              </div>
            </div>

            {/* Why This Works Insight Box */}
            <div className="p-4 rounded-2xl bg-[var(--accent-soft)] border border-[var(--accent)]/20 flex items-start gap-3 text-xs sm:text-sm text-[var(--accent-ink)]">
              <Lightbulb className="w-5 h-5 text-[var(--accent)] shrink-0 mt-0.5" />
              <div>
                <strong>Why this works so well: </strong>
                AI models have studied billions of internet discussions. When you say <em>"write an email"</em>, it defaults to the average bland internet email. When you give it a specific role and constraints, it searches a much narrower, higher-quality cluster of human knowledge.
              </div>
            </div>
          </div>
        </section>
      )}

      {/* "How We Choose" Neutrality Modal */}
      {isHowWeChooseOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsHowWeChooseOpen(false)}
        >
          <div 
            className="w-full max-w-lg bg-[var(--surface)] text-[var(--ink)] rounded-3xl p-6 sm:p-8 shadow-2xl border border-[var(--line)] relative space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setIsHowWeChooseOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-[var(--surface-hover)] text-[var(--muted)] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <span className="text-xs uppercase font-bold tracking-wider text-[var(--muted)]">
                Our Neutrality Guarantee
              </span>
            </div>

            <h3 className="text-2xl font-serif font-bold text-[var(--ink)]">
              How We Choose Recommendations
            </h3>

            <div className="space-y-3 text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
              <p>
                <strong className="text-[var(--ink)]">Zero Affiliate Links: </strong>
                We never earn commissions or kickbacks when you click a tool link. Every recommendation is chosen purely because it works well.
              </p>
              <p>
                <strong className="text-[var(--ink)]">Criteria-Based Ranking: </strong>
                Tools are evaluated across 5 objective pillars: fit for the job, true cost transparency, ease for beginners, privacy terms, and multilingual support.
              </p>
              <p>
                <strong className="text-[var(--ink)]">Free & Open Options Included: </strong>
                We always highlight free, lightweight, or open-source solutions (like NotebookLM or Llama) whenever they fit your needs as well as paid subscriptions.
              </p>
              <p>
                <strong className="text-[var(--ink)]">Freshness Tracking: </strong>
                If a pricing claim has not been re-verified within 30 days, we hide the numbers and tell you to check the official site directly.
              </p>
              <p>
                <strong className="text-[var(--ink)]">Discontinued Tools Never Shown: </strong>
                Any tool marked as discontinued or acquired is permanently removed from recommendations so you never click a dead link.
              </p>
            </div>

            <div className="pt-2 text-center">
              <button
                onClick={() => setIsHowWeChooseOpen(false)}
                className="w-full py-3 px-4 rounded-xl bg-[var(--surface-hover)] text-[var(--ink)] font-semibold text-xs hover:bg-[var(--line)] transition-colors min-h-[44px]"
              >
                Close & Return
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
