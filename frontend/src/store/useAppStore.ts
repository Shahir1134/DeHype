import { create } from 'zustand'
import { User } from '@supabase/supabase-js'
import { PersonaKey, GlossaryEntry } from '../types'
import { getSystemReducedMotion, isLowEndDevice } from '../motion'
import { logAnalyticsEvent } from '../analytics'

interface AudioPlayerState {
  isPlaying: boolean
  title: string
  sentences: string[]
  currentSentenceIdx: number
  speed: number
}

export interface ToastItem {
  id: string
  message: string
  actionLabel?: string
  onAction?: () => void
}

interface AppState {
  persona: PersonaKey
  hasOnboarded: boolean
  activeTab: 'today' | 'catchup' | 'tools' | 'learn' | 'ask'
  darkMode: boolean
  textSize: 'sm' | 'base' | 'lg'
  reduceMotion: boolean
  isPersonaModalOpen: boolean
  isAskOpen: boolean
  lastSeen: string | null
  catchupBucket: string
  audio: AudioPlayerState
  glossary: Record<string, GlossaryEntry>
  selectedGlossaryTerm: GlossaryEntry | null
  
  // Retention & Story Interaction state
  savedStoryIds: string[]
  readStoryIds: string[]
  hiddenStoryIds: string[]
  toasts: ToastItem[]
  weeklyVisits: number[] // 0=Mon, 1=Tue, ..., 6=Sun

  // Learn section state
  globalLearnDepth: 'brand_new' | 'basics' | 'technical'
  conceptDepthOverrides: Record<string, 'brand_new' | 'basics' | 'technical'>
  activeConceptId: string | null
  completedConcepts: Record<string, { completedAt: string; quizScore: number; explainBack: string }>
  askPrefill: string

  // Supabase Auth state
  user: User | null
  setUser: (user: User | null) => void
  isGuest: boolean
  setIsGuest: (isGuest: boolean) => void

  setPersona: (persona: PersonaKey) => void
  completeOnboarding: (persona: PersonaKey) => void
  setActiveTab: (tab: 'today' | 'catchup' | 'tools' | 'learn' | 'ask') => void
  toggleDarkMode: () => void
  cycleTextSize: () => void
  toggleReduceMotion: () => void
  setIsPersonaModalOpen: (open: boolean) => void
  setIsAskOpen: (open: boolean) => void
  setCatchupBucket: (bucket: string) => void
  setSelectedGlossaryTerm: (term: GlossaryEntry | null) => void
  recordVisit: () => void

  toggleSaveStory: (id: string) => boolean
  markStoryRead: (id: string) => void
  hideStory: (id: string) => void
  undoHideStory: (id: string) => void
  addToast: (message: string, actionLabel?: string, onAction?: () => void) => string
  removeToast: (id: string) => void

  setGlobalLearnDepth: (depth: 'brand_new' | 'basics' | 'technical') => void
  setConceptDepth: (conceptId: string, depth: 'brand_new' | 'basics' | 'technical') => void
  setActiveConceptId: (id: string | null) => void
  markConceptCompleted: (conceptId: string, quizScore: number, explainBack: string) => void
  openAskWithPrefill: (prefill: string) => void

  startBriefing: (title: string, text: string) => void
  pauseBriefing: () => void
  resumeBriefing: () => void
  stopBriefing: () => void
  setBriefingSpeed: (speed: number) => void
  nextBriefingSentence: () => void
  prevBriefingSentence: () => void
  setBriefingSentenceIdx: (idx: number) => void
}

const INITIAL_PERSONA: PersonaKey = (localStorage.getItem('ai_news_persona') as PersonaKey) || 'student'
const INITIAL_ONBOARDED = localStorage.getItem('ai_news_onboarded') === 'true'
const INITIAL_DARK = localStorage.getItem('ai_news_dark') === 'true'
const INITIAL_TEXT_SIZE = (localStorage.getItem('ai_news_text_size') as 'sm' | 'base' | 'lg') || 'base'
const INITIAL_LAST_SEEN = localStorage.getItem('ai_news_last_seen')
const INITIAL_REDUCE_MOTION = localStorage.getItem('ai_news_reduce_motion') !== null
  ? localStorage.getItem('ai_news_reduce_motion') === 'true'
  : (getSystemReducedMotion() || isLowEndDevice())
const INITIAL_SAVED = JSON.parse(localStorage.getItem('ai_news_saved_stories') || '[]')
const INITIAL_READ = JSON.parse(localStorage.getItem('ai_news_read_stories') || '[]')
const INITIAL_WEEKLY = JSON.parse(localStorage.getItem('ai_news_weekly_visits') || '[]')
const INITIAL_LEARN_DEPTH = (localStorage.getItem('ai_news_learn_depth') as 'brand_new' | 'basics' | 'technical') || 'brand_new'
const INITIAL_COMPLETED_CONCEPTS = JSON.parse(localStorage.getItem('ai_news_completed_concepts') || '{}')

// Sync initial HTML classes
if (typeof document !== 'undefined') {
  document.documentElement.setAttribute('data-persona', INITIAL_PERSONA)
  if (INITIAL_DARK) document.documentElement.classList.add('dark')
  document.documentElement.classList.add(`text-size-${INITIAL_TEXT_SIZE}`)
}

export const useAppStore = create<AppState>((set, get) => ({
  persona: INITIAL_PERSONA,
  hasOnboarded: INITIAL_ONBOARDED,
  activeTab: 'today',
  darkMode: INITIAL_DARK,
  textSize: INITIAL_TEXT_SIZE,
  reduceMotion: INITIAL_REDUCE_MOTION,
  isPersonaModalOpen: false,
  isAskOpen: false,
  lastSeen: INITIAL_LAST_SEEN,
  catchupBucket: '1_week',
  selectedGlossaryTerm: null,
  savedStoryIds: INITIAL_SAVED,
  readStoryIds: INITIAL_READ,
  hiddenStoryIds: [],
  toasts: [],
  weeklyVisits: INITIAL_WEEKLY,
  globalLearnDepth: INITIAL_LEARN_DEPTH,
  conceptDepthOverrides: {},
  activeConceptId: null,
  completedConcepts: INITIAL_COMPLETED_CONCEPTS,
  askPrefill: '',
  user: null,
  setUser: (user) => set({ user }),
  isGuest: false,
  setIsGuest: (isGuest) => set({ isGuest }),

  audio: {
    isPlaying: false,
    title: '',
    sentences: [],
    currentSentenceIdx: 0,
    speed: 1.0,
  },

  glossary: {
    'transformer': {
      term: 'Transformer',
      simple_definition: 'A pattern that lets computers read sentences looking at every word at once, not one by one.',
      analogy: 'Like scanning an entire paragraph in a glance instead of moving your finger word by word.'
    },
    'rag': {
      term: 'RAG (Retrieval-Augmented Generation)',
      simple_definition: 'Giving an AI model an open textbook before it answers your specific question.',
      analogy: 'Instead of memorizing every fact, the AI looks up the right chapter in your internal notes.'
    },
    'mcp': {
      term: 'MCP (Model Context Protocol)',
      simple_definition: 'A universal USB-C cable plug that connects AI to your files, tools, and apps safely.',
      analogy: 'Just like USB-C plugs into mice, keyboards, and drives, MCP lets AI talk to any tool uniformly.'
    },
    'multi-agent': {
      term: 'Multi-Agent System',
      simple_definition: 'A team of focused AI helpers collaborating together on one big job.',
      analogy: 'Like a newsroom: one reporter drafts, an editor fact-checks, and a designer formats.'
    },
    'llm eval': {
      term: 'LLM Evaluation & Benchmark',
      simple_definition: 'Standardized tests to check whether an AI is accurate, safe, and helpful.',
      analogy: 'Like an SAT or driver\'s exam for AI models before putting them in front of real customers.'
    },
    'context window': {
      term: 'Context Window',
      simple_definition: 'The amount of text an AI can hold in its working memory during one chat.',
      analogy: 'The size of the desk the AI works on: bigger desk means it can reference longer books.'
    },
    'latency': {
      term: 'Latency',
      simple_definition: 'The delay between when you send a prompt and when the AI starts typing back.',
      analogy: 'How long you pause on a phone call waiting for the other person to respond.'
    }
  },

  setPersona: (persona: PersonaKey) => {
    localStorage.setItem('ai_news_persona', persona)
    document.documentElement.setAttribute('data-persona', persona)
    set({ persona, isPersonaModalOpen: false })
  },

  completeOnboarding: (persona: PersonaKey) => {
    localStorage.setItem('ai_news_onboarded', 'true')
    localStorage.setItem('ai_news_persona', persona)
    document.documentElement.setAttribute('data-persona', persona)
    set({ hasOnboarded: true, persona })
  },

  setActiveTab: (tab) => {
    window.location.hash = tab
    set({ activeTab: tab })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  },

  toggleDarkMode: () => {
    const nextDark = !get().darkMode
    localStorage.setItem('ai_news_dark', String(nextDark))
    if (nextDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    set({ darkMode: nextDark })
  },

  cycleTextSize: () => {
    const order: ('sm' | 'base' | 'lg')[] = ['sm', 'base', 'lg']
    const next = order[(order.indexOf(get().textSize) + 1) % order.length]
    localStorage.setItem('ai_news_text_size', next)
    document.documentElement.classList.remove('text-size-sm', 'text-size-base', 'text-size-lg')
    document.documentElement.classList.add(`text-size-${next}`)
    set({ textSize: next })
  },

  toggleReduceMotion: () => {
    const nextVal = !get().reduceMotion
    localStorage.setItem('ai_news_reduce_motion', String(nextVal))
    logAnalyticsEvent('reduce_motion_toggled', { enabled: nextVal })
    set({ reduceMotion: nextVal })
  },

  setIsPersonaModalOpen: (open) => set({ isPersonaModalOpen: open }),
  setIsAskOpen: (open) => set({ isAskOpen: open }),
  setCatchupBucket: (bucket) => set({ catchupBucket: bucket }),
  setSelectedGlossaryTerm: (term) => set({ selectedGlossaryTerm: term }),

  toggleSaveStory: (id: string) => {
    const current = get().savedStoryIds
    const exists = current.includes(id)
    const updated = exists ? current.filter(x => x !== id) : [...current, id]
    localStorage.setItem('ai_news_saved_stories', JSON.stringify(updated))
    set({ savedStoryIds: updated })
    if (!exists) {
      logAnalyticsEvent('story_saved', { storyId: id })
    }
    return !exists
  },

  markStoryRead: (id: string) => {
    const current = get().readStoryIds
    if (!current.includes(id)) {
      const updated = [...current, id]
      localStorage.setItem('ai_news_read_stories', JSON.stringify(updated))
      set({ readStoryIds: updated })
      logAnalyticsEvent('story_opened', { storyId: id })
    }
  },

  hideStory: (id: string) => {
    set(state => ({ hiddenStoryIds: [...state.hiddenStoryIds, id] }))
  },

  undoHideStory: (id: string) => {
    set(state => ({ hiddenStoryIds: state.hiddenStoryIds.filter(x => x !== id) }))
  },

  addToast: (message: string, actionLabel?: string, onAction?: () => void) => {
    const toastId = 'toast-' + Math.random().toString(36).substring(2, 9)
    const newToast: ToastItem = { id: toastId, message, actionLabel, onAction }
    set(state => ({ toasts: [...state.toasts, newToast] }))
    // Auto dismiss after 4s (or 5s if undo)
    const timeout = actionLabel ? 5000 : 3500
    setTimeout(() => {
      get().removeToast(toastId)
    }, timeout)
    return toastId
  },

  removeToast: (id: string) => {
    set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }))
  },

  setGlobalLearnDepth: (depth) => {
    localStorage.setItem('ai_news_learn_depth', depth)
    set({ globalLearnDepth: depth })
  },
  setConceptDepth: (conceptId, depth) => {
    set(state => ({
      conceptDepthOverrides: {
        ...state.conceptDepthOverrides,
        [conceptId]: depth
      }
    }))
  },
  setActiveConceptId: (id) => set({ activeConceptId: id }),
  markConceptCompleted: (conceptId, quizScore, explainBack) => {
    const updated = {
      ...get().completedConcepts,
      [conceptId]: {
        completedAt: new Date().toISOString(),
        quizScore,
        explainBack
      }
    }
    localStorage.setItem('ai_news_completed_concepts', JSON.stringify(updated))
    set({ completedConcepts: updated })
  },
  openAskWithPrefill: (prefill) => set({ isAskOpen: true, askPrefill: prefill }),

  recordVisit: () => {
    const nowIso = new Date().toISOString()
    localStorage.setItem('ai_news_last_seen', nowIso)
    
    // Record day of week (0=Mon .. 6=Sun)
    const jsDay = new Date().getDay() // 0=Sun, 1=Mon, ..., 6=Sat
    const monZeroDay = (jsDay + 6) % 7 // 0=Mon, 6=Sun
    const visits = Array.from(new Set([...get().weeklyVisits, monZeroDay]))
    localStorage.setItem('ai_news_weekly_visits', JSON.stringify(visits))

    set({ lastSeen: nowIso, weeklyVisits: visits })
  },

  startBriefing: (title: string, text: string) => {
    const rawSentences = text.split(/(?<=[.?!])\s+/).filter(s => s.trim().length > 0)
    const sentences = rawSentences.length > 0 ? rawSentences : [text]
    logAnalyticsEvent('listen_start', { title })
    set({
      audio: {
        isPlaying: true,
        title,
        sentences,
        currentSentenceIdx: 0,
        speed: 1.0,
      }
    })
  },

  pauseBriefing: () => set(state => ({ audio: { ...state.audio, isPlaying: false } })),
  resumeBriefing: () => set(state => ({ audio: { ...state.audio, isPlaying: true } })),
  stopBriefing: () => set(state => ({ audio: { ...state.audio, isPlaying: false, currentSentenceIdx: 0, sentences: [] } })),
  setBriefingSpeed: (speed: number) => set(state => ({ audio: { ...state.audio, speed } })),
  nextBriefingSentence: () => set(state => {
    const nextIdx = state.audio.currentSentenceIdx + 1
    if (nextIdx >= state.audio.sentences.length) {
      return { audio: { ...state.audio, isPlaying: false, currentSentenceIdx: 0 } }
    }
    return { audio: { ...state.audio, currentSentenceIdx: nextIdx } }
  }),
  prevBriefingSentence: () => set(state => {
    const prevIdx = Math.max(0, state.audio.currentSentenceIdx - 1)
    return { audio: { ...state.audio, currentSentenceIdx: prevIdx } }
  }),
  setBriefingSentenceIdx: (idx: number) => set(state => {
    const safeIdx = Math.max(0, Math.min(idx, Math.max(0, state.audio.sentences.length - 1)))
    return { audio: { ...state.audio, currentSentenceIdx: safeIdx } }
  })
}))
