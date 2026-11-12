import React, { useState } from 'react'
import { Cloud, Laptop, ShieldCheck, AlertCircle, Cpu, DollarSign, Database, ExternalLink } from 'lucide-react'

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

interface DataFlowToggleProps {
  statusBoardItems?: StatusBoardItem[]
}

export const DataFlowToggle: React.FC<DataFlowToggleProps> = ({ statusBoardItems = [] }) => {
  const [mode, setMode] = useState<'cloud' | 'local'>('local')
  const [modelSize, setModelSize] = useState<'small' | 'medium' | 'large'>('small')

  // Conceptual meters for SizeDial
  const sizeSpecs = {
    small: {
      name: 'Lightweight (e.g. ~3B-8B parameters)',
      capability: 68,
      hardware: 30,
      cost: 15,
      description: 'Runs on standard personal laptops and phones. Great for quick summaries, basic drafts, and offline note-taking.'
    },
    medium: {
      name: 'Mid-Tier (e.g. ~14B-32B parameters)',
      capability: 84,
      hardware: 65,
      cost: 45,
      description: 'Needs a dedicated GPU or high-RAM laptop. Solid reasoning and nuanced translation.'
    },
    large: {
      name: 'Enterprise Local (e.g. ~70B+ parameters)',
      capability: 95,
      hardware: 95,
      cost: 85,
      description: 'Requires workstation hardware or multi-GPU servers. Matches top commercial cloud models for complex logic.'
    }
  }

  const currentSize = sizeSpecs[modelSize]

  return (
    <div className="bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-5 sm:p-7 shadow-xs space-y-6">
      
      {/* Header and Mode Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--line)]">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-ink)] block">
            Data Boundary Simulation
          </span>
          <h4 className="text-base sm:text-lg font-serif font-bold text-[var(--ink)]">
            Cloud Service vs On-Device Model
          </h4>
        </div>

        {/* Cloud / Local Switch */}
        <div className="inline-flex rounded-2xl p-1 bg-[var(--surface-hover)] border border-[var(--line)]">
          <button
            onClick={() => setMode('cloud')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
              mode === 'cloud'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>Cloud AI</span>
          </button>
          <button
            onClick={() => setMode('local')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
              mode === 'local'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>On-Device (Open Weights)</span>
          </button>
        </div>
      </div>

      {/* Visual Animation Stage */}
      <div className="p-6 rounded-2xl bg-[var(--surface-hover)] border border-[var(--line)] space-y-4">
        {mode === 'cloud' ? (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between gap-3 text-center">
              {/* User Device */}
              <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--line)] flex-1">
                <Laptop className="w-6 h-6 mx-auto mb-1 text-[var(--muted)]" />
                <span className="text-xs font-bold text-[var(--ink)] block">Your Laptop</span>
                <span className="text-[10px] text-[var(--muted)]">Prompt entered</span>
              </div>

              {/* Animated Internet Line */}
              <div className="flex-1 flex flex-col items-center">
                <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 font-semibold mb-1">
                  Over public internet →
                </span>
                <div className="w-full h-1 bg-amber-400/50 rounded-full relative overflow-hidden">
                  <div className="absolute top-0 h-full w-8 bg-amber-600 rounded-full animate-[pulse_1.5s_infinite]" />
                </div>
                <span className="text-[10px] text-[var(--muted)] mt-1">Encrypted packets</span>
              </div>

              {/* Remote Cloud Datacenter */}
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex-1">
                <Cloud className="w-6 h-6 mx-auto mb-1 text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-bold text-amber-900 dark:text-amber-200 block">Tech Provider Cloud</span>
                <span className="text-[10px] text-amber-700 dark:text-amber-400">Processed on remote servers</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Data note:</strong> Your text leaves your building. Trust depends on the provider's enterprise privacy agreement and zero-retention logging guarantees.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in">
            <div className="p-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-600 text-white shrink-0">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div>
                  <h5 className="font-serif font-bold text-emerald-900 dark:text-emerald-200 text-base">
                    Local Device Perimeter Protected
                  </h5>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300">
                    Weights file resides on your internal SSD. Computation executes in local memory.
                  </p>
                </div>
              </div>

              <div className="px-3.5 py-1.5 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 text-xs font-bold tracking-wide">
                Zero Cloud Transmission
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--line)] text-xs text-[var(--muted)] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-neutral-500 mt-0.5" />
              <p className="leading-relaxed">
                <strong className="text-[var(--ink)]">Check third-party apps:</strong> An open model runs locally, but an application shell can still transmit telemetry or log data elsewhere if misconfigured. Always verify the application you use to run the model.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* SizeDial: Conceptual Meters */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              Interactive Size Dial: Model Weight Classes
            </span>
            <p className="text-xs text-[var(--muted)]">
              Conceptual meters: capability vs computer memory needed vs operating cost
            </p>
          </div>

          <div className="flex gap-1.5">
            {(['small', 'medium', 'large'] as const).map(s => (
              <button
                key={s}
                onClick={() => setModelSize(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize min-h-[36px] ${
                  modelSize === s
                    ? 'bg-[var(--accent)] text-white shadow-xs'
                    : 'bg-[var(--surface-hover)] text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--surface-hover)] border border-[var(--line)] space-y-3">
          <div className="text-xs font-bold text-[var(--ink)]">
            {currentSize.name}
          </div>
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            {currentSize.description}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {/* Capability */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-semibold text-[var(--ink)]">
                <span>Reasoning Capability</span>
                <span>{currentSize.capability}%</span>
              </div>
              <div className="h-2 rounded-full bg-[var(--line)] overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${currentSize.capability}%` }} />
              </div>
            </div>

            {/* Hardware Demand */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-semibold text-[var(--ink)]">
                <span>Computer RAM Needed</span>
                <span>{currentSize.hardware}%</span>
              </div>
              <div className="h-2 rounded-full bg-[var(--line)] overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${currentSize.hardware}%` }} />
              </div>
            </div>

            {/* Cost */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-semibold text-[var(--ink)]">
                <span>Cost to Run Locally</span>
                <span>{currentSize.cost}%</span>
              </div>
              <div className="h-2 rounded-full bg-[var(--line)] overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${currentSize.cost}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Verified Status Board (No hardcoded perishable facts!) */}
      {statusBoardItems.length > 0 && (
        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--line)] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              Verified Status Board (Updated live from verified sources)
            </span>
            <span className="text-[10px] text-[var(--muted)]">Perishable facts tracker</span>
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

      {/* Callout Notice */}
      <div className="p-3.5 rounded-2xl bg-[var(--accent-soft)] border border-[var(--accent)]/20 text-xs text-[var(--accent-ink)] font-medium">
        💡 <strong>Quick Clarity:</strong> Llama (the model weights designed by Meta) is distinct from Ollama (the open-source software app you install to run models on your computer).
      </div>
    </div>
  )
}
