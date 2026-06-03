import { motion, useReducedMotion } from 'framer-motion'
import type { Mission } from '../lib/missions'

// The mission's little stage: a kid on the left, the destination on the right.
// Idle: the kid bobs gently, waiting. Correct answer: they walk across the
// stage to the destination (sparkle on arrival). Wrong: a small head-shake.
// All emoji + motion — no asset pipeline — but it turns the question into a
// tiny story instead of a quiz row.

export type MissionOutcome = 'idle' | 'correct' | 'wrong'

export function MissionScene({ mission, outcome }: { mission: Mission; outcome: MissionOutcome }) {
  const reduce = useReducedMotion()
  return (
    <div
      className="relative h-12 w-full shrink-0 overflow-hidden rounded-2xl border border-cardline/70 bg-gradient-to-b from-white/25 to-amber-200/45 backdrop-blur-sm sm:h-16"
      aria-hidden
    >
      {/* the ground */}
      <div className="absolute inset-x-0 bottom-0 h-2.5 bg-gradient-to-b from-amber-300/80 to-amber-400/90" />

      {/* destination: wiggles happily when the kid arrives */}
      <motion.span
        className="absolute bottom-2 right-3 text-3xl sm:text-4xl"
        animate={
          outcome === 'correct' && !reduce ? { rotate: [0, -8, 8, -4, 0], scale: [1, 1.15, 1] } : { rotate: 0, scale: 1 }
        }
        transition={{ duration: 0.6, delay: 1.2 }}
      >
        {mission.emoji}
      </motion.span>

      {/* arrival sparkle */}
      {outcome === 'correct' && !reduce && (
        <motion.span
          className="absolute bottom-9 right-2 text-xl"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 0], scale: [0.5, 1.3, 0.8], y: -10 }}
          transition={{ duration: 1, delay: 1.2 }}
        >
          ✨
        </motion.span>
      )}

      {/* the kid */}
      <motion.span
        className="absolute bottom-2 text-3xl sm:text-4xl"
        initial={false}
        animate={
          reduce
            ? { left: outcome === 'correct' ? '72%' : '5%' }
            : outcome === 'correct'
              ? { left: '72%', y: [0, -4, 0, -4, 0, -4, 0], rotate: [0, 6, -6, 6, -6, 0] }
              : outcome === 'wrong'
                ? { left: '5%', x: [0, -5, 5, -3, 3, 0] }
                : { left: '5%', y: [0, -3, 0] }
        }
        transition={
          outcome === 'correct'
            ? { duration: 1.3, ease: 'easeInOut' }
            : outcome === 'wrong'
              ? { duration: 0.45 }
              : { duration: 1.6, repeat: Infinity, ease: 'easeInOut' }
        }
      >
        🧒
      </motion.span>
    </div>
  )
}
