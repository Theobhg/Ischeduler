import type { MotionProps } from 'motion/react'

/**
 * Shared spring transition used across all animated elements.
 *
 * Tuned for a snappy but not bouncy feel:
 * - `stiffness: 400` — fast response to movement.
 * - `damping: 25`    — moderate friction; settles quickly without oscillation.
 * - `mass: 0.8`      — slightly lighter than default for a crisp snap.
 */
export const springTransition = {
  type: 'spring',
  stiffness: 400,
  damping: 25,
  mass: 0.8,
} satisfies MotionProps['transition']

/**
 * Motion props applied to every `<Button>` that does not opt out via `noMotion`.
 *
 * - `whileHover: scale(1.02)` — subtle lift on hover.
 * - `whileTap:   scale(0.95)` — satisfying press-down effect.
 *
 * Uses `springTransition` so the scale snaps back naturally.
 *
 * @example
 * ```tsx
 * // Applied automatically inside button.tsx:
 * <motion.button {...buttonMotion} />
 *
 * // Override per-instance to disable:
 * <Button noMotion />
 * ```
 */
export const buttonMotion: MotionProps = {
  whileTap: { scale: 0.95 },
  whileHover: { scale: 1.02 },
  transition: springTransition,
}

/**
 * Framer Motion variants for page-level fade-up entrance animations.
 *
 * Used by `<PageMotion>` to animate the full page content when a route mounts.
 *
 * - `hidden`  — fully transparent, shifted 16px downward.
 * - `visible` — fully opaque at natural position; children stagger by 60 ms.
 *
 * @example
 * ```tsx
 * <motion.div variants={fadeUpVariants} initial="hidden" animate="visible">
 *   {children}
 * </motion.div>
 * ```
 */
export const fadeUpVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      ...springTransition,
      staggerChildren: 0.06,
    },
  },
} satisfies MotionProps['variants']
