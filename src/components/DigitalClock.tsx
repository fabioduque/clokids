import { format24, format12, split, toWords } from '../lib/timeModel'

export interface DigitalClockProps {
  total: number
  showWords?: boolean
}

export function DigitalClock({ total, showWords = true }: DigitalClockProps) {
  const { hour24, minute } = split(total)
  return (
    <div className="flex flex-col items-center gap-0.5 sm:gap-1">
      <div className="text-3xl font-extrabold tracking-tight text-ink tabular-nums sm:text-6xl">
        {format24(total)}
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
