import React, { useState, useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'
import { MilestoneEvent } from '../types'
import { Calendar, Filter, Sparkles, ExternalLink, ChevronRight, Check } from 'lucide-react'

export const TimelineScreen: React.FC = () => {
  const { persona } = useAppStore()
  const [events, setEvents] = useState<MilestoneEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [personaFilterOnly, setPersonaFilterOnly] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  useEffect(() => {
    let isMounted = true
    setLoading(true)

    fetch(`/timeline?year=2026&persona=${persona}`)
      .then(r => r.json())
      .then(data => {
        if (!isMounted) return

        let rawList: any[] = []
        if (data && Array.isArray(data.timeline) && data.timeline.length > 0) {
          rawList = data.timeline
        } else if (data && Array.isArray(data.months)) {
          data.months.forEach((mObj: any) => {
            if (Array.isArray(mObj.events)) {
              rawList.push(...mObj.events)
            }
          })
        }

        const formatted: MilestoneEvent[] = rawList.map((item: any, idx: number) => {
          const rawDate = item.date || item.milestone_date || '2026-10-01'
          let dateObj = new Date(rawDate)
          if (isNaN(dateObj.getTime())) {
            dateObj = new Date()
          }
          const monthName = item.month || dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
          const dayStr = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })

          return {
            id: item.id || item.story_id || `event-${idx}`,
            date: rawDate,
            formatted_date: dayStr,
            month: monthName,
            headline: item.headline || item.title || 'Major AI Event',
            plain_summary: item.plain_summary || item.summary || 'A significant industry milestone.',
            category: item.category || 'Release',
            is_major: item.is_major !== false,
            relevance_to_persona: item.relevance_to_persona || item.what_it_means || 'Relevant to your workflow.',
            tags: item.tags || []
          }
        })

        // Sort descending by date so most recent late October 2026 events are at top
        formatted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        setEvents(formatted)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load timeline:', err)
        if (isMounted) setLoading(false)
      })

    return () => { isMounted = false }
  }, [persona])

  // Filter events
  const filteredEvents = events.filter(ev => {
    if (selectedCategory !== 'all' && ev.category.toLowerCase() !== selectedCategory.toLowerCase()) {
      return false
    }
    return true
  })

  // Group events by month preserving descending chronological order
  const groupedByMonth: Record<string, MilestoneEvent[]> = {}
  filteredEvents.forEach(ev => {
    if (!groupedByMonth[ev.month]) {
      groupedByMonth[ev.month] = []
    }
    groupedByMonth[ev.month].push(ev)
  })

  return (
    <div className="max-w-[1120px] mx-auto px-4 sm:px-6 py-8 pb-28 md:pb-16 space-y-8">
      
      {/* Header */}
      <section className="bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-6 sm:p-10 shadow-xs">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-soft)] text-[var(--accent-ink)] text-xs font-semibold uppercase tracking-wider mb-3">
            <Calendar className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>2026 Year in Review</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-[var(--ink)] tracking-tight leading-[1.15] mb-3">
            Every major AI milestone of 2026.
          </h1>

          <p className="text-base sm:text-lg text-[var(--muted)] leading-relaxed">
            From the breakthrough models in early spring to the major releases of late October 2026. Filtered to cut through the hype.
          </p>
        </div>
      </section>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[var(--surface)] border border-[var(--line)]">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[var(--muted)]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Perspective:</span>
          
          <button
            onClick={() => setPersonaFilterOnly(!personaFilterOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors min-h-[38px] ${
              personaFilterOnly 
                ? 'bg-[var(--accent)] text-white shadow-xs' 
                : 'bg-[var(--surface-hover)] text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            {personaFilterOnly && <Check className="w-3.5 h-3.5" />}
            <span>Personalized for {persona.replace('_', ' ')}</span>
          </button>
        </div>

        <div className="text-xs text-[var(--muted)]">
          Showing <strong>{filteredEvents.length}</strong> verified events across 2026
        </div>
      </div>

      {/* Vertical Timeline */}
      {loading ? (
        <div className="space-y-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-6 animate-pulse space-y-3">
              <div className="h-5 bg-[var(--line)] rounded-md w-1/4" />
              <div className="h-4 bg-[var(--line)] rounded-md w-3/4" />
            </div>
          ))}
        </div>
      ) : Object.keys(groupedByMonth).length === 0 ? (
        <div className="p-12 text-center bg-[var(--surface)] rounded-3xl border border-[var(--line)]">
          <p className="text-[var(--muted)]">No timeline events matched your filter.</p>
        </div>
      ) : (
        <div className="relative border-l-2 border-[var(--line)] ml-4 sm:ml-8 pl-6 sm:pl-10 space-y-12">
          {Object.entries(groupedByMonth).map(([month, monthEvents]) => (
            <div key={month} className="relative space-y-6">
              
              {/* Sticky Month Node */}
              <div className="sticky top-20 z-20 -ml-10 sm:-ml-14 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-[var(--accent)] text-white flex items-center justify-center shadow-md font-bold text-xs ring-4 ring-[var(--bg)]">
                  <Calendar className="w-4 h-4" />
                </span>
                <span className="px-3 py-1 rounded-xl bg-[var(--surface)] border border-[var(--line)] text-xs sm:text-sm font-bold text-[var(--ink)] shadow-xs">
                  {month}
                </span>
              </div>

              {/* Event Cards */}
              <div className="space-y-4">
                {monthEvents.map((ev) => (
                  <article
                    key={ev.id}
                    className="p-5 sm:p-6 rounded-2xl bg-[var(--surface)] border border-[var(--line)] hover:border-[var(--accent)] transition-all shadow-xs space-y-2 group"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[var(--accent-ink)]">
                        {ev.formatted_date}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--surface-hover)] text-[var(--muted)]">
                        {ev.category}
                      </span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-serif font-bold text-[var(--ink)] group-hover:text-[var(--accent-ink)] transition-colors">
                      {ev.headline}
                    </h3>

                    <p className="text-sm text-[var(--muted)] leading-relaxed">
                      {ev.plain_summary}
                    </p>

                    {ev.relevance_to_persona && (
                      <div className="pt-2 text-xs text-[var(--accent-ink)] font-medium flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                        <span><strong>Impact:</strong> {ev.relevance_to_persona}</span>
                      </div>
                    )}
                  </article>
                ))}
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  )
}
