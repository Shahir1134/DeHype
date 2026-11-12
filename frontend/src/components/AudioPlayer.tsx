import React, { useEffect, useState, useRef, useMemo } from 'react'
import { useAppStore } from '../store/useAppStore'
import { 
  Play, 
  Pause, 
  X, 
  Volume2, 
  FastForward, 
  SkipBack, 
  SkipForward, 
  Sliders, 
  Sparkles, 
  ChevronDown,
  VolumeX,
  Check
} from 'lucide-react'

// Tone modes to soften the voice and remove harsh robotic AI artifacts
export type ToneMode = 'warm' | 'soft' | 'brisk'

interface ToneConfig {
  label: string
  description: string
  baseRate: number
  pitch: number
}

const TONE_PRESETS: Record<ToneMode, ToneConfig> = {
  soft: {
    label: 'Soft & Gentle',
    description: 'Calm, soothing pacing with lower gentle pitch',
    baseRate: 0.88,
    pitch: 0.94,
  },
  warm: {
    label: 'Warm & Natural',
    description: 'Friendly narrator tone, smooth and human-like',
    baseRate: 0.94,
    pitch: 0.98,
  },
  brisk: {
    label: 'Brisk & Clear',
    description: 'Crisp morning briefing style',
    baseRate: 1.05,
    pitch: 1.0,
  },
}

/**
 * Clean text so speech synthesis pronounces acronyms and sentences
 * naturally without reading symbols or awkward phonetics.
 */
function cleanTextForSpeech(text: string): string {
  if (!text) return ''
  return text
    // Replace markdown links [label](url) with label
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove bare URLs
    .replace(/https?:\/\/\S+/g, '')
    // Strip markdown symbols and bullets
    .replace(/[*_#`~>•-]/g, ' ')
    // Expand acronyms for natural conversational phonetics
    .replace(/\bAI\b/g, 'A.I.')
    .replace(/\bLLMs?\b/g, 'L.L.M.s')
    .replace(/\bRAG\b/g, 'R.A.G.')
    .replace(/\bMCP\b/g, 'M.C.P.')
    .replace(/\bAPI\b/g, 'A.P.I.')
    .replace(/\bUI\b/g, 'U.I.')
    .replace(/\be\.g\.,?\b/gi, 'for example,')
    .replace(/\bi\.e\.,?\b/gi, 'that is,')
    .replace(/\bvs\.?\b/gi, 'versus')
    .replace(/\betc\.?\b/gi, 'and so forth')
    // Smooth out hyphens and repeated punctuation
    .replace(/--+/g, ', ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Score browser voices so the softest, most natural neural voices
 * are prioritized over harsh legacy robotic ones.
 */
function scoreVoice(v: SpeechSynthesisVoice): number {
  const name = v.name.toLowerCase()
  const lang = v.lang.toLowerCase()

  if (!lang.startsWith('en')) return -100

  let score = 10
  if (name.includes('natural') || name.includes('online')) score += 80
  if (name.includes('neural')) score += 75
  if (name.includes('jenny')) score += 60
  if (name.includes('aria')) score += 55
  if (name.includes('google us english') || name.includes('google uk english female')) score += 50
  if (name.includes('samantha')) score += 40
  if (name.includes('serena')) score += 40
  if (name.includes('karen')) score += 35
  if (name.includes('guy')) score += 30

  // Penalize robotic legacy desktop voices
  if (name.includes('desktop')) score -= 40
  if (name.includes('david')) score -= 50
  if (name.includes('zira')) score -= 30
  if (name.includes('mark')) score -= 30

  return score
}

export const AudioPlayer: React.FC = () => {
  const { 
    audio, 
    pauseBriefing, 
    resumeBriefing, 
    stopBriefing, 
    setBriefingSpeed, 
    nextBriefingSentence,
    prevBriefingSentence,
  } = useAppStore()

  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>(() => {
    return localStorage.getItem('ai_news_preferred_voice_name') || ''
  })
  const [toneMode, setToneMode] = useState<ToneMode>(() => {
    return (localStorage.getItem('ai_news_preferred_tone') as ToneMode) || 'warm'
  })
  const [showSettings, setShowSettings] = useState(false)
  const [testSoundPlaying, setTestSoundPlaying] = useState(false)

  const isAdvancingRef = useRef(false)
  const audioElRef = useRef<HTMLAudioElement | null>(null)

  // 1. Load voices from browser
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return

    const loadVoices = () => {
      const vList = window.speechSynthesis.getVoices()
      if (vList && vList.length > 0) {
        setAvailableVoices(vList)
      }
    }

    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null
      }
    }
  }, [])

  // Ranked English voices
  const rankedVoices = useMemo(() => {
    return availableVoices
      .filter(v => v.lang.toLowerCase().startsWith('en'))
      .sort((a, b) => scoreVoice(b) - scoreVoice(a))
  }, [availableVoices])

  // Active voice
  const activeVoice = useMemo(() => {
    if (!rankedVoices.length) return null
    if (selectedVoiceName) {
      const match = rankedVoices.find(v => v.name === selectedVoiceName)
      if (match) return match
    }
    return rankedVoices[0] || null
  }, [rankedVoices, selectedVoiceName])

  // 2. Core speak function — Rock-solid Web Speech API with Chromium bug fixes
  const speakSentence = (
    sentenceIdx: number, 
    voiceOverride?: SpeechSynthesisVoice | null, 
    toneOverride?: ToneMode, 
    speedOverride?: number
  ) => {
    const rawText = audio.sentences[sentenceIdx]
    if (!rawText || !rawText.trim()) return

    const clean = cleanTextForSpeech(rawText)
    if (!clean) {
      nextBriefingSentence()
      return
    }

    // Stop any HTML5 audio
    if (audioElRef.current) {
      audioElRef.current.pause()
    }

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

    try {
      // Chromium fix: resume if paused
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume()
      }

      // Cancel previous speech before starting new sentence
      window.speechSynthesis.cancel()

      const utter = new SpeechSynthesisUtterance(clean)
      utter.lang = 'en-US'

      const activeTone = TONE_PRESETS[toneOverride || toneMode]
      const activeSpeed = speedOverride || audio.speed

      // Prosody tuning: soft human pace & pitch
      utter.rate = Math.min(2.0, Math.max(0.6, activeTone.baseRate * activeSpeed))
      utter.pitch = activeTone.pitch
      utter.volume = 1.0

      const vToUse = voiceOverride !== undefined ? voiceOverride : activeVoice
      if (vToUse) {
        utter.voice = vToUse
      }

      // Chromium GC bug fix: keep reference on window
      ;(window as any).__briefingUtterance = utter

      utter.onend = () => {
        ;(window as any).__briefingUtterance = null
        if (!isAdvancingRef.current) {
          nextBriefingSentence()
        }
      }

      utter.onerror = (e) => {
        ;(window as any).__briefingUtterance = null
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
          console.warn('Speech synthesis note:', e.error)
          nextBriefingSentence()
        }
      }

      // Speak directly and synchronously
      window.speechSynthesis.speak(utter)
    } catch (err) {
      console.warn('SpeechSynthesis error:', err)
    }
  }

  // 3. Play when isPlaying or sentence index changes
  useEffect(() => {
    if (audio.isPlaying && audio.sentences.length > 0) {
      speakSentence(audio.currentSentenceIdx)
    } else {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
      if (audioElRef.current) {
        audioElRef.current.pause()
      }
    }

    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [audio.isPlaying, audio.currentSentenceIdx])

  // Stop everything
  const handleStop = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    stopBriefing()
  }

  // Voice change
  const handleVoiceChange = (voiceName: string) => {
    setSelectedVoiceName(voiceName)
    localStorage.setItem('ai_news_preferred_voice_name', voiceName)
    const newV = rankedVoices.find(v => v.name === voiceName) || null
    if (audio.isPlaying) {
      speakSentence(audio.currentSentenceIdx, newV, toneMode, audio.speed)
    }
  }

  // Tone change
  const handleToneChange = (mode: ToneMode) => {
    setToneMode(mode)
    localStorage.setItem('ai_news_preferred_tone', mode)
    if (audio.isPlaying) {
      speakSentence(audio.currentSentenceIdx, activeVoice, mode, audio.speed)
    }
  }

  // Next / Prev
  const handleNext = () => {
    isAdvancingRef.current = true
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    nextBriefingSentence()
  }

  const handlePrev = () => {
    isAdvancingRef.current = true
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    prevBriefingSentence()
  }

  // Speed toggle
  const toggleSpeed = () => {
    const speeds = [0.9, 1.0, 1.2, 1.4]
    const nextIdx = (speeds.indexOf(audio.speed) + 1) % speeds.length
    const newSpeed = speeds[nextIdx] || 1.0
    setBriefingSpeed(newSpeed)
    if (audio.isPlaying) {
      speakSentence(audio.currentSentenceIdx, activeVoice, toneMode, newSpeed)
    }
  }

  // One-click sound verification test button
  const handleTestSpeaker = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    setTestSoundPlaying(true)
    window.speechSynthesis.cancel()
    if (window.speechSynthesis.paused) window.speechSynthesis.resume()

    const utter = new SpeechSynthesisUtterance("Hello! Your audio briefing voice is active.")
    utter.lang = 'en-US'
    if (activeVoice) utter.voice = activeVoice
    utter.rate = 0.92
    utter.pitch = 0.98
    utter.volume = 1.0
    utter.onend = () => setTestSoundPlaying(false)
    utter.onerror = () => setTestSoundPlaying(false)
    window.speechSynthesis.speak(utter)
  }

  if (!audio.sentences.length && !audio.isPlaying) return null

  const progressPercent = audio.sentences.length > 0
    ? Math.round(((audio.currentSentenceIdx + 1) / audio.sentences.length) * 100)
    : 0

  const friendlyVoiceLabel = activeVoice
    ? activeVoice.name.replace(/(Microsoft|Google|Apple|Desktop|Online|Natural|\(Natural\))/gi, '').trim()
    : 'Soft Voice'

  return (
    <div className="fixed bottom-16 sm:bottom-4 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-xl animate-in slide-in-from-bottom duration-300">
      <div className="bg-[var(--surface)] text-[var(--ink)] rounded-2xl p-3 sm:p-4 shadow-2xl border border-[var(--line)] backdrop-blur-md">
        
        {/* Progress bar */}
        <div className="w-full bg-[var(--line)] h-1.5 rounded-full overflow-hidden mb-2.5">
          <div 
            className="bg-[var(--accent)] h-full transition-all duration-300 rounded-full" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Top meta row: Title + Sentence indicator + Voice Pill + Speaker Test */}
        <div className="flex items-center justify-between text-xs mb-2">
          <div className="flex items-center gap-1.5 text-[var(--accent-ink)] font-semibold uppercase tracking-wider">
            <Volume2 className="w-3.5 h-3.5 animate-pulse text-[var(--accent)]" />
            <span className="truncate max-w-[180px] sm:max-w-[260px]">
              {audio.title || 'Audio Briefing'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[var(--muted)] font-mono">
              {audio.currentSentenceIdx + 1}/{audio.sentences.length}
            </span>

            {/* Test Voice Button */}
            <button
              onClick={handleTestSpeaker}
              disabled={testSoundPlaying}
              className="px-2 py-0.5 rounded-full text-[11px] border border-[var(--line)] text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--accent)] transition-colors flex items-center gap-1"
              title="Test if sound is coming out of your speakers"
            >
              <Volume2 className="w-3 h-3 text-[var(--accent)]" />
              <span>{testSoundPlaying ? 'Speaking...' : 'Test Sound'}</span>
            </button>

            {/* Voice & Tone Quick Pill */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] bg-[var(--accent-soft)] text-[var(--accent-ink)] font-medium hover:opacity-80 transition-opacity"
              title="Click to customize soft voice & tone"
            >
              <Sparkles className="w-3 h-3 text-[var(--accent)]" />
              <span className="truncate max-w-[90px] sm:max-w-[130px]">
                {friendlyVoiceLabel || 'Soft Voice'}
              </span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showSettings ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Current sentence text view */}
        <div className="bg-[var(--surface-hover)] rounded-xl px-3.5 py-2.5 mb-3 border border-[var(--line)]/50">
          <p className="text-xs sm:text-sm text-[var(--ink)] font-medium leading-relaxed">
            {audio.sentences[audio.currentSentenceIdx] || audio.title}
          </p>
        </div>

        {/* Settings Drawer (Voice & Tone Tuning) */}
        {showSettings && (
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl p-3 mb-3 text-xs space-y-3 animate-in fade-in duration-200 shadow-inner">
            <div className="flex items-center justify-between font-semibold text-[var(--ink)]">
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[var(--accent)]" />
                Soft Human Voice Calibration
              </span>
              <button 
                onClick={() => setShowSettings(false)}
                className="text-[var(--muted)] hover:text-[var(--ink)] font-medium"
              >
                Done
              </button>
            </div>

            {/* Tone Selector */}
            <div>
              <label className="block text-[11px] font-medium text-[var(--muted)] mb-1">
                Tone & Cadence (Removes Robotic AI Feel)
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(Object.keys(TONE_PRESETS) as ToneMode[]).map((mode) => {
                  const preset = TONE_PRESETS[mode]
                  const isActive = toneMode === mode
                  return (
                    <button
                      key={mode}
                      onClick={() => handleToneChange(mode)}
                      className={`p-1.5 rounded-lg border text-left transition-colors ${
                        isActive 
                          ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-ink)] font-semibold' 
                          : 'border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--muted)]'
                      }`}
                    >
                      <div className="text-[11px] font-bold">{preset.label}</div>
                      <div className="text-[9px] opacity-75 truncate">{preset.description}</div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Voice Dropdown */}
            {rankedVoices.length > 0 && (
              <div>
                <label className="block text-[11px] font-medium text-[var(--muted)] mb-1">
                  Narrator Voice (Top neural voices listed first)
                </label>
                <select
                  value={activeVoice?.name || ''}
                  onChange={(e) => handleVoiceChange(e.target.value)}
                  className="w-full bg-[var(--surface)] border border-[var(--line)] text-[var(--ink)] text-xs rounded-lg p-2 focus:outline-none focus:border-[var(--accent)]"
                >
                  {rankedVoices.map((v) => {
                    const isNatural = /natural|online|neural|google|jenny|aria|samantha/i.test(v.name)
                    return (
                      <option key={v.name} value={v.name}>
                        {isNatural ? '✨ ' : ''}{v.name} ({v.lang})
                      </option>
                    )
                  })}
                </select>
                <p className="text-[10px] text-[var(--muted)] mt-1.5">
                  Tip: On Windows, voices marked with &quot;Natural&quot; or &quot;Google&quot; produce the softest human sound.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Main playback control bar */}
        <div className="flex items-center justify-between gap-2">
          
          {/* Sentence Stepper & Play/Pause */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrev}
              disabled={audio.currentSentenceIdx === 0}
              className="p-2 rounded-full hover:bg-[var(--surface-hover)] text-[var(--muted)] disabled:opacity-30 transition-opacity min-h-[38px] min-w-[38px] flex items-center justify-center"
              aria-label="Previous sentence"
              title="Previous sentence"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={audio.isPlaying ? pauseBriefing : resumeBriefing}
              className="w-10 h-10 rounded-full bg-[var(--accent)] text-white flex items-center justify-center shrink-0 shadow-sm hover:opacity-90 transition-opacity min-h-[44px] min-w-[44px]"
              aria-label={audio.isPlaying ? 'Pause briefing' : 'Play briefing'}
            >
              {audio.isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>

            <button
              onClick={handleNext}
              disabled={audio.currentSentenceIdx >= audio.sentences.length - 1}
              className="p-2 rounded-full hover:bg-[var(--surface-hover)] text-[var(--muted)] disabled:opacity-30 transition-opacity min-h-[38px] min-w-[38px] flex items-center justify-center"
              aria-label="Next sentence"
              title="Next sentence"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Right action controls: Speed, Tone, Close */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={toggleSpeed}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[var(--surface-hover)] text-[var(--muted)] hover:text-[var(--ink)] transition-colors min-h-[36px] flex items-center gap-1"
              aria-label="Change playback speed"
              title="Change speed"
            >
              <FastForward className="w-3.5 h-3.5" />
              {audio.speed}x
            </button>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center ${
                showSettings 
                  ? 'bg-[var(--accent-soft)] text-[var(--accent-ink)]' 
                  : 'hover:bg-[var(--surface-hover)] text-[var(--muted)]'
              }`}
              aria-label="Adjust voice settings"
              title="Voice settings"
            >
              <Sliders className="w-4 h-4" />
            </button>

            <button
              onClick={handleStop}
              className="p-2 rounded-full hover:bg-[var(--surface-hover)] text-[var(--muted)] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close audio briefing"
              title="Close player"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
