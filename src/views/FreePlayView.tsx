import { AnalogClock } from '../components/AnalogClock'
import { DigitalClock } from '../components/DigitalClock'
import { DayNightToggle } from '../components/DayNightToggle'
import { HandLegend } from '../components/HandLegend'
import { ListenButton } from '../components/ListenButton'
import { SnapToggle } from '../components/SnapToggle'
import { isPM, split, toTotal, toSpokenWords, hour12Of } from '../lib/timeModel'
import type { Settings } from '../lib/profileStore'

export interface FreePlayViewProps {
  total: number
  onChange: (total: number) => void
  settings: Settings
  onSnapChange: (snap: Settings['snap']) => void
  seconds: number | null
  onNow: () => void
}

export function FreePlayView({ total, onChange, settings, onSnapChange, seconds, onNow }: FreePlayViewProps) {
  const { hour24, minute } = split(total)
  const pm = isPM(hour24)
  const spoken = toSpokenWords(hour24, minute)

  function setPm(nextPm: boolean) {
    onChange(toTotal(hour12Of(hour24), minute, nextPm))
  }

  return (
    <div className="flex h-full min-h-0 flex-col items-center gap-2 py-2 sm:gap-4 sm:py-4 lg:justify-center lg:gap-4">
      {/* The clock owns all leftover vertical space below lg. The SVG keeps a
          square aspect (viewBox + xMidYMid) and is capped at `size`, so it
          grows to fill a tall phone, caps on desktop, and shrinks only when the
          viewport is genuinely short. On lg the column centres and this region
          takes a fixed comfortable size, so the whole stack reads as one
          compact, vertically-centred cluster instead of a spread-out column. */}
      <div className="relative flex w-full max-w-md min-h-0 flex-1 items-center justify-center lg:h-[360px] lg:w-[360px] lg:flex-none">
        {/* SnapToggle is anchored to THIS centred clock container so it sits
            beside the clock on every size, not in the far viewport corner. */}
        <div className="absolute right-1 top-1 z-10 lg:right-0 lg:top-0">
          <SnapToggle snap={settings.snap} onChange={onSnapChange} />
        </div>
        <AnalogClock total={total} step={settings.snap} onChange={onChange} size={420} seconds={seconds} show24={settings.show24h} />
      </div>
      {/* Compact control stack: takes its natural height so the clock above
          flexes to fill the rest. Kept tight so it still fits at 360×480. */}
      <div className="flex shrink-0 flex-col items-center gap-1.5 sm:gap-3">
        {settings.showHandLegend && <HandLegend />}
        <DigitalClock total={total} showWords={settings.showWords} seconds={seconds} />
        <div className="flex flex-wrap items-center justify-center gap-2">
          <DayNightToggle pm={pm} onChange={setPm} />
          <button
            type="button"
            onClick={onNow}
            aria-label="Acertar o relógio pela hora atual"
            className="flex items-center gap-1.5 rounded-full border-2 border-amber-300 bg-amber-50 px-4 py-1.5 text-base font-extrabold text-amber-700 shadow-md transition-transform active:scale-95 sm:py-2 sm:text-lg"
          >
            🕒 Agora
          </button>
        </div>
        <ListenButton text={spoken} enabled={settings.voice} />
      </div>
    </div>
  )
}
