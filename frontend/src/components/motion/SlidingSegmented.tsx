import React from 'react'
import { m } from 'framer-motion'
import { spring, duration } from '../../motion'
import { useMotionPreference } from './useMotionPreference'

export interface SegmentOption<T extends string> {
  id: T
  label: string
  icon?: React.ComponentType<{ className?: string }>
}

interface SlidingSegmentedProps<T extends string> {
  options: SegmentOption<T>[]
  selectedId: T
  onChange: (id: T) => void
  layoutId?: string
  className?: string
  size?: 'sm' | 'md'
}

export function SlidingSegmented<T extends string>({
  options,
  selectedId,
  onChange,
  layoutId = 'segmented-pill',
  className = '',
  size = 'md',
}: SlidingSegmentedProps<T>) {
  const { isReduced } = useMotionPreference()

  return (
    <div
      role="tablist"
      className={`inline-flex items-center bg-[var(--surface-hover)] border border-[var(--line)] rounded-full p-1 relative ${className}`}
    >
      {options.map((option) => {
        const isSelected = selectedId === option.id
        const Icon = option.icon

        return (
          <button
            key={option.id}
            role="tab"
            aria-selected={isSelected}
            onClick={() => onChange(option.id)}
            className={`relative z-10 font-semibold transition-colors flex items-center justify-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-full ${
              size === 'sm' ? 'px-3 py-1 text-xs min-h-[34px]' : 'px-4 py-1.5 text-xs sm:text-sm min-h-[40px]'
            } ${isSelected ? 'text-white' : 'text-[var(--muted)] hover:text-[var(--ink)]'}`}
          >
            {isSelected && (
              isReduced ? (
                <div
                  className="absolute inset-0 bg-[var(--accent)] rounded-full -z-10 shadow-xs"
                />
              ) : (
                <m.div
                  layoutId={layoutId}
                  className="absolute inset-0 bg-[var(--accent)] rounded-full -z-10 shadow-xs"
                  transition={spring.ui}
                />
              )
            )}
            {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
            <span className="relative z-10">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
