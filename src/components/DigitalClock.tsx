import { format24, format12, split, toWords } from '../lib/timeModel'

export interface DigitalClockProps {
  total: number
  showWords?: boolean
}

export function DigitalClock({ total, showWords = true }: DigitalClockProps) {
  const { hour24, minute } = split(total)
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="text-6xl font-extrabold tracking-tight text-ink tabular-nums">
        {format24(total)}
      </div>
      <div className="text-lg font-bold text-ink24">{format12(total)}</div>
      {showWords && (
        <div className="text-base font-semibold text-ink/70">
          {toWords(hour24, minute)}
        </div>
      )}
    </div>
  )
}
