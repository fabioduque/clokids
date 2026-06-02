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
    <div className="relative flex flex-col items-center gap-2 py-2 sm:gap-6 sm:py-6">
      <div className="absolute right-1 top-1 z-10">
        <SnapToggle snap={settings.snap} onChange={onSnapChange} />
      </div>
      <div className="aspect-square" style={{ width: 'min(52vw, 26vh)' }}>
        <AnalogClock total={total} step={settings.snap} onChange={onChange} size={280} />
      </div>
      {settings.showHandLegend && <HandLegend />}
      <DigitalClock total={total} showWords={settings.showWords} />
      <DayNightToggle pm={pm} onChange={setPm} />
      <ListenButton text={spoken} enabled={settings.voice} />
    </div>
  )
}
