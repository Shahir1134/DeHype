import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Rss,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Clock,
  Zap,
  Star,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface LiveNewsItem {
  id: string
  title: string
  source_name: string
  source_trust: 'official' | 'news'
  url: string
  published_iso: string
  overall_importance: number          // 1-5
  relevance_score: number             // 0-10, persona-specific
  does_it_matter: string              // plain English "why it matters to you"
  tags: string[]
  hype_flag: boolean
}

interface LiveNewsResponse {
  persona: string
  window: '24h' | '7d'
  count: number
  items: LiveNewsItem[]
  notice: string | null
  db_exists: boolean
}

interface LiveNewsWidgetProps {
  persona: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function relativeTime(isoStr: string): string {
  if (!isoStr) return ''
  try {
    const d = new Date(isoStr)
    const diffMs = Date.now() - d.getTime()
    const h = Math.floor(diffMs / 3_600_000)
    if (h < 1) return 'just now'
    if (h < 24) return `${h}h ago`
    const days = Math.floor(h / 24)
    return `${days}d ago`
  } catch {
    return ''
  }
}

/** Filled dots to show importance visually */
function ImportanceDots({ score }: { score: number }) {
  return (
    <span className="flex gap-0.5 items-center" title={`Importance ${score}/5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={`inline-block w-1.5 h-1.5 rounded-full ${
            i < score ? 'bg-current opacity-100' : 'bg-current opacity-20'
          }`}
        />
      ))}
    </span>
  )
}

/** Relevance badge: "Highly relevant" / "Relevant" / "Somewhat relevant" */
function RelevanceBadge({ score }: { score: number }) {
  if (score >= 8) return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--accent)] text-white">
      Highly relevant to you
    </span>
  )
  if (score >= 5) return (
    <span className="text-xs font-medium px-2 py-0.5 rounded-full border border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-soft)]">
      Relevant to you
    </span>
  )
  return (
    <span className="text-xs font-medium px-2 py-0.5 rounded-full border border-gray-200 text-gray-500 bg-gray-50">
      Somewhat relevant
    </span>
  )
}

// ─── Single news card ─────────────────────────────────────────────────────────

function NewsCard({ item }: { item: LiveNewsItem }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
    >
      {/* Top strip: importance colour bar */}
      <div
        className="h-0.5 w-full"
        style={{
          background:
            item.overall_importance >= 4
              ? 'var(--accent)'
              : item.overall_importance >= 3
              ? '#d1d5db'
              : '#f3f4f6',
        }}
      />

      <div className="p-4">
        {/* Row 1: source + time + dots */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {item.source_trust === 'official' && (
            <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100">
              Official
            </span>
          )}
          <span className="text-xs text-gray-400">{item.source_name}</span>
          <span className="text-xs text-gray-300">·</span>
          <span className="text-xs text-gray-400">{relativeTime(item.published_iso)}</span>
          <span className="ml-auto flex-shrink-0 text-[var(--accent)]">
            <ImportanceDots score={item.overall_importance} />
          </span>
        </div>

        {/* Row 2: title */}
        <p className="text-sm font-semibold text-gray-900 leading-snug mb-3">{item.title}</p>

        {/* Row 3: relevance badge */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <RelevanceBadge score={item.relevance_score} />
        </div>

        {/* "Does it matter" — always shown if present */}
        {item.does_it_matter && (
          <div className="rounded-lg px-3 py-2 mb-3 text-sm bg-[var(--accent-soft)]">
            <span className="font-semibold text-[var(--accent-ink)]">
              What this means for you:{' '}
            </span>
            <span className="text-gray-700">{item.does_it_matter}</span>
          </div>
        )}

        {/* Expandable: tags + read more link */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              key="expanded"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {item.tags.map(tag => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500"
                    >
                      #{tag.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              )}
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium text-[var(--accent)] hover:underline"
              >
                Read the original <ExternalLink size={13} />
              </a>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expand toggle */}
        <button
          className="mt-2 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          onClick={() => setExpanded(v => !v)}
        >
          {expanded ? (
            <><ChevronUp size={13} /> Less</>
          ) : (
            <><ChevronDown size={13} /> Source & tags</>
          )}
        </button>
      </div>
    </motion.div>
  )
}

// ─── Main widget ──────────────────────────────────────────────────────────────

export const LiveNewsWidget: React.FC<LiveNewsWidgetProps> = ({
  persona,
}) => {
  // Use CSS variables from the persona theme — matches the rest of the app
  const accentColor = 'var(--accent)'
  const accentLight = 'var(--accent-soft)'
  const [window, setWindow] = useState<'24h' | '7d'>('24h')
  const [data, setData] = useState<LiveNewsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastFetched, setLastFetched] = useState<Date | null>(null)

  const load = useCallback(async (w: '24h' | '7d') => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/live-news?persona=${persona}&window=${w}&limit=8`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json: LiveNewsResponse = await res.json()
      setData(json)
      setLastFetched(new Date())
    } catch (e) {
      setError('Could not load live news. The feed updates every 6 hours.')
    } finally {
      setLoading(false)
    }
  }, [persona])

  useEffect(() => {
    load(window)
  }, [load, window])

  const handleWindowChange = (w: '24h' | '7d') => {
    setWindow(w)
    load(w)
  }

  return (
    <section className="mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Rss size={18} style={{ color: accentColor }} />
          <h2 className="text-lg font-bold text-gray-900">What's happening in AI</h2>
          {/* Live pulse dot */}
          <span className="relative flex h-2 w-2">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ background: accentColor }}
            />
            <span
              className="relative inline-flex rounded-full h-2 w-2"
              style={{ background: accentColor }}
            />
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Window toggle */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs">
            {(['24h', '7d'] as const).map(w => (
              <button
                key={w}
                onClick={() => handleWindowChange(w)}
                className={`px-3 py-1.5 font-medium transition-colors ${
                  window === w
                    ? 'text-white'
                    : 'text-gray-500 hover:text-gray-700 bg-white'
                }`}
                style={window === w ? { background: accentColor } : {}}
              >
                {w === '24h' ? 'Past 24h' : 'Past 7 days'}
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button
            onClick={() => load(window)}
            disabled={loading}
            className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-40"
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Subtitle: honest framing */}
      <p className="text-sm text-gray-500 mb-4">
        Filtered for <span className="font-medium text-gray-700">what actually matters to you</span> —
        scored automatically, hype removed.
        {lastFetched && (
          <span className="ml-1 text-gray-400">
            <Clock size={11} className="inline mb-0.5" /> Updated {relativeTime(lastFetched.toISOString())}
          </span>
        )}
      </p>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-orange-100 bg-orange-50 p-4 flex gap-3 items-start mb-4">
          <AlertCircle size={18} className="text-orange-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-orange-700">{error}</p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !data && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
              <div className="h-3 bg-gray-100 rounded w-24 mb-3" />
              <div className="h-4 bg-gray-100 rounded w-full mb-2" />
              <div className="h-4 bg-gray-100 rounded w-3/4 mb-3" />
              <div className="h-8 bg-gray-50 rounded w-full" />
            </div>
          ))}
        </div>
      )}

      {/* DB not warmed up yet */}
      {!loading && data && !data.db_exists && (
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-6 text-center">
          <Zap size={28} className="mx-auto mb-2 text-gray-300" />
          <p className="text-sm font-medium text-gray-600 mb-1">Feed is warming up</p>
          <p className="text-xs text-gray-400">
            The automated fetcher runs every 6 hours. Check back soon.
          </p>
        </div>
      )}

      {/* Empty / quiet period */}
      {!loading && data && data.db_exists && data.count === 0 && (
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-6 text-center">
          <Star size={28} className="mx-auto mb-2 text-gray-300" />
          <p className="text-sm font-medium text-gray-600 mb-1">A quiet stretch</p>
          <p className="text-xs text-gray-400">
            {data.notice || 'Nothing new that matters for you in this window. Try expanding to 7 days.'}
          </p>
          {window === '24h' && (
            <button
              className="mt-3 text-xs font-medium underline"
              style={{ color: accentColor }}
              onClick={() => handleWindowChange('7d')}
            >
              Show past 7 days instead
            </button>
          )}
        </div>
      )}

      {/* News cards */}
      {!loading && data && data.count > 0 && (
        <motion.div layout className="space-y-3">
          <AnimatePresence>
            {data.items.map(item => (
              <NewsCard
                key={item.id}
                item={item}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Footer note */}
      <p className="mt-4 text-xs text-gray-400 text-center">
        Sources: official AI lab blogs + quality tech journalism · Hype filtered automatically ·
        Scores update every 6 hours
      </p>
    </section>
  )
}
