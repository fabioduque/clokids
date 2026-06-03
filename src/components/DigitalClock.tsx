import { format24, format12, split, toWords, hour12Of } from '../lib/timeModel'

export interface DigitalClockProps {
  total: number
  showWords?: boolean
  seconds?: number | null // when a number, append :SS to the big 24h time
  show24h?: boolean
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export function DigitalClock({ total, showWords = true, seconds, show24h = true }: DigitalClockProps) {
  const { hour24, minute } = split(total)
  const big = show24h
    ? typeof seconds === 'number'
      ? `${format24(total)}:${pad2(seconds % 60)}`
      : format24(total)
    : `${hour12Of(hour24)}:${pad2(minute)}`
  return (
    <div className="flex flex-col items-center gap-0.5 sm:gap-1">
      <div className="text-3xl font-extrabold tracking-tight text-ink tabular-nums sm:text-6xl">
        {big}
      </div>
      {show24h && (
        <div className="text-sm font-bold text-ink24 sm:text-lg">{format12(total)}</div>
      )}
      {showWords && (
        <div className="text-sm font-semibold text-ink/70 sm:text-base">
          {toWords(hour24, minute)}
        </div>
      )}
    </div>
  )
}
