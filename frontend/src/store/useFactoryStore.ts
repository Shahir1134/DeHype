import { create } from 'zustand'

export type SourceType = 'books' | 'forums' | 'code' | 'ads' | 'spam' | 'social'
export type OrbAction = 'keep' | 'fix' | 'bin'
export type RuleId = 
  | 'honest' 
  | 'uncertainty' 
  | 'no-harm' 
  | 'no-politics' 
  | 'helpful' 
  | 'verify' 
  | 'focused'
  // Bad/toxic rules
  | 'always-argue'
  | 'flatter-user'
  | 'never-admit-wrong'
  | 'maximize-engagement'

export type QuestionType = 'easy' | 'tricky' | 'sensitive'
export type Archetype = 'craftsman' | 'corporate-coward' | 'reddit-brain' | 'parrot' | 'toxic-menace'
export type GameDecision = 'ship' | 'fix' | null

export interface SourceCounts {
  books: number
  forums: number
  code: number
  ads: number
  spam: number
  social: number
}

interface FactoryState {
  // Navigation
  currentStage: number
  stageComplete: boolean[]
  gameComplete: boolean
  quickMode: boolean
  isFullScreen: boolean

  // Three meters (0-100)
  dataQuality: number
  generalization: number
  alignment: number

  // Bad choices tracking
  toxicRuleCount: number
  junkKeptCount: number

  // Stage 1
  sourceCounts: SourceCounts
  balanceMeter: number

  // Stage 2
  orbsKept: number
  orbsFixed: number
  orbsBinned: number
  quickSwept: boolean

  // Stage 3
  batchesFed: number
  loopCount: number

  // Stage 4
  rulesApplied: RuleId[]

  // Stage 5
  questionsAnswered: QuestionType[]

  // Stage 6
  decision: GameDecision
  archetype: Archetype | null

  // Actions
  addSource: (type: SourceType) => void
  removeSource: (type: SourceType) => void
  sortOrb: (action: OrbAction, isBadOrb?: boolean) => void
  quickSweep: () => void
  feedBatch: () => void
  repeatBatch: () => void
  applyRule: (rule: RuleId) => void
  removeRule: (rule: RuleId) => void
  answerQuestion: (qId: QuestionType) => void
  makeDecision: (d: 'ship' | 'fix') => void
  advanceStage: () => void
  resetGame: () => void
  setQuickMode: (val: boolean) => void
  setIsFullScreen: (val: boolean) => void
}

function computeBalance(counts: SourceCounts): number {
  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  if (total === 0) return 50
  const max = Math.max(...Object.values(counts))
  return Math.round(100 - ((max / total) * 100 - (100 / 6)))
}

function computeDataQuality(
  counts: SourceCounts, 
  balance: number, 
  orbsKept: number, 
  orbsBinned: number, 
  quickSwept: boolean,
  junkKept: number
): number {
  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  if (total === 0) return 50

  let sourceScore = 0
  sourceScore += counts.books * 8
  sourceScore += counts.code * 6
  sourceScore += counts.forums * 2
  sourceScore += counts.social * 1
  sourceScore += counts.ads * -8
  sourceScore += counts.spam * -12

  const sourceBase = Math.max(0, Math.min(100, 50 + (sourceScore / Math.max(total, 1)) * 5))
  const balanceBonus = balance * 0.15
  const cleaningBonus = orbsKept * 1.0 - orbsBinned * 0.5
  const junkPenalty = junkKept * -8
  const sweepPenalty = quickSwept ? -20 : 0

  return Math.max(0, Math.min(100, Math.round(sourceBase + balanceBonus + cleaningBonus + junkPenalty + sweepPenalty)))
}

function computeGeneralization(batchesFed: number, loopCount: number): number {
  const baseFromBatches = Math.min(80, batchesFed * 15)
  const loopPenalty = loopCount > 2 ? (loopCount - 2) * 15 : 0
  return Math.max(0, Math.min(100, Math.round(50 + baseFromBatches - loopPenalty)))
}

const BAD_RULES: RuleId[] = ['always-argue', 'flatter-user', 'never-admit-wrong', 'maximize-engagement']

function computeAlignment(rules: RuleId[]): number {
  let goodCount = 0
  let badCount = 0

  rules.forEach(r => {
    if (BAD_RULES.includes(r)) badCount++
    else goodCount++
  })

  // Bad rules severely drop alignment and make model chaotic/toxic
  let score = 30 + goodCount * 14 - badCount * 25
  if (goodCount >= 5 && badCount === 0) {
    // Too many good rules = overly corporate/timid
    score = 80 + (goodCount - 4) * 5
  }
  return Math.max(5, Math.min(100, score))
}

function computeArchetype(
  dataQuality: number, 
  generalization: number, 
  alignment: number,
  toxicRuleCount: number
): Archetype {
  if (toxicRuleCount >= 2 || alignment < 25) return 'toxic-menace'
  if (alignment > 75) return 'corporate-coward'
  if (dataQuality < 35) return 'reddit-brain'
  if (generalization < 30) return 'parrot'
  return 'craftsman'
}

const initialState = {
  currentStage: 0,
  stageComplete: [false, false, false, false, false, false],
  gameComplete: false,
  quickMode: false,
  isFullScreen: false,
  dataQuality: 50,
  generalization: 50,
  alignment: 40,
  toxicRuleCount: 0,
  junkKeptCount: 0,
  sourceCounts: { books: 0, forums: 0, code: 0, ads: 0, spam: 0, social: 0 },
  balanceMeter: 50,
  orbsKept: 0,
  orbsFixed: 0,
  orbsBinned: 0,
  quickSwept: false,
  batchesFed: 0,
  loopCount: 0,
  rulesApplied: [] as RuleId[],
  questionsAnswered: [] as QuestionType[],
  decision: null as GameDecision,
  archetype: null as Archetype | null,
}

export const useFactoryStore = create<FactoryState>((set, get) => ({
  ...initialState,

  addSource: (type) => {
    const counts = { ...get().sourceCounts, [type]: get().sourceCounts[type] + 1 }
    const balance = computeBalance(counts)
    const dq = computeDataQuality(counts, balance, get().orbsKept, get().orbsBinned, get().quickSwept, get().junkKeptCount)
    set({ sourceCounts: counts, balanceMeter: balance, dataQuality: dq })
  },

  removeSource: (type) => {
    const current = get().sourceCounts[type]
    if (current <= 0) return
    const counts = { ...get().sourceCounts, [type]: current - 1 }
    const balance = computeBalance(counts)
    const dq = computeDataQuality(counts, balance, get().orbsKept, get().orbsBinned, get().quickSwept, get().junkKeptCount)
    set({ sourceCounts: counts, balanceMeter: balance, dataQuality: dq })
  },

  sortOrb: (action, isBadOrb = false) => {
    const updates: Partial<FactoryState> = {}
    let newJunkKept = get().junkKeptCount
    if (action === 'keep') {
      updates.orbsKept = get().orbsKept + 1
      if (isBadOrb) {
        newJunkKept += 1
        updates.junkKeptCount = newJunkKept
      }
    }
    if (action === 'fix') updates.orbsFixed = get().orbsFixed + 1
    if (action === 'bin') updates.orbsBinned = get().orbsBinned + 1

    const { sourceCounts, balanceMeter, quickSwept } = get()
    const kept = updates.orbsKept ?? get().orbsKept
    const binned = updates.orbsBinned ?? get().orbsBinned
    updates.dataQuality = computeDataQuality(sourceCounts, balanceMeter, kept, binned, quickSwept, newJunkKept)
    set(updates)
  },

  quickSweep: () => {
    const { sourceCounts, balanceMeter } = get()
    const newJunkKept = get().junkKeptCount + 4
    const dq = computeDataQuality(sourceCounts, balanceMeter, 10, 7, true, newJunkKept)
    set({ quickSwept: true, orbsKept: 10, orbsFixed: 3, orbsBinned: 7, junkKeptCount: newJunkKept, dataQuality: dq })
  },

  feedBatch: () => {
    const batches = get().batchesFed + 1
    const loops = get().loopCount
    const gen = computeGeneralization(batches, loops)
    set({ batchesFed: batches, generalization: gen })
  },

  repeatBatch: () => {
    const loops = get().loopCount + 1
    const batches = get().batchesFed
    const gen = computeGeneralization(batches, loops)
    set({ loopCount: loops, generalization: gen })
  },

  applyRule: (rule) => {
    if (get().rulesApplied.includes(rule)) return
    const rules = [...get().rulesApplied, rule]
    const toxicCount = rules.filter(r => BAD_RULES.includes(r)).length
    set({ 
      rulesApplied: rules, 
      toxicRuleCount: toxicCount,
      alignment: computeAlignment(rules) 
    })
  },

  removeRule: (rule) => {
    const rules = get().rulesApplied.filter(r => r !== rule)
    const toxicCount = rules.filter(r => BAD_RULES.includes(r)).length
    set({ 
      rulesApplied: rules, 
      toxicRuleCount: toxicCount,
      alignment: computeAlignment(rules) 
    })
  },

  answerQuestion: (qId) => {
    if (get().questionsAnswered.includes(qId)) return
    set({ questionsAnswered: [...get().questionsAnswered, qId] })
  },

  makeDecision: (d) => {
    const { dataQuality, generalization, alignment, toxicRuleCount } = get()
    const archetype = computeArchetype(dataQuality, generalization, alignment, toxicRuleCount)
    set({ decision: d, archetype, gameComplete: d === 'ship' })
  },

  advanceStage: () => {
    const stage = get().currentStage
    const stageComplete = [...get().stageComplete]
    stageComplete[stage] = true
    const next = get().quickMode && stage === 0 ? 2 : stage + 1
    set({ currentStage: Math.min(5, next), stageComplete })
  },

  resetGame: () => set({ ...initialState, isFullScreen: get().isFullScreen }),

  setQuickMode: (val) => set({ quickMode: val }),

  setIsFullScreen: (val) => set({ isFullScreen: val }),
}))
