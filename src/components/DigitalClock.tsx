import { format24, format12, split, toWords, hour12Of } from '../lib/timeModel'
import { format12En, toWordsEn } from '../lib/timeWordsEn'
import { useLang } from '../lib/i18n'

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
  const lang = useLang()
  const { hour24, minute } = split(total)
  const big = show24h
    ? typeof seconds === 'number'
      ? `${format24(total)}:${pad2(seconds % 60)}`
      : format24(total)
    : `${hour12Of(hour24)}:${pad2(minute)}`
  const secondary = lang === 'pt' ? format12(total) : format12En(total)
  const words = lang === 'pt' ? toWords(hour24, minute) : toWordsEn(hour24, minute)
  return (
    <div className="flex flex-col items-center gap-0.5 sm:gap-1">
      <div className="font-display text-5xl font-extrabold leading-none tracking-tight text-ink tabular-nums sm:text-7xl lg:text-[clamp(2.25rem,8.5vh,4.5rem)]">
        {big}
      </div>
      {show24h && (
        <div className="font-display text-base font-bold text-ink24 sm:text-lg">{secondary}</div>
      )}
      {showWords && (
        <div className="text-sm font-semibold text-ink/70 first-letter:uppercase sm:text-base">
          {words}
        </div>
      )}
    </div>
  )
}
