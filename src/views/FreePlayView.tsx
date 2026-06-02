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
}

export function FreePlayView({ total, onChange, settings, onSnapChange }: FreePlayViewProps) {
  const { hour24, minute } = split(total)
  const pm = isPM(hour24)
  const spoken = toSpokenWords(hour24, minute)

  function setPm(nextPm: boolean) {
    onChange(toTotal(hour12Of(hour24), minute, nextPm))
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col items-center gap-2 py-2 sm:gap-4 sm:py-4">
      <div className="absolute right-1 top-1 z-10">
        <SnapToggle snap={settings.snap} onChange={onSnapChange} />
      </div>
      {/* The clock owns all leftover vertical space. The SVG keeps a square
          aspect (viewBox + xMidYMid) and is capped at `size`, so it grows to
          fill a tall phone, caps on desktop, and shrinks only when the
          viewport is genuinely short. */}
      <div className="flex w-full min-h-0 flex-1 items-center justify-center">
        <AnalogClock total={total} step={settings.snap} onChange={onChange} size={420} />
      </div>
      {/* Compact control stack: takes its natural height so the clock above
          flexes to fill the rest. Kept tight so it still fits at 360×480. */}
      <div className="flex shrink-0 flex-col items-center gap-1.5 sm:gap-3">
        {settings.showHandLegend && <HandLegend />}
        <DigitalClock total={total} showWords={settings.showWords} />
        <DayNightToggle pm={pm} onChange={setPm} />
        <ListenButton text={spoken} enabled={settings.voice} />
      </div>
    </div>
  )
}
