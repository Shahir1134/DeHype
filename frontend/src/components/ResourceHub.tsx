import React, { useState } from 'react'
import { Video, FileText, Code, ExternalLink, Play, Clock, Star, ChevronDown, ChevronUp } from 'lucide-react'

export interface ResourceItem {
  id: string
  concept_id: string
  type: 'video' | 'doc' | 'repo'
  title: string
  creator: string
  url: string
  duration_min: number
  level: 'beginner' | 'intermediate' | 'advanced'
  needs_coding: boolean
  what_youll_learn: string
  maps_to_section: number
  timestamps: { label: string; seconds: number }[]
  language: string
  last_checked_at: string
  link_status: 'ok' | 'broken'
}

interface ResourceHubProps {
  resources: ResourceItem[]
  depth: 'simple' | 'technical'
}

export const ResourceHub: React.FC<ResourceHubProps> = ({ resources, depth }) => {
  const [activeTab, setActiveTab] = useState<'watch' | 'read' | 'build'>('watch')
  const [loadedVideoId, setLoadedVideoId] = useState<string | null>(null)
  const [videoTimestamp, setVideoTimestamp] = useState<number>(0)
  const [isBuildExpanded, setIsBuildExpanded] = useState<boolean>(depth === 'technical')

  // Filter out any broken links
  const validResources = resources.filter(r => r.link_status !== 'broken')
  
  const videos = validResources.filter(r => r.type === 'video')
  const docs = validResources.filter(r => r.type === 'doc')
  const repos = validResources.filter(r => r.type === 'repo')

  // Helper to extract YouTube video ID from standard or youtu.be URLs
  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/)
    return match ? match[1] : null
  }

  return (
    <div className="bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-5 sm:p-7 shadow-xs space-y-6">
      
      {/* Header and Tab Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--line)]">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] block">
            Go Further (Optional Depth)
          </span>
          <h4 className="text-lg font-serif font-bold text-[var(--ink)]">
            Verified External Resources
          </h4>
        </div>

        {/* Tab switcher: Watch, Read, Build */}
        <div className="flex gap-1.5 p-1 bg-[var(--surface-hover)] border border-[var(--line)] rounded-2xl">
          {videos.length > 0 && (
            <button
              onClick={() => setActiveTab('watch')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all min-h-[36px] ${
                activeTab === 'watch' ? 'bg-[var(--accent)] text-white shadow-xs' : 'text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Watch ({videos.length})</span>
            </button>
          )}

          {docs.length > 0 && (
            <button
              onClick={() => setActiveTab('read')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all min-h-[36px] ${
                activeTab === 'read' ? 'bg-[var(--accent)] text-white shadow-xs' : 'text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Read ({docs.length})</span>
            </button>
          )}

          {repos.length > 0 && (
            <button
              onClick={() => setActiveTab('build')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all min-h-[36px] ${
                activeTab === 'build' ? 'bg-[var(--accent)] text-white shadow-xs' : 'text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Build ({repos.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* WATCH TAB */}
      {activeTab === 'watch' && videos.length > 0 && (
        <div className="space-y-4">
          {videos.map((vid, idx) => {
            const ytId = getYouTubeId(vid.url)
            const isLoaded = loadedVideoId === vid.id

            return (
              <div key={vid.id} className="p-4 sm:p-5 rounded-2xl bg-[var(--surface-hover)] border border-[var(--line)] space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {idx === 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                          <Star className="w-3 h-3 fill-current text-amber-500" />
                          <span>Start here</span>
                        </span>
                      )}
                      <span className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">
                        {vid.creator} • {vid.duration_min} min
                      </span>
                    </div>

                    <h5 className="text-base font-serif font-bold text-[var(--ink)]">
                      {vid.title}
                    </h5>
                    <p className="text-xs text-[var(--muted)] mt-0.5">
                      {vid.what_youll_learn}
                    </p>
                  </div>

                  <a
                    href={vid.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-[var(--surface)] border border-[var(--line)] text-[var(--muted)] hover:text-[var(--ink)] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
                    title="Open in YouTube"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                {/* Lazy-Loaded Privacy-Enhanced YouTube Facade */}
                {ytId && (
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-[var(--line)]">
                    {isLoaded ? (
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&cc_load_policy=1&start=${videoTimestamp}`}
                        title={vid.title}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <div
                        onClick={() => {
                          setLoadedVideoId(vid.id)
                          setVideoTimestamp(0)
                        }}
                        className="w-full h-full flex flex-col items-center justify-center cursor-pointer bg-neutral-900 hover:bg-neutral-800 transition-colors p-4 text-center group"
                      >
                        <div className="w-14 h-14 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform mb-2">
                          <Play className="w-6 h-6 fill-current ml-0.5" />
                        </div>
                        <span className="text-xs font-semibold text-white">
                          Click to load video ({vid.duration_min} min)
                        </span>
                        <span className="text-[10px] text-neutral-400 mt-1">
                          Privacy-enhanced domain • Captions enabled by default
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Timestamp Chips */}
                {vid.timestamps && vid.timestamps.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] block">
                      Jump to key sections:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {vid.timestamps.map((ts, tIdx) => (
                        <button
                          key={tIdx}
                          onClick={() => {
                            setLoadedVideoId(vid.id)
                            setVideoTimestamp(ts.seconds)
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[var(--surface)] border border-[var(--line)] text-xs text-[var(--ink)] hover:border-[var(--accent)] transition-colors flex items-center gap-1.5 min-h-[36px]"
                        >
                          <Clock className="w-3 h-3 text-[var(--muted)]" />
                          <span>{ts.label} ({Math.floor(ts.seconds / 60)}:{(ts.seconds % 60).toString().padStart(2, '0')})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* READ TAB */}
      {activeTab === 'read' && docs.length > 0 && (
        <div className="space-y-3">
          {docs.map((doc, idx) => (
            <a
              key={doc.id}
              href={doc.url}
              target="_blank"
              rel="noreferrer"
              className="p-4 sm:p-5 rounded-2xl bg-[var(--surface-hover)] border border-[var(--line)] hover:border-[var(--accent)] transition-all block group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {idx === 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                        <Star className="w-3 h-3 fill-current text-amber-500" />
                        <span>Start here</span>
                      </span>
                    )}
                    <span className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">
                      {doc.creator}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)]">
                      {doc.level}
                    </span>
                  </div>

                  <h5 className="text-base font-serif font-bold text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors">
                    {doc.title}
                  </h5>
                  <p className="text-xs text-[var(--muted)] leading-relaxed">
                    {doc.what_youll_learn}
                  </p>
                </div>

                <ExternalLink className="w-4 h-4 text-[var(--muted)] group-hover:text-[var(--accent)] shrink-0 mt-1" />
              </div>
            </a>
          ))}
        </div>
      )}

      {/* BUILD TAB */}
      {activeTab === 'build' && repos.length > 0 && (
        <div className="space-y-4">
          {/* Beginner Collapsible Warning */}
          {depth !== 'technical' && (
            <div className="p-3.5 rounded-2xl bg-[var(--accent-soft)] border border-[var(--accent)]/20 flex items-center justify-between gap-3">
              <span className="text-xs text-[var(--accent-ink)] font-medium">
                Coding repositories are intended for technical builders. You can skip these without missing core concept understanding.
              </span>
              <button
                onClick={() => setIsBuildExpanded(!isBuildExpanded)}
                className="text-xs font-bold text-[var(--accent)] hover:underline flex items-center gap-1 min-h-[36px] px-2 shrink-0"
              >
                <span>{isBuildExpanded ? 'Collapse repos' : 'Show repos'}</span>
                {isBuildExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}

          {isBuildExpanded && (
            <div className="space-y-3">
              {repos.map((repo, idx) => (
                <div key={repo.id} className="p-4 sm:p-5 rounded-2xl bg-[var(--surface-hover)] border border-[var(--line)] space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {idx === 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                            <Star className="w-3 h-3 fill-current text-amber-500" />
                            <span>Start here</span>
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)]">
                          {repo.level}
                        </span>
                        <span className="text-[11px] font-semibold text-[var(--muted)]">
                          Language: {repo.language}
                        </span>
                      </div>

                      <h5 className="text-base font-serif font-bold text-[var(--ink)]">
                        {repo.title}
                      </h5>
                      <p className="text-xs text-[var(--muted)]">
                        {repo.what_youll_learn}
                      </p>
                    </div>

                    <a
                      href={repo.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2.5 rounded-xl bg-[var(--accent)] text-white hover:opacity-90 transition-opacity min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0 shadow-xs"
                      title="Inspect GitHub Repository"
                    >
                      <Code className="w-4 h-4" />
                    </a>
                  </div>

                  {/* 3-Line How to Run Note */}
                  <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--line)] text-xs font-mono text-[var(--muted)] space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink)] font-sans block mb-1">
                      Quick Start (Python basics required):
                    </span>
                    <p>1. git clone {repo.url}.git</p>
                    <p>2. pip install -r requirements.txt</p>
                    <p>3. python run_example.py</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  )
}
