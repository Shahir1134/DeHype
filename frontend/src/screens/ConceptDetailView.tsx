import React, { useState, useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'
import { ResourceHub, ResourceItem } from '../components/ResourceHub'
import { NextWordDemo } from '../components/demos/NextWordDemo'
import { DataFlowToggle } from '../components/demos/DataFlowToggle'
import { PipelineStepper } from '../components/demos/PipelineStepper'
import { BlindTasteDemo } from '../components/demos/BlindTasteDemo'
import { PlugBoardDemo } from '../components/demos/PlugBoardDemo'
import { MultiAgentDemo } from '../components/demos/MultiAgentDemo'
import resourcesData from '../content/resources.json'
import statusBoardData from '../content/status_board.json'

import { 
  ArrowLeft, 
  Volume2, 
  Type, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Sparkles, 
  Copy, 
  Check, 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight,
  BookOpen,
  Info,
  AlertTriangle,
  Lightbulb,
  ExternalLink,
  Code,
  Sprout,
  Cpu
} from 'lucide-react'

// Step variants for the 3 depth modes
const DEPTH_STEP_VARIANTS: Record<string, Record<'brand_new' | 'basics' | 'technical', { title: string; techBadge?: string; description?: string }[]>> = {
  'chatbot-inside': {
    brand_new: [
      { title: "Words are chopped into tiny pieces", techBadge: "Word fragments (~4 letters each)", description: "When you type a prompt, the system slices your sentence into tiny digestible fragments." },
      { title: "Scores what word usually follows next", techBadge: "Pattern matching against millions of books", description: "The computer compares your sentence against patterns it studied to find what word usually comes next." },
      { title: "Picks one piece and keeps typing", techBadge: "One word at a time, repeatedly", description: "It selects one likely word, attaches it to the sentence, and repeats the cycle." },
      { title: "Sounding fluent is not the same as truth", techBadge: "Confidence without fact-checking", description: "Because it focuses on sounding natural, an answer can sound completely sure while making up a fact." }
    ],
    basics: [
      { title: "Text is broken into tokens", techBadge: "Tokenization" },
      { title: "Scores every candidate word", techBadge: "Statistical Likelihood" },
      { title: "Picks one token and repeats", techBadge: "Next-Token Prediction" },
      { title: "Pattern fluency is distinct from verified truth", techBadge: "Fluency vs Grounding" }
    ],
    technical: [
      { title: "BPE Tokenization & Embedding Space", techBadge: "BPE vocab (~128k) & d_model vector embeddings", description: "Text is tokenized via Byte-Pair Encoding and mapped into dense vector space with positional encoding." },
      { title: "Multi-Head Self-Attention (Q, K, V) & Softmax", techBadge: "Query, Key, Value dot-products & logit normalization", description: "Transformer attention heads compute dynamic affinity matrices across all positions in parallel." },
      { title: "Autoregressive Decoding (Temperature & Top-p)", techBadge: "Nucleus sampling & stochastic temperature scaling", description: "Logits are scaled by temperature and sampled autoregressively until encountering an EOS token." },
      { title: "Pretraining Manifold vs Hallucination Boundaries", techBadge: "Cross-entropy loss on web text vs alignment tuning", description: "The model optimizes for cross-entropy likelihood on training corpora rather than deterministic ground truth." }
    ]
  },
  'open-weights': {
    brand_new: [
      { title: "Cloud AI sends your text to an outside company", techBadge: "Travels over public internet", description: "Your messages travel over the internet to a third party's remote data center." },
      { title: "You can download the full model to your laptop", techBadge: "Runs 100% on your device", description: "You save the model file directly on your hard drive and run it offline." },
      { title: "You get privacy, but your computer works hard", techBadge: "Needs computer memory", description: "Running locally keeps your files private, but requires plenty of memory and manual setup." },
      { title: "Check what the creator allows you to do", techBadge: "House rules and limits", description: "Different creators set different rules on whether you can use the model commercially." }
    ],
    basics: [
      { title: "Cloud AI sends your text away", techBadge: "Cloud Data Flow" },
      { title: "Open-weight models run locally", techBadge: "Local Execution" },
      { title: "Trade-offs: privacy versus hardware demands", techBadge: "Memory & Cost Bounds" },
      { title: "Read the community license terms", techBadge: "Licensing Governance" }
    ],
    technical: [
      { title: "Remote SaaS Inference & Network Data Egress", techBadge: "Encrypted payload transmission to API cluster", description: "Prompts and completions traverse public networks into third-party infrastructure." },
      { title: "Local Inference (GGUF, AWQ, FP16/BF16)", techBadge: "Unsharded parameter tensors loaded into local VRAM", description: "Model checkpoint weights are loaded into local memory buffers using runtimes like llama.cpp or vLLM." },
      { title: "Compute Bounds: VRAM, Memory Bandwidth & Quantization", techBadge: "4-bit/8-bit integer quantization trade-offs", description: "Quantizing 16-bit floats to 4-bit integers reduces memory footprint by ~75% with minimal perplexity degradation." },
      { title: "Open Weights vs OSI Open Source: Commercial MAU Caps", techBadge: "Custom community licenses with enterprise thresholds", description: "Meta Community License grants broad weights access while enforcing commercial limits (e.g. >700M monthly active users)." }
    ]
  },
  'rag': {
    brand_new: [
      { title: "Your documents are cut into short reading cards", techBadge: "Snippets of a couple paragraphs", description: "The computer splits your long handbook into bite-sized index cards." },
      { title: "You ask your question", techBadge: "Reads what you are looking for", description: "You enter a query, and the system translates what idea you want to find." },
      { title: "A research assistant pulls the right 3 cards", techBadge: "Pulls exact relevant excerpts", description: "The search engine finds the paragraphs most related to your question and sets them on the desk." },
      { title: "AI writes the answer and shows the card page", techBadge: "Clickable source citations", description: "The AI reads only those retrieved excerpts and answers with direct page references." }
    ],
    basics: [
      { title: "Documents are chopped into chunks", techBadge: "Chunking & Fingerprints" },
      { title: "You ask a question", techBadge: "Query Matching" },
      { title: "The most relevant chunks are retrieved", techBadge: "Semantic Search" },
      { title: "AI answers using those passages with citations", techBadge: "Grounded Generation" }
    ],
    technical: [
      { title: "Document Ingestion & Semantic Vector Chunking", techBadge: "Recursive character chunking with token overlap", description: "Source documents are segmented with sliding window overlap and passed through embedding encoders." },
      { title: "Query Embedding & Vector Space Alignment", techBadge: "High-dimensional cosine coordinate space", description: "The query string is projected into the identical latent embedding space as document vectors." },
      { title: "Hybrid Search (BM25 + Dense Vectors) & Reranking", techBadge: "Dense cosine similarity + sparse BM25 + cross-encoders", description: "A vector database retrieves top-k candidates, which are rescored by a cross-encoder reranker for maximum precision." },
      { title: "Grounded Prompt Assembly & Attribution Injection", techBadge: "Strict context window injection with citation bounds", description: "Retrieved passages are bound into system prompt boundaries with instructions to cite specific document IDs." }
    ]
  },
  'evals': {
    brand_new: [
      { title: "Pick a list of practice test questions", techBadge: "A standardized mock exam", description: "Evaluators gather a folder of test questions with known good answers." },
      { title: "Have the AI take the test", techBadge: "Running through prompts", description: "The model attempts every question under fixed settings." },
      { title: "Grade the answers against an answer key", techBadge: "Calculating a score percentage", description: "Answers are scored to see how many the model answered correctly." },
      { title: "Ask if the test was fair or if questions leaked", techBadge: "Spotting cheat sheets and hype", description: "Before trusting a high score, check who ran the test and if the test questions were memorized." }
    ],
    basics: [
      { title: "A set of test questions is chosen", techBadge: "Test Set Preparation" },
      { title: "The model runs across the test set", techBadge: "Inference Execution" },
      { title: "Answers are graded against a standard", techBadge: "Automated Scoring" },
      { title: "Ask the four critical evaluation questions", techBadge: "Methodology Critique" }
    ],
    technical: [
      { title: "Curating Held-Out Test Splits with Canary Strings", techBadge: "Guarding against pretraining dataset contamination", description: "Private test splits with cryptographic canary strings prevent evaluation questions from leaking into public training scrapes." },
      { title: "Deterministic Batch Inference & Harness Runners", techBadge: "Fixed temperature (0.0), seed control & standardized prompts", description: "The evaluation harness executes test matrices across candidate model checkpoints with strict parameter reproducibility." },
      { title: "Automated Scoring: Exact Match, Code Execution & Judges", techBadge: "Pass@k, unit-test assertions & calibrated LLM-as-a-judge", description: "Outputs are evaluated via programmatic execution harnesses or LLM judges calibrated against human inter-rater reliability." },
      { title: "Mitigating Benchmark Saturation & Selection Bias", techBadge: "Elo ratings, pairwise Bradley-Terry & regression suites", description: "Evaluating performance degradation, saturated ceiling effects, and task alignment on domain-specific prompt suites." }
    ]
  },
  'mcp': {
    brand_new: [
      { title: "Your chat app asks what tools are around", techBadge: "Finds your calendar or notes", description: "Your AI app discovers what tools or files are available on your device." },
      { title: "A universal adapter connects to each tool", techBadge: "Like a USB-C plug for AI", description: "Instead of custom code for every app, one universal adapter translates tool commands." },
      { title: "The app asks your permission before touching anything", techBadge: "You stay in control of private files", description: "The AI requests your clear approval before executing actions like sending an email." },
      { title: "The tool does the job and gives the result back", techBadge: "Clean answers right in your chat", description: "The tool runs safely and hands verified data back to finish your sentence." }
    ],
    basics: [
      { title: "The AI client requests capabilities", techBadge: "Capability Discovery" },
      { title: "An MCP server sits in front of each tool", techBadge: "Universal Adapter" },
      { title: "You grant explicit permission", techBadge: "Human Authorization" },
      { title: "Results return into the context window", techBadge: "Context Ingestion" }
    ],
    technical: [
      { title: "Client-Server Handshake & Capability Negotiation", techBadge: "JSON-RPC 2.0 handshake over stdio / SSE transports", description: "Clients connect to local or remote servers, exchanging supported feature capabilities and resource schemas." },
      { title: "Protocol Adapter Architecture: Tools, Resources, Prompts", techBadge: "Decoupled server endpoints exposing typed schemas", description: "Standardized primitives expose read-only Resources, callable Tools, and templated Prompts without custom SDKs." },
      { title: "Granular Scope Authorization & Human-in-the-Loop Gates", techBadge: "Least-privilege scoping & indirect injection barriers", description: "Authorization middleware requires human consent before executing write operations, mitigating indirect prompt injection." },
      { title: "Structured Tool Execution & Context Ingestion", techBadge: "Sandboxed JSON payload deserialization into model context", description: "Execution results are parsed, validated, and appended to conversational history for subsequent reasoning." }
    ]
  },
  'multi-agent': {
    brand_new: [
      { title: "Asking one helper to do too much causes mistakes", techBadge: "One prompt gets confused by big tasks", description: "When an AI tries to research, outline, write, and check code all in one breath, errors multiply." },
      { title: "Different helpers get different specific jobs", techBadge: "One researches, one writes, one fact-checks", description: "The system creates specialized roles: a Researcher gathers facts, a Writer drafts text, and a Critic inspects for quality." },
      { title: "A team leader passes the notes between them", techBadge: "Coordinates who speaks next", description: "A coordinator agent guides the conversation, passes messages, and stops when the job is done." },
      { title: "The reviewer checks the draft before you see it", techBadge: "Independent review catches mistakes", description: "The critic agent compares the draft against your initial instructions and requests fixes before final delivery." }
    ],
    basics: [
      { title: "Complex tasks overwhelm a single prompt", techBadge: "Single-Prompt Limits" },
      { title: "Specialized roles are assigned", techBadge: "Role Specialization" },
      { title: "A supervisor orchestrates handoffs", techBadge: "Supervisor Routing" },
      { title: "Collaborative critique catches mistakes", techBadge: "Critique Loops" }
    ],
    technical: [
      { title: "Monolithic Prompt Degradation & Context Drift", techBadge: "Attention dispersion across competing objectives", description: "Forcing a single context window to handle research, synthesis, formatting, and critique degrades reasoning fidelity." },
      { title: "Role-Partitioned System Personas & Tool Scoping", techBadge: "Isolated prompt contexts and scoped tool bindings", description: "Agents are assigned distinct system prompts, private state scratchpads, and domain-scoped tool call permissions." },
      { title: "Supervisor State Graph Transitions & Message Routing", techBadge: "LangGraph / AutoGen conditional edge state machines", description: "A central supervisor state graph evaluates intermediate message state to route control flow dynamically between agent nodes." },
      { title: "Reflection Loops, Multi-Turn Critique & Stopping Bounds", techBadge: "Loop guards (k <= 3) preventing recursive divergence", description: "Critic agents evaluate outputs against explicit rubrics, enforcing termination bounds to prevent endless debate loops." }
    ]
  }
}

export interface ConceptStep {
  step_number: number
  title: string
  text: string
  stage_state: {
    highlight: string
    description: string
  }
}

export interface ConceptData {
  id: string
  title_question: string
  also_called: string
  one_liner: string
  steps: ConceptStep[]
  analogy: {
    text: string
    breaks: string
  }
  myth: {
    claim: string
    reality: string
  }
  demo: {
    type: string
    config: Record<string, any>
  }
  seen_in: string[]
  persona_examples: {
    student: string
    teacher: string
    entrepreneur: string
    engineer_office: string
  }
  quiz: {
    question: string
    options: string[]
    correct_index: number
    explanation: string
  }[]
  explain_back: {
    prompt: string
    template: string
  }
  technical: {
    bullets: string[]
    code_panel: {
      title: string
      language: string
      code: string
    }
  }
  headline_tags: string[]
  status_board_ids: string[]
  resources: string[]
}

interface ConceptDetailViewProps {
  concept: ConceptData
  onBack: () => void
  onNextConcept?: () => void
  nextConceptTitle?: string
}

export const ConceptDetailView: React.FC<ConceptDetailViewProps> = ({
  concept,
  onBack,
  onNextConcept,
  nextConceptTitle
}) => {
  const { 
    persona, 
    globalLearnDepth, 
    conceptDepthOverrides, 
    setConceptDepth, 
    setGlobalLearnDepth,
    cycleTextSize, 
    startBriefing,
    markConceptCompleted,
    openAskWithPrefill
  } = useAppStore()

  // Resolve depth: concept-level override or global
  const activeDepthSetting = conceptDepthOverrides[concept.id] || globalLearnDepth
  const depth: 'simple' | 'technical' = activeDepthSetting === 'technical' ? 'technical' : 'simple'

  // Sync depth change both locally and globally
  const handleDepthChange = (newDepth: 'brand_new' | 'basics' | 'technical') => {
    setConceptDepth(concept.id, newDepth)
    setGlobalLearnDepth(newDepth)
  }

  // Stepper state
  const [currentStepIdx, setCurrentStepIdx] = useState(0)

  // "I'm lost" simpler analogy state
  const [isLost, setIsLost] = useState(false)

  // Active persona tab in "Where you've seen it"
  const [activePersonaTab, setActivePersonaTab] = useState<string>(persona)

  // Quiz state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number | null>>({ 0: null, 1: null, 2: null })
  const [revealedQuiz, setRevealedQuiz] = useState<Record<number, boolean>>({ 0: false, 1: false, 2: false })

  // Explain back text
  const [explainBackInput, setExplainBackInput] = useState(concept.explain_back.template)
  const [copiedExplainBack, setCopiedExplainBack] = useState(false)

  // Decoded headlines state
  const [decodedHeadlines, setDecodedHeadlines] = useState<Record<number, boolean>>({})

  // Resources matching this concept
  const conceptResources = (resourcesData as ResourceItem[]).filter(r => concept.resources.includes(r.id))

  // Status board items matching this concept
  const statusItems = statusBoardData.filter(s => concept.status_board_ids.includes(s.id))

  // Sample headlines related to concept tags
  const relatedHeadlines = [
    {
      title: `New Model Release Expands Context Window and Reduces Latency`,
      decoded: `The software engineers gave the model a larger memory desk so it can read longer documents simultaneously without slowing down.`
    },
    {
      title: `Enterprise Cloud Platform Introduces Partitioned Vector Security`,
      decoded: `The company built separate locked drawers in their database so different customer files can never mix during search retrieval.`
    }
  ]

  // Audio briefing text
  const handleListen = () => {
    const text = `${concept.title_question}. In plain words: ${concept.one_liner}. Step one: ${concept.steps[0].text}. Analogy: ${concept.analogy.text}`
    startBriefing(concept.title_question, text)
  }

  // Handle quiz answer
  const handleSelectAnswer = (qIdx: number, optIdx: number) => {
    setSelectedAnswers({ ...selectedAnswers, [qIdx]: optIdx })
    setRevealedQuiz({ ...revealedQuiz, [qIdx]: true })
  }

  const handleCopyExplainBack = () => {
    navigator.clipboard.writeText(explainBackInput)
    setCopiedExplainBack(true)
    setTimeout(() => setCopiedExplainBack(false), 2000)

    // Mark completed
    const correctCount = concept.quiz.filter((q, i) => selectedAnswers[i] === q.correct_index).length
    markConceptCompleted(concept.id, correctCount, explainBackInput)
  }

  // Render the interactive demo
  const renderDemo = () => {
    switch (concept.demo.type) {
      case 'NextWordDemo':
        return <NextWordDemo />
      case 'DataFlowToggle':
        return <DataFlowToggle statusBoardItems={statusItems as any} />
      case 'PipelineStepper':
        return <PipelineStepper />
      case 'BlindTaste':
        return <BlindTasteDemo />
      case 'PlugBoard':
        return <PlugBoardDemo />
      case 'MultiAgentDemo':
        return <MultiAgentDemo statusBoardItems={statusItems as any} />
      default:
        return null
    }
  }

  return (
    <div className="max-w-[1120px] mx-auto px-4 sm:px-6 py-6 pb-36 space-y-12">
      
      {/* Sticky Top Bar */}
      <header className="sticky top-0 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-[var(--bg)]/90 backdrop-blur-md border-b border-[var(--line)] flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-[var(--surface)] border border-[var(--line)] text-[var(--muted)] hover:text-[var(--ink)] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Back to all concepts"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] block">
              Concept Walkthrough
            </span>
            <span className="text-xs sm:text-sm font-serif font-bold text-[var(--ink)] line-clamp-1">
              {concept.title_question}
            </span>
          </div>
        </div>

        {/* Controls: Depth chips, Listen, Text size */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Depth Chips */}
          <div className="flex p-0.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--line)]">
            {(['brand_new', 'basics', 'technical'] as const).map(d => {
              const label = d === 'brand_new' ? 'Brand new' : d === 'basics' ? 'Basics' : 'Technical'
              const isSelected = activeDepthSetting === d
              return (
                <button
                  key={d}
                  onClick={() => handleDepthChange(d)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all min-h-[36px] ${
                    isSelected
                      ? 'bg-[var(--accent)] text-white shadow-xs font-bold'
                      : 'text-[var(--muted)] hover:text-[var(--ink)]'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>

          {/* Listen Button */}
          <button
            onClick={handleListen}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--accent-soft)] text-[var(--accent-ink)] text-xs font-semibold hover:opacity-90 transition-opacity min-h-[44px]"
            title="Listen to 1-minute audio explanation"
          >
            <Volume2 className="w-4 h-4 text-[var(--accent)]" />
            <span className="hidden sm:inline">Listen</span>
          </button>

          {/* Text Size Cycle */}
          <button
            onClick={cycleTextSize}
            className="p-2 rounded-xl bg-[var(--surface)] border border-[var(--line)] text-[var(--muted)] hover:text-[var(--ink)] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Cycle text size"
            aria-label="Change text size"
          >
            <Type className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 1. Hook Question (Title) + 30-Second Answer */}
      <section className="bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-6 sm:p-10 shadow-xs space-y-5">
        
        {/* Dynamic Depth Mode Banner — immediately confirms the selected learning style */}
        <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in transition-all ${
          activeDepthSetting === 'brand_new'
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100'
            : activeDepthSetting === 'basics'
            ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-blue-950 dark:text-blue-100'
            : 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800 text-purple-950 dark:text-purple-100'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl shrink-0 ${
              activeDepthSetting === 'brand_new'
                ? 'bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100'
                : activeDepthSetting === 'basics'
                ? 'bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                : 'bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-100'
            }`}>
              {activeDepthSetting === 'brand_new' ? <Sprout className="w-5 h-5" /> : activeDepthSetting === 'basics' ? <BookOpen className="w-5 h-5" /> : <Cpu className="w-5 h-5" />}
            </div>
            <div>
              <div className="font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                <span>{activeDepthSetting === 'brand_new' ? '🌱 Brand New Learner Mode' : activeDepthSetting === 'basics' ? '📘 Basics & Conceptual Mode' : '⚡ Technical Architecture Mode'}</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/70 dark:bg-black/40">Active</span>
              </div>
              <p className="text-xs sm:text-sm font-medium leading-relaxed mt-0.5">
                {activeDepthSetting === 'brand_new'
                  ? 'Plain-English translation: Zero jargon, simplified step titles, and physical analogies prioritized.'
                  : activeDepthSetting === 'basics'
                  ? 'Practical concepts: Balanced everyday explanations and connections to real tools.'
                  : 'Engineering view: Component names, system topologies, and implementation code unlocked below.'}
              </p>
            </div>
          </div>

          {activeDepthSetting === 'technical' && (
            <a
              href="#technical-panel"
              className="px-3.5 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-1 shrink-0 shadow-xs min-h-[38px]"
            >
              <span>Jump to Code</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-soft)] text-[var(--accent-ink)] text-xs font-bold uppercase tracking-wider">
          <BookOpen className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span>Core Idea</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-[var(--ink)] tracking-tight leading-[1.15]">
          {concept.title_question}
        </h1>

        <div className="text-xs sm:text-sm font-medium text-[var(--muted)]">
          Also called: <span className="font-semibold text-[var(--ink)]">{concept.also_called}</span>
        </div>

        {/* 30-second one-liner */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[var(--surface-hover)] border border-[var(--line)] text-base sm:text-lg font-serif text-[var(--ink)] leading-relaxed">
          {concept.one_liner}
        </div>

        {/* Mental model preview for Brand New */}
        {activeDepthSetting === 'brand_new' && (
          <div className="p-4 rounded-2xl bg-emerald-100/50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-950 dark:text-emerald-100 space-y-1 animate-in fade-in">
            <span className="font-bold uppercase tracking-wider text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Beginner mental model:</span>
            </span>
            <p className="text-xs sm:text-sm leading-relaxed italic">
              "{concept.analogy.text}"
            </p>
          </div>
        )}
      </section>

      {/* 2. Step-Through: Desktop Scrollytelling / Mobile Swiper */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[var(--ink)]">
            How It Works, Step by Step
          </h2>
          <span className="text-xs font-semibold text-[var(--muted)]">
            Step {currentStepIdx + 1} of {concept.steps.length}
          </span>
        </div>

        {/* Step Visual Stage & Content Box */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* Visual Stage (Sticky on desktop, top on mobile) */}
          <div className="md:col-span-5 md:sticky md:top-24 p-6 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-xs space-y-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent-ink)] block">
              Stage Visualizer
            </span>

            <div className="p-5 rounded-2xl bg-[var(--surface-hover)] border border-[var(--line)] text-center min-h-[160px] flex flex-col items-center justify-center space-y-2">
              <span className="w-12 h-12 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center font-bold text-lg">
                {currentStepIdx + 1}
              </span>
              <span className="font-serif font-bold text-sm sm:text-base text-[var(--ink)]">
                {DEPTH_STEP_VARIANTS[concept.id]?.[activeDepthSetting]?.[currentStepIdx]?.title || concept.steps[currentStepIdx].title}
              </span>
              <p className="text-xs text-[var(--muted)] leading-relaxed max-w-xs">
                {concept.steps[currentStepIdx].stage_state.description}
              </p>
              {activeDepthSetting === 'technical' && DEPTH_STEP_VARIANTS[concept.id]?.technical?.[currentStepIdx]?.techBadge && (
                <div className="pt-1">
                  <span className="inline-block px-2.5 py-1 rounded-lg bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300 font-mono text-[10px] font-bold">
                    {DEPTH_STEP_VARIANTS[concept.id]?.technical?.[currentStepIdx]?.techBadge}
                  </span>
                </div>
              )}
            </div>

            {/* "I'm lost" Button */}
            <div className="pt-2">
              <button
                onClick={() => setIsLost(!isLost)}
                className="w-full py-2.5 px-3 rounded-xl bg-[var(--surface-hover)] border border-[var(--line)] text-xs font-semibold text-[var(--muted)] hover:text-[var(--ink)] transition-colors flex items-center justify-center gap-1.5 min-h-[44px]"
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                <span>{isLost ? "Hide simplified view" : "I'm lost (Show simpler analogy)"}</span>
              </button>
            </div>

            {isLost && (
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-950 dark:text-amber-200 leading-relaxed animate-in fade-in">
                💡 <strong>Simpler translation:</strong> {concept.analogy.text}
              </div>
            )}
          </div>

          {/* Stepper Navigation & Cards */}
          <div className="md:col-span-7 space-y-3">
            {concept.steps.map((st, idx) => {
              const isActive = currentStepIdx === idx
              const variant = DEPTH_STEP_VARIANTS[concept.id]?.[activeDepthSetting]?.[idx]
              const displayTitle = variant?.title || st.title
              const displayTechBadge = variant?.techBadge
              const displayText = (activeDepthSetting !== 'basics' && variant?.description) ? variant.description : st.text

              return (
                <div
                  key={st.step_number}
                  onClick={() => setCurrentStepIdx(idx)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                    isActive
                      ? 'bg-[var(--surface)] border-[var(--accent)] shadow-md ring-1 ring-[var(--accent)]/30'
                      : 'bg-[var(--surface)] border-[var(--line)] hover:border-neutral-400 opacity-80'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-ink)]">
                        Step {st.step_number}
                      </span>
                      {displayTechBadge && (
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          activeDepthSetting === 'technical'
                            ? 'bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300 font-mono'
                            : activeDepthSetting === 'brand_new'
                            ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-[var(--surface-hover)] text-[var(--muted)]'
                        }`}>
                          {displayTechBadge}
                        </span>
                      )}
                    </div>
                    {isActive && <CheckCircle2 className="w-4 h-4 text-[var(--accent)] shrink-0" />}
                  </div>

                  <h3 className="font-serif font-bold text-lg text-[var(--ink)]">
                    {displayTitle}
                  </h3>

                  <p className="text-xs sm:text-sm text-[var(--ink)] leading-relaxed">
                    {displayText}
                  </p>
                </div>
              )
            })}

            {/* Mobile Prev / Next Controls */}
            <div className="flex items-center justify-between pt-2">
              <button
                disabled={currentStepIdx === 0}
                onClick={() => setCurrentStepIdx(Math.max(0, currentStepIdx - 1))}
                className="px-4 py-2 rounded-xl bg-[var(--surface)] border border-[var(--line)] text-xs font-semibold disabled:opacity-40 min-h-[44px] flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous Step</span>
              </button>
              <button
                disabled={currentStepIdx === concept.steps.length - 1}
                onClick={() => setCurrentStepIdx(Math.min(concept.steps.length - 1, currentStepIdx + 1))}
                className="px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-xs font-semibold disabled:opacity-40 min-h-[44px] flex items-center gap-1 shadow-xs"
              >
                <span>Next Step</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* 3. Try It: Interactive Demo */}
      <section className="space-y-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-ink)] block">
            Active Learning
          </span>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[var(--ink)]">
            Try It Yourself
          </h2>
          <p className="text-xs sm:text-sm text-[var(--muted)]">
            Explore the simulation below to experience the concept in action.
          </p>
        </div>

        {renderDemo()}
      </section>

      {/* Technical Depth Panel (Visible if Technical Depth is selected) */}
      {depth === 'technical' && (
        <section id="technical-panel" className="bg-[var(--surface)] border-2 border-purple-400/80 dark:border-purple-600/80 rounded-3xl p-6 sm:p-8 shadow-md space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
              <Code className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-ink)]">
              Technical Architecture & Code
            </span>
          </div>

          <h3 className="text-xl font-serif font-bold text-[var(--ink)]">
            Under the Hood: Engineering Implementation
          </h3>

          <ul className="space-y-2 text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
            {concept.technical.bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-[var(--accent)] font-bold">•</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>

          <div className="pt-2">
            <div className="p-4 rounded-2xl bg-neutral-900 text-neutral-100 font-mono text-xs overflow-x-auto border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-neutral-400 pb-2 border-b border-neutral-800">
                <span>{concept.technical.code_panel.title}</span>
                <span className="uppercase">{concept.technical.code_panel.language}</span>
              </div>
              <pre className="leading-relaxed">
                {concept.technical.code_panel.code}
              </pre>
            </div>
          </div>
        </section>
      )}

      {/* 4. Think of It Like... (Analogy + Where it breaks + Myth) */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Analogy Card */}
        <div className="p-6 sm:p-7 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
              <Lightbulb className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              Mental Model
            </span>
          </div>

          <h3 className="text-xl font-serif font-bold text-[var(--ink)]">
            Think of it like...
          </h3>

          <p className="text-xs sm:text-sm text-[var(--ink)] leading-relaxed">
            {concept.analogy.text}
          </p>

          <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 space-y-1">
            <span className="font-bold uppercase tracking-wider block">Where this analogy breaks:</span>
            <p className="leading-relaxed">{concept.analogy.breaks}</p>
          </div>
        </div>

        {/* Common Myth Box */}
        <div className="p-6 sm:p-7 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-red-100 dark:bg-red-950 text-red-600">
              <AlertTriangle className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              Hype Buster
            </span>
          </div>

          <h3 className="text-xl font-serif font-bold text-[var(--ink)]">
            Common Myth
          </h3>

          <div className="p-3.5 rounded-xl bg-red-50/60 dark:bg-red-950/30 border border-red-200/60 dark:border-red-900/40 text-xs text-red-950 dark:text-red-200 space-y-1">
            <span className="font-bold block">The Myth:</span>
            <p className="italic">"{concept.myth.claim}"</p>
          </div>

          <div className="space-y-1 text-xs sm:text-sm text-[var(--ink)]">
            <span className="font-bold text-emerald-700 dark:text-emerald-400 block">The Reality:</span>
            <p className="leading-relaxed text-[var(--muted)]">
              {concept.myth.reality}
            </p>
          </div>
        </div>

      </section>

      {/* 5. Where You've Seen It + Persona Tabs */}
      <section className="bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] block">
            Real-World Presence
          </span>
          <h3 className="text-xl sm:text-2xl font-serif font-bold text-[var(--ink)]">
            Where You Have Already Seen This
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {concept.seen_in.map((prod, i) => (
            <div key={i} className="p-3.5 rounded-2xl bg-[var(--surface-hover)] border border-[var(--line)] text-xs text-[var(--ink)] font-medium flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-[var(--accent)] shrink-0" />
              <span>{prod}</span>
            </div>
          ))}
        </div>

        {/* Persona Tabs */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              Why it matters for your role:
            </span>
            <div className="flex gap-1.5 p-1 bg-[var(--surface-hover)] rounded-xl border border-[var(--line)]">
              {(['student', 'teacher', 'entrepreneur', 'engineer_office'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setActivePersonaTab(p)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize min-h-[32px] ${
                    activePersonaTab === p
                      ? 'bg-[var(--accent)] text-white shadow-xs'
                      : 'text-[var(--muted)] hover:text-[var(--ink)]'
                  }`}
                >
                  {p.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--accent-soft)] border border-[var(--accent)]/20 text-xs sm:text-sm text-[var(--accent-ink)] font-medium leading-relaxed">
            {concept.persona_examples[activePersonaTab as keyof typeof concept.persona_examples]}
          </div>
        </div>
      </section>

      {/* 6. Check Yourself: 3 Questions + Explain It Back */}
      <section className="bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-6 sm:p-8 shadow-xs space-y-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-ink)] block">
            Check Your Understanding
          </span>
          <h3 className="text-xl sm:text-2xl font-serif font-bold text-[var(--ink)]">
            Check Yourself
          </h3>
          <p className="text-xs sm:text-sm text-[var(--muted)]">
            Instant kind feedback to reinforce your understanding. No negative scoring.
          </p>
        </div>

        <div className="space-y-6">
          {concept.quiz.map((q, qIdx) => {
            const isRevealed = revealedQuiz[qIdx]
            const selectedOpt = selectedAnswers[qIdx]
            const isCorrect = selectedOpt === q.correct_index

            return (
              <div key={qIdx} className="p-5 rounded-2xl bg-[var(--surface-hover)] border border-[var(--line)] space-y-3">
                <span className="text-xs font-bold text-[var(--muted)] block">
                  Question {qIdx + 1} of 3
                </span>
                <h4 className="font-serif font-bold text-base text-[var(--ink)]">
                  {q.question}
                </h4>

                <div className="space-y-2">
                  {q.options.map((opt, optIdx) => {
                    const isThisSelected = selectedOpt === optIdx
                    const isThisCorrect = q.correct_index === optIdx

                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleSelectAnswer(qIdx, optIdx)}
                        className={`w-full p-3 rounded-xl border text-left text-xs sm:text-sm transition-all flex items-center justify-between gap-3 min-h-[44px] ${
                          isRevealed && isThisCorrect
                            ? 'bg-emerald-100 text-emerald-950 border-emerald-400 font-semibold'
                            : isRevealed && isThisSelected && !isCorrect
                            ? 'bg-red-50 text-red-950 border-red-300'
                            : isThisSelected
                            ? 'bg-[var(--accent-soft)] text-[var(--accent-ink)] border-[var(--accent)] font-semibold'
                            : 'bg-[var(--surface)] border-[var(--line)] text-[var(--ink)] hover:border-neutral-400'
                        }`}
                      >
                        <span>{opt}</span>
                        {isRevealed && isThisCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                        {isRevealed && isThisSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
                      </button>
                    )
                  })}
                </div>

                {isRevealed && (
                  <div className={`p-3 rounded-xl text-xs space-y-1 animate-in fade-in ${
                    isCorrect
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border border-emerald-300'
                      : 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-300'
                  }`}>
                    <span className="font-bold block">
                      {isCorrect ? '✅ Well done!' : '💡 Let’s review:'}
                    </span>
                    <p className="leading-relaxed">{q.explanation}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Explain It Back Card */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[var(--accent-soft)] border border-[var(--accent)]/30 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--accent)]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-ink)]">
              Explain It Back (Active Recall)
            </span>
          </div>

          <h4 className="font-serif font-bold text-base text-[var(--ink)]">
            {concept.explain_back.prompt}
          </h4>

          <textarea
            value={explainBackInput}
            onChange={(e) => setExplainBackInput(e.target.value)}
            rows={3}
            className="w-full p-3 rounded-xl bg-[var(--surface)] border border-[var(--line)] text-xs sm:text-sm text-[var(--ink)] leading-relaxed focus:outline-none focus:border-[var(--accent)]"
          />

          <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
            <button
              onClick={handleCopyExplainBack}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--accent)] text-white text-xs font-semibold hover:opacity-90 transition-opacity min-h-[44px] shadow-xs"
            >
              {copiedExplainBack ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedExplainBack ? 'Explanation Copied & Saved!' : 'Save & Copy My Explanation'}</span>
            </button>

            <span className="text-[11px] text-[var(--muted)]">
              Explaining in your own words creates lasting mastery.
            </span>
          </div>
        </div>
      </section>

      {/* 7. Now You Can Read This: Real Headlines Decoded */}
      <section className="bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-ink)] block">
            Media Literacy
          </span>
          <h3 className="text-xl sm:text-2xl font-serif font-bold text-[var(--ink)]">
            Now You Can Read This News
          </h3>
          <p className="text-xs sm:text-sm text-[var(--muted)]">
            Tap a headline to decode what the tech press actually means using your new mental model.
          </p>
        </div>

        <div className="space-y-3">
          {relatedHeadlines.map((hl, i) => (
            <div key={i} className="p-4 rounded-2xl bg-[var(--surface-hover)] border border-[var(--line)] space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h5 className="font-serif font-bold text-sm sm:text-base text-[var(--ink)]">
                  "{hl.title}"
                </h5>
                <button
                  onClick={() => setDecodedHeadlines({ ...decodedHeadlines, [i]: !decodedHeadlines[i] })}
                  className="px-2.5 py-1 rounded-lg bg-[var(--surface)] border border-[var(--line)] text-xs font-semibold text-[var(--accent)] hover:underline min-h-[36px] shrink-0"
                >
                  {decodedHeadlines[i] ? 'Hide translation' : 'Decode headline'}
                </button>
              </div>

              {decodedHeadlines[i] && (
                <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--line)] text-xs text-[var(--muted)] leading-relaxed animate-in fade-in">
                  <span className="font-bold text-[var(--ink)] block mb-0.5">Plain English Translation:</span>
                  <p>{hl.decoded}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 8. Go Further: Watch / Read / Build Tabs */}
      <section className="space-y-4">
        <ResourceHub resources={conceptResources} depth={depth} />
      </section>

      {/* Next Up Navigation Footer */}
      {onNextConcept && (
        <section className="p-6 rounded-3xl bg-[var(--accent-soft)] border border-[var(--accent)]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-ink)] block">
              Next in Learning Path
            </span>
            <h4 className="text-lg font-serif font-bold text-[var(--ink)]">
              {nextConceptTitle || 'Next Concept'}
            </h4>
          </div>

          <button
            onClick={onNextConcept}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[var(--accent)] text-white text-xs font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 min-h-[44px] shadow-sm shrink-0"
          >
            <span>Continue to Next Concept</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </section>
      )}

      {/* Contextual Ask Prefill Trigger Button */}
      <div className="text-center pt-4">
        <button
          onClick={() => openAskWithPrefill(`Can you explain more about "${concept.title_question}" for a ${persona}?`)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)] hover:underline min-h-[44px]"
        >
          <HelpCircle className="w-4 h-4" />
          <span>Have a question about this lesson? Ask your AI {persona} tutor</span>
        </button>
      </div>

    </div>
  )
}
