import React, { useState, useEffect, useMemo, useRef } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../store/useAppStore'
import { Story, PersonaInfo } from '../types'
import {
  Play,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Check,
  Lightbulb,
  Clock,
  Volume2,
  Copy,
  RotateCw,
  Bookmark,
  EyeOff,
  Compass,
  Calendar,
  CheckCircle2
} from 'lucide-react'
import { duration, ease, spring, press, hover } from '../motion'
import {
  Reveal,
  Stagger,
  SlidingSegmented,
  ProgressRing,
  AnimatedNumber,
  Dots,
  ExpandPanel,
  BottomSheet,
  FlyToTarget,
  ListenWave,
  CheckDraw,
  SkeletonShimmer,
  useMotionPreference
} from '../components/motion'
import { logAnalyticsEvent } from '../analytics'

const PERSONA_DISPLAY_NAMES: Record<string, string> = {
  student: 'Student',
  teacher: 'Teacher',
  entrepreneur: 'Entrepreneur',
  engineer_office: 'Office / Engineer',
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function getRelativeTimeString(dateStr?: string): string {
  if (!dateStr) return ''
  try {
    const parts = dateStr.split('-')
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10)
      const month = parseInt(parts[1], 10) - 1
      const day = parseInt(parts[2], 10)
      const target = new Date(year, month, day)
      const now = new Date()
      const refYear = now.getFullYear() >= 2026 ? now : new Date(2026, 10, 7) // Simulated 2026 reference
      const diffMs = refYear.getTime() - target.getTime()
      const diffDays = Math.floor(diffMs / (1000 * 3600 * 24))
      if (diffDays <= 0) return 'Today'
      if (diffDays === 1) return 'Yesterday'
      if (diffDays < 7) return `${diffDays}d ago`
      return `${Math.floor(diffDays / 7)}w ago`
    }
    return dateStr
  } catch {
    return dateStr
  }
}

export const TodayScreen: React.FC = () => {
  const {
    persona,
    startBriefing,
    setSelectedGlossaryTerm,
    glossary,
    setActiveTab,
    savedStoryIds,
    toggleSaveStory,
    readStoryIds,
    markStoryRead,
    hiddenStoryIds,
    hideStory,
    undoHideStory,
    addToast,
    weeklyVisits,
    recordVisit,
    audio
  } = useAppStore()

  const { isReduced } = useMotionPreference()

  const [rawStories, setRawStories] = useState<Story[]>([])
  const [hypeStories, setHypeStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [expandedDesktop, setExpandedDesktop] = useState<Record<string, boolean>>({})
  const [activeMobileSheetStory, setActiveMobileSheetStory] = useState<Story | null>(null)
  const [expandedLayer3, setExpandedLayer3] = useState<Record<string, boolean>>({})
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, 'up' | 'down'>>({})
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null)
  const [timeWindow, setTimeWindow] = useState<'24h' | '7d'>('7d')
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('left')
  const [showSkipSection, setShowSkipSection] = useState(false)
  const [skippedSectionDismissed, setSkippedSectionDismissed] = useState(false)

  // Record visit on mount
  useEffect(() => {
    recordVisit()
  }, [recordVisit])

  // Fetch stories with time window
  const loadFeed = (windowOption: '24h' | '7d', showToastOnFinish = false) => {
    setLoading(true)
    const fetchLimit = windowOption === '7d' ? 8 : 4
    fetch(`/feed?persona=${persona}&time_window=${windowOption}&limit=${fetchLimit}`)
      .then(r => r.json())
      .then(feedData => {
        const rawFeedList = (feedData?.today_stories || feedData?.feed || []) as any[]
        const realStories: Story[] = []
        const hypeList: Story[] = []

        rawFeedList.forEach((item: any, idx: number) => {
          const isHype = item.is_hype || item.category === 'hype' || item.signal_label === 'hype'

          const plainHeadline =
            item.plain_headline ||
            item.headline ||
            item.title ||
            ''

          const whatItMeans =
            item.what_it_means ||
            item.explain?.why_it_matters ||
            item.glance?.should_you_care ||
            item.does_it_matter?.reason ||
            ''

          const spokenText =
            item.spoken_text || `${plainHeadline}. ${whatItMeans}`

          // Read relevance directly from backend
          const backendStatus = item.does_it_matter?.status

          const rawImpact =
            item.impact_level ||
            (backendStatus === 'high' ? 'Yes' :
              backendStatus === 'moderate' ? 'Maybe' :
                backendStatus === 'skip' ? 'Not for you' :
                  item.glance?.can_you_use_it ? 'Yes' :
                    item.impact_score > 7 ? 'Yes' :
                      item.impact_score > 4 ? 'Maybe' :
                        'Not for you')

          const dots =
            rawImpact === 'Yes' ? 3 :
              rawImpact === 'Maybe' ? 2 : 1

          const normalizedImpact =
            dots === 3 ? 'Yes' :
              dots === 2 ? 'Maybe' : 'Not for you'

          // Availability information
          const canUseValue = item.glance?.can_you_use_it

          const canUseRaw =
            item.can_use_status ||
            (
              typeof canUseValue === 'string' &&
                /available|free|released|download/i.test(canUseValue)
                ? canUseValue
                : item.is_released
                  ? 'Available now'
                  : null
            )


          // Primary source published_at
          const primaryPub = item.published_at || item.event_date

          // Source items with "From the company" label (Rule 5)
          const formattedSources = (item.sources || []).map((s: any) => ({
            title: s.display_label || s.title || 'Source announcement',
            url: s.url || '#',
            type: (s.type_badge && s.type_badge.toLowerCase().includes('official')) ? 'From the company' : (s.type_badge || 'News'),
            is_primary: !!s.is_primary,
            published_at: s.published_at || primaryPub
          }))

          const story: Story = {
            id: item.story_id || item.id || `story-${idx}`,
            title: item.title || item.headline || 'AI Update',
            plain_headline: plainHeadline,
            impact_level: normalizedImpact,
            impact_dots: dots,
            impact_reason:
              item.explain?.why_it_matters ||
              item.glance?.should_you_care ||
              item.impact_reason ||
              item.does_it_matter?.reason ||
              item.glance?.why_it_matters ||
              '',
            can_use_status: canUseRaw,

            read_time: item.read_time || item.glance?.read_time || '2 min read',

            summary:
              item.glance?.summary ||
              item.explain?.what_happened ||
              item.summary ||
              '',

            what_happened:
              item.explain?.what_happened ||
              item.what_happened ||
              item.glance?.summary ||
              item.summary ||
              plainHeadline,

            what_it_means: whatItMeans,

            try_this:
              (() => {
                const raw = (item.try_this || item.explain?.try_it_today || '').trim().replace(/^["']|["']$/g, '')
                const lower = raw.toLowerCase()
                if (
                  !raw ||
                  ['unknown', 'unavailable', 'n/a', 'na', 'none', 'null'].includes(lower) ||
                  lower.startsWith('unknown') ||
                  lower.startsWith('unavailable')
                ) {
                  return `Search "${plainHeadline.slice(0, 45)}" online to explore practical tools and updates.`
                }
                return raw
              })(),
            sources: formattedSources,

            limits:
              item.limits ||
              item.explain?.limitations ||
              [],

            specs: item.specs || 'Runs in browser and mobile.',
            before_metric: item.before_metric,
            after_metric: item.after_metric,
            is_hype: isHype,
            hype_reason: item.hype_reason || item.does_it_matter?.reason || ''
          }

          if (isHype) {
            hypeList.push(story)
          } else {
            realStories.push(story)
          }
        })

        setRawStories(realStories)
        setHypeStories(hypeList)
        setLoading(false)
        setIsRefreshing(false)

        if (showToastOnFinish) {
          const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          if (realStories.length === 0) {
            addToast(`Checked at ${nowStr}. Nothing new.`)
          } else {
            addToast(`Checked at ${nowStr}. ${realStories.length} updates found.`)
          }
        }
      })
      .catch(() => {
        setLoading(false)
        setIsRefreshing(false)
      })
  }

  useEffect(() => {
    loadFeed(timeWindow)
  }, [persona, timeWindow])

  const handleTimeChange = (newWindow: '24h' | '7d') => {
    if (newWindow === timeWindow) return
    setSlideDirection(newWindow === '7d' ? 'left' : 'right')
    setTimeWindow(newWindow)
  }

  const handleManualRefresh = () => {
    setIsRefreshing(true)
    loadFeed(timeWindow, true)
  }

  // Deduplicate "Why it matters" text per page (Rule 2)
  const displayStories = useMemo(() => {
    const seenReasons = new Set<string>()
    const targetLimit = timeWindow === '7d' ? 6 : 3
    return rawStories
      .filter(s => !hiddenStoryIds.includes(s.id))
      .slice(0, targetLimit)
      .map(story => {
        const trimmed = story.impact_reason.trim()
        if (trimmed && seenReasons.has(trimmed)) {
          console.warn(`[Rule 2] Duplicate 'Why it matters' suppressed on story: "${story.title}"`, trimmed)
          return { ...story, impact_reason: '' }
        }
        if (trimmed) seenReasons.add(trimmed)
        return story
      })
  }, [rawStories, hiddenStoryIds])

  // Check if caught up (all 3 stories opened or listened)
  const completedStoriesCount = useMemo(() => {
    return displayStories.filter(s => readStoryIds.includes(s.id)).length
  }, [displayStories, readStoryIds])

  const isCaughtUp = displayStories.length > 0 && completedStoriesCount === displayStories.length

  useEffect(() => {
    if (isCaughtUp) {
      logAnalyticsEvent('caught_up_completed', { persona, count: displayStories.length })
    }
  }, [isCaughtUp, persona, displayStories.length])

  // Open "Tell Me More": desktop uses ExpandPanel, phone uses BottomSheet (Rule)
  const handleOpenTellMeMore = (story: Story) => {
    markStoryRead(story.id)
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setActiveMobileSheetStory(story)
    } else {
      setExpandedDesktop(prev => ({ ...prev, [story.id]: !prev[story.id] }))
    }
  }

  // Handle Play Story Briefing
  const handlePlayStory = (story: Story) => {
    markStoryRead(story.id)
    const text = story.spoken_text || `${story.plain_headline}. ${story.what_it_means}`
    startBriefing(story.plain_headline, text)
  }

  // Handle Save / FlyToTarget
  const handleSave = (storyId: string) => {
    const isSaved = toggleSaveStory(storyId)
    if (isSaved) {
      addToast('Saved to Workbench', 'View', () => setActiveTab('tools'))
    } else {
      addToast('Removed from saved stories')
    }
  }

  // Handle Not for me / Skip
  const handleNotForMe = (storyId: string) => {
    hideStory(storyId)
    addToast('Card dismissed', 'Undo', () => undoHideStory(storyId))
  }

  // Copy Prompt handler
  const handleCopyPrompt = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedPromptId(id)
    setTimeout(() => setCopiedPromptId(null), 2000)
  }

  const renderInteractiveText = (text: string) => {
    if (!text) return null
    const terms = Object.keys(glossary)
    const regex = new RegExp(`\\b(${terms.join('|')})\\b`, 'gi')
    const parts = text.split(regex)

    return parts.map((part, i) => {
      const lower = part.toLowerCase()
      if (glossary[lower]) {
        return (
          <button
            key={i}
            onClick={(e) => {
              e.stopPropagation()
              setSelectedGlossaryTerm(glossary[lower])
            }}
            className="jargon-term text-inherit font-medium inline underline decoration-dotted decoration-[var(--accent)] hover:text-[var(--accent)] cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
            title="Tap for plain English explanation"
          >
            {part}
          </button>
        )
      }
      return <span key={i}>{part}</span>
    })
  }

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div className="max-w-[1040px] mx-auto px-4 sm:px-6 py-4 pb-28 md:pb-16 space-y-6">

      {/* 8. SLIM DAILY HEADER (Greeting, counts, progress ring, time switch) */}
      {/* Fits at 360x640 without scrolling! */}
      <header className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Progress Ring: stories opened or listened (x/3) */}
          <div className="shrink-0">
            <ProgressRing
              current={completedStoriesCount}
              total={displayStories.length || (timeWindow === '7d' ? 6 : 3)}
              size={44}
              strokeWidth={4}
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif font-bold text-lg sm:text-xl text-[var(--ink)] leading-tight">
                {getGreeting()}, {PERSONA_DISPLAY_NAMES[persona] || 'Reader'}
              </h1>
              {isCaughtUp && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                  <CheckDraw size={12} strokeWidth={3} color="#059669" />
                  <span>Caught Up</span>
                </span>
              )}
            </div>

            <p className="text-xs text-[var(--muted)] mt-0.5">
              <span className="font-semibold text-[var(--ink)]">
                <AnimatedNumber value={displayStories.length} /> stories
              </span>{' '}
              curated for you today &middot;{' '}
              <span>{completedStoriesCount}/{displayStories.length || (timeWindow === '7d' ? 6 : 3)} read</span>
            </p>
          </div>
        </div>

        {/* Time switch: Past 24h | Past 7 days (Rule 4) + Refresh Icon */}
        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
          <SlidingSegmented<'24h' | '7d'>
            options={[
              { id: '24h', label: 'Past 24h' },
              { id: '7d', label: 'Past 7 days' },
            ]}
            selectedId={timeWindow}
            onChange={handleTimeChange}
            size="sm"
          />

          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-full border border-[var(--line)] hover:border-[var(--accent)] text-[var(--muted)] hover:text-[var(--ink)] bg-[var(--surface-hover)] transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            title="Refresh feed"
            aria-label="Refresh stories"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[var(--accent)]' : ''}`} />
          </button>
        </div>
      </header>

      {/* FEED CONTAINER WITH SLIDING TRANSITION */}
      <div className="relative overflow-hidden min-h-[320px]">
        <AnimatePresence mode="wait" initial={false}>
          {loading ? (
            <m.div
              key="loading-skeletons"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: duration.reduced }}
              className="space-y-4"
            >
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-5 space-y-3">
                  <SkeletonShimmer height="1.25rem" width="60%" />
                  <SkeletonShimmer height="1rem" width="90%" />
                  <SkeletonShimmer height="2.5rem" rounded="rounded-xl" />
                </div>
              ))}
            </m.div>
          ) : displayStories.length === 0 ? (
            /* EMPTY WINDOW / QUIET DAY STATE */
            <m.div
              key="quiet-day-empty"
              initial={isReduced ? { opacity: 0 } : { opacity: 0, x: slideDirection === 'left' ? 24 : -24 }}
              animate={isReduced ? { opacity: 1 } : { opacity: 1, x: 0 }}
              exit={isReduced ? { opacity: 0 } : { opacity: 0, x: slideDirection === 'left' ? -24 : 24 }}
              transition={{ duration: duration.base, ease: ease.out }}
              className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-6 sm:p-8 text-center space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center mx-auto">
                <Compass className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg sm:text-xl text-[var(--ink)]">
                  Quiet stretch in AI today.
                </h3>
                <p className="text-xs sm:text-sm text-[var(--muted)] max-w-md mx-auto mt-1">
                  Zero unverified hype passed our filters in the past {timeWindow === '24h' ? '24 hours' : '7 days'}. We never pad your day with filler.
                </p>
              </div>

              {/* Best of the week / Learn suggestion */}
              <div className="pt-4 border-t border-[var(--line)] max-w-md mx-auto text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-ink)] block mb-1">
                  Recommended while it's quiet:
                </span>
                <div
                  onClick={() => setActiveTab('learn')}
                  className="p-3.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--line)] hover:border-[var(--accent)] cursor-pointer transition-colors flex items-center justify-between group"
                >
                  <div>
                    <h4 className="font-serif font-semibold text-sm text-[var(--ink)] group-hover:text-[var(--accent)]">
                      Explore: What's inside a chatbot?
                    </h4>
                    <p className="text-xs text-[var(--muted)]">2-minute interactive prediction demo</p>
                  </div>
                  <Sparkles className="w-4 h-4 text-[var(--accent)]" />
                </div>
              </div>
            </m.div>
          ) : (
            /* STORY CARDS LIST WITH STAGGER */
            <m.div
              key={`story-list-${timeWindow}`}
              initial={isReduced ? { opacity: 0 } : { opacity: 0, x: slideDirection === 'left' ? 24 : -24 }}
              animate={isReduced ? { opacity: 1 } : { opacity: 1, x: 0 }}
              exit={isReduced ? { opacity: 0 } : { opacity: 0, x: slideDirection === 'left' ? -24 : 24 }}
              transition={{ duration: duration.base, ease: ease.out }}
              className="space-y-4"
            >
              <Stagger className="space-y-4">
                {displayStories.map((story) => {
                  const isRead = readStoryIds.includes(story.id)
                  const isSaved = savedStoryIds.includes(story.id)
                  const isLayer2Open = !!expandedDesktop[story.id]
                  const isLayer3Open = !!expandedLayer3[story.id]
                  const isAudioPlaying = audio.isPlaying && audio.title === story.plain_headline
                  const relativeTime = getRelativeTimeString(story.sources[0]?.published_at)

                  return (
                    <article
                      key={story.id}
                      className={`relative bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-5 sm:p-6 transition-all duration-240 ${isRead ? 'opacity-70 bg-[var(--surface-hover)]/40' : 'hover:shadow-md'
                        }`}
                    >
                      {/* Read status check drawn in top right */}
                      {isRead && (
                        <div
                          className="absolute top-4 right-4 flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800"
                          title="Marked as read"
                        >
                          <CheckDraw size={12} strokeWidth={3} color="#059669" />
                          <span>Read</span>
                        </div>
                      )}

                      {/* Header Row: Should You Care? Dots, Status Chips, Relative Time */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs mb-3 pr-14">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Should you care? Sequential Dots + Label matching */}
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--surface-hover)] border border-[var(--line)]">
                            <span className="font-semibold text-[var(--muted)]">Should you care?</span>
                            <Dots count={story.impact_dots} />
                            <span className="font-bold text-[var(--ink)] ml-0.5">
                              {story.impact_level}
                            </span>
                          </div>

                          {/* Chip from own data (Rule 3) */}
                          {story.can_use_status && (
                            <span className="px-2.5 py-1 rounded-full bg-[var(--accent-soft)] text-[var(--accent-ink)] font-semibold text-[11px]">
                              {story.can_use_status}
                            </span>
                          )}
                        </div>

                        {/* Relative Time */}
                        <div className="flex items-center gap-1.5 text-[var(--muted)] text-[11px]">
                          <Clock className="w-3 h-3" />
                          <span>{relativeTime || story.read_time}</span>
                        </div>
                      </div>

                      {/* Plain Headline */}
                      <h2 className="text-lg sm:text-xl font-serif font-bold text-[var(--ink)] leading-snug mb-2">
                        {story.plain_headline}
                      </h2>

                      {/* Why It Matters (Only shown if non-empty, deduplicated by Rule 2) */}
                      {story.impact_reason && (
                        <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed mb-4">
                          <strong className="text-[var(--ink)] font-semibold">Why it matters: </strong>
                          {renderInteractiveText(story.impact_reason)}
                        </p>
                      )}

                      {/* Primary Source with "From the company" label (Rule 5) */}
                      {story.sources.length > 0 && (
                        <div className="flex items-center gap-2 mb-4">
                          {story.sources.slice(0, 1).map((src, sIdx) => (
                            <a
                              key={sIdx}
                              href={src.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[var(--muted)] hover:text-[var(--accent)] hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
                            >
                              <span className="px-1.5 py-0.5 rounded bg-[var(--surface-hover)] border border-[var(--line)] font-semibold text-[10px]">
                                {src.type}
                              </span>
                              <span className="truncate max-w-[200px]">{src.title}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ))}
                        </div>
                      )}

                      {/* ACTION BAR: Tell Me More, Listen (ListenWave), Save (FlyToTarget), Not For Me */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[var(--line)]">
                        <div className="flex items-center gap-2">
                          {/* Tell me more button */}
                          <button
                            onClick={() => handleOpenTellMeMore(story)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--accent)] text-white text-xs font-semibold hover:opacity-90 transition-opacity min-h-[38px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                          >
                            <span>Tell me more</span>
                            {isLayer2Open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>

                          {/* Listen Button morphs into ListenWave while playing */}
                          <button
                            onClick={() => handlePlayStory(story)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors min-h-[38px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${isAudioPlaying
                              ? 'bg-[var(--accent-soft)] text-[var(--accent-ink)] border-[var(--accent)]'
                              : 'border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--ink)]'
                              }`}
                            aria-label={`Listen to ${story.plain_headline}`}
                          >
                            {isAudioPlaying ? (
                              <>
                                <ListenWave isPlaying={true} />
                                <span>Listening</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-3.5 h-3.5 fill-current" />
                                <span>Listen</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Save (FlyToTarget) and Dismiss (Not for me) */}
                        <div className="flex items-center gap-1">
                          <FlyToTarget onFlyComplete={() => { }}>
                            {(triggerFly) => (
                              <button
                                onClick={(e) => {
                                  triggerFly(e)
                                  handleSave(story.id)
                                }}
                                className={`p-2 rounded-xl border transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${isSaved
                                  ? 'bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent)]'
                                  : 'border-transparent hover:border-[var(--line)] text-[var(--muted)] hover:text-[var(--ink)]'
                                  }`}
                                title={isSaved ? 'Saved in Workbench' : 'Save to Workbench'}
                                aria-label="Save story"
                              >
                                <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                              </button>
                            )}
                          </FlyToTarget>

                          {/* Not for me dismiss button */}
                          <button
                            onClick={() => handleNotForMe(story.id)}
                            className="p-2 rounded-xl border border-transparent hover:border-[var(--line)] text-[var(--muted)] hover:text-red-600 transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                            title="Not for me (dismiss)"
                            aria-label="Dismiss story"
                          >
                            <EyeOff className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* LAYER 2: DESKTOP EXPAND PANEL (Height Auto + Content Stagger) */}
                      <ExpandPanel isOpen={isLayer2Open} className="hidden md:block">
                        <div className="mt-4 pt-4 border-t border-[var(--line)] space-y-4 text-xs sm:text-sm">
                          {/* What Happened */}
                          <div>
                            <h4 className="text-[10px] uppercase font-bold tracking-wider text-[var(--muted)] mb-1">
                              What Happened
                            </h4>
                            <p className="text-[var(--ink)] leading-relaxed">
                              {renderInteractiveText(story.what_happened)}
                            </p>
                          </div>

                          {/* Analogy Box */}
                          {story.analogy && (
                            <div className="p-3.5 rounded-xl bg-[var(--accent-soft)] border border-[var(--accent)]/15 flex items-start gap-2.5">
                              <Lightbulb className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
                              <div className="space-y-0.5">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-ink)]">
                                  Think of it like:
                                </div>
                                <p className="text-xs text-[var(--accent-ink)] font-medium">
                                  {renderInteractiveText(story.analogy)}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Try It Today with Copy Button */}
                          {story.try_this && (
                            <div className="p-3.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--line)] space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1">
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>Try it today</span>
                                </span>
                                <button
                                  onClick={() => handleCopyPrompt(story.id, story.try_this)}
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--accent-ink)] hover:underline min-h-[30px] px-2 py-0.5 rounded focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
                                >
                                  {copiedPromptId === story.id ? (
                                    <>
                                      <CheckDraw size={12} strokeWidth={2.5} color="#059669" />
                                      <span className="text-emerald-700 dark:text-emerald-300 font-bold">Copied!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span>Copy prompt</span>
                                    </>
                                  )}
                                </button>
                              </div>
                              <p className="text-xs italic bg-[var(--surface)] p-2 rounded-lg border border-[var(--line)] text-[var(--ink)]">
                                "{story.try_this}"
                              </p>
                            </div>
                          )}

                          {/* Layer 3 Toggle */}
                          <button
                            onClick={() => setExpandedLayer3(prev => ({ ...prev, [story.id]: !prev[story.id] }))}
                            className="inline-flex items-center gap-1 text-xs text-[var(--muted)] hover:text-[var(--ink)] min-h-[36px] focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
                          >
                            <span>{isLayer3Open ? 'Hide deep technical details' : 'View limitations & details'}</span>
                            {isLayer3Open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>

                          {isLayer3Open && (
                            <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--line)] space-y-2 text-xs">
                              {story.limits && story.limits.length > 0 && (
                                <div>
                                  <div className="font-bold uppercase tracking-wider text-[var(--muted)] mb-1 text-[10px]">
                                    Known Limitations:
                                  </div>
                                  <ul className="list-disc list-inside space-y-0.5 text-[var(--muted)]">
                                    {story.limits.map((lim, lIdx) => (
                                      <li key={lIdx}>{lim}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </ExpandPanel>
                    </article>
                  )
                })}
              </Stagger>
            </m.div>
          )}
        </AnimatePresence>
      </div>

      {/* MOBILE BOTTOM SHEET FOR "TELL ME MORE" */}
      <BottomSheet
        isOpen={!!activeMobileSheetStory}
        onClose={() => setActiveMobileSheetStory(null)}
        title={activeMobileSheetStory?.plain_headline || 'Story Details'}
      >
        {activeMobileSheetStory && (
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="text-xs uppercase font-bold tracking-wider text-[var(--muted)] mb-1">
                What Happened
              </h4>
              <p className="text-[var(--ink)] leading-relaxed">
                {renderInteractiveText(activeMobileSheetStory.what_happened)}
              </p>
            </div>

            {activeMobileSheetStory.analogy && (
              <div className="p-4 rounded-2xl bg-[var(--accent-soft)] border border-[var(--accent)]/15 flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-[var(--accent)] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="text-xs font-bold uppercase tracking-wider text-[var(--accent-ink)]">
                    Think of it like:
                  </div>
                  <p className="text-xs text-[var(--accent-ink)] font-medium">
                    {renderInteractiveText(activeMobileSheetStory.analogy)}
                  </p>
                </div>
              </div>
            )}

            {activeMobileSheetStory.try_this && (
              <div className="p-4 rounded-2xl bg-[var(--surface-hover)] border border-[var(--line)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                    Try it today
                  </span>
                  <button
                    onClick={() => handleCopyPrompt(activeMobileSheetStory.id, activeMobileSheetStory.try_this)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent-ink)] hover:underline min-h-[36px] px-2 py-1 rounded"
                  >
                    {copiedPromptId === activeMobileSheetStory.id ? (
                      <>
                        <CheckDraw size={14} color="#059669" />
                        <span className="text-emerald-700 font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy prompt</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs italic bg-[var(--surface)] p-2.5 rounded-xl border border-[var(--line)] text-[var(--ink)]">
                  "{activeMobileSheetStory.try_this}"
                </p>
              </div>
            )}
          </div>
        )}
      </BottomSheet>

      {/* CAUGHT UP STATE: When all 3 are read or listened to */}
      {isCaughtUp && (
        <section className="bg-[var(--surface)] border-2 border-emerald-500/40 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                <CheckDraw size={14} strokeWidth={3} color="#059669" />
                <span>All caught up for today</span>
              </div>
              <h3 className="font-serif font-bold text-xl sm:text-2xl text-[var(--ink)]">
                You're in the top 5% of informed readers.
              </h3>
              <p className="text-xs sm:text-sm text-[var(--muted)] mt-0.5">
                Next update about 8 AM &middot; No need to doomscroll social media.
              </p>
            </div>
          </div>

          {/* Weekly Dots: Mon to Sun (Showing days visited, never loss messages) */}
          <div className="p-4 rounded-xl bg-[var(--surface-hover)] border border-[var(--line)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs font-semibold text-[var(--muted)]">
              This week's reading habit:
            </div>
            <div className="flex items-center gap-2">
              {daysOfWeek.map((day, dIdx) => {
                const visited = weeklyVisits.includes(dIdx)
                return (
                  <div key={day} className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-[var(--muted)] font-medium">{day}</span>
                    <span
                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-colors ${visited
                        ? 'bg-emerald-500 text-white'
                        : 'bg-[var(--line)]'
                        }`}
                    >
                      {visited && <Check className="w-2.5 h-2.5" />}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* "Try this today" Card */}
          <div className="p-4 sm:p-5 rounded-xl bg-[var(--accent-soft)] border border-[var(--accent)]/20 space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--accent-ink)] flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-[var(--accent)]" />
              <span>Try this today (3 minutes)</span>
            </div>
            <p className="text-xs sm:text-sm text-[var(--ink)] font-medium leading-relaxed">
              When drafting your next document, try: <em>"Review this draft as a critical reader. Point out 2 sentences that can be made clearer or shorter."</em>
            </p>
          </div>
        </section>
      )}

      {/* SKIP THESE TODAY (Collapsed Hype Claims Filtered) */}
      {hypeStories.length > 0 && !skippedSectionDismissed && (
        <section className="border border-[var(--line)] rounded-2xl overflow-hidden bg-[var(--surface)]">
          <button
            onClick={() => setShowSkipSection(!showSkipSection)}
            className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-[var(--surface-hover)] transition-colors min-h-[52px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            aria-expanded={showSkipSection}
          >
            <div className="flex items-center gap-3">
              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                Skip
              </span>
              <div>
                <div className="font-serif font-bold text-sm sm:text-base text-[var(--ink)]">
                  Skip These Today ({hypeStories.length} Overhyped Claims Filtered)
                </div>
                <div className="text-[11px] text-[var(--muted)]">
                  Sensational headlines that have zero practical reality for your daily tasks.
                </div>
              </div>
            </div>
            {showSkipSection ? <ChevronUp className="w-4 h-4 text-[var(--muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--muted)]" />}
          </button>

          {showSkipSection && (
            <div className="p-4 sm:p-5 pt-0 border-t border-[var(--line)] space-y-3 bg-[var(--surface-hover)]/30 animate-in fade-in duration-200">
              {hypeStories.map((hype) => (
                <div key={hype.id} className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--line)] space-y-1">
                  <div className="font-serif font-semibold text-sm text-[var(--ink)]">
                    {hype.title}
                  </div>
                  <p className="text-xs text-[var(--muted)]">
                    <strong className="text-[var(--ink)]">The reality: </strong>
                    {hype.hype_reason || 'Clickbait marketing with no functioning software released.'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

    </div>
  )
}
