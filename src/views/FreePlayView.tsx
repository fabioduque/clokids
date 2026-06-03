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
  const spoken = toSpokenWords(hour24, minute, settings.show24h)

  function setPm(nextPm: boolean) {
    onChange(toTotal(hour12Of(hour24), minute, nextPm))
  }

  const agoraButton = (
    <button
      type="button"
      onClick={onNow}
      aria-label="Acertar o relógio pela hora atual"
      className="flex items-center gap-1.5 rounded-full border-2 border-amber-300 bg-amber-50 px-4 py-1.5 text-base font-extrabold text-amber-700 shadow-md transition-transform active:scale-95 sm:py-2 sm:text-lg"
    >
      🕒 Agora
    </button>
  )

  return (
    <div className="flex h-full min-h-0 flex-col items-center gap-2 py-2 sm:gap-4 sm:py-4 lg:flex-row lg:items-center lg:justify-center lg:gap-10 lg:py-4">
      {/* The clock owns all leftover vertical space below lg. The SVG keeps a
          square aspect (viewBox + xMidYMid) and is capped at `size`, so it
          grows to fill a tall phone, caps on desktop, and shrinks only when the
          viewport is genuinely short. On lg it becomes the LARGE left column of
          a two-column composition, sized from the viewport so it fills the
          width comfortably instead of leaving a narrow centred strip. */}
      <div className="relative flex w-full max-w-md min-h-0 flex-1 items-center justify-center lg:h-[min(46vh,30rem)] lg:w-[min(46vh,30rem)] lg:max-w-none lg:flex-none">
        {/* Corner snap pill: only below lg, anchored to the clock so it sits
            beside it on phones/tablets. On lg the toggle lives in the panel. */}
        <div className="absolute right-1 top-1 z-10 lg:hidden">
          <SnapToggle snap={settings.snap} onChange={onSnapChange} />
        </div>
        <AnalogClock total={total} step={settings.snap} onChange={onChange} size={560} seconds={seconds} show24={settings.show24h} />
      </div>

      {/* Controls. Below lg: a compact stack that takes its natural height so
          the clock above flexes to fill the rest (kept tight for 360×480).
          On lg: a soft rounded panel — the right column of the composition —
          with the readout, legend, a properly-spaced snap control, and the
          action buttons grouped with comfortable hierarchy. */}
      <div className="flex shrink-0 flex-col items-center gap-1.5 sm:gap-3 lg:w-[22rem] lg:items-stretch lg:gap-6 lg:rounded-3xl lg:border-2 lg:border-amber-200/70 lg:bg-white/70 lg:p-8 lg:shadow-lg lg:backdrop-blur-sm">
        <div className="flex flex-col items-center gap-1.5 sm:gap-3 lg:gap-4">
          {settings.showHandLegend && <HandLegend />}
          <DigitalClock total={total} showWords={settings.showWords} seconds={seconds} show24h={settings.show24h} />
        </div>

        {/* Snap control: labeled group, only on lg (replaces the corner pill). */}
        <div className="hidden lg:flex lg:flex-col lg:items-center lg:gap-2 lg:border-t lg:border-amber-200/70 lg:pt-6">
          <span className="text-sm font-bold uppercase tracking-wide text-ink/60">Saltos dos minutos</span>
          <SnapToggleRow snap={settings.snap} onChange={onSnapChange} />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 lg:flex-col lg:items-stretch lg:gap-3 lg:border-t lg:border-amber-200/70 lg:pt-6">
          {settings.show24h && <DayNightToggle pm={pm} onChange={setPm} />}
          <div className="flex items-center justify-center lg:justify-stretch lg:[&>button]:w-full">{agoraButton}</div>
          <div className="hidden lg:flex lg:justify-stretch lg:[&>button]:w-full">
            <ListenButton text={spoken} enabled={settings.voice} />
          </div>
        </div>

        {/* Listen button below lg only (on lg it lives in the action group). */}
        <div className="lg:hidden">
          <ListenButton text={spoken} enabled={settings.voice} />
        </div>
      </div>
    </div>
  )
}

/** Horizontal 15 · 5 · 1 snap control for the desktop panel: same options as
 * the corner SnapToggle but laid out as a roomy labeled row, not a cramped pill. */
function SnapToggleRow({ snap, onChange }: { snap: Settings['snap']; onChange: (snap: Settings['snap']) => void }) {
  const OPTS: Array<Settings['snap']> = [15, 5, 1]
  return (
    <div
      className="flex items-center gap-1 rounded-full border-2 border-ring/50 bg-white p-1 shadow-sm"
      role="group"
      aria-label="Precisão dos minutos"
    >
      {OPTS.map((s, i) => (
        <div key={s} className="flex items-center">
          {i > 0 && <span className="px-0.5 text-ink/25" aria-hidden>·</span>}
          <button
            type="button"
            onClick={() => onChange(s)}
            aria-pressed={snap === s}
            aria-label={`Saltos de ${s} minuto${s === 1 ? '' : 's'}`}
            className={`min-w-[3rem] rounded-full px-4 py-2 text-base font-extrabold leading-none transition-colors ${
              snap === s ? 'bg-ring text-white shadow' : 'text-ink hover:bg-ring/10'
            }`}
          >
            {s}
          </button>
        </div>
      ))}
    </div>
  )
}
