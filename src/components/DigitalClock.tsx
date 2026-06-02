import { format24, format12, split, toWords } from '../lib/timeModel'

export interface DigitalClockProps {
  total: number
  showWords?: boolean
  seconds?: number | null // when a number, append :SS to the big 24h time
}

export function DigitalClock({ total, showWords = true, seconds }: DigitalClockProps) {
  const { hour24, minute } = split(total)
  const big =
    typeof seconds === 'number'
      ? `${format24(total)}:${String(seconds % 60).padStart(2, '0')}`
      : format24(total)
  return (
    <div className="flex flex-col items-center gap-0.5 sm:gap-1">
      <div className="text-3xl font-extrabold tracking-tight text-ink tabular-nums sm:text-6xl">
        {big}
      </div>
      <div className="text-sm font-bold text-ink24 sm:text-lg">{format12(total)}</div>
      {showWords && (
        <div className="text-sm font-semibold text-ink/70 sm:text-base">
          {toWords(hour24, minute)}
        </div>
      )}
    </div>
  )
}
