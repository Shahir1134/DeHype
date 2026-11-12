import React, { useState } from 'react'
import { CheckCircle2, AlertCircle, Copy, Check, Eye, Flag, ThumbsUp, Sparkles, HelpCircle } from 'lucide-react'

export const BlindTasteDemo: React.FC = () => {
  const [subTab, setSubTab] = useState<'blind' | 'red_flags' | 'mini_eval'>('blind')
  
  // Blind taste state
  const [voted, setVoted] = useState<'A' | 'B' | null>(null)
  
  // Red flag spotter state
  const [flagged, setFlagged] = useState<Record<string, boolean>>({})

  // MiniEval state
  const [evalTask, setEvalTask] = useState('Drafting customer email responses')
  const [copiedEval, setCopiedEval] = useState(false)

  const redFlags = [
    {
      id: 'score',
      text: 'Achieves a staggering 99.8% record score',
      explanation: 'Red Flag: Benchmark saturation. Multiple-choice tests with high scores often test memorization rather than complex reasoning.'
    },
    {
      id: 'zero',
      text: 'completely eliminating all hallucinations',
      explanation: 'Red Flag: Unsubstantiated absolute claim. All probabilistic generative models carry statistical deviation risk.'
    },
    {
      id: 'baseline',
      text: 'outperforming all previous generation models',
      explanation: 'Red Flag: Unclear comparison baseline. Did they test against default prompts, or heavily engineered few-shot chains?'
    },
    {
      id: 'public',
      text: 'evaluated directly on the popular public GSM8K dataset',
      explanation: 'Red Flag: Test set contamination. Because GSM8K is public, questions frequently leak into pretraining data.'
    }
  ]

  const copyMiniEval = () => {
    const text = `Custom 5-Question AI Evaluation Harness for: "${evalTask}"
1. Factual Precision: Does it cite only facts from my provided prompt?
2. Format Adherence: Does it follow strict bullet count and character limits?
3. Tone Calibration: Is the voice polite, professional, and free of sales fluff?
4. Edge Case Handling: How does it respond when essential information is missing?
5. Repeatability: Does running the exact prompt 3 times produce consistent quality?`
    navigator.clipboard.writeText(text)
    setCopiedEval(true)
    setTimeout(() => setCopiedEval(false), 2000)
  }

  return (
    <div className="bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-5 sm:p-7 shadow-xs space-y-6">
      
      {/* Tab Switcher */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-[var(--line)]">
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSubTab('blind')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all min-h-[36px] ${
              subTab === 'blind' ? 'bg-[var(--accent)] text-white shadow-xs' : 'bg-[var(--surface-hover)] text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            1. Blind Taste Test
          </button>
          <button
            onClick={() => setSubTab('red_flags')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all min-h-[36px] ${
              subTab === 'red_flags' ? 'bg-[var(--accent)] text-white shadow-xs' : 'bg-[var(--surface-hover)] text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            2. Benchmark Red Flag Spotter
          </button>
          <button
            onClick={() => setSubTab('mini_eval')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all min-h-[36px] ${
              subTab === 'mini_eval' ? 'bg-[var(--accent)] text-white shadow-xs' : 'bg-[var(--surface-hover)] text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            3. Build a 5-Question Eval
          </button>
        </div>
      </div>

      {/* 1. Blind Taste Test */}
      {subTab === 'blind' && (
        <div className="space-y-4">
          <div>
            <h4 className="text-base font-serif font-bold text-[var(--ink)]">
              Blind Test: Which response do you prefer?
            </h4>
            <p className="text-xs sm:text-sm text-[var(--muted)]">
              Task: Explain why a computer requires RAM to a non-technical colleague.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Model A */}
            <div className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
              voted === 'A' ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-[var(--line)] bg-[var(--surface-hover)]'
            }`}>
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] block">
                  Model A Output
                </span>
                <p className="text-xs sm:text-sm text-[var(--ink)] leading-relaxed">
                  "RAM is like the physical surface of your desk. Your hard drive is the storage filing cabinet across the room. A bigger desk lets you keep more papers open in front of you simultaneously without walking to the cabinet."
                </p>
              </div>

              <button
                onClick={() => setVoted('A')}
                className="w-full py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--line)] text-xs font-semibold hover:border-[var(--accent)] transition-all flex items-center justify-center gap-1.5 min-h-[44px]"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>Vote for Model A</span>
              </button>
            </div>

            {/* Model B */}
            <div className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
              voted === 'B' ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-[var(--line)] bg-[var(--surface-hover)]'
            }`}>
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] block">
                  Model B Output
                </span>
                <p className="text-xs sm:text-sm text-[var(--ink)] leading-relaxed">
                  "Random Access Memory (RAM) provides high-speed volatile storage directly accessible by the Central Processing Unit. Without sufficient RAM, operating systems must page memory to slower solid-state drives, introducing noticeable system latency."
                </p>
              </div>

              <button
                onClick={() => setVoted('B')}
                className="w-full py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--line)] text-xs font-semibold hover:border-[var(--accent)] transition-all flex items-center justify-center gap-1.5 min-h-[44px]"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>Vote for Model B</span>
              </button>
            </div>
          </div>

          {voted && (
            <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--line)] text-xs text-[var(--ink)] space-y-2 animate-in fade-in">
              <div className="font-bold flex items-center gap-1.5 text-[var(--accent-ink)]">
                <Sparkles className="w-4 h-4 text-[var(--accent)]" />
                <span>Reveal & Evaluation Lesson:</span>
              </div>
              <p className="leading-relaxed">
                You voted for <strong>Model {voted}</strong>. Neither response is objectively "better" in the abstract! Model A excels for beginner storytelling, while Model B satisfies technical precision.
              </p>
              <p className="text-[var(--muted)]">
                💡 <strong>Why public leaderboards conflict:</strong> A benchmark that scores purely on academic jargon will rank Model B higher, while a user satisfaction survey often crowns Model A. This is why you must test on your specific task.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 2. Red Flag Spotter */}
      {subTab === 'red_flags' && (
        <div className="space-y-4">
          <div>
            <h4 className="text-base font-serif font-bold text-[var(--ink)]">
              Red Flag Spotter: Deconstruct Hype Marketing
            </h4>
            <p className="text-xs sm:text-sm text-[var(--muted)]">
              Tap the highlighted claims in this fictional launch announcement to discover why benchmark claims can mislead.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[var(--surface-hover)] border border-[var(--line)] space-y-3 font-serif text-sm sm:text-base leading-relaxed text-[var(--ink)]">
            <p className="italic text-[11px] font-sans text-[var(--muted)] uppercase tracking-wider mb-2">
              Example (fictional) Press Release:
            </p>
            <p>
              "Today we announce ApexLLM v4.{' '}
              {redFlags.map(rf => (
                <button
                  key={rf.id}
                  onClick={() => setFlagged({ ...flagged, [rf.id]: !flagged[rf.id] })}
                  className={`inline px-1.5 py-0.5 mx-1 rounded font-sans text-xs font-bold transition-all underline decoration-dashed underline-offset-4 cursor-pointer ${
                    flagged[rf.id]
                      ? 'bg-red-500 text-white'
                      : 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 hover:bg-amber-200'
                  }`}
                  title="Click to inspect this claim"
                >
                  {rf.text}
                </button>
              ))}
              . Our revolutionary engine outperforms all industry competitors on every test."
            </p>
          </div>

          {/* Decoded explanations */}
          <div className="space-y-2">
            {redFlags.map(rf => flagged[rf.id] && (
              <div key={rf.id} className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-900 dark:text-red-200 space-y-1 animate-in fade-in">
                <div className="font-bold flex items-center gap-1.5">
                  <Flag className="w-3.5 h-3.5 text-red-600" />
                  <span>Claim: "{rf.text}"</span>
                </div>
                <p className="leading-relaxed">{rf.explanation}</p>
              </div>
            ))}
          </div>

          <div className="text-[11px] text-[var(--muted)]">
            Flags spotted: {Object.values(flagged).filter(Boolean).length} of {redFlags.length}
          </div>
        </div>
      )}

      {/* 3. MiniEval: 5-Question Builder */}
      {subTab === 'mini_eval' && (
        <div className="space-y-4">
          <div>
            <h4 className="text-base font-serif font-bold text-[var(--ink)]">
              Build Your Own 5-Question Task Evaluation Harness
            </h4>
            <p className="text-xs sm:text-sm text-[var(--muted)]">
              Never buy a subscription based on public leaderboards. Create a 5-question test specific to your everyday workflow.
            </p>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] block mb-1">
              What workflow do you need to test?
            </label>
            <input
              type="text"
              value={evalTask}
              onChange={(e) => setEvalTask(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--line)] text-xs sm:text-sm text-[var(--ink)] min-h-[44px]"
              placeholder="e.g. Summarizing client invoices, drafting quiz questions..."
            />
          </div>

          <div className="p-4 rounded-2xl bg-[var(--surface-hover)] border border-[var(--line)] space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-ink)] block">
              Your 5-Pillar Checklist for "{evalTask}":
            </span>
            <ul className="space-y-2 text-xs text-[var(--ink)]">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>1. Factual Grounding:</strong> Test on 2 sample inputs where the model must extract facts without embellishing.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>2. Format Compliance:</strong> Request exact constraints (e.g. exactly 3 bullet points, under 60 words).</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>3. Tone Appropriateness:</strong> Evaluate if the vocabulary matches your audience without sounding overly robotic or overly salesy.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>4. Edge Case Handling:</strong> Feed a deliberately ambiguous or incomplete prompt to see if the model asks for clarification instead of guessing.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>5. Repeatability:</strong> Run the exact prompt 3 times at temperature 0.2 to ensure output quality remains reliable.</span>
              </li>
            </ul>

            <div className="pt-2">
              <button
                onClick={copyMiniEval}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--accent)] text-white text-xs font-semibold hover:opacity-90 transition-opacity min-h-[44px]"
              >
                {copiedEval ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedEval ? 'Copied Evaluation Spec!' : 'Copy Evaluation Template'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
