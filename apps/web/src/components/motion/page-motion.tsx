import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'
import { fadeUpVariants } from '@/lib/motion'

interface PageMotionProps {
  children: ReactNode
  className?: string
}

export function PageMotion({ children, className }: PageMotionProps) {
  const shouldReduceMotion = useReducedMotion()

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div className={className} variants={fadeUpVariants} initial="hidden" animate="visible">
      {children}
    </motion.div>
  )
}
