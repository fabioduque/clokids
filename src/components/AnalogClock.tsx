import { angles } from '../lib/timeModel'

export interface AnalogClockProps {
  total: number // minutes from midnight
  size?: number // px
  show24?: boolean // render the inner 24h numbers
  showHandLegend?: boolean // reserved; legend lives in HandLegend
}

const VB = 200
const C = VB / 2

function polar(r: number, deg: number): { x: number; y: number } {
  const a = (deg * Math.PI) / 180
  return { x: C + r * Math.sin(a), y: C - r * Math.cos(a) }
}

export function AnalogClock({ total, size = 280, show24 = true }: AnalogClockProps) {
  const { hour, minute } = angles(total)

  // Hand tips (contract: hour shorter than minute) + small friendly tails behind pivot.
  const minuteEnd = polar(64, minute)
  const minuteTail = polar(14, minute + 180)
  const hourEnd = polar(44, hour)
  const hourTail = polar(12, hour + 180)

  return (
    <svg
      viewBox={`0 0 ${VB} ${VB}`}
      width={size}
      height={size}
      role="img"
      aria-label="Relógio analógico"
      className="select-none"
    >
      <defs>
        {/* soft, warm drop shadow under the whole face */}
        <filter id="rl-face-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#92400E" floodOpacity="0.18" />
        </filter>
        {/* gentle cream-to-warm radial so the face has depth, not a flat fill */}
        <radialGradient id="rl-face-fill" cx="50%" cy="42%" r="62%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="68%" stopColor="#FFFDF7" />
          <stop offset="100%" stopColor="#FEF3E2" />
        </radialGradient>
      </defs>

      {/* face: cream fill + orange ring */}
      <g filter="url(#rl-face-shadow)">
        <circle cx={C} cy={C} r={94} fill="url(#rl-face-fill)" stroke="#F59E0B" strokeWidth={7} />
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
              >
                {n === 12 ? 24 : n + 12}
              </text>
            )}
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

      {/* center cap: orange disc, cream pupil, tiny white catch-light */}
      <circle cx={C} cy={C} r={9} fill="#F59E0B" />
      <circle cx={C} cy={C} r={5.5} fill="#FFFDF7" />
      <circle cx={C - 1.6} cy={C - 1.6} r={1.4} fill="#FFFFFF" opacity={0.9} />
    </svg>
  )
}
