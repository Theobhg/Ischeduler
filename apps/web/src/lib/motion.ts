import type { MotionProps } from 'motion/react'

export const springTransition = {
  type: 'spring',
  stiffness: 400,
  damping: 25,
  mass: 0.8,
} satisfies MotionProps['transition']

export const buttonMotion: MotionProps = {
  whileTap: { scale: 0.95 },
  whileHover: { scale: 1.02 },
  transition: springTransition,
}

export const fadeUpVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      ...springTransition,
      duration: 1,
      staggerChildren: 0.06,
    },
  },
} satisfies MotionProps['variants']
