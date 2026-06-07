import { useRef, useId } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { angles, split, mod1440, minuteDragTotal } from '../lib/timeModel'
import { pointerToDegrees } from './clockGeom'

export interface AnalogClockProps {
  total: number // minutes from midnight
  size?: number // px
  show24?: boolean // render the inner 24h numbers
  showMinuteHelp?: boolean // render blue minute values (5, 10, 15…) inside the hour numbers
  step?: number // snap step (minutes) for the minute hand; if omitted -> not interactive
  onChange?: (total: number) => void
  seconds?: number | null // 0–59; when a number, draw a thin seconds hand (ticks)
  highlightRange?: { from: number; to: number } | null // hour positions 1..12; draws a translucent red wedge spanning that hour range
}

const VB = 200
const C = VB / 2

function polar(r: number, deg: number): { x: number; y: number } {
  const a = (deg * Math.PI) / 180
  return { x: C + r * Math.sin(a), y: C - r * Math.cos(a) }
}

export function AnalogClock({ total, size = 280, show24 = true, showMinuteHelp = false, step, onChange, seconds, highlightRange }: AnalogClockProps) {
  const { hour, minute } = angles(total)

  // Hands are drawn pointing straight up (angle 0); the surrounding <motion.g>
  // rotates them to the real angle. This keeps the geometry contract identical
  // (lengths/tails) while letting us ease discrete changes without spinning the
  // long way across the 0/360 boundary.
  const minuteEnd = polar(64, 0)
  const minuteTail = polar(14, 180)
  const hourEnd = polar(44, 0)
  const hourTail = polar(12, 180)

  // Optional seconds hand: thin, reaches near the rim, ticks (no easing).
  const hasSeconds = typeof seconds === 'number'
  const secDeg = hasSeconds ? ((seconds as number) % 60) * 6 : 0
  const secEnd = polar(78, secDeg)
  const secTail = polar(18, secDeg + 180)

  const svgRef = useRef<SVGSVGElement | null>(null)
  const dragging = useRef<'hour' | 'minute' | null>(null)
  const interactive = typeof step === 'number' && !!onChange

  const reduce = useReducedMotion()

  // Accumulate a CONTINUOUS rotation per hand so framer-motion always takes the
  // short path (e.g. 358° -> 2° eases +4°, not -356°). We keep the previous
  // *displayed* rotation and add the shortest signed delta toward the target.
  const hourRot = useRef(hour)
  const minuteRot = useRef(minute)
  const shortStep = (prev: number, target: number) => {
    const d = (target - (prev % 360) + 540) % 360 - 180 // shortest signed delta
    return prev + d
  }
  hourRot.current = shortStep(hourRot.current, hour)
  minuteRot.current = shortStep(minuteRot.current, minute)

  // Instant while dragging (or reduced motion); gentle ease for discrete changes.
  const handTransition = dragging.current || reduce
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 170, damping: 20, mass: 0.6 }

  // Unique ids so multiple clocks on one page (quiz grid) don't collide.
  const uid = useId()
  const shadowId = `${uid}-shadow`
  const fillId = `${uid}-fill`

  function svgPoint(e: React.PointerEvent): { x: number; y: number } {
    const svg = svgRef.current!
    const rect = svg.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * VB,
      y: ((e.clientY - rect.top) / rect.height) * VB,
    }
  }

  function applyAngle(deg: number) {
    if (dragging.current === 'minute') {
      const raw = Math.round(deg / 6)
      let m = Math.round(raw / step!) * step!
      m = ((m % 60) + 60) % 60
      onChange!(minuteDragTotal(total, m))
    } else if (dragging.current === 'hour') {
      const h = Math.round(deg / 30) % 12
      onChange!(mod1440(h * 60 + split(total).minute))
    }
  }

  function onPointerDown(which: 'hour' | 'minute') {
    return (e: React.PointerEvent) => {
      if (!interactive) return
      dragging.current = which
      ;(e.target as Element).setPointerCapture(e.pointerId)
    }
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!interactive || !dragging.current) return
    const p = svgPoint(e)
    applyAngle(pointerToDegrees(p.x, p.y, C, C))
  }
  function onPointerUp(e: React.PointerEvent) {
    dragging.current = null
    ;(e.target as Element).releasePointerCapture?.(e.pointerId)
  }
  function tapHour(n: number) {
    if (!interactive) return
    const cur = split(total)
    onChange!(mod1440((n % 12) * 60 + cur.minute))
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${VB} ${VB}`}
      width="100%"
      height="100%"
      style={{ maxWidth: size, maxHeight: size }}
      role="img"
      aria-label="Relógio analógico"
      className="block h-full w-full select-none touch-none"
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <defs>
        {/* soft, warm drop shadow under the whole face */}
        <filter id={shadowId} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#92400E" floodOpacity="0.18" />
        </filter>
        {/* gentle cream-to-warm radial so the face has depth, not a flat fill */}
        <radialGradient id={fillId} cx="50%" cy="42%" r="62%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="68%" stopColor="#FFFDF7" />
          <stop offset="100%" stopColor="#FEF3E2" />
        </radialGradient>
      </defs>

      {/* face: cream fill + orange ring */}
      <g filter={`url(#${shadowId})`}>
        <circle cx={C} cy={C} r={94} fill={`url(#${fillId})`} stroke="#F59E0B" strokeWidth={7} />
      </g>
      {/* subtle inner highlight ring for a polished, layered look */}
      <circle cx={C} cy={C} r={88} fill="none" stroke="#FDE9C8" strokeWidth={1.5} />

      {/* optional translucent red wedge spanning a from→to range (Aprender
          wizard, Missões interval). Positions are clock positions 1..12 and may
          be fractional (minute-hand positions = minute/5). Drawn EARLY so ticks,
          numbers and hands render on top and stay readable. R sits just inside
          the orange ring; sweep-flag 1 goes clockwise and the large-arc flag
          kicks in past 180° so long waits (e.g. 40 min) fill the right slice. */}
      {highlightRange &&
        (() => {
          const R = 84
          const a = polar(R, highlightRange.from * 30)
          const b = polar(R, highlightRange.to * 30)
          const sweep = (((highlightRange.to - highlightRange.from) * 30) % 360 + 360) % 360
          const largeArc = sweep > 180 ? 1 : 0
          return (
            <path
              d={`M ${C} ${C} L ${a.x} ${a.y} A ${R} ${R} 0 ${largeArc} 1 ${b.x} ${b.y} Z`}
              fill="#EF4444"
              opacity={0.16}
              pointerEvents="none"
            />
          )
        })()}

      {/* minute ticks */}
      {Array.from({ length: 60 }, (_, m) => {
        const big = m % 5 === 0
        const p1 = polar(big ? 85 : 89, m * 6)
        const p2 = polar(92, m * 6)
        return (
          <line
            key={m}
            x1={p1.x}
            y1={p1.y}
            x2={p2.x}
            y2={p2.y}
            stroke={big ? '#D97706' : '#FBBF24'}
            strokeWidth={big ? 2.5 : 1}
            strokeLinecap="round"
          />
        )
      })}

      {/* hour numbers (outer) + optional inner rings: blue minute values
          (5, 10, 15… — the colour of the minute hand) and/or orange 24h numbers.
          When BOTH helpers are on, minutes keep the r50 ring and the 24h ring
          tucks deeper so they never overlap. */}
      {Array.from({ length: 12 }, (_, i) => {
        const n = i + 1
        const outer = polar(70, n * 30)
        const inner = polar(showMinuteHelp && show24 ? 36 : 50, n * 30)
        const minutePos = polar(50, n * 30)
        return (
          <g key={n}>
            {showMinuteHelp && (
              <text
                x={minutePos.x}
                y={minutePos.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontFamily="Nunito, ui-rounded, system-ui, sans-serif"
                fontSize={9.5}
                fontWeight={700}
                fill="#3B82F6"
                pointerEvents="none"
              >
                {n === 12 ? '00' : n * 5}
              </text>
            )}
            <text
              x={outer.x}
              y={outer.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontFamily="Nunito, ui-rounded, system-ui, sans-serif"
              fontSize={19}
              fontWeight={800}
              fill="#92400E"
              pointerEvents="none"
            >
              {n}
            </text>
            {show24 && (
              <text
                x={inner.x}
                y={inner.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontFamily="Nunito, ui-rounded, system-ui, sans-serif"
                fontSize={showMinuteHelp ? 8.5 : 10}
                fontWeight={700}
                fill="#FB923C"
                pointerEvents="none"
              >
                {n === 12 ? 24 : n + 12}
              </text>
            )}
            {interactive && (
              <circle
                cx={outer.x}
                cy={outer.y}
                r={13}
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onPointerDown={() => tapHour(n)}
                role="button"
                aria-label={`Pôr ponteiro das horas no ${n}`}
              />
            )}
          </g>
        )
      })}

      {/* hour hand (red, thick, short) + its transparent hit-line, rotated together
          about the center so the hit target always covers the visible hand. */}
      <motion.g
        style={{ transformOrigin: '100px 100px', transformBox: 'view-box' }}
        animate={{ rotate: hourRot.current }}
        transition={handTransition}
      >
        <line
          x1={hourTail.x}
          y1={hourTail.y}
          x2={hourEnd.x}
          y2={hourEnd.y}
          stroke="#EF4444"
          strokeWidth={7}
          strokeLinecap="round"
        />
        {interactive && (
          <line
            x1={hourTail.x}
            y1={hourTail.y}
            x2={hourEnd.x}
            y2={hourEnd.y}
            stroke="transparent"
            strokeWidth={20}
            strokeLinecap="round"
            style={{ cursor: 'grab' }}
            onPointerDown={onPointerDown('hour')}
            aria-label="Ponteiro das horas"
          />
        )}
      </motion.g>

      {/* minute hand (blue, thinner, long) + its transparent hit-line. */}
      <motion.g
        style={{ transformOrigin: '100px 100px', transformBox: 'view-box' }}
        animate={{ rotate: minuteRot.current }}
        transition={handTransition}
      >
        <line
          x1={minuteTail.x}
          y1={minuteTail.y}
          x2={minuteEnd.x}
          y2={minuteEnd.y}
          stroke="#3B82F6"
          strokeWidth={5}
          strokeLinecap="round"
        />
        {interactive && (
          <line
            x1={minuteTail.x}
            y1={minuteTail.y}
            x2={minuteEnd.x}
            y2={minuteEnd.y}
            stroke="transparent"
            strokeWidth={20}
            strokeLinecap="round"
            style={{ cursor: 'grab' }}
            onPointerDown={onPointerDown('minute')}
            aria-label="Ponteiro dos minutos"
          />
        )}
      </motion.g>

      {/* optional seconds hand: a thin amber sweep that ticks each second.
          Purely visual — drawn as a plain line (no easing), non-interactive,
          and tucked under the center cap so the cap covers its pivot. */}
      {hasSeconds && (
        <line
          x1={secTail.x}
          y1={secTail.y}
          x2={secEnd.x}
          y2={secEnd.y}
          stroke="#D97706"
          strokeWidth={1.6}
          strokeLinecap="round"
          pointerEvents="none"
        />
      )}

      {/* center cap: orange disc, cream pupil, tiny white catch-light */}
      <circle cx={C} cy={C} r={9} fill="#F59E0B" />
      <circle cx={C} cy={C} r={5.5} fill="#FFFDF7" />
      <circle cx={C - 1.6} cy={C - 1.6} r={1.4} fill="#FFFFFF" opacity={0.9} />
    </svg>
  )
}
