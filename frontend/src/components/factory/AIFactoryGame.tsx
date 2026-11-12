import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useFactoryStore } from '../../store/useFactoryStore'
import { ModelCrystal } from './ModelCrystal'
import { ModelMonitor } from './ModelMonitor'
import { StageProgress } from './StageProgress'

import { Stage1Collect } from './stages/Stage1Collect'
import { Stage2Clean } from './stages/Stage2Clean'
import { Stage3Train } from './stages/Stage3Train'
import { Stage4Polish } from './stages/Stage4Polish'
import { Stage5Exam } from './stages/Stage5Exam'
import { Stage6Release } from './stages/Stage6Release'

const STAGE_TITLES = [
  'Stage 1: Collect Data Sources',
  'Stage 2: Clean and Filter Data',
  'Stage 3: Train Neural Weights',
  'Stage 4: Polish & Align Behaviour',
  'Stage 5: Comprehensive Exam',
  'Stage 6: Deployment & Evaluation',
]

interface AIFactoryGameProps {
  onExitFullscreen?: () => void
}

export const AIFactoryGame: React.FC<AIFactoryGameProps> = ({ onExitFullscreen }) => {
  const {
    currentStage,
    stageComplete,
    dataQuality,
    generalization,
    alignment,
    archetype,
    quickMode,
    isFullScreen,
    setIsFullScreen,
    setQuickMode,
    resetGame,
  } = useFactoryStore()

  const [mobileTab, setMobileTab] = useState<'factory' | 'monitor'>('factory')

  const renderStage = () => {
    switch (currentStage) {
      case 0:
        return <Stage1Collect />
      case 1:
        return <Stage2Clean />
      case 2:
        return <Stage3Train />
      case 3:
        return <Stage4Polish />
      case 4:
        return <Stage5Exam />
      case 5:
        return <Stage6Release />
      default:
        return <Stage1Collect />
    }
  }

  const overallHealth = Math.round((dataQuality + generalization + alignment) / 3)

  // Fullscreen container classes (always captures full screen when launched from start button)
  const containerClasses = 'fixed inset-0 z-50 w-screen h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200'

  return (
    <div className={containerClasses}>
      {/* Top Header Bar */}
      <header className="px-5 py-3 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-base">
            🏭
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-white tracking-wide">
                AI Factory Simulation
              </h1>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Interactive Arena
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {STAGE_TITLES[currentStage]}
            </p>
          </div>
        </div>

        {/* Center: Stage Stepper */}
        <div className="hidden md:block">
          <StageProgress currentStage={currentStage} stageComplete={stageComplete} />
        </div>

        {/* Right Tools / Stats */}
        <div className="flex items-center gap-2.5">
          {/* Quick Mode Toggle */}
          <button
            onClick={() => setQuickMode(!quickMode)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 ${
              quickMode
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title="Skips data collection and jumps straight to training"
          >
            <span>⚡ Quick Mode</span>
            {quickMode && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />}
          </button>

          {/* Reset button */}
          <button
            onClick={() => resetGame()}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700 text-xs font-mono"
            title="Reset Simulation"
          >
            ↺ Reset
          </button>

          {/* Close / Exit Button */}
          <button
            onClick={() => {
              if (onExitFullscreen) onExitFullscreen()
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-mono flex items-center gap-1.5 cursor-pointer"
            title="Exit game to Learn menu"
          >
            <span>✕ Close Game</span>
          </button>

          {/* Health Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700">
            <span className="text-[11px] text-slate-400">Health:</span>
            <span
              className={`text-xs font-bold ${
                overallHealth > 60 ? 'text-emerald-400' : overallHealth > 35 ? 'text-amber-400' : 'text-rose-400'
              }`}
            >
              {overallHealth}%
            </span>
          </div>
        </div>
      </header>

      {/* Mobile Stepper & Tabs */}
      <div className="md:hidden px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
        <StageProgress currentStage={currentStage} stageComplete={stageComplete} />
        <div className="flex rounded-lg bg-slate-800 p-0.5 text-xs">
          <button
            onClick={() => setMobileTab('factory')}
            className={`px-2.5 py-1 rounded-md ${mobileTab === 'factory' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400'}`}
          >
            Factory
          </button>
          <button
            onClick={() => setMobileTab('monitor')}
            className={`px-2.5 py-1 rounded-md ${mobileTab === 'monitor' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400'}`}
          >
            Monitor
          </button>
        </div>
      </div>

      {/* Main Split Body: full height flex */}
      <div className="flex-1 flex flex-col md:flex-row relative overflow-hidden">
        {/* Left Side: Factory Floor (Stage UI) */}
        <main
          className={`flex-1 flex flex-col bg-slate-950/90 md:border-r border-slate-800/80 relative z-10 overflow-y-auto ${
            mobileTab === 'monitor' ? 'hidden md:flex' : 'flex'
          }`}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStage}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col min-h-0"
            >
              {renderStage()}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Right Side: Live Model Monitor + Lightweight Neural Core */}
        <aside
          className={`w-full md:w-[360px] lg:w-[400px] flex-shrink-0 bg-slate-900/60 flex flex-col relative overflow-hidden ${
            mobileTab === 'factory' ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Top: Lightweight Neural Mind Core */}
          <div className="h-44 sm:h-48 w-full relative border-b border-slate-800/80 flex flex-col shrink-0 overflow-hidden">
            <ModelCrystal
              dataQuality={dataQuality}
              generalization={generalization}
              alignment={alignment}
              stage={currentStage}
              archetype={archetype}
              isAnimating={currentStage === 2}
            />
          </div>

          {/* Bottom: Live Telemetry & Metrics HUD */}
          <div className="flex-1 overflow-y-auto">
            <ModelMonitor />
          </div>
        </aside>
      </div>

      {/* Footer Bar */}
      <footer className="px-5 py-2 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 z-10 shrink-0">
        <span>Simplified Simulation · DeHype Platform</span>
        <span>Every decision transforms the final neural weights</span>
      </footer>
    </div>
  )
}
