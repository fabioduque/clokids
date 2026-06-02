import { AnalogClock } from '../components/AnalogClock'
import { DigitalClock } from '../components/DigitalClock'
import { DayNightToggle } from '../components/DayNightToggle'
import { HandLegend } from '../components/HandLegend'
import { ListenButton } from '../components/ListenButton'
import { isPM, split, toTotal, toWords, periodWord, hour12Of } from '../lib/timeModel'
import type { Settings } from '../lib/profileStore'

export interface FreePlayViewProps {
  total: number
  onChange: (total: number) => void
  settings: Settings
}

export function FreePlayView({ total, onChange, settings }: FreePlayViewProps) {
  const { hour24, minute } = split(total)
  const pm = isPM(hour24)
  const spoken = `${toWords(hour24, minute)} ${periodWord(hour24)}`

  function setPm(nextPm: boolean) {
    onChange(toTotal(hour12Of(hour24), minute, nextPm))
  }

  return (
    <div className="flex flex-col items-center gap-6 py-6">
      <AnalogClock total={total} step={settings.snap} onChange={onChange} />
      {settings.showHandLegend && <HandLegend />}
      <DigitalClock total={total} showWords={settings.showWords} />
      <DayNightToggle pm={pm} onChange={setPm} />
      <ListenButton text={spoken} enabled={settings.voice} />
    </div>
  )
}
