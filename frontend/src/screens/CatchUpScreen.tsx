import React, { useState, useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'
import { CatchupResponse, ThenNowItem, MilestoneEvent } from '../types'
import { 
  History, 
  Sparkles, 
  Volume2, 
  Check, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Calendar, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sliders,
  Layers,
  Radio
} from 'lucide-react'

export const CatchUpScreen: React.FC = () => {
  const { persona, startBriefing, catchupBucket, setCatchupBucket } = useAppStore()
  const [subView, setSubView] = useState<'catchup' | 'then_now'>('catchup')

  // Feature 1 State: Catch Me Up
  const [catchupData, setCatchupData] = useState<CatchupResponse | null>(null)
  const [loadingCatchup, setLoadingCatchup] = useState(true)
  const [daysSinceVisit, setDaysSinceVisit] = useState<number | null>(null)

  // Feature 2 State: Then vs Now
  const [thenNowItems, setThenNowItems] = useState<ThenNowItem[]>([])
  const [loadingThenNow, setLoadingThenNow] = useState(true)
  const [activeSide, setActiveSide] = useState<Record<string, 'then' | 'now'>>({})

  // Bottom Timeline State (Collapsed All Events)
  const [isTimelineOpen, setIsTimelineOpen] = useState(false)
  const [timelineEvents, setTimelineEvents] = useState<MilestoneEvent[]>([])
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({})
  const [loadingTimeline, setLoadingTimeline] = useState(false)

  // Calculate days since last visit for the suggestion pill
  useEffect(() => {
    const rawLastSeen = localStorage.getItem('ai_news_last_seen')
    if (rawLastSeen) {
      try {
        const lastDt = new Date(rawLastSeen)
        const nowDt = new Date()
        const diffDays = Math.max(1, Math.floor((nowDt.getTime() - lastDt.getTime()) / (1000 * 3600 * 24)))
        setDaysSinceVisit(diffDays)
      } catch {}
    }
  }, [])

  // Fetch Catch Up data
  useEffect(() => {
    let isMounted = true
    setLoadingCatchup(true)

    fetch(`/catchup?persona=${persona}&since=${catchupBucket}`)
      .then(r => r.json())
      .then(data => {
        if (!isMounted) return
        setCatchupData(data)
        setLoadingCatchup(false)
      })
      .catch(() => {
        if (isMounted) setLoadingCatchup(false)
      })

    return () => { isMounted = false }
  }, [persona, catchupBucket])

  // Fetch Then vs Now data
  useEffect(() => {
    let isMounted = true
    setLoadingThenNow(true)

    fetch(`/then-now?persona=${persona}`)
      .then(r => r.json())
      .then(data => {
        if (!isMounted) return
        if (data && data.items) {
          setThenNowItems(data.items)
          // Default side to 'now' for all items
          const initialSides: Record<string, 'then' | 'now'> = {}
          data.items.forEach((item: ThenNowItem) => {
            initialSides[item.id] = 'now'
          })
          setActiveSide(initialSides)
        }
        setLoadingThenNow(false)
      })
      .catch(() => {
        if (isMounted) setLoadingThenNow(false)
      })

    return () => { isMounted = false }
  }, [persona])

  // Load Timeline only when expanded
  useEffect(() => {
    if (isTimelineOpen && timelineEvents.length === 0) {
      setLoadingTimeline(true)
      fetch(`/timeline?year=2026&persona=${persona}`)
        .then(r => r.json())
        .then(data => {
          let rawList: any[] = []
          if (data && Array.isArray(data.timeline)) {
            rawList = data.timeline
          } else if (data && Array.isArray(data.months)) {
            data.months.forEach((m: any) => {
              if (Array.isArray(m.events)) rawList.push(...m.events)
            })
          }

          const formatted: MilestoneEvent[] = rawList.map((item: any, idx: number) => {
            const rawDate = item.date || item.milestone_date || '2026-10-01'
            let dateObj = new Date(rawDate)
            if (isNaN(dateObj.getTime())) dateObj = new Date()
            const monthName = item.month || dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            const dayStr = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })

            return {
              id: item.id || `event-${idx}`,
              date: rawDate,
              formatted_date: dayStr,
              month: monthName,
              headline: item.headline || item.title || 'Event',
              plain_summary: item.plain_summary || item.summary || '',
              category: item.category || 'Release',
              relevance_to_persona: item.relevance_to_persona || item.what_it_means,
              primary_source: item.primary_source
            }
          })
          formatted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          setTimelineEvents(formatted)
          setLoadingTimeline(false)
        })
        .catch(() => setLoadingTimeline(false))
    }
  }, [isTimelineOpen, persona, timelineEvents.length])

  // Group timeline events by month
  const timelineByMonth: Record<string, MilestoneEvent[]> = {}
  timelineEvents.forEach(ev => {
    if (!timelineByMonth[ev.month]) timelineByMonth[ev.month] = []
    timelineByMonth[ev.month].push(ev)
  })

  // Play audio recap
  const playCatchupAudio = () => {
    const textToSpeak = catchupData?.spoken_text || catchupData?.quiet_message || (
      catchupData?.is_quiet_period 
        ? "A quiet stretch. Fewer than three major events passed our strict signal filter during this period. We never pad recaps with filler claims. You are completely caught up."
        : `Here is your catch up recap for ${persona.replace('_', ' ')}. All major updates are verified and summarized for your work.`
    )
    startBriefing(
      `Catch Up Recap for ${persona.replace('_', ' ')} (${catchupBucket.replace('_', ' ')})`,
      textToSpeak
    )
  }

  return (
    <div className="max-w-[1120px] mx-auto px-4 sm:px-6 py-8 pb-28 md:pb-16 space-y-8">
      
      {/* 1. Header & Top Segmented Switch */}
      <section className="bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-6 sm:p-10 shadow-xs">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-soft)] text-[var(--accent-ink)] text-xs font-semibold uppercase tracking-wider mb-3">
            <History className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Orientation & Progress</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-[var(--ink)] tracking-tight leading-[1.15] mb-3">
            {subView === 'catchup' ? 'Catch up on what you missed.' : 'What AI can do now that it couldn’t in January.'}
          </h1>

          <p className="text-base sm:text-lg text-[var(--muted)] leading-relaxed mb-6">
            {subView === 'catchup'
              ? 'Zero filler or marketing fluff. Pick how long you’ve been away, read the bullet recap, or listen to the 1-minute audio.'
              : 'Verifiable baseline shifts. We only compare against proven baselines with evidence—no unsubstantiated hype.'}
          </p>

          {/* Top Segmented Switch: "Catch me up" | "Then vs now" */}
          <div className="inline-flex items-center p-1 rounded-2xl bg-[var(--bg)] border border-[var(--line)]">
            <button
              onClick={() => setSubView('catchup')}
              className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all min-h-[44px] flex items-center gap-2 ${
                subView === 'catchup'
                  ? 'bg-[var(--surface)] text-[var(--ink)] shadow-xs font-bold'
                  : 'text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              <History className="w-4 h-4 text-[var(--accent)]" />
              <span>Catch me up</span>
            </button>
            <button
              onClick={() => setSubView('then_now')}
              className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all min-h-[44px] flex items-center gap-2 ${
                subView === 'then_now'
                  ? 'bg-[var(--surface)] text-[var(--ink)] shadow-xs font-bold'
                  : 'text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              <Sliders className="w-4 h-4 text-[var(--accent)]" />
              <span>Then vs now</span>
            </button>
          </div>
        </div>
      </section>

      {/* SUB-VIEW 1: CATCH ME UP */}
      {subView === 'catchup' && (
        <section className="space-y-6 animate-in fade-in duration-300">
          
          {/* Window Bucket Selector */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[var(--surface)] border border-[var(--line)]">
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
              <span>I've been away for:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: '1_week', label: 'Past 7 days' },
                { id: '1_month', label: '1 month' },
                { id: 'since_january', label: 'Since January' },
              ].map(b => (
                <button
                  key={b.id}
                  onClick={() => setCatchupBucket(b.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all min-h-[44px] ${
                    catchupBucket === b.id
                      ? 'bg-[var(--accent)] text-white shadow-xs'
                      : 'bg-[var(--surface-hover)] text-[var(--muted)] hover:text-[var(--ink)]'
                  }`}
                >
                  {b.label}
                </button>
              ))}

              {/* Suggestion pill: "Since your last visit (N days)" */}
              {daysSinceVisit !== null && (
                <button
                  onClick={() => {
                    const nearest = daysSinceVisit <= 10 ? '1_week' : (daysSinceVisit <= 45 ? '1_month' : 'since_january')
                    setCatchupBucket(nearest)
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium bg-[var(--accent-soft)] text-[var(--accent-ink)] border border-[var(--accent)]/30 hover:bg-[var(--accent-soft)]/80 transition-colors min-h-[44px] flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span>Since last visit ({daysSinceVisit}d)</span>
                </button>
              )}
            </div>

            {/* Listen Recap Button */}
            {catchupData?.spoken_text && (
              <button
                onClick={playCatchupAudio}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--surface-hover)] border border-[var(--line)] hover:border-[var(--accent)] text-xs font-semibold text-[var(--ink)] transition-colors min-h-[44px]"
              >
                <Volume2 className="w-4 h-4 text-[var(--accent)]" />
                <span>Listen ~1-min recap</span>
              </button>
            )}
          </div>

          {/* Quiet period honesty banner */}
          {catchupData?.is_quiet_period && (
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-start gap-3">
              <span className="p-2 rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 shrink-0">
                <Radio className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                  A quiet stretch. Here's what's worth knowing.
                </h4>
                <p className="text-xs text-amber-800/90 dark:text-amber-300/90 mt-0.5">
                  Fewer than 3 major events passed our strict signal filter during this period. We never pad recaps with filler claims.
                </p>
              </div>
            </div>
          )}

          {/* Bullets List (Up to 5) */}
          {loadingCatchup ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--line)] animate-pulse space-y-3">
                  <div className="h-5 bg-[var(--line)] rounded-md w-3/4" />
                  <div className="h-4 bg-[var(--line)] rounded-md w-1/2" />
                </div>
              ))}
            </div>
          ) : catchupData?.bullets.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-[var(--surface)] border border-[var(--line)] text-sm text-[var(--muted)]">
              No qualifying stories during this period. You are completely caught up!
            </div>
          ) : (
            <div className="space-y-4">
              {catchupData?.bullets.map((b, idx) => (
                <article
                  key={b.story_id || idx}
                  className="p-5 sm:p-6 rounded-2xl bg-[var(--surface)] border border-[var(--line)] hover:border-[var(--accent)] transition-all shadow-xs space-y-3 group"
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {/* Importance dot */}
                      <span 
                        className={`w-2.5 h-2.5 rounded-full ${
                          b.importance_dot === 3 ? 'bg-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-950' : 'bg-amber-500'
                        }`} 
                        title={`Importance tier: ${b.importance_dot}/3`}
                      />
                      <span className="text-xs font-semibold text-[var(--accent-ink)]">
                        {b.date}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--accent-soft)] text-[var(--accent-ink)]">
                        {b.can_use_chip}
                      </span>
                      <a
                        href={b.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--muted)] hover:text-[var(--accent)] transition-colors min-h-[32px] px-2 py-0.5 rounded-md hover:bg-[var(--surface-hover)]"
                      >
                        <span>{b.source_badge}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  <h3 className="text-base sm:text-lg font-serif font-bold text-[var(--ink)] leading-snug">
                    {b.sentence}
                  </h3>

                  <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
                    <strong className="text-[var(--ink)] font-semibold">Why it matters to you: </strong>
                    {b.why_it_matters}
                  </p>
                </article>
              ))}
            </div>
          )}

          {/* Closure Card with Animated Checkmark */}
          <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--line)] text-center flex flex-col items-center justify-center space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 flex items-center justify-center">
              <Check className="w-6 h-6 stroke-[3] animate-in zoom-in-50 duration-500" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-[var(--ink)]">
                You're caught up through {catchupData?.closure_date || 'today'}
              </h3>
              <p className="text-xs sm:text-sm text-[var(--muted)] max-w-md mx-auto mt-1">
                That's everything that genuinely matters for your work as a {persona.replace('_', ' ')}. No endless scrolls or unverified claims.
              </p>
            </div>
          </div>

        </section>
      )}

      {/* SUB-VIEW 2: THEN VS NOW */}
      {subView === 'then_now' && (
        <section className="space-y-6 animate-in fade-in duration-300">
          <div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[var(--ink)]">
              Verifiable Progress for {persona.replace('_', ' ')}s
            </h2>
            <p className="text-sm text-[var(--muted)]">
              Compare where AI stood in January versus what is possible today. We only show a "Then" side when evidence exists.
            </p>
          </div>

          {loadingThenNow ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--line)] animate-pulse space-y-3">
                  <div className="h-5 bg-[var(--line)] rounded-md w-1/2" />
                  <div className="h-16 bg-[var(--line)] rounded-xl w-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {thenNowItems.map(item => {
                const currentSide = activeSide[item.id] || 'now'

                return (
                  <article
                    key={item.id}
                    className="p-6 sm:p-7 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-xs space-y-5"
                  >
                    {/* Header Row */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          item.is_new_in_2026
                            ? 'bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300'
                            : 'bg-[var(--accent-soft)] text-[var(--accent-ink)]'
                        }`}>
                          {item.badge}
                        </span>
                        <span className="text-xs text-[var(--muted)]">
                          Confidence: {item.confidence}
                        </span>
                      </div>

                      {/* Slider / Toggle: Then vs Now (Only if Then baseline exists) */}
                      {!item.is_new_in_2026 && (
                        <div className="inline-flex p-1 rounded-xl bg-[var(--bg)] border border-[var(--line)]">
                          <button
                            onClick={() => setActiveSide(prev => ({ ...prev, [item.id]: 'then' }))}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all min-h-[36px] ${
                              currentSide === 'then'
                                ? 'bg-neutral-600 text-white shadow-xs'
                                : 'text-[var(--muted)] hover:text-[var(--ink)]'
                            }`}
                          >
                            Then (January)
                          </button>
                          <button
                            onClick={() => setActiveSide(prev => ({ ...prev, [item.id]: 'now' }))}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all min-h-[36px] ${
                              currentSide === 'now'
                                ? 'bg-[var(--accent)] text-white shadow-xs'
                                : 'text-[var(--muted)] hover:text-[var(--ink)]'
                            }`}
                          >
                            Now (2026)
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Capability Title */}
                    <h3 className="text-xl sm:text-2xl font-serif font-bold text-[var(--ink)]">
                      {item.title}
                    </h3>

                    {/* Comparison Box */}
                    {item.is_new_in_2026 ? (
                      /* New in 2026 single side */
                      <div className="p-5 rounded-2xl bg-[var(--accent-soft)] border border-[var(--accent)]/30 space-y-2">
                        <div className="text-xs font-bold uppercase tracking-wider text-[var(--accent-ink)]">
                          New Capability in 2026 (No Prior Consumer Equivalent)
                        </div>
                        <p className="text-sm sm:text-base text-[var(--ink)] font-medium leading-relaxed">
                          {item.now_text}
                        </p>
                      </div>
                    ) : (
                      /* Then vs Now Interactive Display */
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Then Side (Grayscale) */}
                        <div className={`p-5 rounded-2xl border transition-all ${
                          currentSide === 'then'
                            ? 'bg-neutral-100 dark:bg-neutral-900 border-neutral-400 dark:border-neutral-700 ring-2 ring-neutral-400/20'
                            : 'bg-[var(--surface-hover)] border-[var(--line)] opacity-75'
                        }`}>
                          <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
                            Then &middot; January 2026 Baseline
                          </div>
                          <p className="text-sm text-[var(--ink)] leading-relaxed">
                            {item.then_text}
                          </p>

                          {/* Before Dot Pictogram */}
                          {item.before_stat && (
                            <div className="mt-3 pt-3 border-t border-[var(--line)] text-xs">
                              <span className="text-[var(--muted)] block mb-1">
                                Benchmark: <strong>{item.before_stat.num} of {item.before_stat.total}</strong> ({item.before_stat.baseline})
                              </span>
                              <div className="flex gap-1">
                                {Array.from({ length: item.before_stat.total }).map((_, idx) => (
                                  <span
                                    key={idx}
                                    className={`w-3 h-3 rounded-full ${
                                      idx < item.before_stat!.num ? 'bg-neutral-400' : 'bg-[var(--line)]'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Now Side (Persona Accent) */}
                        <div className={`p-5 rounded-2xl border transition-all ${
                          currentSide === 'now'
                            ? 'bg-[var(--accent-soft)] border-[var(--accent)] ring-2 ring-[var(--accent)]/20'
                            : 'bg-[var(--surface-hover)] border-[var(--line)] opacity-75'
                        }`}>
                          <div className="text-xs font-bold uppercase tracking-wider text-[var(--accent-ink)] mb-1">
                            Now &middot; Verified in 2026
                          </div>
                          <p className="text-sm text-[var(--ink)] font-medium leading-relaxed">
                            {item.now_text}
                          </p>

                          {/* After Dot Pictogram */}
                          {item.after_stat && (
                            <div className="mt-3 pt-3 border-t border-[var(--accent)]/20 text-xs">
                              <span className="text-[var(--accent-ink)] block mb-1 font-semibold">
                                Now: <strong>{item.after_stat.num} of {item.after_stat.total}</strong> on standardized tests
                              </span>
                              <div className="flex gap-1">
                                {Array.from({ length: item.after_stat.total }).map((_, idx) => (
                                  <span
                                    key={idx}
                                    className={`w-3 h-3 rounded-full ${
                                      idx < item.after_stat!.num ? 'bg-[var(--accent)]' : 'bg-[var(--line)]'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* What it means for you */}
                    <div className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
                      <strong className="text-[var(--ink)] font-semibold">What it means for you: </strong>
                      {item.what_it_means}
                    </div>

                    {/* Evidence links */}
                    {(item.now_sources.length > 0 || item.then_sources.length > 0) && (
                      <div className="pt-2 border-t border-[var(--line)] flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                        <span className="font-semibold uppercase tracking-wider">Verified Sources:</span>
                        {item.then_sources.map((src, sIdx) => (
                          <a
                            key={`then-${sIdx}`}
                            href={src}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--surface-hover)] hover:text-[var(--ink)] transition-colors min-h-[32px]"
                          >
                            <span>Baseline Evidence</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ))}
                        {item.now_sources.map((src, sIdx) => (
                          <a
                            key={`now-${sIdx}`}
                            href={src}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--accent-soft)] text-[var(--accent-ink)] hover:opacity-80 transition-opacity min-h-[32px]"
                          >
                            <span>2026 Announcement</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ))}
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* 3. Bottom Collapsed "All Events" Timeline Section (3 per month, "see more") */}
      <section className="border border-[var(--line)] rounded-3xl overflow-hidden bg-[var(--surface)]">
        <button
          onClick={() => setIsTimelineOpen(!isTimelineOpen)}
          className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-[var(--surface-hover)] transition-colors min-h-[56px]"
          aria-expanded={isTimelineOpen}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base sm:text-lg text-[var(--ink)]">
                All Events Archive (Timeline)
              </h3>
              <p className="text-xs text-[var(--muted)]">
                Browse every verified milestone across 2026 by month (3 highlights shown by default).
              </p>
            </div>
          </div>
          {isTimelineOpen ? <ChevronUp className="w-5 h-5 text-[var(--muted)]" /> : <ChevronDown className="w-5 h-5 text-[var(--muted)]" />}
        </button>

        {isTimelineOpen && (
          <div className="p-5 sm:p-7 pt-0 border-t border-[var(--line)] space-y-8 animate-in fade-in duration-300">
            {loadingTimeline ? (
              <div className="space-y-4 py-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 rounded-xl bg-[var(--line)] animate-pulse" />
                ))}
              </div>
            ) : Object.keys(timelineByMonth).length === 0 ? (
              <div className="text-sm text-[var(--muted)] py-4">No events found in timeline archive.</div>
            ) : (
              <div className="space-y-8 pt-4">
                {Object.entries(timelineByMonth).map(([month, monthEvs]) => {
                  const isMonthExpanded = !!expandedMonths[month]
                  const visibleEvents = isMonthExpanded ? monthEvs : monthEvs.slice(0, 3)
                  const hasMore = monthEvs.length > 3

                  return (
                    <div key={month} className="space-y-4">
                      <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
                        <span className="font-serif font-bold text-base text-[var(--ink)]">
                          {month}
                        </span>
                        <span className="text-xs text-[var(--muted)]">
                          {monthEvs.length} events
                        </span>
                      </div>

                      <div className="space-y-3">
                        {visibleEvents.map(ev => (
                          <div
                            key={ev.id}
                            className="p-4 rounded-2xl bg-[var(--surface-hover)] border border-[var(--line)] space-y-1.5"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-[var(--accent-ink)]">{ev.formatted_date}</span>
                              <span className="px-2 py-0.5 rounded-md bg-[var(--line)] text-[10px] uppercase font-bold text-[var(--muted)]">
                                {ev.category}
                              </span>
                            </div>
                            <h4 className="font-serif font-bold text-sm sm:text-base text-[var(--ink)]">
                              {ev.headline}
                            </h4>
                            <p className="text-xs text-[var(--muted)] leading-relaxed">
                              {ev.plain_summary}
                            </p>
                          </div>
                        ))}
                      </div>

                      {hasMore && (
                        <button
                          onClick={() => setExpandedMonths(prev => ({ ...prev, [month]: !isMonthExpanded }))}
                          className="text-xs font-semibold text-[var(--accent)] hover:text-[var(--accent-ink)] transition-colors min-h-[36px] flex items-center gap-1"
                        >
                          <span>{isMonthExpanded ? 'Show fewer' : `See more (${monthEvs.length - 3} more)`}</span>
                          {isMonthExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </section>

    </div>
  )
}
