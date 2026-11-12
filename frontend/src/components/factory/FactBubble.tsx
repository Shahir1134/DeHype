import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getFactsForStage, type AIFact } from '../../data/aiDevFacts'

interface FactBubbleProps {
  stage: number
  className?: string
}

export const FactBubble: React.FC<FactBubbleProps> = ({ stage, className = '' }) => {
  const facts = getFactsForStage(stage)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    // Cycle facts every 8s
    const timer = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setCurrentIdx(i => (i + 1) % facts.length)
        setVisible(true)
      }, 400)
    }, 8000)
    return () => clearInterval(timer)
  }, [facts.length])

  const fact = facts[currentIdx]
  if (!fact) return null

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={fact.id}
          initial={{ opacity: 0, y: 12, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className={`relative bg-gradient-to-br from-indigo-950/90 to-blue-950/90 border border-blue-500/30 rounded-2xl p-3.5 backdrop-blur-sm ${className}`}
          style={{ boxShadow: '0 0 20px rgba(99, 102, 241, 0.15)' }}
        >
          <div className="flex items-start gap-3">
            <div className="text-xl shrink-0 mt-0.5">{fact.emoji}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-bold uppercase tracking-widest text-blue-400">💡 Did You Know?</span>
                {fact.source && (
                  <span className="text-[9px] text-slate-500 truncate">— {fact.source}</span>
                )}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{fact.fact}</p>
            </div>
          </div>

          {/* Dot indicators */}
          <div className="flex justify-center gap-1.5 mt-2.5">
            {facts.map((_, i) => (
              <button
                key={i}
                onClick={() => { setCurrentIdx(i); setVisible(true) }}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentIdx ? 'bg-blue-400 w-3' : 'bg-slate-600'}`}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
