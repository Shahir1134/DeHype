import React, { useState } from 'react'
import { Plug, Layers, ShieldCheck, ShieldAlert, Check, AlertTriangle, Calendar, FileText, Mail, Terminal, GraduationCap } from 'lucide-react'

export const PlugBoardDemo: React.FC = () => {
  const [standardPlug, setStandardPlug] = useState<boolean>(true)
  
  // Permissions simulator state
  const [selectedTools, setSelectedTools] = useState<Record<string, boolean>>({
    calendar: true,
    docs: true,
    email: false,
    terminal: false,
    gradebook: false
  })

  const availableTools = [
    { id: 'calendar', name: 'Google Calendar (Read-only)', risk: 1, desc: 'Reads meeting titles to check availability' },
    { id: 'docs', name: 'Notion Documents (Read-only)', risk: 1, desc: 'Indexes shared team notes and meeting summaries' },
    { id: 'email', name: 'Email Dispatch (Write permission)', risk: 2, desc: 'Can draft and send emails on your behalf' },
    { id: 'gradebook', name: 'Student Gradebook Database', risk: 3, desc: 'Holds protected student academic evaluations' },
    { id: 'terminal', name: 'System Terminal / Shell Access', risk: 4, desc: 'Can execute system commands and modify filesystem files' }
  ]

  const totalRiskScore = Object.entries(selectedTools)
    .filter(([_, active]) => active)
    .reduce((sum, [id]) => {
      const tool = availableTools.find(t => t.id === id)
      return sum + (tool ? tool.risk : 0)
    }, 0)

  const toggleTool = (id: string) => {
    setSelectedTools({ ...selectedTools, [id]: !selectedTools[id] })
  }

  return (
    <div className="bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-5 sm:p-7 shadow-xs space-y-6">
      
      {/* 1. PlugBoard: Custom cables vs MCP Universal Standard */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--line)]">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-ink)] block">
              Protocol Comparison
            </span>
            <h4 className="text-base font-serif font-bold text-[var(--ink)]">
              Proprietary Spaghetti vs Universal Plug (MCP)
            </h4>
          </div>

          <div className="inline-flex rounded-2xl p-1 bg-[var(--surface-hover)] border border-[var(--line)]">
            <button
              onClick={() => setStandardPlug(false)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[36px] ${
                !standardPlug ? 'bg-amber-600 text-white shadow-xs' : 'text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              Proprietary Adapters (N × M)
            </button>
            <button
              onClick={() => setStandardPlug(true)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[36px] ${
                standardPlug ? 'bg-emerald-600 text-white shadow-xs' : 'text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              Universal MCP Standard
            </button>
          </div>
        </div>

        {/* Visual Stage */}
        <div className="p-6 rounded-2xl bg-[var(--surface-hover)] border border-[var(--line)] space-y-3">
          {!standardPlug ? (
            <div className="space-y-3 animate-in fade-in">
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>The Fragmented Ecosystem (Without MCP):</span>
                </div>
                <p className="text-amber-950 dark:text-amber-100 leading-relaxed">
                  Every AI provider (OpenAI, Anthropic, Google) must build and maintain distinct custom integration code for every third-party service (Slack, GitHub, Postgres, Google Drive). Connecting 5 AI apps to 10 tools requires <strong>50 separate custom connectors</strong>.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px] text-amber-800 dark:text-amber-300">
                  <span className="p-1.5 rounded bg-amber-100 dark:bg-amber-900/60 text-center">App A ⇄ Slack</span>
                  <span className="p-1.5 rounded bg-amber-100 dark:bg-amber-900/60 text-center">App B ⇄ Slack</span>
                  <span className="p-1.5 rounded bg-amber-100 dark:bg-amber-900/60 text-center">App A ⇄ GitHub</span>
                  <span className="p-1.5 rounded bg-amber-100 dark:bg-amber-900/60 text-center">App B ⇄ GitHub</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 animate-in fade-in">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-200">
                  <Plug className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>The Universal Standard (USB-C for AI):</span>
                </div>
                <p className="text-emerald-950 dark:text-emerald-100 leading-relaxed">
                  With MCP, a service creates <strong>one</strong> standard MCP server. Any AI client (Claude, Cursor, Antigravity, local scripts) snaps into it immediately using standard JSON-RPC. Connecting 5 AI apps to 10 tools now takes only <strong>10 servers</strong>.
                </p>
                <div className="p-3 rounded-lg bg-[var(--surface)] border border-emerald-400 flex items-center justify-between text-xs font-semibold text-[var(--ink)]">
                  <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                    <Check className="w-4 h-4" />
                    <span>Any AI Client</span>
                  </span>
                  <span className="px-3 py-1 rounded-full bg-emerald-600 text-white font-mono text-[11px]">
                    MCP Standard Protocol
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                    <Layers className="w-4 h-4" />
                    <span>Any Tool / Data</span>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Permissions Simulator & Risk Meter */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              Interactive Permissions Simulator
            </span>
            <p className="text-xs text-[var(--muted)]">
              Select which tools to expose to the AI. Practice the least-privilege principle.
            </p>
          </div>

          {/* Risk Meter Badge */}
          <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${
            totalRiskScore <= 2
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              : totalRiskScore <= 5
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
              : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
          }`}>
            {totalRiskScore <= 2 ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
            <span>
              Risk Level: {totalRiskScore <= 2 ? 'Low (Safe)' : totalRiskScore <= 5 ? 'Moderate' : 'Elevated'}
            </span>
          </div>
        </div>

        {/* Tool Cards Checklist */}
        <div className="space-y-2">
          {availableTools.map(tool => {
            const isChecked = !!selectedTools[tool.id]
            return (
              <button
                key={tool.id}
                onClick={() => toggleTool(tool.id)}
                className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all min-h-[44px] ${
                  isChecked
                    ? 'bg-[var(--accent-soft)] border-[var(--accent)]/40 shadow-xs'
                    : 'bg-[var(--surface-hover)] border-[var(--line)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                    isChecked ? 'bg-[var(--accent)] border-[var(--accent)] text-white' : 'border-[var(--line)] bg-[var(--surface)]'
                  }`}>
                    {isChecked && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[var(--ink)] block">
                      {tool.name}
                    </span>
                    <span className="text-[11px] text-[var(--muted)]">
                      {tool.desc}
                    </span>
                  </div>
                </div>

                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${
                  tool.risk === 1 ? 'bg-emerald-100 text-emerald-800' :
                  tool.risk === 2 ? 'bg-blue-100 text-blue-800' :
                  tool.risk === 3 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                }`}>
                  {tool.risk === 1 ? 'Safe Read' : tool.risk === 2 ? 'Write Action' : tool.risk === 3 ? 'Sensitive Data' : 'System Exec'}
                </span>
              </button>
            )
          })}
        </div>

        {/* Dynamic Safety Recommendation */}
        <div className="p-3.5 rounded-2xl bg-[var(--surface-hover)] border border-[var(--line)] text-xs text-[var(--muted)] leading-relaxed">
          {totalRiskScore > 5 ? (
            <span className="text-red-600 dark:text-red-400 font-semibold">
              ⚠️ Warning: Connecting root shell terminal or full gradebook databases without strict human approval prompts creates high exposure if the AI encounters indirect prompt injection. Disconnect high-risk tools unless actively needed.
            </span>
          ) : (
            <span>
              ✅ <strong>Best practice:</strong> Connect read-only resources (like notes or calendar views) for general assistance. Require manual confirmation prompts whenever the model wants to dispatch an email or modify records.
            </span>
          )}
        </div>
      </div>

    </div>
  )
}
