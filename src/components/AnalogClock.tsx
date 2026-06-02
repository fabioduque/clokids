import { useRef, useId } from 'react'
import { angles, split, mod1440, snap } from '../lib/timeModel'
import { pointerToDegrees } from './clockGeom'

export interface AnalogClockProps {
  total: number // minutes from midnight
  size?: number // px
  show24?: boolean // render the inner 24h numbers
  showHandLegend?: boolean // reserved; legend lives in HandLegend
  step?: number // snap step (minutes) for the minute hand; if omitted -> not interactive
  onChange?: (total: number) => void
}

const VB = 200
const C = VB / 2

function polar(r: number, deg: number): { x: number; y: number } {
  const a = (deg * Math.PI) / 180
  return { x: C + r * Math.sin(a), y: C - r * Math.cos(a) }
}

export function AnalogClock({ total, size = 280, show24 = true, step, onChange }: AnalogClockProps) {
  const { hour, minute } = angles(total)

  // Hand tips (contract: hour shorter than minute) + small friendly tails behind pivot.
  const minuteEnd = polar(64, minute)
  const minuteTail = polar(14, minute + 180)
  const hourEnd = polar(44, hour)
  const hourTail = polar(12, hour + 180)

  const svgRef = useRef<SVGSVGElement | null>(null)
  const dragging = useRef<'hour' | 'minute' | null>(null)
  const interactive = typeof step === 'number' && !!onChange

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
    const cur = split(total)
    if (dragging.current === 'minute') {
      const m = Math.round(deg / 6) % 60
      const snapped = snap(cur.hour24 * 60 + m, step!)
      const newMinute = split(snapped).minute
      onChange!(mod1440(cur.hour24 * 60 + newMinute))
    } else if (dragging.current === 'hour') {
      const h = Math.round(deg / 30) % 12
      onChange!(mod1440(h * 60 + cur.minute))
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
      width={size}
      height={size}
      role="img"
      aria-label="Relógio analógico"
      className="select-none touch-none"
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

      {/* hour numbers (outer) + 24h numbers (inner) */}
      {Array.from({ length: 12 }, (_, i) => {
        const n = i + 1
        const outer = polar(70, n * 30)
        const inner = polar(50, n * 30)
        return (
          <g key={n}>
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
                fontSize={10}
                fontWeight={700}
                fill="#FB923C"
                pointerEvents="none"
              >
                {n === 12 ? 24 : n + 12}
              </text>
            )}
            {interactive && (() => {
              const hit = polar(70, n * 30)
              return (
                <circle
                  cx={hit.x}
                  cy={hit.y}
                  r={13}
                  fill="transparent"
                  style={{ cursor: 'pointer' }}
                  onPointerDown={() => tapHour(n)}
                  role="button"
                  aria-label={`Pôr ponteiro das horas no ${n}`}
                />
              )
            })()}
          </g>
        )
      })}

      {/* hands: hour = red & thick & short, minute = blue & thinner & long */}
      <line
        x1={hourTail.x}
        y1={hourTail.y}
        x2={hourEnd.x}
        y2={hourEnd.y}
        stroke="#EF4444"
        strokeWidth={7}
        strokeLinecap="round"
      />
      <line
        x1={minuteTail.x}
        y1={minuteTail.y}
        x2={minuteEnd.x}
        y2={minuteEnd.y}
        stroke="#3B82F6"
        strokeWidth={5}
        strokeLinecap="round"
      />

      {/* wider transparent hit lines for comfortable touch dragging */}
      {interactive && (
        <>
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
        </>
      )}

      {/* center cap: orange disc, cream pupil, tiny white catch-light */}
      <circle cx={C} cy={C} r={9} fill="#F59E0B" />
      <circle cx={C} cy={C} r={5.5} fill="#FFFDF7" />
      <circle cx={C - 1.6} cy={C - 1.6} r={1.4} fill="#FFFFFF" opacity={0.9} />
    </svg>
  )
}
