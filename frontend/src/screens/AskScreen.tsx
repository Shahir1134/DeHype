import React, { useState, useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'
import { 
  MessageCircleQuestion, 
  Send, 
  Sparkles, 
  RefreshCw, 
  Lightbulb, 
  User, 
  Bot, 
  Key, 
  ShieldCheck, 
  X,
  Briefcase,
  GraduationCap,
  School,
  Laptop
} from 'lucide-react'

interface Message {
  id: string
  sender: 'user' | 'assistant'
  text: string
  simplerText?: string
  analogy?: string
  sourceRef?: string
}

export const AskScreen: React.FC = () => {
  const { persona, askPrefill } = useAppStore()
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('gemini_api_key') || '')
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false)
  const [tempKeyInput, setTempKeyInput] = useState('')

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState(askPrefill || '')
  const [isTyping, setIsTyping] = useState(false)
  const [showingSimpler, setShowingSimpler] = useState<Record<string, boolean>>({})

  // Update input if askPrefill changes from outside
  useEffect(() => {
    if (askPrefill) {
      setInput(askPrefill)
    }
  }, [askPrefill])

  // Update initial welcome message whenever persona changes
  useEffect(() => {
    const welcomeByRole = {
      entrepreneur: {
        text: "Hello! I am your AI Business Advisor. Ask me anything about AI tools, pricing, or capabilities—I will explain strictly through the lens of ROI, cost savings, and practical customer growth without the venture capital marketing hype.",
        analogy: "Think of me like an experienced fractional CTO who cuts through sales buzz to tell you what genuinely saves money."
      },
      student: {
        text: "Hello! I am your AI Study Coach. Ask me any question about AI concepts or study workflows. I will explain everything in clear, friendly language, and help you use AI ethically without risking plagiarism alarms.",
        analogy: "Think of me like a patient study buddy who has read every textbook in the library and explains concepts simply."
      },
      teacher: {
        text: "Hello! I am your AI Teaching Partner. Ask me anything about lesson planning, rubric drafting, or classroom AI policies. My goal is to save you hours of weekend work while preserving pedagogical integrity.",
        analogy: "Think of me like a dedicated assistant teacher who drafts your worksheets in 30 seconds."
      },
      engineer_office: {
        text: "Hello! I am your Workflow Specialist. Ask me anything about automating spreadsheets, summarizing messy threads, or connecting tools with MCP. I focus strictly on reducing manual busywork and protecting company privacy.",
        analogy: "Think of me like an automated pipeline that pre-sorts your incoming files so you only touch what matters."
      }
    }

    const currentWelcome = welcomeByRole[persona] || welcomeByRole.student
    setMessages([
      {
        id: `welcome-${persona}`,
        sender: 'assistant',
        text: currentWelcome.text,
        analogy: currentWelcome.analogy,
        sourceRef: apiKey ? 'Gemini 2.5 Flash' : 'DeHype Persona Engine'
      }
    ])
  }, [persona, apiKey])

  // Personalized starter question suggestions
  const suggestedQuestionsByRole = {
    entrepreneur: [
      'How can I use AI to cut customer support costs without alienating clients?',
      'Which models are cheapest right now for daily business tasks?',
      'Is AI hype or can it actually automate cold email sequences safely?',
      'What is an AI Agent and is it ready for real business operations?'
    ],
    student: [
      'How can I use AI to study without getting flagged for plagiarism?',
      'What is the best way to have AI quiz me on lecture slides?',
      'Can I trust AI for research papers and historical citations?',
      'What does it actually mean when people say an AI "hallucinates"?'
    ],
    teacher: [
      'How can I use AI to create a rubric and lesson plan in under 5 minutes?',
      'How do I explain AI ethics and safety to high school students?',
      'Can AI adapt a difficult reading passage for different reading levels?',
      'Are online AI plagiarism checkers reliable or do they make false accusations?'
    ],
    engineer_office: [
      'What is Model Context Protocol (MCP) and how does it connect to spreadsheets?',
      'How can I summarize 50-page PDF reports without leaking private data?',
      'What is the difference between RAG and fine-tuning in plain terms?',
      'Which daily office tasks are safest and fastest to automate with AI?'
    ]
  }

  const suggestedQuestions = suggestedQuestionsByRole[persona] || suggestedQuestionsByRole.student

  const personaBadges = {
    entrepreneur: {
      label: 'Entrepreneur Perspective',
      tagline: 'Focusing on ROI, unit economics & customer growth (Zero Hype)',
      icon: Briefcase
    },
    student: {
      label: 'Student Perspective',
      tagline: 'Focusing on coursework, citations, and exam comprehension',
      icon: GraduationCap
    },
    teacher: {
      label: 'Teacher Perspective',
      tagline: 'Focusing on lesson prep, grading relief & classroom ethics',
      icon: School
    },
    engineer_office: {
      label: 'Office & Engineer Perspective',
      tagline: 'Focusing on workflow automation, spreadsheets & data privacy',
      icon: Laptop
    }
  }

  const activeBadge = personaBadges[persona] || personaBadges.student
  const ActiveIcon = activeBadge.icon

  const handleSaveKey = () => {
    const trimmed = tempKeyInput.trim()
    setApiKey(trimmed)
    if (trimmed) {
      localStorage.setItem('gemini_api_key', trimmed)
    } else {
      localStorage.removeItem('gemini_api_key')
    }
    setIsKeyModalOpen(false)
  }

  const handleSend = async (questionText: string) => {
    if (!questionText.trim()) return

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: questionText.trim()
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    try {
      const res = await fetch('/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questionText,
          persona: persona,
          persona_id: persona,
          api_key: apiKey || undefined
        })
      })

      if (res.ok) {
        const data = await res.json()
        const botMsg: Message = {
          id: `bot-${Date.now()}`,
          sender: 'assistant',
          text: data.answer || data.plain_answer || "Here is a personalized breakdown of your question.",
          simplerText: data.simpler_answer,
          analogy: data.analogy,
          sourceRef: data.source_ref || (apiKey ? 'Gemini 2.5 Flash' : 'Persona Guidance Engine')
        }
        setMessages(prev => [...prev, botMsg])
      } else {
        throw new Error('API request failed')
      }
    } catch {
      // Graceful personalized fallback
      setTimeout(() => {
        const botMsg: Message = {
          id: `bot-${Date.now()}`,
          sender: 'assistant',
          text: `Here is the direct answer for an ${persona}: AI tools are fast pattern-matching assistants. They give you a strong first draft in seconds, but you must still provide the direction and review the result.`,
          simplerText: `Like a junior helper who types fast, but needs you to check their facts.`,
          analogy: `Think of it like an electric drill: it speeds up building the shelf, but you still measure the wall.`,
          sourceRef: 'DeHype Persona Engine'
        }
        setMessages(prev => [...prev, botMsg])
      }, 500)
    } finally {
      setIsTyping(false)
    }
  }

  const toggleSimpler = (id: string) => {
    setShowingSimpler(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="max-w-[840px] mx-auto px-4 sm:px-6 py-8 pb-28 md:pb-16 space-y-6">
      
      {/* Header & Persona Lens Banner */}
      <section className="bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)] shrink-0">
              <ActiveIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold tracking-wider text-[var(--accent-ink)]">
                  {activeBadge.label}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[var(--ink)] mt-0.5">
                Ask Anything
              </h1>
            </div>
          </div>

          {/* Gemini API Key Pill / Button */}
          <div>
            <button
              onClick={() => {
                setTempKeyInput(apiKey)
                setIsKeyModalOpen(true)
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border border-[var(--line)] bg-[var(--surface-hover)] hover:border-[var(--accent)] text-[var(--ink)] transition-colors min-h-[40px]"
            >
              <Key className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>{apiKey ? 'Gemini 2.5 Active' : 'Connect Gemini API Key'}</span>
            </button>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
          {activeBadge.tagline}. Every response is calibrated specifically for your role so you don't waste time on irrelevant technical weeds.
        </p>
      </section>

      {/* Suggested Questions by Persona */}
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span>Top Questions Asked by {activeBadge.label.replace(' Perspective', 's')}:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="text-left px-3.5 py-2.5 rounded-2xl bg-[var(--surface)] border border-[var(--line)] hover:border-[var(--accent)] text-xs text-[var(--ink)] transition-colors min-h-[44px] flex items-center gap-2 group"
            >
              <span className="text-[var(--accent)] group-hover:translate-x-0.5 transition-transform font-bold">&rsaquo;</span>
              <span className="line-clamp-2">{q}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Messages Feed */}
      <div className="space-y-4 pt-2">
        {messages.map((m) => {
          const isUser = m.sender === 'user'
          const isSimplerActive = showingSimpler[m.id]

          return (
            <div
              key={m.id}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-9 h-9 rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-5 h-5" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-3xl p-5 text-sm sm:text-base leading-relaxed space-y-3 ${
                  isUser
                    ? 'bg-[var(--accent)] text-white font-medium rounded-tr-xs'
                    : 'bg-[var(--surface)] border border-[var(--line)] text-[var(--ink)] shadow-xs rounded-tl-xs'
                }`}
              >
                <div className="whitespace-pre-line">
                  {isSimplerActive && m.simplerText ? m.simplerText : m.text}
                </div>

                {!isUser && m.analogy && (
                  <div className="p-3.5 rounded-2xl bg-[var(--accent-soft)] border border-[var(--accent)]/15 text-xs text-[var(--accent-ink)] flex items-start gap-2.5">
                    <Lightbulb className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
                    <div>
                      <strong className="block mb-0.5 uppercase tracking-wider font-semibold">
                        Analogy for {persona.replace('_', ' ')}s:
                      </strong>
                      {m.analogy}
                    </div>
                  </div>
                )}

                {!isUser && (
                  <div className="pt-1 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--muted)]">
                    {m.simplerText && (
                      <button
                        onClick={() => toggleSimpler(m.id)}
                        className="inline-flex items-center gap-1.5 font-semibold text-[var(--accent)] hover:text-[var(--accent-ink)] transition-colors min-h-[36px]"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>{isSimplerActive ? 'Show full response' : 'Explain it even simpler'}</span>
                      </button>
                    )}
                    {m.sourceRef && (
                      <span className="text-[11px] font-medium opacity-75">
                        Engine: {m.sourceRef}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-9 h-9 rounded-2xl bg-[var(--line)] text-[var(--ink)] flex items-center justify-center shrink-0 mt-1">
                  <User className="w-5 h-5" />
                </div>
              )}
            </div>
          )
        })}

        {isTyping && (
          <div className="flex gap-3 items-center">
            <div className="w-9 h-9 rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl px-4 py-3 text-xs text-[var(--muted)] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-bounce [animation-delay:0.4s]" />
              <span className="ml-1">Personalizing answer for {persona.replace('_', ' ')}...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSend(input)
        }}
        className="sticky bottom-16 md:bottom-6 z-20 flex items-center gap-2 bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-2 shadow-lg backdrop-blur-md"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask any AI question as a ${persona.replace('_', ' ')}...`}
          className="flex-1 bg-transparent px-3 py-2 text-sm sm:text-base text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none min-h-[44px]"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="p-3 rounded-xl bg-[var(--accent)] text-white hover:opacity-90 disabled:opacity-40 transition-opacity min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Send question"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Gemini API Key Modal */}
      {isKeyModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsKeyModalOpen(false)}
        >
          <div 
            className="w-full max-w-md bg-[var(--surface)] text-[var(--ink)] rounded-3xl p-6 sm:p-7 shadow-2xl border border-[var(--line)] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setIsKeyModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-[var(--surface-hover)] text-[var(--muted)] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="p-2 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
                <Key className="w-5 h-5" />
              </span>
              <span className="text-xs uppercase font-bold tracking-wider text-[var(--muted)]">
                Gemini API Connection
              </span>
            </div>

            <h3 className="text-xl font-serif font-bold text-[var(--ink)] mb-2">
              Connect Google Gemini API
            </h3>

            <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed mb-4">
              Enter your Gemini API key below to enable real-time personalized responses using Google's <strong>gemini-2.5-flash</strong> model. Your key is stored locally in your browser.
            </p>

            <div className="space-y-3">
              <input
                type="password"
                value={tempKeyInput}
                onChange={(e) => setTempKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg)] border border-[var(--line)] text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--accent)] min-h-[44px]"
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveKey}
                  className="flex-1 py-3 px-4 rounded-xl bg-[var(--accent)] text-white font-semibold text-sm hover:opacity-90 transition-opacity min-h-[44px]"
                >
                  Save API Key
                </button>
                {apiKey && (
                  <button
                    type="button"
                    onClick={() => {
                      setApiKey('')
                      setTempKeyInput('')
                      localStorage.removeItem('gemini_api_key')
                      setIsKeyModalOpen(false)
                    }}
                    className="py-3 px-4 rounded-xl border border-[var(--line)] text-xs text-[var(--muted)] hover:text-red-500 transition-colors min-h-[44px]"
                  >
                    Clear Key
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
