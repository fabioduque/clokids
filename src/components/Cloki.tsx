import { motion, useReducedMotion } from 'framer-motion'
import type { ClokiPose } from '../lib/park'

// Cloki — the app's mascot: a clock-faced kid with stubby arms and legs.
// Drawn in SVG (same warm palette as the dial) and animated per pose with
// framer-motion. Poses: idle (gentle bob) · wave · walk (stepping in place) ·
// cheer (jumping, arms up) · sleep (eyes closed, zzz). Reduced-motion renders
// each pose as a still.

export interface ClokiProps {
  pose?: ClokiPose
  /** Rendered width in px (height follows the 100×132 viewBox). */
  size?: number
}

export function Cloki({ pose = 'idle', size = 96 }: ClokiProps) {
  const reduce = useReducedMotion()
  const animate = !reduce

  // Whole-body motion per pose.
  const bodyAnim =
    pose === 'cheer'
      ? { y: [0, -9, 0] }
      : pose === 'idle' || pose === 'wave'
        ? { y: [0, -2.5, 0] }
        : pose === 'walk'
          ? { y: [0, -1.5, 0, -1.5, 0] }
          : { y: 0 }
  const bodyTransition =
    pose === 'cheer'
      ? { duration: 0.7, repeat: Infinity, ease: 'easeInOut' as const }
      : pose === 'walk'
        ? { duration: 0.8, repeat: Infinity, ease: 'easeInOut' as const }
        : { duration: 1.8, repeat: Infinity, ease: 'easeInOut' as const }

  // Arms: rotate around the shoulders.
  const leftArm = pose === 'cheer' ? -150 : pose === 'walk' ? [14, -14, 14] : 12
  const rightArm =
    pose === 'cheer' ? 150 : pose === 'wave' ? [120, 160, 120] : pose === 'walk' ? [-14, 14, -14] : -12
  // Legs: stepping for walk.
  const leftLeg = pose === 'walk' ? [16, -16, 16] : 0
  const rightLeg = pose === 'walk' ? [-16, 16, -16] : 0

  const limbTransition = { duration: pose === 'wave' ? 0.9 : 0.8, repeat: Infinity, ease: 'easeInOut' as const }
  const still = { duration: 0 }

  return (
    <svg viewBox="0 0 100 132" width={size} height={(size * 132) / 100} aria-hidden className="select-none">
      <motion.g animate={animate ? bodyAnim : { y: 0 }} transition={animate ? bodyTransition : still}>
        {/* legs (behind the body) — the foot lives INSIDE the rotating group,
            so it stays attached to the leg while stepping */}
        <motion.g
          style={{ transformBox: 'view-box', transformOrigin: '43px 104px' }}
          animate={animate ? { rotate: leftLeg } : { rotate: 0 }}
          transition={animate ? limbTransition : still}
        >
          <line x1={43} y1={104} x2={43} y2={118} stroke="#D97706" strokeWidth={7} strokeLinecap="round" />
          <ellipse cx={41.5} cy={120} rx={6} ry={3.4} fill="#92400E" />
        </motion.g>
        <motion.g
          style={{ transformBox: 'view-box', transformOrigin: '57px 104px' }}
          animate={animate ? { rotate: rightLeg } : { rotate: 0 }}
          transition={animate ? limbTransition : still}
        >
          <line x1={57} y1={104} x2={57} y2={118} stroke="#D97706" strokeWidth={7} strokeLinecap="round" />
          <ellipse cx={58.5} cy={120} rx={6} ry={3.4} fill="#92400E" />
        </motion.g>

        {/* arms */}
        <motion.line
          x1={36} y1={82} x2={28} y2={96}
          stroke="#D97706" strokeWidth={6.5} strokeLinecap="round"
          style={{ transformBox: 'view-box', transformOrigin: '36px 82px' }}
          animate={animate ? { rotate: leftArm } : { rotate: typeof leftArm === 'number' ? leftArm : 12 }}
          transition={animate ? limbTransition : still}
        />
        <motion.line
          x1={64} y1={82} x2={72} y2={96}
          stroke="#D97706" strokeWidth={6.5} strokeLinecap="round"
          style={{ transformBox: 'view-box', transformOrigin: '64px 82px' }}
          animate={animate ? { rotate: rightArm } : { rotate: typeof rightArm === 'number' ? rightArm : -12 }}
          transition={animate ? limbTransition : still}
        />

        {/* body */}
        <rect x={37} y={74} width={26} height={34} rx={11} fill="#FBBF24" stroke="#D97706" strokeWidth={2.5} />
        <circle cx={50} cy={92} r={4.5} fill="#FFFDF7" opacity={0.85} />

        {/* head: a little clock */}
        <circle cx={50} cy={42} r={31} fill="#FFFDF7" stroke="#F59E0B" strokeWidth={6} />
        {[0, 90, 180, 270].map((deg) => {
          const a = (deg * Math.PI) / 180
          return (
            <line
              key={deg}
              x1={50 + 24 * Math.sin(a)} y1={42 - 24 * Math.cos(a)}
              x2={50 + 27 * Math.sin(a)} y2={42 - 27 * Math.cos(a)}
              stroke="#D97706" strokeWidth={2.5} strokeLinecap="round"
            />
          )
        })}

        {/* tiny hands = his "nose": always ten past ten, the happy clock face */}
        <line x1={50} y1={47} x2={43} y2={41} stroke="#EF4444" strokeWidth={3.4} strokeLinecap="round" />
        <line x1={50} y1={47} x2={58} y2={39} stroke="#3B82F6" strokeWidth={2.8} strokeLinecap="round" />
        <circle cx={50} cy={47} r={2.6} fill="#F59E0B" />

        {/* eyes + mouth */}
        {pose === 'sleep' ? (
          <>
            <path d="M 36 33 q 4 3 8 0" stroke="#5B3415" strokeWidth={2.4} fill="none" strokeLinecap="round" />
            <path d="M 56 33 q 4 3 8 0" stroke="#5B3415" strokeWidth={2.4} fill="none" strokeLinecap="round" />
            <path d="M 44 58 q 6 3 12 0" stroke="#5B3415" strokeWidth={2.2} fill="none" strokeLinecap="round" />
            <motion.text
              x={84} y={18} fontSize={13} fontWeight={800} fill="#5B3415" fontFamily="inherit"
              animate={animate ? { opacity: [0, 1, 0], y: [22, 12, 6] } : { opacity: 1 }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            >
              z
            </motion.text>
          </>
        ) : (
          <>
            <circle cx={40} cy={33} r={3.2} fill="#5B3415" />
            <circle cx={60} cy={33} r={3.2} fill="#5B3415" />
            <circle cx={41.2} cy={31.8} r={1} fill="#FFFFFF" />
            <circle cx={61.2} cy={31.8} r={1} fill="#FFFFFF" />
            <path
              d={pose === 'cheer' ? 'M 42 56 q 8 8 16 0' : 'M 43 57 q 7 5 14 0'}
              stroke="#5B3415" strokeWidth={2.6} fill="none" strokeLinecap="round"
            />
          </>
        )}
      </motion.g>
    </svg>
  )
}
