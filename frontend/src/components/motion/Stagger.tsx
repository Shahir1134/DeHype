import React from 'react'
import { m } from 'framer-motion'
import { stagger, duration, ease, distance } from '../../motion'
import { useMotionPreference } from './useMotionPreference'

interface StaggerProps {
  children: React.ReactNode
  className?: string
}

export const Stagger: React.FC<StaggerProps> = ({ children, className = '' }) => {
  const { isReduced } = useMotionPreference()

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: isReduced ? 0.02 : stagger.delay,
        delayChildren: 0.02,
      },
    },
  }

  const childVariants = isReduced
    ? {
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: { duration: duration.reduced },
        },
      }
    : {
        hidden: { opacity: 0, y: distance },
        show: {
          opacity: 1,
          y: 0,
          transition: {
            duration: duration.base,
            ease: ease.out,
          },
        },
      }

  return (
    <m.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={className}
    >
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child
        // Limit stagger to max 6 items
        if (index >= stagger.max) {
          return child
        }
        return <m.div variants={childVariants}>{child}</m.div>
      })}
    </m.div>
  )
}
